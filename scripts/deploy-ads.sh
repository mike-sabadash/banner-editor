#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/banner-editor"
BRANCH="codex/tt-knowledge-base"
NGINX_SRC="$APP_DIR/deploy/nginx/ads.rechord.online.conf"
NGINX_DST="/etc/nginx/sites-available/ads.rechord.online"
NGINX_LINK="/etc/nginx/sites-enabled/ads.rechord.online"

printf '\n== Banner Campaign ads deploy ==\n'
cd "$APP_DIR"

git fetch origin "$BRANCH"
git switch "$BRANCH" 2>/dev/null || git switch -c "$BRANCH" --track "origin/$BRANCH"
git pull --ff-only origin "$BRANCH"

npm ci
npm test
npm run build
node --check server/openrouterGateway.mjs
node --check server/ttKnowledgeService.mjs

if [ ! -f .env ]; then
  echo "ERROR: $APP_DIR/.env is missing; refusing to deploy without existing OpenRouter configuration." >&2
  exit 1
fi
if ! grep -q '^OPENROUTER_API_KEY=' .env; then
  echo "ERROR: OPENROUTER_API_KEY is not configured in $APP_DIR/.env" >&2
  exit 1
fi

cp "$NGINX_SRC" "$NGINX_DST"
ln -sfn "$NGINX_DST" "$NGINX_LINK"
nginx -t
systemctl reload nginx

if pm2 describe banner-openrouter-gateway >/dev/null 2>&1; then
  set -a
  . ./.env
  set +a
  pm2 restart banner-openrouter-gateway --update-env
else
  set -a
  . ./.env
  set +a
  pm2 start server/openrouterGateway.mjs --name banner-openrouter-gateway
  pm2 save
fi

# Backward compatibility: the current local plugin build still calls banners.rechord.online.
# Add only the TT routes to the existing banners vhost when it exists, without replacing the app proxy.
BANNERS_CONF=""
for candidate in /etc/nginx/sites-available/banners.rechord.online /etc/nginx/conf.d/banners.rechord.online.conf; do
  if [ -f "$candidate" ]; then BANNERS_CONF="$candidate"; break; fi
done
if [ -n "$BANNERS_CONF" ] && ! grep -q 'location /api/tt/' "$BANNERS_CONF"; then
  cp "$BANNERS_CONF" "$BANNERS_CONF.bak.$(date +%Y%m%d%H%M%S)"
  python3 - "$BANNERS_CONF" <<'PY'
import sys
p=sys.argv[1]
s=open(p,encoding='utf-8').read()
needle='server {'
pos=s.find(needle)
if pos < 0:
    raise SystemExit('No server block found in '+p)
insert='''\n    # Banner Campaign TT Knowledge + AI\n    location /api/tt/ {\n        proxy_pass http://127.0.0.1:8791;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_read_timeout 120s;\n        client_max_body_size 30m;\n    }\n'''
# insert immediately after the opening server brace
idx=pos+len(needle)
s=s[:idx]+insert+s[idx:]
open(p,'w',encoding='utf-8').write(s)
PY
  nginx -t
  systemctl reload nginx
fi

# Obtain/renew SSL for the new public hostname if certbot is installed.
if command -v certbot >/dev/null 2>&1; then
  certbot --nginx -d ads.rechord.online --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
fi

pm2 save >/dev/null 2>&1 || true

printf '\n== Health checks ==\n'
curl -fsS http://127.0.0.1:8791/healthz
printf '\n'
curl -fsS --max-time 20 https://ads.rechord.online/healthz
printf '\n'
curl -fsS --max-time 20 https://ads.rechord.online/api/tt/kb | python3 -c 'import json,sys; d=json.load(sys.stdin); print("TT Knowledge sources:", len(d.get("items", d if isinstance(d,list) else [])))'
printf '\nDEPLOY_OK branch=%s commit=%s\n' "$BRANCH" "$(git rev-parse --short HEAD)"

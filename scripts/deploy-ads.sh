#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/banner-editor"
BRANCH="${BANNERMATIC_DEPLOY_BRANCH:-codex/mvp2-figma-cloud-runtime}"
NGINX_SRC="$APP_DIR/deploy/nginx/ads.rechord.online.conf"
NGINX_DST="/etc/nginx/sites-available/ads.rechord.online"
NGINX_LINK="/etc/nginx/sites-enabled/ads.rechord.online"
DEPLOY_KEY="/root/.ssh/banner_editor_deploy"
GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -p 443 -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
export GIT_SSH_COMMAND

printf '\n== Bannermatic ads deploy ==\n'
cd "$APP_DIR"

if [ ! -f "$DEPLOY_KEY" ]; then echo "ERROR: deploy key not found at $DEPLOY_KEY" >&2; exit 1; fi
chmod 600 "$DEPLOY_KEY"
git fetch origin "$BRANCH"
git switch "$BRANCH" 2>/dev/null || git switch -c "$BRANCH" --track "origin/$BRANCH"
git pull --ff-only origin "$BRANCH"

npm ci
npm test
npm run build
node --check server/openrouterGateway.mjs
node --check server/ttKnowledgeService.mjs

if [ ! -f .env ]; then echo "ERROR: $APP_DIR/.env is missing" >&2; exit 1; fi
if ! grep -q '^OPENROUTER_API_KEY=' .env; then echo "ERROR: OPENROUTER_API_KEY is not configured" >&2; exit 1; fi

cp "$NGINX_SRC" "$NGINX_DST"
ln -sfn "$NGINX_DST" "$NGINX_LINK"
nginx -t
systemctl reload nginx

# Do not source .env: values may legally contain spaces. PM2 keeps the existing
# server environment; secrets remain server-side.
if pm2 describe banner-openrouter-gateway >/dev/null 2>&1; then
  pm2 restart banner-openrouter-gateway
else
  pm2 start server/openrouterGateway.mjs --name banner-openrouter-gateway
fi
pm2 save >/dev/null 2>&1 || true

if command -v certbot >/dev/null 2>&1; then
  certbot --nginx -d ads.rechord.online --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
fi

printf '\n== Runtime checks ==\n'
curl -fsS http://127.0.0.1:8791/healthz
printf '\n'
curl -fsS --max-time 20 https://ads.rechord.online/healthz
printf '\n'
curl -fsS --max-time 20 https://ads.rechord.online/ | grep -q '<div id="root"></div>'
curl -fsS --max-time 20 https://ads.rechord.online/api/tt/kb | python3 -c 'import json,sys; d=json.load(sys.stdin); print("TT Knowledge sources:", len(d.get("items", d if isinstance(d,list) else [])))'
printf '\nDEPLOY_OK branch=%s commit=%s\n' "$BRANCH" "$(git rev-parse --short HEAD)"

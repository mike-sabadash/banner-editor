#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/banner-editor"
TARGET_HOST="banners.rechord.online"
UPSTREAM="http://127.0.0.1:8791"

cd "$APP_DIR"

CONF=""
for candidate in \
  /etc/nginx/sites-available/banners.rechord.online \
  /etc/nginx/conf.d/banners.rechord.online.conf \
  /etc/nginx/sites-available/banner-editor \
  /etc/nginx/sites-enabled/banner-editor; do
  if [ -f "$candidate" ] && grep -q 'server_name[[:space:]].*banners\.rechord\.online' "$candidate"; then
    CONF="$(readlink -f "$candidate")"
    break
  fi
done

if [ -z "$CONF" ]; then
  echo "ERROR: could not find nginx config for $TARGET_HOST" >&2
  exit 1
fi

echo "Using nginx config: $CONF"

if grep -q 'location /api/tt/' "$CONF"; then
  echo "TT route already exists in $CONF"
else
  BACKUP="$CONF.bak.$(date +%Y%m%d%H%M%S)"
  cp "$CONF" "$BACKUP"
  echo "Backup: $BACKUP"

  python3 - "$CONF" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()

host = 'banners.rechord.online'
pos = 0
found = None
while True:
    m = re.search(r'server\s*\{', s[pos:])
    if not m:
        break
    start = pos + m.start()
    depth = 0
    end = None
    for i in range(start, len(s)):
        if s[i] == '{':
            depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0:
                end = i
                break
    if end is None:
        break
    block = s[start:end + 1]
    if re.search(r'server_name\s+[^;]*\b' + re.escape(host) + r'\b[^;]*;', block):
        # Prefer the serving HTTPS block, not Certbot's port-80 return-only block.
        if 'listen 443' in block or 'ssl' in block or 'location /' in block:
            found = (start, end, block)
            break
        if found is None:
            found = (start, end, block)
    pos = end + 1

if not found:
    raise SystemExit('No server block for banners.rechord.online found')

start, end, block = found
if 'location /api/tt/' in block:
    raise SystemExit(0)

insert = '''\n    # Banner Campaign TT Knowledge + AI\n    location /api/tt/ {\n        proxy_pass http://127.0.0.1:8791;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_read_timeout 120s;\n        client_max_body_size 30m;\n    }\n'''

new_block = block[:-1] + insert + '}\n'
s = s[:start] + new_block + s[end + 1:]
open(p, 'w', encoding='utf-8').write(s)
PY
fi

nginx -t
systemctl reload nginx

printf '\n== gateway health ==\n'
curl -fsS http://127.0.0.1:8791/healthz
printf '\n\n== banners TT KB ==\n'
curl -fsS "https://$TARGET_HOST/api/tt/kb" | python3 -c 'import json,sys; d=json.load(sys.stdin); print("TT Knowledge sources:", len(d.get("items", [])))'
printf '\nFIX_OK\n'

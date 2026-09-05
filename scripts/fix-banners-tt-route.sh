#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/banner-editor"
TARGET_HOST="banners.rechord.online"
UPSTREAM="http://127.0.0.1:8791"

cd "$APP_DIR"

CONF=""
for candidate in \
  /etc/nginx/sites-available/banners.rechord.online \
  /etc/nginx/conf.d/banners.rechord.online.conf; do
  if [ -f "$candidate" ]; then
    CONF="$candidate"
    break
  fi
done

if [ -z "$CONF" ]; then
  echo "ERROR: could not find nginx config for $TARGET_HOST" >&2
  exit 1
fi

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

# Find the server block that explicitly owns banners.rechord.online.
match = re.search(r'server\s*\{', s)
if not match:
    raise SystemExit('No server block found')

start = match.start()
depth = 0
end = None
for i in range(match.start(), len(s)):
    if s[i] == '{':
        depth += 1
    elif s[i] == '}':
        depth -= 1
        if depth == 0:
            end = i
            break
if end is None:
    raise SystemExit('Unclosed server block')

block = s[start:end+1]
if 'server_name banners.rechord.online' not in block:
    # Fallback: scan all server blocks and pick the one containing the hostname.
    pos = 0
    found = None
    while True:
        m = re.search(r'server\s*\{', s[pos:])
        if not m:
            break
        bs = pos + m.start()
        depth = 0
        be = None
        for i in range(bs, len(s)):
            if s[i] == '{': depth += 1
            elif s[i] == '}':
                depth -= 1
                if depth == 0:
                    be = i
                    break
        if be is None:
            break
        b = s[bs:be+1]
        if 'server_name banners.rechord.online' in b:
            found = (bs, be, b)
            break
        pos = be + 1
    if not found:
        raise SystemExit('No server block for banners.rechord.online found')
    start, end, block = found

if 'location /api/tt/' in block:
    raise SystemExit(0)

insert = '''\n    # Banner Campaign TT Knowledge + AI\n    location /api/tt/ {\n        proxy_pass http://127.0.0.1:8791;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_read_timeout 120s;\n        client_max_body_size 30m;\n    }\n'''

new_block = block[:-1] + insert + '}\n'
s = s[:start] + new_block + s[end+1:]
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

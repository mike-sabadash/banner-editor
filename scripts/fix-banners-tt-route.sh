#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/banner-editor"
TARGET_HOST="banners.rechord.online"
UPSTREAM="http://127.0.0.1:8791"

cd "$APP_DIR"

CONF=""
for candidate in \
  /etc/nginx/sites-enabled/banner-editor \
  /etc/nginx/sites-available/banner-editor \
  /etc/nginx/sites-available/banners.rechord.online \
  /etc/nginx/conf.d/banners.rechord.online.conf; do
  if [ -e "$candidate" ]; then
    CONF="$(readlink -f "$candidate")"
    break
  fi
done

if [ -z "$CONF" ] || [ ! -f "$CONF" ]; then
  echo "ERROR: could not find nginx config for $TARGET_HOST" >&2
  exit 1
fi

echo "Using nginx config: $CONF"

if python3 - "$CONF" <<'PY'
import re, sys
p=sys.argv[1]
s=open(p,encoding='utf-8').read()

def blocks(text):
    pos=0
    while True:
        m=re.search(r'server\s*\{', text[pos:])
        if not m:
            return
        start=pos+m.start()
        depth=0
        end=None
        for i in range(start,len(text)):
            if text[i]=='{': depth+=1
            elif text[i]=='}':
                depth-=1
                if depth==0:
                    end=i
                    break
        if end is None:
            return
        yield start,end,text[start:end+1]
        pos=end+1

for _,_,b in blocks(s):
    if 'server_name banners.rechord.online' in b and re.search(r'listen\s+(?:\[[^\]]+\]:)?443\b', b) and 'location /api/tt/' in b:
        raise SystemExit(0)
raise SystemExit(1)
PY
then
  echo "TT route already exists in HTTPS vhost"
else
  BACKUP="$CONF.bak.$(date +%Y%m%d%H%M%S)"
  cp "$CONF" "$BACKUP"
  echo "Backup: $BACKUP"

  python3 - "$CONF" <<'PY'
import re, sys
p=sys.argv[1]
s=open(p,encoding='utf-8').read()

def blocks(text):
    pos=0
    while True:
        m=re.search(r'server\s*\{', text[pos:])
        if not m:
            return
        start=pos+m.start()
        depth=0
        end=None
        for i in range(start,len(text)):
            if text[i]=='{': depth+=1
            elif text[i]=='}':
                depth-=1
                if depth==0:
                    end=i
                    break
        if end is None:
            raise SystemExit('Unclosed server block')
        yield start,end,text[start:end+1]
        pos=end+1

target=None
for start,end,b in blocks(s):
    if 'server_name banners.rechord.online' not in b:
        continue
    if re.search(r'listen\s+(?:\[[^\]]+\]:)?443\b', b) or 'ssl_certificate' in b:
        target=(start,end,b)
        break

if not target:
    raise SystemExit('No HTTPS server block for banners.rechord.online found')

start,end,block=target
if 'location /api/tt/' not in block:
    insert='''\n    # Banner Campaign TT Knowledge + AI\n    location /api/tt/ {\n        proxy_pass http://127.0.0.1:8791;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_read_timeout 120s;\n        client_max_body_size 30m;\n    }\n'''
    new_block=block[:-1]+insert+'}\n'
    s=s[:start]+new_block+s[end+1:]
    open(p,'w',encoding='utf-8').write(s)
PY
fi

nginx -t
systemctl reload nginx

printf '\n== gateway health ==\n'
curl -fsS http://127.0.0.1:8791/healthz
printf '\n\n== banners TT KB ==\n'
TMP="$(mktemp)"
CODE="$(curl -sS -o "$TMP" -w '%{http_code}' "https://$TARGET_HOST/api/tt/kb")"
echo "HTTP $CODE"
if [ "$CODE" != "200" ]; then
  echo "Unexpected response:" >&2
  cat "$TMP" >&2
  rm -f "$TMP"
  exit 1
fi
python3 - "$TMP" <<'PY'
import json,sys
p=sys.argv[1]
with open(p,encoding='utf-8') as f:
    d=json.load(f)
print('TT Knowledge sources:', len(d.get('items', [])))
PY
rm -f "$TMP"
printf '\nFIX_OK\n'

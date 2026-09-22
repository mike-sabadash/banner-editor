#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/banner-editor"
BRANCH="${BANNERMATIC_DEPLOY_BRANCH:-codex/mvp2-figma-cloud-runtime}"
NGINX_SRC="$APP_DIR/deploy/nginx/ads.rechord.online.conf"
NGINX_DST="/etc/nginx/conf.d/studio.bannermatic.online.conf"
LEGACY_NGINX_LINK="/etc/nginx/sites-enabled/ads.rechord.online"
LEGACY_NGINX_CONF="/etc/nginx/conf.d/ads.rechord.online.conf"
MIGRATION_NGINX_LINK="/etc/nginx/sites-enabled/bannermatic-new-domains"
DEPLOY_KEY="/root/.ssh/banner_editor_deploy"
GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -p 443 -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
export GIT_SSH_COMMAND

printf '\n== Bannermatic Studio deploy ==\n'
cd "$APP_DIR"

if [ ! -f "$DEPLOY_KEY" ]; then echo "ERROR: deploy key not found at $DEPLOY_KEY" >&2; exit 1; fi
chmod 600 "$DEPLOY_KEY"
git fetch origin "$BRANCH"
git switch "$BRANCH" 2>/dev/null || git switch -c "$BRANCH" --track "origin/$BRANCH"
git pull --ff-only origin "$BRANCH"
git reset --hard "origin/$BRANCH"

python3 scripts/apply-text-editor-hotfix.py

# Regression guard: canonical editor must expose scrub/playback and motion inspector.
python3 - <<'PY'
from pathlib import Path
src=Path("src/web-scene/WebSceneEditor.tsx").read_text()
motion=Path("src/web-scene/MotionInspector.tsx").read_text()
checks={
 "timeline scrub":"beginScrub",
 "timeline panel":"bm-timeline-resizer",
 "timeline height":"timelineHeight",
 "time ruler":"bm-time-ruler",
 "scene title timeline":"<b>{scene.name}</b>",
 "scene scoped playhead":"scenePlayMs/Math.max(1,scene.durationMs)",
 "unified playhead overlay":"bm-playhead-overlay",
 "space playback":'e.code==="Space"',
 "play from cursor":"current>=totalDuration-1?0:current",
 "motion inspector":"MotionInspector",
 "bezier handles":'className="handle"',
 "timeline in out handles":"bm-motion-handle",
 "shared motion runtime":"motionFrame(item,scenePlayMs)",
}
missing=[name for name,needle in checks.items() if needle not in (motion if name=="bezier handles" else src)]
if missing:
    raise SystemExit("EDITOR_REGRESSION_GUARD_FAILED: "+", ".join(missing))
print("EDITOR_REGRESSION_GUARD_OK")
PY
npm ci
npm test
npm run build
node --check server/openrouterGateway.mjs
node --check server/ttKnowledgeService.mjs

if [ ! -f .env ]; then echo "ERROR: $APP_DIR/.env is missing" >&2; exit 1; fi
if ! grep -q '^OPENROUTER_API_KEY=' .env; then echo "ERROR: OPENROUTER_API_KEY is not configured" >&2; exit 1; fi
if [ ! -f /etc/letsencrypt/live/studio.bannermatic.online/fullchain.pem ]; then echo "ERROR: studio.bannermatic.online TLS certificate is missing" >&2; exit 1; fi

# Keep one canonical Studio host. Remove the temporary migration host and the
# legacy ads host before installing the versioned Studio template.
rm -f "$LEGACY_NGINX_LINK" "$LEGACY_NGINX_CONF" "$MIGRATION_NGINX_LINK"
cp "$NGINX_SRC" "$NGINX_DST"
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

printf '\n== Runtime checks ==\n'
gateway_health=""
for attempt in {1..20}; do
  if gateway_health="$(curl -fsS --max-time 2 http://127.0.0.1:8791/healthz 2>/dev/null)"; then
    printf '%s\n' "$gateway_health"
    break
  fi
  if [ "$attempt" -eq 20 ]; then
    echo "ERROR: gateway did not become ready within 20 seconds" >&2
    pm2 describe banner-openrouter-gateway || true
    exit 1
  fi
  sleep 1
done
curl -fsS --max-time 20 https://studio.bannermatic.online/healthz
printf '\n'
curl -fsS --max-time 20 https://studio.bannermatic.online/ | grep -q '<div id="root"></div>'
curl -fsS --max-time 20 https://studio.bannermatic.online/api/tt/kb | python3 -c 'import json,sys; d=json.load(sys.stdin); print("TT Knowledge sources:", len(d.get("items", d if isinstance(d,list) else [])))'
printf '\nDEPLOY_OK branch=%s commit=%s\n' "$BRANCH" "$(git rev-parse --short HEAD)"

#!/usr/bin/env bash
# Lanliang deploy script
# Pulls latest code, restarts backend, rebuilds frontend.
# Usage:  bash /www/wwwroot/lanliangkeji/deploy.sh

set -e

APP_DIR="/www/wwwroot/lanliangkeji"
SERVER_DIR="$APP_DIR/server"
FRONT_DIR="$APP_DIR/app"
LOG="/var/log/lanliang-deploy.log"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

cd "$APP_DIR"
log '=== git pull ==='
git pull origin main 2>&1 | tee -a "$LOG"

log '=== backend deps ==='
source "$SERVER_DIR/venv/bin/activate"
pip install -q -r "$SERVER_DIR/requirements.txt" 2>&1 | tail -5 | tee -a "$LOG"

log '=== restart backend ==='
systemctl restart lanliang-backend
sleep 3
systemctl is-active lanliang-backend | tee -a "$LOG"

log '=== frontend build ==='
cd "$FRONT_DIR"
chattr -i -R dist/ 2>/dev/null || true
rm -rf dist
npm run build 2>&1 | tail -8 | tee -a "$LOG"

log '=== reload nginx ==='
nginx -t 2>&1 | tee -a "$LOG"
/usr/local/bin/lanliang-nginx-reload.sh

log '=== smoke test ==='
curl -s -o /dev/null -w 'HTTP %{http_code} in %{time_total}s\n' https://lanliangkeji.cn/ | tee -a "$LOG"
curl -s -o /dev/null -w 'API /docs HTTP %{http_code} in %{time_total}s\n' https://lanliangkeji.cn/docs/ | tee -a "$LOG"

log '=== DONE ==='

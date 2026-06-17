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

log '=== frontend deps ==='
cd "$FRONT_DIR"
# 装完整依赖(devDependencies 包含 typescript,vite,各种类型,build 脚本要)
# 加 --no-audit --no-fund 减少噪声;用 ci 保持 lock 一致
if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund 2>&1 | tail -8 | tee -a "$LOG"
else
    npm install --no-audit --no-fund 2>&1 | tail -8 | tee -a "$LOG"
fi

log '=== frontend build ==='
chattr -i -R dist/ 2>/dev/null || true
rm -rf dist
npm run build 2>&1 | tee -a "$LOG"

# index.html 不缓存(否则手机端会一直用旧 JS,新代码不生效)
# assets/* 走 30 天长期 cache(Vite 自带 hash 文件名,改名即失效,安全)
INDEX_HTML="$FRONT_DIR/dist/index.html"
if [ -f "$INDEX_HTML" ]; then
    sed -i 's|<head>|<head>\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n    <meta http-equiv="Pragma" content="no-cache">\n    <meta http-equiv="Expires" content="0">|' "$INDEX_HTML"
    log 'index.html: 注入 no-cache meta 标签'
fi

log '=== sync nginx vhost conf ==='
# 把项目里的 nginx conf 同步到 vhost 目录(让 deploy.sh 是单一真理源)
# 注意: deploy.sh 自己 reload nginx(下面),所以这个 cp 之后必须 reload 才生效
VHOST_DIR="/www/server/panel/vhost/nginx"
if [ -f "$APP_DIR/nginx-lanliangkeji.conf" ] && [ -d "$VHOST_DIR" ]; then
    cp -f "$APP_DIR/nginx-lanliangkeji.conf" "$VHOST_DIR/www.lanliangkeji.cn.conf"
    log 'nginx vhost conf synced'
fi

log '=== reload nginx ==='
nginx -t 2>&1 | tee -a "$LOG"
/usr/local/bin/lanliang-nginx-reload.sh

log '=== smoke test ==='
curl -s -o /dev/null -w 'HTTP %{http_code} in %{time_total}s\n' https://lanliangkeji.cn/ | tee -a "$LOG"
curl -s -o /dev/null -w 'API /docs HTTP %{http_code} in %{time_total}s\n' https://lanliangkeji.cn/docs/ | tee -a "$LOG"

log '=== DONE ==='

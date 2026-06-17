#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/surf-crm/app}"
PM2_APP_NAME="${PM2_APP_NAME:-surf-crm-api}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_GIT_PULL="${DEPLOY_GIT_PULL:-false}"

cd "$APP_DIR"

if [ "$DEPLOY_GIT_PULL" = "true" ]; then
  git pull --ff-only origin "$DEPLOY_BRANCH"
fi

npm ci
npm run sheets:proxy:check
npm run build

if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_APP_NAME" --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi

pm2 save
sudo nginx -t
sudo systemctl reload nginx

echo "SURF CRM deployed."

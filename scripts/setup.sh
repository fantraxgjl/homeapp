#!/usr/bin/env bash
# Initial setup script for homeapp on Raspberry Pi
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== homeapp setup ==="

# 1. Install dependencies
cd "$APP_DIR"
npm ci --prefer-offline

# 2. Create .env if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
  echo "Creating .env from .env.example — fill in values before starting"
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

# 3. Run database migrations
npx prisma migrate deploy

# 4. Build the app
npm run build

# 5. Create logs directory
mkdir -p "$APP_DIR/logs"

# 6. Start with PM2
pm2 start "$APP_DIR/ecosystem.config.js"
pm2 save

echo ""
echo "=== Setup complete ==="
echo "Dashboard running at http://localhost:3000"
echo "To enable PM2 on boot: pm2 startup  (then run the command it prints)"

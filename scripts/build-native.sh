#!/usr/bin/env bash
# Build a static Capacitor bundle (no server required).
# API routes are temporarily moved aside — the NativeDataProvider fetch
# interceptor handles all /api calls via on-device SQLite at runtime.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$APP_DIR/src/app/api"
API_TEMP="$APP_DIR/.api-server-only"

cleanup() {
  # Always restore API routes, even on error
  if [ -d "$API_TEMP" ]; then
    mv "$API_TEMP" "$API_DIR"
    echo "Restored API routes."
  fi
}
trap cleanup EXIT

echo "=== homeapp native build ==="
echo "Moving API routes aside (they're replaced by on-device SQLite)..."
mv "$API_DIR" "$API_TEMP"

echo "Building static export..."
cd "$APP_DIR"
NEXT_BUILD_NATIVE=true npx next build --webpack

echo "Syncing to Capacitor..."
npx cap sync ios

echo ""
echo "=== Build complete ==="
echo "Static bundle: $APP_DIR/out/"
echo "Next: open Xcode with  npm run cap:ios"

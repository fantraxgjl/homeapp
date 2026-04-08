#!/usr/bin/env bash
# Backup the SQLite database to a timestamped file.
# Run via cron: 0 3 * * * /home/pi/homeapp/scripts/backup-db.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
DB_FILE="$APP_DIR/prisma/homeapp.db"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

if [ ! -f "$DB_FILE" ]; then
  echo "DB not found: $DB_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/homeapp-$TIMESTAMP.db"

# Use SQLite's .backup command for a safe online backup
sqlite3 "$DB_FILE" ".backup '$DEST'"

echo "Backup written: $DEST ($(du -sh "$DEST" | cut -f1))"

# Prune old backups
find "$BACKUP_DIR" -name "homeapp-*.db" -mtime +"$KEEP_DAYS" -delete
echo "Old backups (>${KEEP_DAYS}d) pruned."

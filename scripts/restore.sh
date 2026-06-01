#!/bin/bash
# Восстановление БД из бэкапа.
# Использование: ./scripts/restore.sh /var/backups/homepilot/homepilot_20240101_030000.sql.gz
set -euo pipefail

BACKUP_FILE="${1:?Usage: restore.sh <backup_file.sql.gz>}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restoring from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | psql "${DATABASE_URL_SYNC:?Set DATABASE_URL_SYNC}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restore complete"

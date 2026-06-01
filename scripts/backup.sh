#!/bin/bash
# PostgreSQL backup — запускать через cron:
# 0 3 * * * /opt/homepilot/scripts/backup.sh >> /var/log/homepilot-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/homepilot}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/homepilot_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..."
pg_dump "${DATABASE_URL_SYNC:?Set DATABASE_URL_SYNC}" | gzip > "$BACKUP_FILE"
SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Saved: $BACKUP_FILE ($SIZE)"

find "$BACKUP_DIR" -name "homepilot_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up backups older than ${KEEP_DAYS} days"

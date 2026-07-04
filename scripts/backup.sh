#!/bin/bash
# PostgreSQL backup — запускать через cron:
# 0 3 * * * /opt/homepilot/scripts/backup.sh >> /var/log/homepilot-backup.log 2>&1
#
# Дампит БД изнутри контейнера db (docker-compose.prod.yml), т.к. порт 5432
# наружу не пробрасывается.
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/homepilot}"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_DIR/docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/homepilot}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/homepilot_${TIMESTAMP}.sql.gz"

cd "$PROJECT_DIR"
set -a
[ -f .env ] && . ./.env
set +a
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-homepilot}"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..."
docker compose -f "$COMPOSE_FILE" exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Saved: $BACKUP_FILE ($SIZE)"

find "$BACKUP_DIR" -name "homepilot_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up backups older than ${KEEP_DAYS} days"

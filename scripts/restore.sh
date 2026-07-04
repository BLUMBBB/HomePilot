#!/bin/bash
# Восстановление БД из бэкапа (через контейнер db, см. scripts/backup.sh).
# Использование: ./scripts/restore.sh /var/backups/homepilot/homepilot_20240101_030000.sql.gz
set -euo pipefail

BACKUP_FILE="${1:?Usage: restore.sh <backup_file.sql.gz>}"
PROJECT_DIR="${PROJECT_DIR:-/opt/homepilot}"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_DIR/docker-compose.prod.yml}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: file not found: $BACKUP_FILE"
  exit 1
fi

cd "$PROJECT_DIR"
set -a
[ -f .env ] && . ./.env
set +a
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-homepilot}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restoring from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restore complete"

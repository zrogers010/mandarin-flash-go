#!/usr/bin/env bash
#
# Backup PostgreSQL database from the Docker container.
# Keeps the most recent 7 daily backups.
#
# Usage:
#   ./scripts/backup-db.sh
#
# Cron example (daily at 3 AM):
#   0 3 * * * /home/deploy/mandarinflash/scripts/backup-db.sh >> /home/deploy/mandarinflash/backups/backup.log 2>&1
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
    source .env
fi

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-chinese_learning}"
CONTAINER="mf_postgres"
BACKUP_DIR="$PROJECT_DIR/backups"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup of $DB_NAME..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: Container $CONTAINER is not running."
    exit 1
fi

docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($SIZE)"

echo "[$(date)] Pruning backups older than $RETENTION_DAYS days..."
DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -print -delete | wc -l)
echo "[$(date)] Removed $DELETED old backup(s)."

REMAINING=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" | wc -l)
echo "[$(date)] Backup complete. $REMAINING backup(s) on disk."

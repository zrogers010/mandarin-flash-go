#!/usr/bin/env bash
#
# Automated nightly database backup for MandarinFlash
# Compresses backups, retains 14 days, and optionally uploads to S3
#
# Installation:
#   1. Make executable: chmod +x scripts/backup-cron.sh
#   2. Add to crontab: crontab -e
#      0 2 * * * /path/to/mandarin-flash-go/scripts/backup-cron.sh >> /var/log/mandarin-backup.log 2>&1
#   3. For S3 upload, set S3_BACKUP_BUCKET in .env (e.g., s3://my-backups/mandarin-flash/)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "=== MandarinFlash Database Backup ==="
echo "  Time: $(date)"
echo "  Target: $BACKUP_FILE"

# Detect docker compose command
if docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
else
    DC="docker-compose"
fi

# Run backup
echo "  Running pg_dump..."
$DC -f docker-compose.prod.yml exec -T postgres pg_dump \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-chinese_learning}" \
    --clean --if-exists --verbose \
    2>&1 | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  Backup complete: $BACKUP_SIZE"
    
    # Verify the backup is valid (can be decompressed)
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        echo "  Backup verified (gzip integrity OK)"
    else
        echo "  ERROR: Backup file is corrupted!"
        exit 1
    fi
    
    # Optional: Upload to S3 if configured
    if [ -n "${S3_BACKUP_BUCKET:-}" ] && command -v aws &>/dev/null; then
        echo "  Uploading to S3: $S3_BACKUP_BUCKET"
        aws s3 cp "$BACKUP_FILE" "$S3_BACKUP_BUCKET/$(basename "$BACKUP_FILE")" \
            --storage-class STANDARD_IA \
            --metadata "created=$(date -Iseconds),host=$(hostname)"
        if [ $? -eq 0 ]; then
            echo "  S3 upload complete"
        else
            echo "  WARNING: S3 upload failed"
        fi
    fi
else
    echo "  ERROR: Backup failed"
    exit 1
fi

# Cleanup old backups (keep last 14 days locally)
echo "  Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup-*.sql.gz" -type f | wc -l)
echo "  Local backups retained: $REMAINING"

# Get database stats
USERS=$($DC -f docker-compose.prod.yml exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "?")
VOCAB=$($DC -f docker-compose.prod.yml exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM vocabulary;" 2>/dev/null || echo "?")
PROGRESS=$($DC -f docker-compose.prod.yml exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM user_vocabulary_progress;" 2>/dev/null || echo "?")

echo "  Database stats: $USERS users, $VOCAB words, $PROGRESS progress records"
echo "=== Backup Complete ==="

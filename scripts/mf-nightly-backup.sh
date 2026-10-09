#!/usr/bin/env bash
#
# MandarinFlash nightly backup script
# Runs via systemd timer mf-nightly-backup.timer at 3:17 AM PT
# Creates compressed PostgreSQL backups with verification and 14-day retention
#
set -euo pipefail

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_FILE="$BACKUP_DIR/mandarinflash-$DATE.sql.gz"
LOG_FILE="$BACKUP_DIR/backup.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..." | tee -a "$LOG_FILE"

# Create backup with compression
# Note: Direct gzip without intermediate file to avoid disk space issues
if sudo -n docker compose -f /home/deploy/mandarinflash/docker-compose.prod.yml exec -T postgres \
    pg_dump -U postgres -d chinese_learning --clean --if-exists 2>&1 | gzip > "$BACKUP_FILE"; then
    
    # Verify the compressed backup is valid
    if gzip -t "$BACKUP_FILE" 2>&1; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        
        # Verify backup contains expected data by checking table count
        TABLE_COUNT=$(gunzip -c "$BACKUP_FILE" | grep -c "^CREATE TABLE" || echo "0")
        
        if [ "$TABLE_COUNT" -ge 10 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup successful: $BACKUP_FILE ($BACKUP_SIZE, $TABLE_COUNT tables)" | tee -a "$LOG_FILE"
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup appears incomplete (only $TABLE_COUNT tables)" | tee -a "$LOG_FILE"
            rm -f "$BACKUP_FILE"
            exit 1
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup file is corrupted (gzip -t failed)" | tee -a "$LOG_FILE"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: pg_dump failed" | tee -a "$LOG_FILE"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Clean up backups older than 14 days
DELETED=$(find "$BACKUP_DIR" -name "mandarinflash-*.sql.gz" -mtime +14 -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deleted $DELETED old backup(s)" | tee -a "$LOG_FILE"
fi

# Keep backup log manageable (last 1000 lines)
if [ -f "$LOG_FILE" ]; then
    tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup complete" | tee -a "$LOG_FILE"

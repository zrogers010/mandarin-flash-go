# Systemd Backup Setup

This guide covers setting up the automated nightly database backups using systemd timers on production.

## Overview

The production backup system uses:
- **systemd timer**: `mf-nightly-backup.timer` schedules backups daily at 3:17 AM PT
- **systemd service**: `mf-nightly-backup.service` runs the backup script
- **backup script**: `~/bin/mf-nightly-backup.sh` performs the actual backup with verification

## Installation

### 1. Copy the backup script

```bash
# As the deploy user
mkdir -p ~/bin
cp /home/deploy/mandarinflash/scripts/mf-nightly-backup.sh ~/bin/
chmod +x ~/bin/mf-nightly-backup.sh
```

### 2. Install systemd units

```bash
# As root or with sudo
sudo cp /home/deploy/mandarinflash/systemd/mf-nightly-backup.service /etc/systemd/system/
sudo cp /home/deploy/mandarinflash/systemd/mf-nightly-backup.timer /etc/systemd/system/

# Reload systemd to recognize new units
sudo systemctl daemon-reload
```

### 3. Enable and start the timer

```bash
# Enable the timer to start on boot
sudo systemctl enable mf-nightly-backup.timer

# Start the timer now
sudo systemctl start mf-nightly-backup.timer

# Verify the timer is active
sudo systemctl status mf-nightly-backup.timer
```

### 4. Verify the schedule

```bash
# List all timers to see when the next backup will run
sudo systemctl list-timers --all | grep mf-nightly-backup
```

## Manual Backup

To run a backup manually (without waiting for the scheduled time):

```bash
sudo systemctl start mf-nightly-backup.service
```

## Monitoring

### Check backup status

```bash
# View the service status
sudo systemctl status mf-nightly-backup.service

# View recent backup logs
sudo journalctl -u mf-nightly-backup.service -n 50
```

### Check backup files

```bash
# List recent backups
ls -lh /home/deploy/backups/mandarinflash-*.sql.gz

# Check backup log
tail -50 /home/deploy/backups/backup.log
```

### Verify a backup

```bash
# Test gzip integrity
gzip -t /home/deploy/backups/mandarinflash-2026-10-09_0317.sql.gz

# Count tables in backup
gunzip -c /home/deploy/backups/mandarinflash-2026-10-09_0317.sql.gz | grep -c "^CREATE TABLE"
```

## Backup Features

- **Compression**: All backups are gzip compressed to save disk space
- **Verification**: Each backup is tested with `gzip -t` to ensure integrity
- **Table count check**: Verifies the backup contains at least 10 tables
- **Retention**: Automatically deletes backups older than 14 days
- **Logging**: All backup operations are logged to `/home/deploy/backups/backup.log`
- **Error handling**: Failed backups are removed and logged

## Troubleshooting

### Timer not firing

```bash
# Check if timer is enabled
sudo systemctl is-enabled mf-nightly-backup.timer

# Check timer status and logs
sudo systemctl status mf-nightly-backup.timer
sudo journalctl -u mf-nightly-backup.timer
```

### Backup failures

```bash
# Check service logs
sudo journalctl -u mf-nightly-backup.service -n 100

# Check backup script log
tail -100 /home/deploy/backups/backup.log

# Test running the script manually
sudo -u deploy /home/deploy/bin/mf-nightly-backup.sh
```

### Disk space issues

```bash
# Check backup directory size
du -sh /home/deploy/backups/

# Remove old backups manually if needed
find /home/deploy/backups -name "mandarinflash-*.sql.gz" -mtime +14 -delete
```

## Restoring from Backup

To restore a database from backup:

```bash
# Stop the application
cd /home/deploy/mandarinflash
sudo -n docker compose -f docker-compose.prod.yml down

# Start only the database
sudo -n docker compose -f docker-compose.prod.yml up -d postgres

# Restore the backup
gunzip -c /home/deploy/backups/mandarinflash-2026-10-09_0317.sql.gz | \
  sudo -n docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d chinese_learning

# Start the full application
sudo -n docker compose -f docker-compose.prod.yml up -d
```

## Migration from backup-cron.sh

If you're migrating from the old `backup-cron.sh` cron-based approach:

1. Remove the old crontab entry:
   ```bash
   crontab -e
   # Delete the line that runs backup-cron.sh
   ```

2. Follow the installation steps above

3. The old `backup-cron.sh` can be kept for reference but is no longer needed

## Timezone Configuration

The timer is configured to run at 3:17 AM in the server's local timezone. To verify your timezone:

```bash
timedatectl
```

To set the timezone to Pacific Time:

```bash
sudo timedatectl set-timezone America/Los_Angeles
```

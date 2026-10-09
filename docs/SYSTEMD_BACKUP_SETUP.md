# Systemd Backup Setup

This guide covers setting up the automated nightly database backups using systemd timers on production.

**Note**: This replaces any existing backup setup (e.g., `backup-cron.sh` via cron) with identical behavior using systemd timers for better reliability and logging.

## Overview

The production backup system uses:
- **systemd timer**: `mf-nightly-backup.timer` schedules backups daily at 3:17 AM PT (with timezone specified)
- **systemd service**: `mf-nightly-backup.service` runs the backup script as the deploy user
- **backup script**: `~/bin/mf-nightly-backup.sh` performs the actual backup with verification
- **backup location**: `/home/ec2-user/backups` (configurable via `BACKUP_DIR` environment variable)

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
ls -lh /home/ec2-user/backups/mandarinflash-*.sql.gz

# Check backup log
tail -50 /home/ec2-user/backups/backup.log
```

### Verify a backup

```bash
# Test gzip integrity
gzip -t /home/ec2-user/backups/mandarinflash-2026-10-09_0317.sql.gz

# Count tables in backup
gunzip -c /home/ec2-user/backups/mandarinflash-2026-10-09_0317.sql.gz | grep -c "^CREATE TABLE"
```

### Configure backup location

The default backup location is `/home/ec2-user/backups`. To use a different location, set the `BACKUP_DIR` environment variable in the systemd service:

```bash
sudo systemctl edit mf-nightly-backup.service
```

Add:
```ini
[Service]
Environment="BACKUP_DIR=/custom/backup/path"
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
du -sh /home/ec2-user/backups/

# Remove old backups manually if needed
find /home/ec2-user/backups -name "mandarinflash-*.sql.gz" -mtime +14 -delete
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
gunzip -c /home/ec2-user/backups/mandarinflash-2026-10-09_0317.sql.gz | \
  docker exec -i mf_postgres psql -U postgres -d chinese_learning

# Start the full application
sudo -n docker compose -f docker-compose.prod.yml up -d
```

## Migration from Existing Backup Setup

If you have an existing backup setup (e.g., `backup-cron.sh` via cron):

1. Remove any existing crontab entries:
   ```bash
   crontab -e
   # Delete any lines that run backup scripts
   ```

2. Disable any existing systemd timers with the same name:
   ```bash
   sudo systemctl stop mf-nightly-backup.timer
   sudo systemctl disable mf-nightly-backup.timer
   ```

3. Follow the installation steps above

4. The systemd setup provides the same functionality with better:
   - Logging (via journalctl)
   - Error handling (systemd will record failures)
   - Timezone handling (explicit America/Los_Angeles in OnCalendar)
   - Reliability (Persistent=true runs missed backups on boot)

## Timezone Configuration

The timer specifies `America/Los_Angeles` directly in the `OnCalendar` directive, so it will run at 3:17 AM Pacific Time regardless of the server's timezone setting.

To verify the scheduled time:
```bash
sudo systemctl list-timers --all | grep mf-nightly-backup
```

The server may run in UTC, but the timer will correctly convert to Pacific Time.

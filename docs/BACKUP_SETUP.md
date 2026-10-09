# Database Backup Setup

## Overview

MandarinFlash uses automated nightly backups with 14-day retention and optional S3 archival.

## Quick Setup

### 1. Test the backup script manually

```bash
cd /path/to/mandarin-flash-go
bash scripts/backup-cron.sh
```

Verify the backup was created in `backups/backup-YYYYMMDD-HHMMSS.sql.gz`.

### 2. Install the cron job

As the deploy user (typically `ec2-user`):

```bash
crontab -e
```

Add this line to run backups nightly at 2 AM:

```cron
0 2 * * * /home/ec2-user/mandarin-flash-go/scripts/backup-cron.sh >> /var/log/mandarin-backup.log 2>&1
```

### 3. (Optional) Enable S3 archival

Add to your `.env`:

```bash
S3_BACKUP_BUCKET=s3://your-backup-bucket/mandarin-flash/
```

The AWS CLI must be installed and configured:

```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials (use IAM role or access keys)
aws configure
```

Create the S3 bucket with lifecycle policy:

```bash
aws s3 mb s3://your-backup-bucket
aws s3api put-bucket-lifecycle-configuration --bucket your-backup-bucket --lifecycle-configuration file://- <<'EOF'
{
  "Rules": [
    {
      "Id": "archive-old-backups",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF
```

## Systemd Timer Alternative (Recommended for modern systems)

Instead of cron, use systemd timers for better logging and error handling.

### 1. Create the service file

`/etc/systemd/system/mandarin-backup.service`:

```ini
[Unit]
Description=MandarinFlash Database Backup
After=network.target docker.service

[Service]
Type=oneshot
User=ec2-user
WorkingDirectory=/home/ec2-user/mandarin-flash-go
ExecStart=/home/ec2-user/mandarin-flash-go/scripts/backup-cron.sh
StandardOutput=journal
StandardError=journal
```

### 2. Create the timer file

`/etc/systemd/system/mandarin-backup.timer`:

```ini
[Unit]
Description=Run MandarinFlash backup nightly at 2 AM
After=network.target

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### 3. Enable and start the timer

```bash
sudo systemctl daemon-reload
sudo systemctl enable mandarin-backup.timer
sudo systemctl start mandarin-backup.timer

# Check status
sudo systemctl status mandarin-backup.timer
sudo systemctl list-timers --all | grep mandarin
```

### 4. Test manually

```bash
sudo systemctl start mandarin-backup.service
sudo journalctl -u mandarin-backup.service -n 50
```

## Restoring from Backup

```bash
# 1. Stop the application
docker compose -f docker-compose.prod.yml stop backend

# 2. Restore the backup
gunzip -c backups/backup-20261009-020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d chinese_learning

# 3. Restart the application
docker compose -f docker-compose.prod.yml up -d
```

## Monitoring

Check backup logs:

```bash
# For cron
tail -f /var/log/mandarin-backup.log

# For systemd
sudo journalctl -u mandarin-backup.service -f
```

List recent backups:

```bash
ls -lh backups/ | tail -20
```

Verify backup integrity:

```bash
gzip -t backups/backup-*.sql.gz && echo "All backups valid"
```

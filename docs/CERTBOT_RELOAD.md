# Certbot Nginx Reload Setup

## Problem

Let's Encrypt certificates auto-renew every 60 days, but nginx continues serving the old certificate until restarted. This causes the site to break when the old cert expires.

**Timeline:**
- Jun 19 deploy: nginx loads cert valid until Sep 17
- Aug 17: certbot renews cert (valid until Nov 15)
- Sep 17: **site breaks** (nginx still serving expired Jun cert)
- Sep 27 deploy: nginx restarts, loads the Aug 17 cert
- Oct 16: certbot renews again (valid until Jan 14, 2027)
- **Nov 15**: **site will break again** unless nginx reload is fixed

## Solution

Add a certbot `--deploy-hook` or systemd timer that reloads nginx after renewal.

### Option 1: Deploy Hook (Recommended)

The certbot container runs renewals every 12 hours. Add a deploy hook that reloads nginx when a cert is renewed.

**Edit `/workspace/docker-compose.prod.yml`:**

Find the certbot service and add the `--deploy-hook` argument:

```yaml
certbot:
  image: certbot/certbot
  container_name: mf_certbot
  volumes:
    - ./certbot/conf:/etc/letsencrypt
    - ./certbot/www:/var/www/certbot
  entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --deploy-hook \"docker exec mf_frontend nginx -s reload\"; sleep 12h & wait $${!}; done;'"
  depends_on:
    - frontend
```

**Explanation:**
- `--deploy-hook` runs **only when a renewal succeeds**
- `docker exec mf_frontend nginx -s reload` sends SIGHUP to nginx to reload config and certs
- Runs every 12h (certbot default check interval)

### Option 2: Cron Job

If the deploy hook doesn't work (docker socket access issues), use a cron that reloads nginx monthly.

```bash
crontab -e
```

Add:

```cron
# Reload nginx on the 1st of each month at 3 AM (after certbot renewal window)
0 3 1 * * docker exec mf_frontend nginx -s reload >> /var/log/nginx-reload.log 2>&1
```

### Option 3: Systemd Timer (Modern Alternative)

**Create `/etc/systemd/system/nginx-reload-cert.service`:**

```ini
[Unit]
Description=Reload nginx after cert renewal
After=network.target docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker exec mf_frontend nginx -s reload
StandardOutput=journal
StandardError=journal
```

**Create `/etc/systemd/system/nginx-reload-cert.timer`:**

```ini
[Unit]
Description=Reload nginx monthly for cert renewal

[Timer]
OnCalendar=monthly
OnCalendar=*-*-01 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable nginx-reload-cert.timer
sudo systemctl start nginx-reload-cert.timer
```

### Option 4: Manual (Immediate Fix)

**One-time manual reload for the Oct 16 renewal:**

```bash
docker exec mf_frontend nginx -s reload
```

Check the cert expiry afterward:

```bash
echo | openssl s_client -connect mandarinflash.com:443 -servername mandarinflash.com 2>/dev/null | openssl x509 -noout -dates
```

Expected output:
```
notBefore=Aug 17 16:27:00 2026 GMT
notAfter=Nov 15 16:27:00 2026 GMT
```

If it still shows the Aug 17 cert expiring Nov 15, you're good until Jan. If it shows an older cert, check `/etc/letsencrypt/live/mandarinflash.com/` for the renewed cert.

## Verification

1. **Check certbot renewal logs:**

   ```bash
   docker logs mf_certbot | tail -50
   ```

   Look for:
   ```
   Certificate not yet due for renewal
   ```
   or
   ```
   Successfully renewed certificate
   ```

2. **Force a renewal test** (dry run, doesn't replace cert):

   ```bash
   docker exec mf_certbot certbot renew --dry-run
   ```

3. **Monitor expiry:**

   Add to monitoring/alerts or check manually monthly:

   ```bash
   echo | openssl s_client -connect mandarinflash.com:443 -servername mandarinflash.com 2>/dev/null | openssl x509 -noout -dates
   ```

## Summary

- **Immediate**: Run `docker exec mf_frontend nginx -s reload` after the next renewal (around Oct 16)
- **Permanent**: Add `--deploy-hook "docker exec mf_frontend nginx -s reload"` to certbot in docker-compose.prod.yml
- **Failsafe**: Add monthly cron or systemd timer as backup

Without this fix, the site **will break again on Nov 15, 2026** when the August cert expires.

# Email Deliverability Setup for mandarinflash.com

## Overview

MandarinFlash sends emails via AWS SES. To ensure high deliverability and avoid spam folders, the following DNS records must be configured at your DNS provider (DigitalOcean).

## Current Issue

- **No SPF record**: Email servers can't verify that AWS SES is authorized to send for mandarinflash.com
- **No DMARC record**: No policy for handling failed authentication
- **DKIM may not be configured**: AWS SES DKIM signatures may be missing

Result: **47 of 336 users (14%) are verified**. Many verification emails likely landed in spam or were rejected.

## Required DNS Records

### 1. SPF Record

SPF (Sender Policy Framework) authorizes AWS SES and Google Workspace to send email for your domain.

**Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:amazonses.com ~all
TTL: 3600
```

**Explanation:**
- `include:_spf.google.com` — Authorize Google Workspace (existing MX provider)
- `include:amazonses.com` — Authorize AWS SES (for application emails)
- `~all` — Soft fail for others (logs but doesn't reject; use `-all` for strict reject)

### 2. DKIM for AWS SES

DKIM (DomainKeys Identified Mail) cryptographically signs emails to prove they came from your domain.

**Steps:**

1. **Verify your domain in AWS SES** (if not already done):
   ```bash
   aws ses verify-domain-identity --domain mandarinflash.com --region us-west-2
   ```

2. **Get DKIM tokens**:
   ```bash
   aws ses verify-domain-dkim --domain mandarinflash.com --region us-west-2
   ```
   
   This returns 3 DKIM tokens, e.g.:
   ```
   token1._domainkey.mandarinflash.com
   token2._domainkey.mandarinflash.com
   token3._domainkey.mandarinflash.com
   ```

3. **Add CNAME records** to DigitalOcean DNS:

   For each token returned (replace `<token1>`, `<token2>`, `<token3>` with actual values):

   ```
   Type: CNAME
   Name: <token1>._domainkey
   Value: <token1>.dkim.amazonses.com.
   TTL: 3600

   Type: CNAME
   Name: <token2>._domainkey
   Value: <token2>.dkim.amazonses.com.
   TTL: 3600

   Type: CNAME
   Name: <token3>._domainkey
   Value: <token3>.dkim.amazonses.com.
   TTL: 3600
   ```

   **Important**: The Value must end with a dot (`.`) to avoid DNS append issues.

4. **Wait 24-72 hours** for DNS propagation and SES verification.

5. **Check status**:
   ```bash
   aws ses get-identity-dkim-attributes --identities mandarinflash.com --region us-west-2
   ```

   Status should show `DkimVerificationStatus: Success`.

### 3. DMARC Record

DMARC (Domain-based Message Authentication, Reporting and Conformance) tells receiving servers what to do with emails that fail SPF/DKIM checks.

**Record (start with monitoring mode):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@mandarinflash.com; pct=100; adkim=r; aspf=r
TTL: 3600
```

**Explanation:**
- `p=none` — Monitor mode (don't reject, just report). Use `p=quarantine` or `p=reject` after confirming setup works.
- `rua=mailto:dmarc@mandarinflash.com` — Send aggregate reports to this address
- `pct=100` — Apply policy to 100% of emails
- `adkim=r` — Relaxed DKIM alignment (subdomains OK)
- `aspf=r` — Relaxed SPF alignment

**After 1-2 weeks of monitoring, upgrade to:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@mandarinflash.com; pct=100; adkim=s; aspf=s
```

Then eventually:
```
v=DMARC1; p=reject; rua=mailto:dmarc@mandarinflash.com; pct=100; adkim=s; aspf=s
```

## Summary of DNS Changes

Add these records to DigitalOcean DNS for `mandarinflash.com`:

| Type  | Name                    | Value                                                                  | TTL  |
|-------|-------------------------|------------------------------------------------------------------------|------|
| TXT   | @                       | `v=spf1 include:_spf.google.com include:amazonses.com ~all`            | 3600 |
| TXT   | _dmarc                  | `v=DMARC1; p=none; rua=mailto:dmarc@mandarinflash.com; pct=100; ...`  | 3600 |
| CNAME | `<token1>._domainkey`   | `<token1>.dkim.amazonses.com.`                                         | 3600 |
| CNAME | `<token2>._domainkey`   | `<token2>.dkim.amazonses.com.`                                         | 3600 |
| CNAME | `<token3>._domainkey`   | `<token3>.dkim.amazonses.com.`                                         | 3600 |

## Verification

### Check SPF
```bash
dig TXT mandarinflash.com +short | grep spf
```

Expected: `"v=spf1 include:_spf.google.com include:amazonses.com ~all"`

### Check DMARC
```bash
dig TXT _dmarc.mandarinflash.com +short
```

Expected: `"v=DMARC1; p=none; ..."`

### Check DKIM
```bash
dig CNAME <token1>._domainkey.mandarinflash.com +short
```

Expected: `<token1>.dkim.amazonses.com.`

### Test Email Deliverability

Use mail-tester.com:
1. Send a test email from the app to `test-xxxxx@mail-tester.com`
2. Check the score (should be 9-10/10 after DNS changes)

## AWS SES Configuration

Ensure SES is out of sandbox mode and configured correctly:

```bash
# Check sending limits
aws ses get-send-quota --region us-west-2

# Check reputation
aws ses get-account-sending-enabled --region us-west-2
```

If still in sandbox:
1. Request production access: https://console.aws.amazon.com/ses/
2. Navigate to Account Dashboard → Sending limits → Request production access
3. Fill out the form (expected daily volume, bounces/complaints handling, etc.)

## Monitoring

Set up bounce and complaint handling:
- Configure SNS topics for bounces and complaints
- Add suppression list management
- Monitor `aws ses list-suppressed-destinations`

## Expected Impact

After implementing these DNS records:

- ✅ Emails land in inbox instead of spam
- ✅ Email verification rate improves from 14% to 70-90%
- ✅ Domain reputation protects against phishing/spoofing
- ✅ DMARC reports show authentication status

Allow **24-72 hours** for full DNS propagation and deliverability improvement.

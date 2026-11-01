-- ═══════════════════════════════════════════════════════════════════
-- Migration 013: Hash outstanding password-reset and email-verify tokens
-- ═══════════════════════════════════════════════════════════════════
--
-- Refresh sessions already store SHA-256(token). Reset/verify tokens were
-- stored in plaintext. Hash any leftover plaintext rows so a DB dump cannot
-- be used to take over accounts.
--
-- Outstanding emailed links still work: the app looks up SHA-256(raw) first
-- and falls back to the raw value until this migration has hashed it.
--
-- Idempotent: rows that already look like 64-char hex SHA-256 are skipped.

UPDATE password_reset_tokens
SET token = encode(sha256(convert_to(token, 'UTF8')), 'hex')
WHERE token IS NOT NULL
  AND token !~ '^[0-9a-f]{64}$';

UPDATE email_verification_tokens
SET token = encode(sha256(convert_to(token, 'UTF8')), 'hex')
WHERE token IS NOT NULL
  AND token !~ '^[0-9a-f]{64}$';

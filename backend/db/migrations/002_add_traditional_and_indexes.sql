-- ═══════════════════════════════════════════════════════════════════
-- Migration 002: Add traditional column, pg_trgm extension, and
-- trigram indexes for full CC-CEDICT dictionary support.
-- Safe to run multiple times (all statements are idempotent).
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS traditional TEXT;

CREATE INDEX IF NOT EXISTS idx_vocabulary_chinese_trgm ON vocabulary USING gin (chinese gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vocabulary_english_trgm ON vocabulary USING gin (english gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vocabulary_pinyin_trgm ON vocabulary USING gin (pinyin gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vocabulary_traditional ON vocabulary(traditional);

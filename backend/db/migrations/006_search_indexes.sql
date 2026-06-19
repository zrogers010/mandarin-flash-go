-- ═══════════════════════════════════════════════════════════════════
-- Migration 006: Indexes to support tone-insensitive search and faster
-- vocabulary filtering / sorting.
-- Safe to run multiple times (all statements are idempotent).
-- ═══════════════════════════════════════════════════════════════════

-- Trigram index for ILIKE '%term%' searches on tone-stripped pinyin
CREATE INDEX IF NOT EXISTS idx_vocabulary_pinyin_no_tones_trgm
    ON vocabulary USING gin (pinyin_no_tones gin_trgm_ops);

-- Btree index for the default ORDER BY pinyin_no_tones
CREATE INDEX IF NOT EXISTS idx_vocabulary_pinyin_no_tones
    ON vocabulary (pinyin_no_tones);

-- Btree index for HSK level filtering
CREATE INDEX IF NOT EXISTS idx_vocabulary_hsk_level
    ON vocabulary (hsk_level);

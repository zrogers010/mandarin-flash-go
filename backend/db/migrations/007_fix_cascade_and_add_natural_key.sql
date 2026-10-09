-- ═══════════════════════════════════════════════════════════════════
-- Migration 007: Fix CASCADE deletion and add natural key for idempotent seeding
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Remove the CASCADE delete that wipes learner progress when words are deleted
-- This prevents the catastrophic data loss described in the audit where re-seeding
-- deletes all user_vocabulary_progress records.

ALTER TABLE user_vocabulary_progress 
  DROP CONSTRAINT IF EXISTS user_vocabulary_progress_vocabulary_id_fkey;

ALTER TABLE user_vocabulary_progress 
  ADD CONSTRAINT user_vocabulary_progress_vocabulary_id_fkey 
  FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE RESTRICT;

-- Step 2: Add a unique natural key constraint for idempotent seeding
-- This allows us to UPSERT based on (chinese, pinyin_no_tones) instead of DELETE+INSERT
-- Note: pinyin_no_tones is more robust than toned pinyin for matching CEDICT entries

CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_natural_key 
  ON vocabulary(chinese, pinyin_no_tones);

-- Step 3: Add a column to track whether a word has associated progress
-- This helps prevent accidental deletion of words that learners are studying

CREATE INDEX IF NOT EXISTS idx_uvp_vocabulary_id_exists 
  ON user_vocabulary_progress(vocabulary_id);

COMMENT ON CONSTRAINT user_vocabulary_progress_vocabulary_id_fkey ON user_vocabulary_progress IS 
  'RESTRICT prevents deletion of vocabulary words that have learner progress. Words must be orphaned first.';

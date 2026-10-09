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

-- Step 2: Handle pre-existing duplicates deterministically
-- Production has 736 duplicate groups (1,523 rows) where (chinese, traditional, pinyin) is not unique.
-- These are mostly CEDICT variants or parsing artifacts, not true homographs.
-- Strategy: Keep the first (oldest by created_at), merge English definitions, delete the rest.

DO $$
DECLARE
    dupe_group RECORD;
    first_id UUID;
    merged_english TEXT;
    deleted_count INT := 0;
BEGIN
    FOR dupe_group IN 
        SELECT 
            chinese, 
            traditional, 
            pinyin,
            array_agg(id ORDER BY created_at, id) as ids,
            array_agg(english ORDER BY created_at, id) as englishes
        FROM vocabulary
        GROUP BY chinese, traditional, pinyin
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (oldest) ID
        first_id := dupe_group.ids[1];
        
        -- Concatenate English definitions, removing exact duplicates
        SELECT string_agg(DISTINCT val, ' | ')
        INTO merged_english
        FROM unnest(dupe_group.englishes) val;
        
        -- Update the kept row with merged definitions
        UPDATE vocabulary
        SET english = merged_english, updated_at = NOW()
        WHERE id = first_id;
        
        -- Delete the rest of the duplicate rows
        DELETE FROM vocabulary
        WHERE id = ANY(dupe_group.ids[2:]);
        
        deleted_count := deleted_count + (array_length(dupe_group.ids, 1) - 1);
        
        -- Log each merge for audit trail
        RAISE NOTICE 'Merged % duplicate(s) for %/%/%: kept ID %, deleted %',
            array_length(dupe_group.ids, 1) - 1,
            dupe_group.chinese,
            dupe_group.traditional,
            dupe_group.pinyin,
            first_id,
            array_length(dupe_group.ids, 1) - 1;
    END LOOP;
    
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Migration 007: Merged % total duplicate rows', deleted_count;
    END IF;
END $$;

-- Step 3: Add unique natural key constraint (chinese, traditional, pinyin with tones)
-- This key is stable across re-imports and preserves real homographs like:
-- - 好 hǎo (good) vs 好 hào (to like)
-- - 长 cháng (long) vs 长 zhǎng (to grow)
-- Using pinyin WITH tones is critical; toneless would collapse these distinct words.

CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_natural_key 
  ON vocabulary(chinese, traditional, pinyin);

-- Step 4: Add index to help prevent deletion of words with learner progress
CREATE INDEX IF NOT EXISTS idx_uvp_vocabulary_id_exists 
  ON user_vocabulary_progress(vocabulary_id);

COMMENT ON CONSTRAINT user_vocabulary_progress_vocabulary_id_fkey ON user_vocabulary_progress IS 
  'RESTRICT prevents deletion of vocabulary words that have learner progress. Words must be orphaned first.';

-- Migration is idempotent: re-running will be a no-op after first execution

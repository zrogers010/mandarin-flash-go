-- ═══════════════════════════════════════════════════════════════════
-- Migration 008: Normalize emails to lowercase
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Check for duplicate emails that differ only by case
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT LOWER(email) as lower_email, COUNT(*) as cnt
        FROM users
        GROUP BY LOWER(email)
        HAVING COUNT(*) > 1
    ) dupes;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % email(s) with case-only duplicates. These need manual resolution.', duplicate_count;
        RAISE NOTICE 'Query duplicate emails with: SELECT email, COUNT(*) FROM users GROUP BY LOWER(email) HAVING COUNT(*) > 1;';
    END IF;
END $$;

-- Step 2: Lowercase all existing emails
UPDATE users SET email = LOWER(TRIM(email));

-- Step 3: Drop the old unique constraint and create a case-insensitive one
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Step 4: Create a unique index on LOWER(email) for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- Step 5: Add a check to ensure emails are stored lowercase (enforce at DB level)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_email_lowercase' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_email_lowercase 
            CHECK (email = LOWER(email));
    END IF;
END $$;

COMMENT ON CONSTRAINT check_email_lowercase ON users IS 
    'Emails must be stored in lowercase for case-insensitive authentication.';

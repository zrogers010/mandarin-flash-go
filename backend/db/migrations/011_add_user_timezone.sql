-- ═══════════════════════════════════════════════════════════════════
-- Migration 011: Update Daily Activity Trigger for Timezone Support
-- ═══════════════════════════════════════════════════════════════════
--
-- Updates the update_daily_activity function to use the activity_date from the
-- inserted/updated row instead of CURRENT_DATE, enabling timezone-aware tracking.
-- This migration is idempotent and can be run multiple times safely.
--
-- Note: users.timezone column already exists from migration 009.

-- Update the trigger function to use activity_date from the inserted/updated row
-- instead of deriving it from CURRENT_DATE
CREATE OR REPLACE FUNCTION update_daily_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's last_study_date to match the activity_date being recorded
    -- This ensures timezone-aware streak tracking
    UPDATE users
    SET last_study_date = NEW.activity_date,
        updated_at = NOW()
    WHERE id = NEW.user_id 
      AND (last_study_date IS NULL OR last_study_date < NEW.activity_date);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_daily_activity() IS 'Updates user last_study_date from daily_activity row (timezone-aware)';

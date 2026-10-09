-- ═══════════════════════════════════════════════════════════════════
-- Migration 009: Add onboarding and daily goals tracking
-- ═══════════════════════════════════════════════════════════════════

-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_goal VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_hsk_level INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_hsk_level INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_minutes_goal INTEGER DEFAULT 15;
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_streak_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_study_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Create daily_activity table for tracking streaks and goals
CREATE TABLE IF NOT EXISTS daily_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    minutes_studied INTEGER DEFAULT 0,
    cards_reviewed INTEGER DEFAULT 0,
    new_words_learned INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    goal_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON daily_activity(activity_date);

-- Function to update daily activity
CREATE OR REPLACE FUNCTION update_daily_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's last_study_date
    UPDATE users
    SET last_study_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_activity_trigger
    AFTER INSERT OR UPDATE ON daily_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_activity();

-- Add helpful comments
COMMENT ON COLUMN users.learning_goal IS 'User learning goal: beginner, intermediate, advanced, hsk_exam, travel, business';
COMMENT ON COLUMN users.current_hsk_level IS 'Self-reported current HSK level (0-6, where 0 = complete beginner)';
COMMENT ON COLUMN users.target_hsk_level IS 'Target HSK level user wants to achieve';
COMMENT ON COLUMN users.daily_minutes_goal IS 'Daily study goal in minutes (default 15)';
COMMENT ON COLUMN users.study_streak_days IS 'Current consecutive days studying';

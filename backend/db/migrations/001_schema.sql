-- ═══════════════════════════════════════════════════════════════════
-- MandarinFlash — Complete Database Schema
-- Run against a fresh PostgreSQL database to set up all tables.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- Extensions
-- ───────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────────
-- Utility: auto-update updated_at on row changes
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────
-- Vocabulary
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chinese TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    pinyin_no_tones VARCHAR(255),
    english TEXT NOT NULL,
    part_of_speech VARCHAR(50),
    hsk_level INTEGER NOT NULL CHECK (hsk_level >= 0 AND hsk_level <= 6),
    tone_marks TEXT,
    example_sentences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_hsk_level ON vocabulary(hsk_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_chinese ON vocabulary(chinese);

CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON vocabulary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────
-- Users
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────
-- Email Verification Tokens
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_evt_expires_at ON email_verification_tokens(expires_at);

-- ───────────────────────────────────────────────────────────────────
-- Password Reset Tokens
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_expires_at ON password_reset_tokens(expires_at);

-- ───────────────────────────────────────────────────────────────────
-- User Sessions
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_us_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_us_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_us_expires_at ON user_sessions(expires_at);

-- ───────────────────────────────────────────────────────────────────
-- Quiz Results
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_type VARCHAR(20) NOT NULL CHECK (quiz_type IN ('practice', 'scored')),
    hsk_level INTEGER,
    total INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    card_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_user_created ON quiz_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_hsk_level ON quiz_results(hsk_level);

-- ───────────────────────────────────────────────────────────────────
-- User Vocabulary Progress (spaced repetition / SM-2)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    times_seen INTEGER NOT NULL DEFAULT 0,
    times_correct INTEGER NOT NULL DEFAULT 0,
    last_quality INTEGER,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_uvp_user_id ON user_vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_uvp_next_review ON user_vocabulary_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_uvp_vocabulary_id ON user_vocabulary_progress(vocabulary_id);

CREATE TRIGGER update_uvp_updated_at BEFORE UPDATE ON user_vocabulary_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────
-- Chat Messages
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cm_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_cm_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cm_user_conv ON chat_messages(user_id, conversation_id);

-- ───────────────────────────────────────────────────────────────────
-- Utility: cleanup expired tokens & sessions (called by background job)
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verification_tokens WHERE expires_at < NOW();
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

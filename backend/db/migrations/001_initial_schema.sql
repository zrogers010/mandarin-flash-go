-- Migration: 001_initial_schema.sql
-- Create initial database schema

CREATE TABLE IF NOT EXISTS vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chinese VARCHAR(50) NOT NULL UNIQUE,
    pinyin VARCHAR(100) NOT NULL,
    english VARCHAR(200) NOT NULL,
    part_of_speech VARCHAR(50),
    hsk_level INTEGER NOT NULL DEFAULT 0,
    example_sentences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_hsk_level ON vocabulary(hsk_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_chinese ON vocabulary(chinese); 
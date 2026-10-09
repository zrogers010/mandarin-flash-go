-- ═══════════════════════════════════════════════════════════════════
-- Migration 000: Schema Migrations Tracker
-- ═══════════════════════════════════════════════════════════════════
--
-- Creates the schema_migrations table to track applied migrations.
-- This migration is always run first and is idempotent.

CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Baseline: If this is an existing database (users table exists) but no
-- schema_migrations table, record migrations 001-006 as already applied.
-- This handles the transition for production databases.

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
        -- Existing production database - record baseline migrations
        INSERT INTO schema_migrations (filename, applied_at)
        VALUES
            ('001_initial_schema.sql', NOW()),
            ('002_add_redis_sessions.sql', NOW()),
            ('003_add_lessons_tables.sql', NOW()),
            ('004_add_chat_history_table.sql', NOW()),
            ('005_add_hsk_level_column.sql', NOW()),
            ('006_add_daily_activity.sql', NOW())
        ON CONFLICT (filename) DO NOTHING;
        
        RAISE NOTICE 'Baseline migrations 001-006 recorded for existing database';
    END IF;
END $$;

COMMENT ON TABLE schema_migrations IS 
    'Tracks which migration files have been applied to this database';

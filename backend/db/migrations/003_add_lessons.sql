-- ═══════════════════════════════════════════════════════════════════
-- Migration 003: Add lessons and lesson_vocabulary tables
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20),
    content TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_slug ON lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category);
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON lessons(difficulty);
CREATE INDEX IF NOT EXISTS idx_lessons_sort_order ON lessons(sort_order);

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS lesson_vocabulary (
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    PRIMARY KEY (lesson_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_lv_lesson_id ON lesson_vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lv_vocabulary_id ON lesson_vocabulary(vocabulary_id);

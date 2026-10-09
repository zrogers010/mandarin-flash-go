#!/usr/bin/env python3
"""
Idempotent HSK vocabulary seeder.

This script uses UPSERT (ON CONFLICT DO UPDATE) to safely update vocabulary data
without destroying existing word IDs or learner progress. The natural key is
(chinese, pinyin, hsk_level), which uniquely identifies each HSK word.

Key safety features:
- Never DELETE vocabulary words
- Preserves existing UUIDs (so URLs and progress records remain valid)
- Only updates english, traditional, example_sentences, and part_of_speech
- Safe to run repeatedly (idempotent)

Usage:
    python3 scripts/seed_hsk_vocabulary.py

Environment variables:
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import json
import os
import sys
import uuid
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip3 install psycopg2-binary")
    sys.exit(1)


def load_env():
    """Load .env file from project root if it exists."""
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val


def connect_db():
    """Connect to PostgreSQL using env vars."""
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=os.environ.get("DB_PORT", "5432"),
        dbname=os.environ.get("DB_NAME", "chinese_learning"),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASSWORD", "password"),
    )


def load_hsk_data():
    """
    Load HSK vocabulary data from JSON files or generate sample data.
    
    In production, this would load from actual HSK 2.0 data files.
    For now, returns a minimal dataset to demonstrate the upsert logic.
    """
    # TODO: Replace with actual HSK 2.0 JSON data loading
    # Expected format: List of dicts with chinese, pinyin, english, hsk_level, 
    # traditional (optional), part_of_speech (optional), example_sentences (list)
    
    # Minimal sample data for testing
    return [
        {
            "chinese": "你好",
            "traditional": "你好",
            "pinyin": "nǐ hǎo",
            "english": "hello | hi",
            "hsk_level": 1,
            "part_of_speech": "interjection",
            "example_sentences": [
                {"chinese": "你好！很高兴认识你。", "pinyin": "Nǐ hǎo! Hěn gāoxìng rènshi nǐ.", "english": "Hello! Nice to meet you."}
            ]
        },
        {
            "chinese": "谢谢",
            "traditional": "謝謝",
            "pinyin": "xiè xie",
            "english": "thank you | thanks",
            "hsk_level": 1,
            "part_of_speech": "verb",
            "example_sentences": [
                {"chinese": "谢谢你的帮助。", "pinyin": "Xièxie nǐ de bāngzhù.", "english": "Thank you for your help."}
            ]
        }
    ]


def seed_vocabulary(conn):
    """
    Upsert HSK vocabulary data.
    
    Uses ON CONFLICT (chinese, pinyin, hsk_level) DO UPDATE to:
    - Insert new words
    - Update existing words without changing their UUID
    - Preserve any word that has learner progress
    """
    hsk_data = load_hsk_data()
    
    if not hsk_data:
        print("No HSK data to seed.")
        return
    
    print(f"Seeding {len(hsk_data)} HSK vocabulary entries (idempotent upsert)...")
    
    with conn.cursor() as cur:
        for word in hsk_data:
            # Generate a deterministic UUID for new entries, but ON CONFLICT will preserve existing IDs
            word_id = str(uuid.uuid4())
            
            example_sentences_json = json.dumps(word.get("example_sentences", []))
            
            cur.execute("""
                INSERT INTO vocabulary (
                    id, chinese, traditional, pinyin, pinyin_no_tones, english, 
                    part_of_speech, hsk_level, example_sentences, created_at, updated_at
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
                ON CONFLICT (chinese, pinyin, hsk_level)
                DO UPDATE SET
                    english = EXCLUDED.english,
                    traditional = EXCLUDED.traditional,
                    part_of_speech = EXCLUDED.part_of_speech,
                    example_sentences = EXCLUDED.example_sentences,
                    updated_at = NOW()
                WHERE vocabulary.id = vocabulary.id
            """, (
                word_id,
                word["chinese"],
                word.get("traditional"),
                word["pinyin"],
                strip_tones(word["pinyin"]),
                word["english"],
                word.get("part_of_speech"),
                word["hsk_level"],
                example_sentences_json
            ))
    
    conn.commit()
    print("Vocabulary seeding complete (all IDs preserved).")


def strip_tones(pinyin):
    """Remove tone marks from pinyin for the pinyin_no_tones column."""
    replacements = {
        "ā": "a", "á": "a", "ǎ": "a", "à": "a",
        "ē": "e", "é": "e", "ě": "e", "è": "e",
        "ī": "i", "í": "i", "ǐ": "i", "ì": "i",
        "ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
        "ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
        "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü",
    }
    result = pinyin
    for tone, base in replacements.items():
        result = result.replace(tone, base)
    return result.lower().replace(" ", "")


def main():
    load_env()
    
    print("=== HSK Vocabulary Seeder (Idempotent) ===\n")
    
    conn = connect_db()
    seed_vocabulary(conn)
    conn.close()
    
    print("\n=== Seeding Complete ===")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Import CC-CEDICT dictionary into the MandarinFlash vocabulary table.

Downloads the CC-CEDICT file, parses it, and upserts entries into PostgreSQL:
- Existing HSK words: updates english/traditional, preserves example_sentences and hsk_level
- New words: inserts with hsk_level=0

Usage:
    python3 scripts/import_cedict.py

Requires: psycopg2-binary
    pip3 install psycopg2-binary

Environment variables (or .env file):
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import gzip
import os
import re
import sys
import urllib.request
import uuid
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip3 install psycopg2-binary")
    sys.exit(1)

CEDICT_URL = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
CEDICT_CACHE = Path(__file__).parent / "cedict_cache.txt.gz"

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


def download_cedict():
    """Download CC-CEDICT if not cached."""
    if CEDICT_CACHE.exists():
        print(f"  Using cached file: {CEDICT_CACHE}")
        return CEDICT_CACHE

    print(f"  Downloading from {CEDICT_URL} ...")
    urllib.request.urlretrieve(CEDICT_URL, CEDICT_CACHE)
    print(f"  Saved to {CEDICT_CACHE}")
    return CEDICT_CACHE


def parse_cedict_line(line):
    """
    Parse a single CC-CEDICT line.
    Format: Traditional Simplified [pinyin] /def1/def2/.../
    Returns dict or None for comments/blank lines.
    """
    line = line.strip()
    if not line or line.startswith("#"):
        return None

    match = re.match(r"^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$", line)
    if not match:
        return None

    traditional = match.group(1)
    simplified = match.group(2)
    pinyin_raw = match.group(3)
    defs_raw = match.group(4)

    pinyin = convert_pinyin(pinyin_raw)
    definitions = clean_definitions(defs_raw)

    if not definitions:
        return None

    return {
        "traditional": traditional,
        "simplified": simplified,
        "pinyin": pinyin,
        "english": "; ".join(definitions),
    }


def convert_pinyin(raw):
    """
    Convert numbered pinyin (e.g. 'ni3 hao3') to tone-marked pinyin.
    Falls back to the raw string if conversion isn't straightforward.
    """
    tone_map = {
        "a": ["ā", "á", "ǎ", "à"],
        "e": ["ē", "é", "ě", "è"],
        "i": ["ī", "í", "ǐ", "ì"],
        "o": ["ō", "ó", "ǒ", "ò"],
        "u": ["ū", "ú", "ǔ", "ù"],
        "ü": ["ǖ", "ǘ", "ǚ", "ǜ"],
        "v": ["ǖ", "ǘ", "ǚ", "ǜ"],
    }

    def convert_syllable(syl):
        syl = syl.replace("u:", "ü").replace("U:", "Ü")
        match = re.match(r"^([a-züÜA-Z]+)(\d)$", syl)
        if not match:
            return syl
        letters = match.group(1)
        tone = int(match.group(2))
        if tone == 5 or tone == 0:
            return letters

        lower = letters.lower()
        # Find the vowel to place the tone mark on (standard rules)
        # Priority: a/e always get it; ou -> o gets it; otherwise last vowel
        vowel_idx = -1
        vowel_char = ""
        for priority in ["a", "e"]:
            if priority in lower:
                vowel_idx = lower.index(priority)
                vowel_char = priority
                break
        if vowel_idx == -1:
            if "ou" in lower:
                vowel_idx = lower.index("o")
                vowel_char = "o"
            else:
                for j in range(len(lower) - 1, -1, -1):
                    if lower[j] in tone_map:
                        vowel_idx = j
                        vowel_char = lower[j]
                        break

        if vowel_idx == -1 or vowel_char not in tone_map:
            return letters

        marked = tone_map[vowel_char][tone - 1]
        if letters[vowel_idx].isupper():
            marked = marked.upper()

        return letters[:vowel_idx] + marked + letters[vowel_idx + 1:]

    syllables = raw.split()
    return " ".join(convert_syllable(s) for s in syllables)


def clean_definitions(raw):
    """Clean and filter CC-CEDICT definitions."""
    parts = raw.split("/")
    cleaned = []
    for d in parts:
        d = d.strip()
        if not d:
            continue
        # Skip classifier-only entries like "CL:家[jia1],個|个[ge4]"
        if d.startswith("CL:"):
            continue
        # Skip variant references like "variant of ..."
        if d.startswith("variant of "):
            continue
        # Skip "see also" references
        if d.startswith("see also "):
            continue
        # Skip "also written" references
        if d.startswith("also written "):
            continue
        # Strip inline classifier notes from definitions
        d = re.sub(r"\s*CL:[^\s,]+(?:,[^\s,]+)*", "", d).strip()
        # Skip old/archaic variants
        if d.startswith("old variant of "):
            continue
        if d:
            cleaned.append(d)
    return cleaned


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
    return re.sub(r"[1-5]", "", result)


def connect_db():
    """Connect to PostgreSQL using env vars."""
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=os.environ.get("DB_PORT", "5432"),
        dbname=os.environ.get("DB_NAME", "chinese_learning"),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASSWORD", "password"),
    )


def ensure_schema(conn):
    """Add traditional column and trigram indexes if they don't exist."""
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        cur.execute("""
            DO $$ BEGIN
                ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS traditional TEXT;
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$;
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_chinese_trgm ON vocabulary USING gin (chinese gin_trgm_ops);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_english_trgm ON vocabulary USING gin (english gin_trgm_ops);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_pinyin_trgm ON vocabulary USING gin (pinyin gin_trgm_ops);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_traditional ON vocabulary(traditional);")
    conn.commit()
    print("  Schema updated (traditional column + trigram indexes)")


def load_existing_entries(conn):
    """Load existing vocabulary entries keyed by (chinese, pinyin_no_tones)."""
    with conn.cursor() as cur:
        cur.execute("SELECT id, chinese, pinyin, pinyin_no_tones, hsk_level FROM vocabulary")
        rows = cur.fetchall()

    existing = {}
    for row in rows:
        vid, chinese, pinyin, pinyin_no_tones, hsk_level = row
        key = (chinese, (pinyin_no_tones or strip_tones(pinyin)).lower().replace(" ", ""))
        existing[key] = {"id": vid, "hsk_level": hsk_level}
    return existing


def main():
    load_env()

    print("=== CC-CEDICT Import ===\n")

    print("[1/4] Downloading CC-CEDICT...")
    gz_path = download_cedict()

    print("[2/4] Parsing entries...")
    entries = []
    with gzip.open(gz_path, "rt", encoding="utf-8") as f:
        for line in f:
            parsed = parse_cedict_line(line)
            if parsed:
                entries.append(parsed)
    print(f"  Parsed {len(entries)} entries")

    print("[3/4] Connecting to database...")
    conn = connect_db()
    ensure_schema(conn)

    existing = load_existing_entries(conn)
    print(f"  Found {len(existing)} existing vocabulary entries")

    print("[4/4] Importing...")
    updated = 0
    inserted = 0
    skipped = 0
    batch_size = 500

    insert_rows = []
    update_rows = []

    for entry in entries:
        pinyin_no_tones = strip_tones(entry["pinyin"]).lower().replace(" ", "")
        key = (entry["simplified"], pinyin_no_tones)

        if key in existing:
            ex = existing[key]
            update_rows.append((
                entry["english"],
                entry["traditional"],
                ex["id"],
            ))
        else:
            insert_rows.append((
                str(uuid.uuid4()),
                entry["simplified"],
                entry["traditional"],
                entry["pinyin"],
                strip_tones(entry["pinyin"]),
                entry["english"],
                0,  # hsk_level
            ))

    with conn.cursor() as cur:
        # Batch updates
        for i in range(0, len(update_rows), batch_size):
            batch = update_rows[i:i + batch_size]
            psycopg2.extras.execute_batch(cur, """
                UPDATE vocabulary
                SET english = %s, traditional = %s, updated_at = NOW()
                WHERE id = %s
            """, batch)
            updated += len(batch)

        # Batch inserts
        for i in range(0, len(insert_rows), batch_size):
            batch = insert_rows[i:i + batch_size]
            psycopg2.extras.execute_batch(cur, """
                INSERT INTO vocabulary (id, chinese, traditional, pinyin, pinyin_no_tones, english, hsk_level)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, batch)
            inserted += len(batch)

    conn.commit()
    conn.close()

    print(f"\n=== Import Complete ===")
    print(f"  Updated (HSK words enhanced): {updated}")
    print(f"  Inserted (new dictionary entries): {inserted}")
    print(f"  Total entries now: {updated + inserted + (len(existing) - updated)}")


if __name__ == "__main__":
    main()

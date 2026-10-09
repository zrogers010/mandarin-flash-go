#!/usr/bin/env python3
"""
Apply manual corrections to HSK vocabulary.

Reads hsk_corrections.json and applies fixes for:
- Wrong English definitions (polyphone mismatches)
- Wrong traditional forms
- Wrong pinyin
- Duplicate entries

Usage:
    python3 scripts/apply_corrections.py

Environment variables:
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import json
import os
import sys
from pathlib import Path

try:
    import psycopg2
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


def apply_corrections():
    """Apply corrections from hsk_corrections.json."""
    load_env()
    
    corrections_file = Path(__file__).parent / "hsk_corrections.json"
    if not corrections_file.exists():
        print(f"ERROR: {corrections_file} not found")
        return 1
    
    with open(corrections_file) as f:
        data = json.load(f)
    
    corrections = data.get("corrections", [])
    print(f"=== Applying {len(corrections)} Corrections ===\n")
    
    conn = connect_db()
    cur = conn.cursor()
    
    applied = 0
    skipped = 0
    
    for correction in corrections:
        chinese = correction["chinese"]
        pinyin = correction.get("pinyin", "")
        
        # Find the word in vocabulary
        cur.execute(
            "SELECT id, english, traditional, pinyin FROM vocabulary WHERE chinese = %s AND hsk_level BETWEEN 1 AND 6",
            (chinese,)
        )
        rows = cur.fetchall()
        
        if not rows:
            print(f"⚠️  {chinese}: Not found in HSK vocabulary, skipping")
            skipped += 1
            continue
        
        # If multiple rows, find the one matching pinyin
        target_row = None
        if len(rows) == 1:
            target_row = rows[0]
        elif pinyin:
            for row in rows:
                if row[3] == pinyin:
                    target_row = row
                    break
        
        if not target_row:
            print(f"⚠️  {chinese}: Could not match pinyin '{pinyin}', skipping")
            skipped += 1
            continue
        
        vid, current_english, current_trad, current_pinyin = target_row
        
        updates = []
        params = []
        
        # Apply English correction
        if "correct_english" in correction:
            updates.append("english = %s")
            params.append(correction["correct_english"])
        
        # Apply traditional correction
        if "correct_traditional" in correction:
            updates.append("traditional = %s")
            params.append(correction["correct_traditional"])
        
        # Apply pinyin correction
        if "correct_pinyin" in correction or (pinyin and pinyin != current_pinyin):
            correct_pinyin = correction.get("correct_pinyin", pinyin)
            updates.append("pinyin = %s")
            params.append(correct_pinyin)
        
        if updates:
            updates.append("updated_at = NOW()")
            params.append(vid)
            
            sql = f"UPDATE vocabulary SET {', '.join(updates)} WHERE id = %s"
            cur.execute(sql, params)
            
            note = correction.get("note", "")
            print(f"✅ {chinese} ({current_pinyin}): Applied corrections - {note}")
            applied += 1
        else:
            print(f"⏭️  {chinese}: No changes needed")
            skipped += 1
    
    # Handle duplicate 对 in HSK 2
    cur.execute("""
        SELECT id FROM vocabulary
        WHERE chinese = '对' AND hsk_level = 2
        ORDER BY created_at
        LIMIT 1 OFFSET 1
    """)
    dupe_row = cur.fetchone()
    if dupe_row:
        cur.execute("DELETE FROM vocabulary WHERE id = %s", (dupe_row[0],))
        print(f"✅ 对: Removed duplicate entry from HSK 2")
        applied += 1
    
    # Fix 'footbal' typo
    cur.execute("UPDATE vocabulary SET english = REPLACE(english, 'footbal', 'football') WHERE english LIKE '%footbal%'")
    if cur.rowcount > 0:
        print(f"✅ Fixed 'footbal' typo in {cur.rowcount} entries")
        applied += cur.rowcount
    
    conn.commit()
    conn.close()
    
    print(f"\n=== Complete ===")
    print(f"Applied: {applied}")
    print(f"Skipped: {skipped}")
    
    return 0


if __name__ == "__main__":
    sys.exit(apply_corrections())

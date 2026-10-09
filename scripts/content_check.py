#!/usr/bin/env python3
"""
Content quality checker for MandarinFlash HSK vocabulary.

Validates vocabulary data for common errors:
- Wrong traditional characters (你→妳, 千→韆, etc.)
- Wrong pinyin (bīngguǎn should be bīnguǎn)
- Missing neutral tones (péngyǒu should be péngyou)
- Incorrect 只 zhī vs zhǐ in examples
- Examples missing their headword
- Raw CEDICT markup like '[yi1 dian3]' in definitions
- Duplicate entries
- Typos

Usage:
    python3 scripts/content_check.py

Exits with code 1 if errors are found (for CI).
"""

import os
import re
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


# Known wrong traditional forms that should match simplified
WRONG_TRADITIONAL = {
    "你": "妳",      # 你好 should use 你, not 妳 (female "you")
    "千": "韆",      # 千 (thousand), not 韆 (swing)
    "秋": "鞦",      # 秋 (autumn), not 鞦 (swing)
    "和": "龢",      # 和 (and/harmony), not 龢 (harmony variant)
    "干": "幹",      # Context-dependent, but often wrong
    "玩": "翫",      # 玩 (play), not 翫 (play with/enjoy)
    "别": "彆",      # 别 (don't/other), not 彆 (awkward)
    "向": "曏",      # 向 (towards), not 曏 (variant)
    "克": "剋",      # 克 (gram/overcome), not 剋 (overcome variant)
    "升": "昇",      # 升 (liter/rise), not 昇 (rise variant)
    "呆": "獃",      # 呆 (dumb/stay), not 獃 (variant)
}

# Known pinyin errors (correct form)
PINYIN_ERRORS = {
    ("宾馆", "bīngguǎn"): "bīnguǎn",
    ("铅笔", "qiánbǐ"): "qiānbǐ",
    ("觉得", "juédé"): "juéde",
}

# Words that should have neutral tones (second syllable)
NEUTRAL_TONE_WORDS = {
    "朋友": "péngyou",   # not péngyǒu
    "喜欢": "xǐhuan",    # not xǐhuān
    "学生": "xuésheng",  # not xuéshēng
    "告诉": "gàosu",     # not gàosù
    "东西": "dōngxi",    # not dōngxī
    "桌子": "zhuōzi",    # not zhuōzǐ
    "椅子": "yǐzi",      # not yǐzǐ
    "房子": "fángzi",    # not fángzǐ
    "孩子": "háizi",     # not háizǐ
    "儿子": "érzi",      # not érzǐ
    "妻子": "qīzi",      # not qīzǐ
    "爸爸": "bàba",      # not bàbà
    "妈妈": "māma",      # not māmā
    "哥哥": "gēge",      # not gēgē
    "弟弟": "dìdi",      # not dìdì
    "姐姐": "jiějie",    # not jiějiě
    "妹妹": "mèimei",    # not mèimèi
    "爷爷": "yéye",      # not yéyé
    "奶奶": "nǎinai",    # not nǎinǎi
    "太太": "tàitai",    # not tàitài
    "先生": "xiānsheng", # not xiānshēng
    "小姐": "xiǎojie",   # not xiǎojiě
    "时候": "shíhou",    # not shíhòu
    "地方": "dìfang",    # not dìfāng
    "知道": "zhīdao",    # not zhīdào
    "明白": "míngbai",   # not míngbái
    "认识": "rènshi",    # not rènshí
    "马上": "mǎshàng",   # not mǎshàng (this one is OK)
    "什么": "shénme",    # not shénmə
    "怎么": "zěnme",     # not zěnmə
    "这么": "zhème",     # not zhèmə
    "那么": "nàme",      # not nàmə
    "多么": "duōme",     # not duōmə
    "这样": "zhèyang",   # not zhèyàng
    "那样": "nàyang",    # not nàyàng
    "意思": "yìsi",      # not yìsī (when meaning "meaning")
    "关系": "guānxi",    # not guānxì (when meaning "relationship")
}


def check_content_quality():
    """Run all content quality checks."""
    load_env()
    
    errors = []
    warnings = []
    
    print("=== Content Quality Check ===\n")
    
    conn = connect_db()
    cur = conn.cursor()
    
    # Get all HSK vocabulary (levels 1-6)
    cur.execute("""
        SELECT id, chinese, traditional, pinyin, english, hsk_level, example_sentences
        FROM vocabulary
        WHERE hsk_level BETWEEN 1 AND 6
        ORDER BY hsk_level, chinese
    """)
    
    vocab = cur.fetchall()
    print(f"Checking {len(vocab)} HSK words...\n")
    
    # Check 1: Wrong traditional forms
    print("[1/7] Checking traditional forms...")
    for row in vocab:
        vid, chinese, traditional, pinyin, english, hsk_level, examples = row
        if chinese in WRONG_TRADITIONAL:
            if traditional == WRONG_TRADITIONAL[chinese]:
                errors.append(f"HSK {hsk_level} {chinese} ({pinyin}): Wrong traditional '{traditional}', should be '{chinese}'")
    
    # Check 2: Pinyin errors
    print("[2/7] Checking pinyin...")
    for row in vocab:
        vid, chinese, traditional, pinyin, english, hsk_level, examples = row
        key = (chinese, pinyin)
        if key in PINYIN_ERRORS:
            errors.append(f"HSK {hsk_level} {chinese}: Wrong pinyin '{pinyin}', should be '{PINYIN_ERRORS[key]}'")
    
    # Check 3: Neutral tones
    print("[3/7] Checking neutral tones...")
    for row in vocab:
        vid, chinese, traditional, pinyin, english, hsk_level, examples = row
        if chinese in NEUTRAL_TONE_WORDS:
            expected = NEUTRAL_TONE_WORDS[chinese]
            if pinyin != expected:
                warnings.append(f"HSK {hsk_level} {chinese}: Pinyin '{pinyin}' should probably be '{expected}' (neutral tone)")
    
    # Check 4: 只 zhǐ vs zhī (measure word should be zhī)
    print("[4/7] Checking 只 pronunciation in examples...")
    for row in vocab:
        vid, chinese, traditional, pinyin, english, hsk_level, examples = row
        if examples and isinstance(examples, str):
            # Look for patterns like "一只猫" with "zhǐ" instead of "zhī"
            if '只' in examples and 'zhǐ' in examples.lower():
                # Check if it's used as a measure word (一只, 两只, etc.)
                if re.search(r'[一二三四五六七八九十百千万0-9]+只', examples):
                    errors.append(f"HSK {hsk_level} {chinese}: Example contains 只 with wrong tone (should be zhī as measure word)")
    
    # Check 5: Examples missing headword
    print("[5/7] Checking examples contain headword...")
    for row in vocab:
        vid, chinese, traditional, pinyin, english, hsk_level, examples = row
        if examples and isinstance(examples, str) and chinese not in examples:
            # Parse JSON if possible
            import json
            try:
                examples_list = json.loads(examples)
                has_headword = any(chinese in ex.get('chinese', '') for ex in examples_list if isinstance(ex, dict))
                if not has_headword:
                    errors.append(f"HSK {hsk_level} {chinese}: Example sentences don't contain the headword")
            except:
                if chinese not in examples:
                    errors.append(f"HSK {hsk_level} {chinese}: Example sentences don't contain the headword")
    
    # Check 6: Raw CEDICT markup in definitions
    print("[6/7] Checking for raw CEDICT markup...")
    for row in vocab:
        vid, chinese, traditional, pinyin, english, hsk_level, examples = row
        if re.search(r'\[[\w\d]+\]', english):
            errors.append(f"HSK {hsk_level} {chinese}: Raw CEDICT markup in definition: {english[:100]}")
        if 'also pr.' in english.lower() or 'taiwan pr.' in english.lower():
            warnings.append(f"HSK {hsk_level} {chinese}: Definition contains pronunciation note: {english[:80]}")
    
    # Check 7: Duplicates in HSK levels
    print("[7/7] Checking for duplicates...")
    cur.execute("""
        SELECT chinese, hsk_level, COUNT(*)
        FROM vocabulary
        WHERE hsk_level BETWEEN 1 AND 6
        GROUP BY chinese, hsk_level
        HAVING COUNT(*) > 1
    """)
    dupes = cur.fetchall()
    for chinese, level, count in dupes:
        errors.append(f"HSK {level} has {count} entries for '{chinese}' (duplicate)")
    
    # Check 8: Known typos
    print("[8/8] Checking for known typos...")
    cur.execute("SELECT chinese, english FROM vocabulary WHERE english LIKE '%footbal%'")
    for chinese, english in cur.fetchall():
        errors.append(f"{chinese}: Typo 'footbal' should be 'football'")
    
    conn.close()
    
    # Report results
    print(f"\n=== Results ===")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    
    if errors:
        print("\n🚨 ERRORS (must fix):")
        for err in errors[:50]:  # Limit output
            print(f"  ❌ {err}")
        if len(errors) > 50:
            print(f"  ... and {len(errors) - 50} more")
    
    if warnings:
        print("\n⚠️  WARNINGS (should review):")
        for warn in warnings[:20]:
            print(f"  ⚠️  {warn}")
        if len(warnings) > 20:
            print(f"  ... and {len(warnings) - 20} more")
    
    if not errors and not warnings:
        print("\n✅ All checks passed!")
        return 0
    elif errors:
        print(f"\n❌ {len(errors)} errors found - content quality needs improvement")
        return 1
    else:
        print(f"\n⚠️  {len(warnings)} warnings - content is acceptable but could be improved")
        return 0


if __name__ == "__main__":
    sys.exit(check_content_quality())

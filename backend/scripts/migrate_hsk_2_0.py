#!/usr/bin/env python3
"""
Script to migrate HSK 2.0 vocabulary data from website_hskvocab table to our vocabulary table.
This script reads from the existing db.sqlite3 file and creates SQL INSERT statements.
"""

import sqlite3
import json
import uuid
from datetime import datetime

def connect_to_db():
    """Connect to the database file"""
    return sqlite3.connect('db.sqlite3')

def get_hsk_2_0_vocabulary():
    """Extract HSK 2.0 vocabulary data (levels 1-4)"""
    conn = connect_to_db()
    cursor = conn.cursor()
    
    # Get all HSK 2.0 vocabulary (levels 1-4)
    cursor.execute("""
        SELECT id, unicode, pinyin, english, partofspeech, pinyin2, level 
        FROM website_hskvocab 
        WHERE level <= 4 
        ORDER BY level, id
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return rows

def convert_unicode_to_chinese(unicode_str):
    """Convert HTML entity format to actual Chinese characters"""
    # Handle common HTML entities for Chinese characters
    unicode_mapping = {
        '&#x7684;': '的',  # de
        '&#x4F60;': '你',  # ni
        '&#x6211;': '我',  # wo
        '&#x662F;': '是',  # shi
        '&#x4E0D;': '不',  # bu
        # Add more mappings as needed
    }
    
    if unicode_str in unicode_mapping:
        return unicode_mapping[unicode_str]
    
    # Try to parse as hex unicode
    if unicode_str.startswith('&#x') and unicode_str.endswith(';'):
        try:
            hex_code = unicode_str[3:-1]
            return chr(int(hex_code, 16))
        except:
            pass
    
    return unicode_str

def create_example_sentences(english, chinese, pinyin):
    """Create simple example sentences structure"""
    # For now, create a basic structure
    # In a real implementation, you might want to parse the english field for multiple meanings
    sentences = [
        {
            "chinese": chinese,
            "pinyin": pinyin,
            "english": english.split(',')[0].strip() if ',' in english else english
        }
    ]
    return json.dumps(sentences)

def generate_migration_sql():
    """Generate SQL migration for HSK 2.0 vocabulary"""
    vocabulary_data = get_hsk_2_0_vocabulary()
    
    print("-- Migration: 003_add_hsk_2_0_vocabulary.sql")
    print("-- Add HSK 2.0 vocabulary data (levels 1-4)")
    print()
    
    # First, clear existing HSK 1-4 data if it exists
    print("-- Clear existing HSK 1-4 vocabulary data")
    print("DELETE FROM vocabulary WHERE hsk_level <= 4;")
    print()
    
    # Insert new HSK 2.0 data
    print("-- Insert HSK 2.0 vocabulary data")
    print("INSERT INTO vocabulary (id, chinese, pinyin, english, part_of_speech, hsk_level, example_sentences, created_at, updated_at) VALUES")
    
    values = []
    for row in vocabulary_data:
        old_id, unicode_str, pinyin, english, part_of_speech, pinyin2, level = row
        
        # Convert unicode to Chinese characters
        chinese = convert_unicode_to_chinese(unicode_str)
        
        # Generate UUID
        new_id = str(uuid.uuid4())
        
        # Create example sentences
        example_sentences = create_example_sentences(english, chinese, pinyin)
        
        # Clean up part of speech
        pos = part_of_speech if part_of_speech else 'unknown'
        
        # Clean up English (remove HTML entities and clean up)
        clean_english = english.replace('&#x27;', "'").replace('&#x2C;', ',').replace('&#x3B;', ';')
        
        value = f"('{new_id}', '{chinese}', '{pinyin}', '{clean_english}', '{pos}', {level}, '{example_sentences}', NOW(), NOW())"
        values.append(value)
    
    # Print all values
    for i, value in enumerate(values):
        if i == len(values) - 1:
            print(f"{value};")
        else:
            print(f"{value},")
    
    print()
    print(f"-- Total vocabulary items added: {len(values)}")
    
    # Print summary by level
    level_counts = {}
    for row in vocabulary_data:
        level = row[6]
        level_counts[level] = level_counts.get(level, 0) + 1
    
    print("-- Breakdown by HSK level:")
    for level in sorted(level_counts.keys()):
        print(f"-- HSK Level {level}: {level_counts[level]} items")

if __name__ == "__main__":
    generate_migration_sql()

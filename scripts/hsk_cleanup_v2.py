#!/usr/bin/env python3
"""
Generate migration 012 and append learner-friendly HSK corrections.

Source of truth for this cleanup pass. Re-run:
    python3 scripts/hsk_cleanup_v2.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIGRATION = ROOT / "backend/db/migrations/012_hsk_content_cleanup.sql"
CORRECTIONS = ROOT / "scripts/hsk_corrections.json"

# Learner-facing primary senses. Strip CEDICT markup, Kangxi notes, rare
# literary senses, and lead with the meaning a student actually needs.
DEFS: dict[str, tuple[str, str, str]] = {
    # chinese: (pinyin, english, note)
    "一": ("yī", "one | a | whole", "Drop Kangxi / yao1 spelling note"),
    "一点儿": ("yīdiǎnr", "a little | a bit", "Replace CEDICT erhua markup"),
    "上": ("shàng", "up | on | above | to attend (class)", "Lead with spatial/attend senses"),
    "下": ("xià", "down | below | next | to get off", "Shorten encyclopedic CEDICT gloss"),
    "不": ("bù", "not | no", "Drop bound-form note"),
    "个": ("gè", "generic measure word", "Learner classifier gloss"),
    "他": ("tā", "he | him", "Drop bound-form 'other' sense"),
    "会": ("huì", "can | to know how to | meeting", "Primary HSK senses"),
    "做": ("zuò", "to do | to make | to be", "Shorten long CEDICT list"),
    "前面": ("qiánmiàn", "in front | ahead", "Drop also-pr note"),
    "北京": ("Běijīng", "Beijing", "Drop municipality/abbr gloss"),
    "去": ("qù", "to go | to go to", "Primary motion sense"),
    "号": ("hào", "number | date | size", "HSK uses number/date/size"),
    "听": ("tīng", "to listen | to hear", "Drop tin-can / literary senses"),
    "呢": ("ne", "question particle (and…? / what about…?)", "One learner gloss"),
    "多": ("duō", "many | much | more | how…", "Drop Taiwan-pr / poly- note"),
    "大": ("dà", "big | large | old (age)", "Drop dialect father/uncle"),
    "家": ("jiā", "home | family | -ist (specialist)", "Lead with home/family"),
    "开": ("kāi", "to open | to start | to turn on | to drive", "Drop Kelvin/carat"),
    "有": ("yǒu", "to have | there is", "Drop bound-form morphology"),
    "本": ("běn", "measure word for books | this | origin", "Lead with classifier"),
    "来": ("lái", "to come", "Primary motion sense"),
    "水": ("shuǐ", "water", "Drop river/shoddy/income senses"),
    "点": ("diǎn", "o'clock | a bit | to order | dot", "HSK clock/bit/order"),
    "的": ("de", "possessive / attributive particle", "One grammar gloss"),
    "看": ("kàn", "to look | to see | to read | to watch", "Primary senses"),
    "说": ("shuō", "to speak | to say | to explain", "Drop doctrine sense"),
    "谁": ("shéi", "who", "Drop also-pr shuí"),
    "里面": ("lǐmiàn", "inside", "Drop also-pr note"),
    "钱": ("qián", "money", "Drop tael weight"),
    "两": ("liǎng", "two | both | tael (50g)", "Keep tael as secondary"),
    "也": ("yě", "also | too | even", "Drop literary particle"),
    "从": ("cóng", "from | through", "Lead with preposition"),
    "再": ("zài", "again | then | more", "Primary adverb senses"),
    "出": ("chū", "to go out | to come out | to produce", "Drop opera classifier"),
    "到": ("dào", "to arrive | to reach | until", "Primary senses"),
    "咖啡": ("kāfēi", "coffee", "Drop '(loanword)' prefix"),
    "对": ("duì", "correct | right | toward | to face", "Shorten long CEDICT list"),
    "就": ("jiù", "then | right away | just | only", "Learner grammar senses"),
    "快": ("kuài", "fast | quick | soon", "Drop knife/wit senses"),
    "您": ("nín", "you (polite)", "Plain polite-you gloss"),
    "意思": ("yìsi", "meaning | idea | interesting (有意思)", "HSK senses"),
    "新": ("xīn", "new", "Drop meso- chemistry"),
    "最": ("zuì", "most | -est", "Drop 世界之最 example dump"),
    "机场": ("jīchǎng", "airport", "Drop Shadowsocks slang"),
    "次": ("cì", "time(s) | next", "Lead with classifier"),
    "比": ("bǐ", "to compare | than", "Drop Taiwan-pr note"),
    "白": ("bái", "white | blank | in vain", "Drop political/opera senses"),
    "知道": ("zhīdao", "to know", "Drop also-pr note"),
    "离": ("lí", "away from | to leave", "Drop trigram / ☲"),
    "等": ("děng", "to wait | etc. | grade", "Primary senses"),
    "给": ("gěi", "to give | for | to", "Lead with give/for"),
    "要": ("yào", "to want | to need | will | must", "HSK senses"),
    "让": ("ràng", "to let | to make | to allow", "Lead with let/make"),
    "贵": ("guì", "expensive | precious | honorable", "Shorten bound-form notes"),
    "走": ("zǒu", "to walk | to go | to leave", "Drop euphemism/die"),
    "过": ("guò", "experiential particle (have …ed) | to pass", "Replace grammar-jargon lead"),
    "进": ("jìn", "to enter | to go in | to advance", "Drop math-base sense"),
    "错": ("cuò", "wrong | mistake", "Primary senses"),
    "长": ("cháng", "long", "Drop literary surplus / Taiwan-pr"),
    "门": ("mén", "door | gate | measure word for subjects", "Drop Watergate / phylum"),
    "阴": ("yīn", "overcast | cloudy | Yin", "Drop genitalia"),
    "零": ("líng", "zero", "Primary numeral"),
    "鱼": ("yú", "fish", "Drop non-fish aquatic dump"),
    "一会儿": ("yíhuìr", "a little while | in a moment", "Drop also-pr note"),
    "借": ("jiè", "to borrow | to lend", "Shorten 给/出 combination note"),
    "元": ("yuán", "yuan (currency) | first | unit", "HSK money/unit"),
    "先": ("xiān", "first | in advance | earlier", "Primary adverb"),
    "关": ("guān", "to close | to turn off | to concern", "Do not lead with mountain pass"),
    "刚才": ("gāngcái", "just now", "Replace variant-of markup; trad 剛才"),
    "包": ("bāo", "bag | package | to wrap", "Primary senses"),
    "太阳": ("tàiyáng", "sun | sunshine", "Drop temple-abbr"),
    "差": ("chà", "poor | not good | to lack | difference", "Drop Taiwan-pr"),
    "带": ("dài", "to bring | to take | belt | zone", "Primary senses"),
    "拿": ("ná", "to take | to hold", "Drop 把-comparison note"),
    "接": ("jiē", "to receive | to meet | to connect", "Primary senses"),
    "教": ("jiāo", "to teach", "HSK verb sense"),
    "特别": ("tèbié", "especially | special | particularly", "Drop 是-pattern note"),
    "用": ("yòng", "to use", "Primary verb"),
    "画": ("huà", "to draw | painting | picture", "Drop 划-variant dump"),
    "着急": ("zháojí", "anxious | worried | in a hurry", "Drop Taiwan-pr"),
    "笔记本": ("bǐjìběn", "notebook | laptop", "Drop CEDICT abbr dump"),
    "老": ("lǎo", "old | always | prefix for names", "Primary senses"),
    "节目": ("jiémù", "program | show", "Primary noun"),
    "被": ("bèi", "passive particle (by) | quilt", "Lead with grammar, not quilt only"),
    "起来": ("qǐlái", "to stand up | (verb complement) start / up", "Shorten complement essay"),
    "超市": ("chāoshì", "supermarket", "Drop 超级市场 abbr markup"),
    "除了": ("chúle", "except | besides | in addition to", "Drop long example dump"),
    "鸟": ("niǎo", "bird", "Primary noun"),
    "专门": ("zhuānmén", "specialized | specially", "Primary senses"),
    "主意": ("zhǔyi", "idea | plan", "Drop Beijing-pr note"),
    "之": ("zhī", "literary 'of' (like 的)", "Drop CEDICT 的[de5] markup"),
    "乱": ("luàn", "messy | chaotic | randomly", "Primary senses"),
    "亚洲": ("yàzhōu", "Asia", "Drop 亚细亚洲 markup"),
    "作用": ("zuòyòng", "effect | function | to affect", "Drop 抑制 example"),
    "俩": ("liǎ", "two (colloquial)", "Drop 兩個 markup"),
    "倒": ("dào", "to pour | but | on the contrary | to fall", "HSK senses"),
    "刀": ("dāo", "knife", "Primary noun"),
    "厉害": ("lìhai", "formidable | sharp | serious", "Primary adjective"),
    "咱们": ("zánmen", "we (including you)", "Drop dialect / also-pr"),
    "场": ("chǎng", "site | field | measure word for events", "Primary senses"),
    "垃圾桶": ("lājītǒng", "trash can", "Drop Taiwan-pr"),
    "好处": ("hǎochù", "benefit | advantage", "Drop also-pr"),
    "寄": ("jì", "to mail | to send", "Lead with mail"),
    "尝": ("cháng", "to taste | to try", "Replace variant-of markup"),
    "巧克力": ("qiǎokèlì", "chocolate", "Drop '(loanword)' prefix"),
    "帅": ("shuài", "handsome | cool", "Lead with HSK adjective"),
    "幽默": ("yōumò", "humorous | humor", "Drop '(loanword)' prefix"),
    "底": ("dǐ", "bottom | end | base", "Drop math radix"),
    "座": ("zuò", "seat | measure word for buildings", "Drop archaic suffix"),
    "拉": ("lā", "to pull | to drag | to play (a bowed instrument)", "Replace 拉拉蛄-only gloss"),
    "挂": ("guà", "to hang | to hang up (the phone)", "Drop slang kill"),
    "挺": ("tǐng", "quite | very | to straighten", "Lead with quite/very"),
    "掉": ("diào", "to fall | to drop | (verb complement) off / away", "Shorten long list"),
    "接着": ("jiēzhe", "then | to continue | next", "Primary adverb"),
    "推": ("tuī", "to push | to postpone | to recommend", "Primary senses"),
    "提": ("tí", "to lift | to mention | to raise (an issue)", "Drop brush-stroke note"),
    "梦": ("mèng", "dream", "Fix truncated CEDICT"),
    "母亲": ("mǔqīn", "mother", "Drop also-pr"),
    "毛": ("máo", "hair | fur | 0.1 yuan", "HSK senses"),
    "活动": ("huódòng", "activity | event | to move about", "Fix truncated CEDICT"),
    "火": ("huǒ", "fire | hot (popular)", "Drop Kangxi radical"),
    "照": ("zhào", "according to | to shine | to photograph", "Primary senses"),
    "父亲": ("fùqīn", "father", "Drop also-pr"),
    "直接": ("zhíjiē", "direct | immediately", "Drop 间接 markup"),
    "破": ("pò", "broken | to break", "Primary senses"),
    "节": ("jié", "festival | section | to save | measure word", "Drop knot/nautical"),
    "下载": ("xiàzài", "to download", "Drop also-pr"),
    "与其": ("yǔqí", "rather than (与其…不如…)", "Plain pattern gloss"),
    "主动": ("zhǔdòng", "to take the initiative | active", "Drop 被动 markup"),
    "乙": ("yǐ", "second (Heavenly Stem) | B", "Drop compass/ethyl"),
    "似的": ("shìde", "like | as if", "Drop Taiwan-pr"),
    "作为": ("zuòwéi", "as | to serve as | conduct", "Primary senses"),
    "使劲儿": ("shǐjìnr", "to put in effort | to exert oneself", "Replace erhua markup"),
    "便": ("biàn", "convenient | then | informal", "Drop bathroom sense as lead"),
    "俱乐部": ("jùlèbù", "club", "Drop '(loanword)' prefix"),
    "切": ("qiē", "to cut | to slice", "HSK is qiē 'cut', not qiè"),
    "则": ("zé", "then | but | rule | measure word for news items", "Shorten literary essay"),
    "升": ("shēng", "to rise | to promote | liter", "Replace 陞-variant markup"),
    "发挥": ("fāhuī", "to bring into play | to give full play to", "Primary verb"),
    "发票": ("fāpiào", "invoice | receipt", "Drop 统一发票 markup"),
    "吨": ("dūn", "ton", "Drop Taiwan-pr / loanword tag"),
    "呆": ("dāi", "dull | blank | to stay", "Replace 獃-variant markup"),
    "周到": ("zhōudào", "thoughtful | considerate", "Drop also-pr"),
    "圆": ("yuán", "round | circle | yuan", "Primary senses"),
    "墙": ("qiáng", "wall", "Drop slang/GFW sense"),
    "大厦": ("dàshà", "mansion | large building", "Drop Broadway/Empire dump"),
    "套": ("tào", "set | to cover | measure word for sets", "Drop Greek tau"),
    "学问": ("xuéwen", "learning | knowledge", "Fix truncated CEDICT"),
    "尽快": ("jǐnkuài", "as soon as possible", "Replace see-also markup"),
    "尾巴": ("wěiba", "tail", "Drop colloquial-pr note"),
    "干活儿": ("gànhuór", "to work | to do manual work", "Replace erhua markup"),
    "平": ("píng", "flat | level | peaceful | to tie (a game)", "Drop 平声 abbr"),
}

# Traditional form fixes (wrong CEDICT variant).
TRAD: dict[str, str] = {
    "刚才": "剛才",  # not 剛纔
    "尝": "嘗",
    "升": "升",
    "呆": "呆",
    "拉": "拉",
}

SENTENCE_FIXES = [
    # Measure-word 只 is zhī, not zhǐ. Sandhi: yī + first-tone zhī → yì zhī.
    {
        "chinese_word": "小",
        "sentence": "这只猫很小",
        "old_pinyin": "zhè zhǐ māo hěn xiǎo",
        "new_pinyin": "Zhè zhī māo hěn xiǎo",
    },
    {
        "chinese_word": "狗",
        "sentence": "他有一只狗",
        "old_pinyin": "tā yǒu yī zhǐ gǒu",
        "new_pinyin": "Tā yǒu yì zhī gǒu",
    },
    {
        "chinese_word": "狗",
        "sentence": "这只狗多大?",
        "old_pinyin": "zhè zhǐ gǒu duō dà ?",
        "new_pinyin": "Zhè zhī gǒu duō dà?",
    },
    {
        "chinese_word": "猫",
        "sentence": "我有一只猫",
        "old_pinyin": "wǒ yǒu yī zhǐ māo",
        "new_pinyin": "Wǒ yǒu yì zhī māo",
    },
]

WELCOME_SENTENCES = [
    {"chinese": "欢迎光临！", "pinyin": "Huānyíng guānglín!", "english": "Welcome!"},
    {"chinese": "你们欢迎新成员吗？", "pinyin": "Nǐmen huānyíng xīn chéngyuán ma?", "english": "Do you welcome new members?"},
    {
        "chinese": "我们热烈欢迎来自世界各地的朋友参加活动。",
        "pinyin": "Wǒmen rèliè huānyíng láizì shìjiè gèdì de péngyǒu cānjiā huódòng.",
        "english": "We warmly welcome friends from all over the world to join the event.",
    },
]


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def generate_sql_v2() -> str:
    parts = []
    parts.append("""-- ═══════════════════════════════════════════════════════════════════
-- Migration 012: HSK content cleanup (learner definitions + 只 + 欢迎)
-- ═══════════════════════════════════════════════════════════════════
--
-- Idempotent. Targets HSK rows (hsk_level 1-6) only so CEDICT re-imports
-- of dictionary entries (hsk_level 0) are not overwritten.
--
-- Example-sentence pinyin convention:
--   * Apply tone sandhi in running text (yī gè → yí gè, yī bǎi → yì bǎi).
--   * Capitalize the first word and proper nouns (Hànyǔ, Zhōngguó, Běijīng).
--   * Measure-word 只 is zhī (not the adverb zhǐ 'only').

CREATE OR REPLACE FUNCTION mf_normalize_sentence_pinyin(p text) RETURNS text AS $$
DECLARE
    r text;
    i int;
    ch text;
BEGIN
    IF p IS NULL OR length(trim(p)) = 0 THEN
        RETURN p;
    END IF;
    r := p;
    -- Measure-word 只 after a number/demonstrative (not adverb 只 'only').
    r := regexp_replace(r, '(y[īíǐì]|liǎng|zhè|nà|jǐ)[[:space:]]+zhǐ', '\\1 zhī', 'gi');
    -- Tone sandhi for 一 before common classifiers / numerals.
    r := regexp_replace(r, 'yī[[:space:]]+gè', 'yí gè', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+ge', 'yí gè', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+kuài', 'yí kuài', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+jiàn', 'yí jiàn', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+cì', 'yí cì', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+wèi', 'yí wèi', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+suì', 'yí suì', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+yuè', 'yí yuè', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+zhī', 'yì zhī', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+bǎi', 'yì bǎi', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+xiē', 'yì xiē', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+diǎn', 'yì diǎn', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+zhāng', 'yì zhāng', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+tiáo', 'yì tiáo', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+běn', 'yì běn', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+tiān', 'yì tiān', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+nián', 'yì nián', 'g');
    r := regexp_replace(r, 'yī[[:space:]]+qiān', 'yì qiān', 'g');
    -- Proper nouns stored lowercase.
    r := regexp_replace(r, '\\yhànyǔ\\y', 'Hànyǔ', 'gi');
    r := regexp_replace(r, '\\yzhōngwén\\y', 'Zhōngwén', 'gi');
    r := regexp_replace(r, '\\yzhōngguó\\y', 'Zhōngguó', 'gi');
    r := regexp_replace(r, '\\yběijīng\\y', 'Běijīng', 'gi');
    r := regexp_replace(r, '\\yshànghǎi\\y', 'Shànghǎi', 'gi');
    -- Capitalize first alphabetic character.
    i := 1;
    WHILE i <= char_length(r) LOOP
        ch := substr(r, i, 1);
        IF ch ~ '[[:alpha:]]' THEN
            r := substr(r, 1, i - 1) || upper(ch) || substr(r, i + 1);
            EXIT;
        END IF;
        i := i + 1;
    END LOOP;
    RETURN r;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

""")

    parts.append("-- Learner-friendly definitions (and a few traditional-form fixes)\n")
    for chinese, (pinyin, english, note) in DEFS.items():
        sets = [f"english = {sql_str(english)}"]
        if chinese in TRAD:
            sets.append(f"traditional = {sql_str(TRAD[chinese])}")
        parts.append(f"-- {chinese}: {note}\n")
        parts.append("UPDATE vocabulary\n")
        parts.append(f"SET {', '.join(sets)}, updated_at = NOW()\n")
        parts.append(
            f"WHERE chinese = {sql_str(chinese)} AND pinyin = {sql_str(pinyin)} "
            "AND hsk_level BETWEEN 1 AND 6;\n\n"
        )

    parts.append("-- Explicit measure-word 只 sentence fixes (zhǐ → zhī)\n")
    for fix in SENTENCE_FIXES:
        parts.append(f"""UPDATE vocabulary
SET example_sentences = (
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN s->>'chinese' = {sql_str(fix['sentence'])}
            THEN jsonb_set(s, '{{pinyin}}', to_jsonb({sql_str(fix['new_pinyin'])}::text))
            ELSE s
        END
    ), example_sentences)
    FROM jsonb_array_elements(COALESCE(example_sentences, '[]'::jsonb)) s
),
    updated_at = NOW()
WHERE chinese = {sql_str(fix['chinese_word'])}
  AND hsk_level BETWEEN 1 AND 6
  AND example_sentences::text LIKE {'%' + fix['sentence'] + '%' !r};
""")

    parts.append("""-- Apply pinyin convention across remaining HSK example sentences.
UPDATE vocabulary
SET example_sentences = (
    SELECT COALESCE(jsonb_agg(
        jsonb_set(s, '{pinyin}', to_jsonb(mf_normalize_sentence_pinyin(s->>'pinyin')))
        ORDER BY ordinality
    ), example_sentences)
    FROM jsonb_array_elements(COALESCE(example_sentences, '[]'::jsonb)) WITH ORDINALITY AS t(s, ordinality)
),
    updated_at = NOW()
WHERE hsk_level BETWEEN 1 AND 6
  AND example_sentences IS NOT NULL
  AND jsonb_typeof(example_sentences) = 'array'
  AND jsonb_array_length(example_sentences) > 0;

""")

    welcome_json = json.dumps(WELCOME_SENTENCES, ensure_ascii=False)
    parts.append(f"""-- Official HSK 2.0 Level-2 word 欢迎 is stored at HSK 3 in this DB.
-- Natural key (chinese, traditional, pinyin) is unique, so move the row
-- rather than inserting a duplicate.
UPDATE vocabulary
SET hsk_level = 2, english = 'to welcome | welcome', traditional = '歡迎',
    pinyin = 'huānyíng', pinyin_no_tones = 'huanying', updated_at = NOW()
WHERE chinese = '欢迎'
  AND hsk_level BETWEEN 1 AND 6
  AND hsk_level <> 2
  AND NOT EXISTS (SELECT 1 FROM vocabulary WHERE chinese = '欢迎' AND hsk_level = 2);

INSERT INTO vocabulary (
    id, chinese, traditional, pinyin, pinyin_no_tones, english,
    part_of_speech, hsk_level, example_sentences, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    '欢迎',
    '歡迎',
    'huānyíng',
    'huanying',
    'to welcome | welcome',
    'verb',
    2,
    {sql_str(welcome_json)}::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM vocabulary WHERE chinese = '欢迎' AND hsk_level BETWEEN 1 AND 6
);

-- Keep the SQL helper; apply_corrections.py does not depend on it.
-- Migration is safe to re-run: UPDATEs set the same values; INSERT is guarded.
""")
    return "".join(parts)


def update_corrections_json() -> None:
    data = json.loads(CORRECTIONS.read_text())
    existing = {(c["chinese"], c.get("pinyin")) for c in data.get("corrections", [])}
    added = []
    for chinese, (pinyin, english, note) in DEFS.items():
        key = (chinese, pinyin)
        if key in existing:
            # Refresh english on this cleanup pass if we already have a row.
            for c in data["corrections"]:
                if c["chinese"] == chinese and c.get("pinyin") == pinyin:
                    c["correct_english"] = english
                    if chinese in TRAD:
                        c["correct_traditional"] = TRAD[chinese]
                    if note:
                        c["note"] = note
            continue
        row = {
            "chinese": chinese,
            "pinyin": pinyin,
            "correct_english": english,
            "note": note,
        }
        if chinese in TRAD:
            row["correct_traditional"] = TRAD[chinese]
        data["corrections"].append(row)
        added.append(chinese)

    data["sentence_fixes"] = SENTENCE_FIXES
    data["inserts"] = [
        {
            "chinese": "欢迎",
            "traditional": "歡迎",
            "pinyin": "huānyíng",
            "pinyin_no_tones": "huanying",
            "english": "to welcome | welcome",
            "part_of_speech": "verb",
            "hsk_level": 2,
            "example_sentences": WELCOME_SENTENCES,
            "note": "Official HSK 2.0 Level 2 word missing from this dataset (only HSK 3 had it)",
        }
    ]
    CORRECTIONS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"corrections.json now has {len(data['corrections'])} entries; added {len(added)}")


def main() -> None:
    sql = generate_sql_v2()
    MIGRATION.write_text(sql)
    print(f"wrote {MIGRATION} ({len(sql.splitlines())} lines)")
    update_corrections_json()


if __name__ == "__main__":
    main()

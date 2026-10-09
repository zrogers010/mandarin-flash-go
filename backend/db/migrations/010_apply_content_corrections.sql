-- ═══════════════════════════════════════════════════════════════════
-- Migration 010: Apply Content Accuracy Corrections
-- ═══════════════════════════════════════════════════════════════════
--
-- Fixes ~30 wrong meanings, pinyin, and traditional forms in HSK vocabulary
-- that resulted from CEDICT polyphone mismatches and import errors.
--
-- Uses the natural key (chinese, traditional, pinyin) for targeting rows.
-- These corrections persist across CEDICT re-imports because they target HSK words
-- (hsk_level 1-6) which are maintained separately from dictionary entries (hsk_level 0).

BEGIN;

-- Fix 好: hǎo (good) vs hào (to be fond of)
UPDATE vocabulary
SET english = 'good | well | fine'
WHERE chinese = '好' AND traditional = '好' AND pinyin = 'hǎo' AND hsk_level BETWEEN 1 AND 6;

-- Fix 年: year (not grain/harvest)
UPDATE vocabulary
SET english = 'year'
WHERE chinese = '年' AND traditional = '年' AND pinyin = 'nián' AND hsk_level BETWEEN 1 AND 6;

-- Fix 喝: hē (to drink) vs hè (to shout)
UPDATE vocabulary
SET english = 'to drink'
WHERE chinese = '喝' AND traditional = '喝' AND pinyin = 'hē' AND hsk_level BETWEEN 1 AND 6;

-- Fix 写: to write (not variant usage)
UPDATE vocabulary
SET english = 'to write'
WHERE chinese = '写' AND traditional = '寫' AND pinyin = 'xiě' AND hsk_level BETWEEN 1 AND 6;

-- Fix 猫: cat (not archaic variant)
UPDATE vocabulary
SET english = 'cat'
WHERE chinese = '猫' AND traditional = '貓' AND pinyin = 'māo' AND hsk_level BETWEEN 1 AND 6;

-- Fix 少: shǎo (few) vs shào (young)
UPDATE vocabulary
SET english = 'few | little | less'
WHERE chinese = '少' AND traditional = '少' AND pinyin = 'shǎo' AND hsk_level BETWEEN 1 AND 6;

-- Fix 千: thousand; correct traditional
UPDATE vocabulary
SET english = 'thousand', traditional = '千'
WHERE chinese = '千' AND pinyin = 'qiān' AND hsk_level BETWEEN 1 AND 6;

-- Fix 秋: autumn; correct traditional
UPDATE vocabulary
SET english = 'autumn | fall', traditional = '秋'
WHERE chinese = '秋' AND pinyin = 'qiū' AND hsk_level BETWEEN 1 AND 6;

-- Fix 绿: green
UPDATE vocabulary
SET english = 'green'
WHERE chinese = '绿' AND traditional = '綠' AND pinyin = 'lǜ' AND hsk_level BETWEEN 1 AND 6;

-- Fix 和: hé (and/with) vs hè (harmony variant); correct traditional
UPDATE vocabulary
SET english = 'and | with | harmony', traditional = '和'
WHERE chinese = '和' AND pinyin = 'hé' AND hsk_level BETWEEN 1 AND 6;

-- Fix 哪: nǎ (which) vs na (particle)
UPDATE vocabulary
SET english = 'which | where'
WHERE chinese = '哪' AND traditional = '哪' AND pinyin = 'nǎ' AND hsk_level BETWEEN 1 AND 6;

-- Fix 好吃: tasty (not gluttonous)
UPDATE vocabulary
SET english = 'tasty | delicious'
WHERE chinese = '好吃' AND traditional = '好吃' AND pinyin = 'hǎochī' AND hsk_level BETWEEN 1 AND 6;

-- Fix 玩: to play; correct traditional
UPDATE vocabulary
SET english = 'to play | to have fun', traditional = '玩'
WHERE chinese = '玩' AND pinyin = 'wán' AND hsk_level BETWEEN 1 AND 6;

-- Fix 远: yuǎn (far) vs yuàn (to distance)
UPDATE vocabulary
SET english = 'far | distant'
WHERE chinese = '远' AND traditional = '遠' AND pinyin = 'yuǎn' AND hsk_level BETWEEN 1 AND 6;

-- Fix 累: lèi (tired) vs léi (rope)
UPDATE vocabulary
SET english = 'tired | exhausted'
WHERE chinese = '累' AND traditional = '累' AND pinyin = 'lèi' AND hsk_level BETWEEN 1 AND 6;

-- Fix 伞: umbrella (not damask silk)
UPDATE vocabulary
SET english = 'umbrella | parasol'
WHERE chinese = '伞' AND traditional = '傘' AND pinyin = 'sǎn' AND hsk_level BETWEEN 1 AND 6;

-- Fix 腿: leg (not hip bone)
UPDATE vocabulary
SET english = 'leg'
WHERE chinese = '腿' AND traditional = '腿' AND pinyin = 'tuǐ' AND hsk_level BETWEEN 1 AND 6;

-- Fix 难: nán (difficult) vs nàn (disaster)
UPDATE vocabulary
SET english = 'difficult | hard'
WHERE chinese = '难' AND traditional = '難' AND pinyin = 'nán' AND hsk_level BETWEEN 1 AND 6;

-- Fix 别: don't/other; correct traditional
UPDATE vocabulary
SET english = 'don''t | other | to leave', traditional = '别'
WHERE chinese = '别' AND pinyin = 'bié' AND hsk_level BETWEEN 1 AND 6;

-- Fix 你: you (generic); correct traditional
UPDATE vocabulary
SET english = 'you', traditional = '你'
WHERE chinese = '你' AND pinyin = 'nǐ' AND hsk_level BETWEEN 1 AND 6;

-- Fix 宾馆: correct pinyin
UPDATE vocabulary
SET pinyin = 'bīnguǎn', pinyin_no_tones = 'binguan'
WHERE chinese = '宾馆' AND traditional = '賓館' AND hsk_level BETWEEN 1 AND 6;

-- Fix 铅笔: correct pinyin
UPDATE vocabulary
SET pinyin = 'qiānbǐ', pinyin_no_tones = 'qianbi'
WHERE chinese = '铅笔' AND traditional = '鉛筆' AND hsk_level BETWEEN 1 AND 6;

-- Fix 觉得: correct pinyin
UPDATE vocabulary
SET pinyin = 'juéde', pinyin_no_tones = 'juede'
WHERE chinese = '觉得' AND traditional = '覺得' AND hsk_level BETWEEN 1 AND 6;

-- Fix 朋友: neutral tone on second syllable
UPDATE vocabulary
SET pinyin = 'péngyou'
WHERE chinese = '朋友' AND traditional = '朋友' AND hsk_level BETWEEN 1 AND 6;

-- Fix 喜欢: neutral tone on second syllable
UPDATE vocabulary
SET pinyin = 'xǐhuan'
WHERE chinese = '喜欢' AND traditional = '喜歡' AND hsk_level BETWEEN 1 AND 6;

-- Fix 发: fā (send) vs fà (hair)
UPDATE vocabulary
SET english = 'to send | to issue | to develop'
WHERE chinese = '发' AND traditional = '發' AND pinyin = 'fā' AND hsk_level BETWEEN 1 AND 6;

-- Fix 把: particle/to hold (not just handle)
UPDATE vocabulary
SET english = 'to hold | (particle) | handle'
WHERE chinese = '把' AND traditional = '把' AND pinyin = 'bǎ' AND hsk_level BETWEEN 1 AND 6;

-- Fix 种: zhǒng (kind) vs zhòng (to plant)
UPDATE vocabulary
SET english = 'kind | type | species'
WHERE chinese = '种' AND traditional = '種' AND pinyin = 'zhǒng' AND hsk_level BETWEEN 1 AND 6;

-- Fix 过去: past/former times
UPDATE vocabulary
SET english = 'past | former times | to go over'
WHERE chinese = '过去' AND traditional = '過去' AND pinyin = 'guòqù' AND hsk_level BETWEEN 1 AND 6;

-- Fix 与: and/with (not take part in)
UPDATE vocabulary
SET english = 'and | with | to give'
WHERE chinese = '与' AND traditional = '與' AND pinyin = 'yǔ' AND hsk_level BETWEEN 1 AND 6;

-- Remove duplicate 对 in HSK 2 (keep only one)
DELETE FROM vocabulary
WHERE chinese = '对' AND traditional = '對' AND hsk_level = 2 AND id NOT IN (
    SELECT MIN(id)
    FROM vocabulary
    WHERE chinese = '对' AND traditional = '對' AND hsk_level = 2
);

-- Fix 'footbal' typo
UPDATE vocabulary
SET english = REPLACE(english, 'footbal', 'football')
WHERE english LIKE '%footbal%';

-- Update timestamps for auditing
UPDATE vocabulary
SET updated_at = NOW()
WHERE chinese IN ('好','年','喝','写','猫','少','千','秋','绿','和','哪','好吃','玩','远','累','伞','腿','难','别','你','宾馆','铅笔','觉得','朋友','喜欢','发','把','种','过去','与','对')
  AND hsk_level BETWEEN 1 AND 6;

COMMIT;

-- Migration is idempotent: safe to run multiple times
-- Corrections target HSK words (levels 1-6) which are maintained separately from
-- CEDICT dictionary entries (level 0), so they won't be overwritten by re-imports.

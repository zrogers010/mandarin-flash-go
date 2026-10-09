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
-- Production may store traditional as 秊 (variant)
UPDATE vocabulary
SET english = 'year', traditional = '年'
WHERE chinese = '年' AND traditional IN ('年','秊') AND pinyin = 'nián' AND hsk_level BETWEEN 1 AND 6;

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

-- Fix 累: lèi (tired) vs léi (rope) vs lěi (accumulate)
-- Production stores HSK as 累/纍/lèi (纍 is variant form)
UPDATE vocabulary
SET english = 'tired | exhausted', pinyin = 'lèi', traditional = '累'
WHERE chinese = '累' AND traditional IN ('累', '纍') AND pinyin IN ('lèi', 'lěi', 'léi') AND hsk_level BETWEEN 1 AND 6;

-- Fix 伞: umbrella (not damask silk variant 繖)
-- CEDICT has 伞|傘|san3 (umbrella) and 伞|繖|san3 (damask silk variant)
UPDATE vocabulary
SET english = 'umbrella | parasol', traditional = '傘'
WHERE chinese = '伞' AND traditional IN ('傘', '繖') AND pinyin = 'sǎn' AND hsk_level BETWEEN 1 AND 6;

-- Fix 腿: leg (not hip bone variant 骽)
-- CEDICT has 腿|腿|tui3 (leg) and 腿|骽|tui3 (old variant/hip bone)
UPDATE vocabulary
SET english = 'leg', traditional = '腿'
WHERE chinese = '腿' AND traditional IN ('腿', '骽') AND pinyin = 'tuǐ' AND hsk_level BETWEEN 1 AND 6;

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
-- HSK 2 row has traditional NULL in production
UPDATE vocabulary
SET pinyin = 'bīnguǎn', pinyin_no_tones = 'binguan', english = 'hotel | guesthouse', traditional = '賓館'
WHERE chinese = '宾馆' AND (traditional = '賓館' OR traditional IS NULL) AND hsk_level BETWEEN 1 AND 6;

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

-- Fix 发: fā (send/發) vs fà (hair/髮)
-- CEDICT has 发|發|fa1 (send) and 发|髮|fa4 (hair)
-- HSK uses 發 (send), not 髮 (hair)
UPDATE vocabulary
SET english = 'to send | to issue | to develop', traditional = '發', pinyin = 'fā'
WHERE chinese = '发' AND traditional IN ('發', '髮') AND pinyin IN ('fā', 'fà') AND hsk_level BETWEEN 1 AND 6;

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

-- Remove duplicate 对 in HSK 2 (keep only one, deterministically)
-- Production duplicate has traditional NULL, so match NULL or 對
-- Only delete if no user progress exists on the duplicate
DELETE FROM vocabulary
WHERE chinese='对' AND (traditional='對' OR traditional IS NULL) AND hsk_level=2
  AND id <> (
    SELECT id FROM vocabulary 
    WHERE chinese='对' AND (traditional='對' OR traditional IS NULL) AND hsk_level=2 
    ORDER BY created_at, id 
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_vocabulary_progress p 
    WHERE p.vocabulary_id = vocabulary.id
  );

-- Fix 'footbal' typo (only in HSK words, with word boundaries to avoid double-fixing)
UPDATE vocabulary
SET english = regexp_replace(english, '\mfootbal\M', 'football', 'g')
WHERE english ~ '\mfootbal\M' AND hsk_level BETWEEN 1 AND 6;

-- Update timestamps for auditing
UPDATE vocabulary
SET updated_at = NOW()
WHERE chinese IN ('好','年','喝','写','猫','少','千','秋','绿','和','哪','好吃','玩','远','累','伞','腿','难','别','你','宾馆','铅笔','觉得','朋友','喜欢','发','把','种','过去','与','对')
  AND hsk_level BETWEEN 1 AND 6;

COMMIT;

-- Migration is idempotent: safe to run multiple times
-- Corrections target HSK words (levels 1-6) which are maintained separately from
-- CEDICT dictionary entries (level 0), so they won't be overwritten by re-imports.

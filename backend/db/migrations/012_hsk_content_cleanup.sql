-- ═══════════════════════════════════════════════════════════════════
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
    r := regexp_replace(r, '(y[īíǐì]|liǎng|zhè|nà|jǐ)[[:space:]]+zhǐ', '\1 zhī', 'gi');
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
    r := regexp_replace(r, '\yhànyǔ\y', 'Hànyǔ', 'gi');
    r := regexp_replace(r, '\yzhōngwén\y', 'Zhōngwén', 'gi');
    r := regexp_replace(r, '\yzhōngguó\y', 'Zhōngguó', 'gi');
    r := regexp_replace(r, '\yběijīng\y', 'Běijīng', 'gi');
    r := regexp_replace(r, '\yshànghǎi\y', 'Shànghǎi', 'gi');
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

-- Learner-friendly definitions (and a few traditional-form fixes)
-- 一: Drop Kangxi / yao1 spelling note
UPDATE vocabulary
SET english = 'one | a | whole', updated_at = NOW()
WHERE chinese = '一' AND pinyin = 'yī' AND hsk_level BETWEEN 1 AND 6;

-- 一点儿: Replace CEDICT erhua markup
UPDATE vocabulary
SET english = 'a little | a bit', updated_at = NOW()
WHERE chinese = '一点儿' AND pinyin = 'yīdiǎnr' AND hsk_level BETWEEN 1 AND 6;

-- 上: Lead with spatial/attend senses
UPDATE vocabulary
SET english = 'up | on | above | to attend (class)', updated_at = NOW()
WHERE chinese = '上' AND pinyin = 'shàng' AND hsk_level BETWEEN 1 AND 6;

-- 下: Shorten encyclopedic CEDICT gloss
UPDATE vocabulary
SET english = 'down | below | next | to get off', updated_at = NOW()
WHERE chinese = '下' AND pinyin = 'xià' AND hsk_level BETWEEN 1 AND 6;

-- 不: Drop bound-form note
UPDATE vocabulary
SET english = 'not | no', updated_at = NOW()
WHERE chinese = '不' AND pinyin = 'bù' AND hsk_level BETWEEN 1 AND 6;

-- 个: Learner classifier gloss
UPDATE vocabulary
SET english = 'generic measure word', updated_at = NOW()
WHERE chinese = '个' AND pinyin = 'gè' AND hsk_level BETWEEN 1 AND 6;

-- 他: Drop bound-form 'other' sense
UPDATE vocabulary
SET english = 'he | him', updated_at = NOW()
WHERE chinese = '他' AND pinyin = 'tā' AND hsk_level BETWEEN 1 AND 6;

-- 会: Primary HSK senses
UPDATE vocabulary
SET english = 'can | to know how to | meeting', updated_at = NOW()
WHERE chinese = '会' AND pinyin = 'huì' AND hsk_level BETWEEN 1 AND 6;

-- 做: Shorten long CEDICT list
UPDATE vocabulary
SET english = 'to do | to make | to be', updated_at = NOW()
WHERE chinese = '做' AND pinyin = 'zuò' AND hsk_level BETWEEN 1 AND 6;

-- 前面: Drop also-pr note
UPDATE vocabulary
SET english = 'in front | ahead', updated_at = NOW()
WHERE chinese = '前面' AND pinyin = 'qiánmiàn' AND hsk_level BETWEEN 1 AND 6;

-- 北京: Drop municipality/abbr gloss
UPDATE vocabulary
SET english = 'Beijing', updated_at = NOW()
WHERE chinese = '北京' AND pinyin = 'Běijīng' AND hsk_level BETWEEN 1 AND 6;

-- 去: Primary motion sense
UPDATE vocabulary
SET english = 'to go | to go to', updated_at = NOW()
WHERE chinese = '去' AND pinyin = 'qù' AND hsk_level BETWEEN 1 AND 6;

-- 号: HSK uses number/date/size
UPDATE vocabulary
SET english = 'number | date | size', updated_at = NOW()
WHERE chinese = '号' AND pinyin = 'hào' AND hsk_level BETWEEN 1 AND 6;

-- 听: Drop tin-can / literary senses
UPDATE vocabulary
SET english = 'to listen | to hear', updated_at = NOW()
WHERE chinese = '听' AND pinyin = 'tīng' AND hsk_level BETWEEN 1 AND 6;

-- 呢: One learner gloss
UPDATE vocabulary
SET english = 'question particle (and…? / what about…?)', updated_at = NOW()
WHERE chinese = '呢' AND pinyin = 'ne' AND hsk_level BETWEEN 1 AND 6;

-- 多: Drop Taiwan-pr / poly- note
UPDATE vocabulary
SET english = 'many | much | more | how…', updated_at = NOW()
WHERE chinese = '多' AND pinyin = 'duō' AND hsk_level BETWEEN 1 AND 6;

-- 大: Drop dialect father/uncle
UPDATE vocabulary
SET english = 'big | large | old (age)', updated_at = NOW()
WHERE chinese = '大' AND pinyin = 'dà' AND hsk_level BETWEEN 1 AND 6;

-- 家: Lead with home/family
UPDATE vocabulary
SET english = 'home | family | -ist (specialist)', updated_at = NOW()
WHERE chinese = '家' AND pinyin = 'jiā' AND hsk_level BETWEEN 1 AND 6;

-- 开: Drop Kelvin/carat
UPDATE vocabulary
SET english = 'to open | to start | to turn on | to drive', updated_at = NOW()
WHERE chinese = '开' AND pinyin = 'kāi' AND hsk_level BETWEEN 1 AND 6;

-- 有: Drop bound-form morphology
UPDATE vocabulary
SET english = 'to have | there is', updated_at = NOW()
WHERE chinese = '有' AND pinyin = 'yǒu' AND hsk_level BETWEEN 1 AND 6;

-- 本: Lead with classifier
UPDATE vocabulary
SET english = 'measure word for books | this | origin', updated_at = NOW()
WHERE chinese = '本' AND pinyin = 'běn' AND hsk_level BETWEEN 1 AND 6;

-- 来: Primary motion sense
UPDATE vocabulary
SET english = 'to come', updated_at = NOW()
WHERE chinese = '来' AND pinyin = 'lái' AND hsk_level BETWEEN 1 AND 6;

-- 水: Drop river/shoddy/income senses
UPDATE vocabulary
SET english = 'water', updated_at = NOW()
WHERE chinese = '水' AND pinyin = 'shuǐ' AND hsk_level BETWEEN 1 AND 6;

-- 点: HSK clock/bit/order
UPDATE vocabulary
SET english = 'o''clock | a bit | to order | dot', updated_at = NOW()
WHERE chinese = '点' AND pinyin = 'diǎn' AND hsk_level BETWEEN 1 AND 6;

-- 的: One grammar gloss
UPDATE vocabulary
SET english = 'possessive / attributive particle', updated_at = NOW()
WHERE chinese = '的' AND pinyin = 'de' AND hsk_level BETWEEN 1 AND 6;

-- 看: Primary senses
UPDATE vocabulary
SET english = 'to look | to see | to read | to watch', updated_at = NOW()
WHERE chinese = '看' AND pinyin = 'kàn' AND hsk_level BETWEEN 1 AND 6;

-- 说: Drop doctrine sense
UPDATE vocabulary
SET english = 'to speak | to say | to explain', updated_at = NOW()
WHERE chinese = '说' AND pinyin = 'shuō' AND hsk_level BETWEEN 1 AND 6;

-- 谁: Drop also-pr shuí
UPDATE vocabulary
SET english = 'who', updated_at = NOW()
WHERE chinese = '谁' AND pinyin = 'shéi' AND hsk_level BETWEEN 1 AND 6;

-- 里面: Drop also-pr note
UPDATE vocabulary
SET english = 'inside', updated_at = NOW()
WHERE chinese = '里面' AND pinyin = 'lǐmiàn' AND hsk_level BETWEEN 1 AND 6;

-- 钱: Drop tael weight
UPDATE vocabulary
SET english = 'money', updated_at = NOW()
WHERE chinese = '钱' AND pinyin = 'qián' AND hsk_level BETWEEN 1 AND 6;

-- 两: Keep tael as secondary
UPDATE vocabulary
SET english = 'two | both | tael (50g)', updated_at = NOW()
WHERE chinese = '两' AND pinyin = 'liǎng' AND hsk_level BETWEEN 1 AND 6;

-- 也: Drop literary particle
UPDATE vocabulary
SET english = 'also | too | even', updated_at = NOW()
WHERE chinese = '也' AND pinyin = 'yě' AND hsk_level BETWEEN 1 AND 6;

-- 从: Lead with preposition
UPDATE vocabulary
SET english = 'from | through', updated_at = NOW()
WHERE chinese = '从' AND pinyin = 'cóng' AND hsk_level BETWEEN 1 AND 6;

-- 再: Primary adverb senses
UPDATE vocabulary
SET english = 'again | then | more', updated_at = NOW()
WHERE chinese = '再' AND pinyin = 'zài' AND hsk_level BETWEEN 1 AND 6;

-- 出: Drop opera classifier
UPDATE vocabulary
SET english = 'to go out | to come out | to produce', updated_at = NOW()
WHERE chinese = '出' AND pinyin = 'chū' AND hsk_level BETWEEN 1 AND 6;

-- 到: Primary senses
UPDATE vocabulary
SET english = 'to arrive | to reach | until', updated_at = NOW()
WHERE chinese = '到' AND pinyin = 'dào' AND hsk_level BETWEEN 1 AND 6;

-- 咖啡: Drop '(loanword)' prefix
UPDATE vocabulary
SET english = 'coffee', updated_at = NOW()
WHERE chinese = '咖啡' AND pinyin = 'kāfēi' AND hsk_level BETWEEN 1 AND 6;

-- 对: Shorten long CEDICT list
UPDATE vocabulary
SET english = 'correct | right | toward | to face', updated_at = NOW()
WHERE chinese = '对' AND pinyin = 'duì' AND hsk_level BETWEEN 1 AND 6;

-- 就: Learner grammar senses
UPDATE vocabulary
SET english = 'then | right away | just | only', updated_at = NOW()
WHERE chinese = '就' AND pinyin = 'jiù' AND hsk_level BETWEEN 1 AND 6;

-- 快: Drop knife/wit senses
UPDATE vocabulary
SET english = 'fast | quick | soon', updated_at = NOW()
WHERE chinese = '快' AND pinyin = 'kuài' AND hsk_level BETWEEN 1 AND 6;

-- 您: Plain polite-you gloss
UPDATE vocabulary
SET english = 'you (polite)', updated_at = NOW()
WHERE chinese = '您' AND pinyin = 'nín' AND hsk_level BETWEEN 1 AND 6;

-- 意思: HSK senses
UPDATE vocabulary
SET english = 'meaning | idea | interesting (有意思)', updated_at = NOW()
WHERE chinese = '意思' AND pinyin = 'yìsi' AND hsk_level BETWEEN 1 AND 6;

-- 新: Drop meso- chemistry
UPDATE vocabulary
SET english = 'new', updated_at = NOW()
WHERE chinese = '新' AND pinyin = 'xīn' AND hsk_level BETWEEN 1 AND 6;

-- 最: Drop 世界之最 example dump
UPDATE vocabulary
SET english = 'most | -est', updated_at = NOW()
WHERE chinese = '最' AND pinyin = 'zuì' AND hsk_level BETWEEN 1 AND 6;

-- 机场: Drop Shadowsocks slang
UPDATE vocabulary
SET english = 'airport', updated_at = NOW()
WHERE chinese = '机场' AND pinyin = 'jīchǎng' AND hsk_level BETWEEN 1 AND 6;

-- 次: Lead with classifier
UPDATE vocabulary
SET english = 'time(s) | next', updated_at = NOW()
WHERE chinese = '次' AND pinyin = 'cì' AND hsk_level BETWEEN 1 AND 6;

-- 比: Drop Taiwan-pr note
UPDATE vocabulary
SET english = 'to compare | than', updated_at = NOW()
WHERE chinese = '比' AND pinyin = 'bǐ' AND hsk_level BETWEEN 1 AND 6;

-- 白: Drop political/opera senses
UPDATE vocabulary
SET english = 'white | blank | in vain', updated_at = NOW()
WHERE chinese = '白' AND pinyin = 'bái' AND hsk_level BETWEEN 1 AND 6;

-- 知道: Drop also-pr note
UPDATE vocabulary
SET english = 'to know', updated_at = NOW()
WHERE chinese = '知道' AND pinyin = 'zhīdao' AND hsk_level BETWEEN 1 AND 6;

-- 离: Drop trigram / ☲
UPDATE vocabulary
SET english = 'away from | to leave', updated_at = NOW()
WHERE chinese = '离' AND pinyin = 'lí' AND hsk_level BETWEEN 1 AND 6;

-- 等: Primary senses
UPDATE vocabulary
SET english = 'to wait | etc. | grade', updated_at = NOW()
WHERE chinese = '等' AND pinyin = 'děng' AND hsk_level BETWEEN 1 AND 6;

-- 给: Lead with give/for
UPDATE vocabulary
SET english = 'to give | for | to', updated_at = NOW()
WHERE chinese = '给' AND pinyin = 'gěi' AND hsk_level BETWEEN 1 AND 6;

-- 要: HSK senses
UPDATE vocabulary
SET english = 'to want | to need | will | must', updated_at = NOW()
WHERE chinese = '要' AND pinyin = 'yào' AND hsk_level BETWEEN 1 AND 6;

-- 让: Lead with let/make
UPDATE vocabulary
SET english = 'to let | to make | to allow', updated_at = NOW()
WHERE chinese = '让' AND pinyin = 'ràng' AND hsk_level BETWEEN 1 AND 6;

-- 贵: Shorten bound-form notes
UPDATE vocabulary
SET english = 'expensive | precious | honorable', updated_at = NOW()
WHERE chinese = '贵' AND pinyin = 'guì' AND hsk_level BETWEEN 1 AND 6;

-- 走: Drop euphemism/die
UPDATE vocabulary
SET english = 'to walk | to go | to leave', updated_at = NOW()
WHERE chinese = '走' AND pinyin = 'zǒu' AND hsk_level BETWEEN 1 AND 6;

-- 过: Replace grammar-jargon lead
UPDATE vocabulary
SET english = 'experiential particle (have …ed) | to pass', updated_at = NOW()
WHERE chinese = '过' AND pinyin = 'guò' AND hsk_level BETWEEN 1 AND 6;

-- 进: Drop math-base sense
UPDATE vocabulary
SET english = 'to enter | to go in | to advance', updated_at = NOW()
WHERE chinese = '进' AND pinyin = 'jìn' AND hsk_level BETWEEN 1 AND 6;

-- 错: Primary senses
UPDATE vocabulary
SET english = 'wrong | mistake', updated_at = NOW()
WHERE chinese = '错' AND pinyin = 'cuò' AND hsk_level BETWEEN 1 AND 6;

-- 长: Drop literary surplus / Taiwan-pr
UPDATE vocabulary
SET english = 'long', updated_at = NOW()
WHERE chinese = '长' AND pinyin = 'cháng' AND hsk_level BETWEEN 1 AND 6;

-- 门: Drop Watergate / phylum
UPDATE vocabulary
SET english = 'door | gate | measure word for subjects', updated_at = NOW()
WHERE chinese = '门' AND pinyin = 'mén' AND hsk_level BETWEEN 1 AND 6;

-- 阴: Drop genitalia
UPDATE vocabulary
SET english = 'overcast | cloudy | Yin', updated_at = NOW()
WHERE chinese = '阴' AND pinyin = 'yīn' AND hsk_level BETWEEN 1 AND 6;

-- 零: Primary numeral
UPDATE vocabulary
SET english = 'zero', updated_at = NOW()
WHERE chinese = '零' AND pinyin = 'líng' AND hsk_level BETWEEN 1 AND 6;

-- 鱼: Drop non-fish aquatic dump
UPDATE vocabulary
SET english = 'fish', updated_at = NOW()
WHERE chinese = '鱼' AND pinyin = 'yú' AND hsk_level BETWEEN 1 AND 6;

-- 一会儿: Drop also-pr note
UPDATE vocabulary
SET english = 'a little while | in a moment', updated_at = NOW()
WHERE chinese = '一会儿' AND pinyin = 'yíhuìr' AND hsk_level BETWEEN 1 AND 6;

-- 借: Shorten 给/出 combination note
UPDATE vocabulary
SET english = 'to borrow | to lend', updated_at = NOW()
WHERE chinese = '借' AND pinyin = 'jiè' AND hsk_level BETWEEN 1 AND 6;

-- 元: HSK money/unit
UPDATE vocabulary
SET english = 'yuan (currency) | first | unit', updated_at = NOW()
WHERE chinese = '元' AND pinyin = 'yuán' AND hsk_level BETWEEN 1 AND 6;

-- 先: Primary adverb
UPDATE vocabulary
SET english = 'first | in advance | earlier', updated_at = NOW()
WHERE chinese = '先' AND pinyin = 'xiān' AND hsk_level BETWEEN 1 AND 6;

-- 关: Do not lead with mountain pass
UPDATE vocabulary
SET english = 'to close | to turn off | to concern', updated_at = NOW()
WHERE chinese = '关' AND pinyin = 'guān' AND hsk_level BETWEEN 1 AND 6;

-- 刚才: Replace variant-of markup; trad 剛才
UPDATE vocabulary
SET english = 'just now', traditional = '剛才', updated_at = NOW()
WHERE chinese = '刚才' AND pinyin = 'gāngcái' AND hsk_level BETWEEN 1 AND 6;

-- 包: Primary senses
UPDATE vocabulary
SET english = 'bag | package | to wrap', updated_at = NOW()
WHERE chinese = '包' AND pinyin = 'bāo' AND hsk_level BETWEEN 1 AND 6;

-- 太阳: Drop temple-abbr
UPDATE vocabulary
SET english = 'sun | sunshine', updated_at = NOW()
WHERE chinese = '太阳' AND pinyin = 'tàiyáng' AND hsk_level BETWEEN 1 AND 6;

-- 差: Drop Taiwan-pr
UPDATE vocabulary
SET english = 'poor | not good | to lack | difference', updated_at = NOW()
WHERE chinese = '差' AND pinyin = 'chà' AND hsk_level BETWEEN 1 AND 6;

-- 带: Primary senses
UPDATE vocabulary
SET english = 'to bring | to take | belt | zone', updated_at = NOW()
WHERE chinese = '带' AND pinyin = 'dài' AND hsk_level BETWEEN 1 AND 6;

-- 拿: Drop 把-comparison note
UPDATE vocabulary
SET english = 'to take | to hold', updated_at = NOW()
WHERE chinese = '拿' AND pinyin = 'ná' AND hsk_level BETWEEN 1 AND 6;

-- 接: Primary senses
UPDATE vocabulary
SET english = 'to receive | to meet | to connect', updated_at = NOW()
WHERE chinese = '接' AND pinyin = 'jiē' AND hsk_level BETWEEN 1 AND 6;

-- 教: HSK verb sense
UPDATE vocabulary
SET english = 'to teach', updated_at = NOW()
WHERE chinese = '教' AND pinyin = 'jiāo' AND hsk_level BETWEEN 1 AND 6;

-- 特别: Drop 是-pattern note
UPDATE vocabulary
SET english = 'especially | special | particularly', updated_at = NOW()
WHERE chinese = '特别' AND pinyin = 'tèbié' AND hsk_level BETWEEN 1 AND 6;

-- 用: Primary verb
UPDATE vocabulary
SET english = 'to use', updated_at = NOW()
WHERE chinese = '用' AND pinyin = 'yòng' AND hsk_level BETWEEN 1 AND 6;

-- 画: Drop 划-variant dump
UPDATE vocabulary
SET english = 'to draw | painting | picture', updated_at = NOW()
WHERE chinese = '画' AND pinyin = 'huà' AND hsk_level BETWEEN 1 AND 6;

-- 着急: Drop Taiwan-pr
UPDATE vocabulary
SET english = 'anxious | worried | in a hurry', updated_at = NOW()
WHERE chinese = '着急' AND pinyin = 'zháojí' AND hsk_level BETWEEN 1 AND 6;

-- 笔记本: Drop CEDICT abbr dump
UPDATE vocabulary
SET english = 'notebook | laptop', updated_at = NOW()
WHERE chinese = '笔记本' AND pinyin = 'bǐjìběn' AND hsk_level BETWEEN 1 AND 6;

-- 老: Primary senses
UPDATE vocabulary
SET english = 'old | always | prefix for names', updated_at = NOW()
WHERE chinese = '老' AND pinyin = 'lǎo' AND hsk_level BETWEEN 1 AND 6;

-- 节目: Primary noun
UPDATE vocabulary
SET english = 'program | show', updated_at = NOW()
WHERE chinese = '节目' AND pinyin = 'jiémù' AND hsk_level BETWEEN 1 AND 6;

-- 被: Lead with grammar, not quilt only
UPDATE vocabulary
SET english = 'passive particle (by) | quilt', updated_at = NOW()
WHERE chinese = '被' AND pinyin = 'bèi' AND hsk_level BETWEEN 1 AND 6;

-- 起来: Shorten complement essay
UPDATE vocabulary
SET english = 'to stand up | (verb complement) start / up', updated_at = NOW()
WHERE chinese = '起来' AND pinyin = 'qǐlái' AND hsk_level BETWEEN 1 AND 6;

-- 超市: Drop 超级市场 abbr markup
UPDATE vocabulary
SET english = 'supermarket', updated_at = NOW()
WHERE chinese = '超市' AND pinyin = 'chāoshì' AND hsk_level BETWEEN 1 AND 6;

-- 除了: Drop long example dump
UPDATE vocabulary
SET english = 'except | besides | in addition to', updated_at = NOW()
WHERE chinese = '除了' AND pinyin = 'chúle' AND hsk_level BETWEEN 1 AND 6;

-- 鸟: Primary noun
UPDATE vocabulary
SET english = 'bird', updated_at = NOW()
WHERE chinese = '鸟' AND pinyin = 'niǎo' AND hsk_level BETWEEN 1 AND 6;

-- 专门: Primary senses
UPDATE vocabulary
SET english = 'specialized | specially', updated_at = NOW()
WHERE chinese = '专门' AND pinyin = 'zhuānmén' AND hsk_level BETWEEN 1 AND 6;

-- 主意: Drop Beijing-pr note
UPDATE vocabulary
SET english = 'idea | plan', updated_at = NOW()
WHERE chinese = '主意' AND pinyin = 'zhǔyi' AND hsk_level BETWEEN 1 AND 6;

-- 之: Drop CEDICT 的[de5] markup
UPDATE vocabulary
SET english = 'literary ''of'' (like 的)', updated_at = NOW()
WHERE chinese = '之' AND pinyin = 'zhī' AND hsk_level BETWEEN 1 AND 6;

-- 乱: Primary senses
UPDATE vocabulary
SET english = 'messy | chaotic | randomly', updated_at = NOW()
WHERE chinese = '乱' AND pinyin = 'luàn' AND hsk_level BETWEEN 1 AND 6;

-- 亚洲: Drop 亚细亚洲 markup
UPDATE vocabulary
SET english = 'Asia', updated_at = NOW()
WHERE chinese = '亚洲' AND pinyin = 'yàzhōu' AND hsk_level BETWEEN 1 AND 6;

-- 作用: Drop 抑制 example
UPDATE vocabulary
SET english = 'effect | function | to affect', updated_at = NOW()
WHERE chinese = '作用' AND pinyin = 'zuòyòng' AND hsk_level BETWEEN 1 AND 6;

-- 俩: Drop 兩個 markup
UPDATE vocabulary
SET english = 'two (colloquial)', updated_at = NOW()
WHERE chinese = '俩' AND pinyin = 'liǎ' AND hsk_level BETWEEN 1 AND 6;

-- 倒: HSK senses
UPDATE vocabulary
SET english = 'to pour | but | on the contrary | to fall', updated_at = NOW()
WHERE chinese = '倒' AND pinyin = 'dào' AND hsk_level BETWEEN 1 AND 6;

-- 刀: Primary noun
UPDATE vocabulary
SET english = 'knife', updated_at = NOW()
WHERE chinese = '刀' AND pinyin = 'dāo' AND hsk_level BETWEEN 1 AND 6;

-- 厉害: Primary adjective
UPDATE vocabulary
SET english = 'formidable | sharp | serious', updated_at = NOW()
WHERE chinese = '厉害' AND pinyin = 'lìhai' AND hsk_level BETWEEN 1 AND 6;

-- 咱们: Drop dialect / also-pr
UPDATE vocabulary
SET english = 'we (including you)', updated_at = NOW()
WHERE chinese = '咱们' AND pinyin = 'zánmen' AND hsk_level BETWEEN 1 AND 6;

-- 场: Primary senses
UPDATE vocabulary
SET english = 'site | field | measure word for events', updated_at = NOW()
WHERE chinese = '场' AND pinyin = 'chǎng' AND hsk_level BETWEEN 1 AND 6;

-- 垃圾桶: Drop Taiwan-pr
UPDATE vocabulary
SET english = 'trash can', updated_at = NOW()
WHERE chinese = '垃圾桶' AND pinyin = 'lājītǒng' AND hsk_level BETWEEN 1 AND 6;

-- 好处: Drop also-pr
UPDATE vocabulary
SET english = 'benefit | advantage', updated_at = NOW()
WHERE chinese = '好处' AND pinyin = 'hǎochù' AND hsk_level BETWEEN 1 AND 6;

-- 寄: Lead with mail
UPDATE vocabulary
SET english = 'to mail | to send', updated_at = NOW()
WHERE chinese = '寄' AND pinyin = 'jì' AND hsk_level BETWEEN 1 AND 6;

-- 尝: Replace variant-of markup
UPDATE vocabulary
SET english = 'to taste | to try', traditional = '嘗', updated_at = NOW()
WHERE chinese = '尝' AND pinyin = 'cháng' AND hsk_level BETWEEN 1 AND 6;

-- 巧克力: Drop '(loanword)' prefix
UPDATE vocabulary
SET english = 'chocolate', updated_at = NOW()
WHERE chinese = '巧克力' AND pinyin = 'qiǎokèlì' AND hsk_level BETWEEN 1 AND 6;

-- 帅: Lead with HSK adjective
UPDATE vocabulary
SET english = 'handsome | cool', updated_at = NOW()
WHERE chinese = '帅' AND pinyin = 'shuài' AND hsk_level BETWEEN 1 AND 6;

-- 幽默: Drop '(loanword)' prefix
UPDATE vocabulary
SET english = 'humorous | humor', updated_at = NOW()
WHERE chinese = '幽默' AND pinyin = 'yōumò' AND hsk_level BETWEEN 1 AND 6;

-- 底: Drop math radix
UPDATE vocabulary
SET english = 'bottom | end | base', updated_at = NOW()
WHERE chinese = '底' AND pinyin = 'dǐ' AND hsk_level BETWEEN 1 AND 6;

-- 座: Drop archaic suffix
UPDATE vocabulary
SET english = 'seat | measure word for buildings', updated_at = NOW()
WHERE chinese = '座' AND pinyin = 'zuò' AND hsk_level BETWEEN 1 AND 6;

-- 拉: Replace 拉拉蛄-only gloss
UPDATE vocabulary
SET english = 'to pull | to drag | to play (a bowed instrument)', traditional = '拉', updated_at = NOW()
WHERE chinese = '拉' AND pinyin = 'lā' AND hsk_level BETWEEN 1 AND 6;

-- 挂: Drop slang kill
UPDATE vocabulary
SET english = 'to hang | to hang up (the phone)', updated_at = NOW()
WHERE chinese = '挂' AND pinyin = 'guà' AND hsk_level BETWEEN 1 AND 6;

-- 挺: Lead with quite/very
UPDATE vocabulary
SET english = 'quite | very | to straighten', updated_at = NOW()
WHERE chinese = '挺' AND pinyin = 'tǐng' AND hsk_level BETWEEN 1 AND 6;

-- 掉: Shorten long list
UPDATE vocabulary
SET english = 'to fall | to drop | (verb complement) off / away', updated_at = NOW()
WHERE chinese = '掉' AND pinyin = 'diào' AND hsk_level BETWEEN 1 AND 6;

-- 接着: Primary adverb
UPDATE vocabulary
SET english = 'then | to continue | next', updated_at = NOW()
WHERE chinese = '接着' AND pinyin = 'jiēzhe' AND hsk_level BETWEEN 1 AND 6;

-- 推: Primary senses
UPDATE vocabulary
SET english = 'to push | to postpone | to recommend', updated_at = NOW()
WHERE chinese = '推' AND pinyin = 'tuī' AND hsk_level BETWEEN 1 AND 6;

-- 提: Drop brush-stroke note
UPDATE vocabulary
SET english = 'to lift | to mention | to raise (an issue)', updated_at = NOW()
WHERE chinese = '提' AND pinyin = 'tí' AND hsk_level BETWEEN 1 AND 6;

-- 梦: Fix truncated CEDICT
UPDATE vocabulary
SET english = 'dream', updated_at = NOW()
WHERE chinese = '梦' AND pinyin = 'mèng' AND hsk_level BETWEEN 1 AND 6;

-- 母亲: Drop also-pr
UPDATE vocabulary
SET english = 'mother', updated_at = NOW()
WHERE chinese = '母亲' AND pinyin = 'mǔqīn' AND hsk_level BETWEEN 1 AND 6;

-- 毛: HSK senses
UPDATE vocabulary
SET english = 'hair | fur | 0.1 yuan', updated_at = NOW()
WHERE chinese = '毛' AND pinyin = 'máo' AND hsk_level BETWEEN 1 AND 6;

-- 活动: Fix truncated CEDICT
UPDATE vocabulary
SET english = 'activity | event | to move about', updated_at = NOW()
WHERE chinese = '活动' AND pinyin = 'huódòng' AND hsk_level BETWEEN 1 AND 6;

-- 火: Drop Kangxi radical
UPDATE vocabulary
SET english = 'fire | hot (popular)', updated_at = NOW()
WHERE chinese = '火' AND pinyin = 'huǒ' AND hsk_level BETWEEN 1 AND 6;

-- 照: Primary senses
UPDATE vocabulary
SET english = 'according to | to shine | to photograph', updated_at = NOW()
WHERE chinese = '照' AND pinyin = 'zhào' AND hsk_level BETWEEN 1 AND 6;

-- 父亲: Drop also-pr
UPDATE vocabulary
SET english = 'father', updated_at = NOW()
WHERE chinese = '父亲' AND pinyin = 'fùqīn' AND hsk_level BETWEEN 1 AND 6;

-- 直接: Drop 间接 markup
UPDATE vocabulary
SET english = 'direct | immediately', updated_at = NOW()
WHERE chinese = '直接' AND pinyin = 'zhíjiē' AND hsk_level BETWEEN 1 AND 6;

-- 破: Primary senses
UPDATE vocabulary
SET english = 'broken | to break', updated_at = NOW()
WHERE chinese = '破' AND pinyin = 'pò' AND hsk_level BETWEEN 1 AND 6;

-- 节: Drop knot/nautical
UPDATE vocabulary
SET english = 'festival | section | to save | measure word', updated_at = NOW()
WHERE chinese = '节' AND pinyin = 'jié' AND hsk_level BETWEEN 1 AND 6;

-- 下载: Drop also-pr
UPDATE vocabulary
SET english = 'to download', updated_at = NOW()
WHERE chinese = '下载' AND pinyin = 'xiàzài' AND hsk_level BETWEEN 1 AND 6;

-- 与其: Plain pattern gloss
UPDATE vocabulary
SET english = 'rather than (与其…不如…)', updated_at = NOW()
WHERE chinese = '与其' AND pinyin = 'yǔqí' AND hsk_level BETWEEN 1 AND 6;

-- 主动: Drop 被动 markup
UPDATE vocabulary
SET english = 'to take the initiative | active', updated_at = NOW()
WHERE chinese = '主动' AND pinyin = 'zhǔdòng' AND hsk_level BETWEEN 1 AND 6;

-- 乙: Drop compass/ethyl
UPDATE vocabulary
SET english = 'second (Heavenly Stem) | B', updated_at = NOW()
WHERE chinese = '乙' AND pinyin = 'yǐ' AND hsk_level BETWEEN 1 AND 6;

-- 似的: Drop Taiwan-pr
UPDATE vocabulary
SET english = 'like | as if', updated_at = NOW()
WHERE chinese = '似的' AND pinyin = 'shìde' AND hsk_level BETWEEN 1 AND 6;

-- 作为: Primary senses
UPDATE vocabulary
SET english = 'as | to serve as | conduct', updated_at = NOW()
WHERE chinese = '作为' AND pinyin = 'zuòwéi' AND hsk_level BETWEEN 1 AND 6;

-- 使劲儿: Replace erhua markup
UPDATE vocabulary
SET english = 'to put in effort | to exert oneself', updated_at = NOW()
WHERE chinese = '使劲儿' AND pinyin = 'shǐjìnr' AND hsk_level BETWEEN 1 AND 6;

-- 便: Drop bathroom sense as lead
UPDATE vocabulary
SET english = 'convenient | then | informal', updated_at = NOW()
WHERE chinese = '便' AND pinyin = 'biàn' AND hsk_level BETWEEN 1 AND 6;

-- 俱乐部: Drop '(loanword)' prefix
UPDATE vocabulary
SET english = 'club', updated_at = NOW()
WHERE chinese = '俱乐部' AND pinyin = 'jùlèbù' AND hsk_level BETWEEN 1 AND 6;

-- 切: HSK is qiē 'cut', not qiè
UPDATE vocabulary
SET english = 'to cut | to slice', updated_at = NOW()
WHERE chinese = '切' AND pinyin = 'qiē' AND hsk_level BETWEEN 1 AND 6;

-- 则: Shorten literary essay
UPDATE vocabulary
SET english = 'then | but | rule | measure word for news items', updated_at = NOW()
WHERE chinese = '则' AND pinyin = 'zé' AND hsk_level BETWEEN 1 AND 6;

-- 升: Replace 陞-variant markup
UPDATE vocabulary
SET english = 'to rise | to promote | liter', traditional = '升', updated_at = NOW()
WHERE chinese = '升' AND pinyin = 'shēng' AND hsk_level BETWEEN 1 AND 6;

-- 发挥: Primary verb
UPDATE vocabulary
SET english = 'to bring into play | to give full play to', updated_at = NOW()
WHERE chinese = '发挥' AND pinyin = 'fāhuī' AND hsk_level BETWEEN 1 AND 6;

-- 发票: Drop 统一发票 markup
UPDATE vocabulary
SET english = 'invoice | receipt', updated_at = NOW()
WHERE chinese = '发票' AND pinyin = 'fāpiào' AND hsk_level BETWEEN 1 AND 6;

-- 吨: Drop Taiwan-pr / loanword tag
UPDATE vocabulary
SET english = 'ton', updated_at = NOW()
WHERE chinese = '吨' AND pinyin = 'dūn' AND hsk_level BETWEEN 1 AND 6;

-- 呆: Replace 獃-variant markup
UPDATE vocabulary
SET english = 'dull | blank | to stay', traditional = '呆', updated_at = NOW()
WHERE chinese = '呆' AND pinyin = 'dāi' AND hsk_level BETWEEN 1 AND 6;

-- 周到: Drop also-pr
UPDATE vocabulary
SET english = 'thoughtful | considerate', updated_at = NOW()
WHERE chinese = '周到' AND pinyin = 'zhōudào' AND hsk_level BETWEEN 1 AND 6;

-- 圆: Primary senses
UPDATE vocabulary
SET english = 'round | circle | yuan', updated_at = NOW()
WHERE chinese = '圆' AND pinyin = 'yuán' AND hsk_level BETWEEN 1 AND 6;

-- 墙: Drop slang/GFW sense
UPDATE vocabulary
SET english = 'wall', updated_at = NOW()
WHERE chinese = '墙' AND pinyin = 'qiáng' AND hsk_level BETWEEN 1 AND 6;

-- 大厦: Drop Broadway/Empire dump
UPDATE vocabulary
SET english = 'mansion | large building', updated_at = NOW()
WHERE chinese = '大厦' AND pinyin = 'dàshà' AND hsk_level BETWEEN 1 AND 6;

-- 套: Drop Greek tau
UPDATE vocabulary
SET english = 'set | to cover | measure word for sets', updated_at = NOW()
WHERE chinese = '套' AND pinyin = 'tào' AND hsk_level BETWEEN 1 AND 6;

-- 学问: Fix truncated CEDICT
UPDATE vocabulary
SET english = 'learning | knowledge', updated_at = NOW()
WHERE chinese = '学问' AND pinyin = 'xuéwen' AND hsk_level BETWEEN 1 AND 6;

-- 尽快: Replace see-also markup
UPDATE vocabulary
SET english = 'as soon as possible', updated_at = NOW()
WHERE chinese = '尽快' AND pinyin = 'jǐnkuài' AND hsk_level BETWEEN 1 AND 6;

-- 尾巴: Drop colloquial-pr note
UPDATE vocabulary
SET english = 'tail', updated_at = NOW()
WHERE chinese = '尾巴' AND pinyin = 'wěiba' AND hsk_level BETWEEN 1 AND 6;

-- 干活儿: Replace erhua markup
UPDATE vocabulary
SET english = 'to work | to do manual work', updated_at = NOW()
WHERE chinese = '干活儿' AND pinyin = 'gànhuór' AND hsk_level BETWEEN 1 AND 6;

-- 平: Drop 平声 abbr
UPDATE vocabulary
SET english = 'flat | level | peaceful | to tie (a game)', updated_at = NOW()
WHERE chinese = '平' AND pinyin = 'píng' AND hsk_level BETWEEN 1 AND 6;

-- Explicit measure-word 只 sentence fixes (zhǐ → zhī)
UPDATE vocabulary
SET example_sentences = (
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN s->>'chinese' = '这只猫很小'
            THEN jsonb_set(s, '{pinyin}', to_jsonb('Zhè zhī māo hěn xiǎo'::text))
            ELSE s
        END
    ), example_sentences)
    FROM jsonb_array_elements(COALESCE(example_sentences, '[]'::jsonb)) s
),
    updated_at = NOW()
WHERE chinese = '小'
  AND hsk_level BETWEEN 1 AND 6
  AND example_sentences::text LIKE '%这只猫很小%';
UPDATE vocabulary
SET example_sentences = (
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN s->>'chinese' = '他有一只狗'
            THEN jsonb_set(s, '{pinyin}', to_jsonb('Tā yǒu yì zhī gǒu'::text))
            ELSE s
        END
    ), example_sentences)
    FROM jsonb_array_elements(COALESCE(example_sentences, '[]'::jsonb)) s
),
    updated_at = NOW()
WHERE chinese = '狗'
  AND hsk_level BETWEEN 1 AND 6
  AND example_sentences::text LIKE '%他有一只狗%';
UPDATE vocabulary
SET example_sentences = (
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN s->>'chinese' = '这只狗多大?'
            THEN jsonb_set(s, '{pinyin}', to_jsonb('Zhè zhī gǒu duō dà?'::text))
            ELSE s
        END
    ), example_sentences)
    FROM jsonb_array_elements(COALESCE(example_sentences, '[]'::jsonb)) s
),
    updated_at = NOW()
WHERE chinese = '狗'
  AND hsk_level BETWEEN 1 AND 6
  AND example_sentences::text LIKE '%这只狗多大?%';
UPDATE vocabulary
SET example_sentences = (
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN s->>'chinese' = '我有一只猫'
            THEN jsonb_set(s, '{pinyin}', to_jsonb('Wǒ yǒu yì zhī māo'::text))
            ELSE s
        END
    ), example_sentences)
    FROM jsonb_array_elements(COALESCE(example_sentences, '[]'::jsonb)) s
),
    updated_at = NOW()
WHERE chinese = '猫'
  AND hsk_level BETWEEN 1 AND 6
  AND example_sentences::text LIKE '%我有一只猫%';
-- Apply pinyin convention across remaining HSK example sentences.
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

-- Official HSK 2.0 Level-2 word 欢迎 is stored at HSK 3 in this DB.
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
    '[{"chinese": "欢迎光临！", "pinyin": "Huānyíng guānglín!", "english": "Welcome!"}, {"chinese": "你们欢迎新成员吗？", "pinyin": "Nǐmen huānyíng xīn chéngyuán ma?", "english": "Do you welcome new members?"}, {"chinese": "我们热烈欢迎来自世界各地的朋友参加活动。", "pinyin": "Wǒmen rèliè huānyíng láizì shìjiè gèdì de péngyǒu cānjiā huódòng.", "english": "We warmly welcome friends from all over the world to join the event."}]'::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM vocabulary WHERE chinese = '欢迎' AND hsk_level BETWEEN 1 AND 6
);

-- Keep the SQL helper; apply_corrections.py does not depend on it.
-- Migration is safe to re-run: UPDATEs set the same values; INSERT is guarded.

-- ═══════════════════════════════════════════════════════════════════
-- Migration 005: Add vocabulary for lessons and link them
-- ═══════════════════════════════════════════════════════════════════

-- ── Insert missing vocabulary used in lesson sentences ───────────

-- Greetings
INSERT INTO vocabulary (chinese, pinyin, english, hsk_level, example_sentences)
VALUES ('你好', 'nǐhǎo', 'hello', 1, '[{"chinese":"你好！很高兴认识你。","pinyin":"Nǐhǎo! Hěn gāoxìng rènshi nǐ.","english":"Hello! Nice to meet you."}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Food & Dining
INSERT INTO vocabulary (chinese, pinyin, english, hsk_level, example_sentences)
VALUES
('面条', 'miàntiáo', 'noodles', 2, '[{"chinese":"我想吃面条。","pinyin":"Wǒ xiǎng chī miàntiáo.","english":"I want to eat noodles."}]'::jsonb),
('辣', 'là', 'spicy', 2, '[{"chinese":"我不吃辣的。","pinyin":"Wǒ bù chī là de.","english":"I don''t eat spicy food."}]'::jsonb),
('服务员', 'fúwùyuán', 'waiter', 2, '[{"chinese":"服务员，买单！","pinyin":"Fúwùyuán, mǎidān!","english":"Waiter, the bill please!"}]'::jsonb),
('餐厅', 'cāntīng', 'restaurant', 2, '[{"chinese":"我们去餐厅吃饭。","pinyin":"Wǒmen qù cāntīng chīfàn.","english":"Let''s go eat at a restaurant."}]'::jsonb),
('啤酒', 'píjiǔ', 'beer', 3, '[{"chinese":"再来一瓶啤酒。","pinyin":"Zài lái yì píng píjiǔ.","english":"Another bottle of beer, please."}]'::jsonb),
('汤', 'tāng', 'soup', 2, '[{"chinese":"我要一碗汤。","pinyin":"Wǒ yào yì wǎn tāng.","english":"I want a bowl of soup."}]'::jsonb),
('咖啡', 'kāfēi', 'coffee', 2, '[{"chinese":"我想喝咖啡。","pinyin":"Wǒ xiǎng hē kāfēi.","english":"I want to drink coffee."}]'::jsonb),
('饱', 'bǎo', 'full (from eating)', 2, '[{"chinese":"你吃饱了吗？","pinyin":"Nǐ chī bǎo le ma?","english":"Are you full?"}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Travel & Transportation
INSERT INTO vocabulary (chinese, pinyin, english, hsk_level, example_sentences)
VALUES
('地铁', 'dìtiě', 'subway', 2, '[{"chinese":"请问，地铁站在哪里？","pinyin":"Qǐngwèn, dìtiě zhàn zài nǎlǐ?","english":"Excuse me, where is the subway station?"}]'::jsonb),
('出租车', 'chūzūchē', 'taxi', 2, '[{"chinese":"请帮我叫一辆出租车。","pinyin":"Qǐng bāng wǒ jiào yí liàng chūzūchē.","english":"Please call a taxi for me."}]'::jsonb),
('公共汽车', 'gōnggòng qìchē', 'bus', 2, '[{"chinese":"坐公共汽车还是坐地铁？","pinyin":"Zuò gōnggòng qìchē háishi zuò dìtiě?","english":"Take the bus or the subway?"}]'::jsonb),
('酒店', 'jiǔdiàn', 'hotel', 3, '[{"chinese":"我的酒店在这附近。","pinyin":"Wǒ de jiǔdiàn zài zhè fùjìn.","english":"My hotel is near here."}]'::jsonb),
('迷路', 'mílù', 'lost (one''s way)', 3, '[{"chinese":"我迷路了。","pinyin":"Wǒ mílù le.","english":"I''m lost."}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Animals & Nature
INSERT INTO vocabulary (chinese, pinyin, english, hsk_level, example_sentences)
VALUES
('猫', 'māo', 'cat', 1, '[{"chinese":"我家有一只猫。","pinyin":"Wǒ jiā yǒu yì zhī māo.","english":"I have a cat at home."}]'::jsonb),
('狗', 'gǒu', 'dog', 1, '[{"chinese":"他的狗很可爱。","pinyin":"Tā de gǒu hěn kě''ài.","english":"His dog is very cute."}]'::jsonb),
('鸟', 'niǎo', 'bird', 2, '[{"chinese":"鸟在树上唱歌。","pinyin":"Niǎo zài shù shàng chànggē.","english":"The birds are singing in the tree."}]'::jsonb),
('鱼', 'yú', 'fish', 1, '[{"chinese":"鱼在水里游泳。","pinyin":"Yú zài shuǐ lǐ yóuyǒng.","english":"The fish are swimming in the water."}]'::jsonb),
('马', 'mǎ', 'horse', 2, '[{"chinese":"马跑得很快。","pinyin":"Mǎ pǎo de hěn kuài.","english":"Horses run very fast."}]'::jsonb),
('动物', 'dòngwù', 'animal', 2, '[{"chinese":"你喜欢什么动物？","pinyin":"Nǐ xǐhuan shénme dòngwù?","english":"What animal do you like?"}]'::jsonb),
('熊猫', 'xióngmāo', 'panda', 3, '[{"chinese":"熊猫是中国的国宝。","pinyin":"Xióngmāo shì zhōngguó de guóbǎo.","english":"The panda is China''s national treasure."}]'::jsonb),
('大象', 'dàxiàng', 'elephant', 3, '[{"chinese":"大象是最大的陆地动物。","pinyin":"Dàxiàng shì zuì dà de lùdì dòngwù.","english":"The elephant is the largest land animal."}]'::jsonb),
('兔子', 'tùzi', 'rabbit', 3, '[{"chinese":"这只兔子很小。","pinyin":"Zhè zhī tùzi hěn xiǎo.","english":"This rabbit is very small."}]'::jsonb),
('蛇', 'shé', 'snake', 3, '[{"chinese":"那条蛇很长。","pinyin":"Nà tiáo shé hěn cháng.","english":"That snake is very long."}]'::jsonb),
('老虎', 'lǎohǔ', 'tiger', 3, '[{"chinese":"老虎住在森林里。","pinyin":"Lǎohǔ zhù zài sēnlín lǐ.","english":"Tigers live in the forest."}]'::jsonb),
('可爱', 'kě''ài', 'cute', 2, '[{"chinese":"他的狗很可爱。","pinyin":"Tā de gǒu hěn kě''ài.","english":"His dog is very cute."}]'::jsonb)
ON CONFLICT DO NOTHING;

-- School
INSERT INTO vocabulary (chinese, pinyin, english, hsk_level, example_sentences)
VALUES
('作业', 'zuòyè', 'homework', 2, '[{"chinese":"我的作业还没写完。","pinyin":"Wǒ de zuòyè hái méi xiě wán.","english":"I haven''t finished my homework yet."}]'::jsonb),
('教室', 'jiàoshì', 'classroom', 2, '[{"chinese":"老师在教室里。","pinyin":"Lǎoshī zài jiàoshì lǐ.","english":"The teacher is in the classroom."}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Grammar: measure word nouns
INSERT INTO vocabulary (chinese, pinyin, english, hsk_level, example_sentences)
VALUES
('衣服', 'yīfu', 'clothes', 1, '[{"chinese":"这件衣服很漂亮。","pinyin":"Zhè jiàn yīfu hěn piàoliang.","english":"This piece of clothing is very pretty."}]'::jsonb),
('鞋', 'xié', 'shoes', 2, '[{"chinese":"我要买一双鞋。","pinyin":"Wǒ yào mǎi yì shuāng xié.","english":"I want to buy a pair of shoes."}]'::jsonb),
('筷子', 'kuàizi', 'chopsticks', 2, '[{"chinese":"请给我一双筷子。","pinyin":"Qǐng gěi wǒ yì shuāng kuàizi.","english":"Please give me a pair of chopsticks."}]'::jsonb),
('自行车', 'zìxíngchē', 'bicycle', 2, '[{"chinese":"他有两辆自行车。","pinyin":"Tā yǒu liǎng liàng zìxíngchē.","english":"He has two bicycles."}]'::jsonb)
ON CONFLICT DO NOTHING;


-- ── Clear old lesson_vocabulary links and re-populate ────────────

DELETE FROM lesson_vocabulary;

-- Greetings & Introductions
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'greetings-and-introductions'
  AND v.chinese IN ('你好', '谢谢', '再见', '对不起', '没关系', '不客气', '名字', '高兴', '认识', '工作', '请问', '朋友', '明天')
ON CONFLICT DO NOTHING;

-- Food & Dining
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'food-and-dining'
  AND v.chinese IN ('吃', '喝', '水', '菜', '好吃', '米饭', '面条', '面包', '咖啡', '茶', '鸡蛋', '肉', '辣', '服务员', '餐厅', '啤酒', '汤', '饱', '饭')
ON CONFLICT DO NOTHING;

-- Travel & Transportation
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'travel-and-transportation'
  AND v.chinese IN ('飞机', '火车', '出租车', '公共汽车', '地铁', '机场', '左', '右', '走', '路', '票', '车', '酒店', '北京', '站', '迷路')
ON CONFLICT DO NOTHING;

-- Animals & Nature
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'animals-and-nature'
  AND v.chinese IN ('猫', '狗', '鸟', '鱼', '马', '花', '树', '动物', '熊猫', '大象', '兔子', '蛇', '老虎', '可爱')
ON CONFLICT DO NOTHING;

-- School & Education
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'school-and-education'
  AND v.chinese IN ('学校', '老师', '学生', '学习', '考试', '课', '课本', '同学', '图书馆', '上课', '下课', '作业', '教室', '今天')
ON CONFLICT DO NOTHING;

-- Basic Sentence Structure
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'basic-sentence-structure'
  AND v.chinese IN ('是', '不', '没', '有', '想', '会', '说', '看', '书', '吃', '很', '肉', '钱', '早饭', '中文')
ON CONFLICT DO NOTHING;

-- Measure Words
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'measure-words'
  AND v.chinese IN ('个', '本', '杯', '块', '人', '书', '水', '猫', '鸟', '票', '车', '鱼', '衣服', '鞋', '筷子', '自行车', '钱')
ON CONFLICT DO NOTHING;

-- Question Patterns
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'question-particles'
  AND v.chinese IN ('吗', '呢', '什么', '谁', '哪', '哪里', '怎么', '多少', '几', '岁', '时候', '为什么', '名字', '中文')
ON CONFLICT DO NOTHING;

-- Time Expressions
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'time-expressions'
  AND v.chinese IN ('明天', '昨天', '今天', '早上', '晚上', '时候', '几', '星期', '月', '年', '现在', '去年', '上午', '下午')
ON CONFLICT DO NOTHING;

-- Negation
INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l
CROSS JOIN vocabulary v
WHERE l.slug = 'negation'
  AND v.chinese IN ('不', '没', '有', '是', '想', '吃', '喝', '钱', '高兴', '肉', '早饭', '咖啡')
ON CONFLICT DO NOTHING;

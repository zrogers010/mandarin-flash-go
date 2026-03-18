-- ═══════════════════════════════════════════════════════════════════
-- Migration 004: Seed lessons with sentence-based content
-- ═══════════════════════════════════════════════════════════════════

-- ── Grammar Lessons ──────────────────────────────────────────────

INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'basic-sentence-structure',
  'Basic Sentence Structure',
  'Learn the fundamental Subject-Verb-Object pattern that forms the backbone of Chinese sentences.',
  'grammar',
  'beginner',
  $body$<h3>Subject + Verb + Object</h3>
<p>Chinese follows a straightforward Subject-Verb-Object (SVO) word order, similar to English. The key difference is that Chinese does not conjugate verbs — the same form is used regardless of tense or subject.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我是中国人。</p>
    <p class="sentence-py">Wǒ shì zhōngguó rén.</p>
    <p class="sentence-en">I am Chinese.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他喜欢音乐。</p>
    <p class="sentence-py">Tā xǐhuan yīnyuè.</p>
    <p class="sentence-en">He likes music.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">她很漂亮。</p>
    <p class="sentence-py">Tā hěn piàoliang.</p>
    <p class="sentence-en">She is very pretty.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我们去学校。</p>
    <p class="sentence-py">Wǒmen qù xuéxiào.</p>
    <p class="sentence-en">We go to school.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这是我的书。</p>
    <p class="sentence-py">Zhè shì wǒ de shū.</p>
    <p class="sentence-en">This is my book.</p>
  </div>
</div>

<h3>Negation with 不 (bù)</h3>
<p>Place 不 before the verb to negate it. For the verb 有 (yǒu, to have), use 没 (méi) instead.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我不吃肉。</p>
    <p class="sentence-py">Wǒ bù chī ròu.</p>
    <p class="sentence-en">I don't eat meat.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他不是老师。</p>
    <p class="sentence-py">Tā bú shì lǎoshī.</p>
    <p class="sentence-en">He is not a teacher.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我没有钱。</p>
    <p class="sentence-py">Wǒ méiyǒu qián.</p>
    <p class="sentence-en">I don't have money.</p>
  </div>
</div>

<h3>Using 了 (le) for Completed Actions</h3>
<p>Add 了 after the verb to indicate a completed action (similar to past tense).</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我吃了早饭。</p>
    <p class="sentence-py">Wǒ chī le zǎofàn.</p>
    <p class="sentence-en">I ate breakfast.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他在看书。</p>
    <p class="sentence-py">Tā zài kàn shū.</p>
    <p class="sentence-en">He is reading a book.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我想学中文。</p>
    <p class="sentence-py">Wǒ xiǎng xué zhōngwén.</p>
    <p class="sentence-en">I want to learn Chinese.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你会说中文吗？</p>
    <p class="sentence-py">Nǐ huì shuō zhōngwén ma?</p>
    <p class="sentence-en">Can you speak Chinese?</p>
  </div>
</div>$body$,
  1
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'measure-words',
  'Measure Words',
  'Master the essential measure words (量词) used when counting objects in Chinese.',
  'grammar',
  'beginner',
  $body$<h3>What Are Measure Words?</h3>
<p>In Chinese, you must place a measure word (量词, liàngcí) between a number and a noun. Different nouns require different measure words based on the shape or type of object. 个 (gè) is the most common and can be used as a general fallback.</p>

<h3>个 (gè) — General / People</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">一个人</p>
    <p class="sentence-py">yí gè rén</p>
    <p class="sentence-en">one person</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">三个苹果</p>
    <p class="sentence-py">sān gè píngguǒ</p>
    <p class="sentence-en">three apples</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我有两个朋友。</p>
    <p class="sentence-py">Wǒ yǒu liǎng gè péngyou.</p>
    <p class="sentence-en">I have two friends.</p>
  </div>
</div>

<h3>本 (běn) — Books / Volumes</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">两本书</p>
    <p class="sentence-py">liǎng běn shū</p>
    <p class="sentence-en">two books</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我买了三本杂志。</p>
    <p class="sentence-py">Wǒ mǎi le sān běn zázhì.</p>
    <p class="sentence-en">I bought three magazines.</p>
  </div>
</div>

<h3>杯 (bēi) — Cups / Glasses</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">一杯水</p>
    <p class="sentence-py">yì bēi shuǐ</p>
    <p class="sentence-en">a glass of water</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">请给我两杯咖啡。</p>
    <p class="sentence-py">Qǐng gěi wǒ liǎng bēi kāfēi.</p>
    <p class="sentence-en">Please give me two cups of coffee.</p>
  </div>
</div>

<h3>只 (zhī) — Small Animals</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">一只猫</p>
    <p class="sentence-py">yì zhī māo</p>
    <p class="sentence-en">one cat</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">两只鸟</p>
    <p class="sentence-py">liǎng zhī niǎo</p>
    <p class="sentence-en">two birds</p>
  </div>
</div>

<h3>张 (zhāng) — Flat Objects</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">一张票</p>
    <p class="sentence-py">yì zhāng piào</p>
    <p class="sentence-en">one ticket</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">三张桌子</p>
    <p class="sentence-py">sān zhāng zhuōzi</p>
    <p class="sentence-en">three tables</p>
  </div>
</div>

<h3>辆 (liàng) — Vehicles</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">一辆车</p>
    <p class="sentence-py">yí liàng chē</p>
    <p class="sentence-en">one car</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他有两辆自行车。</p>
    <p class="sentence-py">Tā yǒu liǎng liàng zìxíngchē.</p>
    <p class="sentence-en">He has two bicycles.</p>
  </div>
</div>

<h3>件 (jiàn) — Clothing / Matters</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">一件衣服</p>
    <p class="sentence-py">yí jiàn yīfu</p>
    <p class="sentence-en">one piece of clothing</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这件事很重要。</p>
    <p class="sentence-py">Zhè jiàn shì hěn zhòngyào.</p>
    <p class="sentence-en">This matter is very important.</p>
  </div>
</div>

<h3>条 (tiáo) — Long / Thin Objects</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">三条鱼</p>
    <p class="sentence-py">sān tiáo yú</p>
    <p class="sentence-en">three fish</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">一条路</p>
    <p class="sentence-py">yì tiáo lù</p>
    <p class="sentence-en">one road</p>
  </div>
</div>

<h3>块 (kuài) — Pieces / Money</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">五块钱</p>
    <p class="sentence-py">wǔ kuài qián</p>
    <p class="sentence-en">five yuan</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">一块蛋糕</p>
    <p class="sentence-py">yí kuài dàngāo</p>
    <p class="sentence-en">one piece of cake</p>
  </div>
</div>

<h3>双 (shuāng) — Pairs</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">一双鞋</p>
    <p class="sentence-py">yì shuāng xié</p>
    <p class="sentence-en">one pair of shoes</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">两双筷子</p>
    <p class="sentence-py">liǎng shuāng kuàizi</p>
    <p class="sentence-en">two pairs of chopsticks</p>
  </div>
</div>$body$,
  2
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'question-particles',
  'Question Patterns',
  'Learn how to ask questions in Chinese using question words and the 吗 particle.',
  'grammar',
  'beginner',
  $body$<h3>吗 (ma) — Yes/No Questions</h3>
<p>The simplest way to ask a yes/no question is to add 吗 at the end of a statement. The word order stays exactly the same.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">你好吗？</p>
    <p class="sentence-py">Nǐ hǎo ma?</p>
    <p class="sentence-en">How are you? (Are you well?)</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你是学生吗？</p>
    <p class="sentence-py">Nǐ shì xuéshēng ma?</p>
    <p class="sentence-en">Are you a student?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你喜欢中国菜吗？</p>
    <p class="sentence-py">Nǐ xǐhuan zhōngguó cài ma?</p>
    <p class="sentence-en">Do you like Chinese food?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他会说英语吗？</p>
    <p class="sentence-py">Tā huì shuō yīngyǔ ma?</p>
    <p class="sentence-en">Can he speak English?</p>
  </div>
</div>

<h3>什么 (shénme) — What</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">这是什么？</p>
    <p class="sentence-py">Zhè shì shénme?</p>
    <p class="sentence-en">What is this?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你叫什么名字？</p>
    <p class="sentence-py">Nǐ jiào shénme míngzi?</p>
    <p class="sentence-en">What is your name?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你想吃什么？</p>
    <p class="sentence-py">Nǐ xiǎng chī shénme?</p>
    <p class="sentence-en">What do you want to eat?</p>
  </div>
</div>

<h3>谁 (shéi) — Who</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">你是谁？</p>
    <p class="sentence-py">Nǐ shì shéi?</p>
    <p class="sentence-en">Who are you?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">谁是你的老师？</p>
    <p class="sentence-py">Shéi shì nǐ de lǎoshī?</p>
    <p class="sentence-en">Who is your teacher?</p>
  </div>
</div>

<h3>哪里 / 哪儿 (nǎlǐ / nǎr) — Where</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">你在哪里？</p>
    <p class="sentence-py">Nǐ zài nǎlǐ?</p>
    <p class="sentence-en">Where are you?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">厕所在哪儿？</p>
    <p class="sentence-py">Cèsuǒ zài nǎr?</p>
    <p class="sentence-en">Where is the restroom?</p>
  </div>
</div>

<h3>什么时候 (shénme shíhou) — When</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">你什么时候来？</p>
    <p class="sentence-py">Nǐ shénme shíhou lái?</p>
    <p class="sentence-en">When are you coming?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我们什么时候出发？</p>
    <p class="sentence-py">Wǒmen shénme shíhou chūfā?</p>
    <p class="sentence-en">When do we depart?</p>
  </div>
</div>

<h3>为什么 (wèishénme) — Why</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">你为什么学中文？</p>
    <p class="sentence-py">Nǐ wèishénme xué zhōngwén?</p>
    <p class="sentence-en">Why are you learning Chinese?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">为什么不去？</p>
    <p class="sentence-py">Wèishénme bú qù?</p>
    <p class="sentence-en">Why not go?</p>
  </div>
</div>

<h3>怎么 (zěnme) — How</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">这个字怎么读？</p>
    <p class="sentence-py">Zhège zì zěnme dú?</p>
    <p class="sentence-en">How do you read this character?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">去机场怎么走？</p>
    <p class="sentence-py">Qù jīchǎng zěnme zǒu?</p>
    <p class="sentence-en">How do I get to the airport?</p>
  </div>
</div>

<h3>多少 / 几 (duōshao / jǐ) — How Many / How Much</h3>
<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">这个多少钱？</p>
    <p class="sentence-py">Zhège duōshao qián?</p>
    <p class="sentence-en">How much is this?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你几岁？</p>
    <p class="sentence-py">Nǐ jǐ suì?</p>
    <p class="sentence-en">How old are you?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你有几个孩子？</p>
    <p class="sentence-py">Nǐ yǒu jǐ gè háizi?</p>
    <p class="sentence-en">How many children do you have?</p>
  </div>
</div>

<h3>呢 (ne) — Bounce-Back Questions</h3>
<p>Use 呢 to ask "and you?" or "what about...?" after someone has already answered.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我很好，你呢？</p>
    <p class="sentence-py">Wǒ hěn hǎo, nǐ ne?</p>
    <p class="sentence-en">I'm fine, and you?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我喜欢咖啡，你呢？</p>
    <p class="sentence-py">Wǒ xǐhuan kāfēi, nǐ ne?</p>
    <p class="sentence-en">I like coffee, how about you?</p>
  </div>
</div>$body$,
  3
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


-- ── Topic Lessons ────────────────────────────────────────────────

INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'greetings-and-introductions',
  'Greetings & Introductions',
  'Essential phrases for meeting people, saying hello, and introducing yourself in Chinese.',
  'intro',
  'beginner',
  $body$<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">你好！</p>
    <p class="sentence-py">Nǐ hǎo!</p>
    <p class="sentence-en">Hello!</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你好吗？</p>
    <p class="sentence-py">Nǐ hǎo ma?</p>
    <p class="sentence-en">How are you?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我很好，谢谢。</p>
    <p class="sentence-py">Wǒ hěn hǎo, xièxie.</p>
    <p class="sentence-en">I'm fine, thank you.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你叫什么名字？</p>
    <p class="sentence-py">Nǐ jiào shénme míngzi?</p>
    <p class="sentence-en">What is your name?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我叫大卫。</p>
    <p class="sentence-py">Wǒ jiào Dàwèi.</p>
    <p class="sentence-en">My name is David.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">很高兴认识你。</p>
    <p class="sentence-py">Hěn gāoxìng rènshi nǐ.</p>
    <p class="sentence-en">Nice to meet you.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你是哪国人？</p>
    <p class="sentence-py">Nǐ shì nǎ guó rén?</p>
    <p class="sentence-en">What country are you from?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我是美国人。</p>
    <p class="sentence-py">Wǒ shì měiguó rén.</p>
    <p class="sentence-en">I am American.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">谢谢你！</p>
    <p class="sentence-py">Xièxie nǐ!</p>
    <p class="sentence-en">Thank you!</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">不客气。</p>
    <p class="sentence-py">Bú kèqi.</p>
    <p class="sentence-en">You're welcome.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">对不起。</p>
    <p class="sentence-py">Duìbùqǐ.</p>
    <p class="sentence-en">I'm sorry.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">没关系。</p>
    <p class="sentence-py">Méi guānxi.</p>
    <p class="sentence-en">It's okay. / No problem.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">再见！</p>
    <p class="sentence-py">Zàijiàn!</p>
    <p class="sentence-en">Goodbye!</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">明天见！</p>
    <p class="sentence-py">Míngtiān jiàn!</p>
    <p class="sentence-en">See you tomorrow!</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">请问，你做什么工作？</p>
    <p class="sentence-py">Qǐngwèn, nǐ zuò shénme gōngzuò?</p>
    <p class="sentence-en">May I ask, what do you do for work?</p>
  </div>
</div>$body$,
  1
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'food-and-dining',
  'Food & Dining',
  'Useful sentences for ordering food, describing meals, and dining out in Chinese.',
  'food',
  'beginner',
  $body$<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">你想吃什么？</p>
    <p class="sentence-py">Nǐ xiǎng chī shénme?</p>
    <p class="sentence-en">What do you want to eat?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我想喝咖啡。</p>
    <p class="sentence-py">Wǒ xiǎng hē kāfēi.</p>
    <p class="sentence-en">I want to drink coffee.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这个菜很好吃。</p>
    <p class="sentence-py">Zhège cài hěn hǎochī.</p>
    <p class="sentence-en">This dish is delicious.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">请给我一杯水。</p>
    <p class="sentence-py">Qǐng gěi wǒ yì bēi shuǐ.</p>
    <p class="sentence-en">Please give me a glass of water.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">服务员，买单！</p>
    <p class="sentence-py">Fúwùyuán, mǎidān!</p>
    <p class="sentence-en">Waiter, the bill please!</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我不吃辣的。</p>
    <p class="sentence-py">Wǒ bù chī là de.</p>
    <p class="sentence-en">I don't eat spicy food.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你喜欢中国菜吗？</p>
    <p class="sentence-py">Nǐ xǐhuan zhōngguó cài ma?</p>
    <p class="sentence-en">Do you like Chinese food?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">早上我吃面包。</p>
    <p class="sentence-py">Zǎoshang wǒ chī miànbāo.</p>
    <p class="sentence-en">In the morning I eat bread.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">米饭还是面条？</p>
    <p class="sentence-py">Mǐfàn háishi miàntiáo?</p>
    <p class="sentence-en">Rice or noodles?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这个多少钱？</p>
    <p class="sentence-py">Zhège duōshao qián?</p>
    <p class="sentence-en">How much is this?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我要一碗汤。</p>
    <p class="sentence-py">Wǒ yào yì wǎn tāng.</p>
    <p class="sentence-en">I want a bowl of soup.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你吃饱了吗？</p>
    <p class="sentence-py">Nǐ chī bǎo le ma?</p>
    <p class="sentence-en">Are you full?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我们去餐厅吃饭吧。</p>
    <p class="sentence-py">Wǒmen qù cāntīng chīfàn ba.</p>
    <p class="sentence-en">Let's go eat at a restaurant.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">再来一瓶啤酒。</p>
    <p class="sentence-py">Zài lái yì píng píjiǔ.</p>
    <p class="sentence-en">Another bottle of beer, please.</p>
  </div>
</div>$body$,
  1
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'travel-and-transportation',
  'Travel & Transportation',
  'Key phrases for getting around, asking directions, and navigating transportation in China.',
  'travel',
  'beginner',
  $body$<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">请问，地铁站在哪里？</p>
    <p class="sentence-py">Qǐngwèn, dìtiě zhàn zài nǎlǐ?</p>
    <p class="sentence-en">Excuse me, where is the subway station?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我要去机场。</p>
    <p class="sentence-py">Wǒ yào qù jīchǎng.</p>
    <p class="sentence-en">I need to go to the airport.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这趟火车去北京吗？</p>
    <p class="sentence-py">Zhè tàng huǒchē qù Běijīng ma?</p>
    <p class="sentence-en">Does this train go to Beijing?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">请帮我叫一辆出租车。</p>
    <p class="sentence-py">Qǐng bāng wǒ jiào yí liàng chūzūchē.</p>
    <p class="sentence-en">Please call a taxi for me.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">从这里到那里要多长时间？</p>
    <p class="sentence-py">Cóng zhèlǐ dào nàlǐ yào duō cháng shíjiān?</p>
    <p class="sentence-en">How long does it take from here to there?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我迷路了。</p>
    <p class="sentence-py">Wǒ mílù le.</p>
    <p class="sentence-en">I'm lost.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">往左拐。</p>
    <p class="sentence-py">Wǎng zuǒ guǎi.</p>
    <p class="sentence-en">Turn left.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">往右拐。</p>
    <p class="sentence-py">Wǎng yòu guǎi.</p>
    <p class="sentence-en">Turn right.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">一直走。</p>
    <p class="sentence-py">Yìzhí zǒu.</p>
    <p class="sentence-en">Go straight ahead.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我想买一张票。</p>
    <p class="sentence-py">Wǒ xiǎng mǎi yì zhāng piào.</p>
    <p class="sentence-en">I want to buy a ticket.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">下一站是哪里？</p>
    <p class="sentence-py">Xià yí zhàn shì nǎlǐ?</p>
    <p class="sentence-en">What is the next stop?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我的酒店在这附近。</p>
    <p class="sentence-py">Wǒ de jiǔdiàn zài zhè fùjìn.</p>
    <p class="sentence-en">My hotel is near here.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">坐公共汽车还是坐地铁？</p>
    <p class="sentence-py">Zuò gōnggòng qìchē háishi zuò dìtiě?</p>
    <p class="sentence-en">Take the bus or the subway?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">请问，这里可以停车吗？</p>
    <p class="sentence-py">Qǐngwèn, zhèlǐ kěyǐ tíngchē ma?</p>
    <p class="sentence-en">Excuse me, can I park here?</p>
  </div>
</div>$body$,
  1
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'animals-and-nature',
  'Animals & Nature',
  'Learn to talk about common animals and the natural world in Chinese.',
  'animals',
  'beginner',
  $body$<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我家有一只猫。</p>
    <p class="sentence-py">Wǒ jiā yǒu yì zhī māo.</p>
    <p class="sentence-en">I have a cat at home.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他的狗很可爱。</p>
    <p class="sentence-py">Tā de gǒu hěn kě'ài.</p>
    <p class="sentence-en">His dog is very cute.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">动物园里有很多动物。</p>
    <p class="sentence-py">Dòngwùyuán lǐ yǒu hěn duō dòngwù.</p>
    <p class="sentence-en">There are many animals in the zoo.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">鸟在树上唱歌。</p>
    <p class="sentence-py">Niǎo zài shù shàng chànggē.</p>
    <p class="sentence-en">The birds are singing in the tree.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">鱼在水里游泳。</p>
    <p class="sentence-py">Yú zài shuǐ lǐ yóuyǒng.</p>
    <p class="sentence-en">The fish are swimming in the water.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">大象是最大的陆地动物。</p>
    <p class="sentence-py">Dàxiàng shì zuì dà de lùdì dòngwù.</p>
    <p class="sentence-en">The elephant is the largest land animal.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">熊猫是中国的国宝。</p>
    <p class="sentence-py">Xióngmāo shì zhōngguó de guóbǎo.</p>
    <p class="sentence-en">The panda is China's national treasure.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这只兔子很小。</p>
    <p class="sentence-py">Zhè zhī tùzi hěn xiǎo.</p>
    <p class="sentence-en">This rabbit is very small.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">马跑得很快。</p>
    <p class="sentence-py">Mǎ pǎo de hěn kuài.</p>
    <p class="sentence-en">Horses run very fast.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你喜欢什么动物？</p>
    <p class="sentence-py">Nǐ xǐhuan shénme dòngwù?</p>
    <p class="sentence-en">What animal do you like?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">那条蛇很长。</p>
    <p class="sentence-py">Nà tiáo shé hěn cháng.</p>
    <p class="sentence-en">That snake is very long.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">公园里有很多花。</p>
    <p class="sentence-py">Gōngyuán lǐ yǒu hěn duō huā.</p>
    <p class="sentence-en">There are many flowers in the park.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">老虎住在森林里。</p>
    <p class="sentence-py">Lǎohǔ zhù zài sēnlín lǐ.</p>
    <p class="sentence-en">Tigers live in the forest.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">今天天气很好。</p>
    <p class="sentence-py">Jīntiān tiānqì hěn hǎo.</p>
    <p class="sentence-en">The weather is nice today.</p>
  </div>
</div>$body$,
  1
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'school-and-education',
  'School & Education',
  'Common sentences for talking about school, classes, studying, and campus life.',
  'school',
  'beginner',
  $body$<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我是学生。</p>
    <p class="sentence-py">Wǒ shì xuéshēng.</p>
    <p class="sentence-en">I am a student.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">老师在教室里。</p>
    <p class="sentence-py">Lǎoshī zài jiàoshì lǐ.</p>
    <p class="sentence-en">The teacher is in the classroom.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">今天有什么课？</p>
    <p class="sentence-py">Jīntiān yǒu shénme kè?</p>
    <p class="sentence-en">What classes are there today?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我在学习中文。</p>
    <p class="sentence-py">Wǒ zài xuéxí zhōngwén.</p>
    <p class="sentence-en">I am studying Chinese.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">考试很难。</p>
    <p class="sentence-py">Kǎoshì hěn nán.</p>
    <p class="sentence-en">The exam is very difficult.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">请打开课本。</p>
    <p class="sentence-py">Qǐng dǎkāi kèběn.</p>
    <p class="sentence-en">Please open your textbook.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我的作业还没写完。</p>
    <p class="sentence-py">Wǒ de zuòyè hái méi xiě wán.</p>
    <p class="sentence-en">I haven't finished my homework yet.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">图书馆在哪里？</p>
    <p class="sentence-py">Túshūguǎn zài nǎlǐ?</p>
    <p class="sentence-en">Where is the library?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">下课了！</p>
    <p class="sentence-py">Xiàkè le!</p>
    <p class="sentence-en">Class is over!</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我每天早上八点上课。</p>
    <p class="sentence-py">Wǒ měitiān zǎoshang bā diǎn shàngkè.</p>
    <p class="sentence-en">I have class at 8 AM every day.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这学期我学了五门课。</p>
    <p class="sentence-py">Zhè xuéqī wǒ xué le wǔ mén kè.</p>
    <p class="sentence-en">I took five courses this semester.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我的学校很大。</p>
    <p class="sentence-py">Wǒ de xuéxiào hěn dà.</p>
    <p class="sentence-en">My school is very big.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他是我的同学。</p>
    <p class="sentence-py">Tā shì wǒ de tóngxué.</p>
    <p class="sentence-en">He is my classmate.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">明天要交作业。</p>
    <p class="sentence-py">Míngtiān yào jiāo zuòyè.</p>
    <p class="sentence-en">The homework is due tomorrow.</p>
  </div>
</div>$body$,
  1
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


-- ── Grammar: Time Expressions ───────────────────────────────────

INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'time-expressions',
  'Time Expressions',
  'Learn how to talk about time, days, months, and when things happen in Chinese.',
  'grammar',
  'beginner',
  $body$<h3>Time Word Placement</h3>
<p>In Chinese, time words come BEFORE the verb. The order goes from largest unit to smallest: year → month → day → hour. This is opposite to English.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我明天去北京。</p>
    <p class="sentence-py">Wǒ míngtiān qù Běijīng.</p>
    <p class="sentence-en">I'm going to Beijing tomorrow.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他昨天没来。</p>
    <p class="sentence-py">Tā zuótiān méi lái.</p>
    <p class="sentence-en">He didn't come yesterday.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我们今天下午三点开会。</p>
    <p class="sentence-py">Wǒmen jīntiān xiàwǔ sān diǎn kāihuì.</p>
    <p class="sentence-en">We have a meeting at 3 PM this afternoon.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">你每天几点起床？</p>
    <p class="sentence-py">Nǐ měitiān jǐ diǎn qǐchuáng?</p>
    <p class="sentence-en">What time do you get up every day?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我早上七点吃早饭。</p>
    <p class="sentence-py">Wǒ zǎoshang qī diǎn chī zǎofàn.</p>
    <p class="sentence-en">I eat breakfast at 7 AM.</p>
  </div>
</div>

<h3>Days of the Week</h3>
<p>Use 星期 (xīngqī) + a number for days of the week. Sunday is special: 星期天 or 星期日.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">今天星期几？</p>
    <p class="sentence-py">Jīntiān xīngqī jǐ?</p>
    <p class="sentence-en">What day is it today?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">星期一我很忙。</p>
    <p class="sentence-py">Xīngqī yī wǒ hěn máng.</p>
    <p class="sentence-en">I'm very busy on Monday.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我们星期六去看电影。</p>
    <p class="sentence-py">Wǒmen xīngqī liù qù kàn diànyǐng.</p>
    <p class="sentence-en">We're going to see a movie on Saturday.</p>
  </div>
</div>

<h3>Months and Dates</h3>
<p>Months are simply number + 月 (yuè): 一月 (January), 二月 (February), etc. Dates use 号 (hào) in spoken Chinese.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">今天几月几号？</p>
    <p class="sentence-py">Jīntiān jǐ yuè jǐ hào?</p>
    <p class="sentence-en">What's today's date?</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我的生日是十月五号。</p>
    <p class="sentence-py">Wǒ de shēngrì shì shí yuè wǔ hào.</p>
    <p class="sentence-en">My birthday is October 5th.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他下个月回国。</p>
    <p class="sentence-py">Tā xià ge yuè huíguó.</p>
    <p class="sentence-en">He's going back to his country next month.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">去年我去了中国。</p>
    <p class="sentence-py">Qùnián wǒ qù le Zhōngguó.</p>
    <p class="sentence-en">I went to China last year.</p>
  </div>
</div>$body$,
  4
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


-- ── Grammar: Negation ───────────────────────────────────────────

INSERT INTO lessons (slug, title, description, category, difficulty, content, sort_order)
VALUES (
  'negation',
  'Negation: 不 vs 没',
  'Learn the two main ways to negate in Chinese and when to use each one.',
  'grammar',
  'beginner',
  $body$<h3>不 (bù) — General Negation</h3>
<p>不 negates habitual actions, states, willingness, and the future. It's also used with adjectives. Note: 不 changes to second tone (bú) before a fourth-tone syllable.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我不喝咖啡。</p>
    <p class="sentence-py">Wǒ bù hē kāfēi.</p>
    <p class="sentence-en">I don't drink coffee.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他不是老师。</p>
    <p class="sentence-py">Tā bú shì lǎoshī.</p>
    <p class="sentence-en">He is not a teacher.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">这个菜不好吃。</p>
    <p class="sentence-py">Zhège cài bù hǎochī.</p>
    <p class="sentence-en">This dish doesn't taste good.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我不想去。</p>
    <p class="sentence-py">Wǒ bù xiǎng qù.</p>
    <p class="sentence-en">I don't want to go.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">她不高兴。</p>
    <p class="sentence-py">Tā bù gāoxìng.</p>
    <p class="sentence-en">She is not happy.</p>
  </div>
</div>

<h3>没 (méi) — Past & Completion Negation</h3>
<p>没 (often 没有, méiyǒu) negates completed actions and the existence of something. Never use 了 with 没.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我没去过中国。</p>
    <p class="sentence-py">Wǒ méi qù guò Zhōngguó.</p>
    <p class="sentence-en">I haven't been to China.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">他没有钱。</p>
    <p class="sentence-py">Tā méiyǒu qián.</p>
    <p class="sentence-en">He doesn't have money.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">昨天我没吃早饭。</p>
    <p class="sentence-py">Zuótiān wǒ méi chī zǎofàn.</p>
    <p class="sentence-en">I didn't eat breakfast yesterday.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">她还没来。</p>
    <p class="sentence-py">Tā hái méi lái.</p>
    <p class="sentence-en">She hasn't arrived yet.</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我没听懂。</p>
    <p class="sentence-py">Wǒ méi tīng dǒng.</p>
    <p class="sentence-en">I didn't understand (what I heard).</p>
  </div>
</div>

<h3>Key Difference</h3>
<p>Use 不 for things you choose not to do or states that aren't true. Use 没 for things that didn't happen or don't exist.</p>

<div class="sentence-list">
  <div class="sentence-item">
    <p class="sentence-zh">我不吃肉。</p>
    <p class="sentence-py">Wǒ bù chī ròu.</p>
    <p class="sentence-en">I don't eat meat. (habit / choice)</p>
  </div>
  <div class="sentence-item">
    <p class="sentence-zh">我没吃肉。</p>
    <p class="sentence-py">Wǒ méi chī ròu.</p>
    <p class="sentence-en">I didn't eat meat. (past action)</p>
  </div>
</div>$body$,
  5
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;


-- ── Cleanup: remove stale duplicate lesson slugs ────────────────

DELETE FROM lessons WHERE slug = 'animals' AND slug != 'animals-and-nature';


-- ── Link seeded vocabulary to relevant lessons ───────────────────

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, 1
FROM lessons l, vocabulary v
WHERE l.slug = 'greetings-and-introductions' AND v.chinese IN ('你好', '谢谢', '再见', '对不起', '没关系', '朋友')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, 1
FROM lessons l, vocabulary v
WHERE l.slug = 'school-and-education' AND v.chinese IN ('学校', '老师', '学生', '学习')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, 1
FROM lessons l, vocabulary v
WHERE l.slug = 'basic-sentence-structure' AND v.chinese IN ('学习', '工作', '学校', '朋友')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, 1
FROM lessons l, vocabulary v
WHERE l.slug = 'travel-and-transportation' AND v.chinese IN ('中国', '美国', '英国', '日本', '韩国', '法国', '德国', '意大利')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, 1
FROM lessons l, vocabulary v
WHERE l.slug = 'food-and-dining' AND v.chinese IN ('早上', '晚上')
ON CONFLICT DO NOTHING;

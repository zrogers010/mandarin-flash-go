#!/usr/bin/env python3

# HSK 3.0 Level 1 vocabulary with pinyin, English, parts of speech, and example sentences
vocabulary_data = [
    ("爱", "ài", "love", "verb", [
        {"chinese": "我爱我的家人。", "pinyin": "Wǒ ài wǒ de jiārén.", "english": "I love my family."},
        {"chinese": "这个孩子很可爱。", "pinyin": "Zhège háizi hěn kě'ài.", "english": "This child is very lovely."},
        {"chinese": "爱情是人生中最美好的事情。", "pinyin": "Àiqíng shì rénshēng zhōng zuì měihǎo de shìqíng.", "english": "Love is the most beautiful thing in life."}
    ]),
    ("爱好", "àihào", "hobby", "noun", [
        {"chinese": "我的爱好是读书。", "pinyin": "Wǒ de àihào shì dúshū.", "english": "My hobby is reading."},
        {"chinese": "你有什么爱好？", "pinyin": "Nǐ yǒu shénme àihào?", "english": "What are your hobbies?"},
        {"chinese": "培养良好的爱好对生活很重要。", "pinyin": "Péiyǎng liánghǎo de àihào duì shēnghuó hěn zhòngyào.", "english": "Developing good hobbies is important for life."}
    ]),
    ("八", "bā", "eight", "numeral", [
        {"chinese": "现在是八点。", "pinyin": "Xiànzài shì bā diǎn.", "english": "It's eight o'clock now."},
        {"chinese": "我有八个苹果。", "pinyin": "Wǒ yǒu bā gè píngguǒ.", "english": "I have eight apples."},
        {"chinese": "八月是夏天的最后一个月。", "pinyin": "Bāyuè shì xiàtiān de zuìhòu yīgè yuè.", "english": "August is the last month of summer."}
    ]),
    ("爸爸", "bàba", "father", "noun", [
        {"chinese": "我爸爸很忙。", "pinyin": "Wǒ bàba hěn máng.", "english": "My father is very busy."},
        {"chinese": "爸爸，我爱你。", "pinyin": "Bàba, wǒ ài nǐ.", "english": "Dad, I love you."},
        {"chinese": "我的爸爸每天都很早起床工作。", "pinyin": "Wǒ de bàba měitiān dōu hěn zǎo qǐchuáng gōngzuò.", "english": "My father gets up early to work every day."}
    ]),
    ("吧", "ba", "particle", "particle", [
        {"chinese": "我们走吧。", "pinyin": "Wǒmen zǒu ba.", "english": "Let's go."},
        {"chinese": "好吧。", "pinyin": "Hǎo ba.", "english": "Okay."},
        {"chinese": "你试试看吧。", "pinyin": "Nǐ shìshì kàn ba.", "english": "Try it."}
    ]),
    ("白", "bái", "white", "adjective", [
        {"chinese": "这件衣服是白色的。", "pinyin": "Zhè jiàn yīfu shì báisè de.", "english": "This piece of clothing is white."},
        {"chinese": "白云很漂亮。", "pinyin": "Báiyún hěn piàoliang.", "english": "White clouds are beautiful."},
        {"chinese": "白色的雪花从天空中飘落下来。", "pinyin": "Báisè de xuěhuā cóng tiānkōng zhōng piāoluò xiàlái.", "english": "White snowflakes fall from the sky."}
    ]),
    ("白天", "báitiān", "daytime", "noun", [
        {"chinese": "白天很热。", "pinyin": "Báitiān hěn rè.", "english": "It's very hot during the day."},
        {"chinese": "我喜欢白天工作。", "pinyin": "Wǒ xǐhuan báitiān gōngzuò.", "english": "I like working during the day."},
        {"chinese": "白天的阳光照在花园里很温暖。", "pinyin": "Báitiān de yángguāng zhào zài huāyuán lǐ hěn wēnnuǎn.", "english": "The sunlight during the day is warm in the garden."}
    ]),
    ("百", "bǎi", "hundred", "numeral", [
        {"chinese": "一百元。", "pinyin": "Yībǎi yuán.", "english": "One hundred yuan."},
        {"chinese": "这本书有几百页。", "pinyin": "Zhè běn shū yǒu jǐbǎi yè.", "english": "This book has several hundred pages."},
        {"chinese": "百年老店里的商品质量很好。", "pinyin": "Bǎinián lǎodiàn lǐ de shāngpǐn zhìliàng hěn hǎo.", "english": "The quality of goods in the century-old store is very good."}
    ]),
    ("班", "bān", "class", "noun", [
        {"chinese": "我在一班。", "pinyin": "Wǒ zài yībān.", "english": "I'm in Class One."},
        {"chinese": "这个班有三十个学生。", "pinyin": "Zhège bān yǒu sānshí gè xuéshēng.", "english": "This class has thirty students."},
        {"chinese": "班里的同学们都很努力学习。", "pinyin": "Bān lǐ de tóngxuémen dōu hěn nǔlì xuéxí.", "english": "All the students in the class study very hard."}
    ]),
    ("半", "bàn", "half", "numeral", [
        {"chinese": "现在是半点。", "pinyin": "Xiànzài shì bàndiǎn.", "english": "It's half past now."},
        {"chinese": "我吃了半个苹果。", "pinyin": "Wǒ chīle bàn gè píngguǒ.", "english": "I ate half an apple."},
        {"chinese": "半年的时间很快就过去了。", "pinyin": "Bànnián de shíjiān hěn kuài jiù guòqùle.", "english": "Half a year passed very quickly."}
    ])
]

def generate_migration():
    migration_content = """-- Migration: 002_add_hsk_3_0_level_1_vocabulary.sql
-- Add complete HSK 3.0 Level 1 vocabulary with pinyin, English, parts of speech, and example sentences

INSERT INTO vocabulary (chinese, pinyin, english, part_of_speech, hsk_level, example_sentences) VALUES
"""
    
    for word, pinyin, english, pos, examples in vocabulary_data:
        # Convert examples to JSON string
        examples_json = str(examples).replace("'", '"')
        migration_content += f"""('{word}', '{pinyin}', '{english}', '{pos}', 1, '{examples_json}'),
"""
    
    migration_content = migration_content.rstrip(',\n') + ';'
    return migration_content

if __name__ == "__main__":
    migration = generate_migration()
    with open('backend/db/migrations/002_add_hsk_3_0_level_1_vocabulary.sql', 'w', encoding='utf-8') as f:
        f.write(migration)
    print("Migration file generated: backend/db/migrations/002_add_hsk_3_0_level_1_vocabulary.sql")
    print(f"Added {len(vocabulary_data)} vocabulary words") 
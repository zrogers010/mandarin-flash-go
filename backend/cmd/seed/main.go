package main

import (
	"fmt"
	"log"

	"chinese-learning/internal/config"
	"chinese-learning/internal/database"

	_ "github.com/lib/pq"
)

// Sample HSK vocabulary data
var sampleVocabulary = []struct {
	chinese         string
	pinyin          string
	english         string
	level           int
	exampleSentence string
}{
	{"你好", "nǐ hǎo", "hello", 1, "你好！很高兴认识你。"},
	{"谢谢", "xiè xie", "thank you", 1, "谢谢你的帮助。"},
	{"再见", "zài jiàn", "goodbye", 1, "明天再见！"},
	{"对不起", "duì bù qǐ", "sorry", 1, "对不起，我来晚了。"},
	{"没关系", "méi guān xi", "it's okay", 1, "没关系，不用道歉。"},
	{"学习", "xué xí", "to study", 1, "我在学习中文。"},
	{"工作", "gōng zuò", "work", 1, "我每天工作八小时。"},
	{"朋友", "péng you", "friend", 1, "他是我的好朋友。"},
	{"家庭", "jiā tíng", "family", 1, "我有一个幸福的家庭。"},
	{"学校", "xué xiào", "school", 1, "我的学校很大。"},
	{"老师", "lǎo shī", "teacher", 1, "我的中文老师很好。"},
	{"学生", "xué sheng", "student", 1, "我是一个学生。"},
	{"中国", "zhōng guó", "China", 1, "中国是一个大国。"},
	{"美国", "měi guó", "America", 1, "美国有很多州。"},
	{"英国", "yīng guó", "England", 1, "英国的首都是伦敦。"},
	{"日本", "rì běn", "Japan", 1, "日本有很多高科技产品。"},
	{"韩国", "hán guó", "Korea", 1, "韩国的泡菜很有名。"},
	{"法国", "fǎ guó", "France", 1, "法国的葡萄酒很好喝。"},
	{"德国", "dé guó", "Germany", 1, "德国的汽车质量很好。"},
	{"意大利", "yì dà lì", "Italy", 1, "意大利的披萨很好吃。"},
	{"时间", "shí jiān", "time", 1, "现在几点了？"},
	{"今天", "jīn tiān", "today", 1, "今天天气很好。"},
	{"明天", "míng tiān", "tomorrow", 1, "明天我要去学校。"},
	{"昨天", "zuó tiān", "yesterday", 1, "昨天我看了电影。"},
	{"现在", "xiàn zài", "now", 1, "现在开始上课。"},
	{"晚上", "wǎn shang", "evening", 1, "晚上我要学习。"},
	{"早上", "zǎo shang", "morning", 1, "早上我六点起床。"},
	{"下午", "xià wǔ", "afternoon", 1, "下午我要工作。"},
}

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Insert sample vocabulary
	fmt.Println("🌱 Seeding database with HSK vocabulary...")

	for _, vocab := range sampleVocabulary {
		_, err := db.Exec(`
			INSERT INTO vocabulary (chinese, pinyin, english, hsk_level, example_sentences)
			VALUES ($1, $2, $3, $4, $5)
		`, vocab.chinese, vocab.pinyin, vocab.english, vocab.level, fmt.Sprintf(`[{"chinese": "%s", "pinyin": "%s", "english": "%s", "type": "simple"}]`, vocab.chinese, vocab.pinyin, vocab.exampleSentence))

		if err != nil {
			log.Printf("Error inserting %s: %v", vocab.chinese, err)
		} else {
			fmt.Printf("✅ Added: %s (%s) - %s (HSK %d)\n",
				vocab.chinese, vocab.pinyin, vocab.english, vocab.level)
		}
	}

	fmt.Println("🎉 Database seeding completed!")
}

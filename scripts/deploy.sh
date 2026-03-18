#!/usr/bin/env bash
#
# Deploy MandarinFlash to production.
# Run from the project root directory as the deploy user.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Use docker compose plugin or standalone
if docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
else
    DC="docker-compose"
fi
COMPOSE_FILE="-f docker-compose.prod.yml"

echo "=== MandarinFlash Deploy ==="
echo "  Project: $PROJECT_DIR"
echo "  Compose: $DC $COMPOSE_FILE"
echo ""

# ---------- Pre-flight checks ----------
if [ ! -f .env ]; then
    echo "ERROR: .env file not found. Copy .env.example and fill in production values."
    exit 1
fi

source .env

if [ -z "${DOMAIN:-}" ]; then
    echo "ERROR: DOMAIN is not set in .env"
    exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
    echo "ERROR: JWT_SECRET is not set in .env"
    exit 1
fi

if [ "${DB_PASSWORD:-password}" = "password" ]; then
    echo "ERROR: DB_PASSWORD is still the default. Set a strong password in .env"
    exit 1
fi

# ---------- Pull latest code ----------
if git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
    echo "[1/5] Pulling latest code..."
    git pull --ff-only || {
        echo "  WARNING: git pull failed (maybe not on a tracked branch). Continuing..."
    }
else
    echo "[1/5] Not a git repo, skipping pull."
fi

# ---------- Build images ----------
echo "[2/5] Building production images..."
$DC $COMPOSE_FILE build

# ---------- Start database first and run migrations ----------
echo "[3/5] Starting database and running migrations..."
$DC $COMPOSE_FILE up -d postgres redis

echo "  Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if $DC $COMPOSE_FILE exec -T postgres pg_isready -U "${DB_USER:-postgres}" &>/dev/null; then
        break
    fi
    sleep 2
done

for migration in backend/db/migrations/*.sql; do
    if [ -f "$migration" ]; then
        MIGRATION_NAME="$(basename "$migration")"
        echo "  Applying $MIGRATION_NAME..."
        $DC $COMPOSE_FILE exec -T postgres psql \
            -U "${DB_USER:-postgres}" \
            -d "${DB_NAME:-chinese_learning}" \
            -f "/docker-entrypoint-initdb.d/$MIGRATION_NAME" 2>&1 | tail -5
    fi
done
echo "  Migrations applied."

# Run all seed files (idempotent — they use ON CONFLICT DO NOTHING)
SEED_DIR="backend/db/seeds"
if [ -d "$SEED_DIR" ] && ls "$SEED_DIR"/*.sql &>/dev/null 2>&1; then
    echo "  Applying seed data (idempotent)..."
    for seed_file in "$SEED_DIR"/*.sql; do
        echo "    $(basename "$seed_file")..."
        $DC $COMPOSE_FILE exec -T postgres psql \
            -U "${DB_USER:-postgres}" \
            -d "${DB_NAME:-chinese_learning}" < "$seed_file" 2>&1 | tail -3
    done
    VOCAB_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM vocabulary;" 2>/dev/null || echo "?")
    LESSON_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM lessons;" 2>/dev/null || echo "?")
    echo "  Seed complete ($VOCAB_COUNT words, $LESSON_COUNT lessons)."
else
    echo "  WARNING: No seed files found in $SEED_DIR/"
fi

# Rebuild lesson↔vocabulary links after seeds (seed 003 may overwrite them).
echo "  Re-linking lesson vocabulary (post-seed)..."
$DC $COMPOSE_FILE exec -T postgres psql \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-chinese_learning}" <<'EOSQL'
DELETE FROM lesson_vocabulary;
DELETE FROM lessons WHERE slug = 'animals';

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'greetings-and-introductions'
  AND v.chinese IN ('你好','谢谢','再见','对不起','没关系','不客气','名字','高兴','认识','工作','请问','朋友','明天')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'food-and-dining'
  AND v.chinese IN ('吃','喝','水','菜','好吃','米饭','面条','面包','咖啡','茶','鸡蛋','肉','辣','服务员','餐厅','啤酒','汤','饱','饭')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'travel-and-transportation'
  AND v.chinese IN ('飞机','火车','出租车','公共汽车','地铁','机场','左','右','走','路','票','车','酒店','北京','站','迷路')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'animals-and-nature'
  AND v.chinese IN ('猫','狗','鸟','鱼','马','花','树','动物','熊猫','大象','兔子','蛇','老虎','可爱')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'school-and-education'
  AND v.chinese IN ('学校','老师','学生','学习','考试','课','课本','同学','图书馆','上课','下课','作业','教室','今天')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'basic-sentence-structure'
  AND v.chinese IN ('是','不','没','有','想','会','说','看','书','吃','很','肉','钱','早饭','中文')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'measure-words'
  AND v.chinese IN ('个','本','杯','块','人','书','水','猫','鸟','票','车','鱼','衣服','鞋','筷子','自行车','钱')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'question-particles'
  AND v.chinese IN ('吗','呢','什么','谁','哪','哪里','怎么','多少','几','岁','时候','为什么','名字','中文')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'time-expressions'
  AND v.chinese IN ('明天','昨天','今天','早上','晚上','时候','几','星期','月','年','现在','去年','上午','下午')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_vocabulary (lesson_id, vocabulary_id, sort_order)
SELECT l.id, v.id, row_number() OVER (ORDER BY v.hsk_level, v.pinyin)
FROM lessons l CROSS JOIN vocabulary v
WHERE l.slug = 'negation'
  AND v.chinese IN ('不','没','有','是','想','吃','喝','钱','高兴','肉','早饭','咖啡')
ON CONFLICT DO NOTHING;
EOSQL
LV_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM lesson_vocabulary;" 2>/dev/null || echo "?")
echo "  Lesson-vocabulary links: $LV_COUNT"

# ---------- Restart all services ----------
echo "[4/5] Starting all services..."
$DC $COMPOSE_FILE up -d

echo "  Waiting for services to stabilize..."
sleep 10

# ---------- Health check ----------
echo "[5/5] Running health check..."
RETRIES=5
for i in $(seq 1 $RETRIES); do
    STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost/health" 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        echo "  Health check passed."
        break
    fi
    if [ "$i" = "$RETRIES" ]; then
        echo "  WARNING: Health check failed after $RETRIES attempts (HTTP $STATUS)."
        echo "  Check logs: $DC $COMPOSE_FILE logs"
    fi
    sleep 5
done

echo ""
echo "=== Deploy complete ==="
echo ""
$DC $COMPOSE_FILE ps
echo ""
echo "Site: https://${DOMAIN}"

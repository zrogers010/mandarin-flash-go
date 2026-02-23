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
        echo "  Applying $(basename "$migration")..."
        $DC $COMPOSE_FILE exec -T postgres psql \
            -U "${DB_USER:-postgres}" \
            -d "${DB_NAME:-chinese_learning}" < "$migration" 2>&1 | tail -5
    fi
done
echo "  Migrations applied."

# Seed vocabulary data if seed files exist and vocabulary table is empty
VOCAB_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM vocabulary;" 2>/dev/null || echo "0")
if [ "${VOCAB_COUNT:-0}" = "0" ]; then
    SEED_DIR="backend/db/seeds"
    if [ -d "$SEED_DIR" ] && ls "$SEED_DIR"/*.sql &>/dev/null 2>&1; then
        echo "  Vocabulary table is empty. Loading seed data..."
        for seed_file in "$SEED_DIR"/*.sql; do
            echo "    Applying $(basename "$seed_file")..."
            $DC $COMPOSE_FILE exec -T postgres psql \
                -U "${DB_USER:-postgres}" \
                -d "${DB_NAME:-chinese_learning}" < "$seed_file" 2>&1 | tail -3
        done
        NEW_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM vocabulary;" 2>/dev/null || echo "?")
        echo "  Seed data loaded ($NEW_COUNT words)."
    else
        echo "  WARNING: Vocabulary table is empty but no seed files found in $SEED_DIR/"
        echo "  Copy seed files to the server: scp backend/db/seeds/*.sql deploy@<server>:~/mandarinflash/backend/db/seeds/"
    fi
else
    echo "  Vocabulary already loaded ($VOCAB_COUNT words), skipping seed."
fi

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

#!/usr/bin/env bash
#
# Deploy MandarinFlash to production.
#
# PRODUCTION SETUP:
#   - Run as the `deploy` user from /home/deploy/mandarinflash
#   - SSL certs are under this directory (managed by certbot)
#   - Must run from the same checkout the live containers were started from
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Check if we need sudo for docker
if docker ps &>/dev/null 2>&1; then
    DOCKER="docker"
elif sudo -n docker ps &>/dev/null 2>&1; then
    DOCKER="sudo -n docker"
else
    echo "ERROR: Cannot access docker. Neither 'docker' nor 'sudo -n docker' works."
    exit 1
fi

# Detect docker compose command (plugin vs standalone, with or without sudo)
DC=""
if $DOCKER compose version &>/dev/null 2>&1; then
    # Docker compose plugin
    DC="$DOCKER compose"
elif command -v docker-compose &>/dev/null && docker-compose version &>/dev/null 2>&1; then
    # Standalone docker-compose (no sudo)
    DC="docker-compose"
elif command -v docker-compose &>/dev/null && sudo -n docker-compose version &>/dev/null 2>&1; then
    # Standalone docker-compose with sudo
    DC="sudo -n docker-compose"
else
    echo "ERROR: Cannot find docker compose plugin or standalone docker-compose."
    exit 1
fi
COMPOSE_FILE="-f docker-compose.prod.yml"

# Safety check: ensure we're running from the same directory as the live containers
# This prevents deploying from a different checkout and breaking SSL cert paths
BACKEND_CONTAINER_ID=$($DC $COMPOSE_FILE ps -q backend 2>/dev/null | head -1)
if [ -n "$BACKEND_CONTAINER_ID" ]; then
    RUNNING_WORKDIR=$($DOCKER inspect --format='{{index .Config.Labels "com.docker.compose.project.working_dir"}}' "$BACKEND_CONTAINER_ID" 2>/dev/null || echo "")
    
    if [ -z "$RUNNING_WORKDIR" ]; then
        echo "ERROR: Cannot determine working directory of running containers!"
        echo "Containers are running but working_dir label is not available."
        echo "This is unsafe - refusing to proceed."
        exit 1
    fi
    
    if [ "$RUNNING_WORKDIR" != "$PROJECT_DIR" ]; then
        echo "ERROR: Running containers were started from a different directory!"
        echo "  This checkout: $PROJECT_DIR"
        echo "  Live containers: $RUNNING_WORKDIR"
        echo ""
        echo "You must run deploy.sh from $RUNNING_WORKDIR to avoid breaking SSL certs and mounts."
        exit 1
    fi
fi

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

# ---------- Pre-migration backup ----------
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"
echo "  Creating backup: $BACKUP_FILE"
$DC $COMPOSE_FILE exec -T postgres pg_dump \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-chinese_learning}" \
    --clean --if-exists \
    | gzip > "$BACKUP_FILE" 2>&1
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  Backup complete: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "  WARNING: Backup failed, but continuing deploy."
fi

# Run migrations using shared migration script
bash scripts/migrate.sh "${DB_USER:-postgres}" "${DB_NAME:-chinese_learning}" \
    $DC $COMPOSE_FILE exec -T postgres psql

# HSK vocabulary and lesson links are fully managed by migrations
echo "  Vocabulary and lesson links: Managed by migrations"
VOCAB_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM vocabulary;" 2>/dev/null || echo "?")
PROGRESS_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM user_vocabulary_progress;" 2>/dev/null || echo "?")
LV_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM lesson_vocabulary;" 2>/dev/null || echo "?")
echo "  Vocabulary: $VOCAB_COUNT words, $PROGRESS_COUNT progress records (preserved), $LV_COUNT lesson links."

# ---------- Enrich definitions from CC-CEDICT ----------
# OPTIONAL: Import CC-CEDICT dictionary entries (121k words)
# Only runs when RUN_CEDICT_IMPORT=1 is set
# WARNING: This adds many non-HSK words and should rarely be needed after initial setup
if [ "${RUN_CEDICT_IMPORT:-0}" = "1" ]; then
    echo ""
    echo "=== Import CC-CEDICT Definitions ==="
    echo "  Enriching definitions from CC-CEDICT (this can take a minute)..."
    if bash scripts/run_cedict_import.sh; then
        L0_COUNT=$($DC $COMPOSE_FILE exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-chinese_learning}" -tAc "SELECT COUNT(*) FROM vocabulary WHERE hsk_level = 0;" 2>/dev/null || echo "?")
        echo "  CC-CEDICT enrichment complete (dictionary entries: $L0_COUNT)."
    else
        echo "  WARNING: CC-CEDICT import failed; definitions/dictionary may be incomplete."
    fi
else
    echo ""
    echo "=== CC-CEDICT Import Skipped ==="
    echo "  To import CC-CEDICT dictionary, set RUN_CEDICT_IMPORT=1"
fi

# ---------- Restart all services ----------
echo "[4/5] Starting all services..."
$DC $COMPOSE_FILE up -d

echo "  Waiting for services to stabilize..."
sleep 10

# ---------- Health check ----------
# /health is only served on the HTTPS vhost; the HTTP vhost 301-redirects to
# HTTPS. So probe HTTPS pinned to localhost (so the cert + server_name match),
# and fall back to treating an HTTP->HTTPS redirect as "nginx is up".
echo "[5/5] Running health check..."
RETRIES=5
HEALTHY=0
LAST_STATUS="000"
for i in $(seq 1 $RETRIES); do
    LAST_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
        --resolve "${DOMAIN}:443:127.0.0.1" \
        "https://${DOMAIN}/health" 2>/dev/null || echo "000")
    if [ "$LAST_STATUS" = "200" ]; then
        echo "  Health check passed (HTTPS 200)."
        HEALTHY=1
        break
    fi

    # Fallback: if the TLS cert isn't ready yet, a 301/308 from HTTP still means
    # nginx is serving and redirecting correctly.
    REDIR=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/health" 2>/dev/null || echo "000")
    if [ "$REDIR" = "301" ] || [ "$REDIR" = "308" ]; then
        echo "  Health check passed (HTTP $REDIR redirect to HTTPS; nginx up)."
        HEALTHY=1
        break
    fi

    sleep 5
done

if [ "$HEALTHY" != "1" ]; then
    echo "  WARNING: Health check failed after $RETRIES attempts (HTTPS $LAST_STATUS)."
    echo "  Check logs: $DC $COMPOSE_FILE logs"
fi

echo ""
echo "=== Deploy complete ==="
echo ""
$DC $COMPOSE_FILE ps
echo ""
echo "Site: https://${DOMAIN}"

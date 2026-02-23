#!/usr/bin/env bash
#
# Run the CC-CEDICT import inside a temporary Docker container
# that can reach the PostgreSQL database on the internal network.
#
# Usage: bash scripts/run_cedict_import.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Load .env for DB credentials
if [ -f .env ]; then
    source .env
fi

# Detect compose command
if docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
else
    DC="docker-compose"
fi

# Detect the internal network name (project_internal)
NETWORK=$($DC -f docker-compose.prod.yml network ls 2>/dev/null | grep internal | awk '{print $1}' || true)
if [ -z "$NETWORK" ]; then
    # Fall back to docker network ls
    PROJECT_NAME=$(basename "$PROJECT_DIR" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
    NETWORK=$(docker network ls --format '{{.Name}}' | grep -E "${PROJECT_NAME}.*internal" | head -1 || true)
fi

if [ -z "$NETWORK" ]; then
    echo "ERROR: Could not find the Docker internal network."
    echo "Make sure the production stack is running: $DC -f docker-compose.prod.yml up -d"
    exit 1
fi

echo "=== CC-CEDICT Import ==="
echo "  Network: $NETWORK"
echo "  Database: ${DB_NAME:-chinese_learning}@postgres:5432"
echo ""

docker run --rm \
    --network "$NETWORK" \
    -v "$PROJECT_DIR/scripts:/scripts" \
    -e DB_HOST=postgres \
    -e DB_PORT=5432 \
    -e DB_NAME="${DB_NAME:-chinese_learning}" \
    -e DB_USER="${DB_USER:-postgres}" \
    -e DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD required}" \
    python:3.11-slim \
    bash -c "pip install -q psycopg2-binary && python3 /scripts/import_cedict.py"

echo ""
echo "=== Done ==="

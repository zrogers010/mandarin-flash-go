#!/usr/bin/env bash
#
# Run database migrations using schema_migrations tracker.
# Designed to be called from both deploy.sh and CI workflows.
#
# Usage:
#   migrate.sh <DB_USER> <DB_NAME> <PSQL_COMMAND>
#
# Example:
#   migrate.sh postgres chinese_learning "docker compose -f docker-compose.prod.yml exec -T postgres psql"
#
set -euo pipefail

DB_USER="${1:-postgres}"
DB_NAME="${2:-chinese_learning}"
shift 2
PSQL_COMMAND=("$@")

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# Allow MIGRATIONS_DIR to be overridden by environment (for docker container paths)
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$PROJECT_DIR/backend/db/migrations}"

echo "=== Running database migrations ==="
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Helper function to run psql commands
run_psql() {
    "${PSQL_COMMAND[@]}" -U "$DB_USER" -d "$DB_NAME" "$@"
}

# Check if schema_migrations table exists
SCHEMA_MIGRATIONS_EXISTS=$(run_psql -tAc "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'schema_migrations');" || echo "f")

# Apply 000_schema_migrations.sql to create the tracking table
echo "  Ensuring schema_migrations table exists..."
if ! run_psql -v ON_ERROR_STOP=1 < "$MIGRATIONS_DIR/000_schema_migrations.sql"; then
    echo "  ERROR: Failed to create schema_migrations table!"
    exit 1
fi

# Handle production baseline: if users table exists but schema_migrations was just created,
# record migrations 001-006 as already applied using their actual filenames
if [ "$SCHEMA_MIGRATIONS_EXISTS" = "f" ]; then
    USERS_EXISTS=$(run_psql -tAc "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users');" || echo "f")
    
    if [ "$USERS_EXISTS" = "t" ]; then
        echo "  Detected existing database with users table but no schema_migrations."
        echo "  Baselining migrations 001-006 as already applied..."
        
        # Generate baseline from actual files numbered 001-006
        for migration in "$MIGRATIONS_DIR"/00[1-6]_*.sql; do
            if [ -f "$migration" ]; then
                MIGRATION_NAME="$(basename "$migration")"
                echo "    Recording baseline: $MIGRATION_NAME"
                run_psql -tAc "INSERT INTO schema_migrations (filename, applied_at) VALUES ('$MIGRATION_NAME', NOW()) ON CONFLICT (filename) DO NOTHING;"
            fi
        done
        
        echo "  Baseline complete. Remaining migrations will be applied."
    fi
fi

# Apply each migration in order
for migration in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        MIGRATION_NAME="$(basename "$migration")"
        
        # Skip 000 - it's already been applied
        if [ "$MIGRATION_NAME" = "000_schema_migrations.sql" ]; then
            continue
        fi
        
        # Check if migration already applied
        ALREADY_APPLIED=$(run_psql -tAc "SELECT COUNT(*) FROM schema_migrations WHERE filename='$MIGRATION_NAME';" || echo "0")
        
        if [ "$ALREADY_APPLIED" = "1" ]; then
            echo "  Skipping $MIGRATION_NAME (already applied)"
            continue
        fi
        
        echo "  Applying $MIGRATION_NAME..."
        
        # Run migration and record it in the same transaction
        # Read the migration file and pipe it to psql with transaction wrapper
        if ! (
            echo "BEGIN;"
            cat "$migration"
            echo "INSERT INTO schema_migrations (filename) VALUES ('$MIGRATION_NAME');"
            echo "COMMIT;"
        ) | run_psql -v ON_ERROR_STOP=1
        then
            echo "  ERROR: Migration $MIGRATION_NAME failed!"
            echo "  Database may be in inconsistent state. Check logs and rollback if needed."
            exit 1
        fi
    fi
done

echo "  All migrations applied successfully."

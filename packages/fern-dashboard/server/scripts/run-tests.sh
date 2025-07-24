#!/bin/bash

# Script to run tests with proper environment setup

set -e

echo "🧪 Setting up test environment..."

# Detect and add PostgreSQL tools to PATH
POSTGRES_PATHS=(
    "/opt/homebrew/opt/postgresql@15/bin"
    "/usr/local/opt/postgresql@15/bin"
    "/usr/local/bin"
    "/opt/homebrew/bin"
)

for path in "${POSTGRES_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/psql" ]; then
        echo "📦 Found PostgreSQL tools at: $path"
        export PATH="$path:$PATH"
        break
    fi
done

# Set up test database URL with current user
export DATABASE_URL="postgresql://${USER}@localhost:5432/fern_dashboard_tes"
export DIRECT_URL="postgresql://${USER}@localhost:5432/fern_dashboard_tes"

echo "📊 Using test database: fern_dashboard_tes"
echo "👤 Using username: ${USER}"

echo "🚀 Running tests..."
vitest --run --passWithNoTests 
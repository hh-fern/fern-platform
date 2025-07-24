#!/bin/bash

# Script to run test database operations with the correct environment variables

set -e

echo "🐘 Setting up test database environment..."

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

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Starting it..."
    brew services start postgresql@15
    sleep 2
fi

# Check if the test database exists
if ! psql -h localhost -p 5432 -U "${USER}" -d fern_dashboard_tes -c "SELECT 1;" > /dev/null 2>&1; then
    echo "🗄️  Creating test database..."
    createdb fern_dashboard_tes
fi

# Push schema to test database
echo "🔧 Pushing schema to test database..."
pnpm db:push:test

# Run the specified command
if [ $# -eq 0 ]; then
    echo "🌱 Seeding test database..."
    pnpm db:seed:test
else
    echo "🚀 Running: $@"
    "$@"
fi

echo "✅ Test database operation completed!" 
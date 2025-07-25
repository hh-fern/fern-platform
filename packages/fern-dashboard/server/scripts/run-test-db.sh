#!/bin/bash

# Script to run test database operations with Docker environment

set -e

echo "🐘 Setting up Docker test database environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Detect docker-compose command (V1 or V2)
if command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Neither docker-compose nor docker compose is available. Please install Docker Compose and try again."
    exit 1
fi

echo "🐳 Starting PostgreSQL container..."
$DOCKER_COMPOSE -f docker-compose.test.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
while ! $DOCKER_COMPOSE -f docker-compose.test.yml exec -T postgres pg_isready -U test -d fern_dashboard_tes -h localhost -p 5432 > /dev/null 2>&1; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL failed to start within $timeout seconds"
        $DOCKER_COMPOSE -f docker-compose.test.yml logs postgres
        exit 1
    fi
done

echo "✅ PostgreSQL is ready!"

# Generate Prisma client and run migrations (like self-hosted setup)
echo "🔧 Generating Prisma client and running migrations..."
$DOCKER_COMPOSE -f docker-compose.test.yml run --rm server-test sh -c "pnpm db:generate && pnpm db:migrate:deploy"

# Run the specified command
if [ $# -eq 0 ]; then
    echo "🌱 Seeding test database..."
    $DOCKER_COMPOSE -f docker-compose.test.yml run --rm server-test pnpm ts-node prisma/seed.ts
else
    echo "🚀 Running: $@"
    $DOCKER_COMPOSE -f docker-compose.test.yml run --rm server-test "$@"
fi

echo "🧹 Cleaning up..."
$DOCKER_COMPOSE -f docker-compose.test.yml down

echo "✅ Test database operation completed!" 
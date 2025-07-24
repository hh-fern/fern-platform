#!/bin/bash

# Script to run tests with Docker environment

set -e

echo "🧪 Setting up Docker test environment..."

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

# Debug: Check what's using port 5432
echo "🔍 Checking what's using port 5432..."
if command -v netstat > /dev/null 2>&1; then
    netstat -tlnp | grep :5432 || echo "No process found using port 5432"
elif command -v ss > /dev/null 2>&1; then
    ss -tlnp | grep :5432 || echo "No process found using port 5432"
else
    echo "netstat/ss not available for port checking"
fi

# Debug: Check for existing containers
echo "🐳 Checking for existing PostgreSQL containers..."
$DOCKER_COMPOSE -f docker-compose.test.yml ps
docker ps | grep postgres || echo "No PostgreSQL containers found"

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
$DOCKER_COMPOSE -f docker-compose.test.yml run --rm server-test sh -c "pnpm db:generate && pnpm db:migrate:reset --force && pnpm db:migrate:deploy"

echo "🚀 Running tests..."
$DOCKER_COMPOSE -f docker-compose.test.yml run --rm server-test pnpm vitest run

echo "🧹 Cleaning up..."
$DOCKER_COMPOSE -f docker-compose.test.yml down

echo "✅ Tests completed!" 
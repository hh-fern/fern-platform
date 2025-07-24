#!/bin/bash

# Script to run push test with Docker environment

set -e

echo "🔧 Setting up Docker push test environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not available. Please install docker-compose and try again."
    exit 1
fi

echo "🐳 Starting PostgreSQL container..."
docker-compose -f docker-compose.test.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
while ! docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U test -d fern_dashboard_tes > /dev/null 2>&1; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL failed to start within $timeout seconds"
        docker-compose -f docker-compose.test.yml logs postgres
        exit 1
    fi
done

echo "✅ PostgreSQL is ready!"

echo "🚀 Running push test..."
docker-compose -f docker-compose.test.yml run --rm server-test pnpm db:push

echo "🧹 Cleaning up..."
docker-compose -f docker-compose.test.yml down

echo "✅ Push test completed!" 
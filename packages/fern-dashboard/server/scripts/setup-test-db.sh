#!/bin/bash

# Setup script for Docker test database environment
# This script helps you set up Docker environment for testing

echo "🐳 Setting up Docker test database environment..."

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

echo "✅ Docker environment is ready!"

echo ""
echo "Available commands:"
echo "1. Run tests: pnpm test"
echo "2. Run seed test: pnpm db:seed:test"
echo "3. Run push test: pnpm db:push:test"
echo "4. Run test database operations: pnpm db:test"
echo ""
echo "All commands will automatically:"
echo "- Start PostgreSQL in Docker"
echo "- Wait for database to be ready"
echo "- Run the specified operation"
echo "- Clean up containers"
echo ""
echo "To run tests manually with Docker:"
echo "   docker-compose -f docker-compose.test.yml up -d postgres"
echo "   docker-compose -f docker-compose.test.yml run --rm server-test pnpm test"
echo "   docker-compose -f docker-compose.test.yml down" 
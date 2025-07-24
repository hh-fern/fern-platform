#!/bin/bash

# Setup script for test database environment
# This script helps you set up environment variables for testing

echo "Setting up test database environment..."

# Check if .env.test exists, if not create it
if [ ! -f .env.test ]; then
    echo "Creating .env.test file..."
    cat > .env.test << EOF
# Test Database Configuration
# Copy your production DATABASE_URL and modify the database name to include '_test'
# Example: postgresql://user:password@localhost:5432/fern_dashboard_test

TEST_DATABASE_URL="postgresql://user:password@localhost:5432/fern_dashboard_test"
TEST_DIRECT_URL="postgresql://user:password@localhost:5432/fern_dashboard_test"

# Optional: Override with your actual test database URL
# TEST_DATABASE_URL="your_test_database_url_here"
# TEST_DIRECT_URL="your_test_direct_url_here"
EOF
    echo "Created .env.test file. Please update it with your test database URL."
else
    echo ".env.test file already exists."
fi

echo ""
echo "To run the test seed:"
echo "1. Update .env.test with your test database URL"
echo "2. Run: pnpm db:seed:test"
echo ""
echo "To run with environment file:"
echo "   pnpm --env-file=.env.test db:seed:test"
echo ""
echo "To run with inline environment:"
echo "   TEST_DATABASE_URL='your_test_db_url' pnpm db:seed:test" 
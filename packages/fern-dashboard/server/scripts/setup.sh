#!/bin/bash

# Fern Dashboard Server Database Setup Script

set -e

echo "🚀 Setting up Fern Dashboard Server Database..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
    echo "❌ Please run this script from the server directory"
    exit 1
fi

# Install dependencies if not already installed
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm db:generate

# Check if database is accessible
echo "🔍 Testing database connection..."
if ! pnpm db:validate; then
    echo "❌ Database validation failed."
    echo "   Make sure your DATABASE_URL is configured in Vercel:"
    echo "   - For local development: Set up .env.local in the fern-dashboard root"
    echo "   - For production: Configure environment variables in Vercel dashboard"
    echo ""
    echo "   To link your project to Vercel:"
    echo "   vercel link"
    echo "   vercel env pull .env.local"
    exit 1
fi

# Push schema to database
echo "🗄️  Creating database tables..."
pnpm db:push

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
pnpm db:seed

echo "✅ Setup complete! Your database is ready."
echo ""
echo "Next steps:"
echo "1. Start the development server: pnpm dev"
echo "2. Open Prisma Studio: pnpm db:studio"
echo "3. Run tests: pnpm test"
echo ""
echo "For production deployment:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Deploy with: vercel --prod" 
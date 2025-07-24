#!/bin/bash

# Vercel Environment Setup Script for Fern Dashboard Server

set -e

echo "🚀 Setting up Vercel environment for Fern Dashboard Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
    echo "❌ Please run this script from the server directory"
    exit 1
fi

# Go to fern-dashboard root
cd ../..

# Check if Vercel is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking project to Vercel..."
    vercel link
else
    echo "✅ Project already linked to Vercel"
fi

# Pull environment variables
echo "📥 Pulling environment variables from Vercel..."
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up..."
    cp .env.local .env.local.backup
fi

vercel env pull .env.local

echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local if needed to configure your DATABASE_URL"
echo "2. Run database setup: cd server && ./scripts/setup.sh"
echo "3. Start development: pnpm dashboard:dev"
echo ""
echo "For production:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Deploy: vercel --prod" 
# Fern Dashboard Server

This package contains the server-side code for the Fern Dashboard, including database management with Prisma.

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma     # Database schema definition
│   ├── seed.ts           # Database seeding script for test data
│   └── migrations/       # Database migration files
├── src/
│   ├── index.ts          # Main server entry point
│   ├── database.ts       # Database connection utilities
│   ├── services/         # Database service layers
│   ├── examples/         # Database usage examples
│   └── __tests__/        # Unit tests for database operations
├── generated/            # Generated Prisma client (gitignored)
├── dist/                 # Compiled TypeScript output
...
```

## Database Setup

### Prerequisites

1. **Docker**: Install Docker and docker-compose for testing
2. **Vercel Project**: Link your project to Vercel for environment management

### Initial Setup

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Link to Vercel** (if not already linked):
   [Instructions here](../README.md)

   ```bash
   cd ../../  # Go to fern-dashboard root
   vercel link
   ```

3. **Configure Environment Variables**:
   [Instructions here](../README.md)

   ```bash
   # Pull environment variables from Vercel
   vercel env pull .env.local

   # Or manually create .env.local in fern-dashboard root:
   # DATABASE_URL="postgresql://username:password@localhost:5432/fern_dashboard"
   ```

### Making Changes

1. **Compile Project** (includes Prisma generation + TypeScript compilation):

   ```bash
   pnpm compile
   ```

2. **Create Database Tables**:

   ```bash
   pnpm db:push
   ```

## Testing

### Database Seeding

Creates test data with realistic relationships for development:

```bash
# Setup and seed test database (recommended)
pnpm db:test
```

This command:

- Sets up test database environment
- Pushes schema changes
- Seeds with test data (prefixed with `fern-test-`)
- Is completely isolated from production

**Example update when adding new fields**:

```typescript
// In seed.ts - when adding email and githubUsername to User model
const user1 = await prisma.user.upsert({
  where: { userId: "fern-test-user-1" },
  update: {},
  create: {
    userId: "fern-test-user-1",
    email: "user1@fern.dev", // New required field
    githubUsername: "fern-user-1", // New optional field
    isAdmin: true,
  },
});
```

### Unit Tests

Run database tests:

```bash
pnpm test
```

### Additional Test Commands

- `pnpm db:seed:test` - Run database seeding test
- `pnpm db:push:test` - Run database push test

## Available Scripts

### Database

- `pnpm db:test` - Setup and seed test database (recommended)
- `pnpm db:push` - Push schema changes
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:generate` - Generate Prisma client

### Development

- `pnpm dev` - Start development server
- `pnpm test` - Run tests
- `pnpm compile` - Compile project
- `pnpm format` - Format schemas

## Development Workflow

1. **Schema Changes**: Edit `prisma/schema.prisma`
2. **Generate Client**: Run `pnpm db:generate`
3. **Apply Changes**: Run `pnpm db:push`
4. **Test Changes**: Run `pnpm db:test` and `pnpm test`
5. **Format Changes**: Run `pnpm format`

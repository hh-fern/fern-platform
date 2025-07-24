# Fern Dashboard Server

This package contains the server-side code for the Fern Dashboard, including database management with Prisma.

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma     # Database schema definition
│   ├── seed.test.ts      # Database seeding script for test data
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

1. **PostgreSQL Database**: Ensure you have a PostgreSQL database running
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

## Testing and Seeding

This project includes two different approaches for testing database functionality:

### 1. Database Seeding (`prisma/seed.test.ts`)

**Purpose**: Creates comprehensive test data with realistic relationships for development and integration testing.

**What it does**:

- Creates users, organizations, docs instances, and feedback with `fern-test` prefixes
- Establishes relationships between entities (users belong to organizations, docs instances belong to organizations, etc.)
- Provides a realistic dataset for testing API endpoints and complex queries
- Safe to run on any database (uses prefixed data)

**When to update**:

- When adding new fields to existing models
- When adding new models to the schema
- When you need realistic test data for development

**How to run**:

```bash
# Set up test environment
pnpm db:setup:test

# Update .env.test with your test database URL
# TEST_DATABASE_URL="postgresql://user:password@localhost:5432/fern_dashboard_test"

# Run the seed script
pnpm db:seed:test
```

**Example update when adding new fields**:

```typescript
// In seed.test.ts - when adding email and githubUsername to User model
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

### 2. Unit Tests (`src/__tests__/database.test.ts`)

**Purpose**: Tests individual database operations and edge cases in isolation.

**What it does**:

- Tests CRUD operations for each service (UserService, OrganizationService, etc.)
- Verifies error handling and edge cases
- Ensures data integrity and constraints
- Runs in isolation with cleanup between tests

**When to update**:

- When adding new service methods
- When adding new validation logic
- When you need to test specific edge cases or error conditions

**How to run**:

```bash
# Run all tests
pnpm test

# Run only database tests
pnpm test database.test.ts
```

**Example update when adding new service methods**:

```typescript
// In database.test.ts - when adding UserService
it("should create and retrieve a user", async () => {
  const testUserId = "test-user-1";
  const testEmail = "test-user-1@example.com";

  const createdUser = await userService.createUser({
    userId: testUserId,
    email: testEmail,
    githubUsername: "test-github-user",
    isAdmin: false,
  });
  expect(createdUser.userId).toBe(testUserId);
  expect(createdUser.email).toBe(testEmail);
});
```

## Available Scripts

### Database Management

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database (development)
- `pnpm db:pull` - Pull schema from database
- `pnpm db:migrate` - Create and apply migrations
- `pnpm db:migrate:deploy` - Deploy migrations to production
- `pnpm db:migrate:reset` - Reset database and reapply migrations
- `pnpm db:migrate:status` - Check migration status
- `pnpm db:seed:test` - Seed database with test data (uses TEST_DATABASE_URL if available)
- `pnpm db:setup:test` - Set up test seed environment
- `pnpm db:studio` - Open Prisma Studio (database GUI)
- `pnpm db:validate` - Validate schema
- `pnpm db:format` - Format schema file
- `pnpm db:lint` - Lint schema file

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm compile` - Compile TypeScript

### Parent Package Scripts (from fern-dashboard root)

- `pnpm db:migrate:local` - Deploy migrations using .env.local
- `pnpm db:migrate:dev` - Deploy migrations using .env.dev
- `pnpm db:migrate:prod` - Deploy migrations using .env.prod

## Development Workflow

1. **Schema Changes**: Edit `prisma/schema.prisma`
2. **Generate Client**: Run `pnpm db:generate`
3. **Apply Changes**: Use `pnpm db:push` for development or `pnpm db:migrate` for production
4. **Compile TypeScript**: Run `pnpm compile` to check for type errors
5. **Update Seed Data**: Update `prisma/seed.test.ts` with new fields/models
6. **Update Unit Tests**: Update `src/__tests__/database.test.ts` for new functionality
7. **Test Changes**: Run `pnpm test` and `pnpm db:seed:test`

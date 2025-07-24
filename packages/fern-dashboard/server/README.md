# Fern Dashboard Server

This package contains the server-side code for the Fern Dashboard, including database management with Prisma.

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma     # Database schema definition
│   ├── seed.ts           # Database seeding script
│   └── migrations/       # Database migration files
├── src/
│   ├── index.ts          # Main server entry point
│   ├── database.ts       # Database connection utilities
│   └── services/         # Database service layers
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

4. **Generate Prisma Client**:

   ```bash
   pnpm db:generate
   ```

5. **Create Database Tables**:

   ```bash
   pnpm db:push
   ```

6. **Seed Database** (optional):
   ```bash
   pnpm db:seed
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
- `pnpm db:seed` - Seed database with sample data
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
4. **Update Code**: Use the generated Prisma client in your code

# Fern Dashboard Server

This package contains the server-side code for the Fern Dashboard, including database management with Prisma.

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── seed.ts           # Database seeding script
│   └── migrations/       # Database migration files
├── src/
│   ├── index.ts          # Main server entry point
│   ├── database.ts       # Database connection utilities
│   └── services/         # Database service layers
├── generated/            # Generated Prisma client (gitignored)
├── dist/                 # Compiled TypeScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
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

   ```bash
   cd ../../  # Go to fern-dashboard root
   vercel link
   ```

3. **Configure Environment Variables**:

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

## Database Schema

The database contains the following models:

### Organization

- `orgId` (String, unique) - Organization identifier

### DocsInstance

- `id` (String, unique) - Instance identifier
- `orgId` (String, unique) - Foreign key to organization
- `url` (String) - Documentation URL
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime, optional) - Last update timestamp

### Feedback

- `id` (Int, auto-increment) - Primary key
- `votedAt` (DateTime) - When feedback was given
- `submittedAt` (DateTime, optional) - When feedback was submitted
- `pageUrl` (String) - Page URL where feedback was given
- `sessionId` (String, optional) - User session identifier
- `eventId` (String, unique, optional) - Event identifier
- `location` (String, optional) - User location
- `deviceType` (String, optional) - Device type
- `browser` (String, optional) - Browser information
- `isHelpful` (Boolean) - Whether feedback was helpful
- `selection` (String, optional) - User selection
- `comment` (String, optional) - User comment
- `email` (String, optional) - User email

## Development Workflow

1. **Schema Changes**: Edit `prisma/schema.prisma`
2. **Generate Client**: Run `pnpm db:generate`
3. **Apply Changes**: Use `pnpm db:push` for development or `pnpm db:migrate` for production
4. **Update Code**: Use the generated Prisma client in your code

## Environment Management

### Local Development

- Use `.env.local` in the fern-dashboard root directory
- Pull from Vercel: `vercel env pull .env.local`

### Production Deployment

1. Configure environment variables in Vercel dashboard
2. Deploy with: `vercel --prod`
3. Run migrations: `pnpm db:migrate:prod`

## Troubleshooting

- **Connection Issues**: Check your `DATABASE_URL` in Vercel environment variables
- **Schema Errors**: Run `pnpm db:validate` to check schema
- **Migration Issues**: Use `pnpm db:migrate:status` to check migration state
- **Client Generation**: Ensure you run `pnpm db:generate` after schema changes
- **Vercel Setup**: Use `vercel link` to connect your project to Vercel

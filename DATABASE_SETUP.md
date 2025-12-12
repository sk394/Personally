# Database Setup Guide

This project uses **Neon PostgreSQL** with separate databases for development and production.

## Quick Setup

### 1. Environment Files

Create the appropriate environment file for your use case:

#### Development (Local)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Then add your development database URL and other credentials.

#### Production
Your production environment variables should be set in your hosting platform (Netlify, Vercel, etc.):
- `DATABASE_URL` - Your production Neon database URL
- `BETTER_AUTH_SECRET` - Production auth secret
- `RESEND_API_KEY` - Production email API key
- `BETTER_AUTH_URL` - Your production domain
- `SERVER_URL` - Your production domain

### 2. Create Neon Databases

#### Development Database
1. Go to [Neon Console](https://console.neon.tech)
2. Create a new database for development
3. Copy the connection string
4. Add it to `.env.local` as `DATABASE_URL`

#### Production Database
1. Create another database in Neon for production
2. Copy the connection string
3. Add it to your hosting platform's environment variables

## Database Commands

### Development
```bash
# Push schema changes directly (recommended for dev)
npm run db:push

# Or use migrations
npm run db:generate      # Generate migration files
npm run db:migrate       # Apply migrations

# Open Drizzle Studio to view/edit data
npm run db:studio

# Reset database (careful!)
npm run db:reset
```

### Production
Use your hosting platform's deployment pipeline. For Netlify:
```bash
# Migrations will run automatically during deployment
# Or manually trigger:
DATABASE_URL=<prod-url> npm run db:migrate
```

## Best Practices

### 1. **Never commit `.env` files**
- `.env`, `.env.local`, `.env.production` are in `.gitignore`
- Only commit `.env.example` as a template

### 2. **Use different databases**
- Development: For local testing and experimentation
- Production: For live user data

### 3. **Migration workflow**
```bash
# 1. Make schema changes in src/lib/db/schema/
# 2. Generate migration
npm run db:generate

# 3. Review the migration file in src/lib/db/migrations/
# 4. Test locally
npm run db:migrate

# 5. Commit the migration file
git add src/lib/db/migrations/
git commit -m "Add migration for..."

# 6. Deploy to production (migrations run automatically)
```

### 4. **Testing changes safely**
```bash
# Reset your dev database to test fresh migrations
npm run db:reset
npm run db:migrate
```

## Switching Between Environments

The database connection is determined by the `DATABASE_URL` in your environment:

```bash
# Development (uses .env.local)
npm run dev

# Production deployment
# DATABASE_URL from hosting platform environment variables
```

## Troubleshooting

### "Type already exists" or "Relation already exists"
Your database is in an inconsistent state:
```bash
npm run db:reset  # Resets dev database
npm run db:push   # Syncs schema
```

### Can't connect to database
1. Check your `DATABASE_URL` is correct
2. Ensure your IP is allowed in Neon (if using IP restrictions)
3. Verify the database hasn't been paused (Neon free tier auto-pauses)

### Migration conflicts
If you have conflicting migrations:
```bash
# Delete migration files with issues
rm src/lib/db/migrations/XXXX_*

# Regenerate
npm run db:generate
```

## Security Notes

- ⚠️ **Never** use production database URL in development
- ⚠️ **Never** commit environment files with real credentials
- ✅ Use separate API keys for dev/prod (Resend, Auth, etc.)
- ✅ Regularly rotate production secrets

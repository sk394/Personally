import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env file')
    process.exit(1)
}

const sql = neon(DATABASE_URL)

async function resetDatabase() {
    console.log('🗑️  Dropping all tables and types...')

    try {
        // Drop all tables by dropping and recreating the public schema
        await sql`DROP SCHEMA public CASCADE`
        await sql`CREATE SCHEMA public`
        await sql`GRANT ALL ON SCHEMA public TO public`

        console.log('✅ Database reset successfully!')
        console.log('📝 You can now run: npx drizzle-kit push')
    } catch (error) {
        console.error('❌ Error resetting database:', error)
        process.exit(1)
    }
}

resetDatabase()
/**
 * Backfill script to create default projects for existing users
 * Run this once after implementing the template system if you have existing users
 * 
 * Usage: pnpm vite-node scripts/backfill-existing-users.ts
 */

import { db } from '../src/lib/db/index.js'
import { user } from '../src/lib/db/schema/auth.js'
import { createDefaultProjectsForUser } from '../src/lib/auth/user-project-setup.js'

async function main() {
    console.log('🔄 Starting backfill process for existing users...\n')

    try {
        // Get all users
        const users = await db.select().from(user)

        console.log(`Found ${users.length} users to process\n`)

        let successCount = 0
        let errorCount = 0
        let skippedCount = 0

        for (const u of users) {
            try {
                console.log(`Processing user: ${u.email} (${u.id})`)

                const result = await createDefaultProjectsForUser(u.id)

                if (result.success) {
                    if (result.projects && result.projects.length > 0) {
                        console.log(`  ✅ Created ${result.projects.length} projects`)
                        successCount++
                    } else {
                        console.log(`  ⏭️  User already has projects, skipped`)
                        skippedCount++
                    }
                } else {
                    console.log(`  ⚠️  ${result.message}`)
                    skippedCount++
                }

                console.log('') // Empty line for readability

            } catch (error) {
                console.error(`  ❌ Error processing ${u.email}:`, error)
                errorCount++
                console.log('') // Empty line for readability
            }
        }

        console.log('\n' + '='.repeat(60))
        console.log('📊 Backfill Summary')
        console.log('='.repeat(60))
        console.log(`Total users:        ${users.length}`)
        console.log(`✅ Success:          ${successCount}`)
        console.log(`⏭️  Skipped:          ${skippedCount}`)
        console.log(`❌ Errors:           ${errorCount}`)
        console.log('='.repeat(60))

        if (errorCount === 0) {
            console.log('\n🎉 Backfill completed successfully!')
        } else {
            console.log('\n⚠️  Backfill completed with some errors. Please review the logs above.')
        }

        process.exit(0)

    } catch (error) {
        console.error('\n💥 Fatal error during backfill:', error)
        process.exit(1)
    }
}

main()

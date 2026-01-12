// Script to backfill username for existing users
// Run with: npx tsx scripts/backfill-username.ts

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
    'login',
    'register',
    'logout',
    'api',
    'dashboard',
    'settings',
    'admin',
    'public',
    'inner',
    'outer',
    'notes',
    'about',
    'work',
    'home',
]

function generateUsername(email: string): string {
    // Extract prefix from email
    const prefix = email.split('@')[0]
    // Sanitize: lowercase, replace non-alphanumeric with underscore
    const sanitized = prefix.toLowerCase().replace(/[^a-z0-9]/g, '_')
    // Remove consecutive underscores and trim
    return sanitized.replace(/_+/g, '_').replace(/^_|_$/g, '')
}

async function backfillUsernames() {
    console.log('Starting username backfill...')

    const usersWithoutUsername = await prisma.user.findMany({
        where: { username: null },
        select: { id: true, email: true },
    })

    console.log(`Found ${usersWithoutUsername.length} users without username`)

    const usedUsernames = new Set<string>()

    // Get existing usernames
    const existingUsers = await prisma.user.findMany({
        where: { username: { not: null } },
        select: { username: true },
    })
    existingUsers.forEach((u) => {
        if (u.username) usedUsernames.add(u.username)
    })

    // Add reserved usernames
    RESERVED_USERNAMES.forEach((r) => usedUsernames.add(r))

    for (const user of usersWithoutUsername) {
        let baseUsername = generateUsername(user.email)
        let username = baseUsername
        let suffix = 1

        // Handle empty username
        if (!username) {
            username = 'user'
            baseUsername = 'user'
        }

        // Ensure uniqueness
        while (usedUsernames.has(username)) {
            username = `${baseUsername}_${suffix}`
            suffix++
        }

        usedUsernames.add(username)

        await prisma.user.update({
            where: { id: user.id },
            data: { username },
        })

        console.log(`Updated user ${user.email} -> @${username}`)
    }

    console.log('Username backfill complete!')
}

backfillUsernames()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())

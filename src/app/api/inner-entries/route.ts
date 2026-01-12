import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { entryTextSchema } from '@/lib/validations'
import { getServerTimestamp, getServerToday } from '@/lib/date'

export const runtime = 'nodejs'

/**
 * POST /api/inner-entries
 * Create a new inner entry
 * Server determines created_at and day_key (client cannot override)
 */
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate text input
        const result = entryTextSchema.safeParse(body.text)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten() },
                { status: 400 }
            )
        }

        const text = result.data

        // Get synchronized server timestamp
        const { now, dayKey } = getServerTimestamp()

        // Create the entry
        const entry = await prisma.post.create({
            data: {
                userId: user.userId,
                type: 'INNER',
                status: 'PRIVATE',
                bodyText: text,
                createdAt: now,
                dayKey: new Date(dayKey),
            },
            select: {
                id: true,
                bodyText: true,
                createdAt: true,
                dayKey: true,
            },
        })

        // Get current server state for client sync
        const serverToday = getServerToday()

        return NextResponse.json({
            entry,
            serverToday,
            // Flag if date changed (for midnight transition UX)
            dateChanged: dayKey !== serverToday,
        }, { status: 201 })
    } catch (error) {
        console.error('Create entry error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PUT/PATCH are not allowed for inner entries (immutable)
 */
export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed. Inner entries cannot be modified.' },
        { status: 405 }
    )
}

export async function PATCH() {
    return NextResponse.json(
        { error: 'Method not allowed. Inner entries cannot be modified.' },
        { status: 405 }
    )
}

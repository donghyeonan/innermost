import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getServerToday, getServerTimestamp } from '@/lib/date'

export const runtime = 'nodejs'

/**
 * GET /api/inner-entries/today
 * Returns today's entries for the authenticated user
 */
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { serverNow } = getServerTimestamp()
        const serverToday = getServerToday()

        const entries = await prisma.post.findMany({
            where: {
                userId: user.userId,
                type: 'INNER',
                dayKey: new Date(serverToday),
                deletedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                bodyText: true,
                createdAt: true,
                dayKey: true,
            },
        })

        return NextResponse.json({
            entries,
            serverNow,
            serverToday,
        })
    } catch (error) {
        console.error('Get today entries error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

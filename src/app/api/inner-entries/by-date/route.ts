import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { dateSchema } from '@/lib/validations'

export const runtime = 'nodejs'

/**
 * GET /api/inner-entries/by-date?date=YYYY-MM-DD
 * Returns entries for a specific date (read-only archive view)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const dateParam = searchParams.get('date')

        // Validate date parameter
        const result = dateSchema.safeParse(dateParam)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            )
        }

        const date = result.data

        const entries = await prisma.post.findMany({
            where: {
                userId: user.userId,
                type: 'INNER',
                dayKey: new Date(date),
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
            date,
            readonly: true,
        })
    } catch (error) {
        console.error('Get entries by date error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

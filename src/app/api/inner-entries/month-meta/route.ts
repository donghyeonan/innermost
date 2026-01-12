import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { monthSchema } from '@/lib/validations'
import { getMonthRange, formatDate } from '@/lib/date'

export const runtime = 'nodejs'

/**
 * GET /api/inner-entries/month-meta?month=YYYY-MM
 * Returns entry counts per day for calendar display
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
        const monthParam = searchParams.get('month')

        // Validate month parameter
        const result = monthSchema.safeParse(monthParam)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid month format. Use YYYY-MM' },
                { status: 400 }
            )
        }

        const month = result.data
        const { startDate, endDate } = getMonthRange(month)

        // Get entry counts grouped by day
        // Using raw query for efficient grouping
        const entryCounts = await prisma.post.groupBy({
            by: ['dayKey'],
            where: {
                userId: user.userId,
                type: 'INNER',
                deletedAt: null,
                dayKey: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            _count: {
                id: true,
            },
        })

        // Format response
        const meta = entryCounts.map((item: { dayKey: Date; _count: { id: number } }) => ({
            date: formatDate(item.dayKey),
            count: item._count.id,
        }))

        return NextResponse.json({
            month,
            meta,
        })
    } catch (error) {
        console.error('Get month meta error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

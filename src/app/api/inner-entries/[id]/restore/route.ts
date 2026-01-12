import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * POST /api/inner-entries/[id]/restore
 * Restore a soft-deleted entry (for undo functionality)
 */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params

        // Find the entry and verify ownership
        const entry = await prisma.post.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                deletedAt: true,
                bodyText: true,
                createdAt: true,
                dayKey: true,
            },
        })

        if (!entry) {
            return NextResponse.json(
                { error: 'Entry not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        if (entry.userId !== user.userId) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Check if entry is actually deleted
        if (!entry.deletedAt) {
            return NextResponse.json(
                { error: 'Entry is not deleted' },
                { status: 400 }
            )
        }

        // Restore the entry
        const restored = await prisma.post.update({
            where: { id },
            data: { deletedAt: null },
            select: {
                id: true,
                bodyText: true,
                createdAt: true,
                dayKey: true,
            },
        })

        return NextResponse.json({
            message: 'Entry restored',
            entry: restored,
        })
    } catch (error) {
        console.error('Restore entry error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

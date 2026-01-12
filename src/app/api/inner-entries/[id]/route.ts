import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * DELETE /api/inner-entries/[id]
 * Soft delete an inner entry (sets deleted_at)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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
            },
        })

        if (!entry) {
            return NextResponse.json(
                { error: 'Entry not found' },
                { status: 404 }
            )
        }

        if (entry.userId !== user.userId) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        if (entry.deletedAt) {
            return NextResponse.json(
                { error: 'Entry already deleted' },
                { status: 400 }
            )
        }

        // Soft delete
        await prisma.post.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        return NextResponse.json({
            message: 'Entry deleted',
            id,
        })
    } catch (error) {
        console.error('Delete entry error:', error)
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

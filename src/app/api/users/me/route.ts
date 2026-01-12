import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateUserSchema } from '@/lib/validations'

export const runtime = 'nodejs'

/**
 * GET /api/users/me
 * Returns the current authenticated user
 */
export async function GET() {
    try {
        const payload = await getCurrentUser()

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                viewPreference: true,
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ user })
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/users/me
 * Update user preferences (viewPreference)
 */
export async function PATCH(request: Request) {
    try {
        const payload = await getCurrentUser()

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate input
        const result = updateUserSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten() },
                { status: 400 }
            )
        }

        const updates = result.data

        const user = await prisma.user.update({
            where: { id: payload.userId },
            data: updates,
            select: {
                id: true,
                email: true,
                viewPreference: true,
                createdAt: true,
            },
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

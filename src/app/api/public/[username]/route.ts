import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface RouteParams {
    params: Promise<{ username: string }>
}

/**
 * GET /api/public/[username]
 * Get user's public profile
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { username } = await params

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get counts
        const publishedCount = await prisma.post.count({
            where: {
                userId: user.id,
                type: 'OUTER',
                status: 'PUBLISHED',
                deletedAt: null,
            },
        })

        return NextResponse.json({
            profile: {
                username: user.username,
                memberSince: user.createdAt,
                publishedPosts: publishedCount,
            },
        })
    } catch (error) {
        console.error('Get public profile error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

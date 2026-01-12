import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface RouteParams {
    params: Promise<{ username: string }>
}

/**
 * GET /api/public/[username]/posts
 * List published posts (pagination only, no category filter in MVP)
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { username } = await params
        const { searchParams } = new URL(request.url)

        // Pagination
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
        const skip = (page - 1) * limit

        // Get user
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get posts - only PUBLISHED, deletedAt IS NULL
        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    userId: user.id,
                    type: 'OUTER',
                    status: 'PUBLISHED',
                    deletedAt: null,
                },
                orderBy: { publishedAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    coverImage: true,
                    readingTime: true,
                    isFeatured: true,
                    gridSize: true,
                    publishedAt: true,
                },
            }),
            prisma.post.count({
                where: {
                    userId: user.id,
                    type: 'OUTER',
                    status: 'PUBLISHED',
                    deletedAt: null,
                },
            }),
        ])

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + posts.length < total,
            },
        })
    } catch (error) {
        console.error('List public posts error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

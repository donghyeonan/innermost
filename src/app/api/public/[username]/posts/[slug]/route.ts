import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface RouteParams {
    params: Promise<{ username: string; slug: string }>
}

/**
 * GET /api/public/[username]/posts/[slug]
 * Get single published post by slug
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { username, slug } = await params

        // Get user
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get post - only PUBLISHED, deletedAt IS NULL
        const post = await prisma.post.findFirst({
            where: {
                userId: user.id,
                slug,
                type: 'OUTER',
                status: 'PUBLISHED',
                deletedAt: null,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                bodyText: true,
                contentJson: true,
                contentHtml: true,
                excerpt: true,
                coverImage: true,
                readingTime: true,
                references: true,
                publishedAt: true,
                updatedAt: true,
            },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        return NextResponse.json({
            post,
            author: {
                username: user.username,
            },
        })
    } catch (error) {
        console.error('Get public post error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

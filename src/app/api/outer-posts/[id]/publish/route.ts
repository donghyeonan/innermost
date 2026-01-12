import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateSlug, makeSlugUnique, calculateReadingTime, generateExcerpt } from '@/lib/slug'

export const runtime = 'nodejs'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * POST /api/outer-posts/[id]/publish
 * Publish post (DRAFT → PUBLISHED)
 * Auto-generates: slug (unique), excerpt, readingTime
 */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Get post with user info
        const existing = await prisma.post.findFirst({
            where: {
                id,
                userId: user.userId,
                type: 'OUTER',
                deletedAt: null,
            },
            include: {
                user: { select: { username: true } },
            },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        // Validate required fields for publish
        if (!existing.title || existing.title === 'Untitled') {
            return NextResponse.json(
                { error: 'Title is required for publishing' },
                { status: 400 }
            )
        }

        if (!existing.bodyText || existing.bodyText.trim().length === 0) {
            return NextResponse.json(
                { error: 'Content is required for publishing' },
                { status: 400 }
            )
        }

        // Generate slug if not set
        let slug = existing.slug
        if (!slug) {
            const baseSlug = generateSlug(existing.title)

            // Get existing slugs for this user
            const existingSlugs = await prisma.post.findMany({
                where: {
                    userId: user.userId,
                    slug: { not: null },
                    id: { not: id },
                },
                select: { slug: true },
            })
            const slugSet = new Set(existingSlugs.map((p) => p.slug!))

            slug = makeSlugUnique(baseSlug || 'untitled', slugSet)
        }

        // Auto-generate excerpt if not set
        const excerpt = existing.excerpt || generateExcerpt(existing.bodyText)

        // Calculate reading time
        const readingTime = calculateReadingTime(existing.bodyText)

        // Update post
        const post = await prisma.post.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                slug,
                excerpt,
                readingTime,
                publishedAt: existing.publishedAt || new Date(), // Keep original if republishing
                updatedAt: new Date(),
            },
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                excerpt: true,
                readingTime: true,
                publishedAt: true,
            },
        })

        // Revalidate public pages
        if (existing.user.username) {
            revalidatePath(`/${existing.user.username}`)
            revalidatePath(`/${existing.user.username}/notes`)
            revalidatePath(`/${existing.user.username}/notes/${slug}`)
        }

        return NextResponse.json({ post })
    } catch (error) {
        console.error('Publish outer post error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createOuterPostSchema, updateOuterPostSchema } from '@/lib/validations'
import { generateSlug, makeSlugUnique, calculateReadingTime, generateExcerpt } from '@/lib/slug'

export const runtime = 'nodejs'

/**
 * POST /api/outer-posts
 * Create a new outer post (draft)
 */
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Extract references separately (optional, not validated by schema)
        const { references, ...postData } = body

        const result = createOuterPostSchema.safeParse(postData)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten() },
                { status: 400 }
            )
        }

        const { title, bodyText, contentJson } = result.data

        // Validate references if provided
        let validatedRefs = null
        if (references && Array.isArray(references)) {
            if (references.length > 10) {
                return NextResponse.json(
                    { error: 'Maximum 10 references allowed' },
                    { status: 400 }
                )
            }
            validatedRefs = references
        }

        const post = await prisma.post.create({
            data: {
                userId: user.userId,
                type: 'OUTER',
                status: 'DRAFT',
                title: title || 'Untitled',
                bodyText: bodyText || '',
                contentJson: contentJson || undefined,
                ...(validatedRefs && { references: validatedRefs }),
                createdAt: new Date(),
            },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
            },
        })

        return NextResponse.json({ post }, { status: 201 })
    } catch (error) {
        console.error('Create outer post error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/outer-posts
 * List user's outer posts (drafts + published)
 */
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // 'DRAFT' | 'PUBLISHED' | null (all)

        const posts = await prisma.post.findMany({
            where: {
                userId: user.userId,
                type: 'OUTER',
                deletedAt: null,
                ...(status && { status: status as 'DRAFT' | 'PUBLISHED' }),
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                excerpt: true,
                coverImage: true,
                readingTime: true,
                isFeatured: true,
                createdAt: true,
                updatedAt: true,
                publishedAt: true,
            },
        })

        return NextResponse.json({ posts })
    } catch (error) {
        console.error('List outer posts error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

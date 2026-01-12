import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateOuterPostSchema } from '@/lib/validations'

export const runtime = 'nodejs'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * GET /api/outer-posts/[id]
 * Get single post detail (owner only)
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const post = await prisma.post.findFirst({
            where: {
                id,
                userId: user.userId,
                type: 'OUTER',
                deletedAt: null,
            },
            include: {
                user: {
                    select: { username: true },
                },
            },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        return NextResponse.json({ post })
    } catch (error) {
        console.error('Get outer post error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PATCH /api/outer-posts/[id]
 * Update post (save draft, update content)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const result = updateOuterPostSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten() },
                { status: 400 }
            )
        }

        // Verify ownership
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

        const post = await prisma.post.update({
            where: { id },
            data: {
                ...result.data,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                updatedAt: true,
            },
        })

        // Revalidate public pages if published
        if (existing.status === 'PUBLISHED' && existing.user.username && existing.slug) {
            revalidatePath(`/${existing.user.username}`)
            revalidatePath(`/${existing.user.username}/notes/${existing.slug}`)
        }

        return NextResponse.json({ post })
    } catch (error) {
        console.error('Update outer post error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/outer-posts/[id]
 * Soft delete post
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
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

        await prisma.post.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        // Revalidate public pages if was published
        if (existing.status === 'PUBLISHED' && existing.user.username && existing.slug) {
            revalidatePath(`/${existing.user.username}`)
            revalidatePath(`/${existing.user.username}/notes/${existing.slug}`)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete outer post error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

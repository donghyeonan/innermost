import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SplitViewEditor } from '@/components/editor/SplitViewEditor'

export const runtime = 'nodejs'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditOuterPostPage({ params }: PageProps) {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    const { id } = await params

    const post = await prisma.post.findFirst({
        where: {
            id,
            userId: user.userId,
            type: 'OUTER',
            deletedAt: null,
        },
        select: {
            id: true,
            title: true,
            bodyText: true,
            contentJson: true,
            status: true,
            slug: true,
            excerpt: true,
            references: true,
        },
    })

    if (!post) {
        notFound()
    }

    // Transform references from Json to proper type
    const references = Array.isArray(post.references)
        ? (post.references as Array<{
            id: string
            bodyText: string
            createdAt: string
            citedAt: string
        }>)
        : []

    return (
        <SplitViewEditor
            post={{
                id: post.id,
                title: post.title || '',
                bodyText: post.bodyText,
                contentJson: post.contentJson as object | null,
                status: post.status as 'DRAFT' | 'PUBLISHED',
                slug: post.slug || undefined,
                excerpt: post.excerpt || undefined,
                references,
            }}
        />
    )
}

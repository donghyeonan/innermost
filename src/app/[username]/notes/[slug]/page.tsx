import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import { Clock } from 'lucide-react'

export const runtime = 'nodejs'

interface PageProps {
    params: Promise<{ username: string; slug: string }>
}

interface Reference {
    id: string
    bodyText: string
    createdAt: string
    citedAt: string
}

export async function generateMetadata({ params }: PageProps) {
    const { username, slug } = await params

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
    })

    if (!user) {
        return { title: 'Not Found' }
    }

    const post = await prisma.post.findFirst({
        where: {
            userId: user.id,
            slug,
            type: 'OUTER',
            status: 'PUBLISHED',
            deletedAt: null,
        },
        select: {
            title: true,
            excerpt: true,
        },
    })

    if (!post) {
        return { title: 'Not Found' }
    }

    return {
        title: `${post.title} | @${username}`,
        description: post.excerpt || '',
    }
}

export default async function ArticlePage({ params }: PageProps) {
    const { username, slug } = await params

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true },
    })

    if (!user) {
        notFound()
    }

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
            bodyText: true,
            contentHtml: true,
            readingTime: true,
            publishedAt: true,
            updatedAt: true,
            references: true,
        },
    })

    if (!post) {
        notFound()
    }

    // Parse references
    const references: Reference[] = Array.isArray(post.references) ? (post.references as unknown as Reference[]) : []

    return (
        <article className="max-w-3xl mx-auto px-6 py-16">
            {/* Header */}
            <header className="mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                    {post.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <time>{dayjs(post.publishedAt).format('MMMM D, YYYY')}</time>
                    {post.readingTime && (
                        <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {post.readingTime} min read
                            </span>
                        </>
                    )}
                </div>
            </header>

            {/* Content */}
            <div
                className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.contentHtml || post.bodyText }}
            />

            {/* Inline Inner References (Deep Navy Quote Blocks) */}
            {references.length > 0 && (
                <aside className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-6">
                        Inner Reflections
                    </h2>
                    <div className="space-y-4">
                        {references.map((ref) => (
                            <blockquote
                                key={ref.id}
                                className="pl-4 border-l-4 border-[#1a1f36] bg-[#1a1f36]/5 dark:bg-[#1a1f36]/20 py-4 pr-4 rounded-r-lg"
                            >
                                <p className="text-gray-700 dark:text-gray-300 italic">
                                    &ldquo;{ref.bodyText}&rdquo;
                                </p>
                                <footer className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                    — From my inner thoughts, {dayjs(ref.createdAt).format('MMMM D, YYYY')}
                                </footer>
                            </blockquote>
                        ))}
                    </div>
                </aside>
            )}

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Written by <span className="font-medium text-gray-900 dark:text-gray-100">@{username}</span>
                    {post.updatedAt && post.updatedAt > post.publishedAt! && (
                        <> · Updated {dayjs(post.updatedAt).format('MMMM D, YYYY')}</>
                    )}
                </p>
            </footer>
        </article>
    )
}

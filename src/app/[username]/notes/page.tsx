import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import dayjs from 'dayjs'
import { Clock } from 'lucide-react'

export const runtime = 'nodejs'

interface PageProps {
    params: Promise<{ username: string }>
    searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps) {
    const { username } = await params
    return {
        title: `Notes | @${username}`,
        description: `Blog posts and notes by @${username}`,
    }
}

export default async function NotesPage({ params, searchParams }: PageProps) {
    const { username } = await params
    const { page: pageParam } = await searchParams
    const page = parseInt(pageParam || '1')
    const limit = 10

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
    })

    if (!user) {
        return null // Layout handles 404
    }

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where: {
                userId: user.id,
                type: 'OUTER',
                status: 'PUBLISHED',
                deletedAt: null,
            },
            orderBy: { publishedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                readingTime: true,
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

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="max-w-3xl mx-auto px-6 py-16">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Notes
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Observations on design, software craftsmanship, and the search for clarity in complex systems.
                </p>
            </div>

            {/* Posts list */}
            {posts.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">
                        No published notes yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {posts.map((post) => (
                        <article key={post.id} className="group">
                            <Link href={`/${username}/notes/${post.slug}`}>
                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <time>{dayjs(post.publishedAt).format('MMM D, YYYY')}</time>
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
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {post.title}
                                </h2>
                                {post.excerpt && (
                                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {post.excerpt}
                                    </p>
                                )}
                            </Link>
                        </article>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-4">
                    {page > 1 && (
                        <Link
                            href={`/${username}/notes?page=${page - 1}`}
                            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Previous
                        </Link>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link
                            href={`/${username}/notes?page=${page + 1}`}
                            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Load older notes
                        </Link>
                    )}
                </nav>
            )}
        </div>
    )
}

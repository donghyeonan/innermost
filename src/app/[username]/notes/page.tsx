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
            <div className="mb-16 text-center">
                <h1 className="text-5xl font-serif font-bold text-[#111] mb-6">
                    Notes
                </h1>
                <p className="text-xl text-gray-500 font-sans max-w-xl mx-auto leading-relaxed">
                    Observations on design, software craftsmanship, and the search for clarity in complex systems.
                </p>
            </div>

            {/* Posts list */}
            {posts.length === 0 ? (
                <div className="text-center py-16 border-t border-gray-100">
                    <p className="text-gray-400 italic font-serif">
                        No published notes yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-12">
                    {posts.map((post) => (
                        <article key={post.id} className="group border-b border-gray-100 pb-12 last:border-0">
                            <Link href={`/${username}/notes/${post.slug}`} className="block">
                                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
                                    <time>{dayjs(post.publishedAt).format('MMMM D, YYYY')}</time>
                                    {post.readingTime && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {post.readingTime} min read
                                            </span>
                                        </>
                                    )}
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-[#111] mb-4 group-hover:text-gray-600 transition-colors">
                                    {post.title}
                                </h2>
                                {post.excerpt && (
                                    <p className="text-gray-500 text-lg leading-relaxed line-clamp-3 group-hover:text-gray-600 transition-colors">
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
                <nav className="mt-20 flex items-center justify-center gap-6 border-t border-gray-100 pt-12">
                    {page > 1 && (
                        <Link
                            href={`/${username}/notes?page=${page - 1}`}
                            className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-full hover:bg-black hover:text-white hover:border-black transition-all"
                        >
                            Previous
                        </Link>
                    )}
                    <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link
                            href={`/${username}/notes?page=${page + 1}`}
                            className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-full hover:bg-black hover:text-white hover:border-black transition-all"
                        >
                            Load older notes
                        </Link>
                    )}
                </nav>
            )}
        </div>
    )
}

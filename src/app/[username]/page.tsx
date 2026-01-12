import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import dayjs from 'dayjs'
import { ArrowRight } from 'lucide-react'

export const runtime = 'nodejs'

interface PageProps {
    params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
    const { username } = await params

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true },
    })

    if (!user) {
        return null // Layout handles 404
    }

    // Get featured posts
    const featuredPosts = await prisma.post.findMany({
        where: {
            userId: user.id,
            type: 'OUTER',
            status: 'PUBLISHED',
            deletedAt: null,
            isFeatured: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 4,
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            gridSize: true,
            publishedAt: true,
        },
    })

    // Get latest notes
    const latestNotes = await prisma.post.findMany({
        where: {
            userId: user.id,
            type: 'OUTER',
            status: 'PUBLISHED',
            deletedAt: null,
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            readingTime: true,
            publishedAt: true,
        },
    })

    return (
        <div className="max-w-4xl mx-auto px-6 py-16">
            {/* Hero Section */}
            <section className="text-center mb-20">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                    Building digital tools for the thoughtful mind.
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                    Crafting minimalist interfaces that prioritize clarity, speed, and privacy in an increasingly noisy digital world.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        href={`/${username}/notes`}
                        className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                    >
                        Read Notes
                    </Link>
                    <Link
                        href={`/${username}/about`}
                        className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        About Me
                    </Link>
                </div>
            </section>

            {/* Featured Posts Grid */}
            {featuredPosts.length > 0 && (
                <section className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {featuredPosts.map((post, index) => {
                            const isLarge = post.gridSize === '2x2' || index === 0
                            return (
                                <Link
                                    key={post.id}
                                    href={`/${username}/notes/${post.slug}`}
                                    className={`group block bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow ${isLarge ? 'md:col-span-2' : ''
                                        }`}
                                >
                                    {post.coverImage && (
                                        <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700">
                                            <img
                                                src={post.coverImage}
                                                alt={post.title || ''}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && (
                                            <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {post.excerpt}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Latest Notes */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Latest Notes
                    </h2>
                    <Link
                        href={`/${username}/notes`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
                    >
                        View Archive
                        <ArrowRight size={14} />
                    </Link>
                </div>
                {latestNotes.length === 0 ? (
                    <p className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No published notes yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {latestNotes.map((note) => (
                            <Link
                                key={note.id}
                                href={`/${username}/notes/${note.slug}`}
                                className="block p-4 -mx-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                            {note.title}
                                        </h3>
                                        {note.excerpt && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                                {note.excerpt}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                        {dayjs(note.publishedAt).format('MMM D, YYYY')}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

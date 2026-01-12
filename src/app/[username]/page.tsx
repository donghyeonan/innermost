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
            <section className="text-center mb-24">
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#111] mb-8 leading-tight tracking-tight">
                    Building digital tools for<br />the thoughtful mind.
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-sans leading-relaxed">
                    Crafting minimalist interfaces that prioritize clarity, speed, and privacy in an increasingly noisy digital world.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        href={`/${username}/notes`}
                        className="px-8 py-3 bg-[#111] text-white rounded-full font-medium hover:bg-black transition-transform active:scale-95 shadow-lg shadow-gray-200"
                    >
                        Read Notes
                    </Link>
                    <Link
                        href={`/${username}/about`}
                        className="px-8 py-3 bg-white text-[#111] border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
                    >
                        about.me
                    </Link>
                </div>
            </section>

            {/* Featured Posts Grid */}
            {featuredPosts.length > 0 && (
                <section className="mb-24">
                    <h2 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-8 text-center">Featured</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {featuredPosts.map((post, index) => {
                            const isLarge = post.gridSize === '2x2' || index === 0
                            return (
                                <Link
                                    key={post.id}
                                    href={`/${username}/notes/${post.slug}`}
                                    className={`group block relative ${isLarge ? 'md:col-span-2' : ''}`}
                                >
                                    <div className="aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden mb-6">
                                        {post.coverImage ? (
                                            <img
                                                src={post.coverImage}
                                                alt={post.title || ''}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                                <span className="text-gray-300 font-serif italic text-4xl opacity-50">Innermost</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="max-w-xl">
                                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
                                            <time>{dayjs(post.publishedAt).format('MMMM D, YYYY')}</time>
                                            {post.gridSize && <span>• {post.gridSize}</span>}
                                        </div>
                                        <h3 className="text-3xl font-serif font-bold text-[#111] mb-3 group-hover:text-gray-600 transition-colors leading-tight">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && (
                                            <p className="text-gray-500 line-clamp-2 text-lg leading-relaxed">
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
            <section className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-12 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-[#111]">
                        Latest Notes
                    </h2>
                    <Link
                        href={`/${username}/notes`}
                        className="text-sm font-medium text-gray-500 hover:text-[#111] flex items-center gap-1 transition-colors"
                    >
                        View Archive
                        <ArrowRight size={14} />
                    </Link>
                </div>
                {latestNotes.length === 0 ? (
                    <p className="text-center py-12 text-gray-400 italic font-serif">
                        No published notes yet.
                    </p>
                ) : (
                    <div className="space-y-12">
                        {latestNotes.map((note) => (
                            <Link
                                key={note.id}
                                href={`/${username}/notes/${note.slug}`}
                                className="block group"
                            >
                                <article>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                                        <time>{dayjs(note.publishedAt).format('MMM D, YYYY')}</time>
                                        {note.readingTime && (
                                            <>
                                                <span>•</span>
                                                <span>{note.readingTime} min read</span>
                                            </>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-[#111] mb-2 group-hover:text-blue-600 transition-colors font-serif">
                                        {note.title}
                                    </h3>
                                    {note.excerpt && (
                                        <p className="text-gray-500 leading-relaxed">
                                            {note.excerpt}
                                        </p>
                                    )}
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

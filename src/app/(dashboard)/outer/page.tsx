import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import dayjs from 'dayjs'
import { Plus, Edit2, ExternalLink } from 'lucide-react'

export const runtime = 'nodejs'

export default async function OuterPostsPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    const posts = await prisma.post.findMany({
        where: {
            userId: user.userId,
            type: 'OUTER',
            deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            excerpt: true,
            readingTime: true,
            createdAt: true,
            publishedAt: true,
        },
    })

    const userWithUsername = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { username: true },
    })

    const drafts = posts.filter((p: any) => p.status === 'DRAFT')
    const published = posts.filter((p: any) => p.status === 'PUBLISHED')

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground">
                        Outer Posts
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your public blog posts
                    </p>
                </div>
                <Link
                    href="/archive"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    New Post
                </Link>
            </div>

            {/* Drafts section */}
            {drafts.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        Drafts ({drafts.length})
                    </h2>
                    <div className="space-y-3">
                        {drafts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-foreground truncate">
                                        {post.title || 'Untitled'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Created {dayjs(post.createdAt).format('MMM D, YYYY')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/outer/${post.id}/edit`}
                                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} className="text-muted-foreground" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Published section */}
            <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Published ({published.length})
                </h2>
                {published.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-lg border border-border">
                        <p className="text-muted-foreground">
                            No published posts yet. Create your first post!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {published.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-foreground truncate">
                                        {post.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Published {dayjs(post.publishedAt).format('MMM D, YYYY')}
                                        {post.readingTime && ` · ${post.readingTime} min read`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {userWithUsername?.username && post.slug && (
                                        <Link
                                            href={`/${userWithUsername.username}/notes/${post.slug}`}
                                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                                            target="_blank"
                                        >
                                            <ExternalLink size={18} className="text-muted-foreground" />
                                        </Link>
                                    )}
                                    <Link
                                        href={`/outer/${post.id}/edit`}
                                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} className="text-muted-foreground" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

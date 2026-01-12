import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'

export const runtime = 'nodejs'

interface PageProps {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps) {
    const { username } = await params
    return {
        title: `About | @${username}`,
        description: `About @${username}`,
    }
}

export default async function AboutPage({ params }: PageProps) {
    const { username } = await params

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, createdAt: true },
    })

    if (!user) {
        return null // Layout handles 404
    }

    // Get post count
    const publishedCount = await prisma.post.count({
        where: {
            userId: user.id,
            type: 'OUTER',
            status: 'PUBLISHED',
            deletedAt: null,
        },
    })

    return (
        <div className="max-w-3xl mx-auto px-6 py-16">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                About
            </h1>

            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                <p>
                    Welcome to my corner of the internet. I'm <strong>@{username}</strong>,
                    and this is where I share my thoughts, learnings, and reflections.
                </p>

                <p>
                    This blog is built with <em>Innermost</em>, a platform that bridges private
                    journaling with public expression. Some of my posts include references to
                    private thoughts—snapshots of inner reflections that inform my published work.
                </p>

                <h2>By the Numbers</h2>
                <ul>
                    <li><strong>{publishedCount}</strong> published notes</li>
                    <li>Writing since <strong>{dayjs(user.createdAt).format('MMMM YYYY')}</strong></li>
                </ul>

                <h2>Get in Touch</h2>
                <p>
                    The best way to reach me is through the thoughts I share here.
                    Every post is an invitation for conversation.
                </p>
            </div>
        </div>
    )
}

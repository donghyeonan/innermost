import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { RESERVED_USERNAMES } from '@/lib/validations'

export const runtime = 'nodejs'

interface LayoutProps {
    children: React.ReactNode
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params

    // Check reserved usernames
    if (RESERVED_USERNAMES.includes(username)) {
        return { title: 'Not Found' }
    }

    const user = await prisma.user.findUnique({
        where: { username },
        select: { username: true },
    })

    if (!user) {
        return { title: 'Not Found' }
    }

    return {
        title: `@${user.username} | Innermost`,
        description: `Public profile of @${user.username}`,
    }
}

export default async function PublicProfileLayout({ children, params }: LayoutProps) {
    const { username } = await params

    // Check reserved usernames
    if (RESERVED_USERNAMES.includes(username)) {
        notFound()
    }

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true },
    })

    if (!user) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Navigation */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
                <nav className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href={`/${username}`}
                            className="font-semibold text-gray-900 dark:text-gray-100"
                        >
                            @{username}
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link
                                href={`/${username}`}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                                Home
                            </Link>
                            <Link
                                href={`/${username}/notes`}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                                Notes
                            </Link>
                            <Link
                                href={`/${username}/about`}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                                About
                            </Link>
                            <Link
                                href="/login"
                                className="text-sm px-4 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-gray-300"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Main content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="border-t border-gray-100 dark:border-gray-800 mt-16">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <p>@{username}</p>
                        <p>© {new Date().getFullYear()}</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

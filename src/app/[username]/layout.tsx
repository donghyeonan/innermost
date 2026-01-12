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
        <div className="min-h-screen bg-white font-sans text-[#111]">
            {/* Navigation */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
                <nav className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <Link
                            href={`/${username}`}
                            className="text-lg font-bold text-[#111] tracking-tight group flex items-center gap-2"
                        >
                            <span className="w-8 h-8 flex items-center justify-center bg-[#111] text-white rounded-full">
                                <span className="font-serif italic text-sm">i</span>
                            </span>
                            @{username}
                        </Link>
                        <div className="flex items-center gap-8">
                            <Link
                                href={`/${username}`}
                                className="text-sm font-medium text-gray-500 hover:text-[#111] transition-colors"
                            >
                                Home
                            </Link>
                            <Link
                                href={`/${username}/notes`}
                                className="text-sm font-medium text-gray-500 hover:text-[#111] transition-colors"
                            >
                                Notes
                            </Link>
                            <Link
                                href={`/${username}/about`}
                                className="text-sm font-medium text-gray-500 hover:text-[#111] transition-colors"
                            >
                                About
                            </Link>
                            <Link
                                href="/login"
                                className="text-sm font-medium px-5 py-2 bg-[#111] text-white rounded-full hover:bg-black transition-transform active:scale-95"
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
            <footer className="mt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider font-medium">
                        <div className="flex items-center gap-2">
                            <span className="font-serif italic text-gray-300">@{username}</span>
                            <span>/</span>
                            <span>© {new Date().getFullYear()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="#" className="hover:text-gray-900 transition-colors">RSS</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Twitter</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">GitHub</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Archive, Settings, Menu, X, User, Edit3, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SidebarProps {
    user?: {
        email: string
        username?: string
    } | null
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/archive', label: 'Archive', icon: Archive },
    { href: '/outer', label: 'Publish', icon: Edit3 },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isPrivateMode, setIsPrivateMode] = useState(true)
    const [username, setUsername] = useState<string | null>(user?.username || null)

    // Fetch username if not provided
    useEffect(() => {
        if (!username) {
            fetch('/api/users/me')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.user?.username) {
                        setUsername(data.user.username)
                    }
                })
                .catch(() => { })
        }
    }, [username])

    const handleModeToggle = async () => {
        if (isPrivateMode) {
            // Check or generate username before switching to public
            let currentUsername = username

            if (!currentUsername) {
                try {
                    const res = await fetch('/api/users/ensure-username', { method: 'POST' })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.user?.username) {
                            currentUsername = data.user.username
                            setUsername(currentUsername)
                        }
                    }
                } catch (error) {
                    console.error('Failed to ensure username:', error)
                }
            }

            if (currentUsername) {
                router.push(`/${currentUsername}`)
                setIsPrivateMode(false)
            } else {
                toast.error('Username not found. Please update your profile.')
            }
        } else {
            // Back to private dashboard
            router.push('/dashboard')
            setIsPrivateMode(true)
        }
    }

    return (
        <>
            {/* Mobile hamburger button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-50"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40',
                    'flex flex-col transition-transform duration-200',
                    'lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* User info */}
                <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                            <User className="h-5 w-5 text-sidebar-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {user?.email || 'User'}
                            </p>
                            <p className="text-xs text-sidebar-muted-foreground">
                                {isPrivateMode ? 'Private Workspace' : 'Public Portfolio'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                    isActive
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Mode toggle */}
                <div className="p-4 border-t border-sidebar-border">
                    <button
                        onClick={handleModeToggle}
                        className="w-full flex items-center justify-between text-xs hover:bg-sidebar-accent p-2 rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {isPrivateMode ? (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <User className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sidebar-foreground">
                                {isPrivateMode ? 'View Public' : 'Back to Private'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-[10px]">
                                {isPrivateMode ? 'Private' : 'Public'}
                            </span>
                            <div className={cn(
                                'w-8 h-4 rounded-full relative transition-colors',
                                isPrivateMode ? 'bg-sidebar-accent' : 'bg-blue-500'
                            )}>
                                <div className={cn(
                                    'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all',
                                    isPrivateMode ? 'left-0.5' : 'left-4'
                                )} />
                            </div>
                        </div>
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">v2.4.0 · Dark Room</p>
                </div>
            </aside>
        </>
    )
}


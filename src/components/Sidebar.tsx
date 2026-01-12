'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Archive, Settings, Menu, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
    user?: {
        email: string
    } | null
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/archive', label: 'Archive', icon: Archive },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

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
                            <p className="text-xs text-sidebar-muted-foreground">Private Workspace</p>
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

                {/* Mode indicator */}
                <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">MODE</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sidebar-foreground">Private</span>
                            <div className="w-8 h-4 bg-sidebar-accent rounded-full relative">
                                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-sidebar-primary rounded-full" />
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">v2.4.0 · Dark Room</p>
                </div>
            </aside>
        </>
    )
}

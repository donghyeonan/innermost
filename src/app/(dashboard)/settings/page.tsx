'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings as SettingsIcon, LogOut, LayoutGrid, LayoutList, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserData {
    id: string
    email: string
    viewPreference: 'list' | 'grid'
    createdAt: string
}

export default function SettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/users/me')
                if (response.ok) {
                    const data = await response.json()
                    setUser(data.user)
                }
            } catch (error) {
                console.error('Failed to fetch user:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleViewPreferenceChange = async (preference: 'list' | 'grid') => {
        if (!user || user.viewPreference === preference) return

        try {
            const response = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewPreference: preference }),
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
                toast.success('Preference saved')
            }
        } catch (error) {
            toast.error('Failed to save preference')
        }
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            })

            toast.success('Logged out')
            router.push('/login')
        } catch (error) {
            toast.error('Failed to logout')
        } finally {
            setIsLoggingOut(false)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto pt-8 lg:pt-0">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto pt-8 lg:pt-0 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-card">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-sm text-muted-foreground">Manage your account preferences</p>
                </div>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile
                    </CardTitle>
                    <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground">Email</label>
                            <p className="font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Member since</label>
                            <p className="font-medium">
                                {user?.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Preference */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">View Preference</CardTitle>
                    <CardDescription>Choose how entries are displayed</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-6',
                                user?.viewPreference === 'list' && 'border-primary bg-primary/10'
                            )}
                            onClick={() => handleViewPreferenceChange('list')}
                        >
                            <LayoutList className="h-5 w-5" />
                            List View
                        </Button>
                        <Button
                            variant="outline"
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-6',
                                user?.viewPreference === 'grid' && 'border-primary bg-primary/10'
                            )}
                            onClick={() => handleViewPreferenceChange('grid')}
                        >
                            <LayoutGrid className="h-5 w-5" />
                            Grid View
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Logout */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

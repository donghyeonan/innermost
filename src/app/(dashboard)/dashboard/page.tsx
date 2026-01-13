'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuickCapture } from '@/components/QuickCapture'
import { EntryList } from '@/components/EntryList'
import { getDisplayDate } from '@/lib/date'

interface Entry {
    id: string
    bodyText: string
    createdAt: string
    dayKey: string
}

interface TodayResponse {
    entries: Entry[]
    serverNow: string
    serverToday: string
}

export default function DashboardPage() {
    const [entries, setEntries] = useState<Entry[]>([])
    const [serverToday, setServerToday] = useState('')
    const [serverNow, setServerNow] = useState('')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [isLoading, setIsLoading] = useState(true)

    const fetchEntries = useCallback(async () => {
        try {
            const response = await fetch('/api/inner-entries/today')
            if (!response.ok) throw new Error('Failed to fetch entries')

            const data: TodayResponse = await response.json()
            setEntries(data.entries)
            setServerToday(data.serverToday)
            setServerNow(data.serverNow)
        } catch (error) {
            console.error('Failed to fetch entries:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch initial data
    useEffect(() => {
        fetchEntries()
    }, [fetchEntries])

    // Load view preference from user settings
    useEffect(() => {
        const fetchUserPreference = async () => {
            try {
                const response = await fetch('/api/users/me')
                if (response.ok) {
                    const data = await response.json()
                    if (data.user?.viewPreference) {
                        setViewMode(data.user.viewPreference as 'list' | 'grid')
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user preference:', error)
            }
        }
        fetchUserPreference()
    }, [])

    // Save view preference to server
    const handleViewModeChange = async (mode: 'list' | 'grid') => {
        setViewMode(mode)
        try {
            await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewPreference: mode }),
            })
        } catch (error) {
            console.error('Failed to save view preference:', error)
        }
    }

    const displayDate = serverNow
        ? getDisplayDate(serverNow).replace(/^\w/, c => c.toUpperCase())
        : 'Today'

    return (
        <div className="max-w-4xl mx-auto space-y-8 pt-8 lg:pt-0">
            {/* Date header */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">{displayDate}</h1>
                <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Focus mode
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'} today
                    </span>
                </div>
            </div>

            {/* Quick Capture */}
            <QuickCapture onEntryCreated={fetchEntries} serverToday={serverToday} />

            {/* Entry List */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading entries...
                </div>
            ) : (
                <EntryList
                    entries={entries}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    onEntryDeleted={fetchEntries}
                />
            )}
        </div>
    )
}

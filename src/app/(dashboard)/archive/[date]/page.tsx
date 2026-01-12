'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/Calendar'
import { EntryList } from '@/components/EntryList'
import { Lock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { dayjs, SERVER_TZ, formatDate, getServerToday } from '@/lib/date'
import { toast } from 'sonner'

interface Entry {
    id: string
    bodyText: string
    createdAt: string
    dayKey: string
}

interface MonthMeta {
    date: string
    count: number
}

export default function ArchiveDatePage({
    params
}: {
    params: Promise<{ date: string }>
}) {
    const { date } = use(params)
    const router = useRouter()
    const [entries, setEntries] = useState<Entry[]>([])
    const [monthMeta, setMonthMeta] = useState<MonthMeta[]>([])
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [isLoading, setIsLoading] = useState(true)

    const currentMonth = dayjs(date).format('YYYY-MM')
    const isToday = date === getServerToday()
    const displayDate = dayjs(date).tz(SERVER_TZ).format('dddd, MMM D')

    // Fetch entries for the selected date
    useEffect(() => {
        const fetchEntries = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/inner-entries/by-date?date=${date}`)
                if (response.ok) {
                    const data = await response.json()
                    setEntries(data.entries)
                }
            } catch (error) {
                console.error('Failed to fetch entries:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchEntries()
    }, [date])

    // Fetch month metadata for mini calendar
    useEffect(() => {
        const fetchMonthMeta = async () => {
            try {
                const response = await fetch(`/api/inner-entries/month-meta?month=${currentMonth}`)
                if (response.ok) {
                    const data = await response.json()
                    setMonthMeta(data.meta)
                }
            } catch (error) {
                console.error('Failed to fetch month meta:', error)
            }
        }
        fetchMonthMeta()
    }, [currentMonth])

    const handleDateSelect = (newDate: string) => {
        if (newDate === getServerToday()) {
            router.push('/dashboard')
        } else {
            router.push(`/archive/${newDate}`)
        }
    }

    const handleEntryDeleted = async () => {
        // Refresh entries after delete
        const response = await fetch(`/api/inner-entries/by-date?date=${date}`)
        if (response.ok) {
            const data = await response.json()
            setEntries(data.entries)
        }
        // Refresh month meta
        const metaResponse = await fetch(`/api/inner-entries/month-meta?month=${currentMonth}`)
        if (metaResponse.ok) {
            const data = await metaResponse.json()
            setMonthMeta(data.meta)
        }
    }

    return (
        <div className="max-w-6xl mx-auto pt-8 lg:pt-0">
            <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
                {/* Mini calendar sidebar */}
                <aside className="hidden lg:block">
                    <div className="sticky top-8">
                        <div className="bg-card rounded-xl border border-border p-4">
                            <Calendar
                                selectedDate={date}
                                onDateSelect={handleDateSelect}
                                monthMeta={monthMeta}
                                mini
                            />
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            {entries.length} entries in {dayjs(currentMonth).format('MMMM')}
                        </p>
                    </div>
                </aside>

                {/* Main content */}
                <main>
                    {/* Header */}
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-4"
                            onClick={() => router.push('/archive')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Archive
                        </Button>

                        {/* Read-only banner */}
                        {!isToday && (
                            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                <Lock className="h-4 w-4" />
                                <span className="text-sm font-medium">READ-ONLY</span>
                                <span className="text-sm">Past events cannot be modified</span>
                            </div>
                        )}

                        <h1 className="text-3xl font-bold text-primary">{displayDate}</h1>
                    </div>

                    {/* Entry list */}
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading entries...
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No entries for this date.</p>
                        </div>
                    ) : (
                        <EntryList
                            entries={entries}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            onEntryDeleted={handleEntryDeleted}
                            readonly={false} // Allow delete even in archive
                        />
                    )}
                </main>
            </div>
        </div>
    )
}

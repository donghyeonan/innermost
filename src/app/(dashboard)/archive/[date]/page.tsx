'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/Calendar'
import { Lock, ArrowLeft, Edit3, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { dayjs, SERVER_TZ, formatDate, getServerToday } from '@/lib/date'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    const [selectMode, setSelectMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isCreatingDraft, setIsCreatingDraft] = useState(false)

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

    const toggleSelectMode = () => {
        setSelectMode(!selectMode)
        setSelectedIds(new Set())
    }

    const toggleEntrySelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            if (newSelected.size >= 10) {
                toast.error('Maximum 10 references allowed')
                return
            }
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleCreateDraft = async () => {
        if (selectedIds.size === 0) {
            toast.error('Select at least one entry')
            return
        }

        setIsCreatingDraft(true)
        try {
            // Get selected entries for references
            const selectedEntries = entries.filter(e => selectedIds.has(e.id))
            const references = selectedEntries.map(e => ({
                id: e.id,
                bodyText: e.bodyText,
                createdAt: e.createdAt,
                citedAt: new Date().toISOString(),
            }))

            // Create draft with references
            const response = await fetch('/api/outer-posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Reflections from ${displayDate}`,
                    references,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                toast.success('Draft created with references!')
                router.push(`/outer/${data.post.id}/edit`)
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to create draft')
            }
        } catch (error) {
            console.error('Failed to create draft:', error)
            toast.error('Failed to create draft')
        } finally {
            setIsCreatingDraft(false)
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
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/archive')}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Archive
                            </Button>

                            {/* Select mode toggle */}
                            {entries.length > 0 && (
                                <Button
                                    variant={selectMode ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={toggleSelectMode}
                                >
                                    {selectMode ? (
                                        <>
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Select
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* Read-only banner */}
                        {!isToday && !selectMode && (
                            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                <Lock className="h-4 w-4" />
                                <span className="text-sm font-medium">READ-ONLY</span>
                                <span className="text-sm">Past events cannot be modified</span>
                            </div>
                        )}

                        {/* Select mode banner */}
                        {selectMode && (
                            <div className="flex items-center gap-2 text-blue-500 mb-4">
                                <Edit3 className="h-4 w-4" />
                                <span className="text-sm font-medium">SELECT MODE</span>
                                <span className="text-sm">
                                    Choose entries to include in your Outer post ({selectedIds.size}/10)
                                </span>
                            </div>
                        )}

                        <h1 className="text-3xl font-bold text-primary">{displayDate}</h1>
                    </div>

                    {/* Entry list with selection */}
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading entries...
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No entries for this date.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* View mode toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-medium flex items-center gap-2">
                                    📖 Today&apos;s Entries
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">View All</span>
                                    <div className="flex border border-border rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                'p-1.5 transition-colors',
                                                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                            )}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                'p-1.5 transition-colors',
                                                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                            )}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="7" height="7" />
                                                <rect x="14" y="3" width="7" height="7" />
                                                <rect x="3" y="14" width="7" height="7" />
                                                <rect x="14" y="14" width="7" height="7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Entries */}
                            <div className={cn(
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                                    : 'space-y-3'
                            )}>
                                {entries.map((entry) => {
                                    const isSelected = selectedIds.has(entry.id)
                                    return (
                                        <div
                                            key={entry.id}
                                            onClick={() => selectMode && toggleEntrySelection(entry.id)}
                                            className={cn(
                                                'p-4 rounded-lg border transition-all',
                                                selectMode ? 'cursor-pointer' : '',
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-border bg-card hover:border-muted-foreground/50'
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                {selectMode && (
                                                    <div className={cn(
                                                        'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5',
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-500'
                                                            : 'border-muted-foreground'
                                                    )}>
                                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                )}
                                                <p className="flex-1 text-sm text-foreground whitespace-pre-wrap">
                                                    {entry.bodyText}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {dayjs(entry.createdAt).format('HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Floating Draft Button */}
            {selectMode && selectedIds.size > 0 && (
                <div className="fixed bottom-8 right-8 z-50">
                    <Button
                        size="lg"
                        onClick={handleCreateDraft}
                        disabled={isCreatingDraft}
                        className="shadow-lg"
                    >
                        {isCreatingDraft ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <Edit3 className="h-5 w-5 mr-2" />
                        )}
                        Compose with Selection ({selectedIds.size})
                    </Button>
                </div>
            )}
        </div>
    )
}


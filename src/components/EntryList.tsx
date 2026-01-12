'use client'

import { useState, useRef, useEffect } from 'react'
import { formatTime } from '@/lib/date'
import { Trash2, ChevronRight, LayoutGrid, LayoutList, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Entry {
    id: string
    bodyText: string
    createdAt: string
    dayKey: string
}

interface EntryListProps {
    entries: Entry[]
    viewMode: 'list' | 'grid'
    onViewModeChange: (mode: 'list' | 'grid') => void
    onEntryDeleted: () => void
    readonly?: boolean
}

export function EntryList({
    entries,
    viewMode,
    onViewModeChange,
    onEntryDeleted,
    readonly = false
}: EntryListProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current)
            }
        }
    }, [])

    const handleDelete = async (id: string) => {
        if (deletingId) return

        setDeletingId(id)

        try {
            const response = await fetch(`/api/inner-entries/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete entry')
            }

            // Show undo toast
            toast.success('Entry deleted', {
                action: {
                    label: 'Undo',
                    onClick: () => handleRestore(id),
                },
                duration: 5000,
            })

            onEntryDeleted()
        } catch (error) {
            toast.error('Failed to delete', {
                description: error instanceof Error ? error.message : 'Please try again',
            })
        } finally {
            setDeletingId(null)
        }
    }

    const handleRestore = async (id: string) => {
        try {
            const response = await fetch(`/api/inner-entries/${id}/restore`, {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('Failed to restore entry')
            }

            toast.success('Entry restored')
            onEntryDeleted() // Refresh the list
        } catch (error) {
            toast.error('Failed to restore', {
                description: error instanceof Error ? error.message : 'Please try again',
            })
        }
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No entries yet. Start capturing your thoughts!</p>
            </div>
        )
    }

    return (
        <div>
            {/* Header with view toggle and collapse */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        <span className="text-xl">📝</span>
                        {readonly ? 'Entries' : "Today's Entries"}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <ChevronRight className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isExpanded && "rotate-90"
                        )} />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">View All</span>
                    <div className="flex border border-border rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-7 w-7', viewMode === 'list' && 'bg-accent')}
                            onClick={() => onViewModeChange('list')}
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-7 w-7', viewMode === 'grid' && 'bg-accent')}
                            onClick={() => onViewModeChange('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Entry list */}
            {isExpanded && (
                <div className={cn(
                    "transition-all duration-300 ease-in-out",
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                        : 'space-y-2'
                )}>
                    {entries.map((entry) => (
                        <div
                            key={entry.id}
                            className={cn(
                                'group flex items-start gap-4 p-4 rounded-lg transition-colors',
                                'hover:bg-card/50',
                                viewMode === 'grid' && 'bg-card border border-border'
                            )}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground whitespace-pre-wrap break-words">
                                    {entry.bodyText.length > 150 && viewMode !== 'grid'
                                        ? `${entry.bodyText.slice(0, 150)}...`
                                        : entry.bodyText}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-muted-foreground">
                                    {formatTime(entry.createdAt)}
                                </span>

                                {!readonly && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(entry.id)}
                                        disabled={deletingId === entry.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}

                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

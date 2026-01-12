'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, GripVertical, Clock } from 'lucide-react'
import dayjs from 'dayjs'

interface InnerEntry {
    id: string
    bodyText: string
    createdAt: string
}

interface Reference {
    id: string
    bodyText: string
    createdAt: string
    citedAt: string
}

interface ReferencePanelProps {
    references: Reference[]
    onAddReference: (entry: InnerEntry) => void
    onRemoveReference: (id: string) => void
    maxReferences?: number
}

export function ReferencePanel({
    references,
    onAddReference,
    onRemoveReference,
    maxReferences = 10,
}: ReferencePanelProps) {
    const [entries, setEntries] = useState<InnerEntry[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    // Fetch user's inner entries
    useEffect(() => {
        async function fetchEntries() {
            try {
                const res = await fetch('/api/inner-entries?limit=100')
                if (res.ok) {
                    const data = await res.json()
                    setEntries(data.entries || [])
                }
            } catch (error) {
                console.error('Failed to fetch inner entries:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchEntries()
    }, [])

    const filteredEntries = entries.filter((entry) =>
        entry.bodyText.toLowerCase().includes(search.toLowerCase())
    )

    const isReferenced = (id: string) => references.some((ref) => ref.id === id)
    const canAddMore = references.length < maxReferences

    const handleAddReference = (entry: InnerEntry) => {
        if (!canAddMore || isReferenced(entry.id)) return
        onAddReference(entry)
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Selected References
                    <span className="ml-2 text-sm font-normal text-gray-500">
                        ({references.length}/{maxReferences})
                    </span>
                </h2>

                {/* Selected references */}
                {references.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {references.map((ref) => (
                            <div
                                key={ref.id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {dayjs(ref.createdAt).format('MMM D, YYYY')}
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                            {ref.bodyText}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onRemoveReference(ref.id)}
                                        className="text-gray-400 hover:text-red-500 text-xs"
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search inner entries..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                        {search ? 'No entries match your search' : 'No inner entries yet'}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {filteredEntries.map((entry) => {
                            const referenced = isReferenced(entry.id)
                            return (
                                <div
                                    key={entry.id}
                                    className={`p-3 rounded-lg border transition-colors ${referenced
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        <Clock size={12} />
                                        {dayjs(entry.createdAt).format('MMM D, h:mm A')}
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                                        {entry.bodyText}
                                    </p>
                                    <button
                                        onClick={() => handleAddReference(entry)}
                                        disabled={referenced || !canAddMore}
                                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${referenced
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-default'
                                                : canAddMore
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                            }`}
                                        type="button"
                                    >
                                        {referenced ? (
                                            'Added'
                                        ) : (
                                            <>
                                                <Plus size={12} />
                                                Cite
                                            </>
                                        )}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
                Click &quot;Cite&quot; to add reference to your post
            </div>
        </div>
    )
}

export default ReferencePanel

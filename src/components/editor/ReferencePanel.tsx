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
        <div className="h-full flex flex-col bg-[#F8F9FA] border-r border-gray-200 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                    <span>Selected References</span>
                    <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {references.length}/{maxReferences}
                    </span>
                </h2>

                {/* Selected references */}
                {references.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {references.map((ref) => (
                            <div
                                key={ref.id}
                                className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-400 mb-1">
                                            {dayjs(ref.createdAt).format('MMM D, YYYY')}
                                        </p>
                                        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                                            {ref.bodyText}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onRemoveReference(ref.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
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
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search inner entries..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 transition-all placeholder:text-gray-400 text-gray-900"
                    />
                </div>
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">
                        {search ? 'No matches found' : 'No inner entries available'}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {filteredEntries.map((entry) => {
                            const referenced = isReferenced(entry.id)
                            return (
                                <div
                                    key={entry.id}
                                    draggable={true} // Allow dragging (functionality to be implemented if needed, but UI first)
                                    className={`p-3 rounded-lg border transition-all duration-200 ${referenced
                                        ? 'bg-gray-100 border-gray-200 opacity-60'
                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-medium">
                                        <Clock size={12} />
                                        {dayjs(entry.createdAt).format('MMM D, h:mm A')}
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-3 mb-3 leading-relaxed">
                                        {entry.bodyText}
                                    </p>
                                    <button
                                        onClick={() => handleAddReference(entry)}
                                        disabled={referenced || !canAddMore}
                                        className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded font-medium transition-colors ${referenced
                                            ? 'text-green-600 bg-transparent'
                                            : canAddMore
                                                ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                                                : 'text-gray-300 cursor-not-allowed'
                                            }`}
                                        type="button"
                                    >
                                        {referenced ? (
                                            'Added'
                                        ) : (
                                            <>
                                                <Plus size={12} />
                                                Cite Entry
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
            <div className="p-3 border-t border-gray-200 text-[10px] uppercase tracking-wider text-gray-400 text-center font-medium">
                References Panel
            </div>
        </div>
    )
}

export default ReferencePanel

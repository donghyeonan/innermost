'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TiptapEditor } from './TiptapEditor'
import { ReferencePanel } from './ReferencePanel'
import { Save, Eye, Send, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface Reference {
    id: string
    bodyText: string
    createdAt: string
    citedAt: string
}

interface Post {
    id: string
    title: string
    bodyText: string
    contentJson: object | null
    status: 'DRAFT' | 'PUBLISHED'
    slug?: string
    excerpt?: string
    references?: Reference[]
}

interface SplitViewEditorProps {
    post?: Post
    onSave?: (post: Post) => void
}

export function SplitViewEditor({ post, onSave }: SplitViewEditorProps) {
    const router = useRouter()
    const [postId, setPostId] = useState(post?.id || '')
    const [title, setTitle] = useState(post?.title || '')
    const [contentJson, setContentJson] = useState<object | null>(post?.contentJson || null)
    const [bodyText, setBodyText] = useState(post?.bodyText || '')
    const [contentHtml, setContentHtml] = useState('')
    const [references, setReferences] = useState<Reference[]>(post?.references || [])
    const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(post?.status || 'DRAFT')
    const [saving, setSaving] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [showReferences, setShowReferences] = useState(true)

    // Create draft on first load if no post
    useEffect(() => {
        async function createDraft() {
            if (!postId) {
                try {
                    const res = await fetch('/api/outer-posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: 'Untitled' }),
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setPostId(data.post.id)
                        // Update URL without navigation
                        window.history.replaceState(null, '', `/dashboard/outer/${data.post.id}/edit`)
                    }
                } catch (error) {
                    console.error('Failed to create draft:', error)
                    toast.error('Failed to create draft')
                }
            }
        }
        createDraft()
    }, [postId])

    const handleEditorChange = useCallback((data: { html: string; json: object; text: string }) => {
        setContentJson(data.json)
        setBodyText(data.text)
        setContentHtml(data.html)
    }, [])

    const handleAddReference = useCallback((entry: { id: string; bodyText: string; createdAt: string }) => {
        setReferences((prev) => [
            ...prev,
            {
                id: entry.id,
                bodyText: entry.bodyText,
                createdAt: entry.createdAt,
                citedAt: new Date().toISOString(),
            },
        ])
    }, [])

    const handleRemoveReference = useCallback((id: string) => {
        setReferences((prev) => prev.filter((ref) => ref.id !== id))
    }, [])

    const handleSave = async () => {
        if (!postId) return

        setSaving(true)
        try {
            const res = await fetch(`/api/outer-posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    bodyText,
                    contentJson,
                    contentHtml,
                    references,
                }),
            })

            if (res.ok) {
                setLastSaved(new Date())
                toast.success('Draft saved')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save')
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const handlePublish = async () => {
        if (!postId) return

        // Save first
        await handleSave()

        setPublishing(true)
        try {
            const res = await fetch(`/api/outer-posts/${postId}/publish`, {
                method: 'POST',
            })

            if (res.ok) {
                const data = await res.json()
                setStatus('PUBLISHED')
                toast.success('Published successfully!')
                router.push('/dashboard/outer')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to publish')
            }
        } catch (error) {
            console.error('Publish error:', error)
            toast.error('Failed to publish')
        } finally {
            setPublishing(false)
        }
    }

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!postId || !contentJson) return

        const timer = setInterval(() => {
            handleSave()
        }, 30000)

        return () => clearInterval(timer)
    }, [postId, title, bodyText, contentJson, references])

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/outer')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        type="button"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full ${status === 'PUBLISHED'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                        >
                            {status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </span>
                        {lastSaved && (
                            <span className="text-xs text-gray-500">
                                Saved {dayjs(lastSaved).format('h:mm A')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowReferences(!showReferences)}
                        className={`px-3 py-1.5 text-sm rounded-lg border ${showReferences
                                ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                        type="button"
                    >
                        References
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !postId}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                        type="button"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing || !postId || !title || !bodyText}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                        type="button"
                    >
                        {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Publish
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Reference panel (collapsible) */}
                {showReferences && (
                    <aside className="w-80 flex-shrink-0 overflow-hidden">
                        <ReferencePanel
                            references={references}
                            onAddReference={handleAddReference}
                            onRemoveReference={handleRemoveReference}
                        />
                    </aside>
                )}

                {/* Editor area */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto p-8">
                        {/* Title input */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Post title..."
                            className="w-full text-4xl font-bold bg-transparent border-none outline-none mb-8 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                        />

                        {/* Editor */}
                        <TiptapEditor
                            contentJson={contentJson}
                            placeholder="Start writing your post..."
                            onChange={handleEditorChange}
                        />

                        {/* References preview */}
                        {references.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                                    Referenced Inner Thoughts ({references.length})
                                </h3>
                                <div className="space-y-3">
                                    {references.map((ref) => (
                                        <blockquote
                                            key={ref.id}
                                            className="pl-4 border-l-4 border-[#1a1f36] dark:border-blue-400 bg-[#1a1f36]/5 dark:bg-blue-900/10 py-3 pr-4 rounded-r-lg italic text-gray-700 dark:text-gray-300"
                                        >
                                            &ldquo;{ref.bodyText}&rdquo;
                                            <footer className="mt-2 text-xs text-gray-500 not-italic">
                                                — Inner thought from {dayjs(ref.createdAt).format('MMM D, YYYY')}
                                            </footer>
                                        </blockquote>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default SplitViewEditor

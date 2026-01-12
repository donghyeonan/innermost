'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TiptapEditor } from './TiptapEditor'
import { ReferencePanel } from './ReferencePanel'
import { Save, Eye, Send, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
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

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return

        setSaving(true)
        try {
            const res = await fetch(`/api/outer-posts/${postId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                toast.success('Post deleted')
                router.push('/outer')
            } else {
                toast.error('Failed to delete post')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete')
        } finally {
            setSaving(false)
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
        <div className="h-screen flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/outer')}
                        className="p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-full transition-colors"
                        type="button"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <span
                            className={`text-[10px] tracking-widest uppercase font-semibold px-2 py-1 rounded-full ${status === 'PUBLISHED'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            {status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </span>
                        {lastSaved && (
                            <span className="text-xs text-gray-400 font-sans">
                                Saved {dayjs(lastSaved).format('h:mm A')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors mr-2"
                        title="Delete Post"
                        type="button"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={() => setShowReferences(!showReferences)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${showReferences
                            ? 'border-gray-900 text-gray-900 bg-transparent'
                            : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'
                            }`}
                        type="button"
                    >
                        References
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !postId}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-50 rounded-lg disabled:opacity-50"
                        type="button"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing || !postId || !title || !bodyText}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-[#111] hover:bg-black text-white rounded-full shadow-sm disabled:opacity-50 transition-transform active:scale-95"
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
                    <aside className="w-[320px] flex-shrink-0 overflow-hidden border-r border-gray-100 bg-[#F8F9FA]">
                        <ReferencePanel
                            references={references}
                            onAddReference={handleAddReference}
                            onRemoveReference={handleRemoveReference}
                        />
                    </aside>
                )}

                {/* Editor area - PURE WHITE CANVAS */}
                <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                    <div className="max-w-3xl mx-auto py-16 px-8">
                        {/* Title input - EDITORIAL SERIF */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Post Title"
                            className="w-full text-5xl font-serif font-bold text-[#111] bg-transparent border-none outline-none mb-6 placeholder:text-gray-200"
                        />

                        {/* Editor Canvas */}
                        <div className="min-h-[200px] mb-12">
                            <TiptapEditor
                                contentJson={contentJson}
                                placeholder="Tell your story..."
                                onChange={handleEditorChange}
                                className="font-sans text-lg text-[#111] leading-relaxed"
                            />
                        </div>

                        {/* References Preview - DARK BLOCKS */}
                        {references.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-6">
                                    Referenced Inner Thoughts
                                </h3>
                                <div className="space-y-4">
                                    {references.map((ref) => (
                                        <blockquote
                                            key={ref.id}
                                            className="relative bg-[#0a0f1a] text-white p-6 rounded-lg shadow-xl"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-lg opacity-50"></div>
                                            <p className="font-serif text-lg leading-relaxed opacity-90 italic mb-4">
                                                &ldquo;{ref.bodyText}&rdquo;
                                            </p>
                                            <footer className="flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-3 mt-2">
                                                <span className="font-sans uppercase tracking-wider opacity-70">Inner Reflection</span>
                                                <span className="font-mono opacity-50">{dayjs(ref.createdAt).format('MMM D, YYYY')}</span>
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

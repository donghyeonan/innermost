'use client'

import { useState, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { MAX_ENTRY_LENGTH } from '@/lib/validations'

const DRAFT_KEY = 'innermost_draft'

interface QuickCaptureProps {
    onEntryCreated: () => void
    serverToday: string
}

export function QuickCapture({ onEntryCreated, serverToday }: QuickCaptureProps) {
    const [text, setText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load draft from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) {
            setText(saved)
        }
    }, [])

    // Save draft to localStorage on change
    useEffect(() => {
        if (text) {
            localStorage.setItem(DRAFT_KEY, text)
        } else {
            localStorage.removeItem(DRAFT_KEY)
        }
    }, [text])

    const handleSubmit = useCallback(async () => {
        if (!text.trim() || isSubmitting) return

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/inner-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text.trim() }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create entry')
            }

            // Clear draft
            setText('')
            localStorage.removeItem(DRAFT_KEY)

            // Check if date changed (midnight transition)
            if (data.serverToday !== serverToday) {
                toast.info('Date changed - entry saved to today\'s log', {
                    description: `Your entry was saved to ${data.serverToday}`,
                })
            } else {
                toast.success('Entry added')
            }

            onEntryCreated()
        } catch (error) {
            toast.error('Failed to save entry', {
                description: error instanceof Error ? error.message : 'Please try again',
            })
        } finally {
            setIsSubmitting(false)
        }
    }, [text, isSubmitting, serverToday, onEntryCreated])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Enter to submit (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
        // Shift + Enter does default (new line)
    }

    const charCount = text.length
    const isOverLimit = charCount > MAX_ENTRY_LENGTH
    const isValid = text.trim().length > 0 && !isOverLimit

    return (
        <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Quick Capture
                </span>
            </div>

            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind? Capture a thought..."
                className="min-h-[100px] bg-transparent border-none resize-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                disabled={isSubmitting}
            />

            <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {charCount.toLocaleString()} / {MAX_ENTRY_LENGTH.toLocaleString()}
                </span>

                <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting}
                    size="sm"
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {isSubmitting ? 'Adding...' : 'Add Entry'}
                </Button>
            </div>
        </Card>
    )
}

'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useState } from 'react'
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

interface TiptapEditorProps {
    content?: string
    contentJson?: object | null
    placeholder?: string
    onChange?: (data: { html: string; json: object; text: string }) => void
    editable?: boolean
    className?: string
}

export function TiptapEditor({
    content = '',
    contentJson,
    placeholder = 'Start writing...',
    onChange,
    editable = true,
    className = '',
}: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full mx-auto',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline decoration-blue-200 hover:decoration-blue-400 transition-colors',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: contentJson || content,
        editable,
        editorProps: {
            attributes: {
                class: 'prose prose-lg prose-neutral max-w-none focus:outline-none min-h-[300px] font-sans text-gray-900',
            },
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange({
                    html: editor.getHTML(),
                    json: editor.getJSON(),
                    text: editor.getText(),
                })
            }
        },
        // Prevent SSR hydration mismatch
        immediatelyRender: false,
    })

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const addImage = useCallback(() => {
        if (!editor) return
        const url = window.prompt('Image URL')

        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }, [editor])

    if (!editor) {
        return (
            <div className={`animate-pulse bg-gray-50 rounded-lg h-[300px] ${className}`} />
        )
    }

    return (
        <div className={`relative ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-6 pb-4 border-b border-gray-100 flex-wrap sticky top-0 bg-white/80 backdrop-blur-sm z-10 transition-all">
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </button>
                <div className="w-px h-5 bg-gray-200 mx-2" />
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Bold"
                >
                    <Bold size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Italic"
                >
                    <Italic size={18} />
                </button>
                <div className="w-px h-5 bg-gray-200 mx-2" />
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Bullet List"
                >
                    <List size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Numbered List"
                >
                    <ListOrdered size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Quote"
                >
                    <Quote size={18} />
                </button>
                <div className="w-px h-5 bg-gray-200 mx-2" />
                <button
                    onClick={setLink}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${editor.isActive('link') ? 'bg-gray-100 text-black' : 'text-gray-500'}`}
                    type="button"
                    title="Add Link"
                >
                    <LinkIcon size={18} />
                </button>
                <button
                    onClick={addImage}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    type="button"
                    title="Add Image"
                >
                    <ImageIcon size={18} />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    )
}

export default TiptapEditor

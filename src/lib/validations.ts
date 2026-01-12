import { z } from 'zod'

// Max character limit for inner entries
export const MAX_ENTRY_LENGTH = 5000

// Entry text validation
export const entryTextSchema = z
    .string()
    .min(1, 'Entry cannot be empty')
    .max(MAX_ENTRY_LENGTH, `Entry cannot exceed ${MAX_ENTRY_LENGTH} characters`)
    .transform((text) => text.trim())

// Auth schemas
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim()

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
})

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
})

// View preference
export const viewPreferenceSchema = z.enum(['list', 'grid'])

export const updateUserSchema = z.object({
    viewPreference: viewPreferenceSchema.optional(),
})

// Date validation
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')

export const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)')

// Types
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

// === Phase 2: Outer Post Validations ===

// Reserved usernames that cannot be used for public routing
export const RESERVED_USERNAMES = [
    'login',
    'register',
    'logout',
    'api',
    'dashboard',
    'settings',
    'admin',
    'public',
    'inner',
    'outer',
    'notes',
    'about',
    'work',
    'home',
    '_next',
    'favicon.ico',
]

// Outer post title validation
export const outerTitleSchema = z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .transform((text) => text.trim())

// Outer post slug validation
export const outerSlugSchema = z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')

// Outer post excerpt validation
export const outerExcerptSchema = z
    .string()
    .max(300, 'Excerpt cannot exceed 300 characters')
    .optional()

// Create outer post schema (draft)
export const createOuterPostSchema = z.object({
    title: outerTitleSchema.optional(), // Optional for initial draft
    bodyText: z.string().optional().default(''),
    contentJson: z.any().optional(), // Tiptap JSON
})

// Update outer post schema
export const updateOuterPostSchema = z.object({
    title: outerTitleSchema.optional(),
    bodyText: z.string().optional(),
    contentJson: z.any().optional(),
    contentHtml: z.string().optional(),
    excerpt: outerExcerptSchema,
    slug: outerSlugSchema.optional(),
    coverImage: z.string().url().optional().nullable(),
    isFeatured: z.boolean().optional(),
    gridSize: z.enum(['1x1', '2x2']).optional().nullable(),
    references: z.array(z.object({
        id: z.string(),
        bodyText: z.string(),
        createdAt: z.string(),
        citedAt: z.string(),
    })).max(10, 'Maximum 10 references allowed').optional(),
})

// Publish outer post schema
export const publishOuterPostSchema = z.object({
    title: outerTitleSchema, // Required for publish
    bodyText: z.string().min(1, 'Content is required'),
})

// Types
export type CreateOuterPostInput = z.infer<typeof createOuterPostSchema>
export type UpdateOuterPostInput = z.infer<typeof updateOuterPostSchema>
export type PublishOuterPostInput = z.infer<typeof publishOuterPostSchema>

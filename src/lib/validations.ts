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

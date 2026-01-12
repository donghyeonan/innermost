/**
 * Utility functions for URL slug generation
 */

/**
 * Convert a string to a URL-safe slug
 * @param text - The text to convert (typically a title)
 * @returns URL-safe slug
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        // Replace Korean/non-ASCII with empty (URL-safe approach)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        // Replace spaces and special chars with hyphens
        .replace(/[^a-z0-9]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '')
        // Collapse multiple hyphens
        .replace(/-+/g, '-')
        // Limit length
        .slice(0, 100)
}

/**
 * Generate a unique slug by appending a suffix if needed
 * @param baseSlug - The base slug to check
 * @param existingSlugs - Set of existing slugs to check against
 * @returns Unique slug
 */
export function makeSlugUnique(baseSlug: string, existingSlugs: Set<string>): string {
    if (!existingSlugs.has(baseSlug)) {
        return baseSlug
    }

    let suffix = 2
    let uniqueSlug = `${baseSlug}-${suffix}`
    while (existingSlugs.has(uniqueSlug)) {
        suffix++
        uniqueSlug = `${baseSlug}-${suffix}`
    }
    return uniqueSlug
}

/**
 * Calculate reading time in minutes
 * @param text - The text content
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns Reading time in minutes (minimum 1)
 */
export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
    const wordCount = text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length

    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return Math.max(1, minutes)
}

/**
 * Generate excerpt from text
 * @param text - The full text
 * @param maxLength - Maximum excerpt length (default: 160)
 * @returns Truncated excerpt
 */
export function generateExcerpt(text: string, maxLength = 160): string {
    const plainText = text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()

    if (plainText.length <= maxLength) {
        return plainText
    }

    // Find last space before maxLength to avoid cutting words
    const truncated = plainText.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')

    if (lastSpace > maxLength * 0.7) {
        return truncated.slice(0, lastSpace) + '...'
    }

    return truncated + '...'
}

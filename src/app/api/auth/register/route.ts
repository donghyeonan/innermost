import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, setAuthCookies } from '@/lib/auth'
import { registerSchema, RESERVED_USERNAMES } from '@/lib/validations'

export const runtime = 'nodejs'

/**
 * Generate username from email prefix
 */
function generateUsername(email: string): string {
    const prefix = email.split('@')[0]
    const sanitized = prefix.toLowerCase().replace(/[^a-z0-9]/g, '_')
    return sanitized.replace(/_+/g, '_').replace(/^_|_$/g, '') || 'user'
}

/**
 * Ensure username is unique
 */
async function getUniqueUsername(baseUsername: string): Promise<string> {
    // Check if base is available
    const existing = await prisma.user.findUnique({
        where: { username: baseUsername },
        select: { id: true },
    })

    if (!existing && !RESERVED_USERNAMES.includes(baseUsername)) {
        return baseUsername
    }

    // Add suffix until unique
    let suffix = 1
    let username = `${baseUsername}${suffix}`
    while (true) {
        const check = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        })
        if (!check && !RESERVED_USERNAMES.includes(username)) {
            return username
        }
        suffix++
        username = `${baseUsername}${suffix}`
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const result = registerSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten() },
                { status: 400 }
            )
        }

        const { email, password } = result.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            )
        }

        // Hash password and generate username
        const passwordHash = await hashPassword(password)
        const baseUsername = generateUsername(email)
        const username = await getUniqueUsername(baseUsername)

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                username,
            },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
            },
        })

        // Set authentication cookies
        await setAuthCookies(user.id, user.email)

        return NextResponse.json(
            {
                message: 'Registration successful',
                user,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

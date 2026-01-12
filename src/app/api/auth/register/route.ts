import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, setAuthCookies } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export const runtime = 'nodejs'

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

        // Hash password and create user
        const passwordHash = await hashPassword(password)

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
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

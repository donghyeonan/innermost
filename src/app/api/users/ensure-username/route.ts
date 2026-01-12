import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
    try {
        const payload = await getCurrentUser()

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                username: true,
                email: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // If user already has username, return it
        if (user.username) {
            return NextResponse.json({ user })
        }

        // Generate username from email or unknown
        let baseName = user.email.split('@')[0]
        // Remove special chars
        baseName = baseName.replace(/[^a-zA-Z0-9]/g, '')

        if (baseName.length < 3) {
            baseName = `user${user.id.substring(0, 5)}`
        }

        let username = baseName
        let counter = 1

        // Ensure uniqueness
        while (true) {
            const existing = await prisma.user.findUnique({
                where: { username },
            })
            if (!existing) break
            username = `${baseName}${counter}`
            counter++
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { username },
        })

        return NextResponse.json({ user: updatedUser })

    } catch (error) {
        console.error('Ensure username error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

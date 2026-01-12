import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clearAuthCookies, validateCSRF } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        // Validate CSRF
        if (!validateCSRF(request)) {
            return NextResponse.json(
                { error: 'CSRF validation failed' },
                { status: 403 }
            )
        }

        // Clear authentication cookies
        await clearAuthCookies()

        return NextResponse.json({
            message: 'Logged out successfully',
        })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

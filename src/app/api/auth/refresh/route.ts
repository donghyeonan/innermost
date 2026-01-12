import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, setAuthCookies, REFRESH_TOKEN_COOKIE, validateCSRF } from '@/lib/auth'

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

        const cookieStore = await cookies()
        const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            )
        }

        // Verify refresh token
        const payload = await verifyToken(refreshToken)

        if (!payload || payload.type !== 'refresh') {
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            )
        }

        // Issue new tokens
        await setAuthCookies(payload.userId, payload.email)

        return NextResponse.json({
            message: 'Token refreshed successfully',
        })
    } catch (error) {
        console.error('Refresh error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

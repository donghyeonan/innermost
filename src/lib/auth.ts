import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const SALT_ROUNDS = 12
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production')

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '14d'

// Cookie names
export const ACCESS_TOKEN_COOKIE = 'access_token'
export const REFRESH_TOKEN_COOKIE = 'refresh_token'

export interface JWTPayload {
    userId: string
    email: string
    type: 'access' | 'refresh'
    [key: string]: unknown
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

/**
 * Generate an access token
 */
export async function generateAccessToken(userId: string, email: string): Promise<string> {
    return new SignJWT({ userId, email, type: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(JWT_SECRET)
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(userId: string, email: string): Promise<string> {
    return new SignJWT({ userId, email, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(JWT_SECRET)
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as unknown as JWTPayload
    } catch {
        return null
    }
}

/**
 * Set authentication cookies
 */
export async function setAuthCookies(userId: string, email: string): Promise<void> {
    const cookieStore = await cookies()
    const accessToken = await generateAccessToken(userId, email)
    const refreshToken = await generateRefreshToken(userId, email)

    const isProduction = process.env.NODE_ENV === 'production'

    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60, // 15 minutes
    })

    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 14 * 24 * 60 * 60, // 14 days
    })
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
    const cookieStore = await cookies()

    cookieStore.delete(ACCESS_TOKEN_COOKIE)
    cookieStore.delete(REFRESH_TOKEN_COOKIE)
}

/**
 * Get the current user from the access token cookie
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

    if (!accessToken) {
        return null
    }

    const payload = await verifyToken(accessToken)

    if (!payload || payload.type !== 'access') {
        return null
    }

    return payload
}

/**
 * Validate CSRF by checking Origin or Referer header
 * Used for state-changing requests (refresh, logout)
 */
export function validateCSRF(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')

    // In development, be more lenient
    if (process.env.NODE_ENV !== 'production') {
        return true
    }

    const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'http://localhost:3000',
    ].filter(Boolean)

    // Check Origin header first
    if (origin) {
        return allowedOrigins.some(allowed => origin.startsWith(allowed as string))
    }

    // Fall back to Referer header
    if (referer) {
        return allowedOrigins.some(allowed => referer.startsWith(allowed as string))
    }

    return false
}

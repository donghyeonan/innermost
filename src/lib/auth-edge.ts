import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production')

export interface JWTPayload {
    userId: string
    email: string
    type: 'access' | 'refresh'
}

/**
 * Verify access token for middleware (Edge Runtime compatible)
 * Only uses jose, no bcrypt or other Node.js-specific modules
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const data = payload as unknown as JWTPayload

        // Only accept access tokens
        if (data.type !== 'access') {
            return null
        }

        return data
    } catch {
        return null
    }
}

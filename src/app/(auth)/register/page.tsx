'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            toast.success('Account created!', {
                description: 'Welcome to your private workspace',
            })
            router.push('/dashboard')
        } catch (error) {
            toast.error('Registration failed', {
                description: error instanceof Error ? error.message : 'Please try again',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Header */}
            <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
                <Link href="/" className="font-serif text-xl md:text-2xl font-bold tracking-tight">
                    Innermost
                </Link>
                <Link
                    href="/"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Back to home
                </Link>
            </header>

            {/* Main Form */}
            <main className="flex flex-col items-center justify-center px-6 py-16 md:py-24 lg:py-32">
                <div className="w-full max-w-md">
                    {/* Title */}
                    <div className="text-center mb-10 md:mb-12">
                        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
                            Create your
                            <br />
                            Innermost
                        </h1>
                        <p className="mt-4 text-gray-400">
                            Start your private memo workspace
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label
                                htmlFor="email"
                                className="text-sm text-gray-500"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full bg-transparent border-b border-gray-800 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors disabled:opacity-50"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="text-sm text-gray-500"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={8}
                                className="w-full bg-transparent border-b border-gray-800 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors disabled:opacity-50"
                                placeholder="At least 8 characters"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="confirmPassword"
                                className="text-sm text-gray-500"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full bg-transparent border-b border-gray-800 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors disabled:opacity-50"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-8 py-3 bg-white text-black text-sm tracking-widest font-medium hover:bg-gray-100 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    {/* Footer Link */}
                    <div className="mt-8 text-center">
                        <span className="text-gray-500">Already have an account? </span>
                        <Link
                            href="/login"
                            className="text-white hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAccessToken } from '@/lib/auth-edge'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
        redirect('/login')
    }

    const user = await verifyAccessToken(accessToken)

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar user={{ email: user.email }} />
            <main className="lg:pl-64 min-h-screen">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

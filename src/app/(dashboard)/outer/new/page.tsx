import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SplitViewEditor } from '@/components/editor/SplitViewEditor'

export const runtime = 'nodejs'

export default async function NewOuterPostPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    return <SplitViewEditor />
}

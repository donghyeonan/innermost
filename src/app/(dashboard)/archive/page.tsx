'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/Calendar'
import { Calendar as CalendarIcon } from 'lucide-react'
import { dayjs, SERVER_TZ } from '@/lib/date'

interface MonthMeta {
    date: string
    count: number
}

export default function ArchivePage() {
    const router = useRouter()
    const [currentMonth, setCurrentMonth] = useState(() =>
        dayjs().tz(SERVER_TZ).format('YYYY-MM')
    )
    const [monthMeta, setMonthMeta] = useState<MonthMeta[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch month metadata
    useEffect(() => {
        const fetchMonthMeta = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/inner-entries/month-meta?month=${currentMonth}`)
                if (response.ok) {
                    const data = await response.json()
                    setMonthMeta(data.meta)
                }
            } catch (error) {
                console.error('Failed to fetch month meta:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchMonthMeta()
    }, [currentMonth])

    const handleDateSelect = (date: string) => {
        router.push(`/archive/${date}`)
    }

    const totalEntries = monthMeta.reduce((sum, m) => sum + m.count, 0)

    return (
        <div className="max-w-4xl mx-auto pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-card">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold">Private Archive</h1>
                    <p className="text-sm text-muted-foreground">
                        {totalEntries} entries in {dayjs(currentMonth).format('MMMM YYYY')}
                    </p>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <Calendar
                    onDateSelect={handleDateSelect}
                    monthMeta={monthMeta}
                />
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { dayjs, SERVER_TZ } from '@/lib/date'

interface CalendarProps {
    selectedDate?: string
    onDateSelect: (date: string) => void
    monthMeta?: { date: string; count: number }[]
    mini?: boolean
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function Calendar({
    selectedDate,
    onDateSelect,
    monthMeta = [],
    mini = false
}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(() => dayjs().tz(SERVER_TZ))

    // Create a map of date -> count for quick lookup
    const countMap = new Map(monthMeta.map(m => [m.date, m.count]))

    const startOfMonth = currentMonth.startOf('month')
    const endOfMonth = currentMonth.endOf('month')
    const startDay = startOfMonth.day() // 0 = Sunday
    const daysInMonth = endOfMonth.date()

    const today = dayjs().tz(SERVER_TZ).format('YYYY-MM-DD')

    // Generate calendar grid
    const days: (number | null)[] = []
    for (let i = 0; i < startDay; i++) {
        days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    const navigateMonth = (delta: number) => {
        setCurrentMonth(currentMonth.add(delta, 'month'))
    }

    const goToToday = () => {
        const now = dayjs().tz(SERVER_TZ)
        setCurrentMonth(now)
        onDateSelect(now.format('YYYY-MM-DD'))
    }

    const getDateString = (day: number) => {
        return currentMonth.date(day).format('YYYY-MM-DD')
    }

    return (
        <div className={cn('bg-background', mini ? 'p-2' : 'p-6')}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className={cn('font-semibold', mini ? 'text-sm' : 'text-xl')}>
                    {currentMonth.format('MMMM YYYY')}
                </h2>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateMonth(-1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateMonth(1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day, i) => (
                    <div
                        key={i}
                        className={cn(
                            'text-center text-muted-foreground',
                            mini ? 'text-xs py-1' : 'text-sm py-2'
                        )}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                    if (day === null) {
                        return <div key={i} className={mini ? 'h-8' : 'h-20'} />
                    }

                    const dateStr = getDateString(day)
                    const count = countMap.get(dateStr) || 0
                    const isSelected = dateStr === selectedDate
                    const isToday = dateStr === today
                    const isFuture = dateStr > today

                    return (
                        <button
                            key={i}
                            onClick={() => !isFuture && onDateSelect(dateStr)}
                            disabled={isFuture}
                            className={cn(
                                'relative rounded-lg transition-colors',
                                mini ? 'h-8 w-8 text-sm' : 'h-20 p-2 text-left',
                                'hover:bg-accent/50',
                                isSelected && 'bg-primary text-primary-foreground',
                                isToday && !isSelected && 'bg-accent',
                                isFuture && 'opacity-40 cursor-not-allowed'
                            )}
                        >
                            <span className={cn(
                                mini ? 'block text-center' : 'text-lg font-medium',
                                isSelected && 'text-primary-foreground'
                            )}>
                                {day}
                            </span>

                            {!mini && count > 0 && (
                                <div className={cn(
                                    'mt-1 text-xs',
                                    isSelected ? 'text-primary-foreground/80' : 'text-primary'
                                )}>
                                    📝 {count} {count === 1 ? 'memo' : 'memos'}
                                </div>
                            )}

                            {!mini && count === 0 && !isFuture && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                    ✏️ 0 memos
                                </div>
                            )}

                            {mini && count > 0 && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Go to today button */}
            {!mini && (
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        📅 Go to Today
                    </Button>
                </div>
            )}
        </div>
    )
}

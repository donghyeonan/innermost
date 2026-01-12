import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const SERVER_TZ = 'Asia/Seoul'

/**
 * Get server timestamp with synchronized createdAt and dayKey
 * This ensures both values are calculated from the same moment
 */
export const getServerTimestamp = () => {
  const now = new Date()
  return {
    now,
    createdAt: now,
    dayKey: dayjs(now).tz(SERVER_TZ).format('YYYY-MM-DD'),
    serverNow: dayjs(now).tz(SERVER_TZ).toISOString(),
  }
}

/**
 * Get today's date key in Asia/Seoul timezone
 */
export const getServerToday = () => {
  return dayjs().tz(SERVER_TZ).format('YYYY-MM-DD')
}

/**
 * Format a date for display
 */
export const formatDate = (date: Date | string) => {
  return dayjs(date).tz(SERVER_TZ).format('YYYY-MM-DD')
}

/**
 * Format time for display (HH:mm)
 */
export const formatTime = (date: Date | string) => {
  return dayjs(date).tz(SERVER_TZ).format('HH:mm')
}

/**
 * Format full datetime for display
 */
export const formatDateTime = (date: Date | string) => {
  return dayjs(date).tz(SERVER_TZ).format('YYYY-MM-DD HH:mm')
}

/**
 * Get the start and end dates of a month
 */
export const getMonthRange = (yearMonth: string) => {
  const start = dayjs(yearMonth, 'YYYY-MM').tz(SERVER_TZ).startOf('month')
  const end = start.endOf('month')
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  }
}

/**
 * Check if a date is today in Asia/Seoul timezone
 */
export const isToday = (date: Date | string) => {
  return formatDate(date) === getServerToday()
}

/**
 * Get a nice display format for dates
 */
export const getDisplayDate = (date: Date | string) => {
  const d = dayjs(date).tz(SERVER_TZ)
  return d.format('dddd, MMM D')
}

export { dayjs }

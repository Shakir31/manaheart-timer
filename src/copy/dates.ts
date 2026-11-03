import { dayKey } from '../engine'

const timeFormatters = new Map<string, Intl.DateTimeFormat>()

/** "6:30 am" in the given time zone. */
export function formatTime(instant: string | Date, timeZone: string): string {
  let f = timeFormatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone })
    timeFormatters.set(timeZone, f)
  }
  return f.format(typeof instant === 'string' ? new Date(instant) : instant).replace(/\s?([AP])M$/i, (_, p: string) => ` ${p.toLowerCase()}m`)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

/** "Today, 6:30 am", "Yesterday, 9:10 pm", "Sun, 2:00 pm", "3 Nov, 2:00 pm". */
export function formatSessionWhen(endedAt: string, now: Date, timeZone: string): string {
  const day = dayKey(endedAt, timeZone)
  const diff = dayDiff(day, dayKey(now, timeZone))
  const time = formatTime(endedAt, timeZone)
  if (diff === 0) return `Today, ${time}`
  if (diff === 1) return `Yesterday, ${time}`
  const date = new Date(`${day}T00:00:00Z`)
  if (diff > 1 && diff < 7) return `${WEEKDAYS[date.getUTCDay()]}, ${time}`
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${time}`
}

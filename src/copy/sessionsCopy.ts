// Grouping and wording for the Sessions history.
import { dayKey, formatDuration } from '../engine'
import type { SessionRecord } from '../data/types'
import { formatTime } from './dates'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const CATEGORY_NAME = { meditation: 'Meditation', study: 'Study' } as const

const toDate = (key: string) => new Date(`${key}T00:00:00Z`)
const diffDays = (from: string, to: string) => Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000)

/** "Tue 3 Nov" for a YYYY-MM-DD key. */
export function shortDay(key: string): string {
  const d = toDate(key)
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** "Today · Tue 3 Nov", "Yesterday · Mon 2 Nov", "Sun 1 Nov". */
export function dayHeading(key: string, todayKey: string): string {
  const diff = diffDays(key, todayKey)
  if (diff === 0) return `Today · ${shortDay(key)}`
  if (diff === 1) return `Yesterday · ${shortDay(key)}`
  return shortDay(key)
}

/** "today", "yesterday", "Sun 1 Nov": for sentences. */
function dayInSentence(key: string, todayKey: string): string {
  const diff = diffDays(key, todayKey)
  return diff === 0 ? 'today' : diff === 1 ? 'yesterday' : shortDay(key)
}

export interface DayGroup {
  date: string
  heading: string
  totalMinutes: number
  /** Newest first. */
  sessions: SessionRecord[]
}

/** Sessions grouped by local day, newest day first, newest session first (SessionRow spec). */
export function groupByDay(sessions: readonly SessionRecord[], now: Date, timeZone: string): DayGroup[] {
  const today = dayKey(now, timeZone)
  const byDay = new Map<string, SessionRecord[]>()
  for (const s of [...sessions].sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt))) {
    const key = dayKey(s.endedAt, timeZone)
    const list = byDay.get(key)
    if (list) list.push(s)
    else byDay.set(key, [s])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, list]) => ({
      date,
      heading: dayHeading(date, today),
      totalMinutes: list.reduce((sum, s) => sum + s.durationMinutes, 0),
      sessions: list,
    }))
}

export interface WeekSummary {
  totalMinutes: number
  meditationMinutes: number
  studyMinutes: number
}

/** Totals for the last seven local days, today included (matches the rhythm week). */
export function weekSummary(sessions: readonly SessionRecord[], now: Date, timeZone: string): WeekSummary {
  const today = dayKey(now, timeZone)
  const out: WeekSummary = { totalMinutes: 0, meditationMinutes: 0, studyMinutes: 0 }
  for (const s of sessions) {
    const diff = diffDays(dayKey(s.endedAt, timeZone), today)
    if (diff < 0 || diff > 6) continue
    out.totalMinutes += s.durationMinutes
    if (s.category === 'meditation') out.meditationMinutes += s.durationMinutes
    else out.studyMinutes += s.durationMinutes
  }
  return out
}

/** Edit sheet subtitle: "Today · ended 6:30 pm". */
export function endedLine(s: SessionRecord, now: Date, timeZone: string): string {
  const when = dayInSentence(dayKey(s.endedAt, timeZone), dayKey(now, timeZone))
  const day = when === 'today' ? 'Today' : when === 'yesterday' ? 'Yesterday' : when
  return `${day} · ended ${formatTime(s.endedAt, timeZone)}`
}

/** ConfirmDialog body: names exactly what is lost (ConfirmDialog spec). */
export function deleteSentence(s: SessionRecord, now: Date, timeZone: string): string {
  const when = dayInSentence(dayKey(s.endedAt, timeZone), dayKey(now, timeZone))
  return `${formatDuration(s.durationMinutes)} of ${CATEGORY_NAME[s.category]} from ${when} will be removed, and the heart will lose that mana. This can't be undone.`
}

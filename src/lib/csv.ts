import { dayKey } from '../engine'
import type { SessionRecord } from '../data/types'

const timeFormatters = new Map<string, Intl.DateTimeFormat>()
function localTime(iso: string, timeZone: string): string {
  let f = timeFormatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone })
    timeFormatters.set(timeZone, f)
  }
  return f.format(new Date(iso))
}

/** Quote when needed, and defuse spreadsheet formulas (a note starting with "=" etc.). */
function cell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Every session as CSV, oldest first, in the user's local time. */
export function sessionsToCsv(sessions: readonly SessionRecord[], timeZone: string): string {
  const rows = [...sessions]
    .sort((a, b) => Date.parse(a.endedAt) - Date.parse(b.endedAt))
    .map((s) => [
      dayKey(s.endedAt, timeZone),
      localTime(s.endedAt, timeZone),
      s.category,
      s.durationMinutes,
      s.note ?? '',
      s.source,
    ].map(cell).join(','))
  return ['date,ended_at,category,minutes,note,source', ...rows].join('\r\n') + '\r\n'
}

/** Ask the browser to save a text file. */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

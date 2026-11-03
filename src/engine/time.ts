// Calendar-day helpers. Days are always the user's local days, keyed YYYY-MM-DD.

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    formatters.set(timeZone, f)
  }
  return f
}

/** The local calendar day (YYYY-MM-DD) of an instant in the given IANA time zone. */
export function dayKey(instant: string | Date, timeZone: string): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant
  const parts = formatterFor(timeZone).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

const MS_PER_DAY = 86_400_000

function dayToUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function utcMsToDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((dayToUtcMs(b) - dayToUtcMs(a)) / MS_PER_DAY)
}

export function addDays(key: string, n: number): string {
  return utcMsToDay(dayToUtcMs(key) + n * MS_PER_DAY)
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(key: string): number {
  return (new Date(dayToUtcMs(key)).getUTCDay() + 6) % 7
}

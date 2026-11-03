// Text helpers that follow the design system's voice rules (README › Voice).

/** "45 min", "1h 05m", "6h 40m", "10h" (minutes zero-padded, as in the designs). Never percentages. */
export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest === 0 ? `${h}h` : `${h}h ${String(rest).padStart(2, '0')}m`
}

/** "+45 min" */
export function formatGain(minutes: number): string {
  return `+${formatDuration(minutes)}`
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth'] as const

/** "Fourth" for index 3. */
export function circleOrdinal(index: number): string {
  return ORDINALS[index] ?? `${index + 1}th`
}

/** "Level 2 · Adept" */
export function formatRank(level: number, rank: string | null): string {
  return rank ? `Level ${level} · ${rank}` : ''
}

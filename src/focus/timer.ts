// The focus timer as plain data + pure functions. Elapsed time is always computed from
// timestamps, never counted, so it stays correct while the tab or phone sleeps.
import type { Category } from '../engine'

export interface TimerSegment {
  category: Category
  ms: number
}

export interface TimerState {
  /** When the session began (ms since epoch). */
  startedAt: number
  /** Category of the running segment. */
  category: Category
  /** When the running segment began. */
  segmentStart: number
  /** Set while paused. */
  pausedAt: number | null
  /** Paused time inside the running segment. */
  pausedMs: number
  /** Segments closed by "Switch focus". */
  segments: TimerSegment[]
}

/** Longest single entry the database accepts (24h). */
export const MAX_ENTRY_MINUTES = 1440

export function startTimer(category: Category, now: number): TimerState {
  return { startedAt: now, category, segmentStart: now, pausedAt: null, pausedMs: 0, segments: [] }
}

export function isPaused(t: TimerState): boolean {
  return t.pausedAt !== null
}

export function pauseTimer(t: TimerState, now: number): TimerState {
  return isPaused(t) ? t : { ...t, pausedAt: now }
}

export function resumeTimer(t: TimerState, now: number): TimerState {
  if (t.pausedAt === null) return t
  return { ...t, pausedAt: null, pausedMs: t.pausedMs + (now - t.pausedAt) }
}

/** Active (unpaused) time of the running segment. */
function segmentMs(t: TimerState, now: number): number {
  const end = t.pausedAt ?? now
  return Math.max(0, end - t.segmentStart - t.pausedMs)
}

export function elapsedMs(t: TimerState, now: number): number {
  return t.segments.reduce((sum, s) => sum + s.ms, 0) + segmentMs(t, now)
}

/** Close the running segment and continue in the other category (keeping pause state). */
export function switchCategory(t: TimerState, now: number): TimerState {
  const closed: TimerSegment = { category: t.category, ms: segmentMs(t, now) }
  return {
    ...t,
    category: t.category === 'meditation' ? 'study' : 'meditation',
    segmentStart: now,
    pausedAt: t.pausedAt === null ? null : now,
    pausedMs: 0,
    segments: [...t.segments, closed],
  }
}

export interface TimerEntry {
  category: Category
  durationMinutes: number
}

/**
 * The entries to save when the session ends: one per category, rounded to whole
 * minutes. Categories that round to 0 are dropped, so a sub-30-second session saves nothing.
 */
export function finishTimer(t: TimerState, now: number): TimerEntry[] {
  const totals = new Map<Category, number>()
  for (const s of [...t.segments, { category: t.category, ms: segmentMs(t, now) }]) {
    totals.set(s.category, (totals.get(s.category) ?? 0) + s.ms)
  }
  const entries: TimerEntry[] = []
  for (const category of ['meditation', 'study'] as const) {
    const minutes = Math.min(MAX_ENTRY_MINUTES, Math.round((totals.get(category) ?? 0) / 60_000))
    if (minutes > 0) entries.push({ category, durationMinutes: minutes })
  }
  return entries
}

/** "24:37" under an hour, "1:04:09" from an hour. */
export function formatClock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Parse a stored timer, rejecting anything malformed. */
export function parseTimer(raw: unknown): TimerState | null {
  if (!raw || typeof raw !== 'object') return null
  const t = raw as Partial<TimerState>
  const isCat = (c: unknown): c is Category => c === 'meditation' || c === 'study'
  const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
  if (!isNum(t.startedAt) || !isNum(t.segmentStart) || !isNum(t.pausedMs) || !isCat(t.category)) return null
  if (t.pausedAt !== null && !isNum(t.pausedAt)) return null
  if (!Array.isArray(t.segments) || !t.segments.every((s) => isCat(s?.category) && isNum(s?.ms))) return null
  return t as TimerState
}

import {
  DEFAULT_CONFIG,
  circleMinutesFor,
  circleRhythmFor,
  rankFor,
  type ProgressionConfig,
} from './config'
import { addDays, dayKey, daysBetween, weekdayOf } from './time'
import type {
  CircleState,
  CondenseEvent,
  HeartState,
  Milestone,
  RhythmDay,
  SessionLog,
} from './types'

export interface ComputeInput {
  sessions: readonly SessionLog[]
  condensations?: readonly CondenseEvent[]
  /** Defaults to the current time. */
  now?: Date
  /** IANA time zone used to decide which calendar day a session belongs to. */
  timeZone: string
  config?: ProgressionConfig
}

interface WorkingCircle {
  minutes: number
  rhythm: number
  formedAt: string | null
  stableAt: string | null
}

const newCircle = (): WorkingCircle => ({ minutes: 0, rhythm: 0, formedAt: null, stableAt: null })

/**
 * Replays every session and condensation in time order and returns the heart's state.
 *
 * The rules:
 * - Time first fills the heart (heartMinutes). Leftover time flows on into the circles.
 * - Each level has up to `circlesPerLevel` circles. Time fills the forming circle; overflow
 *   moves to the next one. Time logged after all circles have formed is kept as reserve
 *   and flows into the next level's circles on condense.
 * - A practice day is a local day whose total reaches practiceDayMinMinutes. It is a
 *   rhythm day if the previous practice day was at most graceDays + 1 days earlier.
 * - Each rhythm day adds one point to the oldest formed-but-unstable circle, or, if there
 *   is none, to the circle currently forming. A circle is stable once it has formed and
 *   holds the required points, so steady practice forms circles that are already stable.
 * - Rhythm days before the heart forms count for nothing (there are no circles yet).
 * - Condensations are always honoured once the heart has formed: the app only lets the
 *   user condense when it is allowed, and a later edit to an old session must not take
 *   back a level the user has already reached.
 */
export function computeHeartState(input: ComputeInput): HeartState {
  const cfg = input.config ?? DEFAULT_CONFIG
  const { timeZone } = input
  const now = input.now ?? new Date()

  const sessions = input.sessions
    .filter((s) => Number.isFinite(s.durationMinutes) && s.durationMinutes > 0)
    .map((s) => ({ ...s, t: Date.parse(s.endedAt) }))
    .sort((a, b) => a.t - b.t || a.id.localeCompare(b.id))
  const condensations = (input.condensations ?? [])
    .map((c) => ({ ...c, t: Date.parse(c.at) }))
    .sort((a, b) => a.t - b.t || a.id.localeCompare(b.id))

  let level = 0
  let heartMinutes = 0
  let circles: WorkingCircle[] = []
  let reserve = 0
  const milestones: Milestone[] = []

  const dayTotals = new Map<string, number>()
  let lastPracticeDay: string | null = null
  let practiceDays = 0
  const totals = { minutes: 0, meditationMinutes: 0, studyMinutes: 0, sessions: 0 }

  const startLevel = (next: number) => {
    level = next
    circles = [newCircle()]
  }

  const markStableIfReady = (c: WorkingCircle, at: string, sessionId: string | null) => {
    if (c.formedAt && !c.stableAt && c.rhythm >= circleRhythmFor(level, cfg)) {
      c.stableAt = at
      milestones.push({ type: 'circle-stable', at, sessionId, level, circle: circles.indexOf(c) })
    }
  }

  const addMinutes = (amount: number, at: string, sessionId: string | null) => {
    let left = amount
    if (level === 0) {
      const take = Math.min(cfg.heartMinutes - heartMinutes, left)
      heartMinutes += take
      left -= take
      if (heartMinutes < cfg.heartMinutes) return
      // Only a session can form the heart, so sessionId is set here.
      milestones.push({ type: 'heart-formed', at, sessionId: sessionId ?? '' })
      startLevel(1)
    }
    const required = circleMinutesFor(level, cfg)
    while (left > 0) {
      const current = circles[circles.length - 1]
      if (current.formedAt) {
        // Every circle of this level has formed.
        reserve += left
        return
      }
      const take = Math.min(required - current.minutes, left)
      current.minutes += take
      left -= take
      if (current.minutes >= required) {
        current.formedAt = at
        const index = circles.length - 1
        milestones.push({ type: 'circle-formed', at, sessionId, level, circle: index })
        markStableIfReady(current, at, sessionId)
        if (circles.length < cfg.circlesPerLevel) circles.push(newCircle())
      }
    }
  }

  const awardRhythm = (at: string, sessionId: string) => {
    if (level === 0) return
    const target =
      circles.find((c) => c.formedAt && !c.stableAt) ?? circles.find((c) => !c.formedAt)
    if (!target) return
    if (target.rhythm < circleRhythmFor(level, cfg)) target.rhythm += 1
    markStableIfReady(target, at, sessionId)
  }

  const condense = (event: { id: string; at: string }) => {
    if (level === 0) return // Nothing to condense before the heart exists.
    const carried = reserve
    reserve = 0
    startLevel(level + 1)
    milestones.push({ type: 'condensed', at: event.at, condenseId: event.id, level })
    if (carried > 0) addMinutes(carried, event.at, null)
  }

  let ci = 0
  for (const s of sessions) {
    while (ci < condensations.length && condensations[ci].t <= s.t) condense(condensations[ci++])

    addMinutes(s.durationMinutes, s.endedAt, s.id)

    totals.minutes += s.durationMinutes
    totals.sessions += 1
    if (s.category === 'meditation') totals.meditationMinutes += s.durationMinutes
    else totals.studyMinutes += s.durationMinutes

    const day = dayKey(s.endedAt, timeZone)
    const before = dayTotals.get(day) ?? 0
    const after = before + s.durationMinutes
    dayTotals.set(day, after)
    if (before < cfg.practiceDayMinMinutes && after >= cfg.practiceDayMinMinutes) {
      practiceDays += 1
      const keepsRhythm =
        lastPracticeDay !== null && daysBetween(lastPracticeDay, day) <= cfg.graceDays + 1
      lastPracticeDay = day
      if (keepsRhythm) awardRhythm(s.endedAt, s.id)
    }
  }
  while (ci < condensations.length) condense(condensations[ci++])

  // Rhythm week: the last seven local days, ending today.
  const today = dayKey(now, timeZone)
  const last7: RhythmDay[] = []
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i)
    last7.push({
      date,
      weekday: weekdayOf(date),
      practiced: (dayTotals.get(date) ?? 0) >= cfg.practiceDayMinMinutes,
      isToday: i === 0,
    })
  }

  const requiredMinutes = level > 0 ? circleMinutesFor(level, cfg) : 0
  const requiredRhythm = level > 0 ? circleRhythmFor(level, cfg) : 0
  const circleStates: CircleState[] = circles.map((c, index) => ({
    index,
    status: !c.formedAt ? 'forming' : c.stableAt ? 'stable' : 'unstable',
    minutes: c.minutes,
    requiredMinutes,
    rhythm: c.rhythm,
    requiredRhythm,
    formedAt: c.formedAt,
    stableAt: c.stableAt,
  }))
  const formedCount = circleStates.filter((c) => c.status !== 'forming').length
  const stableCount = circleStates.filter((c) => c.status === 'stable').length

  return {
    phase: level === 0 ? 'gathering' : 'circles',
    level,
    rank: rankFor(level, cfg),
    heart: { formed: level > 0, minutes: heartMinutes, requiredMinutes: cfg.heartMinutes },
    circles: circleStates,
    formedCount,
    stableCount,
    unstableCount: formedCount - stableCount,
    levelProgress: {
      minutes: circles.reduce((sum, c) => sum + c.minutes, 0),
      requiredMinutes: requiredMinutes * cfg.circlesPerLevel,
    },
    reserveMinutes: reserve,
    canCondense: level > 0 && stableCount === cfg.circlesPerLevel,
    rhythm: { last7, practicedInLast7: last7.filter((d) => d.practiced).length },
    totals: { ...totals, practiceDays },
    milestones,
  }
}

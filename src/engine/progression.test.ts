import { describe, expect, it } from 'vitest'
import { computeHeartState, type ComputeInput } from './progression'
import { formatDuration, formatGain, circleOrdinal, formatRank } from './format'
import type { Category, CondenseEvent, SessionLog } from './types'
import { addDays } from './time'

const TZ = 'UTC'
let nextId = 0

function session(day: string, minutes: number, category: Category = 'meditation', time = '09:00'): SessionLog {
  return { id: `s${nextId++}`, category, durationMinutes: minutes, endedAt: `${day}T${time}:00Z` }
}

/** `count` sessions of `minutes`, one every `every` days starting at `start`. */
function series(start: string, count: number, minutes: number, every = 1): SessionLog[] {
  return Array.from({ length: count }, (_, i) => session(addDays(start, i * every), minutes))
}

function compute(sessions: SessionLog[], extra: Partial<ComputeInput> = {}) {
  const last = sessions.at(-1)?.endedAt ?? '2026-01-01T12:00:00Z'
  return computeHeartState({ sessions, timeZone: TZ, now: new Date(last), ...extra })
}

describe('gathering the heart', () => {
  it('starts empty', () => {
    const s = compute([])
    expect(s.phase).toBe('gathering')
    expect(s.level).toBe(0)
    expect(s.rank).toBeNull()
    expect(s.circles).toEqual([])
    expect(s.heart).toEqual({ formed: false, minutes: 0, requiredMinutes: 300 })
    expect(s.canCondense).toBe(false)
  })

  it('gathers minutes until 5h', () => {
    const s = compute(series('2026-01-01', 6, 30))
    expect(s.phase).toBe('gathering')
    expect(s.heart.minutes).toBe(180)
  })

  it('forms the heart at 5h and carries overflow into the first circle', () => {
    const s = compute([session('2026-01-01', 360)])
    expect(s.phase).toBe('circles')
    expect(s.level).toBe(1)
    expect(s.rank).toBe('Apprentice')
    expect(s.circles).toHaveLength(1)
    expect(s.circles[0]).toMatchObject({ status: 'forming', minutes: 60, requiredMinutes: 120 })
    expect(s.milestones.map((m) => m.type)).toEqual(['heart-formed'])
  })
})

describe('steady practice', () => {
  // 30 min a day: heart on day 10, then one circle every 4 days.
  it('forms circles that are already stable', () => {
    const s = compute(series('2026-01-01', 14, 30))
    expect(s.circles[0]).toMatchObject({ status: 'stable', rhythm: 4 })
    expect(s.circles[1]).toMatchObject({ status: 'forming', minutes: 0 })
  })

  it('reaches five stable circles and can condense', () => {
    const s = compute(series('2026-01-01', 30, 30))
    expect(s.formedCount).toBe(5)
    expect(s.stableCount).toBe(5)
    expect(s.canCondense).toBe(true)
    expect(s.levelProgress).toEqual({ minutes: 600, requiredMinutes: 600 })
  })

  it('reports level progress the way the home screen shows it', () => {
    // Heart (300) + 3 circles (360) + 40 min = 6h 40m into the level's 10h.
    const s = compute([session('2026-01-01', 300 + 400)])
    expect(s.formedCount).toBe(3)
    expect(formatDuration(s.levelProgress.minutes)).toBe('6h 40m')
    expect(formatDuration(s.levelProgress.requiredMinutes)).toBe('10h')
    expect(circleOrdinal(s.circles.at(-1)!.index)).toBe('Fourth')
  })
})

describe('bingeing and sporadic logging', () => {
  it('a binge forms every circle, but none are stable', () => {
    const s = compute([session('2026-01-01', 300 + 600)])
    expect(s.formedCount).toBe(5)
    expect(s.unstableCount).toBe(5)
    expect(s.canCondense).toBe(false)
  })

  it('time logged after all circles form is kept in reserve', () => {
    const s = compute([session('2026-01-01', 300 + 600 + 45)])
    expect(s.reserveMinutes).toBe(45)
  })

  it('later rhythm stabilises the oldest unstable circle first', () => {
    const binge = session('2026-01-01', 900)
    const after4 = compute([binge, ...series('2026-01-02', 4, 10)])
    expect(after4.circles.map((c) => c.status)).toEqual([
      'stable', 'unstable', 'unstable', 'unstable', 'unstable',
    ])
    const after20 = compute([binge, ...series('2026-01-02', 20, 10)])
    expect(after20.canCondense).toBe(true)
    expect(after20.reserveMinutes).toBe(200)
  })

  it('one session every four days forms circles that stay unstable', () => {
    const s = compute(series('2026-01-01', 15, 60, 4))
    expect(s.formedCount).toBe(5)
    expect(s.stableCount).toBe(0)
  })

  it('the grace day: every other day keeps rhythm, every third day does not', () => {
    // 5h heart in one go, then 30-min sessions.
    const everyOther = compute([session('2026-01-01', 300), ...series('2026-01-03', 3, 30, 2)])
    expect(everyOther.circles[0].rhythm).toBe(3)
    const everyThird = compute([session('2026-01-01', 300), ...series('2026-01-04', 3, 30, 3)])
    expect(everyThird.circles[0].rhythm).toBe(0)
  })
})

describe('practice days', () => {
  it('needs 10 minutes in a day, which can come from several sessions', () => {
    const short = compute([session('2026-01-01', 5)])
    expect(short.totals.practiceDays).toBe(0)
    const two = compute([session('2026-01-01', 5), session('2026-01-01', 5, 'study', '18:00')])
    expect(two.totals.practiceDays).toBe(1)
  })

  it('uses the local calendar day, not UTC', () => {
    // 03:00 UTC on 3 Nov is still 2 Nov in New York.
    const s = computeHeartState({
      sessions: [session('2026-11-03', 20, 'meditation', '03:00')],
      timeZone: 'America/New_York',
      now: new Date('2026-11-03T15:00:00Z'),
    })
    const days = s.rhythm.last7
    expect(days.at(-1)).toMatchObject({ date: '2026-11-03', isToday: true, practiced: false })
    expect(days.at(-2)).toMatchObject({ date: '2026-11-02', practiced: true, weekday: 0 })
    expect(s.rhythm.practicedInLast7).toBe(1)
  })

  it('counts minutes by category', () => {
    const s = compute([session('2026-01-01', 20), session('2026-01-01', 45, 'study', '12:00')])
    expect(s.totals).toMatchObject({ minutes: 65, meditationMinutes: 20, studyMinutes: 45, sessions: 2 })
  })
})

describe('condensing', () => {
  const condenseAt = (at: string): CondenseEvent => ({ id: `c-${at}`, at })

  it('levels up the heart and starts a new set of circles', () => {
    const sessions = series('2026-01-01', 30, 30)
    const s = compute(sessions, {
      condensations: [condenseAt('2026-01-30T20:00:00Z')],
      now: new Date('2026-01-30T21:00:00Z'),
    })
    expect(s.level).toBe(2)
    expect(s.rank).toBe('Adept')
    expect(formatRank(s.level, s.rank)).toBe('Level 2 · Adept')
    expect(s.circles).toEqual([expect.objectContaining({ status: 'forming', minutes: 0, requiredMinutes: 180 })])
    expect(s.milestones.at(-1)).toMatchObject({ type: 'condensed', level: 2 })
  })

  it('pours the reserve into the next level', () => {
    const sessions = [session('2026-01-01', 900), ...series('2026-01-02', 20, 10)]
    const s = compute(sessions, { condensations: [condenseAt('2026-01-21T20:00:00Z')] })
    // 200 min reserve: a 180-min circle forms (unstable, no rhythm yet) and 20 min carry on.
    expect(s.circles.map((c) => [c.status, c.minutes])).toEqual([
      ['unstable', 180],
      ['forming', 20],
    ])
    expect(s.reserveMinutes).toBe(0)
  })

  it('ignores a condensation before the heart has formed', () => {
    const s = compute([session('2026-01-02', 30)], { condensations: [condenseAt('2026-01-01T00:00:00Z')] })
    expect(s.level).toBe(0)
  })
})

describe('robustness', () => {
  it('gives the same result whatever order the logs arrive in', () => {
    const sessions = [session('2026-01-01', 900), ...series('2026-01-02', 10, 25)]
    const shuffled = [...sessions].reverse()
    expect(compute(shuffled, { now: new Date('2026-01-12T12:00:00Z') })).toEqual(
      compute(sessions, { now: new Date('2026-01-12T12:00:00Z') }),
    )
  })

  it('ignores zero and invalid durations', () => {
    const s = compute([session('2026-01-01', 0), session('2026-01-01', Number.NaN), session('2026-01-01', 15)])
    expect(s.totals.sessions).toBe(1)
  })
})

describe('format', () => {
  it('follows the voice rules', () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(600)).toBe('10h')
    expect(formatGain(45)).toBe('+45 min')
  })
})

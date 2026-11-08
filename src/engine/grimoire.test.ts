import { describe, expect, it } from 'vitest'
import { grimoirePages } from './grimoire'
import { computeHeartState } from './progression'
import type { CondenseEvent, SessionLog } from './types'

/** Day d of January 2026 (rolls into February past the 31st), 09:00 UTC. */
const day = (d: number) => new Date(Date.UTC(2026, 0, d, 9)).toISOString().replace('.000', '')
const daily = (from: number, count: number): SessionLog[] =>
  Array.from({ length: count }, (_, i) => ({ id: `d${from + i}`, category: 'study', durationMinutes: 30, endedAt: day(from + i) }))

function pages(sessions: SessionLog[], condensations: CondenseEvent[] = []) {
  const heart = computeHeartState({ sessions, condensations, timeZone: 'UTC', now: new Date('2026-02-28T12:00:00Z') })
  return grimoirePages(heart, sessions)
}

describe('grimoirePages', () => {
  it('is empty before the heart forms', () => {
    expect(pages(daily(1, 5))).toEqual([])
  })

  it('writes the Apprentice page as the heart forms and circles follow', () => {
    const [p] = pages(daily(1, 16)) // heart day 10, first circle stable day 14, second forming
    expect(p).toMatchObject({ level: 1, current: true, reachedAt: day(10), heartFormedAt: day(10), minutes: 480, formingCircle: 1, condensedAt: null })
    expect(p.circles).toEqual([{ index: 0, formedAt: day(14), stableAt: day(14) }])
  })

  it('closes a page at condensing and opens the next', () => {
    const before = daily(1, 30)
    const after = daily(31, 2)
    const all = [...before, ...after]
    const ps = pages(all, [{ id: 'c', at: '2026-01-30T20:00:00Z' }])
    expect(ps.map((p) => [p.level, p.current])).toEqual([[1, false], [2, true]])
    expect(ps[0]).toMatchObject({ condensedAt: '2026-01-30T20:00:00Z', minutes: 900, formingCircle: null })
    expect(ps[0].circles).toHaveLength(5)
    expect(ps[1]).toMatchObject({ reachedAt: '2026-01-30T20:00:00Z', minutes: 60, circles: [], formingCircle: 0 })
  })
})

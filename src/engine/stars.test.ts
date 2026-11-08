import { describe, expect, it } from 'vitest'
import { computeHeartState } from './progression'
import { computeConstellation, starDefinitions } from './stars'
import type { Category, CondenseEvent, SessionLog } from './types'

let n = 0
const s = (endedAt: string, minutes: number, category: Category = 'meditation'): SessionLog =>
  ({ id: `s${n++}`, category, durationMinutes: minutes, endedAt })
const day = (d: number, hour = 12) => `2026-01-${String(d).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`

function sky(sessions: SessionLog[], { condensations = [] as CondenseEvent[], now = '2026-02-28T12:00:00Z' } = {}) {
  const heart = computeHeartState({ sessions, condensations, timeZone: 'UTC', now: new Date(now) })
  const c = computeConstellation({ sessions, milestones: heart.milestones, timeZone: 'UTC', now: new Date(now) })
  const star = (id: string) => c.stars.find((x) => x.id === id)!
  return { ...c, star }
}

describe('star definitions', () => {
  it('has the designed shape: ranks, Mind, Lore and Rhythm', () => {
    const defs = starDefinitions()
    expect(defs.filter((d) => d.branch === 'ranks')).toHaveLength(5)
    expect(defs.filter((d) => d.branch === 'mind').map((d) => d.id)).toEqual(
      ['m1', 'm5', 'm10', 'm25', 'm50', 'm100', 'm250', 'firstsit', 'longsit', 'dawnsit'])
    expect(defs.filter((d) => d.branch === 'lore')).toHaveLength(9)
    expect(defs.filter((d) => d.branch === 'rhythm').map((d) => d.id)).toEqual(
      ['d7', 'd30', 'd100', 'run7', 'run21', 'run60', 'returned'])
  })

  it('always lists a parent before its children', () => {
    const seen = new Set<string>()
    for (const d of starDefinitions()) {
      if (d.parent) expect(seen.has(d.parent)).toBe(true)
      seen.add(d.id)
    }
  })
})

describe('a new sky', () => {
  it('lights nothing, and shows the first stars of each branch as next', () => {
    const c = sky([])
    expect(c.stars.filter((x) => x.state === 'lit')).toEqual([])
    expect(c.stars.filter((x) => x.state === 'next').map((x) => x.id).sort()).toEqual(
      ['d7', 'firstsit', 'l1', 'm1', 'rank1', 'run7'].sort())
  })
})

describe('lighting stars', () => {
  it('lights hour milestones when the total crosses them, per category', () => {
    const c = sky([s(day(1), 40), s(day(2), 30), s(day(3), 90, 'study')])
    expect(c.star('m1').litAt).toBe(day(2))
    expect(c.star('m5').state).toBe('next')
    expect(c.star('m5').progress).toEqual({ current: 70, target: 300 })
    expect(c.star('l1').litAt).toBe(day(3))
    expect(c.meditationMinutes).toBe(70)
    expect(c.studyMinutes).toBe(90)
  })

  it('lights first sit, long sit and deep study from single sessions', () => {
    const c = sky([s(day(1), 20), s(day(2), 60), s(day(3), 119, 'study'), s(day(4), 120, 'study')])
    expect(c.star('firstsit').litAt).toBe(day(1))
    expect(c.star('longsit').litAt).toBe(day(2))
    expect(c.star('deepstudy').litAt).toBe(day(4))
  })

  it('uses the local start time for dawn sits and night study', () => {
    // A 30-min sit ending 06:20 began at 05:50: dawn. Study ending 23:30 after 60 min began 22:30.
    const c = sky([s('2026-01-05T06:20:00Z', 30), s('2026-01-06T23:30:00Z', 60, 'study')])
    expect(c.star('dawnsit').litAt).toBe('2026-01-05T06:20:00Z')
    expect(c.star('nightscholar').litAt).toBe('2026-01-06T23:30:00Z')
    const late = sky([s('2026-01-05T07:40:00Z', 30)]) // began 07:10: not dawn
    expect(late.star('dawnsit').litAt).toBeNull()
  })

  it('counts practice days and runs with the rhythm grace day', () => {
    // Every other day for 14 sessions: a 14-day run of practice days (gaps of one day are allowed).
    const c = sky(Array.from({ length: 14 }, (_, i) => s(day(1 + i * 2), 15)))
    expect(c.star('d7').state).toBe('lit')
    expect(c.star('run7').litAt).toBe(day(13))
    expect(c.star('run21').progress).toEqual({ current: 0, target: 21 }) // the run ended long before "now"
  })

  it('lights Returned after more than a week away', () => {
    expect(sky([s(day(1), 15), s(day(8), 15)]).star('returned').litAt).toBeNull()
    expect(sky([s(day(1), 15), s(day(10), 15)]).star('returned').litAt).toBe(day(10))
  })

  it('lights ranks when the heart forms and when it condenses', () => {
    const daily = Array.from({ length: 30 }, (_, i) => s(day(i + 1), 30))
    const c = sky(daily, { condensations: [{ id: 'c1', at: '2026-01-30T20:00:00Z' }] })
    expect(c.star('rank1').litAt).toBe(day(10))
    expect(c.star('rank2').litAt).toBe('2026-01-30T20:00:00Z')
    expect(c.star('rank3').state).toBe('next')
    expect(c.star('rank4').state).toBe('distant')
  })
})

describe('next and distant', () => {
  it('lets side stars sit one step beyond a next star, but not main-branch stars', () => {
    const c = sky([s(day(1), 30)])
    expect(c.star('m1').state).toBe('next')
    expect(c.star('firstsit').state).toBe('lit')
    expect(c.star('m5').state).toBe('distant')
  })
})

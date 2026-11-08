import { describe, expect, it } from 'vitest'
import { computeHeartState, type Milestone, type SessionLog } from '../engine'
import { momentCopy, pendingMoments } from './moments'

const at = (day: number) => `2026-01-${String(day).padStart(2, '0')}T09:00:00Z`
const log = (minutes: number, day: number): SessionLog => ({ id: `s${day}`, category: 'study', durationMinutes: minutes, endedAt: at(day) })
const milestones = (sessions: SessionLog[]) =>
  computeHeartState({ sessions, timeZone: 'UTC', now: new Date(at(28)) }).milestones
const BEFORE = '2025-12-31T00:00:00Z'

describe('pendingMoments', () => {
  it('shows nothing without a watermark, so old accounts do not replay history', () => {
    expect(pendingMoments(milestones([log(900, 1)]), null)).toEqual([])
  })

  it('ignores milestones at or before the watermark', () => {
    expect(pendingMoments(milestones([log(300, 1)]), at(1))).toEqual([])
  })

  it('shows the heart forming', () => {
    expect(pendingMoments(milestones([log(300, 1)]), BEFORE).map((m) => m.kind)).toEqual(['heart-formed'])
  })

  it('collapses a binge into one heart moment and one circles moment', () => {
    const moments = pendingMoments(milestones([log(900, 1)]), BEFORE)
    expect(moments.map((m) => [m.kind, m.count])).toEqual([['heart-formed', 1], ['circle-formed', 5]])
  })

  it('merges a circle that forms already stable into one moment', () => {
    const daily = Array.from({ length: 14 }, (_, i) => log(30, i + 1))
    const moments = pendingMoments(milestones(daily), at(13))
    expect(moments).toEqual([expect.objectContaining({ kind: 'circle-formed', circle: 0, stable: true })])
  })

  it('keeps a later stabilisation separate', () => {
    const sessions = [log(420, 1), ...[2, 3, 4, 5].map((d) => log(10, d))]
    const moments = pendingMoments(milestones(sessions), BEFORE)
    expect(moments.map((m) => m.kind)).toEqual(['heart-formed', 'circle-formed', 'circle-stable'])
  })

  it('skips condensing, which has its own ceremony', () => {
    const condensed: Milestone = { type: 'condensed', at: at(2), condenseId: 'c', level: 2 }
    expect(pendingMoments([condensed], BEFORE)).toEqual([])
  })
})

describe('momentCopy', () => {
  const base = { at: at(1), circle: 0, count: 1, stable: false }

  it('uses the designed words', () => {
    expect(momentCopy({ ...base, kind: 'heart-formed' })).toEqual({
      eyebrow: 'Milestone', title: 'The heart has formed', body: 'Five hours of practice have come together into a heart.',
    })
    expect(momentCopy({ ...base, kind: 'circle-formed' })).toEqual({
      eyebrow: 'Milestone · First circle', title: 'A circle has formed', body: 'The circle still flickers, but it will settle with a steady rhythm.',
    })
    expect(momentCopy({ ...base, kind: 'circle-stable', circle: 2, stable: true })).toEqual({
      eyebrow: 'Milestone · Third circle', title: 'The circle is stable', body: 'The rhythm held, and the circle turns smoothly now.',
    })
  })

  it('never says a steady circle flickers', () => {
    expect(momentCopy({ ...base, kind: 'circle-formed', stable: true }).body).not.toMatch(/flicker/)
  })

  it('speaks in the plural for several circles', () => {
    expect(momentCopy({ ...base, kind: 'circle-formed', count: 5, circle: 4 })).toMatchObject({
      eyebrow: 'Milestone · Five circles', title: 'Circles have formed',
    })
    expect(momentCopy({ ...base, kind: 'circle-stable', count: 2, stable: true }).title).toBe('The circles are stable')
  })
})

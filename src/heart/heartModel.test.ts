import { describe, expect, it } from 'vitest'
import { computeHeartState, type SessionLog } from '../engine'
import { ellipsePerimeter, heartModel, RING_SLOTS, streamTarget } from './heartModel'

const at = (day: number) => `2026-01-${String(day).padStart(2, '0')}T09:00:00Z`
const log = (minutes: number, day = 1): SessionLog => ({ id: `s${day}-${minutes}`, category: 'study', durationMinutes: minutes, endedAt: at(day) })
const state = (sessions: SessionLog[]) =>
  computeHeartState({ sessions, timeZone: 'UTC', now: new Date(at(28)) })

describe('heartModel', () => {
  it('shows gathering sparks before the heart forms', () => {
    const m = heartModel(state([log(100)]))
    expect(m.phase).toBe('gathering')
    expect(m.rings).toEqual([])
    expect(m.label).toMatch(/not formed yet/)
  })

  it('draws no ring for a forming circle with nothing gathered', () => {
    const m = heartModel(state([log(300)]))
    expect(m.phase).toBe('heart')
    expect(m.rings).toEqual([])
    expect(m.label).toBe('Mana heart, no circles yet')
  })

  it('draws a partial arc proportional to the forming circle', () => {
    const m = heartModel(state([log(300 + 60)])) // half of a 120-min circle
    expect(m.rings).toHaveLength(1)
    const ring = m.rings[0]
    expect(ring).toMatchObject({ index: 0, status: 'forming', fraction: 0.5, ...RING_SLOTS[0] })
    expect(ring.arcLength).toBe(Math.round(ellipsePerimeter(90, 30) / 2))
  })

  it('describes mixed circles the way the design does', () => {
    // Binge forms 3 unstable circles; four later rhythm days stabilise the first.
    const sessions = [log(300 + 360 + 40, 1), log(10, 2), log(10, 3), log(10, 4), log(10, 5)]
    const s = state(sessions)
    const m = heartModel(s)
    expect(m.rings.map((r) => r.status)).toEqual(['stable', 'unstable', 'unstable', 'forming'])
    expect(m.label).toBe('Mana heart with three circles: one stable, two unstable, and a fourth circle forming')
  })

  it('says when all circles are stable', () => {
    const daily = Array.from({ length: 14 }, (_, i) => log(30, i + 1))
    expect(heartModel(state(daily)).label).toBe('Mana heart with one circle: stable')
  })

  it('marks level 2+ hearts as dense', () => {
    const s = computeHeartState({
      sessions: Array.from({ length: 30 }, (_, i) => log(30, i + 1)),
      condensations: [{ id: 'c', at: '2026-01-30T20:00:00Z' }],
      timeZone: 'UTC',
      now: new Date('2026-01-31T00:00:00Z'),
    })
    const m = heartModel(s)
    expect(m.dense).toBe(true)
    expect(m.label).toBe('Level 2 mana heart, no circles yet')
  })
})

describe('streamTarget', () => {
  it('points at the forming ring spark, rotated by its tilt', () => {
    const m = heartModel(state([log(300 + 60)])) // first ring forming, tilt -18
    const t = (-18 * Math.PI) / 180
    expect(streamTarget(m)).toEqual([Math.round(200 + 90 * Math.cos(t)), Math.round(200 + 90 * Math.sin(t))])
  })

  it('points at the core when nothing is forming', () => {
    expect(streamTarget(heartModel(state([log(300)])))).toEqual([200, 200])
  })
})

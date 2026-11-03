import { describe, expect, it } from 'vitest'
import {
  elapsedMs, finishTimer, formatClock, isPaused, parseTimer, pauseTimer, resumeTimer,
  startTimer, switchCategory,
} from './timer'

const MIN = 60_000
const T0 = 1_000_000

describe('timer', () => {
  it('counts elapsed time from timestamps', () => {
    const t = startTimer('meditation', T0)
    expect(elapsedMs(t, T0 + 25 * MIN)).toBe(25 * MIN)
  })

  it('excludes paused time', () => {
    let t = startTimer('meditation', T0)
    t = pauseTimer(t, T0 + 10 * MIN)
    expect(isPaused(t)).toBe(true)
    expect(elapsedMs(t, T0 + 50 * MIN)).toBe(10 * MIN) // frozen while paused
    t = resumeTimer(t, T0 + 50 * MIN)
    expect(elapsedMs(t, T0 + 55 * MIN)).toBe(15 * MIN)
  })

  it('ignores double pause and resume', () => {
    const t = pauseTimer(startTimer('study', T0), T0 + MIN)
    expect(pauseTimer(t, T0 + 2 * MIN)).toBe(t)
    const r = resumeTimer(t, T0 + 3 * MIN)
    expect(resumeTimer(r, T0 + 4 * MIN)).toBe(r)
  })

  it('splits time by category when switching focus', () => {
    let t = startTimer('meditation', T0)
    t = switchCategory(t, T0 + 20 * MIN)
    expect(t.category).toBe('study')
    expect(elapsedMs(t, T0 + 50 * MIN)).toBe(50 * MIN)
    expect(finishTimer(t, T0 + 50 * MIN)).toEqual([
      { category: 'meditation', durationMinutes: 20 },
      { category: 'study', durationMinutes: 30 },
    ])
  })

  it('merges segments of the same category', () => {
    let t = startTimer('meditation', T0)
    t = switchCategory(t, T0 + 10 * MIN)
    t = switchCategory(t, T0 + 15 * MIN)
    expect(finishTimer(t, T0 + 25 * MIN)).toEqual([
      { category: 'meditation', durationMinutes: 20 },
      { category: 'study', durationMinutes: 5 },
    ])
  })

  it('keeps the pause when switching while paused', () => {
    let t = pauseTimer(startTimer('meditation', T0), T0 + 10 * MIN)
    t = switchCategory(t, T0 + 30 * MIN)
    expect(isPaused(t)).toBe(true)
    expect(elapsedMs(t, T0 + 40 * MIN)).toBe(10 * MIN)
  })

  it('saves nothing for a very short session', () => {
    expect(finishTimer(startTimer('study', T0), T0 + 20_000)).toEqual([])
  })

  it('caps an entry at 24 hours', () => {
    expect(finishTimer(startTimer('study', T0), T0 + 30 * 60 * MIN)).toEqual([
      { category: 'study', durationMinutes: 1440 },
    ])
  })

  it('formats the clock', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(24 * MIN + 37_000)).toBe('24:37')
    expect(formatClock(64 * MIN + 9_000)).toBe('1:04:09')
  })

  it('parses only valid stored timers', () => {
    const t = switchCategory(startTimer('study', T0), T0 + MIN)
    expect(parseTimer(JSON.parse(JSON.stringify(t)))).toEqual(t)
    expect(parseTimer(null)).toBeNull()
    expect(parseTimer({ ...t, category: 'yoga' })).toBeNull()
    expect(parseTimer({ ...t, segments: [{ category: 'study', ms: 'x' }] })).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import type { SessionRecord } from '../data/types'
import { dayHeading, deleteSentence, endedLine, groupByDay, shortDay, weekSummary } from './sessionsCopy'

const now = new Date('2026-11-03T20:00:00Z') // Tue 3 Nov
const s = (id: string, minutes: number, endedAt: string, category: SessionRecord['category'] = 'study'): SessionRecord => ({
  id, category, durationMinutes: minutes, endedAt, note: null, source: 'manual',
})

describe('day headings', () => {
  it('names today and yesterday, then dates', () => {
    expect(shortDay('2026-11-03')).toBe('Tue 3 Nov')
    expect(dayHeading('2026-11-03', '2026-11-03')).toBe('Today · Tue 3 Nov')
    expect(dayHeading('2026-11-02', '2026-11-03')).toBe('Yesterday · Mon 2 Nov')
    expect(dayHeading('2026-11-01', '2026-11-03')).toBe('Sun 1 Nov')
  })
})

describe('groupByDay', () => {
  it('groups newest day first, newest session first, with day totals', () => {
    const groups = groupByDay([
      s('a', 20, '2026-11-03T07:15:00Z', 'meditation'),
      s('b', 90, '2026-11-02T14:00:00Z'),
      s('c', 45, '2026-11-03T18:30:00Z'),
      s('d', 15, '2026-11-01T22:05:00Z', 'meditation'),
    ], now, 'UTC')
    expect(groups.map((g) => [g.heading, g.totalMinutes, g.sessions.map((x) => x.id)])).toEqual([
      ['Today · Tue 3 Nov', 65, ['c', 'a']],
      ['Yesterday · Mon 2 Nov', 90, ['b']],
      ['Sun 1 Nov', 15, ['d']],
    ])
  })

  it('uses local days', () => {
    // 03:00 UTC on 3 Nov is 2 Nov in New York.
    const groups = groupByDay([s('a', 30, '2026-11-03T03:00:00Z')], now, 'America/New_York')
    expect(groups[0].heading).toBe('Yesterday · Mon 2 Nov')
  })
})

describe('weekSummary', () => {
  it('totals the last seven days by category', () => {
    expect(weekSummary([
      s('a', 60, '2026-11-03T10:00:00Z', 'meditation'),
      s('b', 300, '2026-10-28T10:00:00Z'), // 6 days ago: included
      s('c', 999, '2026-10-27T10:00:00Z'), // 7 days ago: excluded
    ], now, 'UTC')).toEqual({ totalMinutes: 360, meditationMinutes: 60, studyMinutes: 300 })
  })
})

describe('sentences', () => {
  it('describes when a session ended', () => {
    expect(endedLine(s('a', 45, '2026-11-03T18:30:00Z'), now, 'UTC')).toBe('Today · ended 6:30 pm')
    expect(endedLine(s('a', 45, '2026-11-01T14:00:00Z'), now, 'UTC')).toBe('Sun 1 Nov · ended 2:00 pm')
  })

  it('names exactly what deleting loses', () => {
    expect(deleteSentence(s('a', 45, '2026-11-03T18:30:00Z'), now, 'UTC')).toBe(
      "45 min of Study from today will be removed, and the heart will lose that mana. This can't be undone.",
    )
    expect(deleteSentence(s('a', 90, '2026-11-01T18:30:00Z', 'meditation'), now, 'UTC')).toBe(
      "1h 30m of Meditation from Sun 1 Nov will be removed, and the heart will lose that mana. This can't be undone.",
    )
  })
})

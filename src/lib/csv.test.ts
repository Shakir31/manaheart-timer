import { describe, expect, it } from 'vitest'
import type { SessionRecord } from '../data/types'
import { sessionsToCsv } from './csv'

const s = (id: string, endedAt: string, note: string | null = null): SessionRecord => ({
  id, category: 'study', durationMinutes: 45, endedAt, note, source: 'timer',
})

describe('sessionsToCsv', () => {
  it('writes a header and one row per session, oldest first, in local time', () => {
    const csv = sessionsToCsv([s('b', '2026-11-03T18:30:00Z'), s('a', '2026-11-02T03:00:00Z')], 'America/New_York')
    expect(csv.split('\r\n')).toEqual([
      'date,ended_at,category,minutes,note,source',
      '2026-11-01,22:00,study,45,,timer', // EST: US daylight saving ended on 1 Nov
      '2026-11-03,13:30,study,45,,timer',
      '',
    ])
  })

  it('quotes commas, quotes and new lines', () => {
    const csv = sessionsToCsv([s('a', '2026-11-03T10:00:00Z', 'Chapter 4, "recall"\nthen review')], 'UTC')
    expect(csv).toContain('"Chapter 4, ""recall""\nthen review"')
  })

  it('defuses notes that would run as spreadsheet formulas', () => {
    const csv = sessionsToCsv([s('a', '2026-11-03T10:00:00Z', '=HYPERLINK("x")')], 'UTC')
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)
  })
})

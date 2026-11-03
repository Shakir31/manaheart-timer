import { describe, expect, it } from 'vitest'
import { formatSessionWhen, formatTime, formatTimeOfDay } from './dates'

const now = new Date('2026-11-03T12:00:00Z') // Tuesday

describe('dates', () => {
  it('formats times in lower-case am/pm', () => {
    expect(formatTime('2026-11-03T06:30:00Z', 'UTC')).toBe('6:30 am')
    expect(formatTime('2026-11-03T21:10:00Z', 'UTC')).toBe('9:10 pm')
  })

  it('uses the given time zone', () => {
    expect(formatTime('2026-11-03T06:30:00Z', 'Asia/Singapore')).toBe('2:30 pm')
  })

  it('describes the day relative to now', () => {
    expect(formatSessionWhen('2026-11-03T06:30:00Z', now, 'UTC')).toBe('Today, 6:30 am')
    expect(formatSessionWhen('2026-11-02T21:10:00Z', now, 'UTC')).toBe('Yesterday, 9:10 pm')
    expect(formatSessionWhen('2026-11-01T14:00:00Z', now, 'UTC')).toBe('Sun, 2:00 pm')
    expect(formatSessionWhen('2026-10-20T14:00:00Z', now, 'UTC')).toBe('20 Oct, 2:00 pm')
  })
})

describe('formatTimeOfDay', () => {
  it('formats stored reminder times', () => {
    expect(formatTimeOfDay('20:00:00')).toBe('8:00 pm')
    expect(formatTimeOfDay('00:05')).toBe('12:05 am')
    expect(formatTimeOfDay('12:30:00')).toBe('12:30 pm')
    expect(formatTimeOfDay('07:15')).toBe('7:15 am')
  })
})

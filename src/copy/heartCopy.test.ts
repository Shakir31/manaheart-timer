import { describe, expect, it } from 'vitest'
import { computeHeartState, type RhythmDay, type SessionLog } from '../engine'
import { flowTarget, heartMoment, progressInfo, rhythmCount, rhythmLabel, rhythmNote } from './heartCopy'

const at = (day: number) => `2026-01-${String(day).padStart(2, '0')}T09:00:00Z`
const log = (minutes: number, day = 1): SessionLog => ({ id: `s${day}-${minutes}`, category: 'study', durationMinutes: minutes, endedAt: at(day) })
const state = (sessions: SessionLog[]) => computeHeartState({ sessions, timeZone: 'UTC', now: new Date(at(28)) })

describe('progressInfo', () => {
  it('counts toward the heart before formation', () => {
    expect(progressInfo(state([log(250)]))).toEqual({
      label: 'Heart forming', minutes: 250, requiredMinutes: 300, suffix: 'until your heart forms', gathering: true,
    })
  })

  it('counts across the level once circles form', () => {
    expect(progressInfo(state([log(300 + 400)]))).toEqual({
      label: 'Fourth circle forming', minutes: 400, requiredMinutes: 600, gathering: false,
    })
  })

  it('says when all five have formed', () => {
    expect(progressInfo(state([log(900)])).label).toBe('Five circles formed')
  })
})

describe('heartMoment', () => {
  it('covers each stage', () => {
    expect(heartMoment(state([log(10)]))).toBe('Mana is gathering.')
    expect(heartMoment(state([log(300)]))).toBe('The heart has formed, and the first circle is gathering.')
    expect(heartMoment(state([log(900)]))).toBe('Five circles turn around the heart, though they all still waver.')
    // 3 circles; days 2-5 stabilise the first and second gets 0 → two waver.
    const mixed = [log(300 + 360, 1), ...[2, 3, 4, 5].map((d) => log(10, d))]
    expect(heartMoment(state(mixed))).toBe('Three circles turn around the heart, though two still waver.')
  })

  it('names the single wavering circle', () => {
    const sessions = [log(300 + 360, 1), ...Array.from({ length: 8 }, (_, i) => log(10, i + 2))]
    expect(heartMoment(state(sessions))).toBe('Three circles turn around the heart, though the third still wavers.')
  })

  it('invites condensing when all five are stable', () => {
    const daily = Array.from({ length: 30 }, (_, i) => log(30, i + 1))
    expect(heartMoment(state(daily))).toBe('All five circles are steady and ready to condense.')
  })
})

describe('flowTarget', () => {
  it('names where new mana goes', () => {
    expect(flowTarget(state([log(10)]))).toBe('the heart')
    expect(flowTarget(state([log(300 + 400)]))).toBe('the fourth circle')
    expect(flowTarget(state([log(900)]))).toBe("the heart's reserve")
  })
})

const week = (practiced: boolean[]): RhythmDay[] =>
  practiced.map((p, i) => ({ date: `2026-11-0${i + 1}`, weekday: i, practiced: p, isToday: i === 6 }))

describe('rhythm copy', () => {
  it('counts and labels the week', () => {
    const days = week([true, true, false, true, true, false, true])
    expect(rhythmCount(days)).toBe('5 of 7 days')
    expect(rhythmLabel(days)).toBe('Practised on 5 of the last 7 days; missed Wednesday and Saturday')
  })

  it('mentions today when not yet practised', () => {
    expect(rhythmLabel(week([true, false, true, true, false, true, false]))).toBe(
      'Practised on 4 of the last 7 days; missed Tuesday and Friday; today not yet',
    )
  })

  it('notes whether the rhythm was kept', () => {
    expect(rhythmNote(week([true, true, true, true, true, false, true]))).toBe('Rhythm kept · 6 of the last 7 days')
    expect(rhythmNote(week([true, false, false, false, false, false, true]))).toBe('The rhythm starts again · 2 of the last 7 days')
    expect(rhythmNote(week([true, true, false, false, false, false, false]))).toBe(
      'A few more minutes today will keep the rhythm going · 2 of the last 7 days',
    )
  })
})

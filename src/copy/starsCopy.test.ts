import { describe, expect, it } from 'vitest'
import type { Star } from '../engine'
import { DEFAULT_CONFIG } from '../engine'
import { loreFor } from './lore'
import { skyLean, starLabel, starLine, starSheet, starTitle } from './starsCopy'

const star = (over: Partial<Star>): Star => ({
  id: 'm100', branch: 'mind', kind: 'mile', index: 5, parent: 'm50',
  rule: { type: 'hours', category: 'meditation', hours: 100 },
  state: 'next', litAt: null, progress: { current: 62 * 60, target: 6000 }, ...over,
})

describe('star words', () => {
  it('labels and titles follow the design', () => {
    expect(starLabel({ type: 'hours', category: 'study', hours: 25 })).toBe('25h')
    expect(starLabel({ type: 'run', days: 7 })).toBe('7-day run')
    expect(starTitle({ type: 'hours', category: 'meditation', hours: 100 })).toBe('A hundred hours')
    expect(starTitle({ type: 'hours', category: 'meditation', hours: 1 })).toBe('One hour')
    expect(starTitle({ type: 'run', days: 21 })).toBe('A twenty-one-day run')
    expect(starLine({ type: 'hours', category: 'meditation', hours: 100 })).toBe('A hundred hours spent in meditation.')
  })

  it('builds the sheet for a next star, with distance to go and the star before it', () => {
    const parent = star({ id: 'm50', rule: { type: 'hours', category: 'meditation', hours: 50 }, state: 'lit', litAt: '2026-10-02T09:00:00Z' })
    expect(starSheet(star({}), parent, 'UTC')).toEqual({
      eyebrow: 'Mind · Next to light',
      title: 'A hundred hours',
      line: 'A hundred hours spent in meditation.',
      status: 'Lights at 100h of meditation · 38h to go',
      before: 'Before it on this branch: Fifty hours, lit 2 Oct',
    })
  })

  it('says when a lit star lit', () => {
    expect(starSheet(star({ state: 'lit', litAt: '2026-11-02T09:00:00Z' }), null, 'UTC').status).toBe('Lit 2 Nov')
  })

  it('keeps distant stars nameless', () => {
    const sheet = starSheet(star({ state: 'distant' }), null, 'UTC')
    expect(sheet.title).toBe('A distant star')
    expect(sheet.line).toBeNull()
  })
})

describe('skyLean', () => {
  it('describes the balance between Mind and Lore', () => {
    expect(skyLean(0, 0).title).toBe('The sky is still dark.')
    expect(skyLean(62 * 60, 24 * 60).title).toBe('The sky leans toward Mind.')
    expect(skyLean(10, 90).title).toBe('The sky leans toward Lore.')
    expect(skyLean(50, 50)).toMatchObject({ title: 'The sky is in balance.', ratio: 0.5 })
  })
})

describe('lore', () => {
  it('has a passage for every rank, and one for beyond', () => {
    for (let level = 1; level <= DEFAULT_CONFIG.ranks.length; level++) {
      expect(loreFor(level, DEFAULT_CONFIG.ranks).length).toBeGreaterThan(40)
    }
    expect(loreFor(1, DEFAULT_CONFIG.ranks)).toMatch(/^The first light gathers/)
    expect(loreFor(6, DEFAULT_CONFIG.ranks)).toMatch(/^The names end here/)
  })
})

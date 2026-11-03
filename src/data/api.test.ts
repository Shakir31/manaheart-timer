import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase } from '../test/fakeSupabase'

const fake = vi.hoisted(() => ({ current: null as ReturnType<typeof createFakeSupabase> | null }))
vi.mock('../lib/supabase', () => ({
  get supabase() {
    return fake.current!.client
  },
}))

import * as api from './api'

const sessionRow = (i: number) => ({
  id: `id-${i}`,
  category: 'study',
  duration_minutes: 30,
  ended_at: '2026-11-03T09:00:00Z',
  note: null,
  source: 'manual',
})

beforeEach(() => {
  fake.current = createFakeSupabase()
})

describe('sessions', () => {
  it('maps rows to camelCase records', async () => {
    fake.current!.respond('sessions', { data: [{ ...sessionRow(1), note: 'Chapter 3', source: 'timer' }], error: null })
    expect(await api.fetchAllSessions()).toEqual([
      { id: 'id-1', category: 'study', durationMinutes: 30, endedAt: '2026-11-03T09:00:00Z', note: 'Chapter 3', source: 'timer' },
    ])
  })

  it('pages past the 1000-row limit', async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => sessionRow(i))
    const page2 = Array.from({ length: 5 }, (_, i) => sessionRow(1000 + i))
    fake.current!.respond('sessions', { data: page1, error: null }, { data: page2, error: null })
    const all = await api.fetchAllSessions()
    expect(all).toHaveLength(1005)
    const ranges = fake.current!.calls.filter((c) => c.method === 'range').map((c) => c.args)
    expect(ranges).toEqual([[0, 999], [1000, 1999]])
  })

  it('sends snake_case on insert', async () => {
    await api.insertSession({
      id: 'x', category: 'meditation', durationMinutes: 20, endedAt: '2026-11-03T09:00:00Z', note: null, source: 'timer',
    })
    const insert = fake.current!.calls.find((c) => c.method === 'insert')!
    expect(insert.args[0]).toEqual({
      id: 'x', category: 'meditation', duration_minutes: 20, ended_at: '2026-11-03T09:00:00Z', note: null, source: 'timer',
    })
  })

  it('only sends the fields being changed', async () => {
    await api.updateSession('x', { durationMinutes: 50 })
    const update = fake.current!.calls.find((c) => c.method === 'update')!
    expect(update.args[0]).toEqual({ duration_minutes: 50 })
    expect(fake.current!.calls.find((c) => c.method === 'eq')!.args).toEqual(['id', 'x'])
  })

  it('throws Supabase errors', async () => {
    fake.current!.respond('sessions', { data: null, error: new Error('denied') })
    await expect(api.deleteSession('x')).rejects.toThrow('denied')
  })
})

describe('profiles', () => {
  it('maps the profile row', async () => {
    fake.current!.respond('profiles', {
      data: {
        id: 'u1', mage: null, time_zone: 'Asia/Singapore', default_duration_minutes: 25,
        reminder_enabled: false, reminder_time: null, welcome_seen_at: null, milestones_seen_at: null,
      },
      error: null,
    })
    expect(await api.fetchProfile('u1')).toEqual({
      id: 'u1', mage: null, timeZone: 'Asia/Singapore', defaultDurationMinutes: 25,
      reminderEnabled: false, reminderTime: null, welcomeSeenAt: null, milestonesSeenAt: null,
    })
  })

  it('maps a profile patch to columns', async () => {
    await api.updateProfile('u1', { mage: 'arcane', timeZone: 'UTC', milestonesSeenAt: '2026-11-03T00:00:00Z' })
    const update = fake.current!.calls.find((c) => c.method === 'update')!
    expect(update.args[0]).toEqual({ mage: 'arcane', time_zone: 'UTC', milestones_seen_at: '2026-11-03T00:00:00Z' })
  })
})

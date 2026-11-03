import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAuth, withProviders } from '../test/providers'
import type { Profile, SessionRecord } from './types'

vi.mock('./api', () => ({
  fetchAllSessions: vi.fn(),
  fetchCondensations: vi.fn(),
  fetchProfile: vi.fn(),
  insertSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  insertCondensation: vi.fn(),
  updateProfile: vi.fn(),
}))

import * as api from './api'
import { useManaData } from './context'
import { useHeartState } from './useHeartState'

const mocked = vi.mocked(api)
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

const profile: Profile = {
  id: 'user-1', mage: null, timeZone: tz, defaultDurationMinutes: 25, reminderEnabled: false,
  reminderTime: null, welcomeSeenAt: null, milestonesSeenAt: null,
}
const existing: SessionRecord = {
  id: 's1', category: 'study', durationMinutes: 300, endedAt: '2026-11-01T09:00:00Z', note: null, source: 'manual',
}

beforeEach(() => {
  vi.resetAllMocks()
  mocked.fetchAllSessions.mockResolvedValue([existing])
  mocked.fetchCondensations.mockResolvedValue([])
  mocked.fetchProfile.mockResolvedValue(profile)
  mocked.insertSession.mockResolvedValue()
  mocked.updateSession.mockResolvedValue()
  mocked.deleteSession.mockResolvedValue()
  mocked.insertCondensation.mockResolvedValue()
  mocked.updateProfile.mockResolvedValue()
})

async function renderReady() {
  const hook = renderHook(() => ({ data: useManaData(), heart: useHeartState() }), { wrapper: withProviders() })
  await waitFor(() => expect(hook.result.current.data.status).toBe('ready'))
  return hook
}

describe('ManaDataProvider', () => {
  it('stays idle and loads nothing when signed out', () => {
    const { result } = renderHook(() => useManaData(), { wrapper: withProviders(fakeAuth(null)) })
    expect(result.current.status).toBe('idle')
    expect(mocked.fetchAllSessions).not.toHaveBeenCalled()
  })

  it('loads the user data and computes the heart', async () => {
    const { result } = await renderReady()
    expect(result.current.data.sessions).toEqual([existing])
    expect(result.current.heart.heart.formed).toBe(true) // 300 min forms the heart
  })

  it('reports load errors', async () => {
    mocked.fetchAllSessions.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useManaData(), { wrapper: withProviders() })
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('offline')
  })

  it('adds a session optimistically with a trimmed note', async () => {
    const { result } = await renderReady()
    await act(() => result.current.data.addSession({ category: 'meditation', durationMinutes: 45.4, note: '  calm ', source: 'manual' }))
    const added = result.current.data.sessions.at(-1)!
    expect(added).toMatchObject({ category: 'meditation', durationMinutes: 45, note: 'calm', source: 'manual' })
    expect(mocked.insertSession).toHaveBeenCalledWith(added)
  })

  it('rolls back an add that the server rejects', async () => {
    mocked.insertSession.mockRejectedValue(new Error('denied'))
    const { result } = await renderReady()
    await act(async () => {
      await expect(result.current.data.addSession({ category: 'study', durationMinutes: 30, source: 'manual' })).rejects.toThrow('denied')
    })
    expect(result.current.data.sessions).toEqual([existing])
  })

  it('updates and rolls back a failed update', async () => {
    const { result } = await renderReady()
    await act(() => result.current.data.updateSession('s1', { durationMinutes: 200 }))
    expect(result.current.data.sessions[0].durationMinutes).toBe(200)

    mocked.updateSession.mockRejectedValue(new Error('denied'))
    await act(async () => {
      await expect(result.current.data.updateSession('s1', { durationMinutes: 10 })).rejects.toThrow()
    })
    expect(result.current.data.sessions[0].durationMinutes).toBe(200)
  })

  it('deletes and rolls back a failed delete', async () => {
    mocked.deleteSession.mockRejectedValueOnce(new Error('denied'))
    const { result } = await renderReady()
    await act(async () => {
      await expect(result.current.data.deleteSession('s1')).rejects.toThrow()
    })
    expect(result.current.data.sessions).toHaveLength(1)
    await act(() => result.current.data.deleteSession('s1'))
    expect(result.current.data.sessions).toHaveLength(0)
  })

  it('records a condensation', async () => {
    const { result } = await renderReady()
    await act(() => result.current.data.condense())
    expect(result.current.data.condensations).toHaveLength(1)
    expect(mocked.insertCondensation).toHaveBeenCalledOnce()
  })

  it('syncs the browser time zone to the profile when it differs', async () => {
    mocked.fetchProfile.mockResolvedValue({ ...profile, timeZone: 'Pacific/Fiji' === tz ? 'UTC' : 'Pacific/Fiji' })
    const { result } = await renderReady()
    expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { timeZone: tz })
    await waitFor(() => expect(result.current.data.profile?.timeZone).toBe(tz))
  })
})

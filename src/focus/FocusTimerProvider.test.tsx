import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import { fakeAuth } from '../test/providers'
import { useFocusTimer } from './context'
import { FocusTimerProvider } from './FocusTimerProvider'

const T0 = new Date('2026-11-03T10:00:00Z').getTime()
const wrapper = (userId: string | null = 'user-1') =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={fakeAuth(userId)}>
        <FocusTimerProvider>{children}</FocusTimerProvider>
      </AuthContext.Provider>
    )
  }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(T0)
})
afterEach(() => vi.useRealTimers())

describe('FocusTimerProvider', () => {
  it('starts with the last category and remembers the switch', () => {
    const { result } = renderHook(() => useFocusTimer(), { wrapper: wrapper() })
    expect(result.current.lastCategory).toBe('meditation')
    act(() => result.current.start('study'))
    expect(result.current.timer?.category).toBe('study')
    expect(result.current.lastCategory).toBe('study')
  })

  it('survives a reload', () => {
    const first = renderHook(() => useFocusTimer(), { wrapper: wrapper() })
    act(() => first.result.current.start('meditation'))
    first.unmount()

    vi.setSystemTime(T0 + 25 * 60_000)
    const second = renderHook(() => useFocusTimer(), { wrapper: wrapper() })
    expect(second.result.current.timer?.startedAt).toBe(T0)
    expect(second.result.current.entriesNow()).toEqual([{ category: 'meditation', durationMinutes: 25 }])
  })

  it('keeps timers separate per user', () => {
    const a = renderHook(() => useFocusTimer(), { wrapper: wrapper('user-a') })
    act(() => a.result.current.start())
    const b = renderHook(() => useFocusTimer(), { wrapper: wrapper('user-b') })
    expect(b.result.current.timer).toBeNull()
  })

  it('pauses, resumes and clears', () => {
    const { result } = renderHook(() => useFocusTimer(), { wrapper: wrapper() })
    act(() => result.current.start('study'))
    vi.setSystemTime(T0 + 10 * 60_000)
    act(() => result.current.pause())
    vi.setSystemTime(T0 + 40 * 60_000)
    act(() => result.current.resume())
    vi.setSystemTime(T0 + 45 * 60_000)
    expect(result.current.entriesNow()).toEqual([{ category: 'study', durationMinutes: 15 }])
    act(() => result.current.clear())
    expect(result.current.timer).toBeNull()
    expect(localStorage.getItem('manaheart.timer.user-1')).toBeNull()
  })
})

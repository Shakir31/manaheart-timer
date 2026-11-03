import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Category } from '../engine'
import { useAuth } from '../auth/context'
import { readJson, writeJson } from '../lib/storage'
import { FocusTimerContext, type FocusTimerValue } from './context'
import {
  finishTimer, parseTimer, pauseTimer, resumeTimer, startTimer, switchCategory as switchTimer,
  type TimerState,
} from './timer'

const timerKey = (userId: string) => `manaheart.timer.${userId}`
const LAST_CATEGORY_KEY = 'manaheart.lastCategory'

/**
 * Holds the running focus session. Saved to localStorage on every change, per user,
 * so a reload, closed tab or sleeping phone resumes exactly where it was.
 */
export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  return (
    <FocusTimerStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </FocusTimerStore>
  )
}

function FocusTimerStore({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [timer, setTimerState] = useState<TimerState | null>(() =>
    userId ? parseTimer(readJson(timerKey(userId))) : null,
  )
  const [lastCategory, setLastCategory] = useState<Category>(() =>
    readJson(LAST_CATEGORY_KEY) === 'study' ? 'study' : 'meditation',
  )

  const setTimer = useCallback((next: TimerState | null) => {
    setTimerState(next)
    if (userId) writeJson(timerKey(userId), next)
    if (next) {
      setLastCategory(next.category)
      writeJson(LAST_CATEGORY_KEY, next.category)
    }
  }, [userId])

  const value = useMemo<FocusTimerValue>(() => ({
    timer,
    lastCategory,
    start: (category = lastCategory) => setTimer(startTimer(category, Date.now())),
    pause: () => timer && setTimer(pauseTimer(timer, Date.now())),
    resume: () => timer && setTimer(resumeTimer(timer, Date.now())),
    switchCategory: () => timer && setTimer(switchTimer(timer, Date.now())),
    entriesNow: () => (timer ? finishTimer(timer, Date.now()) : []),
    clear: () => setTimer(null),
  }), [timer, lastCategory, setTimer])

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>
}

import { createContext, useContext } from 'react'
import type { Category } from '../engine'
import type { TimerEntry, TimerState } from './timer'

export interface FocusTimerValue {
  timer: TimerState | null
  /** Category for the next session (the last one used). */
  lastCategory: Category
  start(category?: Category): void
  pause(): void
  resume(): void
  switchCategory(): void
  /** The entries to save if the session ended now (does not clear the timer). */
  entriesNow(): TimerEntry[]
  /** Forget the running timer (after saving, or to discard it). */
  clear(): void
}

export const FocusTimerContext = createContext<FocusTimerValue | null>(null)

export function useFocusTimer(): FocusTimerValue {
  const value = useContext(FocusTimerContext)
  if (!value) throw new Error('useFocusTimer must be used inside <FocusTimerProvider>')
  return value
}

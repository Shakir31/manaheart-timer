import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import type { Category } from '../engine'
import { flowTarget } from '../copy/heartCopy'
import { useManaData } from '../data/context'
import { useHeartState } from '../data/useHeartState'
import type { SessionSource } from '../data/types'

/** What the Session complete screen needs (passed as router state). */
export interface CompleteState {
  gainMinutes: number
  categories: Category[]
  /** Where the mana went, worked out before saving: "the fourth circle". */
  target: string
}

export interface RecordEntry {
  category: Category
  durationMinutes: number
}

/**
 * Saves one or more entries, then opens Session complete. Shared by the focus timer and
 * Log manually. Throws if saving fails, so the caller can keep its state and show the error.
 */
export function useRecordSessions() {
  const { addSession } = useManaData()
  const heart = useHeartState()
  const navigate = useNavigate()

  return useCallback(
    async (entries: RecordEntry[], source: SessionSource, note?: string) => {
      const target = flowTarget(heart)
      for (const e of entries) {
        await addSession({ ...e, source, note: note ?? null })
      }
      const state: CompleteState = {
        gainMinutes: entries.reduce((sum, e) => sum + e.durationMinutes, 0),
        categories: entries.map((e) => e.category),
        target,
      }
      navigate('/complete', { replace: source === 'timer', state })
    },
    [addSession, heart, navigate],
  )
}

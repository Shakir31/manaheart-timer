import { useMemo } from 'react'
import { computeHeartState, type HeartState } from '../engine'
import { useManaData } from './context'
import { useNow } from './useNow'

/** The heart, computed from the user's logs. The single source of truth for progress UI. */
export function useHeartState(): HeartState {
  const { sessions, condensations, timeZone } = useManaData()
  const now = useNow()
  return useMemo(
    () => computeHeartState({ sessions, condensations, timeZone, now }),
    [sessions, condensations, timeZone, now],
  )
}

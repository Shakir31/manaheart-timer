import { useEffect, useMemo, useState } from 'react'
import { computeHeartState, type HeartState } from '../engine'
import { useManaData } from './context'

/** Current time, refreshed every minute and whenever the app comes back into view. */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, intervalMs)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
  return now
}

/** The heart, computed from the user's logs. The single source of truth for progress UI. */
export function useHeartState(): HeartState {
  const { sessions, condensations, timeZone } = useManaData()
  const now = useNow()
  return useMemo(
    () => computeHeartState({ sessions, condensations, timeZone, now }),
    [sessions, condensations, timeZone, now],
  )
}

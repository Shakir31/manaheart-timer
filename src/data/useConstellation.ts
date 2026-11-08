import { useMemo } from 'react'
import { computeConstellation, grimoirePages, type Constellation, type GrimoirePage } from '../engine'
import { useManaData } from './context'
import { useHeartState } from './useHeartState'
import { useNow } from './useNow'

/** The sky, computed from the user's logs (never stored). */
export function useConstellation(): Constellation {
  const { sessions, timeZone } = useManaData()
  const heart = useHeartState()
  const now = useNow()
  return useMemo(
    () => computeConstellation({ sessions, milestones: heart.milestones, timeZone, now }),
    [sessions, heart.milestones, timeZone, now],
  )
}

/** Grimoire pages, one per level reached. */
export function useGrimoire(): GrimoirePage[] {
  const { sessions } = useManaData()
  const heart = useHeartState()
  return useMemo(() => grimoirePages(heart, sessions), [heart, sessions])
}

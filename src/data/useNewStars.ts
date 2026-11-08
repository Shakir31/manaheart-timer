import { useEffect } from 'react'
import type { Star } from '../engine'
import { useAuth } from '../auth/context'
import { markSkySeen, readSkySeen, useSkySeen } from './skySeen'
import { useConstellation } from './useConstellation'

/**
 * Stars lit since the sky was last opened on this device. With no mark yet (first run),
 * the mark starts now, so an existing history doesn't all count as new.
 */
export function useNewStars(): Star[] {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const seenAt = useSkySeen(userId)
  const sky = useConstellation()

  useEffect(() => {
    if (userId && !readSkySeen(userId)) markSkySeen(userId)
  }, [userId])

  if (!seenAt) return []
  const mark = Date.parse(seenAt)
  return sky.stars.filter((s) => s.litAt && Date.parse(s.litAt) > mark)
}

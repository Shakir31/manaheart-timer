import { useEffect, useMemo, useRef, useState } from 'react'
import { pendingMoments, type Moment } from '../copy/moments'
import { useManaData } from '../data/context'
import { useHeartState } from '../data/useHeartState'

export interface MomentsValue {
  /** The milestone to show now, if any. */
  current: Moment | null
  dismiss(): void
  /** The first circle has formed and no mage path has been chosen. */
  needsMage: boolean
}

/**
 * The queue of full-screen milestones. The "seen" watermark is written only when the
 * whole queue has been dismissed, so moments sharing a timestamp can't skip each other.
 */
export function useMoments(): MomentsValue {
  const { profile, updateProfile } = useManaData()
  const heart = useHeartState()
  const seenAt = profile?.milestonesSeenAt ?? null
  const queue = useMemo(() => pendingMoments(heart.milestones, seenAt), [heart.milestones, seenAt])
  const [index, setIndex] = useState(0)

  // First run: start the watermark now, so existing accounts don't replay their history.
  const baselined = useRef(false)
  useEffect(() => {
    if (!profile || seenAt || baselined.current) return
    baselined.current = true
    updateProfile({ milestonesSeenAt: new Date().toISOString() }).catch(() => {})
  }, [profile, seenAt, updateProfile])

  const dismiss = () => {
    if (index + 1 < queue.length) {
      setIndex(index + 1)
      return
    }
    setIndex(0)
    const last = queue.at(-1)
    if (last) updateProfile({ milestonesSeenAt: last.at }).catch(() => {})
  }

  return {
    current: queue[index] ?? null,
    dismiss,
    needsMage: !!profile && !profile.mage && (heart.formedCount > 0 || heart.level >= 2),
  }
}

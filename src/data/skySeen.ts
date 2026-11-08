// When the user last looked at the Constellation (per device). Stars lit after this mark
// are "new": they glow once on the sky and put a dot on the Constellation tab.
import { useSyncExternalStore } from 'react'
import { readJson, writeJson } from '../lib/storage'

const listeners = new Set<() => void>()
const keyFor = (userId: string) => `manaheart.skySeenAt.${userId}`

export function readSkySeen(userId: string): string | null {
  const v = readJson(keyFor(userId))
  return typeof v === 'string' ? v : null
}

export function markSkySeen(userId: string, at: Date = new Date()): void {
  writeJson(keyFor(userId), at.toISOString())
  listeners.forEach((l) => l())
}

/** The mark, kept in sync across components (the tab dot clears as soon as the sky opens). */
export function useSkySeen(userId: string | null): string | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => (userId ? readSkySeen(userId) : null),
    () => null,
  )
}

// localStorage that never throws (private mode, blocked storage, full quota).

export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the app still works, the timer just won't survive a reload.
  }
}

/** Everything this device keeps for a user (running timer, sky mark, last category). */
export function forgetUser(userId: string): void {
  for (const key of [`manaheart.timer.${userId}`, `manaheart.skySeenAt.${userId}`, 'manaheart.lastCategory']) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage unavailable: nothing to clear.
    }
  }
}

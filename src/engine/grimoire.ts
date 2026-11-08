// The Grimoire: one page per level reached, derived from the heart's milestones.
import type { HeartState, SessionLog } from './types'

export interface GrimoireCircle {
  index: number
  formedAt: string
  stableAt: string | null
}

export interface GrimoirePage {
  level: number
  reachedAt: string
  /** Minutes practised while at this level (level 1 includes the hours that formed the heart). */
  minutes: number
  /** The level the heart is at now. */
  current: boolean
  heartFormedAt: string | null
  circles: GrimoireCircle[]
  condensedAt: string | null
  /** On the current page: the circle now forming, if any. */
  formingCircle: number | null
}

export function grimoirePages(heart: HeartState, sessions: readonly SessionLog[]): GrimoirePage[] {
  if (!heart.heart.formed) return []
  const ms = heart.milestones
  const heartFormed = ms.find((m) => m.type === 'heart-formed')
  if (!heartFormed) return []

  // Level L begins at the heart forming (L = 1) or at the condensation that reached it.
  const starts = new Map<number, string>([[1, heartFormed.at]])
  for (const m of ms) if (m.type === 'condensed') starts.set(m.level, m.at)

  const pages: GrimoirePage[] = []
  for (let level = 1; level <= heart.level; level++) {
    const reachedAt = starts.get(level)
    if (!reachedAt) continue
    const end = starts.get(level + 1) ?? null
    const from = level === 1 ? -Infinity : Date.parse(reachedAt)
    const to = end ? Date.parse(end) : Infinity
    const minutes = sessions.reduce((sum, s) => {
      const t = Date.parse(s.endedAt)
      return t >= from && t < to && s.durationMinutes > 0 ? sum + s.durationMinutes : sum
    }, 0)

    const circles = new Map<number, GrimoireCircle>()
    for (const m of ms) {
      if (m.type === 'circle-formed' && m.level === level) circles.set(m.circle, { index: m.circle, formedAt: m.at, stableAt: null })
      if (m.type === 'circle-stable' && m.level === level) {
        const c = circles.get(m.circle)
        if (c) c.stableAt = m.at
      }
    }

    const current = level === heart.level
    const forming = current ? heart.circles.find((c) => c.status === 'forming') : undefined
    pages.push({
      level,
      reachedAt,
      minutes,
      current,
      heartFormedAt: level === 1 ? heartFormed.at : null,
      circles: [...circles.values()].sort((a, b) => a.index - b.index),
      condensedAt: end,
      formingCircle: forming ? forming.index : null,
    })
  }
  return pages
}

// Which milestones still need showing, and their words. Pure, so it is unit-tested.
import { circleOrdinal, type Milestone } from '../engine'

export type MomentKind = 'heart-formed' | 'circle-formed' | 'circle-stable'

export interface Moment {
  kind: MomentKind
  at: string
  /** Index of the (latest) circle involved. */
  circle: number
  /** How many circles this moment covers. */
  count: number
  /** A circle that formed already steady. */
  stable: boolean
}

const ORDER: Record<MomentKind, number> = { 'heart-formed': 0, 'circle-formed': 1, 'circle-stable': 2 }

/**
 * Milestones after the watermark, collapsed so a binge or a long absence is at most
 * three screens. Null means no watermark has been set yet: show nothing, so an existing
 * account does not replay its whole history. Condensing has its own ceremony.
 */
export function pendingMoments(milestones: readonly Milestone[], seenAt: string | null): Moment[] {
  if (!seenAt) return []
  const seen = Date.parse(seenAt)
  const fresh = milestones.filter((m) => Date.parse(m.at) > seen)

  const heart = fresh.find((m) => m.type === 'heart-formed')
  const formed = fresh.filter((m) => m.type === 'circle-formed')
  const stable = fresh.filter((m) => m.type === 'circle-stable')
  const lastFormed = formed.at(-1)
  const lastStable = stable.at(-1)
  const merged =
    formed.length === 1 && stable.length === 1 &&
    lastFormed!.at === lastStable!.at && lastFormed!.circle === lastStable!.circle

  const moments: Moment[] = []
  if (heart) moments.push({ kind: 'heart-formed', at: heart.at, circle: 0, count: 1, stable: false })
  if (lastFormed) {
    moments.push({ kind: 'circle-formed', at: lastFormed.at, circle: lastFormed.circle, count: formed.length, stable: merged })
  }
  if (lastStable && !merged) {
    moments.push({ kind: 'circle-stable', at: lastStable.at, circle: lastStable.circle, count: stable.length, stable: true })
  }
  return moments.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || ORDER[a.kind] - ORDER[b.kind])
}

const COUNT = ['', 'One', 'Two', 'Three', 'Four', 'Five']

export interface MomentCopy {
  eyebrow: string
  title: string
  body: string
}

export function momentCopy(m: Moment): MomentCopy {
  if (m.kind === 'heart-formed') {
    return { eyebrow: 'Milestone', title: 'Your heart has formed', body: 'Five hours of practice, gathered into one light.' }
  }
  const eyebrow = m.count > 1
    ? `Milestone · ${COUNT[m.count] ?? m.count} circles`
    : `Milestone · ${circleOrdinal(m.circle)} circle`
  if (m.kind === 'circle-stable') {
    return m.count > 1
      ? { eyebrow, title: 'The circles are stable', body: 'Your rhythm held. They turn clean and even now.' }
      : { eyebrow, title: 'The circle is stable', body: 'Your rhythm held. It turns clean and even now.' }
  }
  if (m.stable) {
    return { eyebrow, title: 'A circle has formed', body: 'Your rhythm carried it. It turns clean and even from the start.' }
  }
  return m.count > 1
    ? { eyebrow, title: 'Circles have formed', body: 'They still flicker. Keep your rhythm and they will steady.' }
    : { eyebrow, title: 'A circle has formed', body: 'It still flickers. Keep your rhythm and it will steady.' }
}

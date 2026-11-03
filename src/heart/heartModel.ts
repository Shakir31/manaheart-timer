// Turns engine state into what the Heart SVG draws. Pure, so it is unit-tested.
// Geometry and palettes come from design/pages/.../source/Heart.dc.html and Motion.md.
import type { CircleStatus, HeartState } from '../engine'

export type HeartVariant = 'mana' | 'elemental' | 'arcane' | 'spirit'

export interface Palette {
  h0: string
  h1: string
  h2: string
  line: string
  alt: string
  rune: string
  core: string
  facet: string
  weak: string
}

export const PALETTES: Record<HeartVariant, Palette> = {
  mana: { h0: '#EAF8FF', h1: '#9FDCFF', h2: '#4C6BFF', line: '#7FD4FF', alt: '#7FD4FF', rune: '#7FD4FF', core: '#F4FBFF', facet: '#DFF4FF', weak: '#7FD4FF' },
  elemental: { h0: '#FFF1D6', h1: '#FFB060', h2: '#C2410C', line: '#FF9A4D', alt: '#FFD27A', rune: '#FFC56B', core: '#FFF4E0', facet: '#FFE3B0', weak: '#FF7A3D' },
  arcane: { h0: '#F0E9FF', h1: '#A98BFF', h2: '#4C3BCF', line: '#A98BFF', alt: '#6FE7F5', rune: '#C9B8FF', core: '#F5F0FF', facet: '#E6DDFF', weak: '#A98BFF' },
  spirit: { h0: '#F2FBF8', h1: '#9FE6D6', h2: '#3C7F8F', line: '#D5DEE8', alt: '#E6EEF5', rune: '#9FE6D6', core: '#F4FBF9', facet: '#E6EEF5', weak: '#D5DEE8' },
}

/** Ring slots, inner to outer: rx, ry, tilt (degrees), rune dash pattern. */
export const RING_SLOTS = [
  { rx: 90, ry: 30, tilt: -18, dash: '1 7 5 7' },
  { rx: 118, ry: 42, tilt: 24, dash: '2 6 2 10' },
  { rx: 142, ry: 54, tilt: -38, dash: '1 9 6 4' },
  { rx: 164, ry: 64, tilt: 58, dash: '4 4 1 11' },
  { rx: 182, ry: 74, tilt: -66, dash: '1 5 1 13' },
] as const

export interface RingSpec {
  index: number
  status: CircleStatus
  rx: number
  ry: number
  tilt: number
  dash: string
  /** 0–1: how much of a forming ring is drawn. 1 for formed rings. */
  fraction: number
  /** Length of the drawn arc for a forming ring, in SVG units. */
  arcLength: number
}

export interface HeartModel {
  phase: 'gathering' | 'heart'
  /** Level 2+: the denser core with the slowly turning dotted ring. */
  dense: boolean
  rings: RingSpec[]
  label: string
}

/** Ramanujan's approximation of an ellipse's perimeter. */
export function ellipsePerimeter(rx: number, ry: number): number {
  return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five']
const ORDINAL_WORDS = ['first', 'second', 'third', 'fourth', 'fifth']
const word = (n: number) => WORDS[n] ?? String(n)

export function heartModel(state: HeartState): HeartModel {
  if (!state.heart.formed) {
    return {
      phase: 'gathering',
      dense: false,
      rings: [],
      label: 'Faint sparks gathering; the heart has not formed yet',
    }
  }

  const rings: RingSpec[] = []
  for (const c of state.circles) {
    const slot = RING_SLOTS[c.index]
    if (!slot) continue
    const fraction = c.status === 'forming' ? Math.min(1, c.minutes / c.requiredMinutes) : 1
    // A forming ring with nothing gathered yet is not drawn.
    if (c.status === 'forming' && fraction <= 0) continue
    rings.push({
      index: c.index,
      status: c.status,
      ...slot,
      fraction,
      arcLength: Math.round(ellipsePerimeter(slot.rx, slot.ry) * fraction),
    })
  }

  return { phase: 'heart', dense: state.level >= 2, rings, label: describe(state) }
}

function describe(state: HeartState): string {
  const { formedCount, stableCount, unstableCount, level } = state
  const prefix = level >= 2 ? `Level ${level} mana heart` : 'Mana heart'
  const forming = state.circles.find((c) => c.status === 'forming' && c.minutes > 0)
  const formingText = forming ? `${ORDINAL_WORDS[forming.index]} circle forming` : ''

  if (formedCount === 0) {
    return forming ? `${prefix}, its ${formingText}` : `${prefix}, no circles yet`
  }
  const circles = `${word(formedCount)} circle${formedCount === 1 ? '' : 's'}`
  const parts: string[] = []
  if (unstableCount === 0) parts.push(formedCount === 1 ? 'stable' : 'all stable')
  else if (stableCount === 0) parts.push(formedCount === 1 ? 'unstable' : 'all unstable')
  else parts.push(`${word(stableCount)} stable`, `${word(unstableCount)} unstable`)
  const detail = parts.join(', ')
  return `${prefix} with ${circles}: ${detail}${formingText ? `, and a ${formingText}` : ''}`
}

/** Where the forming ring's spark sits (its arc starts at angle 0, then the ring is tilted). */
export function streamTarget(model: HeartModel): [number, number] {
  const forming = model.rings.find((r) => r.status === 'forming')
  if (!forming) return [200, 200]
  const t = (forming.tilt * Math.PI) / 180
  return [Math.round(200 + forming.rx * Math.cos(t)), Math.round(200 + forming.rx * Math.sin(t))]
}

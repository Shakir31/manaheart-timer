import type { Mage } from '../data/types'

export interface MagePath {
  id: Mage
  name: string
  /** Short line on the choice card. */
  blurb: string
  /** Confirm screen: what changes. */
  change: string
}

export const MAGES: readonly MagePath[] = [
  {
    id: 'elemental',
    name: 'Elemental',
    blurb: 'Ember rings with living, flowing edges',
    change: 'Your heart and every circle will take on living ember and flame.',
  },
  {
    id: 'arcane',
    name: 'Arcane',
    blurb: 'Precise glyph circles, violet and cyan',
    change: 'Your heart and every circle will take on crisp violet and cyan glyphs.',
  },
  {
    id: 'spirit',
    name: 'Spirit',
    blurb: 'Soft nebula bands that drift and sway',
    change: 'Your heart and every circle will take on soft bands of pale teal and silver.',
  },
]

export const mageName = (id: Mage): string => MAGES.find((m) => m.id === id)!.name

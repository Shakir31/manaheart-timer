// Star positions in the 1000×1000 sky, from design/pages/manaheart-constellation-grimoire/
// source/Sky.dc.html. Labels sit left (l), right (r) or below (b) their star.
export type LabelSide = 'l' | 'r' | 'b'

export const HEART: [number, number] = [500, 500]

export const POSITIONS: Record<string, [number, number, LabelSide]> = {
  rank1: [500, 400, 'r'], rank2: [500, 330, 'r'], rank3: [500, 260, 'r'], rank4: [500, 190, 'r'], rank5: [500, 120, 'r'],
  m1: [360, 370, 'l'], m5: [310, 318, 'l'], m10: [262, 270, 'l'], m25: [215, 222, 'l'], m50: [172, 175, 'l'], m100: [132, 130, 'l'], m250: [95, 88, 'l'],
  firstsit: [300, 425, 'l'], longsit: [178, 322, 'l'], dawnsit: [128, 262, 'l'],
  l1: [640, 370, 'r'], l5: [690, 318, 'r'], l10: [738, 270, 'r'], l25: [785, 222, 'r'], l50: [828, 175, 'r'], l100: [868, 130, 'r'], l250: [905, 88, 'r'],
  deepstudy: [830, 345, 'r'], nightscholar: [905, 262, 'b'],
  d7: [500, 660, 'r'], d30: [455, 745, 'l'], d100: [470, 840, 'l'],
  run7: [585, 710, 'r'], run21: [640, 790, 'r'], run60: [700, 870, 'r'], returned: [365, 790, 'l'],
}

/** Seconds after the heart beats before the glow reaches a point (it travels outward). */
export function glowDelay(x: number, y: number): number {
  return Math.round(Math.hypot(x - HEART[0], y - HEART[1]) * 1.4) / 1000
}

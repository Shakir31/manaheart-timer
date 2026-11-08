// The night sky: the heart at the centre, branches of stars, and labels. The heart beats
// slowly; each beat sends a glow outward along the lines and through the lit stars.
import { useId, type CSSProperties } from 'react'
import type { Star } from '../../engine'
import type { HeartVariant } from '../../heart/heartModel'
import { BRANCH_NAME, starLabel, starTitle } from '../../copy/starsCopy'
import { glowDelay, HEART, POSITIONS } from './skyLayout'
import styles from './Sky.module.css'

const SKY_COLOUR: Record<HeartVariant, string> = {
  mana: 'var(--mana)',
  elemental: 'var(--elemental-ring)',
  arcane: 'var(--arcane-ring)',
  spirit: 'var(--spirit-rune)',
}

const DUST: [number, number, number][] = [
  [140, 560, 1.4], [860, 610, 1.2], [300, 900, 1.5], [760, 80, 1.1], [60, 760, 1.3], [940, 880, 1.2], [250, 40, 1], [620, 960, 1.1],
]

interface Props {
  stars: Star[]
  /** Meditation's share of practice (0–1); the nebula leans toward the stronger branch. */
  ratio: number
  heartFormed: boolean
  variant: HeartVariant
  selected: string | null
  onSelect(id: string): void
  /** Ids of stars lit since the last visit; they glow brighter once. */
  fresh: ReadonlySet<string>
  label: string
  /** False for a look-only sky (the landing page): no tap targets. */
  interactive?: boolean
}

const stateWord = (s: Star) => (s.state === 'lit' ? 'lit' : s.state === 'next' ? 'next to light' : 'distant')

export function Sky({ stars, ratio, heartFormed, variant, selected, onSelect, fresh, label, interactive = true }: Props) {
  const id = useId().replace(/:/g, '')
  const placed = stars.filter((s) => POSITIONS[s.id])
  const byId = new Map(placed.map((s) => [s.id, s]))
  const hasLit = placed.some((s) => s.state === 'lit')

  // Lines: solid between two lit stars, dotted from lit to next. The heart counts as lit.
  const edges = placed.flatMap((s) => {
    const parent = s.parent ? byId.get(s.parent) : null
    const a = parent ? parent.state : 'lit'
    const b = s.state
    const kind = a === 'lit' && b === 'lit' ? 'lit' : (a === 'lit' && b === 'next') || (a === 'next' && b === 'lit') ? 'next' : null
    if (!kind) return []
    const [x1, y1] = parent ? POSITIONS[parent.id] : HEART
    const [x2, y2] = POSITIONS[s.id]
    return [{ key: `${parent?.id ?? 'heart'}-${s.id}`, x1, y1, x2, y2, kind, delay: glowDelay((x1 + x2) / 2, (y1 + y2) / 2) }]
  })

  const nebX = Math.round(500 - (ratio - 0.5) * 2 * 240)
  const nebRx = Math.round(300 + Math.abs(ratio - 0.5) * 300)
  const neb2X = Math.round(500 + (ratio - 0.5) * 2 * 260)
  const neb2Rx = Math.round(220 - Math.abs(ratio - 0.5) * 200)

  return (
    <div className={styles.sky} style={{ '--sky': SKY_COLOUR[variant] } as CSSProperties}>
      <svg viewBox="0 0 1000 1000" role="img" aria-label={label}>
        <defs>
          <radialGradient id={`neb-${id}`}>
            <stop offset="0" style={{ stopColor: 'var(--sky)' }} stopOpacity="0.16" />
            <stop offset="0.55" style={{ stopColor: 'var(--deep-mana)' }} stopOpacity="0.06" />
            <stop offset="1" style={{ stopColor: 'var(--deep-mana)' }} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`halo-${id}`}>
            <stop offset="0" style={{ stopColor: 'var(--core)' }} stopOpacity="0.9" />
            <stop offset="0.3" style={{ stopColor: 'var(--sky)' }} stopOpacity="0.45" />
            <stop offset="1" style={{ stopColor: 'var(--sky)' }} stopOpacity="0" />
          </radialGradient>
          <filter id={`blur-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <ellipse cx={nebX} cy="420" rx={nebRx} ry="360" fill={`url(#neb-${id})`} />
        <ellipse cx={neb2X} cy="380" rx={neb2Rx} ry="260" fill={`url(#neb-${id})`} opacity="0.6" />

        <g className={styles.dust}>
          {DUST.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)}
        </g>

        {/* Lines, and a soft copy of the lit ones that glows outward on each beat. */}
        <g strokeLinecap="round">
          {edges.map((e) => (
            <line
              key={e.key}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              className={e.kind === 'lit' ? styles.edgeLit : styles.edgeNext}
              data-edge={e.kind}
            />
          ))}
        </g>
        <g strokeLinecap="round" filter={`url(#blur-${id})`} aria-hidden="true">
          {edges.filter((e) => e.kind === 'lit').map((e) => (
            <line
              key={e.key}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              className={styles.edgeGlow}
              style={{ animationDelay: `${e.delay}s` }}
            />
          ))}
        </g>

        {/* The heart: a slower, quieter beat than Home's, with a ripple going out. */}
        <circle cx="500" cy="500" r={heartFormed ? 120 : 70} fill={`url(#halo-${id})`} className={styles.heartHalo} />
        <circle cx="500" cy="500" r="20" className={styles.ripple} data-part="ripple" />
        <g className={styles.heartCore} opacity={heartFormed ? 1 : 0.6} data-part="heart">
          {heartFormed && (
            <ellipse transform="rotate(-18 500 500)" cx="500" cy="500" rx="54" ry="18" className={styles.heartRing} />
          )}
          <path d="M500 478 L512 500 L500 522 L488 500 Z" className={styles.heartFacet} />
          <circle cx="500" cy="500" r="8" className={styles.heartDot} />
        </g>

        {placed.map((s) => {
          const [x, y] = POSITIONS[s.id]
          const rank = s.kind === 'rank'
          const r = s.state === 'lit' ? (rank ? 7 : s.kind === 'mile' ? 5.5 : 4.5) : 5
          return (
            <g key={s.id} data-star={s.id} data-state={s.state}>
              {fresh.has(s.id) && <circle cx={x} cy={y} r="48" fill={`url(#halo-${id})`} className={styles.fresh} data-part="fresh" />}
              {s.state === 'lit' && (
                <>
                  <circle
                    cx={x} cy={y} r={rank ? 40 : s.kind === 'mile' ? 28 : 22}
                    fill={`url(#halo-${id})`}
                    className={styles.starHalo}
                    style={{ animationDelay: `${glowDelay(x, y)}s`, opacity: rank ? 0.9 : 0.6 }}
                  />
                  {rank && (
                    <path
                      d={`M${x} ${y - 20} L${x + 3} ${y - 3} L${x + 20} ${y} L${x + 3} ${y + 3} L${x} ${y + 20} L${x - 3} ${y + 3} L${x - 20} ${y} L${x - 3} ${y - 3} Z`}
                      className={styles.spark}
                    />
                  )}
                  <circle cx={x} cy={y} r={r} className={styles.starLit} />
                </>
              )}
              {s.state === 'next' && <circle cx={x} cy={y} r={r} className={styles.starNext} />}
              {s.state === 'distant' && <circle cx={x} cy={y} r="2.4" className={styles.starDistant} style={{ opacity: hasLit ? 0.55 : 0.18 }} />}
              {selected === s.id && <circle cx={x} cy={y} r="24" className={styles.selected} />}
            </g>
          )
        })}

        <text x="140" y="500" className={styles.branch}>Mind</text>
        <text x="860" y="500" className={styles.branch}>Lore</text>
        <text x="560" y="975" className={styles.branch}>Rhythm</text>
      </svg>

      {/* Labels and tap targets are HTML on top of the sky, so they stay crisp and accessible. */}
      <div className={styles.overlay}>
        {placed.map((s) => {
          const [x, y, side] = POSITIONS[s.id]
          const rank = s.kind === 'rank'
          const title = s.state === 'distant' ? 'A distant star' : starTitle(s.rule)
          // Mind and Lore share names ("One hour"), so the branch is part of the accessible name.
          const name = s.branch === 'ranks' ? title : `${title} (${BRANCH_NAME[s.branch]})`
          return (
            <div key={s.id}>
              {s.state !== 'distant' && (
                <span
                  aria-hidden="true"
                  className={[styles.label, styles[`side_${side}`], rank && styles.rankLabel, s.state === 'lit' && styles.labelLit, selected === s.id && styles.labelSelected].filter(Boolean).join(' ')}
                  style={{ left: `${x / 10}%`, top: `${y / 10}%` }}
                >
                  {starLabel(s.rule)}
                </span>
              )}
              {interactive && <button
                type="button"
                className={styles.hit}
                style={{ left: `${x / 10}%`, top: `${y / 10}%` }}
                aria-label={`${name}, ${stateWord(s)}`}
                aria-pressed={selected === s.id}
                onClick={() => onSelect(s.id)}
              />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

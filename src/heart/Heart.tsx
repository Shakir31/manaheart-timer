// The mana heart: core, halo and up to five tilted rings. Drawn from a HeartModel so
// the drawing stays dumb; all decisions live in heartModel.ts.
import { useId } from 'react'
import { PALETTES, streamTarget, type HeartModel, type HeartVariant, type RingSpec } from './heartModel'
import styles from './Heart.module.css'

export interface HeartProps {
  model: HeartModel
  variant?: HeartVariant
  /** CSS width, e.g. "316px" or "100%". */
  size?: string
  /** 0–1 opacity, for decorative backgrounds. */
  dim?: number
  /** Decorative copies are hidden from assistive tech. */
  decorative?: boolean
  /** Ambient twinkling stars around the heart (Home). */
  stars?: boolean
  /** Core pulse speed: normal, slow (focus) or quick (after a gain). */
  pulse?: 'normal' | 'slow' | 'quick'
  /** Condense: rings collapse into a flaring core. */
  collapsing?: boolean
  /** Session complete: streams of mana flow up into the forming ring (or the core). */
  streams?: boolean
}

const SPARKS: [number, number, number, number][] = [
  [120, 150, 1.6, 0], [270, 130, 1.2, -1], [230, 270, 1.8, -2], [150, 250, 1.1, -0.5],
  [200, 195, 2.4, -1.7], [310, 210, 1, -2.4], [90, 215, 1.3, -0.9], [180, 110, 1, -2.9],
  [250, 200, 1.4, -1.3], [175, 220, 1.2, -0.2], [220, 160, 0.9, -2.1], [290, 290, 0.9, -1.1],
  [120, 300, 0.8, -2.6], [205, 230, 1.6, -3.3],
]
const STARS: [number, number, number, number][] = [
  [70, 120, 1.2, 0], [320, 96, 1, -1], [104, 318, 1.3, -2.2], [300, 334, 0.9, -3],
  [250, 60, 0.8, -0.6], [40, 236, 0.9, -2.8],
]
const UNSTABLE_DASH = '34 10 8 16 52 7 14 22 40 12'

export function Heart({
  model, variant = 'mana', size = '100%', dim = 1, decorative, stars, pulse = 'normal', collapsing, streams,
}: HeartProps) {
  const id = useId().replace(/:/g, '')
  const c = PALETTES[variant]
  const dense = model.dense
  const formed = model.rings.filter((r) => r.status !== 'forming').length
  const haloR = dense && model.rings.length === 0 ? 150 : 110 + formed * 5 + (dense ? 10 : 0)
  const coreClass = collapsing ? styles.flare : pulse === 'slow' ? styles.breatheSlow : pulse === 'quick' ? styles.breatheQuick : styles.breathe
  const ringFilter = variant === 'elemental' ? `flame-${id}` : `glow-${id}`

  return (
    <div className={styles.root} style={{ width: size, opacity: dim }}>
      <svg
        viewBox="0 0 400 400"
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : model.label}
      >
        <defs>
          <radialGradient id={`halo-${id}`}>
            <stop offset="0" stopColor={c.h0} stopOpacity="0.85" />
            <stop offset="0.22" stopColor={c.h1} stopOpacity="0.4" />
            <stop offset="0.6" stopColor={c.h2} stopOpacity="0.1" />
            <stop offset="1" stopColor={c.h2} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`nebula-${id}`}>
            <stop offset="0" stopColor={c.line} stopOpacity="0.2" />
            <stop offset="0.5" stopColor={c.h2} stopOpacity="0.08" />
            <stop offset="1" stopColor={c.h2} stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`flame-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="d" /></feMerge>
          </filter>
          <filter id={`soft-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {model.phase === 'gathering' ? (
          <g data-part="gathering">
            <ellipse cx="200" cy="205" rx="150" ry="110" fill={`url(#nebula-${id})`} />
            <g className={styles.gather} fill={c.facet}>
              {SPARKS.map(([x, y, r, d]) => (
                <circle key={`${x}-${y}`} className={styles.twinkle} cx={x} cy={y} r={r} style={{ animationDelay: `${d}s` }} />
              ))}
            </g>
          </g>
        ) : (
          <>
            <circle className={collapsing ? styles.flare : undefined} cx="200" cy="200" r={haloR} fill={`url(#halo-${id})`} />
            <g className={collapsing ? styles.collapse : undefined}>
              <g filter={`url(#${ringFilter})`} fill="none">
                {[...model.rings].reverse().map((r) => (
                  <Ring key={r.index} ring={r} variant={variant} softId={`soft-${id}`} />
                ))}
              </g>
            </g>
            {dense && (
              <g className={styles.spin} fill="none">
                <circle cx="200" cy="200" r="54" stroke={c.facet} strokeWidth="1" strokeDasharray="1 5 3 5" opacity="0.7" />
              </g>
            )}
            <g className={coreClass} filter={`url(#glow-${id})`} fill="none" data-part="core">
              <circle cx="200" cy="200" r={dense ? 36 : 27} stroke={c.h1} strokeWidth="0.8" opacity="0.75" />
              <path d={dense ? 'M200 156 L224 200 L200 244 L176 200 Z' : 'M200 168 L219 200 L200 232 L181 200 Z'} stroke={c.facet} strokeWidth="1.2" />
              {dense && <path d="M156 200 L200 178 L244 200 L200 222 Z" stroke={c.facet} strokeWidth="1" opacity="0.85" />}
              <path d={dense ? 'M176 200 L224 200 M200 156 L200 244' : 'M181 200 L219 200 M200 168 L200 232'} stroke={c.facet} strokeWidth="0.6" opacity="0.6" />
              <circle cx="200" cy="200" r={dense ? 13 : 9} fill={c.core} />
            </g>
          </>
        )}

        {streams && <Streams model={model} />}

        {stars && (
          <g fill="#CFEAFF" aria-hidden="true">
            {STARS.map(([x, y, r, d]) => (
              <circle key={`${x}-${y}`} className={styles.twinkle} cx={x} cy={y} r={r} style={{ animationDelay: `${d}s` }} />
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}

function Ring({ ring, variant, softId }: { ring: RingSpec; variant: HeartVariant; softId: string }) {
  const c = PALETTES[variant]
  const { rx, ry, tilt, index } = ring
  const color = variant === 'arcane' && index % 2 ? c.alt : variant === 'elemental' && index === 0 ? c.alt : c.line

  return (
    <g transform={`rotate(${tilt} 200 200)`} data-ring={index} data-status={ring.status}>
      {variant === 'spirit' && ring.status !== 'forming' && (
        <g className={styles.sway}>
          <ellipse cx="200" cy="200" rx={rx} ry={ry} stroke={c.rune} strokeWidth="10" opacity="0.16" filter={`url(#${softId})`} />
        </g>
      )}
      {ring.status === 'stable' && (
        <>
          <ellipse cx="200" cy="200" rx={rx} ry={ry} stroke={color} strokeWidth="1.1" />
          <ellipse
            className={index % 2 ? styles.flowReverse : styles.flow}
            cx="200" cy="200" rx={rx + 5} ry={ry + 3}
            stroke={c.rune} strokeWidth={variant === 'arcane' ? 1.2 : 2} strokeDasharray={ring.dash} opacity="0.55"
          />
          {variant === 'arcane' && (
            <rect x={197 + rx} y="197" width="6" height="6" transform={`rotate(45 ${200 + rx} 200)`} fill="#070914" stroke={color} strokeWidth="1" />
          )}
        </>
      )}
      {ring.status === 'unstable' && (
        <g className={styles.wobble}>
          <g className={styles.flicker}>
            <ellipse cx="200" cy="200" rx={rx} ry={ry} stroke={c.weak} strokeWidth="1" strokeDasharray={UNSTABLE_DASH} opacity="0.6" />
            <ellipse cx="200" cy="200" rx={rx + 5} ry={ry + 3} stroke={c.weak} strokeWidth="1.6" strokeDasharray="1 13 3 23" opacity="0.35" />
          </g>
        </g>
      )}
      {ring.status === 'forming' && (
        <>
          <ellipse cx="200" cy="200" rx={rx} ry={ry} stroke={color} strokeWidth="0.8" strokeDasharray="1 6" opacity="0.2" />
          <ellipse
            className={`${styles.forming} ${styles.arc}`}
            cx="200" cy="200" rx={rx} ry={ry}
            stroke={color} strokeWidth="1.1" strokeDasharray={`${ring.arcLength} 2000`} strokeLinecap="round"
          />
          <circle className={styles.twinkle} cx={200 + rx} cy="200" r="2.2" fill={c.core} />
        </>
      )}
    </g>
  )
}

function Streams({ model }: { model: HeartModel }) {
  const [x, y] = streamTarget(model)
  const paths: [string, string, number, string, number][] = [
    [`M200 470 C 205 430, ${x - 40} ${y + 50}, ${x} ${y}`, '#CFEAFF', 1.6, '2 10', 1],
    [`M180 470 C 170 420, ${x - 45} ${y + 40}, ${x - 3} ${y + 6}`, '#7FD4FF', 1, '1 11', 0.8],
    [`M222 470 C 240 430, ${x - 20} ${y + 60}, ${x + 3} ${y + 3}`, '#7FD4FF', 1, '1 7 1 15', 0.7],
  ]
  return (
    <g fill="none" aria-hidden="true" data-part="streams">
      {paths.map(([d, stroke, w, dash, op]) => (
        <path key={d} className={styles.stream} d={d} stroke={stroke} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" opacity={op} />
      ))}
    </g>
  )
}

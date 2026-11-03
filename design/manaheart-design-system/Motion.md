# Motion

Slow, continuous, never bouncy. Ambient motion should read as breathing, not activity. Under `prefers-reduced-motion: reduce` every animation stops and the meaning moves into shape, opacity and text.

## The ring language

| State | Look | Motion | Reduced motion |
| --- | --- | --- | --- |
| Stable | Continuous 1.1px line in `mana`, plus a rune layer just outside it (short dashes, 55% opacity) | Runes travel along the ring, linear: odd rings `dur-ring` (40s per loop), even rings `dur-ring-alt` (55s) reversed, so neighbours counter-turn | Runes hold still |
| Unstable | Broken into uneven segments, 60% opacity, sparse runes | Flicker `dur-flicker` (3.4s, stepped, opacity between 1 and 0.3 at uneven points) and wobble ±2.5° with a 2px drift over `dur-wobble` (6.5s, alternate) | Fixed at 60%, still broken. Never more than 3 flashes a second in any mode |
| Forming | Partial arc over a dotted ghost of the full path, a `core` spark at its tip | Shimmers 0.5 → 1 opacity over 2.6s; after a session it extends to its new length over `dur-arc` (1.6s, `ease-grow`) | Appears at its new length at once; no shimmer |

Ring geometry, inner to outer (rx × ry, tilt): 90 × 30 at −18°, 118 × 42 at 24°, 142 × 54 at −38°, 164 × 64 at 58°, 182 × 74 at −66°, in a 400 × 400 box. Tilts never animate.

## The heart

- Idle pulse: core scales 1 → 1.06 and brightens 0.88 → 1 over `dur-pulse` (5s, ease-in-out, alternate).
- Focus session: the background heart dims to 0.3 and slows to 6s.
- After a gain: quickens to 3s for one minute; three dashed streams carry mana up into the forming arc (2.4s loops).
- Reduced motion: static at full brightness; the timer or text carries the state.

## Surfaces

| Surface | Enter | Exit | Reduced motion |
| --- | --- | --- | --- |
| Bottom sheet | Slide up from 100% over `dur-sheet` (360ms, `ease-enter`); scrim fades in over 240ms | 240ms ease-in; drag past 30% to dismiss | 120ms crossfade, no slide |
| Modal and dialog | Fade + scale 0.97 → 1 over `dur-modal` (280ms, `ease-enter`) | 180ms | 120ms fade |
| Toast | Rise 12px + fade, 240ms; stays 4s | Fade 240ms | Fade only |

## Moments

- Milestones: eyebrow fades in, the title rises 12px over 1.2s (`ease-enter`), the heart shows the new state. Held until tapped.
- Condense: rings shrink into the core over `dur-collapse` (2.7s, `ease-collapse`), the core flares to 1.5× for 0.7s, then Level up fades in over 600ms. Reduced motion: rings fade out over 400ms, then the Level 2 heart appears still.

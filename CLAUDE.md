# Manaheart

A quiet meditation and study logger. Logged time forms a mana heart, then up to five circles
around it; daily rhythm makes circles stable; five stable circles condense into the next level.
Low interaction by design: log, see the heart, leave. Do not add game mechanics (points,
streak flames, badges, currencies) that the design does not show.

## Stack and commands

React 19 + TypeScript (strict) + Vite. Supabase for auth and data (Phase 2). Vitest for tests.
Web app first; later wrapped with Capacitor for Android/iOS.

- `npm run dev`: dev server
- `npm test`: engine tests (run after any change in `src/engine`)
- `npm run build`: type-check + production build
- `npm run lint`: oxlint

## Working rules

- **Tests ship with every feature.** Engine and pure helpers get unit tests; hooks and
  components get React Testing Library tests (`*.test.ts(x)` next to the code). `npm test`
  must pass before a phase is done.
- **Commits carry no Claude attribution.** No `Co-Authored-By: Claude` trailer or similar.

## Architecture rules

- **Store raw facts only.** The database holds sessions, condense events and profile settings.
  Heart level, circles, stability and rhythm are never stored; they are computed by
  `computeHeartState()` in `src/engine/progression.ts` every time.
- **The engine is pure TypeScript.** No React, DOM, Supabase or `Date.now()` inside
  `src/engine` (pass `now` and `timeZone` in). It must run unchanged in a mobile wrapper.
- **All tuning numbers live in `src/engine/config.ts`.** Never hardcode thresholds elsewhere.
- **Days are the user's local days**, worked out with `dayKey(instant, timeZone)`. Never
  compare UTC dates.
- **Timer:** store the start timestamp and compute elapsed time from it. Never count seconds
  with `setInterval` state (tabs and phones sleep).
- **Auth:** email + password (no magic links, which complicate the Capacitor port).

## Progression rules (summary; the doc comment in progression.ts has the full rules)

- Heart forms at 5h. Level 1 circles are 2h each (10h per level), growing each level.
- Practice day = a local day with 10+ minutes. Rhythm day = practice day within 2 days of
  the previous one (1 grace day).
- Each rhythm day adds a point to the oldest unstable circle, else to the forming circle.
  Circles need 4 / 5 / 6 points (level 1 / 2 / 3+) to be stable.
- Condense when all 5 are stable. Reserve minutes flow into the next level.
- Ranks: Apprentice → Adept → Magus → Archmagus → Sage.

## Design

The design is final; build to it, don't redesign.

- Design system: `design/manaheart-design-system/`. Read `README.md` (principles, colour,
  type, voice, navigation) and `Motion.md` (ring language, timings) before UI work.
  Each component has `components/<Name>/README.md` and a `preview.html`.
- Screens: `design/pages/manaheart-first-look/screens/*.png` (mobile 390 wide and desktop
  1440 wide for every page). Source markup per screen is in `.../source/*.dc.html`; the
  heart is in `Heart.dc.html` and shared motion in `mh.css`.
- Tokens: `src/styles/tokens.css` is a copy of the design system's file. Use the CSS
  variables and type classes (`.display`, `.title`, `.label`, `.numeric-xl`…). Never
  hardcode hex values or font sizes in components.
- **Copy style (owner):** plain and a little casual with a little flavour. No poetic filler,
  no fragmented sentences (join short ones with a comma, "and", "so" or "but"), and use
  "you/your" only where needed ("the heart", "the rhythm"). Example: "The circle still
  flickers, but it will settle with a steady rhythm."
- Copy follows the README voice rules. Use the helpers in `src/engine/format.ts` for
  durations ("45 min", "6h 40m / 10h"), gains and ranks. Never show percentages.
- Every animation needs a `prefers-reduced-motion` alternative.
- **Owner-approved change to Motion.md:** the heart *beats* (lub-dub, ~1.3s; slower on Focus,
  quicker on Complete) with halo and ripple in time, instead of slowly breathing. The forming
  ring has motes flowing to a pulsing tip, and gathering sparks drift inward to a beating
  seed. Keep this; don't revert to the original breathing spec.
- Mobile-first. Bottom sheet below 640px, centered modal above.

## Data layer

- Schema: `supabase/migrations/`. Tables `profiles` (auto-created on sign-up), `sessions`,
  `condensations` (insert-only). Row-level security on all: users see only their own rows.
  Schema changes go in a new numbered migration file; run it in the Supabase SQL Editor.
- `src/data/api.ts` is the only file that talks to Supabase tables (and does the
  snake_case ↔ camelCase mapping).
- Components use `useManaData()` for records and mutations (optimistic, rolled back on
  error) and `useHeartState()` for derived progress. Never call `computeHeartState`
  directly in components.
- `useAuth()` for the session and sign in/up/out.
- Keys live in `.env` (git-ignored); see `.env.example`. Only the anon key belongs in the
  app. Never the service_role key.

## Layout

```
src/
  engine/     pure logic + tests: progression (heart), stars (Constellation), grimoire,
              config (all thresholds, incl. star thresholds), time, format
  data/       Supabase API, ManaDataProvider, useHeartState, useConstellation/useGrimoire, useNow
  auth/       AuthProvider + useAuth
  focus/      timer (pure) + FocusTimerProvider (persists the running session per user)
  heart/      heartModel (pure: state → rings + aria label) and the Heart SVG
  copy/       wording helpers (heart moments, rhythm lines, dates)
  ui/         design-system primitives: Button, Icon, SegmentedControl, DurationStepper,
              ProgressLine, RhythmWeek, Sheet, TextInput/TextArea, Switch, ConfirmDialog,
              SessionRow, EmptyState, toast/ (useToast), useMediaQuery (CSS modules, tokens only)
  app/        AppShell (navigation, per-page mobile top bar), useRecordSessions, useMoments
  screens/    Home, LogSheet, Focus, Complete, Sessions, EditSessionSheet, Settings, Welcome,
              auth/ (SignIn, NewPassword), moments/ (Milestone, MageChoice, Condense, LevelUp),
              constellation/ (Constellation, Sky, skyLayout), grimoire/ (Grimoire),
              public/ (Landing, PublicLayout, DocPage for Guide/Privacy/Terms)
  content/    markdown reader for the docs
  lib/        Supabase client, safe localStorage
  test/       test helpers: fake Supabase, providers, renderApp
  styles/     tokens.css (from the design system), global.css
supabase/     SQL migrations
docs/         guide.md, privacy.md, terms.md: the text of those pages (edit here, pages follow)
design/       design system and exported screens (reference only, not shipped)
```

Styling: one CSS module per component, using token variables only. Pure logic lives
outside components so it can be unit-tested; screens are tested end-to-end through
`renderApp()` with `../data/api` mocked.

Layout differences between mobile and desktop that change markup (not just CSS) use
`useMediaQuery(DESKTOP)`; tests default to mobile and switch with `setViewport('desktop')`.
Toasts keep empty `status`/`alert` live regions on the page, so tests find alerts by text.

Moments: milestones and the mage choice only appear on Home (`Main` in `App.tsx`), after
Session complete. `profiles.milestones_seen_at` is a watermark written when the whole queue
is dismissed; null means "start now", so old accounts don't replay history.

Constellation and Grimoire (designs in `design/pages/manaheart-constellation-grimoire/`):
- Stars are derived from logs by `computeConstellation()`; positions come from the design's
  Sky in `screens/constellation/skyLayout.ts`. Star ids follow the default config, so
  changing the number of hour/day/run thresholds needs matching positions.
- "Next" stars: a main-branch star is next once its parent is lit; a side star is also next
  when its parent is a next main-branch star (side stars never chain).
- The sky's heart beats slower and softer than Home's (owner request); each beat sends a
  glow outward along lit lines and stars (animation-delay by distance from the heart).
- The Grimoire opens from the Constellation page; one page per level reached. Lore is in
  `copy/lore.ts` (Apprentice and Adept from the design, the rest written to match).

Public pages (designs in `design/pages/manaheart-public-pages/`): signed out, `/` is the
landing page, `/signin` signs in (`?mode=create` opens Create account), and `/guide`,
`/privacy`, `/terms` read `docs/*.md` through `content/markdown.ts`. Signed in, the same
docs open as sub-pages from Settings › About. Contact email: manaheart.timer@gmail.com.

Known gaps (planned):
- Daily reminder: the setting is stored but nothing sends it yet. Needs Capacitor local
  notifications (mobile) or web push (Phase 6).
- No in-app "Delete account" yet; Privacy says to email for deletion within 30 days.
- Durations are zero-padded ("1h 05m"), matching the designs.

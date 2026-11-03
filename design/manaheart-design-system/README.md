# Manaheart

A quiet ritual for meditation and study. Logged time gathers into a glowing mana heart; up to five circles form around it, rhythm steadies them, and five stable circles condense into a stronger heart. The heart is the progress display. Everything around it stays dark, sparse and still.

## Principles

- **The heart is the only spectacle.** Light, motion and glow belong to the heart and its rings. The interface around it is flat, dark and quiet.
- **One accent.** `mana` is the only hue in the interface. Feedback colours (`success`, `error`) appear only when something needs saying.
- **Ritual, not game.** No points, streak flames, badges or currencies. Progress is shown by the heart, one progress line and the rhythm week.
- **Meaning never rides on colour alone.** Stable is a continuous line; unstable is broken, dimmer and moving; forming is a partial arc over a dotted ghost. Missed days are hollow rings, practised days are filled.
- **Slow motion only.** Nothing bounces or overshoots. Every animation has a still alternative.

## Voice

Calm, second person, present tense, short sentences. A little mystical, always plain enough to read at a glance.

- Titles name the moment: "Your heart has formed", "A circle has formed", "The circle is stable".
- One italic line may follow, in the `moment` style: "Mana gathering", "Five circles fold into the heart…".
- Buttons are verbs: "Begin session", "Log manually", "Add to the heart", "Condense", "Return to the heart".
- Numbers: durations as `45 min`, `1h 30m`, `6h 40m / 10h`. Gains as `+45 min`. Rhythm as `5 of 7 days`. Never percentages.
- Ranks, in order: Apprentice → Adept → Magus → Archmagus → Sage, shown as "Level 2 · Adept".
- Categories are exactly **Meditation** and **Study**.

## Colour

One theme, Night. The app has no light mode.

- Grounds, darkest to lightest: `page-deep` (focus, milestones) → `page` (everything else) → `card` (cards on the page) → `sheet` (sheets, modals, toasts). A lighter ground never sits under a darker one.
- Edges: `hairline-faint` for dividers, `hairline` for card borders, `edge-subtle` for chips and sheet rims, `control-edge` for anything that must be found and operated (inputs, outline buttons, steppers: 3:1 or better).
- Text: `text-primary` for titles and key numbers, `text-body` for copy, `text-secondary` for labels and hints, `text-tertiary` as the faintest readable text. All pass 4.5:1 on `page`, `card` and `sheet`.
- Light: `core` for the heart's centre and new gains, `primary` for the primary button and the focus ring, `mana` for rings, progress and selection, `mana-soft` for halos and icons, `deep-mana` only in halo falloff.
- Feedback: `success` / `success-ground` / `success-edge` and `error` / `error-ground` / `error-edge`. Destructive actions use the error trio and appear only inside confirmations or as a secondary text action.
- Mage palettes replace `mana` on the heart and rings only, after the first circle: `elemental-*`, `arcane-*`, `spirit-*`. Interface controls keep `mana` and `primary`, except the Arcane confirm button (`arcane-primary`).

## Type

Two families from Google Fonts: **Cormorant Garamond** (500, italic 400) for anything named or ceremonial, and **Manrope** (200–600) for interface and numbers.

- `display` for rank names, `title` for page and sheet titles, `heading` inside cards, `moment` (italic) for one quiet line per screen.
- `body`, `body-sm`, `label` (uppercase, tracked +0.24–0.3em) and `button` in Manrope.
- Numbers are Manrope with `font-variant-numeric: tabular-nums`. Timers and big values use weight 200 (`numeric-xl`, `numeric-l`).
- Never set a full sentence in `label`, and never use the display face below 17px.

Load: `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@200;300;400;500;600&display=swap`

## Space and shape

- Spacing runs `space-1` (4) to `space-9` (96). Mobile gutter `space-5`, desktop gutter `space-7`, desktop container 1200px max.
- Radii: `radius-bar` for bars, `radius-input` for fields, `radius-card` for cards, `radius-dialog` for dialogs and option cards, `radius-sheet` for sheets and modals, `radius-pill` for every button, chip and switch.
- Depth comes from grounds and glow, not drop shadows. Only sheets (`shadow-sheet`) and modals (`shadow-modal`) cast shadows.
- Touch targets are at least 44px. Primary buttons are 56px on mobile, 52–56px on desktop.

## Focus and accessibility

- Every focusable element shows a 2px `focus` outline with a 3px offset; inputs add `halo-input`.
- Icon-only buttons carry an `aria-label`. Segmented controls are radiogroups, switches are `role="switch"`.
- The heart is drawn as one SVG with `role="img"` and a label that states the circles in words ("three circles, one unstable, the fourth forming").
- Under `prefers-reduced-motion`, every animation stops (see Motion).

## Iconography

Thin line icons on a 24px grid: 1.4px stroke (1.6 at 18px and below), round caps and joins, no fills, `currentColor`. `text-secondary` at rest, `mana` when active. The heart icon is a tilted ellipse around a diamond; Meditation is a small sun; Study is an open book. See the Icons card for the set.

## Navigation

- Mobile: top bar (name or page title, settings button) and a 72px bottom nav with Heart and Sessions. Tabs are 104px wide and centred so a third, Constellation, can join later without re-layout.
- Desktop: an 80px top bar inside the 1200px container: name left; Heart, Sessions and settings right. The active link gets `text-primary` and a 1px `mana` underline.
- Focus sessions, session complete, milestones and condense hide all navigation.

## Components

Previews in the Components view. The heart itself is drawn per screen from the ring language in Motion; the live, configurable heart lives in the Manaheart design canvas.

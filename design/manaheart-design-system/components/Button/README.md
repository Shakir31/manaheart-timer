Pill buttons in four weights, plus icon buttons; at most one primary per screen.

- **Primary**: `primary` fill, `on-primary` text, `glow-primary`. 56px tall on mobile (full width), 52–56px on desktop. Hover `primary-hover` with a stronger glow; pressed `primary-pressed`, scale 0.98, glow drops.
- **Outline**: 1px `control-edge`, transparent, `text-body`. Hover: `mana` edge and a 6% mana wash. For secondary actions beside a primary ("End session", "Back", "Choose again").
- **Destructive**: `error-ground` fill, `error-edge` rim, `error` text. Only inside a confirmation dialog.
- **Ghost**: no edge, `text-secondary`, 44px tall. Tertiary actions ("Log manually", "Skip", "Cancel").
- **Icon**: 44×44 hit area with an `aria-label`. The pause button is the one large icon button: 64–76px circle, `mana-soft` edge, faint glow.
- Focus-visible: 2px `focus` outline, 3px offset, every variant. Disabled: no glow, `track` or faded edge, `text-tertiary`. Loading: a 16px spinner and a present-tense label ("Saving"), `aria-busy`.
- Labels are verbs in sentence case: "Begin session", "Add to the heart".

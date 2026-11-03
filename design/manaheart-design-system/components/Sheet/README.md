The container for short tasks (Log manually, Edit session): a bottom sheet below 640px, a centered modal above.

- Ground `sheet`, rim `edge-subtle`, over a `scrim`. Title in `title` (30px mobile, 34px desktop) with an optional one-line subtitle in `body-sm`, and a close icon button.
- Bottom sheet: `radius-sheet` top corners, 40×4 grabber, `shadow-sheet`, padding 24 sides. Height hugs content (max 90%); the primary action is full width at the bottom.
- Modal: max-width 520, `radius-sheet`, `shadow-modal`, padding 28/32. Actions bottom-right, primary last; a destructive text action may sit bottom-left.
- `role="dialog"` with `aria-modal`, focus trapped and returned on close; Esc and scrim tap close. Motion: see the Motion section.

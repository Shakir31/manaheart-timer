On/off toggle for settings such as the daily reminder.

- `role="switch"` with `aria-checked`, labelled by the row's visible text. 52×32, knob 22px.
- On: `mana` edge, 22% mana fill, `primary` knob with a soft glow, knob right. Off: `control-edge`, `card` fill, `text-tertiary` knob, knob left.
- State reads from knob position and fill, not colour alone. Knob slides 160ms; instant under reduced motion.

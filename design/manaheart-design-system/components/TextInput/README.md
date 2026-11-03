Single-line input and textarea with an uppercase label above; used for sign-in, notes and reminder time.

- 48px tall, `radius-input`, `page` fill even inside sheets, 1px `control-edge`.
- Hover: `rhythm-missed` edge, `card` fill. Focus: `mana-soft` edge plus `halo-input` (and the 2px focus outline for keyboard focus).
- Error: `error` edge and a one-line message below in `error`, tied with `aria-describedby`. Say what to do: "Enter a full email address".
- Disabled: `hairline` edge, `card` fill, `text-tertiary`.
- Label: `label` style, `text-secondary`; optional fields add "· optional" in sentence case, `text-tertiary`.
- Notes are a textarea, 2–3 rows, 280 characters; show the count only once it is filled.

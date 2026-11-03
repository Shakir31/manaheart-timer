import { useId, useState } from 'react'
import { Icon } from './Icon'
import styles from './DurationStepper.module.css'

import { MAX_MINUTES, MIN_MINUTES, QUICK_PICKS, STEP } from './duration'

interface Props {
  value: number
  onChange(minutes: number): void
  label?: string
}

const clamp = (n: number) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, n))

/** Minutes stepper with quick picks (DurationStepper spec). Steps snap to multiples of 5. */
export function DurationStepper({ value, onChange, label = 'Duration' }: Props) {
  const id = useId()
  // Text being typed; committed (clamped) on blur so partial input isn't fought.
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (text: string) => {
    const n = parseInt(text, 10)
    if (Number.isFinite(n)) onChange(clamp(n))
    setDraft(null)
  }
  const down = () => onChange(clamp(value % STEP ? value - (value % STEP) : value - STEP))
  const up = () => onChange(clamp(value % STEP ? value + (STEP - (value % STEP)) : value + STEP))

  return (
    <div className={styles.root}>
      <label htmlFor={id} className="label">{label}</label>
      <div className={styles.layout}>
        <div className={styles.stepper}>
          <button type="button" className={styles.round} aria-label="Five minutes less" onClick={down} disabled={value <= MIN_MINUTES}>
            <Icon name="minus" size={20} />
          </button>
          <div className={styles.value}>
            <input
              id={id}
              className={styles.input}
              inputMode="numeric"
              value={draft ?? String(value)}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onBlur={(e) => commit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit(e.currentTarget.value))}
            />
            <span className={styles.unit}>min</span>
          </div>
          <button type="button" className={styles.round} aria-label="Five minutes more" onClick={up} disabled={value >= MAX_MINUTES}>
            <Icon name="plus" size={20} />
          </button>
        </div>
        <div className={styles.picks}>
          {QUICK_PICKS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={value === m}
              aria-label={`${m} minutes`}
              className={value === m ? `${styles.chip} ${styles.chipOn}` : styles.chip}
              onClick={() => onChange(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

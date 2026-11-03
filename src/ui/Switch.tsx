import styles from './Switch.module.css'

interface Props {
  checked: boolean
  onChange(checked: boolean): void
  /** id of the visible text that names this switch. */
  labelledBy: string
  disabled?: boolean
}

/** On/off toggle (Switch spec). State shows by knob position and fill, not colour alone. */
export function Switch({ checked, onChange, labelledBy, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      className={checked ? `${styles.switch} ${styles.on}` : styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  )
}

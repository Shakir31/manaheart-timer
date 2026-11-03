import { formatDuration } from '../engine'
import styles from './ProgressLine.module.css'

interface Props {
  label: string
  minutes: number
  requiredMinutes: number
  /** Text after the target, e.g. "until your heart forms". */
  suffix?: string
  /** Before formation: softer fill. */
  gathering?: boolean
  /** Minutes just gained, shown as a bright segment at the end of the fill. */
  gain?: number
}

/** One thin line toward the next goal (ProgressLine spec). Never shows a percentage. */
export function ProgressLine({ label, minutes, requiredMinutes, suffix, gathering, gain = 0 }: Props) {
  const total = Math.max(requiredMinutes, 1)
  const filled = Math.min(1, Math.max(0, minutes / total))
  const gained = Math.min(filled, Math.max(0, gain / total))
  const target = `/ ${formatDuration(requiredMinutes)}${suffix ? ` ${suffix}` : ''}`

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          {formatDuration(minutes)} <span className={styles.target}>{target}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={requiredMinutes}
        aria-valuenow={Math.min(minutes, requiredMinutes)}
        aria-valuetext={`${formatDuration(minutes)} of ${formatDuration(requiredMinutes)}`}
        className={styles.track}
      >
        <div
          className={gathering ? `${styles.fill} ${styles.gathering}` : styles.fill}
          style={{ width: `${(filled - gained) * 100}%` }}
        />
        {gained > 0 && (
          <div className={styles.gain} style={{ left: `${(filled - gained) * 100}%`, width: `${gained * 100}%` }} />
        )}
      </div>
    </div>
  )
}

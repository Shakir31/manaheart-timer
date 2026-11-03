import type { RhythmDay } from '../engine'
import { DAY_LETTERS, rhythmLabel } from '../copy/heartCopy'
import styles from './RhythmWeek.module.css'

/** The last seven days as dots, oldest left, today right (RhythmWeek spec). */
export function RhythmWeek({ days }: { days: RhythmDay[] }) {
  return (
    <div role="img" aria-label={rhythmLabel(days)} className={styles.row}>
      {days.map((d) => {
        const dot = d.practiced ? styles.practiced : d.isToday ? styles.today : styles.missed
        return (
          <div key={d.date} className={styles.day} data-state={d.practiced ? 'practiced' : d.isToday ? 'today' : 'missed'}>
            <span className={`${styles.dot} ${dot}`} />
            <span className={d.isToday ? `${styles.letter} ${styles.letterToday}` : styles.letter}>
              {DAY_LETTERS[d.weekday]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

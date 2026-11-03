import { formatDuration } from '../engine'
import { CATEGORY_NAME } from '../copy/sessionsCopy'
import { formatTime } from '../copy/dates'
import type { SessionRecord } from '../data/types'
import { Icon } from './Icon'
import styles from './SessionRow.module.css'

interface Props {
  session: SessionRecord
  timeZone: string
  onOpen(session: SessionRecord): void
}

/** One session in the history; the whole row opens Edit session (SessionRow spec). */
export function SessionRow({ session, timeZone, onOpen }: Props) {
  const name = CATEGORY_NAME[session.category]
  const duration = formatDuration(session.durationMinutes)
  const time = formatTime(session.endedAt, timeZone)
  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => onOpen(session)}
      aria-label={`${name}, ${duration}, ended ${time}${session.note ? `. ${session.note}` : ''}. Edit`}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon name={session.category} size={18} />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{name}</span>
        {session.note && <span className={styles.note}>{session.note}</span>}
      </span>
      <span className={styles.meta}>
        <span className={styles.duration}>{duration}</span>
        <span className={styles.time}>{time}</span>
      </span>
    </button>
  )
}

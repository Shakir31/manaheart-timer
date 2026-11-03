// TEMPORARY stand-ins until Phase 4 builds Sessions and Settings properly.
import { useState } from 'react'
import { formatDuration } from '../engine'
import { formatSessionWhen } from '../copy/dates'
import { useAuth } from '../auth/context'
import { useManaData } from '../data/context'
import { useNow } from '../data/useNow'
import { Button } from '../ui/Button'
import styles from './Placeholders.module.css'

export function SessionsPlaceholder() {
  const { sessions, timeZone } = useManaData()
  const now = useNow()
  return (
    <div className={styles.page}>
      <h1 className="title">Sessions</h1>
      <p className={styles.note}>The full history, editing and deleting arrive in the next phase.</p>
      <ul className={styles.list}>
        {[...sessions].reverse().slice(0, 20).map((s) => (
          <li key={s.id}>
            <span>{s.category === 'meditation' ? 'Meditation' : 'Study'}</span>
            <span className={styles.meta}>{formatDuration(s.durationMinutes)} · {formatSessionWhen(s.endedAt, now, timeZone)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SettingsPlaceholder() {
  const { user, signOut } = useAuth()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className={styles.page}>
      <h1 className="title">Settings</h1>
      <p className={styles.note}>Signed in as {user?.email}. Full settings arrive in the next phase.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <Button variant="outline" onClick={() => signOut().catch(() => setError('Could not sign out. Try again.'))}>
        Sign out
      </Button>
    </div>
  )
}

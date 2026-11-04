import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { formatTime } from '../copy/dates'
import { flowTarget } from '../copy/heartCopy'
import { useRecordSessions } from '../app/useRecordSessions'
import { useManaData } from '../data/context'
import { useHeartState } from '../data/useHeartState'
import { useFocusTimer } from '../focus/context'
import { elapsedMs, formatClock, isPaused } from '../focus/timer'
import { Heart } from '../heart/Heart'
import { heartModel, variantFor } from '../heart/heartModel'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './Focus.module.css'

/** Re-render every second for the clock display (time itself comes from timestamps). */
function useTick(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

export function Focus() {
  const focus = useFocusTimer()
  const heart = useHeartState()
  const { timeZone, profile } = useManaData()
  const record = useRecordSessions()
  const navigate = useNavigate()
  const now = useTick()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timer = focus.timer
  const clock = timer ? formatClock(elapsedMs(timer, now)) : '00:00'

  useEffect(() => {
    document.title = timer ? `${clock} · Manaheart` : 'Manaheart'
    return () => {
      document.title = 'Manaheart'
    }
  }, [clock, timer])

  // While saving, the timer is cleared just as we navigate to Session complete.
  if (!timer) return saving ? null : <Navigate to="/" replace />

  const paused = isPaused(timer)
  const category = timer.category === 'meditation' ? 'Meditation' : 'Study'
  const other = timer.category === 'meditation' ? 'Study' : 'Meditation'
  const variant = variantFor(heart.level, profile?.mage)

  const end = async () => {
    if (saving) return
    const entries = focus.entriesNow()
    if (entries.length === 0) {
      // Under half a minute: nothing to record.
      focus.clear()
      navigate('/', { replace: true })
      return
    }
    setSaving(true)
    setError(null)
    try {
      await record(entries, 'timer')
      focus.clear()
    } catch {
      setError('The session could not be saved. Your time is kept; try ending again.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <Heart model={heartModel(heart)} variant={variant} pulse="slow" decorative />
      </div>

      <header className={styles.header}>
        <span className={styles.brand}>Manaheart</span>
        <span className={styles.chip}>
          <Icon name={timer.category} size={16} />
          {category}
        </span>
      </header>

      <div className={styles.center}>
        <div className={styles.clock} role="timer" aria-label={`${category} session, ${clock} elapsed${paused ? ', paused' : ''}`}>
          {clock}
        </div>
        <p className={`moment ${styles.moment}`}>{paused ? 'Paused' : 'Mana gathering'}</p>
      </div>

      <div className={styles.footer}>
        <p className={styles.meta}>
          Begun {formatTime(new Date(timer.startedAt), timeZone)} · flows into {flowTarget(heart)}
        </p>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div className={styles.controls}>
          <Button variant="outline" className={styles.end} onClick={end} disabled={saving} aria-busy={saving}>
            {saving ? 'Saving' : 'End session'}
          </Button>
          <button
            type="button"
            className={styles.pause}
            aria-label={paused ? 'Resume' : 'Pause'}
            onClick={paused ? focus.resume : focus.pause}
          >
            <Icon name={paused ? 'play' : 'pause'} size={22} />
          </button>
          <Button variant="ghost" aria-label={`Switch to ${other}`} onClick={focus.switchCategory}>
            Switch focus
          </Button>
        </div>
      </div>
    </div>
  )
}

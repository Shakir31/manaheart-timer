import { useState } from 'react'
import { useNavigate } from 'react-router'
import { formatDuration } from '../engine'
import { rhythmCount } from '../copy/heartCopy'
import { groupByDay, weekSummary } from '../copy/sessionsCopy'
import { useManaData } from '../data/context'
import type { SessionRecord } from '../data/types'
import { useHeartState } from '../data/useHeartState'
import { useNow } from '../data/useNow'
import { useFocusTimer } from '../focus/context'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Icon } from '../ui/Icon'
import { RhythmWeek } from '../ui/RhythmWeek'
import { SessionRow } from '../ui/SessionRow'
import { DESKTOP, useMediaQuery } from '../ui/useMediaQuery'
import { EditSessionSheet } from './EditSessionSheet'
import { LogSheet } from './LogSheet'
import styles from './Sessions.module.css'

/** Days shown at first; "Show earlier days" adds more. */
const PAGE_DAYS = 30

export function Sessions() {
  const { sessions, timeZone } = useManaData()
  const heart = useHeartState()
  const now = useNow()
  const focus = useFocusTimer()
  const navigate = useNavigate()
  const desktop = useMediaQuery(DESKTOP)
  const [editing, setEditing] = useState<SessionRecord | null>(null)
  const [logging, setLogging] = useState(false)
  const [shownDays, setShownDays] = useState(PAGE_DAYS)

  const groups = groupByDay(sessions, now, timeZone)
  const week = weekSummary(sessions, now, timeZone)
  const days = heart.rhythm.last7

  const begin = () => {
    if (!focus.timer) focus.start()
    navigate('/focus')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sessions</h1>
        {sessions.length > 0 && (
          <Button variant="outline" className={styles.logButton} onClick={() => setLogging(true)}>
            <Icon name="plus" size={18} />
            Log manually
          </Button>
        )}
      </header>

      {sessions.length === 0 ? (
        <EmptyState title="Nothing gathered yet" body="Begin a session or log one you've done. Each one will gather here.">
          <Button block onClick={begin}>Begin session</Button>
          <Button variant="ghost" onClick={() => setLogging(true)}>Log manually</Button>
        </EmptyState>
      ) : (
        <div className={styles.layout}>
          <section className={styles.week} aria-labelledby="week-title">
            <div className={styles.weekTop}>
              <div>
                <h2 id="week-title" className={`label ${styles.eyebrow}`}>This week</h2>
                <p className={styles.total}>{formatDuration(week.totalMinutes)}</p>
              </div>
              <dl className={styles.split}>
                <div><dt>Meditation</dt><dd>{formatDuration(week.meditationMinutes)}</dd></div>
                <div><dt>Study</dt><dd>{formatDuration(week.studyMinutes)}</dd></div>
              </dl>
            </div>
            <div className={styles.weekRhythm}>
              <p className={styles.rhythmText}>
                <span>Rhythm</span>
                <span className={styles.rhythmCount}>{rhythmCount(days)}</span>
              </p>
              <RhythmWeek days={days} compact={!desktop} />
            </div>
          </section>

          <div className={styles.history}>
            {groups.slice(0, shownDays).map((g) => (
              <section key={g.date} className={styles.day} aria-labelledby={`day-${g.date}`}>
                <div className={styles.dayHead}>
                  <h2 id={`day-${g.date}`} className={`label ${styles.eyebrow}`}>{g.heading}</h2>
                  <span className={styles.dayTotal}>{formatDuration(g.totalMinutes)}</span>
                </div>
                {g.sessions.map((s) => (
                  <SessionRow key={s.id} session={s} timeZone={timeZone} onOpen={setEditing} />
                ))}
              </section>
            ))}
            {groups.length > shownDays && (
              <Button variant="ghost" className={styles.more} onClick={() => setShownDays(shownDays + PAGE_DAYS)}>
                Show earlier days
              </Button>
            )}
          </div>
        </div>
      )}

      {editing && <EditSessionSheet session={editing} onClose={() => setEditing(null)} />}
      {logging && <LogSheet onClose={() => setLogging(false)} />}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { formatDuration } from '../engine'
import { heartMoment, progressInfo, rhythmCount } from '../copy/heartCopy'
import { formatSessionWhen } from '../copy/dates'
import { useManaData } from '../data/context'
import { useHeartState } from '../data/useHeartState'
import { useNow } from '../data/useNow'
import { useFocusTimer } from '../focus/context'
import { Heart } from '../heart/Heart'
import { heartModel } from '../heart/heartModel'
import { Button } from '../ui/Button'
import { ProgressLine } from '../ui/ProgressLine'
import { RhythmWeek } from '../ui/RhythmWeek'
import { LogSheet } from './LogSheet'
import styles from './Home.module.css'

export function Home() {
  const heart = useHeartState()
  const { sessions, profile, timeZone } = useManaData()
  const focus = useFocusTimer()
  const navigate = useNavigate()
  const [logging, setLogging] = useState(false)
  const now = useNow()

  const progress = progressInfo(heart)
  const recent = sessions.slice(-3).reverse()
  const variant = heart.level >= 1 && profile?.mage ? profile.mage : 'mana'

  const begin = () => {
    if (!focus.timer) focus.start()
    navigate('/focus')
  }

  return (
    <div className={styles.page}>
      <div className={styles.heart}>
        <Heart model={heartModel(heart)} variant={variant} stars />
      </div>

      <div className={styles.panel}>
        <div className={styles.rank}>
          <p className={`label ${styles.eyebrow}`}>{heart.heart.formed ? `Level ${heart.level}` : 'Before formation'}</p>
          <h1 className={styles.title}>{heart.rank ?? 'Gathering'}</h1>
          <p className={`moment ${styles.moment}`}>{heartMoment(heart)}</p>
        </div>

        <div className={styles.progress}>
          <ProgressLine {...progress} />
        </div>

        <section className={styles.rhythm} aria-label="Rhythm">
          <div className={styles.rhythmCount}>
            <span className={`label ${styles.eyebrow}`}>Rhythm</span>
            <span className={styles.count}>{rhythmCount(heart.rhythm.last7)}</span>
          </div>
          <RhythmWeek days={heart.rhythm.last7} />
          {heart.formedCount > 0 && (
            <ul className={styles.legend}>
              <li>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="var(--mana)" strokeWidth="1.2" /></svg>
                {heart.stableCount} stable
              </li>
              {heart.unstableCount > 0 && (
                <li>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="var(--mana)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" /></svg>
                  {heart.unstableCount} unstable
                </li>
              )}
            </ul>
          )}
        </section>

        <div className={styles.actions}>
          <Button block onClick={begin}>{focus.timer ? 'Return to session' : 'Begin session'}</Button>
          <Button variant="ghost" className={styles.logButton} onClick={() => setLogging(true)}>Log manually</Button>
        </div>

        {recent.length > 0 && (
          <section className={styles.recent} aria-labelledby="recent-title">
            <h2 id="recent-title" className={`label ${styles.eyebrow}`}>Recent</h2>
            <ul>
              {recent.map((s) => (
                <li key={s.id}>
                  <span>{s.category === 'meditation' ? 'Meditation' : 'Study'}</span>
                  <span className={styles.recentMeta}>
                    {formatDuration(s.durationMinutes)} · {formatSessionWhen(s.endedAt, now, timeZone)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {logging && <LogSheet onClose={() => setLogging(false)} />}
    </div>
  )
}

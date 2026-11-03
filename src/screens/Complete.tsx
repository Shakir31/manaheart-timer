import { Navigate, useLocation, useNavigate } from 'react-router'
import { formatGain } from '../engine'
import { progressInfo, rhythmNote } from '../copy/heartCopy'
import type { CompleteState } from '../app/useRecordSessions'
import { useManaData } from '../data/context'
import { useHeartState } from '../data/useHeartState'
import { Heart } from '../heart/Heart'
import { heartModel } from '../heart/heartModel'
import { Button } from '../ui/Button'
import { ProgressLine } from '../ui/ProgressLine'
import styles from './Complete.module.css'

const NAMES = { meditation: 'Meditation', study: 'Study' } as const

function isCompleteState(v: unknown): v is CompleteState {
  const s = v as CompleteState | null
  return !!s && typeof s.gainMinutes === 'number' && Array.isArray(s.categories) && typeof s.target === 'string'
}

/** The short moment after a session: the gain, where it went, and the rhythm. */
export function Complete() {
  const location = useLocation()
  const navigate = useNavigate()
  const heart = useHeartState()
  const { profile } = useManaData()

  if (!isCompleteState(location.state)) return <Navigate to="/" replace />
  const { gainMinutes, categories, target } = location.state

  const progress = progressInfo(heart)
  const categoryText = [...new Set(categories)].map((c) => NAMES[c]).join(' & ')
  const variant = heart.level >= 1 && profile?.mage ? profile.mage : 'mana'

  return (
    <div className={styles.page}>
      <p className={`label ${styles.eyebrow}`}>Session complete</p>

      <div className={styles.heart}>
        <Heart model={heartModel(heart)} variant={variant} streams pulse="quick" />
      </div>

      <div className={`${styles.gain} ${styles.rise}`}>
        <p className={styles.amount}>{formatGain(gainMinutes)}</p>
        <p className={styles.where}>{categoryText} · flowed into {target}</p>
      </div>

      <div className={styles.progress}>
        <ProgressLine {...progress} gain={gainMinutes} />
        <p className={styles.rhythm}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4" fill="var(--mana)" /></svg>
          {rhythmNote(heart.rhythm.last7)}
        </p>
      </div>

      <Button variant="outline" block className={styles.back} onClick={() => navigate('/', { replace: true })}>
        Return to the heart
      </Button>
    </div>
  )
}

import { Navigate, useLocation, useNavigate } from 'react-router'
import { DEFAULT_CONFIG } from '../../engine'
import { useManaData } from '../../data/context'
import { useHeartState } from '../../data/useHeartState'
import { Heart } from '../../heart/Heart'
import { heartModel, variantFor } from '../../heart/heartModel'
import { Button } from '../../ui/Button'
import styles from './Moments.module.css'

export function LevelUp() {
  const heart = useHeartState()
  const { profile } = useManaData()
  const location = useLocation()
  const navigate = useNavigate()

  if (!(location.state as { condensed?: boolean } | null)?.condensed) return <Navigate to="/" replace />

  return (
    <div className={styles.page}>
      <div className={`${styles.content} ${styles.levelIn}`}>
        <p className={`label ${styles.eyebrow}`}>Level {heart.level}</p>
        <h1 className={styles.rank}>{heart.rank}</h1>
        <div className={styles.heart}>
          <Heart model={heartModel(heart)} variant={variantFor(heart.level, profile?.mage)} />
        </div>
        <ol className={styles.ranks} aria-label="Ranks">
          {DEFAULT_CONFIG.ranks.map((rank) => (
            <li key={rank} aria-current={rank === heart.rank ? 'step' : undefined}>{rank}</li>
          ))}
        </ol>
        <p className={`moment ${styles.body} ${styles.levelBody}`}>Your heart is denser now. New circles will form around it.</p>
        <Button block className={styles.action} onClick={() => navigate('/', { replace: true })}>
          Return to the heart
        </Button>
      </div>
    </div>
  )
}

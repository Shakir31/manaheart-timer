import { useLayoutEffect, useRef } from 'react'
import { momentCopy, type Moment } from '../../copy/moments'
import { useManaData } from '../../data/context'
import { useHeartState } from '../../data/useHeartState'
import { Heart } from '../../heart/Heart'
import { heartModel, variantFor } from '../../heart/heartModel'
import styles from './Moments.module.css'

/** A brief full-screen moment, held until tapped. No navigation (Motion › Moments). */
export function Milestone({ moment, onDismiss }: { moment: Moment; onDismiss(): void }) {
  const heart = useHeartState()
  const { profile } = useManaData()
  const tapTarget = useRef<HTMLButtonElement>(null)
  const { eyebrow, title, body } = momentCopy(moment)

  // Focus in the same commit that draws the moment, so keyboard and screen-reader users
  // land on Continue straight away (no gap between the screen appearing and focus).
  useLayoutEffect(() => {
    tapTarget.current?.focus({ preventScroll: true })
  }, [moment])

  return (
    <div className={styles.page}>
      <button ref={tapTarget} type="button" className={styles.tapTarget} aria-label="Continue" onClick={onDismiss} />
      <div key={`${moment.kind}-${moment.at}`} className={styles.content}>
        <p className={`label ${styles.eyebrow} ${styles.fade}`}>{eyebrow}</p>
        <div className={styles.heart}>
          <Heart model={heartModel(heart)} variant={variantFor(heart.level, profile?.mage)} />
        </div>
        <h1 className={`${styles.title} ${styles.rise}`}>{title}</h1>
        <p className={`moment ${styles.body} ${styles.rise}`}>{body}</p>
        <p className={styles.hint}>Tap anywhere to continue</p>
      </div>
    </div>
  )
}

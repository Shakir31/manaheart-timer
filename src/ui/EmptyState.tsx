import type { ReactNode } from 'react'
import { Heart } from '../heart/Heart'
import type { HeartModel } from '../heart/heartModel'
import styles from './EmptyState.module.css'

const GATHERING: HeartModel = { phase: 'gathering', dense: false, rings: [], label: '' }

/** Faint gathering sparks, one line, one sentence, and a way forward (EmptyState spec). */
export function EmptyState({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className={styles.root}>
      <div className={styles.sparks}>
        <Heart model={GATHERING} decorative pulse="slow" />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{body}</p>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  )
}

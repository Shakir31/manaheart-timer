import type { StarSheetCopy } from '../../copy/starsCopy'
import styles from './Constellation.module.css'

/** The body of a star's sheet (mobile) or panel (desktop): line, status and the star before it. */
export function StarDetail({ copy, lit }: { copy: StarSheetCopy; lit: boolean }) {
  return (
    <div className={styles.detail}>
      {copy.line && <p className={`moment ${styles.detailLine}`}>{copy.line}</p>}
      <p className={styles.status}>
        <span className={lit ? `${styles.statusDot} ${styles.statusLit}` : styles.statusDot} aria-hidden="true" />
        {copy.status}
      </p>
      {copy.before && (
        <p className={styles.before}>
          <span className={`${styles.statusDot} ${styles.statusLit}`} aria-hidden="true" />
          {copy.before}
        </p>
      )}
    </div>
  )
}

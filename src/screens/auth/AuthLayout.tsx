import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Heart } from '../../heart/Heart'
import { demoHeart } from '../../heart/demoHearts'
import styles from './Auth.module.css'

const BACKDROP = demoHeart('forming')

/** Name, tagline and a faint heart behind a card (Sign in design). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <Heart model={BACKDROP} decorative pulse="slow" />
      </div>
      <header className={styles.brand}>
        <h1 className={styles.name}><Link to="/" className={styles.nameLink}>Manaheart</Link></h1>
        <p className={`moment ${styles.tagline}`}>A quiet place to gather the hours.</p>
      </header>
      <div className={styles.card}>{children}</div>
    </div>
  )
}

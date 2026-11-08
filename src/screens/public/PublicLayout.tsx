import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import styles from './Public.module.css'

/** Top bar and footer for pages seen before signing in (landing, guide, privacy, terms). */
export function PublicLayout({ children, guideLink = false }: { children: ReactNode; guideLink?: boolean }) {
  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link to="/" className={styles.brand}><img src="/logo/symbol.svg" alt="" className={styles.mark} />Manaheart</Link>
        <nav aria-label="Site" className={styles.topNav}>
          {guideLink && <Link to="/guide" className={styles.topLink}>Guide</Link>}
          <Link to="/signin" className={styles.signIn}>Sign in</Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.footerBrand}>Manaheart</span>
      <span className={styles.copyright}>© 2026 Manaheart</span>
      <nav aria-label="Footer" className={styles.footerNav}>
        <NavLink to="/guide">Guide</NavLink>
        <NavLink to="/privacy">Privacy</NavLink>
        <NavLink to="/terms">Terms</NavLink>
      </nav>
    </footer>
  )
}

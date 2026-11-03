import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Icon, type IconName } from '../ui/Icon'
import styles from './AppShell.module.css'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Heart', icon: 'heart' },
  { to: '/sessions', label: 'Sessions', icon: 'sessions' },
]

/** Mobile top-bar content per page (Navigation spec). Pages keep their own h1 for desktop. */
const PAGES: Record<string, { title: string; sub?: boolean }> = {
  '/sessions': { title: 'Sessions' },
  '/settings': { title: 'Settings', sub: true },
}

/** Top bar + mobile bottom nav / desktop top nav (Navigation spec). */
export function AppShell() {
  const { pathname } = useLocation()
  const page = PAGES[pathname]
  const sub = page?.sub ?? false

  return (
    <div className={sub ? `${styles.shell} ${styles.subPage}` : styles.shell}>
      <header className={styles.topbar}>
        {sub && (
          <Link to="/" className={styles.back} aria-label="Back to Heart">
            <Icon name="back" />
          </Link>
        )}
        <Link to="/" className={page ? `${styles.brand} ${styles.brandDesktopOnly}` : styles.brand}>Manaheart</Link>
        {page && (
          <span className={sub ? `${styles.mobileTitle} ${styles.centred}` : styles.mobileTitle} aria-hidden="true">
            {page.title}
          </span>
        )}
        <nav aria-label="Main" className={styles.desktopNav}>
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}>
              {t.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/settings" aria-label="Settings" className={({ isActive }) => (isActive ? `${styles.iconLink} ${styles.iconActive}` : styles.iconLink)}>
          <Icon name="settings" size={22} />
        </NavLink>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      {!sub && (
        <nav aria-label="Main" className={styles.bottomNav}>
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end className={({ isActive }) => (isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab)}>
              <Icon name={t.icon} />
              {t.label}
              <span className={styles.tabDot} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

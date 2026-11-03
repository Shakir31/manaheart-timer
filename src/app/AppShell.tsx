import { Link, NavLink, Outlet } from 'react-router'
import { Icon, type IconName } from '../ui/Icon'
import styles from './AppShell.module.css'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Heart', icon: 'heart' },
  { to: '/sessions', label: 'Sessions', icon: 'sessions' },
]

/** Top bar + mobile bottom nav / desktop top nav (Navigation spec). */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link to="/" className={styles.brand}>Manaheart</Link>
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

      <nav aria-label="Main" className={styles.bottomNav}>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end className={({ isActive }) => (isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab)}>
            <Icon name={t.icon} />
            {t.label}
            <span className={styles.tabDot} aria-hidden="true" />
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

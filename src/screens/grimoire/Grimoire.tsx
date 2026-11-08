import { useEffect, useRef, useState } from 'react'
import { circleOrdinal, DEFAULT_CONFIG, formatDuration, rankFor, type GrimoirePage } from '../../engine'
import { formatLongDate, formatShortDate } from '../../copy/dates'
import { loreFor } from '../../copy/lore'
import { useManaData } from '../../data/context'
import { useGrimoire } from '../../data/useConstellation'
import { Icon } from '../../ui/Icon'
import styles from './Grimoire.module.css'

const RANKS = DEFAULT_CONFIG.ranks
const pageTitle = (level: number) => rankFor(level, DEFAULT_CONFIG) ?? `Level ${level}`

/**
 * A simple book of growth: one page per level reached, swiped sideways (native scroll-snap)
 * or turned with the arrows and rank tabs. Future ranks show only their names.
 */
export function Grimoire() {
  const pages = useGrimoire()
  const { timeZone } = useManaData()
  const book = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(Math.max(0, pages.length - 1))

  // Open at the current page.
  useEffect(() => {
    const el = book.current
    const page = el?.children[pages.length - 1] as HTMLElement | undefined
    if (el && page) el.scrollLeft = page.offsetLeft - el.offsetLeft
  }, [pages.length])

  const goTo = (i: number) => {
    const target = Math.max(0, Math.min(pages.length - 1, i))
    setIndex(target)
    const page = book.current?.children[target] as HTMLElement | undefined
    page?.scrollIntoView?.({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  // Keep the tabs in step when the reader swipes.
  const onScroll = () => {
    const el = book.current
    if (!el || !el.clientWidth) return
    const i = Math.round(el.scrollLeft / (el.scrollWidth / Math.max(1, pages.length)))
    if (i !== index) setIndex(Math.max(0, Math.min(pages.length - 1, i)))
  }

  if (pages.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Grimoire</h1>
        <p className={styles.empty}>The first page will be written once the heart forms.</p>
      </div>
    )
  }

  const tabs = Math.max(RANKS.length, pages.length)
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Grimoire</h1>

      <div className={styles.spread}>
        <button type="button" className={styles.turn} aria-label="Previous page" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <Icon name="back" />
        </button>
        <div ref={book} className={styles.book} onScroll={onScroll} aria-label="Pages" role="region" tabIndex={0}>
          {pages.map((p) => (
            <Page key={p.level} page={p} timeZone={timeZone} last={p.level === pages.length && p.level < RANKS.length} />
          ))}
        </div>
        <button type="button" className={styles.turn} aria-label="Next page" disabled={index >= pages.length - 1} onClick={() => goTo(index + 1)}>
          <Icon name="forward" />
        </button>
      </div>

      <nav className={styles.tabs} aria-label="Ranks">
        {Array.from({ length: tabs }, (_, i) => {
          const reached = i < pages.length
          return (
            <button
              key={i}
              type="button"
              className={[styles.tab, reached ? styles.tabReached : '', i === index ? styles.tabOn : ''].join(' ')}
              disabled={!reached}
              aria-current={i === index ? 'page' : undefined}
              onClick={() => goTo(i)}
            >
              {pageTitle(i + 1)}
            </button>
          )
        })}
      </nav>
      <p className={styles.swipe}>Swipe to turn the page</p>
    </div>
  )
}

function Page({ page, timeZone, last }: { page: GrimoirePage; timeZone: string; last: boolean }) {
  const date = (iso: string) => formatShortDate(iso, timeZone)
  return (
    <article className={styles.leaf} aria-label={`Level ${page.level}, ${pageTitle(page.level)}`}>
      <p className={`label ${styles.eyebrow}`}>Level {page.level}{page.current ? ' · Now' : ''}</p>
      <h2 className={styles.rank}>{pageTitle(page.level)}</h2>
      <p className={styles.reached}>Reached {formatLongDate(page.reachedAt, timeZone)}</p>
      <p className={`moment ${styles.lore}`}>{loreFor(page.level, RANKS)}</p>

      <div className={styles.record}>
        <div className={styles.recordHead}>
          <span className="label">In this level</span>
          <span className={styles.hours}>
            {formatDuration(page.minutes)}
            {page.current && <span className={styles.soFar}> so far</span>}
          </span>
        </div>
        <ul className={styles.events}>
          {page.heartFormedAt && (
            <li><span className={styles.markHeart} aria-hidden="true" />Heart formed<span className={styles.when}>{date(page.heartFormedAt)}</span></li>
          )}
          {page.circles.map((c) => (
            <li key={c.index}>
              <span className={styles.markRing} aria-hidden="true" />
              {circleOrdinal(c.index)} circle
              <span className={styles.when}>{date(c.formedAt)}{c.stableAt ? ` → steady ${date(c.stableAt)}` : ''}</span>
            </li>
          ))}
          {page.condensedAt && (
            <li><span className={styles.markHeart} aria-hidden="true" />Condensed<span className={styles.when}>{date(page.condensedAt)}</span></li>
          )}
          {page.formingCircle !== null && (
            <li className={styles.forming}><span className={`${styles.markRing} ${styles.markForming}`} aria-hidden="true" />{circleOrdinal(page.formingCircle)} circle forming</li>
          )}
        </ul>
      </div>
      {last && <p className={styles.later}>Later pages are written as each rank is reached.</p>}
    </article>
  )
}

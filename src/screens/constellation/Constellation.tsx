import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Star } from '../../engine'
import { useAuth } from '../../auth/context'
import { skyLean, starSheet } from '../../copy/starsCopy'
import { useConstellation } from '../../data/useConstellation'
import { useManaData } from '../../data/context'
import { useHeartState } from '../../data/useHeartState'
import { variantFor } from '../../heart/heartModel'
import { readJson, writeJson } from '../../lib/storage'
import { Icon } from '../../ui/Icon'
import { Sheet } from '../../ui/Sheet'
import { DESKTOP, useMediaQuery } from '../../ui/useMediaQuery'
import { Sky } from './Sky'
import { StarDetail } from './StarDetail'
import styles from './Constellation.module.css'

const HOW_IT_FILLS = [
  { name: 'Mind', text: 'Hours of meditation, long sits and dawn sits.' },
  { name: 'Lore', text: 'Hours of study, deep study and late study.' },
  { name: 'Rhythm', text: 'Days practised, unbroken runs, and coming back.' },
  { name: 'Ranks', text: 'The brightest stars, rising above the heart.' },
]

/**
 * Stars lit since the last visit (per device). The first visit sets the mark without
 * highlighting anything, so a long history doesn't all flash at once.
 */
function useFreshStars(stars: Star[], userId: string | undefined): ReadonlySet<string> {
  const key = `manaheart.skySeenAt.${userId ?? 'anon'}`
  const [seenAt] = useState<string | null>(() => {
    const v = readJson(key)
    return typeof v === 'string' ? v : null
  })
  useEffect(() => {
    writeJson(key, new Date().toISOString())
  }, [key])
  if (!seenAt) return new Set()
  const mark = Date.parse(seenAt)
  return new Set(stars.filter((s) => s.litAt && Date.parse(s.litAt) > mark).map((s) => s.id))
}

export function Constellation() {
  const sky = useConstellation()
  const heart = useHeartState()
  const { profile, timeZone } = useManaData()
  const { user } = useAuth()
  const desktop = useMediaQuery(DESKTOP)
  const fresh = useFreshStars(sky.stars, user?.id)
  const [selected, setSelected] = useState<string | null>(null)

  const lean = skyLean(sky.meditationMinutes, sky.studyMinutes)
  const litCount = sky.stars.filter((s) => s.state === 'lit').length
  const star = selected ? sky.stars.find((s) => s.id === selected) ?? null : null
  const parent = star?.parent ? sky.stars.find((s) => s.id === star.parent) ?? null : null
  const copy = star ? starSheet(star, parent, timeZone) : null
  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id))

  const skyLabel = litCount === 0
    ? 'A dark sky: only the heart and a few faint stars waiting to be lit'
    : `Constellation with ${litCount} lit star${litCount === 1 ? '' : 's'}. ${lean.title}`

  const grimoireLink = heart.heart.formed && (
    <Link to="/grimoire" className={styles.grimoireLink}>
      <Icon name="study" size={18} />
      Open the Grimoire
    </Link>
  )

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Constellation</h1>
      <div className={styles.layout}>
        <div className={styles.skyWrap}>
          <Sky
            stars={sky.stars}
            ratio={lean.ratio}
            heartFormed={heart.heart.formed}
            variant={variantFor(heart.level, profile?.mage)}
            selected={selected}
            onSelect={toggle}
            fresh={fresh}
            label={skyLabel}
          />
        </div>

        <aside className={styles.panel}>
          {desktop && copy ? (
            <div className={styles.panelDetail} aria-live="polite">
              <div className={styles.panelHead}>
                <p className={`label ${styles.eyebrow}`}>{copy.eyebrow}</p>
                <button type="button" className={styles.close} aria-label="Close" onClick={() => setSelected(null)}>
                  <Icon name="close" size={20} />
                </button>
              </div>
              <h2 className={styles.panelTitle}>{copy.title}</h2>
              <StarDetail copy={copy} lit={star!.state === 'lit'} />
            </div>
          ) : (
            <>
              <p className={`label ${styles.eyebrow} ${styles.desktopOnly}`}>Constellation</p>
              <h2 className={`${styles.panelTitle} ${styles.desktopOnly}`}>Your sky</h2>
              <p className={`moment ${styles.leanTitle}`}>{lean.title}</p>
              <p className={styles.leanBody}>{lean.body}</p>
              {desktop && (
                <>
                  <p className={`label ${styles.eyebrow}`}>How it fills</p>
                  <dl className={styles.fills}>
                    {HOW_IT_FILLS.map((f) => (
                      <div key={f.name}><dt>{f.name}</dt><dd>{f.text}</dd></div>
                    ))}
                  </dl>
                  <ul className={styles.legend} aria-label="Legend">
                    <li><span className={`${styles.dot} ${styles.dotLit}`} />Lit</li>
                    <li><span className={`${styles.dot} ${styles.dotNext}`} />Next</li>
                    <li><span className={`${styles.dot} ${styles.dotDistant}`} />Distant</li>
                  </ul>
                </>
              )}
              <p className={styles.hint}>{desktop ? 'Select a star to read it.' : 'Tap a star to read it'}</p>
            </>
          )}
          {grimoireLink}
        </aside>
      </div>

      {!desktop && copy && star && (
        <Sheet eyebrow={copy.eyebrow} title={copy.title} onClose={() => setSelected(null)}>
          <StarDetail copy={copy} lit={star.state === 'lit'} />
        </Sheet>
      )}
    </div>
  )
}

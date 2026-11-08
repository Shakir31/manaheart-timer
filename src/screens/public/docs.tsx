// The Guide, Privacy and Terms pages, read straight from /docs so the text lives in one place.
import guideSource from '../../../docs/guide.md?raw'
import privacySource from '../../../docs/privacy.md?raw'
import termsSource from '../../../docs/terms.md?raw'
import { parseDoc, type Inline } from '../../content/markdown'
import { Heart } from '../../heart/Heart'
import type { HeartModel } from '../../heart/heartModel'
import { DocPage } from './DocPage'
import styles from './Public.module.css'

const GUIDE = parseDoc(guideSource)
const PRIVACY = parseDoc(privacySource)
const TERMS = parseDoc(termsSource)

// Small decorative hearts: a just-formed heart, and a denser one for ranks.
const SMALL_HEART: HeartModel = { phase: 'heart', dense: false, rings: [], label: '' }
const DENSE_HEART: HeartModel = { phase: 'heart', dense: true, rings: [], label: '' }

function Ring({ kind }: { kind: 'stable' | 'unstable' | 'forming' }) {
  const dash = kind === 'unstable' ? '4 3' : kind === 'forming' ? '20 60' : undefined
  return (
    <svg width="26" height="14" viewBox="0 0 26 14" className={styles.ring}>
      <ellipse cx="13" cy="7" rx="11" ry="4.5" fill="none" stroke="var(--mana)" strokeWidth="1.3" strokeDasharray={dash} opacity={kind === 'stable' ? 1 : 0.7} />
    </svg>
  )
}

function guideArt(id: string) {
  switch (id) {
    case 'the-heart': return <Heart model={SMALL_HEART} decorative pulse="slow" />
    case 'circles': return <Ring kind="stable" />
    case 'condensing-and-ranks': return <Heart model={DENSE_HEART} decorative pulse="slow" />
    case 'the-constellation':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M12 3l1.6 7.4L21 12l-7.4 1.6L12 21l-1.6-7.4L3 12l7.4-1.6z" fill="var(--core)" />
        </svg>
      )
    default: return null
  }
}

/** Guide list items that describe a circle state get a matching ring. */
function circleMark(item: Inline[]) {
  const word = item.find((c) => c.type === 'strong')?.text
  return word === 'stable' || word === 'unstable' || word === 'forming' ? <Ring kind={word} /> : null
}

export function GuideContent() {
  return <DocPage doc={GUIDE} illustration={guideArt} itemMark={circleMark} />
}
export function PrivacyContent() {
  return <DocPage doc={PRIVACY} />
}
export function TermsContent() {
  return <DocPage doc={TERMS} />
}

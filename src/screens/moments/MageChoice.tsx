import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { MAGES, mageName } from '../../copy/mages'
import { useManaData } from '../../data/context'
import type { Mage } from '../../data/types'
import { demoHeart } from '../../heart/demoHearts'
import { Heart } from '../../heart/Heart'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { useToast } from '../../ui/toast/context'
import styles from './MageChoice.module.css'

const PREVIEW = demoHeart('oneCircle')

/** Accent per path; the name uses the path's pale core colour. */
const ACCENT: Record<Mage, CSSProperties> = {
  elemental: { '--accent': 'var(--elemental-ring)', '--accent-name': 'var(--elemental-core)' } as CSSProperties,
  arcane: { '--accent': 'var(--arcane-ring)', '--accent-name': 'var(--arcane-core)' } as CSSProperties,
  spirit: { '--accent': 'var(--spirit-rune)', '--accent-name': 'var(--spirit-core)' } as CSSProperties,
}

/**
 * Choose a mage path, then confirm it. Shown once after the first circle forms, and
 * again from Settings to change it (`changing`).
 */
export function MageChoice() {
  const { profile, updateProfile } = useManaData()
  const toast = useToast()
  const navigate = useNavigate()
  const current = profile?.mage ?? null
  const changing = current !== null
  const [selected, setSelected] = useState<Mage | null>(current)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const confirm = async () => {
    if (!selected || saving) return
    if (selected === current) return navigate('/settings', { replace: true })
    setSaving(true)
    try {
      await updateProfile({ mage: selected })
      navigate(changing ? '/settings' : '/', { replace: true })
    } catch {
      toast.show({ message: "The path couldn't be saved, so try again.", tone: 'error' })
      setSaving(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + MAGES.length) % MAGES.length
    setSelected(MAGES[next].id)
    refs.current[next]?.focus()
  }

  if (confirming && selected) {
    const path = MAGES.find((m) => m.id === selected)!
    return (
      <div className={styles.page}>
        <div className={styles.confirm}>
          <button type="button" className={styles.back} aria-label="Back to choices" onClick={() => setConfirming(false)}>
            <Icon name="back" />
          </button>
          <p className={`label ${styles.eyebrow}`}>The {path.name} path</p>
          <div className={styles.confirmHeart}>
            <Heart model={PREVIEW} variant={selected} decorative />
          </div>
          <h1 className={styles.confirmTitle}>Walk the {path.name} path?</h1>
          <p className={styles.lede}>{path.change}, and progress stays exactly as it is.</p>
          <p className={styles.note}>
            <Icon name="settings" size={16} />
            You can change this later in Settings
          </p>
          {/* Arcane's confirm is the one control that takes its path's colour (README › Colour). */}
          <div className={styles.confirmActions} style={selected === 'arcane' ? ({ '--primary': 'var(--arcane-primary)', '--primary-hover': 'var(--arcane-core)' } as CSSProperties) : undefined}>
            <Button block onClick={confirm} disabled={saving} aria-busy={saving}>{saving ? 'Saving' : 'Confirm'}</Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>Choose again</Button>
          </div>
        </div>
      </div>
    )
  }

  const tabbable = Math.max(0, MAGES.findIndex((m) => m.id === selected))
  return (
    <div className={styles.page}>
      <div className={styles.choose}>
        {changing && (
          <button type="button" className={styles.back} aria-label="Back to Settings" onClick={() => navigate('/settings', { replace: true })}>
            <Icon name="back" />
          </button>
        )}
        <header className={styles.header}>
          <p className={`label ${styles.eyebrow}`}>{changing ? 'Your path' : 'Your first circle has formed'}</p>
          <h1 className={styles.title}>Choose your path</h1>
          <p className={styles.lede}>It shapes how the heart and circles look, and it can be changed later in Settings.</p>
        </header>

        <div role="radiogroup" aria-label="Mage aesthetic" className={styles.options}>
          {MAGES.map((m, i) => (
            <button
              key={m.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected === m.id}
              tabIndex={i === tabbable ? 0 : -1}
              className={selected === m.id ? `${styles.option} ${styles.optionOn}` : styles.option}
              style={ACCENT[m.id]}
              onClick={() => setSelected(m.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className={styles.preview}><Heart model={PREVIEW} variant={m.id} decorative /></span>
              <span className={styles.optionText}>
                <span className={styles.optionName}>{m.name}</span>
                <span className={styles.optionBlurb}>{m.blurb}</span>
              </span>
              <span className={styles.radio} aria-hidden="true" />
            </button>
          ))}
        </div>

        <Button className={styles.continue} block disabled={!selected} onClick={() => setConfirming(true)}>
          {selected ? `Continue with ${mageName(selected)}` : 'Choose a path'}
        </Button>
      </div>
    </div>
  )
}

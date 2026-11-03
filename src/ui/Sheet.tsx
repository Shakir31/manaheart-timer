import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import styles from './Sheet.module.css'

interface Props {
  title: string
  subtitle?: string
  onClose(): void
  children: ReactNode
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])'

/**
 * Bottom sheet below 640px, centred modal above (Sheet spec). Traps focus, closes
 * on Esc or scrim tap, and returns focus to whatever opened it.
 */
export function Sheet({ title, subtitle, onClose, children }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const node = panel.current!
    node.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    const scrollLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = scrollLock
      opener?.focus?.()
    }
  }, [])

  return createPortal(
    <div className={styles.layer}>
      <div className={styles.scrim} onClick={() => onCloseRef.current()} data-testid="sheet-scrim" />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.panel}>
        <div className={styles.grabber} aria-hidden="true" />
        <div className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} aria-label="Close" onClick={() => onCloseRef.current()}>
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

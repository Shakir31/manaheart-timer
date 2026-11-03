import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import styles from './ConfirmDialog.module.css'

interface Props {
  title: string
  body: string
  /** The safe choice; gets initial focus. */
  cancelLabel: string
  confirmLabel: string
  busy?: boolean
  onCancel(): void
  onConfirm(): void
}

/** Asks before anything irreversible (ConfirmDialog spec). Destructive button on the right. */
export function ConfirmDialog({ title, body, cancelLabel, confirmLabel, busy, onCancel, onConfirm }: Props) {
  const titleId = useId()
  const bodyId = useId()
  const safe = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(onCancel)
  useEffect(() => {
    cancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    safe.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        cancelRef.current()
      }
      if (e.key === 'Tab') {
        const buttons = [...panel.current!.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    // Capture so Escape closes this dialog, not a sheet underneath it.
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      opener?.focus?.()
    }
  }, [])

  return createPortal(
    <div className={styles.layer}>
      <div className={styles.scrim} onClick={() => cancelRef.current()} />
      <div ref={panel} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} className={styles.dialog}>
        <span className={styles.disc} aria-hidden="true"><Icon name="delete" size={20} /></span>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <p id={bodyId} className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <button ref={safe} type="button" className={styles.safe} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={styles.danger} onClick={onConfirm} disabled={busy} aria-busy={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

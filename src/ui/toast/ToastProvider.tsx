import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../Icon'
import { ToastContext, type ToastOptions, type ToastValue } from './context'
import styles from './Toast.module.css'

const ICONS: Record<NonNullable<ToastOptions['tone']>, IconName> = {
  neutral: 'check',
  success: 'check',
  error: 'alert',
}

interface Current extends ToastOptions {
  key: number
}

/** One toast at a time, bottom centre (Toast spec). A new toast replaces the old one. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Current | null>(null)
  const [held, setHeld] = useState(false)
  const counter = useRef(0)

  const dismiss = useCallback(() => setToast(null), [])
  const show = useCallback((options: ToastOptions) => {
    counter.current += 1
    setToast({ ...options, key: counter.current })
  }, [])

  // Auto-dismiss, paused while the toast is hovered or focused.
  useEffect(() => {
    if (!toast || held) return
    const id = window.setTimeout(() => setToast(null), toast.duration ?? 4000)
    return () => window.clearTimeout(id)
  }, [toast, held])

  const value = useMemo<ToastValue>(() => ({ show, dismiss }), [show, dismiss])
  const tone = toast?.tone ?? 'neutral'

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* The live regions always exist so screen readers announce new toasts. */}
      <div className={styles.region} role="status" aria-live="polite">
        {toast && tone !== 'error' && <ToastBody toast={toast} onHold={setHeld} onDismiss={dismiss} />}
      </div>
      <div className={styles.region} role="alert">
        {toast && tone === 'error' && <ToastBody toast={toast} onHold={setHeld} onDismiss={dismiss} />}
      </div>
    </ToastContext.Provider>
  )
}

function ToastBody({ toast, onHold, onDismiss }: { toast: Current; onHold(held: boolean): void; onDismiss(): void }) {
  const tone = toast.tone ?? 'neutral'
  return (
    <div
      key={toast.key}
      className={`${styles.toast} ${styles[tone]}`}
      onMouseEnter={() => onHold(true)}
      onMouseLeave={() => onHold(false)}
      onFocus={() => onHold(true)}
      onBlur={() => onHold(false)}
    >
      <Icon name={ICONS[tone]} size={18} className={styles.icon} />
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            toast.action!.onAction()
            onDismiss()
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}

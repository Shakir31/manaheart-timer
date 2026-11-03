import { createContext, useContext } from 'react'

export type ToastTone = 'neutral' | 'success' | 'error'

export interface ToastOptions {
  message: string
  tone?: ToastTone
  /** One optional text action, e.g. "Undo" or "Retry". */
  action?: { label: string; onAction(): void }
  /** ms; default 4000. Paused while hovered or focused. */
  duration?: number
}

export interface ToastValue {
  show(options: ToastOptions): void
  dismiss(): void
}

export const ToastContext = createContext<ToastValue | null>(null)

export function useToast(): ToastValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside <ToastProvider>')
  return value
}

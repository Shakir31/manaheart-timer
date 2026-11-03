import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Full width (the mobile primary button). */
  block?: boolean
}

export function Button({ variant = 'primary', block, className, type = 'button', ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], block && styles.block, className].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...rest} />
}

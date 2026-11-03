import { useId, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Icon } from './Icon'
import styles from './TextInput.module.css'

interface FieldProps {
  label: string
  optional?: boolean
  /** One line saying what to do; shown below and tied with aria-describedby. */
  error?: string | null
  /** Text right of the label (e.g. "Forgot password?" on desktop). */
  aside?: React.ReactNode
}

function Label({ id, label, optional, aside }: { id: string; label: string; optional?: boolean; aside?: React.ReactNode }) {
  return (
    <div className={styles.labelRow}>
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className={styles.optional}> · optional</span>}
      </label>
      {aside}
    </div>
  )
}

type InputProps = FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>

/** Single-line field with an uppercase label above (TextInput spec). Passwords get a show toggle. */
export function TextInput({ label, optional, error, aside, type = 'text', className, ...rest }: InputProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <Label id={id} label={label} optional={optional} aside={aside} />
      <div className={styles.control}>
        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          className={[styles.input, error && styles.invalid, isPassword && styles.withToggle].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            onClick={() => setShown((v) => !v)}
          >
            <Icon name={shown ? 'hide' : 'show'} size={20} />
          </button>
        )}
      </div>
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </div>
  )
}

type AreaProps = FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'value'> & { value: string }

/** Note field: 2–3 rows; the character count appears once something is typed. */
export function TextArea({ label, optional, error, aside, maxLength, value, className, ...rest }: AreaProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <Label id={id} label={label} optional={optional} aside={aside} />
      <textarea
        id={id}
        rows={2}
        maxLength={maxLength}
        value={value}
        className={[styles.input, styles.textarea, error && styles.invalid].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {maxLength && value.length > 0 && (
        <p className={styles.count} aria-live="polite">{value.length} / {maxLength}</p>
      )}
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </div>
  )
}

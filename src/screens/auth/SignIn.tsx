import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/context'
import { authErrorMessage, emailError, passwordError } from '../../auth/messages'
import { Button } from '../../ui/Button'
import { TextInput } from '../../ui/TextInput'
import { DESKTOP, useMediaQuery } from '../../ui/useMediaQuery'
import { AuthLayout } from './AuthLayout'
import styles from './Auth.module.css'

type Mode = 'signin' | 'create' | 'forgot'

export function SignIn() {
  const { signIn, signUp, resetPassword } = useAuth()
  const desktop = useMediaQuery(DESKTOP)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({})
  const [problem, setProblem] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setErrors({})
    setProblem(null)
    setNotice(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = { email: emailError(email), password: mode === 'forgot' ? null : passwordError(password) }
    setErrors(found)
    setProblem(null)
    setNotice(null)
    if (found.email || found.password) return

    setBusy(true)
    try {
      if (mode === 'signin') await signIn(email, password)
      else if (mode === 'create') {
        const { needsConfirmation } = await signUp(email, password)
        if (needsConfirmation) setNotice('Check the inbox to confirm the account, then sign in.')
      } else {
        await resetPassword(email)
        setNotice('If an account exists for that email, a reset link is on its way.')
      }
    } catch (err) {
      setProblem(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const forgot = (
    <button type="button" className={styles.forgotInline} onClick={() => switchMode('forgot')}>
      Forgot password?
    </button>
  )

  if (mode === 'forgot') {
    return (
      <AuthLayout>
        <form className={styles.form} onSubmit={submit} noValidate aria-label="Reset your password">
          <h2 className={styles.heading}>Reset your password</h2>
          <p className={styles.lede}>A link to set a new one will arrive by email.</p>
          <TextInput label="Email" type="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          {problem && <p role="alert" className={styles.problem}>{problem}</p>}
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          <Button type="submit" block disabled={busy} aria-busy={busy}>{busy ? 'Sending' : 'Send reset link'}</Button>
          <Button variant="ghost" className={styles.secondary} onClick={() => switchMode('signin')}>Back to sign in</Button>
        </form>
      </AuthLayout>
    )
  }

  const creating = mode === 'create'
  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={submit} noValidate aria-label={creating ? 'Create account' : 'Sign in'}>
        <div role="tablist" aria-label="Account" className={styles.tabs}>
          {(['signin', 'create'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={mode === m ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              onClick={() => switchMode(m)}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
        <TextInput label="Email" type="email" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextInput label="Password" type="password" autoComplete={creating ? 'new-password' : 'current-password'}
          value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password}
          aside={!creating && desktop ? forgot : undefined} />
        {problem && <p role="alert" className={styles.problem}>{problem}</p>}
        {notice && <p role="status" className={styles.notice}>{notice}</p>}
        <Button type="submit" block disabled={busy} aria-busy={busy}>
          {busy ? (creating ? 'Creating' : 'Signing in') : creating ? 'Create account' : 'Sign in'}
        </Button>
        {!creating && !desktop && (
          <Button variant="ghost" className={styles.secondary} onClick={() => switchMode('forgot')}>Forgot password?</Button>
        )}
      </form>
    </AuthLayout>
  )
}

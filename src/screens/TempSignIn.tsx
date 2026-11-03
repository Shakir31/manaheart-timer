// TEMPORARY sign-in until Phase 4 builds the designed Sign in screen.
import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { Button } from '../ui/Button'
import styles from './Placeholders.module.css'

const input = {
  height: 48,
  padding: '0 14px',
  borderRadius: 'var(--radius-input)',
  border: '1px solid var(--control-edge)',
  background: 'var(--page)',
  width: '100%',
} as const

export function TempSignIn() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const run = async (mode: 'in' | 'up', e?: FormEvent) => {
    e?.preventDefault()
    setMessage(null)
    try {
      if (mode === 'in') await signIn(email, password)
      else {
        const { needsConfirmation } = await signUp(email, password)
        if (needsConfirmation) setMessage('Check your email to confirm your account, then sign in.')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form className={styles.page} style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-8) var(--space-5)' }} onSubmit={(e) => run('in', e)}>
      <h1 className="title">Manaheart</h1>
      <input style={input} type="email" placeholder="Email" aria-label="Email" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input style={input} type="password" placeholder="Password (6+ characters)" aria-label="Password"
        autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <Button type="submit" block>Sign in</Button>
      <Button variant="ghost" onClick={() => run('up')}>Create account</Button>
      {message && <p className={styles.note}>{message}</p>}
    </form>
  )
}

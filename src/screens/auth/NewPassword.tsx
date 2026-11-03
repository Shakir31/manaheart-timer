import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/context'
import { authErrorMessage, passwordError } from '../../auth/messages'
import { Button } from '../../ui/Button'
import { TextInput } from '../../ui/TextInput'
import { AuthLayout } from './AuthLayout'
import styles from './Auth.module.css'

/** Shown after following a password-reset email link. */
export function NewPassword() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = passwordError(password)
    setError(found)
    setProblem(null)
    if (found) return
    setBusy(true)
    try {
      await updatePassword(password)
    } catch (err) {
      setProblem(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={submit} noValidate aria-label="Set a new password">
        <h2 className={styles.heading}>Set a new password</h2>
        <TextInput label="New password" type="password" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        {problem && <p role="alert" className={styles.problem}>{problem}</p>}
        <Button type="submit" block disabled={busy} aria-busy={busy}>{busy ? 'Saving' : 'Save password'}</Button>
      </form>
    </AuthLayout>
  )
}

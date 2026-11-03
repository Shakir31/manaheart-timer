// TEMPORARY Phase 2 check page: sign in, log test sessions, see the computed heart.
// Replaced by the real screens in Phases 3–4. Deliberately unstyled beyond tokens.
import { useState, type CSSProperties, type FormEvent } from 'react'
import { useAuth } from './auth/context'
import { useManaData } from './data/context'
import { useHeartState } from './data/useHeartState'
import { circleOrdinal, formatDuration, formatRank, type Category } from './engine'

const page: CSSProperties = {
  maxWidth: 520,
  margin: '0 auto',
  padding: 'var(--space-6) var(--space-5)',
  display: 'grid',
  gap: 'var(--space-4)',
}
const button: CSSProperties = {
  height: 44,
  padding: '0 var(--space-4)',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--control-edge)',
  background: 'transparent',
  cursor: 'pointer',
}
const input: CSSProperties = {
  height: 44,
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius-input)',
  border: '1px solid var(--control-edge)',
  background: 'var(--page)',
}

export default function App() {
  const { loading, user } = useAuth()
  if (loading) return null
  return user ? <Signedin /> : <SignIn />
}

function SignIn() {
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
    <form style={page} onSubmit={(e) => run('in', e)}>
      <p className="label" style={{ color: 'var(--text-secondary)' }}>Phase 2 check</p>
      <h1 className="title">Manaheart</h1>
      <input style={input} type="email" placeholder="Email" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input style={input} type="password" placeholder="Password (6+ characters)"
        autoComplete="current-password" value={password}
        onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button style={button} type="submit">Sign in</button>
        <button style={button} type="button" onClick={() => run('up')}>Create account</button>
      </div>
      {message && <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>}
    </form>
  )
}

function Signedin() {
  const { user, signOut } = useAuth()
  const data = useManaData()
  const heart = useHeartState()
  const [message, setMessage] = useState<string | null>(null)

  const attempt = async (fn: () => Promise<unknown>) => {
    setMessage(null)
    try {
      await fn()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }
  const log = (category: Category, minutes: number) =>
    attempt(() => data.addSession({ category, durationMinutes: minutes, source: 'manual' }))

  if (data.status === 'loading' || data.status === 'idle') return <main style={page}>Loading…</main>
  if (data.status === 'error') {
    return (
      <main style={page}>
        <p style={{ color: 'var(--error)' }}>Could not load data: {data.error}</p>
        <p className="body-sm">If this says a table does not exist, run supabase/migrations/0001_init.sql.</p>
        <button style={button} onClick={() => data.reload()}>Retry</button>
      </main>
    )
  }

  const forming = heart.circles.find((c) => c.status === 'forming')
  return (
    <main style={page}>
      <p className="label" style={{ color: 'var(--text-secondary)' }}>
        {heart.heart.formed ? formatRank(heart.level, heart.rank) : 'Mana gathering'}
      </p>
      <h1 className="display">{heart.rank ?? 'No heart yet'}</h1>
      <p className="moment" style={{ color: 'var(--text-secondary)' }}>
        {heart.heart.formed
          ? `${forming ? `${circleOrdinal(forming.index)} circle forming` : 'All circles formed'} · ${formatDuration(heart.levelProgress.minutes)} / ${formatDuration(heart.levelProgress.requiredMinutes)}`
          : `${formatDuration(heart.heart.minutes)} / ${formatDuration(heart.heart.requiredMinutes)} until your heart forms`}
      </p>
      <p className="body-sm">
        Circles: {heart.stableCount} stable · {heart.unstableCount} unstable · Rhythm{' '}
        {heart.rhythm.practicedInLast7} of 7 days · Reserve {formatDuration(heart.reserveMinutes)}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <button style={button} onClick={() => log('meditation', 30)}>+30 min meditation</button>
        <button style={button} onClick={() => log('study', 120)}>+2h study</button>
        {heart.canCondense && (
          <button style={button} onClick={() => attempt(data.condense)}>Condense</button>
        )}
      </div>
      {message && <p className="body-sm" style={{ color: 'var(--error)' }}>{message}</p>}

      <h2 className="heading">Sessions ({data.sessions.length})</h2>
      {[...data.sessions].reverse().slice(0, 8).map((s) => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="body-sm">
            {s.category === 'meditation' ? 'Meditation' : 'Study'} · {formatDuration(s.durationMinutes)} ·{' '}
            {new Date(s.endedAt).toLocaleString()}
          </span>
          <button style={button} onClick={() => attempt(() => data.deleteSession(s.id))}>Delete</button>
        </div>
      ))}

      <p className="body-sm" style={{ color: 'var(--text-tertiary)' }}>
        Signed in as {user?.email} · time zone {data.timeZone}
      </p>
      <button style={button} onClick={() => attempt(signOut)}>Sign out</button>
    </main>
  )
}

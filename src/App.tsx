import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './app/AppShell'
import { useAuth } from './auth/context'
import { useManaData } from './data/context'
import { Button } from './ui/Button'
import { NewPassword } from './screens/auth/NewPassword'
import { SignIn } from './screens/auth/SignIn'
import { Complete } from './screens/Complete'
import { Focus } from './screens/Focus'
import { Home } from './screens/Home'
import { Sessions } from './screens/Sessions'
import { Settings } from './screens/Settings'
import { Welcome } from './screens/Welcome'

export default function App() {
  const { loading, user, recovering } = useAuth()
  const data = useManaData()

  if (loading) return null
  if (recovering && user) return <NewPassword />
  if (!user) return <SignIn />
  if (data.status === 'error') {
    return (
      <div style={{ padding: 'var(--space-8) var(--space-5)', textAlign: 'center', display: 'grid', gap: 'var(--space-4)', justifyItems: 'center' }}>
        <p role="alert" style={{ color: 'var(--error)', margin: 0 }}>Your heart could not be loaded. Check your connection.</p>
        <Button variant="outline" onClick={() => data.reload()}>Try again</Button>
      </div>
    )
  }
  if (data.status !== 'ready') return null
  if (data.profile && !data.profile.welcomeSeenAt) return <Welcome />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="focus" element={<Focus />} />
      <Route path="complete" element={<Complete />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

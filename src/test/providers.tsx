// Test helpers: wrap components in a fake signed-in user plus the real data provider
// (whose api module the test mocks).
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { vi } from 'vitest'
import { AuthContext, type AuthValue } from '../auth/context'
import { ManaDataProvider } from '../data/ManaDataProvider'

export function fakeAuth(userId: string | null = 'user-1'): AuthValue {
  const user = userId ? ({ id: userId, email: 'mage@example.com' } as User) : null
  return {
    loading: false,
    session: user ? ({ user } as Session) : null,
    user,
    signIn: vi.fn(async () => {}),
    signUp: vi.fn(async () => ({ needsConfirmation: false })),
    signOut: vi.fn(async () => {}),
  }
}

export function withProviders(auth: AuthValue = fakeAuth()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={auth}>
        <ManaDataProvider>{children}</ManaDataProvider>
      </AuthContext.Provider>
    )
  }
}

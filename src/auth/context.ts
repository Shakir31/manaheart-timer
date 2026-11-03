import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthValue {
  /** True until the stored session has been checked. */
  loading: boolean
  session: Session | null
  user: User | null
  signIn(email: string, password: string): Promise<void>
  /** Resolves to true if the user must confirm their email before signing in. */
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>
  signOut(): Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

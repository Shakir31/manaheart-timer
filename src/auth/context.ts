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
  /** Email a link to set a new password. */
  resetPassword(email: string): Promise<void>
  /** Set a new password for the signed-in user. */
  updatePassword(password: string): Promise<void>
  /** True after arriving from a password-reset email, until a new password is set. */
  recovering: boolean
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

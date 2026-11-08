import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { forgetUser } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthValue } from './context'
import { readSignUp } from './signUpResult'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      },
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
          password,
          email: email.trim(),
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        return readSignUp(data)
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
      async deleteAccount() {
        const id = session?.user.id
        const { error } = await supabase.rpc('delete_account')
        if (error) throw error
        if (id) forgetUser(id)
        // The account no longer exists, so only the local session needs clearing.
        await supabase.auth.signOut({ scope: 'local' })
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setRecovering(false)
      },
      recovering,
    }),
    [loading, session, recovering],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

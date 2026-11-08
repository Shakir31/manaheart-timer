import type { Session, User } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './messages'
import { EmailTakenError, readSignUp } from './signUpResult'

const user = (identities: unknown[] | undefined) => ({ id: 'u', identities }) as unknown as User
const session = {} as Session

describe('readSignUp', () => {
  it('signs straight in when confirmation is off', () => {
    expect(readSignUp({ user: user([{}]), session })).toEqual({ needsConfirmation: false })
  })

  it('asks to confirm the email when there is no session yet', () => {
    expect(readSignUp({ user: user([{}]), session: null })).toEqual({ needsConfirmation: true })
  })

  it('reports an existing email even when Supabase hides it (confirmation on)', () => {
    expect(() => readSignUp({ user: user([]), session: null })).toThrow(EmailTakenError)
    try {
      readSignUp({ user: user([]), session: null })
    } catch (e) {
      expect(authErrorMessage(e)).toBe('An account with this email already exists, so sign in instead.')
    }
  })

  it('does not misread a user without an identities list', () => {
    expect(readSignUp({ user: user(undefined), session: null })).toEqual({ needsConfirmation: true })
  })
})

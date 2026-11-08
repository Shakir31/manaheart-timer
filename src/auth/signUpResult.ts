import type { Session, User } from '@supabase/supabase-js'

/** Thrown when the email already has an account (handled by authErrorMessage). */
export class EmailTakenError extends Error {
  readonly code = 'user_already_exists'
  constructor() {
    super('An account with this email already exists')
  }
}

/**
 * Read Supabase's sign-up response. With email confirmation on, Supabase does not
 * report an existing email as an error (to avoid leaking who has an account); it
 * returns a user with no identities instead. Treat that the same as the explicit error.
 */
export function readSignUp(data: { user: User | null; session: Session | null }): { needsConfirmation: boolean } {
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new EmailTakenError()
  }
  return { needsConfirmation: !data.session }
}

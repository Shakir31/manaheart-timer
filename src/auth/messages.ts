// Plain-language auth messages that say what to do (TextInput spec voice).

export const MIN_PASSWORD = 6

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function emailError(value: string): string | null {
  if (!value.trim()) return 'Enter your email address'
  return isEmail(value) ? null : 'Enter a full email address'
}

export function passwordError(value: string): string | null {
  if (!value) return 'Enter your password'
  return value.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : null
}

/** Turn a Supabase auth error into one calm sentence. */
export function authErrorMessage(error: unknown): string {
  const e = error as { code?: string; message?: string; name?: string } | null
  switch (e?.code) {
    case 'invalid_credentials':
      return "That email and password don't match. Try again."
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Sign in instead.'
    case 'weak_password':
      return `Choose a stronger password, at least ${MIN_PASSWORD} characters.`
    case 'same_password':
      return 'Choose a password different from your current one.'
    case 'email_not_confirmed':
      return 'Confirm your email first, then sign in.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a minute and try again.'
  }
  if (e?.name === 'TypeError' || e?.name === 'AuthRetryableFetchError' || /fetch|network/i.test(e?.message ?? '')) {
    return "Can't reach Manaheart. Check your connection and try again."
  }
  return 'Something went wrong. Try again.'
}

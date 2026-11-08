import { describe, expect, it } from 'vitest'
import { authErrorMessage, emailError, isEmail, passwordError } from './messages'

describe('validation', () => {
  it('checks emails', () => {
    expect(isEmail('you@example.com')).toBe(true)
    expect(isEmail('you@example')).toBe(false)
    expect(emailError('')).toBe('Enter your email address')
    expect(emailError('you@')).toBe('Enter a full email address')
    expect(emailError(' you@example.com ')).toBeNull()
  })

  it('checks passwords', () => {
    expect(passwordError('')).toBe('Enter your password')
    expect(passwordError('12345')).toBe('Use at least 6 characters')
    expect(passwordError('123456')).toBeNull()
  })
})

describe('authErrorMessage', () => {
  it('maps known Supabase codes', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toMatch(/don't match/)
    expect(authErrorMessage({ code: 'user_already_exists' })).toMatch(/sign in instead/)
    expect(authErrorMessage({ code: 'over_email_send_rate_limit' })).toMatch(/Too many attempts/)
  })

  it('recognises network failures', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toMatch(/connection/)
  })

  it('falls back to a calm default', () => {
    expect(authErrorMessage({ code: 'something_new' })).toBe('Something went wrong, please try again.')
    expect(authErrorMessage(null)).toBe('Something went wrong, please try again.')
  })
})

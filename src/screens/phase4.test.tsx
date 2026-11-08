import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile, SessionRecord } from '../data/types'

vi.mock('../data/api', () => ({
  fetchAllSessions: vi.fn(),
  fetchCondensations: vi.fn(),
  fetchProfile: vi.fn(),
  insertSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  insertCondensation: vi.fn(),
  updateProfile: vi.fn(),
}))

import * as api from '../data/api'
import { fakeAuth } from '../test/providers'
import { renderApp } from '../test/renderApp'
import { setViewport } from '../test/viewport'

const mocked = vi.mocked(api)
const NOW = new Date('2026-11-03T20:00:00Z')
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

const baseProfile: Profile = {
  id: 'user-1', mage: null, timeZone: tz, defaultDurationMinutes: 25, reminderEnabled: false,
  reminderTime: null, welcomeSeenAt: '2026-11-01T00:00:00Z', milestonesSeenAt: null,
}
const at = (daysAgo: number, hour: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 30, 0, 0)
  return d.toISOString()
}
const study: SessionRecord = { id: 's1', category: 'study', durationMinutes: 45, endedAt: at(0, 18), note: 'Chapter 4, spaced recall', source: 'manual' }
const med: SessionRecord = { id: 's2', category: 'meditation', durationMinutes: 20, endedAt: at(1, 7), note: null, source: 'timer' }

function setup({ sessions = [] as SessionRecord[], profile = baseProfile } = {}) {
  mocked.fetchAllSessions.mockResolvedValue(sessions)
  mocked.fetchProfile.mockResolvedValue(profile)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  mocked.fetchCondensations.mockResolvedValue([])
  mocked.insertSession.mockResolvedValue()
  mocked.updateSession.mockResolvedValue()
  mocked.deleteSession.mockResolvedValue()
  mocked.updateProfile.mockResolvedValue()
  setup()
})
afterEach(() => vi.useRealTimers())

describe('Sign in', () => {
  const signedOut = () => fakeAuth(null)

  it('checks the fields before calling Supabase', async () => {
    const user = userEvent.setup()
    const auth = signedOut()
    renderApp('/signin', undefined, auth)
    await user.type(screen.getByLabelText('Email'), 'you@')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a full email address')
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password')
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it('signs in, and explains a wrong password', async () => {
    const user = userEvent.setup()
    const auth = signedOut()
    vi.mocked(auth.signIn).mockRejectedValueOnce({ code: 'invalid_credentials' })
    renderApp('/signin', undefined, auth)
    await user.type(screen.getByLabelText('Email'), 'you@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(auth.signIn).toHaveBeenCalledWith('you@example.com', 'secret1')
    expect(await screen.findByText(/don't match/)).toHaveAttribute('role', 'alert')
  })

  it('creates an account and asks to confirm email when needed', async () => {
    const user = userEvent.setup()
    const auth = signedOut()
    vi.mocked(auth.signUp).mockResolvedValueOnce({ needsConfirmation: true })
    renderApp('/signin', undefined, auth)
    await user.click(screen.getByRole('tab', { name: 'Create account' }))
    expect(screen.getByRole('tab', { name: 'Create account' })).toHaveAttribute('aria-selected', 'true')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), '123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Use at least 6 characters')
    await user.type(screen.getByLabelText('Password'), '456')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(auth.signUp).toHaveBeenCalledWith('new@example.com', '123456')
    expect(await screen.findByText(/confirm the account/)).toBeInTheDocument()
  })

  it('says when the email already has an account', async () => {
    const user = userEvent.setup()
    const auth = signedOut()
    vi.mocked(auth.signUp).mockRejectedValueOnce({ code: 'user_already_exists' })
    renderApp('/signin', undefined, auth)
    await user.click(screen.getByRole('tab', { name: 'Create account' }))
    await user.type(screen.getByLabelText('Email'), 'taken@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('An account with this email already exists, so sign in instead.')).toHaveAttribute('role', 'alert')
  })

  it('sends a reset link', async () => {
    const user = userEvent.setup()
    const auth = signedOut()
    renderApp('/signin', undefined, auth)
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'you@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(auth.resetPassword).toHaveBeenCalledWith('you@example.com')
    expect(await screen.findByText(/a reset link is on its way/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back to sign in' }))
    expect(screen.getByRole('tab', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('puts "Forgot password?" beside the password label on desktop', () => {
    setViewport('desktop')
    renderApp('/signin', undefined, signedOut())
    const forgot = screen.getByRole('button', { name: 'Forgot password?' })
    expect(forgot.closest('form')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Forgot password?' })).toHaveLength(1)
  })

  it('asks for a new password after a reset link', async () => {
    const user = userEvent.setup()
    const auth = { ...fakeAuth(), recovering: true }
    renderApp('/signin', undefined, auth)
    await user.type(screen.getByLabelText('New password'), 'better-pass')
    await user.click(screen.getByRole('button', { name: 'Save password' }))
    expect(auth.updatePassword).toHaveBeenCalledWith('better-pass')
  })
})

describe('Welcome', () => {
  it('walks through three steps and records that it was seen', async () => {
    const user = userEvent.setup()
    setup({ profile: { ...baseProfile, welcomeSeenAt: null } })
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Time becomes mana' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('heading', { name: 'Circles form around it' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Time becomes mana' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('img', { name: 'Step 3 of 3' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Begin' }))
    expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { welcomeSeenAt: NOW.toISOString() })
    expect(await screen.findByRole('button', { name: 'Begin session' })).toBeInTheDocument()
  })

  it('can be skipped', async () => {
    const user = userEvent.setup()
    setup({ profile: { ...baseProfile, welcomeSeenAt: null } })
    renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Skip' }))
    expect(await screen.findByRole('button', { name: 'Begin session' })).toBeInTheDocument()
  })
})

describe('Sessions', () => {
  it('shows an empty state with a way forward', async () => {
    renderApp('/sessions')
    expect(await screen.findByRole('heading', { name: 'Nothing gathered yet' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Begin session' })).toBeInTheDocument()
  })

  it('groups sessions by day with totals and the week summary', async () => {
    setup({ sessions: [study, med] })
    renderApp('/sessions')
    const today = await screen.findByRole('region', { name: /^Today · / })
    expect(within(today).getByText('45 min', { selector: 'span[class*="dayTotal"]' })).toBeInTheDocument()
    expect(within(today).getByRole('button', { name: /Study, 45 min, ended .*Chapter 4/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^Yesterday · / })).toBeInTheDocument()
    const week = screen.getByRole('region', { name: 'This week' })
    expect(within(week).getByText('1h 05m')).toBeInTheDocument()
    expect(within(week).getByText('20 min')).toBeInTheDocument()
  })

  it('edits a session', async () => {
    const user = userEvent.setup()
    setup({ sessions: [study] })
    renderApp('/sessions')
    await user.click(await screen.findByRole('button', { name: /Study, 45 min/ }))
    const sheet = screen.getByRole('dialog', { name: 'Edit session' })
    expect(within(sheet).getByText(/^Today · ended /)).toBeInTheDocument()
    expect(within(sheet).getByLabelText(/Note/)).toHaveValue('Chapter 4, spaced recall')
    await user.click(within(sheet).getByRole('button', { name: '60 minutes' }))
    await user.click(within(sheet).getByRole('button', { name: 'Save changes' }))
    expect(mocked.updateSession).toHaveBeenCalledWith('s1', { category: 'study', durationMinutes: 60, note: 'Chapter 4, spaced recall' })
    expect(await screen.findByText('Session updated')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Study, 1h, ended/ })).toBeInTheDocument()
  })

  it('closes without saving when nothing changed', async () => {
    const user = userEvent.setup()
    setup({ sessions: [study] })
    renderApp('/sessions')
    await user.click(await screen.findByRole('button', { name: /Study, 45 min/ }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(mocked.updateSession).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('asks before deleting, then offers Undo', async () => {
    const user = userEvent.setup()
    setup({ sessions: [study] })
    renderApp('/sessions')
    await user.click(await screen.findByRole('button', { name: /Study, 45 min/ }))
    await user.click(screen.getByRole('button', { name: 'Delete session' }))

    const confirm = screen.getByRole('alertdialog', { name: 'Delete this session?' })
    expect(confirm).toHaveAccessibleDescription(/45 min of Study from today will be removed/)
    expect(within(confirm).getByRole('button', { name: 'Keep it' })).toHaveFocus()
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }))

    expect(mocked.deleteSession).toHaveBeenCalledWith('s1')
    expect(await screen.findByRole('heading', { name: 'Nothing gathered yet' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(mocked.insertSession).toHaveBeenCalledWith(study)
    expect(await screen.findByRole('button', { name: /Study, 45 min/ })).toBeInTheDocument()
  })

  it('keeps the session when "Keep it" is chosen', async () => {
    const user = userEvent.setup()
    setup({ sessions: [study] })
    renderApp('/sessions')
    await user.click(await screen.findByRole('button', { name: /Study, 45 min/ }))
    await user.click(screen.getByRole('button', { name: 'Delete session' }))
    await user.click(screen.getByRole('button', { name: 'Keep it' }))
    expect(mocked.deleteSession).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Edit session' })).toBeInTheDocument()
  })
})

describe('Settings', () => {
  it('shows the account, locked mage aesthetic, and signs out', async () => {
    const user = userEvent.setup()
    const auth = fakeAuth()
    renderApp('/settings', undefined, auth)
    expect(await screen.findByText('mage@example.com')).toBeInTheDocument()
    expect(screen.getByText('Locked until the first circle forms')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Heart' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(auth.signOut).toHaveBeenCalled()
  })

  it('turns the reminder on at 8:00 pm and changes its time (mobile sheet)', async () => {
    const user = userEvent.setup()
    renderApp('/settings')
    await user.click(await screen.findByRole('switch', { name: 'Daily reminder' }))
    expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { reminderEnabled: true, reminderTime: '20:00:00' })
    await user.click(screen.getByRole('button', { name: /Reminder time\s*8:00 pm/ }))
    const sheet = screen.getByRole('dialog', { name: 'Reminder time' })
    const input = within(sheet).getByLabelText('Time')
    await user.clear(input)
    await user.type(input, '07:15')
    await user.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(mocked.updateProfile).toHaveBeenLastCalledWith('user-1', { reminderTime: '07:15:00' })
    expect(screen.getByRole('button', { name: /Reminder time\s*7:15 am/ })).toBeInTheDocument()
  })

  it('sets the default length with chips on desktop', async () => {
    const user = userEvent.setup()
    setViewport('desktop')
    renderApp('/settings')
    const group = await screen.findByRole('group', { name: 'Default session length' })
    expect(within(group).getByRole('button', { name: '25 minutes' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(group).getByRole('button', { name: '45 minutes' }))
    expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { defaultDurationMinutes: 45 })
  })

  it('exports every session as CSV', async () => {
    const user = userEvent.setup()
    setup({ sessions: [study, med] })
    const createObjectURL = vi.fn(() => 'blob:x')
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderApp('/settings')
    await user.click(await screen.findByRole('button', { name: /Export data/ }))
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(await screen.findByText('2 sessions exported')).toBeInTheDocument()
    click.mockRestore()
  })

  it('changes the password', async () => {
    const user = userEvent.setup()
    const auth = fakeAuth()
    renderApp('/settings', undefined, auth)
    await user.click(await screen.findByRole('button', { name: 'Change password' }))
    await user.type(screen.getByLabelText('New password'), 'new-secret')
    await user.click(screen.getByRole('button', { name: 'Save password' }))
    expect(auth.updatePassword).toHaveBeenCalledWith('new-secret')
    await waitFor(() => expect(screen.getByText('Password changed')).toBeInTheDocument())
  })

  it('unlocks the mage section once a circle has formed', async () => {
    setup({ sessions: [{ ...study, durationMinutes: 300 + 120 }] })
    renderApp('/settings')
    expect(await screen.findByText('Not chosen yet')).toBeInTheDocument()
  })
})

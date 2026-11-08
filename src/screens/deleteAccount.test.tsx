import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '../data/types'

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
import { forgetUser } from '../lib/storage'
import { fakeAuth } from '../test/providers'
import { renderApp } from '../test/renderApp'

const mocked = vi.mocked(api)
const profile: Profile = {
  id: 'user-1', mage: null, timeZone: 'UTC', defaultDurationMinutes: 25, reminderEnabled: false,
  reminderTime: null, welcomeSeenAt: '2026-01-01T00:00:00Z', milestonesSeenAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.resetAllMocks()
  mocked.fetchAllSessions.mockResolvedValue([])
  mocked.fetchCondensations.mockResolvedValue([])
  mocked.fetchProfile.mockResolvedValue(profile)
  mocked.updateProfile.mockResolvedValue()
})

describe('Delete account', () => {
  it('asks first, with the safe choice focused, and does nothing on "Keep it"', async () => {
    const user = userEvent.setup()
    const auth = fakeAuth()
    renderApp('/settings', undefined, auth)
    await user.click(await screen.findByRole('button', { name: 'Delete account' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Delete your account?' })
    expect(dialog).toHaveAccessibleDescription(/can't be undone/)
    expect(within(dialog).getByRole('button', { name: 'Keep it' })).toHaveFocus()
    await user.click(within(dialog).getByRole('button', { name: 'Keep it' }))
    expect(auth.deleteAccount).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('deletes the account after confirming', async () => {
    const user = userEvent.setup()
    const auth = fakeAuth()
    renderApp('/settings', undefined, auth)
    await user.click(await screen.findByRole('button', { name: 'Delete account' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete account' }))
    expect(auth.deleteAccount).toHaveBeenCalledOnce()
    expect(await screen.findByText('The account has been deleted.')).toBeInTheDocument()
  })

  it('says so if deleting fails, and keeps everything', async () => {
    const user = userEvent.setup()
    const auth = fakeAuth()
    vi.mocked(auth.deleteAccount).mockRejectedValueOnce(new Error('offline'))
    renderApp('/settings', undefined, auth)
    await user.click(await screen.findByRole('button', { name: 'Delete account' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete account' }))
    expect(await screen.findByText("The account couldn't be deleted, so try again.")).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('mage@example.com')).toBeInTheDocument()
  })
})

describe('forgetUser', () => {
  it("clears this device's data for the user", () => {
    localStorage.setItem('manaheart.timer.user-1', '{}')
    localStorage.setItem('manaheart.skySeenAt.user-1', '"x"')
    localStorage.setItem('manaheart.lastCategory', '"study"')
    localStorage.setItem('manaheart.timer.user-2', '{}')
    forgetUser('user-1')
    expect(localStorage.getItem('manaheart.timer.user-1')).toBeNull()
    expect(localStorage.getItem('manaheart.skySeenAt.user-1')).toBeNull()
    expect(localStorage.getItem('manaheart.lastCategory')).toBeNull()
    expect(localStorage.getItem('manaheart.timer.user-2')).toBe('{}')
  })
})

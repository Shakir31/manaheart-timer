import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '../../data/types'

vi.mock('../../data/api', () => ({
  fetchAllSessions: vi.fn(),
  fetchCondensations: vi.fn(),
  fetchProfile: vi.fn(),
  insertSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  insertCondensation: vi.fn(),
  updateProfile: vi.fn(),
}))

import * as api from '../../data/api'
import { fakeAuth } from '../../test/providers'
import { renderApp } from '../../test/renderApp'
import { setViewport } from '../../test/viewport'

const mocked = vi.mocked(api)
const signedOut = () => fakeAuth(null)
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

describe('Landing', () => {
  it('greets signed-out visitors with the heart, the three steps and the sky', () => {
    renderApp('/', undefined, signedOut())
    expect(screen.getByRole('heading', { level: 1, name: 'Manaheart' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'A slow ritual in three parts' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Practice gathers into a heart', 'Circles form around it', 'Steady practice, then the next rank',
    ])
    expect(screen.getByRole('img', { name: 'A Constellation sky partly filled in' })).toBeInTheDocument()
    // The landing sky is look-only: no star buttons.
    expect(screen.queryByRole('button', { name: /lit$/ })).toBeNull()
  })

  it('mentions where the idea comes from', () => {
    renderApp('/', undefined, signedOut())
    const origin = screen.getByRole('region', { name: 'Borrowed from the stories' })
    expect(within(origin).getByText(/webnovels and manhwas/)).toBeInTheDocument()
  })

  it('sends "Create account" to sign-up and "Sign in" to sign-in', async () => {
    const user = userEvent.setup()
    renderApp('/', undefined, signedOut())
    await user.click(screen.getAllByRole('link', { name: 'Create account' })[0])
    expect(screen.getByRole('tab', { name: 'Create account' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('link', { name: 'Manaheart' }))
    await user.click(screen.getAllByRole('link', { name: 'Sign in' })[0])
    expect(screen.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true')
  })

  it('links to the Guide, Privacy and Terms in the footer', () => {
    renderApp('/', undefined, signedOut())
    const footer = screen.getByRole('navigation', { name: 'Footer' })
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
    expect(within(footer).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(within(footer).getByRole('link', { name: 'Guide' })).toHaveAttribute('href', '/guide')
  })
})

describe('reading pages', () => {
  it('shows the Guide signed out, with its sections and circle states', () => {
    renderApp('/guide', undefined, signedOut())
    expect(screen.getByRole('heading', { level: 1, name: 'Guide' })).toBeInTheDocument()
    expect(screen.getByText('Last updated 8 November 2026')).toBeInTheDocument()
    const toc = screen.getAllByRole('list').find((l) => within(l).queryByRole('link', { name: 'Circles' }))!
    expect(within(toc).getByRole('link', { name: 'Circles' })).toHaveAttribute('href', '#circles')
    expect(screen.getByRole('region', { name: 'Circles' })).toHaveTextContent('A stable circle turns cleanly and evenly.')
  })

  it('shows Privacy with the real contact address', () => {
    renderApp('/privacy', undefined, signedOut())
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy' })).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: 'manaheart.timer@gmail.com' })
    expect(links[0]).toHaveAttribute('href', 'mailto:manaheart.timer@gmail.com')
  })

  it('turns doc links into app routes', () => {
    renderApp('/terms', undefined, signedOut())
    const inText = screen.getAllByRole('link', { name: 'Privacy' }).find((a) => a.closest('article'))!
    expect(inText).toHaveAttribute('href', '/privacy')
  })

  it('opens from Settings when signed in, with a way back', async () => {
    const user = userEvent.setup()
    renderApp('/settings')
    const about = await screen.findByRole('region', { name: 'About' })
    await user.click(within(about).getByRole('link', { name: /Guide/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Guide' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings')
  })

  it('lists sections in a side column on desktop', () => {
    setViewport('desktop')
    renderApp('/privacy', undefined, signedOut())
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument()
  })
})

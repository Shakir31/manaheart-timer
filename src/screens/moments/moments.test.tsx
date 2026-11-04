import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile, SessionRecord } from '../../data/types'

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
import { renderApp } from '../../test/renderApp'

const mocked = vi.mocked(api)
const NOW = new Date('2026-11-03T20:00:00Z')
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
const YESTERDAY = '2026-11-02T20:00:00Z'

const profile: Profile = {
  id: 'user-1', mage: 'arcane', timeZone: tz, defaultDurationMinutes: 25, reminderEnabled: false,
  reminderTime: null, welcomeSeenAt: '2026-10-01T00:00:00Z', milestonesSeenAt: '2026-10-01T00:00:00Z',
}
const session = (id: string, minutes: number, endedAt: string): SessionRecord => ({
  id, category: 'study', durationMinutes: minutes, endedAt, note: null, source: 'manual',
})
/** 30 min a day for 30 days: five stable circles, ready to condense. */
const ready = Array.from({ length: 30 }, (_, i) =>
  session(`d${i}`, 30, new Date(Date.UTC(2026, 9, 2 + i, 9)).toISOString()))
const seenAll = { ...profile, milestonesSeenAt: NOW.toISOString() }

function setup(sessions: SessionRecord[], p: Profile = profile) {
  mocked.fetchAllSessions.mockResolvedValue(sessions)
  mocked.fetchProfile.mockResolvedValue(p)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  mocked.fetchCondensations.mockResolvedValue([])
  mocked.insertCondensation.mockResolvedValue()
  mocked.updateProfile.mockResolvedValue()
  setup([])
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const reducedMotion = () => {
  const original = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((q: string) =>
    q.includes('reduced-motion') ? ({ ...original(q), matches: true }) : original(q))
}

describe('milestones', () => {
  it('shows each new moment on Home, then records them as seen', async () => {
    const user = userEvent.setup()
    setup([session('a', 420, YESTERDAY)]) // heart + first circle
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Your heart has formed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('heading', { name: 'A circle has formed' })).toBeInTheDocument()
    expect(screen.getByText('Milestone · First circle')).toBeInTheDocument()
    expect(mocked.updateProfile).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Apprentice' })).toBeInTheDocument()
    expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { milestonesSeenAt: YESTERDAY })
  })

  it('waits for Home: nothing interrupts other pages', async () => {
    setup([session('a', 420, YESTERDAY)])
    renderApp('/sessions')
    expect(await screen.findByRole('region', { name: 'This week' })).toBeInTheDocument()
    expect(screen.queryByText('Your heart has formed')).toBeNull()
  })

  it('does not replay history for an account without a watermark', async () => {
    setup([session('a', 420, YESTERDAY)], { ...profile, milestonesSeenAt: null })
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Apprentice' })).toBeInTheDocument()
    await waitFor(() => expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { milestonesSeenAt: NOW.toISOString() }))
  })
})

describe('mage choice', () => {
  const noMage = { ...seenAll, mage: null }

  it('appears after the first circle, and saves after confirming', async () => {
    const user = userEvent.setup()
    setup([session('a', 420, YESTERDAY)], noMage)
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Choose your path' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose a path' })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: /Arcane/ }))
    await user.click(screen.getByRole('button', { name: 'Continue with Arcane' }))
    expect(screen.getByRole('heading', { name: 'Walk the Arcane path?' })).toBeInTheDocument()
    expect(mocked.updateProfile).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { mage: 'arcane' })
    expect(await screen.findByRole('heading', { name: 'Apprentice' })).toBeInTheDocument()
  })

  it('moves with arrow keys, and "Choose again" goes back', async () => {
    const user = userEvent.setup()
    setup([session('a', 420, YESTERDAY)], noMage)
    renderApp('/')
    await user.click(await screen.findByRole('radio', { name: /Elemental/ }))
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /Arcane/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Continue with Arcane' }))
    await user.click(screen.getByRole('button', { name: 'Choose again' }))
    expect(screen.getByRole('heading', { name: 'Choose your path' })).toBeInTheDocument()
  })

  it('returns to the choice with a message if saving fails', async () => {
    const user = userEvent.setup()
    mocked.updateProfile.mockRejectedValue(new Error('offline'))
    setup([session('a', 420, YESTERDAY)], noMage)
    renderApp('/')
    await user.click(await screen.findByRole('radio', { name: /Spirit/ }))
    await user.click(screen.getByRole('button', { name: 'Continue with Spirit' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText(/could not be saved/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Choose your path' })).toBeInTheDocument()
  })

  it('can be changed from Settings', async () => {
    const user = userEvent.setup()
    setup([session('a', 420, YESTERDAY)], seenAll)
    renderApp('/settings')
    await user.click(await screen.findByRole('link', { name: /Arcane.*Change/ }))
    expect(screen.getByRole('radio', { name: /Arcane/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('radio', { name: /Elemental/ }))
    await user.click(screen.getByRole('button', { name: 'Continue with Elemental' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mocked.updateProfile).toHaveBeenCalledWith('user-1', { mage: 'elemental' })
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('is closed until a circle has formed', async () => {
    setup([session('a', 60, YESTERDAY)], { ...seenAll, mage: null })
    renderApp('/mage')
    expect(await screen.findByRole('heading', { name: 'Gathering' })).toBeInTheDocument()
  })
})

describe('condensing', () => {
  it('offers Condense as the one primary action only when ready', async () => {
    setup(ready, seenAll)
    renderApp('/')
    expect(await screen.findByRole('button', { name: 'Condense' })).toBeInTheDocument()
    expect(screen.getByText('Five circles hold still. They are ready to condense.')).toBeInTheDocument()
  })

  it('hides Condense while a circle is unstable', async () => {
    setup([session('a', 900, YESTERDAY)], seenAll)
    renderApp('/')
    await screen.findByRole('heading', { name: 'Apprentice' })
    expect(screen.queryByRole('button', { name: 'Condense' })).toBeNull()
  })

  it('runs the ceremony, records it, and shows the new rank', async () => {
    const user = userEvent.setup()
    reducedMotion()
    setup(ready, seenAll)
    renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Condense' }))
    expect(screen.getByText('Five circles fold into the heart…')).toBeInTheDocument()

    const rank = await screen.findByRole('heading', { name: 'Adept' })
    expect(rank).toBeInTheDocument()
    expect(mocked.insertCondensation).toHaveBeenCalledOnce()
    expect(screen.getByText('Level 2')).toBeInTheDocument()
    const ranks = screen.getByRole('list', { name: 'Ranks' })
    expect(within(ranks).getByText('Adept')).toHaveAttribute('aria-current', 'step')

    await user.click(screen.getByRole('button', { name: 'Return to the heart' }))
    expect(await screen.findByText('Level 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Begin session' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Condense' })).toBeNull()
  })

  it('returns to Home with a message if saving fails, and can be tried again', async () => {
    const user = userEvent.setup()
    reducedMotion()
    mocked.insertCondensation.mockRejectedValue(new Error('offline'))
    setup(ready, seenAll)
    renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Condense' }))
    expect(await screen.findByText(/could not be condensed/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Condense' })).toBeInTheDocument()
  })

  it('refuses /condense and /level-up when they do not apply', async () => {
    setup([session('a', 420, YESTERDAY)], seenAll)
    const first = renderApp('/condense')
    expect(await screen.findByRole('heading', { name: 'Apprentice' })).toBeInTheDocument()
    expect(mocked.insertCondensation).not.toHaveBeenCalled()
    first.unmount()
    renderApp('/level-up')
    expect(await screen.findByRole('heading', { name: 'Apprentice' })).toBeInTheDocument()
  })
})

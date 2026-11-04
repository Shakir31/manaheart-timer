import { act, screen, waitFor, within } from '@testing-library/react'
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
import { renderApp } from '../test/renderApp'

const mocked = vi.mocked(api)
const NOW = new Date('2026-11-03T10:00:00Z')
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

const profile: Profile = {
  id: 'user-1', mage: 'arcane', timeZone: tz, defaultDurationMinutes: 25, reminderEnabled: false,
  reminderTime: null, welcomeSeenAt: '2026-11-01T00:00:00Z', milestonesSeenAt: null,
}
const session = (id: string, minutes: number, endedAt: string): SessionRecord => ({
  id, category: 'study', durationMinutes: minutes, endedAt, note: null, source: 'manual',
})

function withSessions(sessions: SessionRecord[]) {
  mocked.fetchAllSessions.mockResolvedValue(sessions)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  withSessions([])
  mocked.fetchCondensations.mockResolvedValue([])
  mocked.fetchProfile.mockResolvedValue(profile)
  mocked.insertSession.mockResolvedValue()
  mocked.updateProfile.mockResolvedValue()
})
afterEach(() => vi.useRealTimers())

const user = () => userEvent.setup()

describe('Home', () => {
  it('shows the gathering state for a new user', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Gathering' })).toBeInTheDocument()
    expect(screen.getByText('Before formation')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Heart forming' })).toHaveAttribute('aria-valuemax', '300')
    expect(screen.getByText('/ 5h until your heart forms')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /heart has not formed yet/ })).toBeInTheDocument()
  })

  it('shows rank, forming circle and recent sessions once circles form', async () => {
    withSessions([session('a', 700, '2026-11-03T08:00:00Z')])
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Apprentice' })).toBeInTheDocument()
    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.getByText('Fourth circle forming')).toBeInTheDocument()
    expect(screen.getByText('6h 40m')).toBeInTheDocument()
    expect(screen.getByText('3 unstable')).toBeInTheDocument()
    const recent = screen.getByRole('region', { name: 'Recent' })
    expect(within(recent).getByText(/11h 40m · Today/)).toBeInTheDocument()
  })

  it('logs a session manually and shows Session complete', async () => {
    const u = user()
    withSessions([session('a', 300 + 400, '2026-11-02T08:00:00Z')])
    renderApp('/')
    await u.click(await screen.findByRole('button', { name: 'Log manually' }))

    const dialog = screen.getByRole('dialog', { name: 'Log a session' })
    expect(within(dialog).getByText('Recorded as just completed')).toBeInTheDocument()
    expect(within(dialog).queryByText(/Date|Began at/)).toBeNull()
    await u.click(within(dialog).getByRole('radio', { name: 'Study' }))
    await u.click(within(dialog).getByRole('button', { name: '45 minutes' }))
    await u.type(within(dialog).getByLabelText(/Note/), 'Chapter 3')
    await u.click(within(dialog).getByRole('button', { name: 'Add to the heart' }))

    expect(mocked.insertSession).toHaveBeenCalledWith(expect.objectContaining({
      category: 'study', durationMinutes: 45, note: 'Chapter 3', source: 'manual',
    }))
    expect(await screen.findByText('Session complete')).toBeInTheDocument()
    expect(screen.getByText('+45 min')).toBeInTheDocument()
    expect(screen.getByText('Study · flowed into the fourth circle')).toBeInTheDocument()
    expect(screen.getByText('7h 25m')).toBeInTheDocument()
  })

  it('keeps the sheet open with a message when saving fails', async () => {
    const u = user()
    mocked.insertSession.mockRejectedValue(new Error('offline'))
    renderApp('/')
    await u.click(await screen.findByRole('button', { name: 'Log manually' }))
    await u.click(screen.getByRole('button', { name: 'Add to the heart' }))
    expect(await screen.findByText(/could not be saved/)).toHaveAttribute('role', 'alert')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('Focus session', () => {
  it('runs a session from Home to Session complete', async () => {
    const u = user()
    renderApp('/')
    await u.click(await screen.findByRole('button', { name: 'Begin session' }))

    expect(screen.getByRole('timer')).toHaveTextContent('00:00')
    expect(screen.getByText(/flows into the heart/)).toBeInTheDocument()

    act(() => vi.setSystemTime(new Date(NOW.getTime() + 24 * 60_000 + 37_000)))
    await waitFor(() => expect(screen.getByRole('timer')).toHaveTextContent('24:37'), { timeout: 2000 })

    await u.click(screen.getByRole('button', { name: 'End session' }))
    expect(mocked.insertSession).toHaveBeenCalledWith(expect.objectContaining({
      category: 'meditation', durationMinutes: 25, source: 'timer',
    }))
    expect(await screen.findByText('+25 min')).toBeInTheDocument()
    expect(screen.getByText('Meditation · flowed into the heart')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Return to the heart' }))
    expect(await screen.findByRole('button', { name: 'Begin session' })).toBeInTheDocument()
  })

  it('pauses, resumes and switches focus', async () => {
    const u = user()
    renderApp('/')
    await u.click(await screen.findByRole('button', { name: 'Begin session' }))
    await u.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByText('Paused')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Resume' }))
    await u.click(screen.getByRole('button', { name: 'Switch to Study' }))
    expect(screen.getByText('Study')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to Meditation' })).toBeInTheDocument()
  })

  it('discards a session too short to record', async () => {
    const u = user()
    renderApp('/')
    await u.click(await screen.findByRole('button', { name: 'Begin session' }))
    await u.click(screen.getByRole('button', { name: 'End session' }))
    expect(mocked.insertSession).not.toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Begin session' })).toBeInTheDocument()
  })

  it('keeps the timer when saving fails', async () => {
    const u = user()
    mocked.insertSession.mockRejectedValue(new Error('offline'))
    renderApp('/')
    await u.click(await screen.findByRole('button', { name: 'Begin session' }))
    act(() => vi.setSystemTime(new Date(NOW.getTime() + 10 * 60_000)))
    await u.click(screen.getByRole('button', { name: 'End session' }))
    expect(await screen.findByText(/Your time is kept/)).toHaveAttribute('role', 'alert')
    expect(screen.getByRole('timer')).toBeInTheDocument()
  })

  it('offers to return to a running session after a reload', async () => {
    const u = user()
    const first = renderApp('/')
    await u.click(await screen.findByRole('button', { name: 'Begin session' }))
    first.unmount()
    // A fresh load of Home finds the saved timer.
    const view = renderApp('/')
    expect(await within(view.container).findByRole('button', { name: 'Return to session' })).toBeInTheDocument()
  })
})

describe('routing guards', () => {
  it('sends /complete without session data back home', async () => {
    renderApp('/complete')
    expect(await screen.findByRole('button', { name: 'Begin session' })).toBeInTheDocument()
  })

  it('sends /focus without a running timer back home', async () => {
    renderApp('/focus')
    expect(await screen.findByRole('button', { name: 'Begin session' })).toBeInTheDocument()
  })
})

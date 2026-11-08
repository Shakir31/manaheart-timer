import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CondenseEvent } from '../../engine'
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
import { setViewport } from '../../test/viewport'

const mocked = vi.mocked(api)
const NOW = new Date('2026-11-08T20:00:00Z')
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
const profile: Profile = {
  id: 'user-1', mage: 'arcane', timeZone: tz, defaultDurationMinutes: 25, reminderEnabled: false,
  reminderTime: null, welcomeSeenAt: '2026-01-01T00:00:00Z', milestonesSeenAt: NOW.toISOString(),
}
const s = (id: string, minutes: number, daysAgo: number, category: SessionRecord['category'] = 'meditation'): SessionRecord => ({
  id, category, durationMinutes: minutes, note: null, source: 'manual',
  endedAt: new Date(NOW.getTime() - daysAgo * 86_400_000 - 3_600_000).toISOString(),
})
/** 30 days of 40-minute sits plus a little study: heart formed, sky leaning toward Mind. */
const journey = [...Array.from({ length: 30 }, (_, i) => s(`m${i}`, 40, 40 - i)), s('st', 90, 3, 'study')]

function setup(sessions: SessionRecord[], condensations: CondenseEvent[] = []) {
  mocked.fetchAllSessions.mockResolvedValue(sessions)
  mocked.fetchCondensations.mockResolvedValue(condensations)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  mocked.fetchProfile.mockResolvedValue(profile)
  mocked.updateProfile.mockResolvedValue()
  setup([])
})
afterEach(() => vi.useRealTimers())

describe('Constellation', () => {
  it('is the third tab', async () => {
    renderApp('/')
    const nav = (await screen.findAllByRole('navigation', { name: 'Main' }))[0]
    expect(within(nav).getByRole('link', { name: 'Constellation' })).toHaveAttribute('href', '/constellation')
  })

  it('shows a dark sky for a new mage, with the nearest stars to light', async () => {
    const user = userEvent.setup()
    renderApp('/constellation')
    expect(await screen.findByText('The sky is still dark.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /A dark sky/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open the Grimoire' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'One hour (Mind), next to light' }))
    const sheet = screen.getByRole('dialog', { name: 'One hour' })
    expect(within(sheet).getByText('Mind · Next to light')).toBeInTheDocument()
    expect(within(sheet).getByText('Lights at 1h of meditation · 1h to go')).toBeInTheDocument()
  })

  it('keeps distant stars nameless', async () => {
    const user = userEvent.setup()
    renderApp('/constellation')
    const distant = await screen.findAllByRole('button', { name: /^A distant star \(\w+\), distant$/ })
    await user.click(distant[0])
    expect(screen.getByRole('dialog', { name: 'A distant star' })).toBeInTheDocument()
    expect(screen.getByText('Light the stars closer to the heart first.')).toBeInTheDocument()
  })

  it('lights stars from practice and leans toward the stronger branch', async () => {
    const user = userEvent.setup()
    setup(journey)
    renderApp('/constellation')
    expect(await screen.findByText('The sky leans toward Mind.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apprentice, lit' })).toBeInTheDocument()
    // 30 × 40 min = 20h of meditation: Ten hours is lit, Twenty-five is next.
    expect(screen.getByRole('button', { name: 'Ten hours (Mind), lit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Twenty-five hours (Mind), next to light' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thirty days (Rhythm), lit' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ten hours (Mind), lit' }))
    const sheet = screen.getByRole('dialog', { name: 'Ten hours' })
    expect(within(sheet).getByText(/^Lit \d+ \w+$/)).toBeInTheDocument()
    expect(within(sheet).getByText(/^Before it on this branch: Five hours, lit/)).toBeInTheDocument()
  })

  it('beats: a ripple from the heart, and a glow that reaches lines further out later', async () => {
    setup(journey)
    const { container } = renderApp('/constellation')
    await screen.findByText('The sky leans toward Mind.')
    expect(container.querySelector('[data-part="ripple"]')).not.toBeNull()
    const delays = [...container.querySelectorAll<SVGLineElement>('line[style]')].map((l) => parseFloat(l.style.animationDelay))
    expect(delays.length).toBeGreaterThan(5)
    expect(Math.max(...delays)).toBeGreaterThan(Math.min(...delays))
  })

  it('makes stars lit since the last visit glow once', async () => {
    setup(journey)
    localStorage.setItem('manaheart.skySeenAt.user-1', JSON.stringify(new Date(NOW.getTime() - 5 * 86_400_000).toISOString()))
    const { container } = renderApp('/constellation')
    await screen.findByText('The sky leans toward Mind.')
    expect(container.querySelectorAll('[data-part="fresh"]').length).toBeGreaterThan(0)
  })

  it('shows the star in the side panel on desktop, not a sheet', async () => {
    const user = userEvent.setup()
    setViewport('desktop')
    setup(journey)
    renderApp('/constellation')
    expect(await screen.findByRole('heading', { name: 'Your sky' })).toBeInTheDocument()
    expect(screen.getByText('How it fills')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Apprentice, lit' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Apprentice' })).toBeInTheDocument()
    expect(screen.getByText('The heart has formed and become the first light in the sky.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('heading', { name: 'Your sky' })).toBeInTheDocument()
  })
})

describe('Grimoire', () => {
  it('opens from the Constellation and shows the Apprentice page', async () => {
    const user = userEvent.setup()
    setup(journey)
    renderApp('/constellation')
    await user.click(await screen.findByRole('link', { name: 'Open the Grimoire' }))
    const page = screen.getByRole('article', { name: 'Level 1, Apprentice' })
    expect(within(page).getByText(/^The first light gathers where attention rests/)).toBeInTheDocument()
    expect(within(page).getByText('Heart formed')).toBeInTheDocument()
    expect(within(page).getByText('so far', { exact: false })).toBeInTheDocument()
    expect(within(page).getByText('Later pages are written as each rank is reached.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Constellation' })).toHaveAttribute('href', '/constellation')
  })

  it('adds a page per level, with unreached ranks shown only by name', async () => {
    const user = userEvent.setup()
    const daily = Array.from({ length: 30 }, (_, i) => s(`d${i}`, 30, 45 - i))
    setup([...daily, s('after', 30, 2)], [{ id: 'c1', at: new Date(NOW.getTime() - 10 * 86_400_000).toISOString() }])
    renderApp('/grimoire')
    expect(await screen.findByRole('article', { name: 'Level 2, Adept' })).toBeInTheDocument()
    const first = screen.getByRole('article', { name: 'Level 1, Apprentice' })
    expect(within(first).getByText('Condensed')).toBeInTheDocument()
    expect(within(first).getAllByText(/circle$/)).toHaveLength(5)

    const tabs = screen.getByRole('navigation', { name: 'Ranks' })
    expect(within(tabs).getByRole('button', { name: 'Adept' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs).getByRole('button', { name: 'Magus' })).toBeDisabled()
    await user.click(within(tabs).getByRole('button', { name: 'Apprentice' }))
    expect(within(tabs).getByRole('button', { name: 'Apprentice' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  it('waits for the heart before writing anything', async () => {
    setup([s('a', 60, 1)])
    renderApp('/grimoire')
    expect(await screen.findByText('The first page will be written once the heart forms.')).toBeInTheDocument()
  })
})

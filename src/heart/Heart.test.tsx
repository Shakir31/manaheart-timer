import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { computeHeartState, type SessionLog } from '../engine'
import { Heart } from './Heart'
import { heartModel } from './heartModel'

const at = (day: number) => `2026-01-${String(day).padStart(2, '0')}T09:00:00Z`
const log = (minutes: number, day = 1): SessionLog => ({ id: `s${day}-${minutes}`, category: 'study', durationMinutes: minutes, endedAt: at(day) })
const modelFor = (sessions: SessionLog[]) =>
  heartModel(computeHeartState({ sessions, timeZone: 'UTC', now: new Date(at(28)) }))

describe('Heart', () => {
  it('draws one group per ring with its status', () => {
    const sessions = [log(300 + 360 + 40, 1), ...[2, 3, 4, 5].map((d) => log(10, d))]
    const { container } = render(<Heart model={modelFor(sessions)} />)
    const rings = [...container.querySelectorAll('[data-ring]')]
    // Drawn outer-first so inner rings sit on top.
    expect(rings.map((r) => r.getAttribute('data-status'))).toEqual(['forming', 'unstable', 'unstable', 'stable'])
    expect(screen.getByRole('img')).toHaveAccessibleName(/three circles: one stable, two unstable/)
  })

  it('shows sparks and no core while gathering', () => {
    const { container } = render(<Heart model={modelFor([log(60)])} />)
    expect(container.querySelector('[data-part="gathering"]')).not.toBeNull()
    expect(container.querySelector('[data-part="core"]')).toBeNull()
  })

  it('is hidden from assistive tech when decorative', () => {
    render(<Heart model={modelFor([log(400)])} decorative />)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('gives each heart on a page its own gradient ids', () => {
    const model = modelFor([log(400)])
    const { container } = render(<><Heart model={model} /><Heart model={model} decorative /></>)
    const ids = [...container.querySelectorAll('radialGradient')].map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

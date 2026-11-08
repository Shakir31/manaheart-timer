import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { computeHeartState, type SessionLog } from '../engine'
import { Heart } from './Heart'
import { ellipsePerimeter, heartModel, PALETTES } from './heartModel'

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

  it('shows sparks drifting inward, and no core, while gathering', () => {
    const { container } = render(<Heart model={modelFor([log(60)])} />)
    expect(container.querySelector('[data-part="gathering"]')).not.toBeNull()
    expect(container.querySelector('[data-part="core"]')).toBeNull()
    expect(container.querySelector('[data-part="seed"]')).not.toBeNull()

    const sparks = [...container.querySelectorAll<SVGCircleElement>('[data-part="spark"]')]
    expect(sparks.length).toBeGreaterThanOrEqual(20)
    for (const s of sparks) {
      // Each spark travels most of the way toward the centre (200, 200).
      const x = Number(s.getAttribute('cx'))
      const dx = parseFloat(s.style.getPropertyValue('--dx'))
      expect(Math.sign(dx)).toBe(Math.sign(200 - x) || 0)
      expect(Math.abs(x + dx - 200)).toBeLessThan(Math.abs(x - 200) * 0.2 + 1)
    }
  })

  it('beats: a ripple goes out from the core, at a tempo set by the pulse mode', () => {
    const model = modelFor([log(400)])
    const { container, rerender } = render(<Heart model={model} />)
    expect(container.querySelector('[data-part="ripple"]')).not.toBeNull()
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--beat')).toBe('1.3s')
    rerender(<Heart model={model} pulse="slow" />)
    expect(root.style.getPropertyValue('--beat')).toBe('2s')
    rerender(<Heart model={model} pulse="quick" />)
    expect(root.style.getPropertyValue('--beat')).toBe('0.95s')
  })

  it('animates the forming ring: motes masked to the drawn arc, and a tip', () => {
    const { container } = render(<Heart model={modelFor([log(300 + 60)])} />)
    const forming = container.querySelector('[data-status="forming"]')!
    const flow = forming.querySelector('[data-part="arc-flow"]')!
    const maskId = flow.getAttribute('mask')!.match(/url\(#(.+)\)/)![1]
    const maskArc = forming.querySelector(`mask[id="${maskId}"] ellipse`)!
    // Half of a 120-min circle: the mask reveals exactly the drawn half of the ring.
    expect(maskArc.getAttribute('stroke-dasharray')).toBe(`${Math.round(ellipsePerimeter(90, 30) / 2)} 2000`)
    expect(forming.querySelector('[data-part="tip"]')).not.toBeNull()
  })

  it('stops the beat while collapsing', () => {
    const { container } = render(<Heart model={modelFor([log(400)])} collapsing />)
    expect(container.querySelector('[data-part="ripple"]')).toBeNull()
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

  it('draws an Arcane forming arc in the main colour, even on a cyan slot', () => {
    // Second ring (odd slot) forming: formed Arcane rings there would be cyan.
    const { container } = render(<Heart model={modelFor([log(300 + 120 + 60)])} variant="arcane" />)
    const forming = container.querySelector('[data-status="forming"]')!
    const strokes = [...forming.querySelectorAll('ellipse')].map((e) => e.getAttribute('stroke')).filter(Boolean)
    expect(strokes).not.toContain(PALETTES.arcane.alt)
    expect(strokes).toContain(PALETTES.arcane.line)
  })
})

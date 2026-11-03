import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DurationStepper } from './DurationStepper'
import { ProgressLine } from './ProgressLine'
import { RhythmWeek } from './RhythmWeek'
import { SegmentedControl } from './SegmentedControl'
import { Sheet } from './Sheet'

describe('SegmentedControl', () => {
  function Harness() {
    const [v, setV] = useState<'meditation' | 'study'>('meditation')
    return (
      <SegmentedControl label="Category" value={v} onChange={setV}
        options={[{ value: 'meditation', label: 'Meditation' }, { value: 'study', label: 'Study' }]} />
    )
  }

  it('selects by click and arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const med = screen.getByRole('radio', { name: 'Meditation' })
    const study = screen.getByRole('radio', { name: 'Study' })
    expect(med).toHaveAttribute('aria-checked', 'true')
    await user.click(study)
    expect(study).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{ArrowRight}')
    expect(med).toHaveAttribute('aria-checked', 'true')
    expect(med).toHaveFocus()
  })
})

describe('DurationStepper', () => {
  function Harness({ start = 45, spy }: { start?: number; spy?: (n: number) => void }) {
    const [v, setV] = useState(start)
    return <DurationStepper value={v} onChange={(n) => { setV(n); spy?.(n) }} />
  }

  it('steps by five and snaps odd values', async () => {
    const user = userEvent.setup()
    render(<Harness start={47} />)
    await user.click(screen.getByRole('button', { name: 'Five minutes more' }))
    expect(screen.getByLabelText('Duration')).toHaveValue('50')
    await user.click(screen.getByRole('button', { name: 'Five minutes less' }))
    expect(screen.getByLabelText('Duration')).toHaveValue('45')
  })

  it('disables at the limits', () => {
    render(<Harness start={5} />)
    expect(screen.getByRole('button', { name: 'Five minutes less' })).toBeDisabled()
  })

  it('marks the matching quick pick and applies picks', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByRole('button', { name: '45 minutes' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: '15 minutes' }))
    expect(screen.getByLabelText('Duration')).toHaveValue('15')
  })

  it('clamps typed values when leaving the field', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness spy={spy} />)
    const input = screen.getByLabelText('Duration')
    await user.clear(input)
    await user.type(input, '999')
    await user.tab()
    expect(spy).toHaveBeenLastCalledWith(240)
    expect(input).toHaveValue('240')
  })
})

describe('ProgressLine', () => {
  it('shows hours, never a percentage', () => {
    render(<ProgressLine label="Fourth circle forming" minutes={400} requiredMinutes={600} />)
    expect(screen.getByText('6h 40m')).toBeInTheDocument()
    expect(screen.getByText('/ 10h')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/%/)
    const bar = screen.getByRole('progressbar', { name: 'Fourth circle forming' })
    expect(bar).toHaveAttribute('aria-valuenow', '400')
    expect(bar).toHaveAttribute('aria-valuemax', '600')
  })

  it('adds the suffix before formation', () => {
    render(<ProgressLine label="Heart forming" minutes={250} requiredMinutes={300} suffix="until your heart forms" gathering />)
    expect(screen.getByText('/ 5h until your heart forms')).toBeInTheDocument()
  })
})

describe('RhythmWeek', () => {
  it('renders seven days with a sentence label', () => {
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
      date: `2026-11-0${i + 1}`, weekday: i, practiced: i % 3 !== 2, isToday: i === 6,
    }))
    render(<RhythmWeek days={days} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAccessibleName('Practised on 5 of the last 7 days; missed Wednesday and Saturday')
    expect(img.querySelectorAll('[data-state="practiced"]')).toHaveLength(5)
  })
})

describe('Sheet', () => {
  function Harness({ onClose }: { onClose: () => void }) {
    return (
      <Sheet title="Log a session" onClose={onClose}>
        <input aria-label="first" />
        <button type="button">Last</button>
      </Sheet>
    )
  }

  it('is a labelled dialog that focuses its first control', () => {
    render(<Harness onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Log a session' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('closes on Escape, scrim and close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.keyboard('{Escape}')
    await user.click(screen.getByTestId('sheet-scrim'))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('keeps Tab inside the dialog', async () => {
    const user = userEvent.setup()
    render(<Harness onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Last' }))
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })
})

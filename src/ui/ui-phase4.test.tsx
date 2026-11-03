import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setViewport } from '../test/viewport'
import { ConfirmDialog } from './ConfirmDialog'
import { SessionRow } from './SessionRow'
import { Switch } from './Switch'
import { TextArea, TextInput } from './TextInput'
import { useToast } from './toast/context'
import { ToastProvider } from './toast/ToastProvider'
import { DESKTOP, useMediaQuery } from './useMediaQuery'

describe('TextInput', () => {
  it('ties the error message to the field', () => {
    render(<TextInput label="Email" error="Enter a full email address" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a full email address')
  })

  it('shows and hides a password', async () => {
    const user = userEvent.setup()
    render(<TextInput label="Password" type="password" defaultValue="secret" />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})

describe('TextArea', () => {
  function Harness() {
    const [v, setV] = useState('')
    return <TextArea label="Note" optional maxLength={280} value={v} onChange={(e) => setV(e.target.value)} />
  }

  it('shows the count only once something is typed', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByText(/\/ 280/)).toBeNull()
    await user.type(screen.getByLabelText(/Note/), 'Calm')
    expect(screen.getByText('4 / 280')).toBeInTheDocument()
  })
})

describe('Switch', () => {
  it('is a labelled switch that toggles', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [on, setOn] = useState(false)
      return <><span id="lbl">Daily reminder</span><Switch checked={on} onChange={setOn} labelledBy="lbl" /></>
    }
    render(<Harness />)
    const sw = screen.getByRole('switch', { name: 'Daily reminder' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    await user.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })
})

describe('ConfirmDialog', () => {
  it('focuses the safe choice and cancels on Escape', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(<ConfirmDialog title="Delete this session?" body="45 min of Study will be removed." cancelLabel="Keep it" confirmLabel="Delete" onCancel={onCancel} onConfirm={onConfirm} />)
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this session?' })
    expect(dialog).toHaveAccessibleDescription('45 min of Study will be removed.')
    expect(screen.getByRole('button', { name: 'Keep it' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})

describe('Toast', () => {
  afterEach(() => vi.useRealTimers())

  function Trigger({ onUndo }: { onUndo: () => void }) {
    const toast = useToast()
    return (
      <>
        <button onClick={() => toast.show({ message: 'Session deleted', action: { label: 'Undo', onAction: onUndo } })}>Delete</button>
        <button onClick={() => toast.show({ message: 'Could not save', tone: 'error' })}>Fail</button>
      </>
    )
  }

  it('announces, runs its action, and goes away', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(<ToastProvider><Trigger onUndo={onUndo} /></ToastProvider>)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('status')).toHaveTextContent('Session deleted')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledOnce()
    expect(screen.queryByText('Session deleted')).toBeNull()
  })

  it('uses an alert for errors and dismisses itself after 4 seconds', async () => {
    vi.useFakeTimers()
    render(<ToastProvider><Trigger onUndo={() => {}} /></ToastProvider>)
    act(() => screen.getByRole('button', { name: 'Fail' }).click())
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save')
    act(() => vi.advanceTimersByTime(4100))
    expect(screen.queryByText('Could not save')).toBeNull()
  })
})

describe('SessionRow', () => {
  it('opens the session when clicked, and omits an empty note', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const session = { id: 'a', category: 'study' as const, durationMinutes: 45, endedAt: '2026-11-03T18:30:00Z', note: null, source: 'manual' as const }
    render(<SessionRow session={session} timeZone="UTC" onOpen={onOpen} />)
    await user.click(screen.getByRole('button', { name: 'Study, 45 min, ended 6:30 pm. Edit' }))
    expect(onOpen).toHaveBeenCalledWith(session)
  })
})

describe('useMediaQuery', () => {
  it('follows the viewport', () => {
    expect(renderHook(() => useMediaQuery(DESKTOP)).result.current).toBe(false)
    setViewport('desktop')
    expect(renderHook(() => useMediaQuery(DESKTOP)).result.current).toBe(true)
  })
})

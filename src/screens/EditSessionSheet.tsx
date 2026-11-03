import { useState, type FormEvent } from 'react'
import type { Category } from '../engine'
import { deleteSentence, endedLine } from '../copy/sessionsCopy'
import { useManaData } from '../data/context'
import type { SessionRecord } from '../data/types'
import { useNow } from '../data/useNow'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { DurationStepper } from '../ui/DurationStepper'
import { Icon } from '../ui/Icon'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Sheet } from '../ui/Sheet'
import { TextArea } from '../ui/TextInput'
import { useToast } from '../ui/toast/context'
import { CATEGORY_OPTIONS, NOTE_MAX } from './sessionFields'
import styles from './LogSheet.module.css'

/** Edit a logged session: category, duration, note; or delete it (with Undo). */
export function EditSessionSheet({ session, onClose }: { session: SessionRecord; onClose(): void }) {
  const { updateSession, deleteSession, restoreSession, timeZone } = useManaData()
  const toast = useToast()
  const now = useNow()
  const [category, setCategory] = useState<Category>(session.category)
  const [minutes, setMinutes] = useState(session.durationMinutes)
  const [note, setNote] = useState(session.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const changed = category !== session.category || minutes !== session.durationMinutes || note.trim() !== (session.note ?? '')
    if (!changed) return onClose()
    setSaving(true)
    setError(null)
    try {
      await updateSession(session.id, { category, durationMinutes: minutes, note })
      onClose()
      toast.show({ message: 'Session updated', tone: 'success' })
    } catch {
      setError('Your changes could not be saved. Check your connection and try again.')
      setSaving(false)
    }
  }

  const remove = async () => {
    setConfirming(false)
    onClose()
    try {
      await deleteSession(session.id)
      toast.show({
        message: 'Session deleted',
        action: {
          label: 'Undo',
          onAction: () => {
            restoreSession(session).catch(() => toast.show({ message: 'The session could not be restored.', tone: 'error' }))
          },
        },
      })
    } catch {
      toast.show({ message: 'The session could not be deleted. Try again.', tone: 'error' })
    }
  }

  return (
    <>
      <Sheet title="Edit session" subtitle={endedLine(session, now, timeZone)} onClose={onClose}>
        <form className={styles.form} onSubmit={save} aria-label="Edit session">
          <SegmentedControl label="Category" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
          <DurationStepper value={minutes} onChange={setMinutes} />
          <TextArea label="Note" optional maxLength={NOTE_MAX} placeholder="What did you practise?"
            value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <Button type="submit" block disabled={saving} aria-busy={saving}>{saving ? 'Saving' : 'Save changes'}</Button>
          <button type="button" className={styles.delete} onClick={() => setConfirming(true)}>
            <Icon name="delete" size={18} />
            Delete session
          </button>
        </form>
      </Sheet>
      {confirming && (
        <ConfirmDialog
          title="Delete this session?"
          body={deleteSentence(session, now, timeZone)}
          cancelLabel="Keep it"
          confirmLabel="Delete"
          onCancel={() => setConfirming(false)}
          onConfirm={remove}
        />
      )}
    </>
  )
}

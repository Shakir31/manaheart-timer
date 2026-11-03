import { useState, type FormEvent } from 'react'
import type { Category } from '../engine'
import { useRecordSessions } from '../app/useRecordSessions'
import { useManaData } from '../data/context'
import { useFocusTimer } from '../focus/context'
import { Button } from '../ui/Button'
import { DurationStepper } from '../ui/DurationStepper'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Sheet } from '../ui/Sheet'
import { TextArea } from '../ui/TextInput'
import { CATEGORY_OPTIONS, NOTE_MAX } from './sessionFields'
import styles from './LogSheet.module.css'

/** Log manually: category, duration, optional note. Recorded as just completed. */
export function LogSheet({ onClose }: { onClose(): void }) {
  const { profile } = useManaData()
  const { lastCategory } = useFocusTimer()
  const record = useRecordSessions()

  const [category, setCategory] = useState<Category>(lastCategory)
  const [minutes, setMinutes] = useState(profile?.defaultDurationMinutes ?? 25)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await record([{ category, durationMinutes: minutes }], 'manual', note)
    } catch {
      setError('That session could not be saved. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <Sheet title="Log a session" subtitle="Recorded as just completed" onClose={onClose}>
      <form className={styles.form} onSubmit={submit} aria-label="Log a session">
        <SegmentedControl label="Category" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        <DurationStepper value={minutes} onChange={setMinutes} />
        <TextArea label="Note" optional maxLength={NOTE_MAX} placeholder="What did you practise?"
          value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <Button type="submit" block disabled={saving} aria-busy={saving}>
          {saving ? 'Adding' : 'Add to the heart'}
        </Button>
      </form>
    </Sheet>
  )
}

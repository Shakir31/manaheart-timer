import { useState, type FormEvent } from 'react'
import { dayKey } from '../engine'
import { useAuth } from '../auth/context'
import { authErrorMessage, passwordError } from '../auth/messages'
import { formatTimeOfDay } from '../copy/dates'
import { useManaData } from '../data/context'
import type { ProfilePatch } from '../data/types'
import { useHeartState } from '../data/useHeartState'
import { downloadText, sessionsToCsv } from '../lib/csv'
import { Button } from '../ui/Button'
import { DurationStepper } from '../ui/DurationStepper'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import { Switch } from '../ui/Switch'
import { TextInput } from '../ui/TextInput'
import { useToast } from '../ui/toast/context'
import { DESKTOP, useMediaQuery } from '../ui/useMediaQuery'
import formStyles from './LogSheet.module.css'
import styles from './Settings.module.css'

const DEFAULT_REMINDER = '20:00:00'
const LENGTH_PICKS = [15, 25, 45, 60]
const MAGE_NAMES = { elemental: 'Elemental', arcane: 'Arcane', spirit: 'Spirit' } as const

type SheetKind = 'password' | 'reminder' | 'length' | null

export function Settings() {
  const { user, signOut } = useAuth()
  const { profile, sessions, timeZone, updateProfile } = useManaData()
  const heart = useHeartState()
  const toast = useToast()
  const desktop = useMediaQuery(DESKTOP)
  const [sheet, setSheet] = useState<SheetKind>(null)

  if (!profile) return null
  const reminderTime = profile.reminderTime ?? DEFAULT_REMINDER

  const save = (patch: ProfilePatch) =>
    updateProfile(patch).catch(() => toast.show({ message: 'That setting could not be saved. Try again.', tone: 'error' }))

  const toggleReminder = (on: boolean) =>
    save(on && !profile.reminderTime ? { reminderEnabled: on, reminderTime: DEFAULT_REMINDER } : { reminderEnabled: on })

  const exportData = () => {
    downloadText(`manaheart-sessions-${dayKey(new Date(), timeZone)}.csv`, sessionsToCsv(sessions, timeZone))
    toast.show({ message: `${sessions.length} session${sessions.length === 1 ? '' : 's'} exported`, tone: 'success' })
  }

  const mageUnlocked = heart.formedCount > 0 || heart.level >= 2

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <section aria-labelledby="set-account">
        <h2 id="set-account" className={`label ${styles.eyebrow}`}>Account</h2>
        <div className={styles.card}>
          <div className={styles.row}>
            <span>Email</span>
            <span className={styles.value}>{user?.email}</span>
          </div>
          <button type="button" className={`${styles.row} ${styles.link}`} onClick={() => setSheet('password')}>
            <span>Change password</span>
            <Icon name="forward" size={20} className={styles.chevron} />
          </button>
        </div>
      </section>

      <section aria-labelledby="set-practice">
        <h2 id="set-practice" className={`label ${styles.eyebrow}`}>Practice</h2>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.stack}>
              <span id="reminder-label">Daily reminder</span>
              <span className={styles.hint}>A quiet nudge if you haven't practised that day</span>
            </span>
            <span className={styles.controls}>
              {desktop && profile.reminderEnabled && (
                <label className={styles.inlineTime}>
                  <span className={styles.hint}>at</span>
                  <input
                    type="time"
                    aria-label="Reminder time"
                    className={styles.timeInput}
                    defaultValue={reminderTime.slice(0, 5)}
                    onBlur={(e) => e.target.value && save({ reminderTime: `${e.target.value}:00` })}
                  />
                </label>
              )}
              <Switch checked={profile.reminderEnabled} onChange={toggleReminder} labelledBy="reminder-label" />
            </span>
          </div>
          {!desktop && profile.reminderEnabled && (
            <button type="button" className={`${styles.row} ${styles.link}`} onClick={() => setSheet('reminder')}>
              <span>Reminder time</span>
              <span className={styles.value}>
                {formatTimeOfDay(reminderTime)}
                <Icon name="forward" size={20} className={styles.chevron} />
              </span>
            </button>
          )}
          {desktop ? (
            <div className={styles.row}>
              <span className={styles.stack}>
                <span id="length-label">Default session length</span>
                <span className={styles.hint}>Used when you log a session manually</span>
              </span>
              <span className={styles.chips} role="group" aria-labelledby="length-label">
                {LENGTH_PICKS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={profile.defaultDurationMinutes === m}
                    aria-label={`${m} minutes`}
                    className={profile.defaultDurationMinutes === m ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                    onClick={() => save({ defaultDurationMinutes: m })}
                  >
                    {m}
                  </button>
                ))}
              </span>
            </div>
          ) : (
            <button type="button" className={`${styles.row} ${styles.link}`} onClick={() => setSheet('length')}>
              <span>Default session length</span>
              <span className={styles.value}>
                {profile.defaultDurationMinutes} min
                <Icon name="forward" size={20} className={styles.chevron} />
              </span>
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="set-mage">
        <h2 id="set-mage" className={`label ${styles.eyebrow}`}>Mage aesthetic</h2>
        {mageUnlocked ? (
          <div className={styles.card}>
            <div className={styles.row}>
              <span className={styles.stack}>
                <span>{profile.mage ? MAGE_NAMES[profile.mage] : 'Not chosen yet'}</span>
                <span className={styles.hint}>
                  {profile.mage ? 'Colours your heart and its circles.' : 'Your first circle has formed. The choice will open soon.'}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className={`${styles.card} ${styles.locked}`} aria-disabled="true">
            <div className={styles.row}>
              <span className={styles.lockDisc} aria-hidden="true"><Icon name="locked" size={18} /></span>
              <span className={styles.stack}>
                <span>Locked until your first circle forms</span>
                <span className={styles.hint}>Then choose Elemental, Arcane or Spirit. You can change it here any time after.</span>
              </span>
              <span className={styles.swatches} aria-hidden="true">
                <span style={{ background: 'var(--elemental-ring)' }} />
                <span style={{ background: 'var(--arcane-ring)' }} />
                <span style={{ background: 'var(--spirit-rune)' }} />
              </span>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="set-data">
        <h2 id="set-data" className={`label ${styles.eyebrow}`}>Data</h2>
        <div className={styles.card}>
          <button type="button" className={`${styles.row} ${styles.link}`} onClick={exportData}>
            <span className={styles.stack}>
              <span>Export data</span>
              <span className={styles.hint}>Every session as a CSV file</span>
            </span>
            <Icon name="export" size={20} className={styles.chevron} />
          </button>
        </div>
      </section>

      <Button
        variant="outline"
        className={styles.signOut}
        onClick={() => signOut().catch(() => toast.show({ message: 'Could not sign out. Try again.', tone: 'error' }))}
      >
        <Icon name="signOut" size={20} />
        Sign out
      </Button>

      {sheet === 'password' && <PasswordSheet onClose={() => setSheet(null)} />}
      {sheet === 'reminder' && (
        <ReminderSheet value={reminderTime} onClose={() => setSheet(null)} onSave={(t) => save({ reminderTime: t })} />
      )}
      {sheet === 'length' && (
        <LengthSheet value={profile.defaultDurationMinutes} onClose={() => setSheet(null)} onSave={(m) => save({ defaultDurationMinutes: m })} />
      )}
    </div>
  )
}

function PasswordSheet({ onClose }: { onClose(): void }) {
  const { updatePassword } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = passwordError(password)
    setError(found)
    if (found) return
    setBusy(true)
    try {
      await updatePassword(password)
      onClose()
      toast.show({ message: 'Password changed', tone: 'success' })
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Sheet title="Change password" onClose={onClose}>
      <form className={formStyles.form} onSubmit={submit} noValidate aria-label="Change password">
        <TextInput label="New password" type="password" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit" block disabled={busy} aria-busy={busy}>{busy ? 'Saving' : 'Save password'}</Button>
      </form>
    </Sheet>
  )
}

function ReminderSheet({ value, onClose, onSave }: { value: string; onClose(): void; onSave(time: string): void }) {
  const [time, setTime] = useState(value.slice(0, 5))
  return (
    <Sheet title="Reminder time" subtitle="Once a day, only if you haven't practised" onClose={onClose}>
      <form
        className={formStyles.form}
        aria-label="Reminder time"
        onSubmit={(e) => {
          e.preventDefault()
          if (time) onSave(`${time}:00`)
          onClose()
        }}
      >
        <TextInput label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <Button type="submit" block>Save</Button>
      </form>
    </Sheet>
  )
}

function LengthSheet({ value, onClose, onSave }: { value: number; onClose(): void; onSave(minutes: number): void }) {
  const [minutes, setMinutes] = useState(value)
  return (
    <Sheet title="Default session length" subtitle="Used when you log a session manually" onClose={onClose}>
      <form
        className={formStyles.form}
        aria-label="Default session length"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(minutes)
          onClose()
        }}
      >
        <DurationStepper value={minutes} onChange={setMinutes} />
        <Button type="submit" block>Save</Button>
      </form>
    </Sheet>
  )
}

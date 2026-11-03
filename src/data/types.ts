import type { Category, SessionLog } from '../engine'

export type Mage = 'elemental' | 'arcane' | 'spirit'
export type SessionSource = 'timer' | 'manual'

/** A session as stored: the engine's SessionLog plus app-only fields. */
export interface SessionRecord extends SessionLog {
  note: string | null
  source: SessionSource
}

export interface NewSession {
  category: Category
  durationMinutes: number
  note?: string | null
  source: SessionSource
  /** Defaults to now. */
  endedAt?: string
}

export type SessionPatch = Partial<Pick<SessionRecord, 'category' | 'durationMinutes' | 'note'>>

export interface Profile {
  id: string
  mage: Mage | null
  timeZone: string
  defaultDurationMinutes: number
  reminderEnabled: boolean
  /** "HH:MM:SS" local time, or null. */
  reminderTime: string | null
  welcomeSeenAt: string | null
  milestonesSeenAt: string | null
}

export type ProfilePatch = Partial<Omit<Profile, 'id'>>

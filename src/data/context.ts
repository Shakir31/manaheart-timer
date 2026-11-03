import { createContext, useContext } from 'react'
import type { CondenseEvent } from '../engine'
import type { NewSession, Profile, ProfilePatch, SessionPatch, SessionRecord } from './types'

export interface ManaDataValue {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  sessions: SessionRecord[]
  condensations: CondenseEvent[]
  profile: Profile | null
  /** The user's current IANA time zone (from the browser). */
  timeZone: string
  addSession(input: NewSession): Promise<SessionRecord>
  updateSession(id: string, patch: SessionPatch): Promise<void>
  deleteSession(id: string): Promise<void>
  /** Record a condensation now. Only call when the heart state says canCondense. */
  condense(): Promise<void>
  updateProfile(patch: ProfilePatch): Promise<void>
  reload(): Promise<void>
}

export const ManaDataContext = createContext<ManaDataValue | null>(null)

export function useManaData(): ManaDataValue {
  const value = useContext(ManaDataContext)
  if (!value) throw new Error('useManaData must be used inside <ManaDataProvider>')
  return value
}

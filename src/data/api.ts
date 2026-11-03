// Thin, typed wrappers around Supabase. All snake_case ↔ camelCase mapping happens here.
// Row-level security limits every query to the signed-in user's rows.
import { supabase } from '../lib/supabase'
import type { CondenseEvent } from '../engine'
import type { Profile, ProfilePatch, SessionPatch, SessionRecord } from './types'

interface SessionRow {
  id: string
  category: SessionRecord['category']
  duration_minutes: number
  ended_at: string
  note: string | null
  source: SessionRecord['source']
}

interface ProfileRow {
  id: string
  mage: Profile['mage']
  time_zone: string
  default_duration_minutes: number
  reminder_enabled: boolean
  reminder_time: string | null
  welcome_seen_at: string | null
  milestones_seen_at: string | null
}

const SESSION_COLUMNS = 'id, category, duration_minutes, ended_at, note, source'
const PROFILE_COLUMNS =
  'id, mage, time_zone, default_duration_minutes, reminder_enabled, reminder_time, welcome_seen_at, milestones_seen_at'

const toSession = (r: SessionRow): SessionRecord => ({
  id: r.id,
  category: r.category,
  durationMinutes: r.duration_minutes,
  endedAt: r.ended_at,
  note: r.note,
  source: r.source,
})

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  mage: r.mage,
  timeZone: r.time_zone,
  defaultDurationMinutes: r.default_duration_minutes,
  reminderEnabled: r.reminder_enabled,
  reminderTime: r.reminder_time,
  welcomeSeenAt: r.welcome_seen_at,
  milestonesSeenAt: r.milestones_seen_at,
})

function profilePatchToRow(p: ProfilePatch): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = {}
  if (p.mage !== undefined) row.mage = p.mage
  if (p.timeZone !== undefined) row.time_zone = p.timeZone
  if (p.defaultDurationMinutes !== undefined) row.default_duration_minutes = p.defaultDurationMinutes
  if (p.reminderEnabled !== undefined) row.reminder_enabled = p.reminderEnabled
  if (p.reminderTime !== undefined) row.reminder_time = p.reminderTime
  if (p.welcomeSeenAt !== undefined) row.welcome_seen_at = p.welcomeSeenAt
  if (p.milestonesSeenAt !== undefined) row.milestones_seen_at = p.milestonesSeenAt
  return row
}

/** Supabase returns at most 1000 rows per request, so page through everything. */
const PAGE = 1000

export async function fetchAllSessions(): Promise<SessionRecord[]> {
  const all: SessionRecord[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('sessions')
      .select(SESSION_COLUMNS)
      .order('ended_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    all.push(...(data as SessionRow[]).map(toSession))
    if (data.length < PAGE) return all
  }
}

export async function insertSession(s: SessionRecord): Promise<void> {
  const { error } = await supabase.from('sessions').insert({
    id: s.id,
    category: s.category,
    duration_minutes: s.durationMinutes,
    ended_at: s.endedAt,
    note: s.note,
    source: s.source,
  })
  if (error) throw error
}

export async function updateSession(id: string, patch: SessionPatch): Promise<void> {
  const row: Partial<SessionRow> = {}
  if (patch.category !== undefined) row.category = patch.category
  if (patch.durationMinutes !== undefined) row.duration_minutes = patch.durationMinutes
  if (patch.note !== undefined) row.note = patch.note
  const { error } = await supabase.from('sessions').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}

export async function fetchCondensations(): Promise<CondenseEvent[]> {
  const { data, error } = await supabase
    .from('condensations')
    .select('id, at')
    .order('at', { ascending: true })
  if (error) throw error
  return data as CondenseEvent[]
}

export async function insertCondensation(event: CondenseEvent): Promise<void> {
  const { error } = await supabase.from('condensations').insert({ id: event.id, at: event.at })
  if (error) throw error
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single()
  if (error) throw error
  return toProfile(data as ProfileRow)
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<void> {
  const { error } = await supabase.from('profiles').update(profilePatchToRow(patch)).eq('id', userId)
  if (error) throw error
}

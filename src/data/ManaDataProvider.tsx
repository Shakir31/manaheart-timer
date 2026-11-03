import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { CondenseEvent } from '../engine'
import { useAuth } from '../auth/context'
import * as api from './api'
import { ManaDataContext, type ManaDataValue } from './context'
import type { NewSession, Profile, ProfilePatch, SessionPatch, SessionRecord } from './types'

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

interface UserData {
  sessions: SessionRecord[]
  condensations: CondenseEvent[]
  profile: Profile
}

async function fetchUserData(userId: string): Promise<UserData> {
  const [sessions, condensations, profile] = await Promise.all([
    api.fetchAllSessions(),
    api.fetchCondensations(),
    api.fetchProfile(userId),
  ])
  return { sessions, condensations, profile }
}

/**
 * Loads the signed-in user's sessions, condensations and profile, and exposes
 * mutations. Writes are optimistic: the UI updates at once and rolls back if
 * Supabase rejects the change.
 */
export function ManaDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // Remount on sign-in/out so no data from a previous user can survive.
  return (
    <ManaDataStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </ManaDataStore>
  )
}

function ManaDataStore({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [status, setStatus] = useState<ManaDataValue['status']>(userId ? 'loading' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [condensations, setCondensations] = useState<CondenseEvent[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [timeZone] = useState(browserTimeZone)

  // Latest values for rollbacks, without re-creating callbacks on every change.
  const latest = useRef({ sessions, profile })
  useEffect(() => {
    latest.current = { sessions, profile }
  }, [sessions, profile])

  const applyLoaded = useCallback((id: string, d: UserData) => {
    setSessions(d.sessions)
    setCondensations(d.condensations)
    setProfile(d.profile)
    setError(null)
    setStatus('ready')
    // Keep the stored time zone current (used later for reminders).
    if (d.profile.timeZone !== timeZone) {
      api.updateProfile(id, { timeZone }).then(
        () => setProfile((prev) => (prev ? { ...prev, timeZone } : prev)),
        () => {}, // Not critical; try again next load.
      )
    }
  }, [timeZone])

  const applyError = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : String(e))
    setStatus('error')
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchUserData(userId).then(
      (d) => !cancelled && applyLoaded(userId, d),
      (e) => !cancelled && applyError(e),
    )
    return () => {
      cancelled = true
    }
  }, [userId, applyLoaded, applyError])

  const requireUser = useCallback(() => {
    if (!userId) throw new Error('Not signed in')
    return userId
  }, [userId])

  const addSession = useCallback(async (input: NewSession) => {
    requireUser()
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      category: input.category,
      durationMinutes: Math.round(input.durationMinutes),
      endedAt: input.endedAt ?? new Date().toISOString(),
      note: input.note?.trim() || null,
      source: input.source,
    }
    setSessions((prev) => [...prev, record])
    try {
      await api.insertSession(record)
    } catch (e) {
      setSessions((prev) => prev.filter((s) => s.id !== record.id))
      throw e
    }
    return record
  }, [requireUser])

  const updateSession = useCallback(async (id: string, patch: SessionPatch) => {
    requireUser()
    const before = latest.current.sessions.find((s) => s.id === id)
    if (!before) return
    const clean: SessionPatch = { ...patch }
    if (clean.note !== undefined) clean.note = clean.note?.trim() || null
    if (clean.durationMinutes !== undefined) clean.durationMinutes = Math.round(clean.durationMinutes)
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...clean } : s)))
    try {
      await api.updateSession(id, clean)
    } catch (e) {
      setSessions((prev) => prev.map((s) => (s.id === id ? before : s)))
      throw e
    }
  }, [requireUser])

  const deleteSession = useCallback(async (id: string) => {
    requireUser()
    const before = latest.current.sessions
    setSessions((prev) => prev.filter((s) => s.id !== id))
    try {
      await api.deleteSession(id)
    } catch (e) {
      setSessions(before)
      throw e
    }
  }, [requireUser])

  const restoreSession = useCallback(async (record: SessionRecord) => {
    requireUser()
    setSessions((prev) => (prev.some((s) => s.id === record.id) ? prev : [...prev, record]))
    try {
      await api.insertSession(record)
    } catch (e) {
      setSessions((prev) => prev.filter((s) => s.id !== record.id))
      throw e
    }
  }, [requireUser])

  const condense = useCallback(async () => {
    requireUser()
    const event: CondenseEvent = { id: crypto.randomUUID(), at: new Date().toISOString() }
    setCondensations((prev) => [...prev, event])
    try {
      await api.insertCondensation(event)
    } catch (e) {
      setCondensations((prev) => prev.filter((c) => c.id !== event.id))
      throw e
    }
  }, [requireUser])

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    const id = requireUser()
    const before = latest.current.profile
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev))
    try {
      await api.updateProfile(id, patch)
    } catch (e) {
      setProfile(before)
      throw e
    }
  }, [requireUser])

  const reload = useCallback(async () => {
    if (!userId) return
    setStatus('loading')
    try {
      applyLoaded(userId, await fetchUserData(userId))
    } catch (e) {
      applyError(e)
    }
  }, [userId, applyLoaded, applyError])

  const value = useMemo<ManaDataValue>(
    () => ({
      status, error, sessions, condensations, profile, timeZone,
      addSession, updateSession, deleteSession, restoreSession, condense, updateProfile, reload,
    }),
    [status, error, sessions, condensations, profile, timeZone,
      addSession, updateSession, deleteSession, restoreSession, condense, updateProfile, reload],
  )

  return <ManaDataContext.Provider value={value}>{children}</ManaDataContext.Provider>
}

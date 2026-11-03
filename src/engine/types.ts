// Inputs: the only things the app stores.

export type Category = 'meditation' | 'study'

/** One logged session (timer or manual). The raw fact everything else is derived from. */
export interface SessionLog {
  id: string
  category: Category
  durationMinutes: number
  /** ISO timestamp of when the session ended (manual logs: when they were saved). */
  endedAt: string
}

/** The user condensed five stable circles. A deliberate action, so it is stored. */
export interface CondenseEvent {
  id: string
  /** ISO timestamp. */
  at: string
}

// Output: the derived state the UI renders.

export type CircleStatus = 'forming' | 'unstable' | 'stable'

export interface CircleState {
  /** 0-based position, inner to outer. */
  index: number
  status: CircleStatus
  minutes: number
  requiredMinutes: number
  /** Rhythm days gathered toward stability. */
  rhythm: number
  requiredRhythm: number
  formedAt: string | null
  stableAt: string | null
}

export type Milestone =
  | { type: 'heart-formed'; at: string; sessionId: string }
  | { type: 'circle-formed'; at: string; sessionId: string | null; level: number; circle: number }
  | { type: 'circle-stable'; at: string; sessionId: string | null; level: number; circle: number }
  | { type: 'condensed'; at: string; condenseId: string; level: number }

export interface RhythmDay {
  /** Local calendar day, YYYY-MM-DD. */
  date: string
  /** 0 = Monday … 6 = Sunday. */
  weekday: number
  practiced: boolean
  isToday: boolean
}

export interface HeartState {
  /** 'gathering' until the heart forms, then 'circles'. */
  phase: 'gathering' | 'circles'
  /** 0 while gathering, 1+ once the heart has formed. */
  level: number
  rank: string | null
  heart: { formed: boolean; minutes: number; requiredMinutes: number }
  /** Formed circles plus the one currently forming (if fewer than the max are formed). */
  circles: CircleState[]
  formedCount: number
  stableCount: number
  unstableCount: number
  /** Minutes gathered across this level's circles, e.g. "6h 40m / 10h". */
  levelProgress: { minutes: number; requiredMinutes: number }
  /** Minutes logged after all circles formed; they flow into the next level on condense. */
  reserveMinutes: number
  canCondense: boolean
  rhythm: { last7: RhythmDay[]; practicedInLast7: number }
  totals: {
    minutes: number
    meditationMinutes: number
    studyMinutes: number
    sessions: number
    practiceDays: number
  }
  /** Every milestone in chronological order. The UI shows the ones the user hasn't seen. */
  milestones: Milestone[]
}

// The Constellation: which stars are lit, when they lit, and which are next.
// Pure and derived from raw logs, like the heart. Thresholds live in config.stars.
import { DEFAULT_CONFIG, type ProgressionConfig } from './config'
import { dayKey, daysBetween, localHour } from './time'
import type { Category, Milestone, SessionLog } from './types'

export type StarBranch = 'ranks' | 'mind' | 'lore' | 'rhythm'
export type StarKind = 'rank' | 'mile' | 'side'
export type StarState = 'lit' | 'next' | 'distant'

export type StarRule =
  | { type: 'rank'; level: number }
  | { type: 'hours'; category: Category; hours: number }
  | { type: 'first'; category: Category }
  | { type: 'long'; category: Category; minutes: number }
  | { type: 'dawn' }
  | { type: 'night' }
  | { type: 'days'; days: number }
  | { type: 'run'; days: number }
  | { type: 'returned'; afterDays: number }

export interface Star {
  id: string
  branch: StarBranch
  kind: StarKind
  /** Position along its branch: chain order for ranks and miles, order among side stars. */
  index: number
  /** The star this one hangs from; null means the heart. */
  parent: string | null
  rule: StarRule
  state: StarState
  litAt: string | null
  /** For counted stars: how far along (minutes, days, or run length). */
  progress?: { current: number; target: number }
}

export interface Constellation {
  stars: Star[]
  meditationMinutes: number
  studyMinutes: number
}

export interface ConstellationInput {
  sessions: readonly SessionLog[]
  /** From computeHeartState: ranks light when the heart forms and when it condenses. */
  milestones: readonly Milestone[]
  timeZone: string
  now: Date
  config?: ProgressionConfig
}

type Def = Omit<Star, 'state' | 'litAt' | 'progress'>

/** The fixed shape of the sky. Parents always come before their children. */
export function starDefinitions(cfg: ProgressionConfig = DEFAULT_CONFIG): Def[] {
  const s = cfg.stars
  const defs: Def[] = []
  const at = <T,>(list: readonly T[], i: number) => list[Math.min(i, list.length - 1)]

  cfg.ranks.forEach((_, i) => defs.push({
    id: `rank${i + 1}`, branch: 'ranks', kind: 'rank', index: i,
    parent: i === 0 ? null : `rank${i}`, rule: { type: 'rank', level: i + 1 },
  }))

  for (const [branch, category, prefix] of [['mind', 'meditation', 'm'], ['lore', 'study', 'l']] as const) {
    s.hours.forEach((h, i) => defs.push({
      id: `${prefix}${h}`, branch, kind: 'mile', index: i,
      parent: i === 0 ? null : `${prefix}${s.hours[i - 1]}`, rule: { type: 'hours', category, hours: h },
    }))
  }
  defs.push(
    { id: 'firstsit', branch: 'mind', kind: 'side', index: 0, parent: `m${at(s.hours, 0)}`, rule: { type: 'first', category: 'meditation' } },
    { id: 'longsit', branch: 'mind', kind: 'side', index: 1, parent: `m${at(s.hours, 2)}`, rule: { type: 'long', category: 'meditation', minutes: s.longSitMinutes } },
    { id: 'dawnsit', branch: 'mind', kind: 'side', index: 2, parent: `m${at(s.hours, 3)}`, rule: { type: 'dawn' } },
    { id: 'deepstudy', branch: 'lore', kind: 'side', index: 0, parent: `l${at(s.hours, 2)}`, rule: { type: 'long', category: 'study', minutes: s.deepStudyMinutes } },
    { id: 'nightscholar', branch: 'lore', kind: 'side', index: 1, parent: `l${at(s.hours, 3)}`, rule: { type: 'night' } },
  )

  s.practiceDays.forEach((d, i) => defs.push({
    id: `d${d}`, branch: 'rhythm', kind: 'mile', index: i,
    parent: i === 0 ? null : `d${s.practiceDays[i - 1]}`, rule: { type: 'days', days: d },
  }))
  s.runs.forEach((d, i) => defs.push({
    id: `run${d}`, branch: 'rhythm', kind: 'side', index: i,
    parent: i === 0 ? `d${at(s.practiceDays, 0)}` : `run${s.runs[i - 1]}`, rule: { type: 'run', days: d },
  }))
  defs.push({
    id: 'returned', branch: 'rhythm', kind: 'side', index: s.runs.length,
    parent: `d${at(s.practiceDays, 1)}`, rule: { type: 'returned', afterDays: s.returnedAfterDays },
  })
  return defs
}

export function computeConstellation(input: ConstellationInput): Constellation {
  const cfg = input.config ?? DEFAULT_CONFIG
  const s = cfg.stars
  const { timeZone } = input
  const defs = starDefinitions(cfg)
  const litAt = new Map<string, string>()
  const light = (id: string, at: string) => {
    if (!litAt.has(id)) litAt.set(id, at)
  }

  // Ranks: the heart forming is Apprentice; each condensation reaches the next rank.
  for (const m of input.milestones) {
    if (m.type === 'heart-formed') light('rank1', m.at)
    if (m.type === 'condensed' && m.level <= cfg.ranks.length) light(`rank${m.level}`, m.at)
  }

  const minutes = { meditation: 0, study: 0 }
  const dayTotals = new Map<string, number>()
  let practiceDays = 0
  let run = 0
  let lastPracticeDay: string | null = null

  const sessions = input.sessions
    .filter((x) => Number.isFinite(x.durationMinutes) && x.durationMinutes > 0)
    .map((x) => ({ ...x, t: Date.parse(x.endedAt) }))
    .sort((a, b) => a.t - b.t || a.id.localeCompare(b.id))

  for (const x of sessions) {
    const at = x.endedAt
    const prefix = x.category === 'meditation' ? 'm' : 'l'
    const before = minutes[x.category]
    minutes[x.category] += x.durationMinutes
    for (const h of s.hours) {
      if (before < h * 60 && minutes[x.category] >= h * 60) light(`${prefix}${h}`, at)
    }

    const startHour = localHour(new Date(x.t - x.durationMinutes * 60_000), timeZone)
    if (x.category === 'meditation') {
      light('firstsit', at)
      if (x.durationMinutes >= s.longSitMinutes) light('longsit', at)
      if (startHour >= s.dawnFromHour && startHour < s.dawnBeforeHour) light('dawnsit', at)
    } else {
      if (x.durationMinutes >= s.deepStudyMinutes) light('deepstudy', at)
      if (startHour >= s.nightFromHour || startHour < s.dawnFromHour) light('nightscholar', at)
    }

    // Practice days and runs, using the same day and grace rules as the heart's rhythm.
    const day = dayKey(at, timeZone)
    const dayBefore = dayTotals.get(day) ?? 0
    dayTotals.set(day, dayBefore + x.durationMinutes)
    if (dayBefore < cfg.practiceDayMinMinutes && dayBefore + x.durationMinutes >= cfg.practiceDayMinMinutes) {
      practiceDays += 1
      const gap = lastPracticeDay === null ? null : daysBetween(lastPracticeDay, day)
      run = gap !== null && gap <= cfg.graceDays + 1 ? run + 1 : 1
      if (gap !== null && gap > s.returnedAfterDays) light('returned', at)
      lastPracticeDay = day
      for (const d of s.practiceDays) if (practiceDays === d) light(`d${d}`, at)
      for (const d of s.runs) if (run === d) light(`run${d}`, at)
    }
  }

  // A run only counts as current while it could still continue today.
  const today = dayKey(input.now, timeZone)
  const currentRun = lastPracticeDay && daysBetween(lastPracticeDay, today) <= cfg.graceDays + 1 ? run : 0

  const progressFor = (rule: StarRule): Star['progress'] => {
    switch (rule.type) {
      case 'hours': return { current: minutes[rule.category], target: rule.hours * 60 }
      case 'days': return { current: practiceDays, target: rule.days }
      case 'run': return { current: currentRun, target: rule.days }
      default: return undefined
    }
  }

  const states = new Map<string, StarState>()
  const kinds = new Map(defs.map((d) => [d.id, d.kind]))
  const stars: Star[] = defs.map((def) => {
    const lit = litAt.get(def.id) ?? null
    const parentState = def.parent === null ? 'lit' : states.get(def.parent)
    // Main-branch stars are next once their parent is lit. A side star may also be next when it
    // hangs from a next main-branch star (but side stars never chain "next" onto each other).
    const parentIsMain = def.parent === null || kinds.get(def.parent) !== 'side'
    const near = parentState === 'lit' || (def.kind === 'side' && parentState === 'next' && parentIsMain)
    const state: StarState = lit ? 'lit' : near ? 'next' : 'distant'
    states.set(def.id, state)
    return { ...def, state, litAt: lit, progress: progressFor(def.rule) }
  })

  return { stars, meditationMinutes: minutes.meditation, studyMinutes: minutes.study }
}

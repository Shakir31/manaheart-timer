/**
 * All progression numbers live here. Tune freely: state is always recomputed
 * from raw logs, so changing a number never needs a data migration.
 */
export interface ProgressionConfig {
  /** Minutes needed to form the heart. */
  heartMinutes: number
  circlesPerLevel: number
  /** Minutes per circle at level 1, 2, 3… */
  circleMinutesByLevel: readonly number[]
  /** Added per level once past the end of circleMinutesByLevel. */
  circleMinutesStepAfter: number
  /** Rhythm days per circle at level 1, 2, 3… (the last value repeats). */
  circleRhythmByLevel: readonly number[]
  /** A day counts as practised once its total reaches this. */
  practiceDayMinMinutes: number
  /**
   * Missed days allowed between practice days while still keeping rhythm.
   * 1 means practising every other day still counts.
   */
  graceDays: number
  /** Rank per level; the last one holds for every level after. */
  ranks: readonly string[]
  /** Constellation star thresholds. */
  stars: StarConfig
}

export interface StarConfig {
  /** Hour milestones on the Mind (meditation) and Lore (study) branches. */
  hours: readonly number[]
  /** A single meditation session at least this long lights "Long sit". */
  longSitMinutes: number
  /** A single study session at least this long lights "Deep study". */
  deepStudyMinutes: number
  /** "Dawn sit": meditation begun from this hour… */
  dawnFromHour: number
  /** …and before this hour (local time). */
  dawnBeforeHour: number
  /** "Night scholar": study begun at or after this hour (until dawnFromHour). */
  nightFromHour: number
  /** Practice-day milestones on the Rhythm branch. */
  practiceDays: readonly number[]
  /** Rhythm runs (practice days in a row, grace days allowed) on the Rhythm branch. */
  runs: readonly number[]
  /** "Returned": practising again after more than this many days away. */
  returnedAfterDays: number
}

export const DEFAULT_CONFIG: ProgressionConfig = {
  heartMinutes: 5 * 60,
  circlesPerLevel: 5,
  circleMinutesByLevel: [120, 180, 240, 300, 360],
  circleMinutesStepAfter: 60,
  circleRhythmByLevel: [4, 5, 6],
  practiceDayMinMinutes: 10,
  graceDays: 1,
  ranks: ['Apprentice', 'Adept', 'Magus', 'Archmagus', 'Sage'],
  stars: {
    hours: [1, 5, 10, 25, 50, 100, 250],
    longSitMinutes: 60,
    deepStudyMinutes: 120,
    dawnFromHour: 4,
    dawnBeforeHour: 7,
    nightFromHour: 22,
    practiceDays: [7, 30, 100],
    runs: [7, 21, 60],
    returnedAfterDays: 7,
  },
}

export function circleMinutesFor(level: number, cfg: ProgressionConfig): number {
  const table = cfg.circleMinutesByLevel
  if (level <= table.length) return table[Math.max(level, 1) - 1]
  return table[table.length - 1] + (level - table.length) * cfg.circleMinutesStepAfter
}

export function circleRhythmFor(level: number, cfg: ProgressionConfig): number {
  const table = cfg.circleRhythmByLevel
  return table[Math.min(Math.max(level, 1), table.length) - 1]
}

export function rankFor(level: number, cfg: ProgressionConfig): string | null {
  if (level < 1) return null
  return cfg.ranks[Math.min(level, cfg.ranks.length) - 1]
}

// Words for the heart's state, following the design system's voice rules.
import { circleOrdinal, DEFAULT_CONFIG, type HeartState, type RhythmDay } from '../engine'

export interface ProgressInfo {
  /** "Fourth circle forming", "Heart forming", "Five circles formed". */
  label: string
  minutes: number
  requiredMinutes: number
  /** Text after the target, e.g. "until your heart forms". */
  suffix?: string
  /** Before formation the fill is softer (ProgressLine spec). */
  gathering: boolean
}

export function progressInfo(state: HeartState): ProgressInfo {
  if (!state.heart.formed) {
    return {
      label: 'Heart forming',
      minutes: state.heart.minutes,
      requiredMinutes: state.heart.requiredMinutes,
      suffix: 'until your heart forms',
      gathering: true,
    }
  }
  const forming = state.circles.find((c) => c.status === 'forming')
  return {
    label: forming ? `${circleOrdinal(forming.index)} circle forming` : 'Five circles formed',
    minutes: state.levelProgress.minutes,
    requiredMinutes: state.levelProgress.requiredMinutes,
    gathering: false,
  }
}

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five']

/** The one quiet italic line under the rank: "Three circles turn around the heart, though the third still wavers." */
export function heartMoment(state: HeartState): string {
  if (!state.heart.formed) return 'Mana is gathering.'
  if (state.canCondense) return 'All five circles are steady and ready to condense.'
  const { formedCount, unstableCount } = state
  if (formedCount === 0) return 'The heart has formed, and the first circle is gathering.'
  const turn = formedCount === 1 ? 'One circle turns around the heart' : `${COUNT[formedCount]} circles turn around the heart`
  if (unstableCount === 0) return `${turn}.`
  if (formedCount === 1) return `${turn}, though it still wavers.`
  if (unstableCount === formedCount) return `${turn}, though they all still waver.`
  if (unstableCount === 1) {
    const unstable = state.circles.find((c) => c.status === 'unstable')!
    return `${turn}, though the ${circleOrdinal(unstable.index).toLowerCase()} still wavers.`
  }
  return `${turn}, though ${COUNT[unstableCount].toLowerCase()} still waver.`
}

/** Where new mana goes: "the fourth circle", "the heart", "the heart's reserve". */
export function flowTarget(state: HeartState): string {
  if (!state.heart.formed) return 'the heart'
  const forming = state.circles.find((c) => c.status === 'forming')
  return forming ? `the ${circleOrdinal(forming.index).toLowerCase()} circle` : "the heart's reserve"
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function rhythmCount(days: RhythmDay[]): string {
  return `${days.filter((d) => d.practiced).length} of ${days.length} days`
}

/** Sentence label for the rhythm dots (RhythmWeek spec). */
export function rhythmLabel(days: RhythmDay[]): string {
  const practiced = days.filter((d) => d.practiced).length
  const missed = days.filter((d) => !d.practiced && !d.isToday).map((d) => DAY_NAMES[d.weekday])
  const today = days.find((d) => d.isToday)
  let text = `Practised on ${practiced} of the last ${days.length} days`
  if (missed.length) text += `; missed ${joinList(missed)}`
  if (today && !today.practiced) text += '; today not yet'
  return text
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

/**
 * The rhythm line after a session. "Kept" when today counts as a rhythm day
 * (a practice day within the grace window of the previous one).
 */
export function rhythmNote(days: RhythmDay[], graceDays = DEFAULT_CONFIG.graceDays): string {
  const count = `${days.filter((d) => d.practiced).length} of the last ${days.length} days`
  const today = days.at(-1)
  if (!today?.practiced) return `A few more minutes today will keep the rhythm going · ${count}`
  const recent = days.slice(-(graceDays + 2), -1)
  return recent.some((d) => d.practiced) ? `Rhythm kept · ${count}` : `A new rhythm starts today · ${count}`
}

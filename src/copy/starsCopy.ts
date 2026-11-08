// Words for the Constellation: star labels, the star sheet, and how the sky leans.
import { DEFAULT_CONFIG, formatDuration, type Star, type StarBranch, type StarRule } from '../engine'
import { formatShortDate } from './dates'

const NUMBER_WORDS: Record<number, string> = {
  1: 'One', 5: 'Five', 7: 'Seven', 10: 'Ten', 21: 'Twenty-one', 25: 'Twenty-five', 30: 'Thirty',
  50: 'Fifty', 60: 'Sixty', 100: 'A hundred', 250: 'Two hundred and fifty',
}
const words = (n: number) => NUMBER_WORDS[n] ?? String(n)

export const BRANCH_NAME: Record<StarBranch, string> = { ranks: 'Ranks', mind: 'Mind', lore: 'Lore', rhythm: 'Rhythm' }

const rankName = (level: number) => DEFAULT_CONFIG.ranks[level - 1] ?? `Level ${level}`

/** Short label beside the star in the sky ("25h", "Dawn sit"). */
export function starLabel(rule: StarRule): string {
  switch (rule.type) {
    case 'rank': return rankName(rule.level)
    case 'hours': return `${rule.hours}h`
    case 'first': return 'First sit'
    case 'long': return rule.category === 'meditation' ? 'Long sit' : 'Deep study'
    case 'dawn': return 'Dawn sit'
    case 'night': return 'Night scholar'
    case 'days': return `${rule.days} days`
    case 'run': return `${rule.days}-day run`
    case 'returned': return 'Returned'
  }
}

/** The star's name in the sheet ("A hundred hours"). */
export function starTitle(rule: StarRule): string {
  switch (rule.type) {
    case 'hours': return rule.hours === 1 ? 'One hour' : `${words(rule.hours)} hours`
    case 'days': return `${words(rule.days)} days`
    case 'run': return `A ${words(rule.days).toLowerCase()}-day run`
    default: return starLabel(rule)
  }
}

/** One quiet line about what the star means. */
export function starLine(rule: StarRule): string {
  switch (rule.type) {
    case 'rank':
      return rule.level === 1 ? 'The heart forms. The first light in the sky.' : `Five circles condensed into ${rankName(rule.level)}.`
    case 'hours': {
      // "One hundred" reads better than "A hundred" mid-sentence (the design's own line).
      const amount = rule.hours === 1 ? 'One hour' : rule.hours === 100 ? 'One hundred hours' : `${words(rule.hours)} hours`
      return rule.category === 'meditation' ? `${amount} of stillness, gathered sit by sit.` : `${amount} of study, gathered page by page.`
    }
    case 'first': return 'The first quiet minutes, kept.'
    case 'long': return rule.category === 'meditation'
      ? `${formatDuration(rule.minutes)} or more in a single sit.`
      : `${formatDuration(rule.minutes)} or more of study in one sitting.`
    case 'dawn': return 'A sit begun in the early hours, before seven.'
    case 'night': return 'Study begun late, after ten at night.'
    case 'days': return `${words(rule.days)} days with practice in them.`
    case 'run': return `${words(rule.days)} practice days in a row. A missed day between them is forgiven.`
    case 'returned': return 'Coming back after more than a week away. The sky remembers.'
  }
}

/** What lights it, with how far there is to go when that can be counted. */
export function starRequirement(star: Star): string {
  const { rule, progress } = star
  const left = progress ? Math.max(0, progress.target - progress.current) : 0
  switch (rule.type) {
    case 'rank': return `Lights when you reach ${rankName(rule.level)}`
    case 'hours':
      return `Lights at ${rule.hours}h of ${rule.category === 'meditation' ? 'meditation' : 'study'} · ${formatDuration(left)} to go`
    case 'days': return `Lights at ${rule.days} practice days · ${left} to go`
    case 'run': return `Lights at a ${rule.days}-day run · ${left} to go`
    case 'first': return 'Lights with your first meditation'
    case 'long': return rule.category === 'meditation'
      ? `Lights with a single sit of ${formatDuration(rule.minutes)}`
      : `Lights with ${formatDuration(rule.minutes)} of study in one sitting`
    case 'dawn': return 'Lights with a sit begun between 4 and 7 am'
    case 'night': return 'Lights with study begun after 10 pm'
    case 'returned': return `Lights when you return after more than ${rule.afterDays} days away`
  }
}

export interface StarSheetCopy {
  eyebrow: string
  title: string
  line: string | null
  status: string
  before: string | null
}

/** Everything the star sheet shows. Distant stars stay nameless (design: "nameless until close"). */
export function starSheet(star: Star, parent: Star | null, timeZone: string): StarSheetCopy {
  const branch = BRANCH_NAME[star.branch]
  if (star.state === 'distant') {
    return {
      eyebrow: `${branch} · Distant`,
      title: 'A distant star',
      line: null,
      status: 'Light the stars nearer the heart first.',
      before: null,
    }
  }
  const lit = star.state === 'lit' && star.litAt
  return {
    eyebrow: `${branch} · ${lit ? 'Lit' : 'Next to light'}`,
    title: starTitle(star.rule),
    line: starLine(star.rule),
    status: lit ? `Lit ${formatShortDate(star.litAt!, timeZone)}` : starRequirement(star),
    before: parent?.litAt ? `Before it on this branch: ${starTitle(parent.rule)}, lit ${formatShortDate(parent.litAt, timeZone)}` : null,
  }
}

export interface LeanCopy {
  title: string
  body: string
  /** Meditation's share of all practice, 0–1 (0.5 when empty). */
  ratio: number
}

/** How the sky leans between Mind and Lore. */
export function skyLean(meditationMinutes: number, studyMinutes: number): LeanCopy {
  const total = meditationMinutes + studyMinutes
  if (total === 0) {
    return { title: 'Your sky is still dark.', body: 'Each session lights it a little. The faint stars are the nearest ones.', ratio: 0.5 }
  }
  const ratio = meditationMinutes / total
  if (ratio >= 0.65) {
    return { title: 'Your sky leans toward Mind.', body: 'Most of your hours have gone to stillness; Lore is still a short line of light.', ratio }
  }
  if (ratio <= 0.35) {
    return { title: 'Your sky leans toward Lore.', body: 'Most of your hours have gone to study; Mind is still a short line of light.', ratio }
  }
  return { title: 'Your sky is in balance.', body: 'Stillness and study are growing side by side.', ratio }
}

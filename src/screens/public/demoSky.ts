// A mid-journey sky for the landing page, built by running a made-up history through the
// real engine, so the preview always matches how the Constellation actually looks.
import { computeConstellation, computeHeartState, type SessionLog } from '../../engine'

const NOW = new Date('2026-06-30T12:00:00Z')
const DAY = 86_400_000
const at = (daysAgo: number, hour: number) => new Date(NOW.getTime() - daysAgo * DAY + (hour - 12) * 3_600_000).toISOString()

function history(): SessionLog[] {
  const sessions: SessionLog[] = []
  let n = 0
  // About two months of hour-long sits (one at dawn), a stretch of study, a break, then a return.
  for (let d = 75; d >= 14; d--) sessions.push({ id: `m${n++}`, category: 'meditation', durationMinutes: 60, endedAt: at(d, d === 30 ? 6 : 20) })
  for (let d = 40; d >= 25; d--) sessions.push({ id: `s${n++}`, category: 'study', durationMinutes: 90, endedAt: at(d, 14) })
  for (let d = 3; d >= 1; d--) sessions.push({ id: `r${n++}`, category: 'meditation', durationMinutes: 30, endedAt: at(d, 19) })
  return sessions
}

export function demoSky() {
  const sessions = history()
  const heart = computeHeartState({ sessions, condensations: [{ id: 'c1', at: at(20, 21) }], timeZone: 'UTC', now: NOW })
  const sky = computeConstellation({ sessions, milestones: heart.milestones, timeZone: 'UTC', now: NOW })
  return { stars: sky.stars, ratio: sky.meditationMinutes / (sky.meditationMinutes + sky.studyMinutes) }
}

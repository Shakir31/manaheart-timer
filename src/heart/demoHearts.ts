// Illustrative hearts for Welcome and Sign in, built by running made-up logs through the
// real engine, so they always look exactly like a real heart would.
import { computeHeartState, type SessionLog } from '../engine'
import { heartModel, type HeartModel } from './heartModel'

const NOW = new Date('2026-01-31T12:00:00Z')
const day = (d: number) => `2026-01-${String(d).padStart(2, '0')}T09:00:00Z`
const log = (id: string, minutes: number, d: number): SessionLog => ({ id, category: 'study', durationMinutes: minutes, endedAt: day(d) })
const model = (sessions: SessionLog[]) => heartModel(computeHeartState({ sessions, timeZone: 'UTC', now: NOW }))

export type DemoHeart = 'gathering' | 'forming' | 'steadying'

export function demoHeart(kind: DemoHeart): HeartModel {
  switch (kind) {
    case 'gathering':
      return model([log('a', 120, 1)])
    case 'forming':
      // Heart, two steady circles and a third forming.
      // 20 days × 30 min + 10 min = 5h heart + two 2h circles + 70 min of the third.
      return model(Array.from({ length: 20 }, (_, i) => log(`d${i}`, 30, i + 1)).concat(log('x', 10, 21)))
    case 'steadying':
      // Five circles: rhythm has steadied most, the outer ones still waver.
      return model([log('b', 900, 1), ...Array.from({ length: 12 }, (_, i) => log(`r${i}`, 10, i + 2))])
  }
}

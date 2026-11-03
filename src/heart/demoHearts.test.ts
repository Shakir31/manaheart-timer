import { describe, expect, it } from 'vitest'
import { demoHeart } from './demoHearts'

describe('demoHeart', () => {
  it('builds the three welcome hearts', () => {
    expect(demoHeart('gathering').phase).toBe('gathering')

    const forming = demoHeart('forming')
    expect(forming.rings.map((r) => r.status)).toEqual(['stable', 'stable', 'forming'])

    const steadying = demoHeart('steadying')
    expect(steadying.rings).toHaveLength(5)
    expect(steadying.rings.map((r) => r.status)).toEqual(['stable', 'stable', 'stable', 'unstable', 'unstable'])
  })
})

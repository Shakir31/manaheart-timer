import { describe, expect, it } from 'vitest'
import guide from '../../docs/guide.md?raw'
import privacy from '../../docs/privacy.md?raw'
import terms from '../../docs/terms.md?raw'
import { parseDoc, parseInline, slugify } from './markdown'

describe('parseInline', () => {
  it('reads bold, italic and links', () => {
    expect(parseInline('A **stable** circle, see [Privacy](./privacy.md) and _this_.')).toEqual([
      { type: 'text', text: 'A ' },
      { type: 'strong', text: 'stable' },
      { type: 'text', text: ' circle, see ' },
      { type: 'link', text: 'Privacy', href: './privacy.md' },
      { type: 'text', text: ' and ' },
      { type: 'em', text: 'this' },
      { type: 'text', text: '.' },
    ])
  })

  it('leaves underscores inside words alone', () => {
    expect(parseInline('snake_case_name')).toEqual([{ type: 'text', text: 'snake_case_name' }])
  })
})

describe('parseDoc', () => {
  const doc = parseDoc(`# Title

_Last updated: 8 November 2026_

First paragraph
continues here.

## What we don't do

Para one.

- Item one
- Item **two**

Para two.
`)

  it('reads the title, date and lede', () => {
    expect(doc.title).toBe('Title')
    expect(doc.updated).toBe('8 November 2026')
    expect(doc.lede).toEqual([{ type: 'text', text: 'First paragraph continues here.' }])
  })

  it('splits sections with slugs, paragraphs and lists', () => {
    expect(doc.sections).toHaveLength(1)
    const s = doc.sections[0]
    expect(s.id).toBe('what-we-dont-do')
    expect(s.blocks.map((b) => b.type)).toEqual(['p', 'ul', 'p'])
    expect(s.blocks[1]).toEqual({ type: 'ul', items: [[{ type: 'text', text: 'Item one' }], [{ type: 'text', text: 'Item ' }, { type: 'strong', text: 'two' }]] })
  })

  it('makes clean slugs', () => {
    expect(slugify('Steady practice & missed days')).toBe('steady-practice-missed-days')
  })
})

describe('the real docs', () => {
  it('parse into titled, dated pages with sections and no leftover placeholders', () => {
    for (const source of [guide, privacy, terms]) {
      const d = parseDoc(source)
      expect(d.title).not.toBe('')
      expect(d.updated).toBe('8 November 2026')
      expect(d.sections.length).toBeGreaterThan(3)
      expect(source).not.toMatch(/\[(date|contact email|your name|region|country|\d+)\]/i)
    }
  })

  it('mention the webnovel and manhwa inspiration in the guide', () => {
    expect(guide).toMatch(/webnovels and manhwas/)
  })
})

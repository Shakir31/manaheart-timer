// A tiny reader for the docs in /docs (Guide, Privacy, Terms). It handles only what those
// files use: a # title, an "_Last updated: …_" line, ## sections, paragraphs, "- " lists,
// **bold**, _italic_ and [links](…). The docs stay the single source of the page text.

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'em'; text: string }
  | { type: 'link'; text: string; href: string }

export type Block = { type: 'p'; content: Inline[] } | { type: 'ul'; items: Inline[][] }

export interface DocSection {
  id: string
  title: string
  blocks: Block[]
}

export interface Doc {
  title: string
  updated: string | null
  /** The first paragraph after the title, shown as an italic lede. */
  lede: Inline[] | null
  /** Any further text before the first section. */
  intro: Block[]
  sections: DocSection[]
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const INLINE = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|(?<![\w])_(.+?)_(?![\w])/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push({ type: 'text', text: text.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ type: 'strong', text: m[1] })
    else if (m[2] !== undefined) out.push({ type: 'link', text: m[2], href: m[3] })
    else out.push({ type: 'em', text: m[4] })
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out
}

export function parseDoc(source: string): Doc {
  const doc: Doc = { title: '', updated: null, lede: null, intro: [], sections: [] }
  let blocks = doc.intro
  let paragraph: string[] = []
  let list: string[] = []

  const flush = () => {
    if (paragraph.length) {
      const content = parseInline(paragraph.join(' '))
      if (blocks === doc.intro && !doc.lede && doc.intro.length === 0) doc.lede = content
      else blocks.push({ type: 'p', content })
      paragraph = []
    }
    if (list.length) {
      blocks.push({ type: 'ul', items: list.map(parseInline) })
      list = []
    }
  }

  for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    const updated = /^_Last updated:?\s*(.+?)_$/i.exec(line)
    if (line.startsWith('# ')) {
      flush()
      doc.title = line.slice(2).trim()
    } else if (updated) {
      flush()
      doc.updated = updated[1]
    } else if (line.startsWith('## ')) {
      flush()
      const title = line.slice(3).trim()
      const section: DocSection = { id: slugify(title), title, blocks: [] }
      doc.sections.push(section)
      blocks = section.blocks
    } else if (line.startsWith('- ')) {
      if (paragraph.length) flush()
      list.push(line.slice(2))
    } else {
      if (list.length) flush()
      paragraph.push(line)
    }
  }
  flush()
  return doc
}

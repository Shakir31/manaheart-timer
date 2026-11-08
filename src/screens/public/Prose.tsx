import { Link } from 'react-router'
import type { Block, Inline } from '../../content/markdown'
import styles from './Public.module.css'

/** Doc links like "./privacy.md" become app routes ("/privacy"). */
function routeFor(href: string): string | null {
  const m = /^\.\/(\w+)\.md(#.*)?$/.exec(href)
  return m ? `/${m[1]}${m[2] ?? ''}` : null
}

export function Inlines({ content }: { content: Inline[] }) {
  return (
    <>
      {content.map((c, i) => {
        if (c.type === 'strong') return <strong key={i}>{c.text}</strong>
        if (c.type === 'em') return <em key={i}>{c.text}</em>
        if (c.type === 'link') {
          const route = routeFor(c.href)
          if (route) return <Link key={i} to={route}>{c.text}</Link>
          const external = /^https?:/.test(c.href)
          return (
            <a key={i} href={c.href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{c.text}</a>
          )
        }
        return <span key={i}>{c.text}</span>
      })}
    </>
  )
}

/** Paragraphs and lists. `itemMark` lets a page put an icon beside list items. */
export function Blocks({ blocks, itemMark }: { blocks: Block[]; itemMark?: (item: Inline[]) => React.ReactNode }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === 'p' ? (
          <p key={i}><Inlines content={b.content} /></p>
        ) : (
          <ul key={i} className={itemMark ? styles.markedList : undefined}>
            {b.items.map((item, j) => (
              <li key={j}>
                {itemMark?.(item)}
                <span><Inlines content={item} /></span>
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  )
}

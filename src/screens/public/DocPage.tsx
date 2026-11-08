import type { ReactNode } from 'react'
import type { Doc, Inline } from '../../content/markdown'
import { Icon } from '../../ui/Icon'
import { Blocks, Inlines } from './Prose'
import styles from './Public.module.css'

interface Props {
  doc: Doc
  /** Small illustration beside a section heading (Guide). */
  illustration?: (sectionId: string) => ReactNode
  /** Icon beside list items (Guide's circle states). */
  itemMark?: (item: Inline[]) => ReactNode
}

/**
 * The shared long-form reading layout (design: Reading layout sheet). On desktop the
 * section list sits in a sticky column; on mobile it folds into "On this page".
 */
export function DocPage({ doc, illustration, itemMark }: Props) {
  const contents = (
    <ol className={styles.tocList}>
      {doc.sections.map((s) => (
        <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>
      ))}
    </ol>
  )

  return (
    <div className={styles.reading}>
      <nav aria-label="On this page" className={styles.tocDesktop}>
        <p className="label">On this page</p>
        {contents}
      </nav>

      <article className={styles.doc}>
        <h1 className={styles.docTitle}>{doc.title}</h1>
        {doc.updated && <p className={styles.updated}>Last updated {doc.updated}</p>}
        {doc.lede && <p className={`moment ${styles.lede}`}><Inlines content={doc.lede} /></p>}
        <Blocks blocks={doc.intro} />

        <details className={styles.tocMobile}>
          <summary>
            On this page
            <Icon name="forward" size={16} className={styles.tocChevron} />
          </summary>
          {contents}
        </details>

        {doc.sections.map((s) => {
          const art = illustration?.(s.id)
          return (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className={art ? `${styles.section} ${styles.withArt}` : styles.section}>
              {art && <div className={styles.art} aria-hidden="true">{art}</div>}
              <div className={styles.sectionBody}>
                <h2 id={`${s.id}-title`} className={styles.sectionTitle}>{s.title}</h2>
                <Blocks blocks={s.blocks} itemMark={itemMark} />
              </div>
            </section>
          )
        })}
      </article>
    </div>
  )
}

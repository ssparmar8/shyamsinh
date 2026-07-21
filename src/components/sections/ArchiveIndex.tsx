import Link from 'next/link'
import { getArchive, recordNumber } from '@/content'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 06 — the 12 non-featured systems as compact rows, each linking to its own record page.
 * In a scrub Scene the heading decodes and each row rises in sequence; the row name keeps its
 * own ScrambleTextAnimated decode. `recordNumber()` is the real catalogue number across all
 * 18 systems (src/content/index.ts), not this list's own position.
 */
export function ArchiveIndex() {
  return (
    <section id="archive" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: ARCHIVE INDEX" seed={6} className={HEADING} />

      <ul className="mt-10">
        {getArchive().map((s) => (
          <li key={s.slug}>
            <Rise>
              {/* Domain hidden below md, matching /archive's own Row component. */}
              <Link
                href={`/systems/${s.slug}`}
                className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 border-b border-[var(--color-border)] py-3 hover:border-[var(--color-ink)] md:grid-cols-[2.5rem_1fr_1fr_auto]"
              >
                <span className={LABEL}>{String(recordNumber(s.slug)).padStart(2, '0')}</span>
                <ScrambleTextAnimated
                  text={s.name}
                  seed={recordNumber(s.slug)}
                  className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]"
                />
                <span className={`${LABEL} hidden md:block`}>{s.domain}</span>
                <span className={LABEL}>{s.year} ▸</span>
              </Link>
            </Rise>
          </li>
        ))}
      </ul>

      <Rise as="div" className="mt-8">
        <Link href="/archive" className={`${LABEL} inline-block hover:text-[var(--color-ink)]`}>
          ▸ FULL ARCHIVE INDEX
        </Link>
      </Rise>
    </section>
  )
}

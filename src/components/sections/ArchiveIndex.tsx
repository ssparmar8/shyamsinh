import Link from 'next/link'
import { getArchive, recordNumber } from '@/content'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 06 — the 12 non-featured systems as compact rows, each linking to its
 * own record page. `recordNumber()` is the real catalogue number across all 18
 * systems (src/content/index.ts), not this list's own position — see Systems.tsx
 * for the same distinction on the featured half of the archive.
 */
export function ArchiveIndex() {
  return (
    <section id="archive" className="py-20 md:py-28">
      <ScrambleTextAnimated as="h2" text="NODE: ARCHIVE INDEX" seed={6} className={HEADING} />

      <ul className="mt-10">
        {getArchive().map((s) => (
          <li key={s.slug}>
            {/*
              Domain hidden below md, matching /archive's own Row component. A
              single combined "domain · year" column at 375px let a long name
              (e.g. "Flourish Together Therapy") and its domain fight over the
              same narrow space, wrapping the name across 2-3 uneven lines —
              measured while screenshotting this beat. /archive solved this
              already; reusing that fix here instead of inventing a new one.
            */}
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
          </li>
        ))}
      </ul>

      <Link href="/archive" className={`${LABEL} mt-8 inline-block hover:text-[var(--color-ink)]`}>
        ▸ FULL ARCHIVE INDEX
      </Link>
    </section>
  )
}

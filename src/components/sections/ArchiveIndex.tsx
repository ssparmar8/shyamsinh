import { MagneticLink } from '@/components/motion/MagneticLink'
import { getArchive, getFeatured, recordNumber } from '@/content'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * One grid for the header captions and every row, so the columns are declared once and
 * cannot drift apart. Cells are placed explicitly rather than by source order: below md the
 * domain drops to a second line under the name instead of disappearing, which auto-placement
 * would render into the year's column.
 */
const GRID =
  'grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-3 md:grid-cols-[2.5rem_1fr_1fr_auto]'

/**
 * Beat 06 — the 12 non-featured systems as compact rows, each linking to its own record page.
 * In a scrub Scene the heading decodes and each row rises in sequence; the row name keeps its
 * own ScrambleTextAnimated decode. `recordNumber()` is the real catalogue number across all
 * 18 systems (src/content/index.ts), not this list's own position.
 *
 * Rows carry region + year, matching /archive's Row exactly — the two render the same records
 * and had drifted, so the same system showed 'US · 2024' on one page and '2024' on the other.
 */
export function ArchiveIndex() {
  const archive = getArchive()

  return (
    <section id="archive" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: ARCHIVE INDEX" seed={6} className={HEADING} />
      {/* Says what this list IS. Twelve rows appeared under the heading with nothing stating
          they are the records BEYOND the six featured above, so the beat read as if the
          archive were 12 systems. Both counts derive from the data. */}
      <Rise as="div" className={`${LABEL} mt-3`}>
        {archive.length} SYSTEMS BEYOND THE {getFeatured().length} FEATURED ABOVE
      </Rise>

      <Rise as="div" className={`${GRID} ${LABEL} mt-10 border-b border-[var(--color-border)] pb-2`}>
        <span>NO</span>
        <span>SYSTEM</span>
        <span className="hidden md:block">DOMAIN</span>
        <span className="text-right">REGION · YEAR</span>
      </Rise>

      <ul>
        {archive.map((s) => (
          <li key={s.slug}>
            <Rise>
              <MagneticLink
                href={`/systems/${s.slug}`}
                className={`${GRID} border-b border-[var(--color-border)] py-3 hover:border-[var(--color-ink)]`}
              >
                <span className={`${LABEL} col-start-1 row-start-1`}>
                  {String(recordNumber(s.slug)).padStart(2, '0')}
                </span>
                <ScrambleTextAnimated
                  as="span"
                  text={s.name}
                  seed={recordNumber(s.slug)}
                  className="col-start-2 row-start-1 font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]"
                />
                {/* Second line on a phone, third column from md. It used to be `hidden`
                    below md, so a mobile visitor got a name and a year and no idea what the
                    system did — the one field that says what the record is. */}
                <span className={`${LABEL} col-start-2 row-start-2 md:col-start-3 md:row-start-1`}>
                  {s.domain}
                </span>
                <span className={`${LABEL} col-start-3 row-start-1 text-right md:col-start-4`}>
                  {s.region} · {s.year} ▸
                </span>
              </MagneticLink>
            </Rise>
          </li>
        ))}
      </ul>

      <Rise as="div" className="mt-8">
        <MagneticLink
          href="/archive"
          text="▸ FULL ARCHIVE INDEX"
          className={`${LABEL} inline-block hover:text-[var(--color-ink)]`}
        />
      </Rise>
    </section>
  )
}

import { CAPABILITIES, STACK } from '@/content/stack'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/** Shared by both halves, so the capability areas and the stack groups tabulate on one grid. */
const ROW =
  'grid grid-cols-1 gap-2 border-b border-[var(--color-hair)] py-5 md:grid-cols-[13rem_1fr] md:gap-x-4'

/**
 * Beat 04.5 — the toolchain. In a scrub Scene the heading decodes, the sub-labels wipe in, and
 * the capability rows + stack groups rise in sequence. Lists stay plain text (decoding a wall
 * of tech names would be noise, not texture). Server-rendered like every beat.
 *
 * Capability items are one per line rather than joined with ' · '. As a middot run-on this was
 * the densest block on the site — six wrapping mono paragraphs with no entry point — and the
 * wrap landed mid-term, so 'RAG architecture · chunking & embedding strategy · re-ranking'
 * broke after the hyphen and read as two separate things. Nothing here is prose; it is a list,
 * and it now looks like one.
 */
export function Stack() {
  return (
    <section id="stack" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: STACK" seed={8} className={HEADING} />

      {/*
        Each half gets its own label. The beat used to carry one combined line
        ('ARCHITECTURE CAPABILITIES · TECHNICAL STACK') under the heading and then switch from
        sentences to chips with nothing marking the seam — a reader hitting the chips had no
        way to tell they had moved from what he can architect to what he builds it with.
      */}
      {/* Braced strings, not bare text: `// CAPABILITIES` as a JSX text node trips
          react/jsx-no-comment-textnodes, which exists because that is nearly always someone
          writing a comment that silently renders. Here it really is the label. */}
      <MaskWipe as="div" className={`${LABEL} mt-10`}>
        {'// CAPABILITIES'}
      </MaskWipe>

      <dl className="mt-4 border-t border-[var(--color-border)]">
        {CAPABILITIES.map((c) => (
          <Rise as="div" key={c.area} className={ROW}>
            <dt className={LABEL}>{c.area}</dt>
            <dd>
              {/*
                CSS columns, not a 2-col grid. A grid aligns rows on the tallest cell, so one
                item wrapping to two lines opened a blank gap beside every short neighbour and
                the list looked broken. Columns flow items down and pack them tight;
                break-inside-avoid keeps a wrapped item from splitting across the fold.
              */}
              <ul className="columns-1 gap-8 sm:columns-2">
                {c.items.map((item) => (
                  <li
                    key={item}
                    className="break-inside-avoid font-mono text-sm text-[var(--color-ink)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </Rise>
        ))}
      </dl>

      <Rise as="div" className={`${LABEL} mt-14`}>
        {'// TECHNICAL STACK'}
      </Rise>

      <div className="mt-4 border-t border-[var(--color-border)]">
        {STACK.map((g) => (
          <Rise as="div" key={g.group} className={ROW}>
            <div className={LABEL}>{g.group}</div>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((t) => (
                <li
                  key={t}
                  className="border border-[var(--color-border)] px-2 py-1 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]"
                >
                  {t}
                </li>
              ))}
            </ul>
          </Rise>
        ))}
      </div>
    </section>
  )
}

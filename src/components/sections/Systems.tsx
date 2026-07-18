import { getFeatured, recordNumber } from '@/content'
import { SystemRecord } from '@/components/record/SystemRecord'

const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 04 — six featured systems, reusing Plan 1's SystemRecord component.
 *
 * `recordNumber(slug) - 1` is the real catalogue index across all 18 systems —
 * NOT this filtered list's own position. Deriving the index from `.map()`'s own
 * position (or from `getFeatured().findIndex`) is exactly the bug documented on
 * `recordNumber` itself: it collapses distinct records onto the same number.
 */
export function Systems() {
  return (
    <section id="systems" className="py-20 md:py-28">
      <h2 className={HEADING}>NODE: SYSTEMS</h2>

      <div className="mt-10 space-y-8">
        {getFeatured().map((s) => (
          <SystemRecord key={s.slug} system={s} index={recordNumber(s.slug) - 1} />
        ))}
      </div>
    </section>
  )
}

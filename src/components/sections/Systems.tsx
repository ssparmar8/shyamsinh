import { getFeatured, recordNumber } from '@/content'
import { SystemRecord } from '@/components/record/SystemRecord'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'

const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 04 — six featured systems. In a scrub Scene the heading decodes and each record rises
 * in sequence as the beat assembles (the Scene orders layers by DOM position). Under
 * static/reveal every record renders in normal flow. `recordNumber(slug) - 1` is the real
 * catalogue index across all 18 systems, NOT this filtered list's position.
 */
export function Systems() {
  return (
    <section id="systems" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: SYSTEMS" seed={4} className={HEADING} />

      <div className="mt-10 space-y-8">
        {getFeatured().map((s, i) => (
          <Rise key={s.slug}>
            <SystemRecord system={s} index={recordNumber(s.slug) - 1} seedBase={i + 1} />
          </Rise>
        ))}
      </div>
    </section>
  )
}

import { getFeatured, recordNumber } from '@/content'
import { SystemRecord } from '@/components/record/SystemRecord'
import { Reveal } from '@/components/motion/Reveal'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 04 — six featured systems. Each record is wrapped in its OWN Reveal so the
 * six slide in one after another as the reader scrolls through them (each Reveal
 * owns a ScrollTrigger at `top 85%`), rather than the whole block appearing at
 * once. page.tsx therefore no longer wraps this section in a single Reveal.
 *
 * `recordNumber(slug) - 1` is the real catalogue index across all 18 systems, NOT
 * this filtered list's position — see recordNumber's own doc. `seedBase` varies the
 * decode noise per record.
 */
export function Systems() {
  return (
    <section id="systems" className="py-20 md:py-28">
      <ScrambleTextAnimated as="h2" text="NODE: SYSTEMS" className={HEADING} />

      <div className="mt-10 space-y-8">
        {getFeatured().map((s, i) => (
          <Reveal key={s.slug}>
            <SystemRecord system={s} index={recordNumber(s.slug) - 1} seedBase={i + 1} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

import { TRAJECTORY, CONTINUITY } from '@/content/trajectory'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 03 — "the climb". A vertical dated list (no horizontal scroll anywhere on the page).
 * In a scrub Scene the heading decodes and each node rises in sequence; under static/reveal
 * every node renders unconditionally so a no-JS visitor sees the same timeline.
 */
export function Trajectory() {
  return (
    <section id="trajectory" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: TRAJECTORY" seed={3} className={HEADING} />

      <ol className="mt-10 space-y-8 border-l border-[var(--color-border)] pl-6">
        {TRAJECTORY.map((node) => (
          <li key={`${node.year}-${node.label}`}>
            <Rise>
              <div className={LABEL}>{node.year}</div>
              <div className="mt-1 font-mono text-base tracking-[var(--tracking-hud)] text-[var(--color-ink)] md:text-lg">
                {node.label}
              </div>
              {(node.note || node.detail) && (
                <div className={`${LABEL} mt-1`}>
                  {[node.note, node.detail].filter(Boolean).join(' · ')}
                </div>
              )}
            </Rise>
          </li>
        ))}
      </ol>

      <Rise as="div" className={`${LABEL} mt-10`}>
        {CONTINUITY}
      </Rise>
    </section>
  )
}

import { TRAJECTORY, CONTINUITY } from '@/content/trajectory'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 03 — "the climb" (spec §4.2). Deliberately unadorned: dates and facts
 * only, no narrative framing beyond what TRAJECTORY itself carries. Rendered as
 * a vertical dated list rather than the horizontal arrow-chain sketched in the
 * plan — a horizontal row of five nodes is exactly the kind of thing that
 * forces `overflow-x` at 375px, and the non-negotiable here is no horizontal
 * scroll anywhere on the page. All 5 nodes render unconditionally (no reveal
 * gating) so a no-JS visitor sees the same timeline as anyone else.
 */
export function Trajectory() {
  return (
    <section id="trajectory" className="py-20 md:py-28">
      <ScrambleTextAnimated as="h2" text="NODE: TRAJECTORY" seed={3} className={HEADING} />

      <ol className="mt-10 space-y-8 border-l border-[var(--color-border)] pl-6">
        {TRAJECTORY.map((node) => (
          <li key={`${node.year}-${node.label}`}>
            <div className={LABEL}>{node.year}</div>
            <div className="mt-1 font-mono text-base tracking-[var(--tracking-hud)] text-[var(--color-ink)] md:text-lg">
              {node.label}
            </div>
            {(node.note || node.detail) && (
              <div className={`${LABEL} mt-1`}>
                {[node.note, node.detail].filter(Boolean).join(' · ')}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className={`${LABEL} mt-10`}>{CONTINUITY}</div>
    </section>
  )
}

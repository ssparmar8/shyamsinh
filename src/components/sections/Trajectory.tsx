import { TRAJECTORY, CONTINUITY } from '@/content/trajectory'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 03 — "the climb". A vertical dated list (no horizontal scroll anywhere on the page).
 * In a scrub Scene the heading decodes and each node rises in sequence; under static/reveal
 * every node renders unconditionally so a no-JS visitor sees the same timeline.
 *
 * The rail carries a marker per node so the list reads as a timeline rather than an indented
 * paragraph, and `note` — the interval since the previous node — is rendered ON the rail in
 * the gap it describes. It used to be joined to `detail` with a middot, which produced
 * "+3 YRS · Sanjaybhai Rajguru · CGPA 8.68": three years read as an attribute of the college
 * rather than as the distance from the row above.
 */
export function Trajectory() {
  const last = TRAJECTORY.length - 1

  return (
    <section id="trajectory" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: TRAJECTORY" seed={3} className={HEADING} />

      <ol className="mt-10 border-l border-[var(--color-border)] pl-6">
        {TRAJECTORY.map((node, i) => {
          // The endpoint of a trajectory is the node a visitor is actually hiring, so it gets
          // the filled, pulsing marker and a tag — it was previously the emptiest row on the
          // page (no note, no detail). Derived from position, so appending a node to the
          // content file moves "current" with it.
          const current = i === last
          return (
            <li key={`${node.year}-${node.label}`} className={i > 0 ? 'mt-8' : undefined}>
              {/* Sits in the gap it measures: mt-8 above from the row before, mb-8 below to
                  the marker it precedes, so it reads as the distance between two dots. */}
              {node.span && <div className={`${LABEL} mb-8`}>{node.span}</div>}
              <Rise>
                <div className="relative">
                  {/*
                    Decorative: the row already reads "2015 · DIPLOMA · GTU", and announcing a
                    bullet before each node would add nothing. Offset by the ol's 24px padding
                    plus half the 7px marker, so it sits centred on the rail.
                  */}
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[27.5px] top-[3px] h-[7px] w-[7px] rounded-full ${
                      current
                        ? 'status-pulse bg-[var(--color-ink)]'
                        : 'border border-[var(--color-dim)] bg-[var(--color-bg)]'
                    }`}
                  />
                  <div className={LABEL}>{node.year}</div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <span className="font-mono text-base tracking-[var(--tracking-hud)] text-[var(--color-ink)] md:text-lg">
                      {node.label}
                    </span>
                    {current && (
                      <span
                        className={`${LABEL} border border-[var(--color-border)] px-2 py-[3px] text-[var(--color-ink)]`}
                      >
                        CURRENT
                      </span>
                    )}
                  </div>
                  {/* `note` qualifies the node ('TRADE'), so it stays on the row. Only `span`
                      moves to the rail — see the field note in content/trajectory.ts. */}
                  {(node.note || node.detail) && (
                    <div className={`${LABEL} mt-1`}>
                      {[node.note, node.detail].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </Rise>
            </li>
          )
        })}
      </ol>

      <Rise as="div" className={`${LABEL} mt-10`}>
        {CONTINUITY}
      </Rise>
    </section>
  )
}

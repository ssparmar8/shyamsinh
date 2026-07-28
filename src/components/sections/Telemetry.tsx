import { countClientRegions, getTelemetryNodes } from '@/content'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'
import { TelemetryMap } from '@/components/canvas/TelemetryMap'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'
const ROW = 'grid items-baseline gap-x-4 gap-y-2 border-b border-[var(--color-hair)] py-3'

/**
 * Beat 05 — the telemetry map: systems delivered to the client regions, from India. In a
 * scrub Scene the heading decodes, the sub-label and the (aria-hidden) map wipe in, and the
 * region readouts rise. Copy uses countClientRegions() (3), never countRegions() (4) — see
 * src/content/index.ts. The `<dl>` is the accessible truth; the map is decorative.
 *
 * The readout is a ruled table with a tally, not a flat list. Every row used to render at the
 * same 10px dim weight, so "15 SYSTEMS DELIVERED" and "1 SYSTEM DELIVERED" looked identical
 * and the distribution — the one thing a map of delivery is for — had to be read digit by
 * digit. ORIGIN sat in that same list too, reading as a fourth region rather than as the
 * place the arcs start from.
 */
export function Telemetry() {
  const { home, clients } = getTelemetryNodes()
  const lat = `${Math.abs(home.lat).toFixed(2)}°${home.lat >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(home.lon).toFixed(2)}°${home.lon >= 0 ? 'E' : 'W'}`

  return (
    <section id="telemetry" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: TELEMETRY" seed={5} className={HEADING} />
      <MaskWipe as="div" className={`${LABEL} mt-3`}>
        CLIENT WORK DELIVERED ACROSS {countClientRegions()} REGIONS
      </MaskWipe>

      <MaskWipe>
        <TelemetryMap />
      </MaskWipe>

      <Rise as="dl" className="mt-6 border-t border-[var(--color-border)]">
        {/* Origin first and set apart: it is where the work is done from, not somewhere work
            was delivered to. Counting it as a region is the exact error countRegions() makes. */}
        <div className={`${ROW} grid-cols-[5rem_1fr]`}>
          <dt className={LABEL}>ORIGIN</dt>
          <dd className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
            {home.label}
            <span className={`${LABEL} ml-3`}>
              {lat} / {lon}
            </span>
          </dd>
        </div>

        {clients.map((c) => (
          <div key={c.region} className={`${ROW} grid-cols-[5rem_1fr_auto]`}>
            <dt className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
              {c.region}
            </dt>
            {/*
              One block per delivered system — a tally, not a chart: it encodes the count
              exactly rather than scaling it, so it cannot overstate a region the way a
              normalised bar could. Decorative, because the count beside it already says the
              same thing in words; a screen reader gets that, not fifteen empty spans.
            */}
            <dd aria-hidden="true" className="flex flex-wrap items-center gap-[3px]">
              {Array.from({ length: c.count }, (_, i) => (
                <span key={i} className="h-[11px] w-[5px] bg-[var(--color-ink)]" />
              ))}
            </dd>
            <dd className={LABEL}>
              {c.count} {c.count === 1 ? 'SYSTEM' : 'SYSTEMS'} DELIVERED
            </dd>
          </div>
        ))}
      </Rise>
    </section>
  )
}

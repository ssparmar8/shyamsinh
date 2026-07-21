import { Fragment } from 'react'
import { countClientRegions, getTelemetryNodes } from '@/content'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
import { TelemetryMap } from '@/components/canvas/TelemetryMap'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 05 — the telemetry map: systems delivered to the client regions, from India.
 *
 * `TelemetryMap` is a decorative, aria-hidden canvas; the accessible truth is the
 * `<dl>` below, derived from `getTelemetryNodes()` → `clientWork()`, so it can never
 * show a region with no client work behind it. Copy uses `countClientRegions()` (3),
 * never `countRegions()` (4): the latter folds in the home node (IN), and printing it
 * next to a claim about delivered work would read "shipped to 4 regions," which is
 * false — see `countRegions()`'s doc in src/content/index.ts.
 */
export function Telemetry() {
  const { home, clients } = getTelemetryNodes()
  return (
    <section id="telemetry" className="py-20 md:py-28">
      <ScrambleTextAnimated as="h2" text="NODE: TELEMETRY" seed={5} className={HEADING} />
      <div className={`${LABEL} mt-3`}>
        CLIENT WORK DELIVERED ACROSS {countClientRegions()} REGIONS
      </div>

      <TelemetryMap />

      <dl className="mt-6 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1">
        <dt className={LABEL}>ORIGIN</dt>
        <dd className={LABEL}>
          {home.label} · {home.lat.toFixed(2)}°N {home.lon.toFixed(2)}°E
        </dd>
        {clients.map((c) => (
          <Fragment key={c.region}>
            <dt className={LABEL}>{c.region}</dt>
            <dd className={LABEL}>
              {c.count} {c.count === 1 ? 'SYSTEM' : 'SYSTEMS'} DELIVERED
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}

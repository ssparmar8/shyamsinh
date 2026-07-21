import { Fragment } from 'react'
import { countClientRegions, getTelemetryNodes } from '@/content'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'
import { TelemetryMap } from '@/components/canvas/TelemetryMap'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 05 — the telemetry map: systems delivered to the client regions, from India. In a
 * scrub Scene the heading decodes, the sub-label and the (aria-hidden) map wipe in, and the
 * region readouts rise. Copy uses countClientRegions() (3), never countRegions() (4) — see
 * src/content/index.ts. The `<dl>` is the accessible truth; the map is decorative.
 */
export function Telemetry() {
  const { home, clients } = getTelemetryNodes()
  return (
    <section id="telemetry" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: TELEMETRY" seed={5} className={HEADING} />
      <MaskWipe as="div" className={`${LABEL} mt-3`}>
        CLIENT WORK DELIVERED ACROSS {countClientRegions()} REGIONS
      </MaskWipe>

      <MaskWipe>
        <TelemetryMap />
      </MaskWipe>

      <Rise as="dl" className="mt-6 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1">
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
      </Rise>
    </section>
  )
}

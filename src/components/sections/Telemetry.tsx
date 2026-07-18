import { countClientRegions } from '@/content'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 05 — placeholder for Task 6 (the telemetry world map).
 *
 * Copy uses countClientRegions() (3), never countRegions() (4): the latter folds
 * in the home node (IN), and printing it next to a claim about delivered work
 * would read as "shipped to 4 regions," which is false — see countRegions()'s
 * doc comment in src/content/index.ts. Do not build the map here; Task 6 owns
 * the mount point below.
 */
export function Telemetry() {
  return (
    <section id="telemetry" className="py-20 md:py-28">
      <h2 className={HEADING}>NODE: TELEMETRY</h2>
      <div className={`${LABEL} mt-3`}>
        CLIENT WORK DELIVERED ACROSS {countClientRegions()} REGIONS
      </div>

      {/* TelemetryMap mounts here in P3.6 */}
    </section>
  )
}

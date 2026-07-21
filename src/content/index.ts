import { SYSTEMS } from './systems'
import { IDENTITY } from './identity'
import type { System } from './schema'
import { REGION_GEO, HOME_REGION, type Region } from './telemetry'

export const getFeatured = (): System[] =>
  SYSTEMS.filter((s) => s.featured).sort((a, b) => b.year - a.year)

export const getArchive = (): System[] =>
  SYSTEMS.filter((s) => !s.featured).sort((a, b) => b.year - a.year)

export const getBySlug = (slug: string): System | undefined =>
  SYSTEMS.find((s) => s.slug === slug)

export const getAllSlugs = (): string[] => SYSTEMS.map((s) => s.slug)

/**
 * The archive number for a system: its position in the canonical list, 1-based.
 *
 * Must be derived from the FULL list, not from `getFeatured()`. An earlier version
 * used `getFeatured().findIndex(...)`, which returns -1 for all 12 archive systems
 * and fell back to 0 — so 13 of 18 records rendered as "RECORD 01", with only 6
 * unique numbers across the whole archive. A catalogue where thirteen entries share
 * a number is not a catalogue.
 *
 * Anchored to declaration order rather than a sort, so a record's number is stable:
 * a project's catalogue number shouldn't change because a newer one shipped.
 */
export const recordNumber = (slug: string): number =>
  SYSTEMS.findIndex((s) => s.slug === slug) + 1

export const countSystems = (): number => SYSTEMS.length

export const countSectors = (): number => new Set(SYSTEMS.map((s) => s.sector)).size

/** Only the work actually delivered to a client. AIVA is his own product, not client work. */
const clientWork = (): System[] => SYSTEMS.filter((s) => s.engagement === 'Client contract')

/**
 * Regions on the map: every region any system touches, plus home.
 *
 * Currently 4 — US, CA, DK from client work, and IN, which is both where Shyamsinh
 * works and where AIVA (his own product) ships. The telemetry map renders each as a
 * node, so "4 regions" describes what is literally on screen.
 *
 * It does NOT mean four regions of *clients*. Never render this next to the system
 * count in a way that reads "N systems across 4 regions" — that would be false.
 * Use `countClientRegions()` for any claim about where the work went.
 */
export const countRegions = (): number =>
  new Set([...SYSTEMS.map((s) => s.region), IDENTITY.locationCode]).size

/**
 * Distinct regions client work was delivered to. Currently 3 (US, CA, DK).
 *
 * Filters to `Client contract` deliberately. AIVA is region IN, but it is Shyamsinh's
 * own product — counting it here would claim a fourth *client* region that does not
 * exist. This is the only count permitted next to a claim about delivered work.
 */
export const countClientRegions = (): number => new Set(clientWork().map((s) => s.region)).size

/** How many of the systems were his own products rather than client contracts. */
export const countOwnProducts = (): number =>
  SYSTEMS.filter((s) => s.engagement === 'Own product').length

export type TelemetryNode = { region: Region; lat: number; lon: number; label: string; count: number }

/**
 * Nodes for the telemetry map: the home node (where the work is done from) plus one
 * node per distinct CLIENT region, each carrying the count of systems delivered there.
 * Derived from clientWork(), so the map can never draw a region with no client work
 * behind it — the same honesty rule countClientRegions() enforces for the headline.
 */
export const getTelemetryNodes = (): { home: TelemetryNode; clients: TelemetryNode[] } => {
  const work = clientWork()
  const regions = [...new Set(work.map((s) => s.region))].filter((r) => r !== HOME_REGION)
  const clients = regions.map((r) => ({
    region: r,
    ...REGION_GEO[r],
    count: work.filter((s) => s.region === r).length,
  }))
  return { home: { region: HOME_REGION, ...REGION_GEO[HOME_REGION], count: 0 }, clients }
}

export { SYSTEMS }
export type { System }

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

/**
 * How many other records to offer from a record page.
 *
 * SEO_RULES.md §12 asks for 5-10 internal links per page; a record page carried exactly one
 * (the back-link to the index), so 18 of the site's most specific pages were crawlable dead
 * ends that linked to nothing and were linked to only from /archive. Five related plus the
 * back-link lands in the band.
 */
export const RELATED_COUNT = 5

/**
 * Records related to `slug`, best match first.
 *
 * Relatedness is derived, never hand-curated: a static "see also" list is one more thing to
 * update when a system is added, and the one nobody remembers to.
 *
 * Sector outweighs any amount of shared tooling, because two healthcare systems are related
 * in the way a reader means even when they share no libraries, while "both use Node.js" says
 * almost nothing — half the archive uses Node.js. Hence sector 3, each shared stack entry 1.
 *
 * The list is always filled to `limit`, topping up with the most recent unrelated records if
 * the scoring runs dry. A page that shows two links because its sector happens to be sparse
 * is the dead-end problem again, just smaller.
 *
 * Ordering is fully deterministic — score, then year, then the canonical archive position —
 * so the same input always produces the same HTML. A tie broken by sort instability would
 * make every build emit a different page and every deploy invalidate pages that did not
 * change.
 */
export const getRelated = (slug: string, limit: number = RELATED_COUNT): System[] => {
  const self = getBySlug(slug)
  if (!self) return []

  const others = SYSTEMS.filter((s) => s.slug !== slug)
  const stack = new Set(self.stack)

  const score = (s: System): number =>
    (s.sector === self.sector ? 3 : 0) + s.stack.filter((t) => stack.has(t)).length

  return [...others]
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        b.year - a.year ||
        SYSTEMS.indexOf(a) - SYSTEMS.indexOf(b),
    )
    .slice(0, limit)
}

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

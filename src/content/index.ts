import { SYSTEMS } from './systems'
import { IDENTITY } from './identity'
import type { System } from './schema'

export const getFeatured = (): System[] =>
  SYSTEMS.filter((s) => s.featured).sort((a, b) => b.year - a.year)

export const getArchive = (): System[] =>
  SYSTEMS.filter((s) => !s.featured).sort((a, b) => b.year - a.year)

export const getBySlug = (slug: string): System | undefined =>
  SYSTEMS.find((s) => s.slug === slug)

export const getAllSlugs = (): string[] => SYSTEMS.map((s) => s.slug)

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

export { SYSTEMS }
export type { System }

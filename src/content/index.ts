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

/**
 * Regions on the map: every client region, plus home.
 *
 * Clients are in US/CA/DK; Shyamsinh works from IN. The telemetry map renders all
 * four as nodes — three client nodes and one home node, drawn distinctly — so "4
 * regions" describes what is literally on screen.
 *
 * It does NOT mean four regions of *clients*. Never render this next to the system
 * count in a way that reads "N systems across 4 regions" — that would be false.
 * Use `countClientRegions()` for any claim about where the work went.
 */
export const countRegions = (): number =>
  new Set([...SYSTEMS.map((s) => s.region), IDENTITY.locationCode]).size

/** Distinct regions the work was actually delivered to. Currently 3 (US, CA, DK). */
export const countClientRegions = (): number => new Set(SYSTEMS.map((s) => s.region)).size

export { SYSTEMS }
export type { System }

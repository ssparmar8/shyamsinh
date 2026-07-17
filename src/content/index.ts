import { SYSTEMS } from './systems'
import type { System } from './schema'

export const getFeatured = (): System[] =>
  SYSTEMS.filter((s) => s.featured).sort((a, b) => b.year - a.year)

export const getArchive = (): System[] =>
  SYSTEMS.filter((s) => !s.featured).sort((a, b) => b.year - a.year)

export const getBySlug = (slug: string): System | undefined =>
  SYSTEMS.find((s) => s.slug === slug)

export const getAllSlugs = (): string[] => SYSTEMS.map((s) => s.slug)

export const countSystems = (): number => SYSTEMS.length
export const countDomains = (): number => new Set(SYSTEMS.map((s) => s.domain)).size
export const countRegions = (): number => new Set(SYSTEMS.map((s) => s.region)).size

export { SYSTEMS }
export type { System }

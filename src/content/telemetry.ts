import type { System } from './schema'

export type Region = System['region']

/**
 * Geographic anchors for the telemetry map. One representative point PER REGION — a
 * region marker, never a client's address (spec §5: state the region, not a client's
 * private location). Equirectangular lon/lat; `worldDots.lonLatToXY` projects them so
 * they land on the same map the land dots are decoded onto.
 */
export const REGION_GEO: Record<Region, { lat: number; lon: number; label: string }> = {
  US: { lat: 39, lon: -98, label: 'US' },
  CA: { lat: 56, lon: -106, label: 'CA' },
  DK: { lat: 56, lon: 10, label: 'DK' },
  IN: { lat: 22.3, lon: 70.8, label: 'GUJARAT · IN' },
}

/** Where the work is done from — the pulsing node the crosshair locks onto. */
export const HOME_REGION: Region = 'IN'

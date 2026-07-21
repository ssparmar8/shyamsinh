import { WORLD_COLS, WORLD_ROWS, WORLD_MASK } from '@/content/worldMask'

export { WORLD_COLS, WORLD_ROWS }

let cache: Array<[number, number]> | null = null

/**
 * Decode the packed land mask (base64, 1 bit per equirectangular cell) into a list
 * of `[col, row]` land cells. Memoised — the decode runs once and every renderer
 * shares the result, the same way `simulation`/`wireframe` are shared pure modules.
 */
export function landDots(): Array<[number, number]> {
  if (cache) return cache
  const bin = atob(WORLD_MASK)
  const out: Array<[number, number]> = []
  const n = WORLD_COLS * WORLD_ROWS
  for (let i = 0; i < n; i++) {
    const bit = (bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1
    if (bit) out.push([i % WORLD_COLS, Math.floor(i / WORLD_COLS)])
  }
  cache = out
  return out
}

/**
 * Equirectangular projection: lon/lat → canvas pixel. Linear because the source
 * image is plate carrée, so a node placed by lon/lat lands exactly on the land
 * dots decoded above (a cell's centre and its lon/lat project to the same point).
 */
export function lonLatToXY(lon: number, lat: number, w: number, h: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h }
}

/** A grid cell's centre → canvas pixel (matches lonLatToXY for that cell's lon/lat). */
export function cellToXY(col: number, row: number, w: number, h: number): { x: number; y: number } {
  return { x: ((col + 0.5) / WORLD_COLS) * w, y: ((row + 0.5) / WORLD_ROWS) * h }
}

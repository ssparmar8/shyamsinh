export type Vec3 = { x: number; y: number; z: number }
export type Vec2 = { x: number; y: number }

/**
 * Centerpiece tuning, shared by both renderers so the WebGL and 2D versions can't
 * drift apart. The geometry is shared via `hexBipyramid`; these are the presentation
 * knobs (spec §10 flags them as tune-against-the-running-site).
 */
export const WIRE_TILT = 0.4 // fixed X tilt so the crystal reads as 3D
export const WIRE_SPIN = 0.0002 // rad/ms on Y ≈ one revolution / ~30s
export const WIRE_SCALE = 0.18 // of min(w, h)
export const WIRE_OPACITY = 0.28 // slightly above the constellation links so it anchors

/**
 * A hexagonal bipyramid: a 6-vertex ring in the z=0 plane plus a top and bottom
 * apex. 8 vertices, 18 edges (ring 6 + top spokes 6 + bottom spokes 6). Sparse on
 * purpose — it is a background anchor, not the subject.
 *
 * Shared, like simulation.ts, so both renderers draw the identical shape and cannot
 * drift. Pure and unit-testable — no THREE, no canvas.
 */
export function hexBipyramid(): { vertices: Vec3[]; edges: [number, number][] } {
  const ring: Vec3[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i // 60° steps
    ring.push({ x: Math.cos(a), y: Math.sin(a), z: 0 })
  }
  const vertices: Vec3[] = [...ring, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }]
  // indices: 0..5 ring, 6 top apex, 7 bottom apex
  const edges: [number, number][] = []
  for (let i = 0; i < 6; i++) edges.push([i, (i + 1) % 6]) // ring
  for (let i = 0; i < 6; i++) edges.push([i, 6]) // to top
  for (let i = 0; i < 6; i++) edges.push([i, 7]) // to bottom
  return { vertices, edges }
}

/**
 * Rotate each vertex around X (tilt) then Y (spin), drop z (orthographic — matches
 * RendererWebGL's ortho pixel-space camera), scale, and translate to (cx, cy).
 * Pure: same inputs always yield the same 2D points, so the WebGL and 2D renderers
 * stay a visual match and it's unit-testable here.
 */
export function rotateProject(
  vertices: Vec3[],
  angleX: number,
  angleY: number,
  scale: number,
  cx: number,
  cy: number,
): Vec2[] {
  const cosX = Math.cos(angleX)
  const sinX = Math.sin(angleX)
  const cosY = Math.cos(angleY)
  const sinY = Math.sin(angleY)
  return vertices.map((v) => {
    // rotate around X
    const y = v.y * cosX - v.z * sinX
    const z = v.y * sinX + v.z * cosX
    // rotate around Y; the resulting z is discarded by the orthographic projection
    const x = v.x * cosY + z * sinY
    return { x: cx + x * scale, y: cy + y * scale }
  })
}

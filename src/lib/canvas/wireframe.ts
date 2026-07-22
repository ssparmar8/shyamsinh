export type Vec3 = { x: number; y: number; z: number }
export type Vec2 = { x: number; y: number }

/**
 * Centerpiece tuning, shared by both renderers so the WebGL and 2D versions can't
 * drift apart. The geometry is shared via `hexBipyramid`; these are the presentation
 * knobs (spec §10 flags them as tune-against-the-running-site).
 */
export const WIRE_TILT = 0.4 // fixed X tilt so the crystal reads as 3D
export const WIRE_SPIN = 0.0002 // rad/ms base Y spin ≈ one revolution / ~30s (at rest)
export const WIRE_SCALE = 0.18 // of min(w, h)
export const WIRE_OPACITY = 0.28 // slightly above the constellation links so it anchors

// Scroll- and pointer-driven feel, shared so the WebGL and 2D renderers can't drift.
export const WIRE_SCROLL_TURN = Math.PI * 6 // ~3 turns across the (much taller) pinned page
export const WIRE_ZOOM = 0.22 // scale gain from top → bottom of the scroll
export const WIRE_MOUSE_YAW = 0.3 // rad the crystal yaws toward the cursor (x)
export const WIRE_MOUSE_PITCH = 0.25 // rad it pitches toward the cursor (y)
export const FIELD_PARALLAX = 14 // px the constellation field shifts against the cursor
export const POINTER_EASE = 0.06 // per-frame lerp toward the pointer target

// Scroll-velocity reactions (restrained): extra tilt/zoom proportional to scroll speed,
// clamped so a flick can't spin the crystal. Renderers ease their local velocity toward
// scrollVelocity() with VEL_EASE, so the reaction settles when scrolling stops.
export const WIRE_VEL_TILT = 0.12 // max extra X-tilt (rad) at VEL_MAX
export const WIRE_VEL_ZOOM = 0.06 // max extra scale gain at VEL_MAX
export const VEL_MAX = 40 // px/frame at which the reaction saturates
export const VEL_EASE = 0.1 // per-frame lerp toward the scroll-velocity target

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

/** Pure: extra centerpiece tilt (rad) for a scroll-speed magnitude, 0..WIRE_VEL_TILT. */
export function velTilt(vel: number): number {
  return (Math.min(VEL_MAX, Math.abs(vel)) / VEL_MAX) * WIRE_VEL_TILT
}

/** Pure: extra centerpiece scale gain for a scroll-speed magnitude, 0..WIRE_VEL_ZOOM. */
export function velZoom(vel: number): number {
  return (Math.min(VEL_MAX, Math.abs(vel)) / VEL_MAX) * WIRE_VEL_ZOOM
}

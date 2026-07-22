import { describe, it, expect } from 'vitest'
import { hexBipyramid, rotateProject, velTilt, velZoom, WIRE_VEL_TILT, WIRE_VEL_ZOOM, VEL_MAX } from './wireframe'

describe('hexBipyramid', () => {
  it('has 8 vertices and 18 edges', () => {
    const { vertices, edges } = hexBipyramid()
    expect(vertices).toHaveLength(8)
    expect(edges).toHaveLength(18)
  })

  it('references only valid vertex indices', () => {
    const { vertices, edges } = hexBipyramid()
    for (const [a, b] of edges) {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(vertices.length)
      expect(a).not.toBe(b)
    }
  })
})

describe('rotateProject', () => {
  const { vertices } = hexBipyramid()

  it('is deterministic for the same inputs', () => {
    const a = rotateProject(vertices, 0.3, 1.1, 100, 400, 300)
    const b = rotateProject(vertices, 0.3, 1.1, 100, 400, 300)
    expect(a).toEqual(b)
  })

  it('projects the top apex to the centre when unrotated', () => {
    // vertex index 6 is the top apex (0,0,1); with no rotation its x/y are 0.
    const pts = rotateProject(vertices, 0, 0, 100, 400, 300)
    expect(pts[6].x).toBeCloseTo(400)
    expect(pts[6].y).toBeCloseTo(300)
  })

  it('projects opposite ring vertices symmetrically about the centre', () => {
    // ring vertex 0 is (1,0,0); ring vertex 3 is (-1,0,0).
    const pts = rotateProject(vertices, 0, 0, 100, 400, 300)
    expect(pts[0].x).toBeCloseTo(500)
    expect(pts[3].x).toBeCloseTo(300)
    expect(pts[0].y).toBeCloseTo(300)
    expect(pts[3].y).toBeCloseTo(300)
  })
})

describe('velocity reactions', () => {
  it('are 0 at rest', () => {
    expect(velTilt(0)).toBe(0)
    expect(velZoom(0)).toBe(0)
  })

  it('reach their max gain at VEL_MAX and are sign-agnostic', () => {
    expect(velTilt(VEL_MAX)).toBeCloseTo(WIRE_VEL_TILT)
    expect(velTilt(-VEL_MAX)).toBeCloseTo(WIRE_VEL_TILT)
    expect(velZoom(VEL_MAX)).toBeCloseTo(WIRE_VEL_ZOOM)
  })

  it('clamp beyond VEL_MAX so a flick cannot explode the effect', () => {
    expect(velTilt(9999)).toBeCloseTo(WIRE_VEL_TILT)
    expect(velZoom(9999)).toBeCloseTo(WIRE_VEL_ZOOM)
  })
})

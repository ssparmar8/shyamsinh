'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createField, stepField, nearLinks, type Particle } from '@/lib/canvas/simulation'
import {
  hexBipyramid,
  rotateProject,
  WIRE_TILT,
  WIRE_SPIN,
  WIRE_SCALE,
  WIRE_OPACITY,
  WIRE_SCROLL_TURN,
  WIRE_ZOOM,
  WIRE_MOUSE_YAW,
  WIRE_MOUSE_PITCH,
  FIELD_PARALLAX,
  POINTER_EASE,
} from '@/lib/canvas/wireframe'
import { pointerTarget, scrollProgress } from '@/lib/canvas/pointer'
import { useRafLoop } from '@/lib/canvas/useRafLoop'

const LINK_DIST = 120
const INK = new THREE.Color('#8d8d8d')
const WIRE = hexBipyramid()

/**
 * The WebGL constellation, drawn with raw Three.js (no react-three-fiber — one
 * canvas, one loop, r3f is overhead we don't need).
 *
 * An orthographic camera in pixel space (y-flipped, (0,0) top-left) so the WebGL
 * field uses the SAME coordinates as `Renderer2D` and the shared `simulation.ts`
 * just works unmodified — this is what keeps the two renderers a visual match.
 * Points via `Points` + `BufferGeometry`; links via `LineSegments` whose position
 * buffer is rewritten each frame from `nearLinks` and trimmed with `setDrawRange`
 * so stale tail data from a denser earlier frame is never drawn.
 */
export function RendererWebGL({ count }: { count: number }) {
  const holderRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.OrthographicCamera
    points: THREE.Points
    lines: THREE.LineSegments
    wire: THREE.LineSegments
    field: Particle[]
    spin: number
    px: number
    py: number
    w: number
    h: number
  } | null>(null)

  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      return // context creation can fail even when detection passed; caller has a 2D fallback
    }
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1))
    holder.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    Object.assign(renderer.domElement.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '0',
    })

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1)

    const pointsGeo = new THREE.BufferGeometry()
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    const points = new THREE.Points(
      pointsGeo,
      new THREE.PointsMaterial({ color: INK, size: 2.6, transparent: true, opacity: 0.5, sizeAttenuation: false }),
    )

    const linesGeo = new THREE.BufferGeometry()
    // Max links is bounded by n²; allocate once, draw a dynamic range each frame.
    const maxLinks = (count * (count - 1)) / 2
    linesGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxLinks * 6), 3))
    const lines = new THREE.LineSegments(
      linesGeo,
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.14 }),
    )

    const wireGeo = new THREE.BufferGeometry()
    // 18 edges × 2 endpoints × 3 floats
    wireGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WIRE.edges.length * 6), 3))
    const wire = new THREE.LineSegments(
      wireGeo,
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: WIRE_OPACITY }),
    )

    scene.add(points, lines, wire)

    const resize = () => {
      const w = innerWidth
      const h = innerHeight
      renderer.setSize(w, h)
      // Ortho camera in pixel space, y-flipped so (0,0) is top-left like the 2D canvas.
      camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = h
      camera.updateProjectionMatrix()
      const field = createField(count, w, h, 1)
      stateRef.current = {
        renderer, scene, camera, points, lines, wire, field,
        spin: stateRef.current?.spin ?? 0,
        px: stateRef.current?.px ?? 0,
        py: stateRef.current?.py ?? 0,
        w, h,
      }
    }
    resize()
    addEventListener('resize', resize)

    return () => {
      removeEventListener('resize', resize)
      pointsGeo.dispose()
      linesGeo.dispose()
      wireGeo.dispose()
      ;(points.material as THREE.Material).dispose()
      ;(lines.material as THREE.Material).dispose()
      ;(wire.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.domElement.remove()
      stateRef.current = null
    }
  }, [count])

  useRafLoop((dt) => {
    const s = stateRef.current
    if (!s) return

    // Ease the pointer toward its target, then parallax the whole field against it.
    const tgt = pointerTarget()
    s.px += (tgt.x - s.px) * POINTER_EASE
    s.py += (tgt.y - s.py) * POINTER_EASE
    const ox = s.px * FIELD_PARALLAX
    const oy = s.py * FIELD_PARALLAX

    stepField(s.field, s.w, s.h, dt)

    const pos = s.points.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < s.field.length; i++) {
      pos.setXYZ(i, s.field[i].x + ox, s.field[i].y + oy, 0)
    }
    pos.needsUpdate = true

    const links = nearLinks(s.field, LINK_DIST)
    const lpos = s.lines.geometry.getAttribute('position') as THREE.BufferAttribute
    let k = 0
    for (const [i, j] of links) {
      lpos.setXYZ(k++, s.field[i].x + ox, s.field[i].y + oy, 0)
      lpos.setXYZ(k++, s.field[j].x + ox, s.field[j].y + oy, 0)
    }
    s.lines.geometry.setDrawRange(0, links.length * 2)
    lpos.needsUpdate = true

    // Centerpiece: rotate on the CPU (same math the 2D renderer uses) and write the
    // projected edges as z=0 segments — consistent with how the field is drawn, and
    // inside the ortho camera's near/far.
    s.spin += WIRE_SPIN * dt
    const sc = scrollProgress()
    const angleY = s.spin + sc * WIRE_SCROLL_TURN + s.px * WIRE_MOUSE_YAW
    const angleX = WIRE_TILT + s.py * WIRE_MOUSE_PITCH
    const scale = Math.min(s.w, s.h) * WIRE_SCALE * (1 + sc * WIRE_ZOOM)
    const pts = rotateProject(WIRE.vertices, angleX, angleY, scale, s.w / 2, s.h / 2)
    const wpos = s.wire.geometry.getAttribute('position') as THREE.BufferAttribute
    let wi = 0 // endpoint write index — not to be confused with s.w (width)
    for (const [i, j] of WIRE.edges) {
      wpos.setXYZ(wi++, pts[i].x, pts[i].y, 0)
      wpos.setXYZ(wi++, pts[j].x, pts[j].y, 0)
    }
    wpos.needsUpdate = true

    s.renderer.render(s.scene, s.camera)
  }, true)

  return <div ref={holderRef} aria-hidden="true" />
}

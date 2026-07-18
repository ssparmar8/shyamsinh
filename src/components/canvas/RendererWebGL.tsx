'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createField, stepField, nearLinks, type Particle } from '@/lib/canvas/simulation'
import { useRafLoop } from '@/lib/canvas/useRafLoop'

const LINK_DIST = 120
const INK = new THREE.Color('#8d8d8d')

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
    field: Particle[]
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

    scene.add(points, lines)

    const resize = () => {
      const w = innerWidth
      const h = innerHeight
      renderer.setSize(w, h)
      // Ortho camera in pixel space, y-flipped so (0,0) is top-left like the 2D canvas.
      camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = h
      camera.updateProjectionMatrix()
      const field = createField(count, w, h, 1)
      stateRef.current = { renderer, scene, camera, points, lines, field, w, h }
    }
    resize()
    addEventListener('resize', resize)

    return () => {
      removeEventListener('resize', resize)
      pointsGeo.dispose()
      linesGeo.dispose()
      ;(points.material as THREE.Material).dispose()
      ;(lines.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.domElement.remove()
      stateRef.current = null
    }
  }, [count])

  useRafLoop((dt) => {
    const s = stateRef.current
    if (!s) return
    stepField(s.field, s.w, s.h, dt)

    const pos = s.points.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < s.field.length; i++) {
      pos.setXYZ(i, s.field[i].x, s.field[i].y, 0)
    }
    pos.needsUpdate = true

    const links = nearLinks(s.field, LINK_DIST)
    const lpos = s.lines.geometry.getAttribute('position') as THREE.BufferAttribute
    let k = 0
    for (const [i, j] of links) {
      lpos.setXYZ(k++, s.field[i].x, s.field[i].y, 0)
      lpos.setXYZ(k++, s.field[j].x, s.field[j].y, 0)
    }
    s.lines.geometry.setDrawRange(0, links.length * 2)
    lpos.needsUpdate = true

    s.renderer.render(s.scene, s.camera)
  }, true)

  return <div ref={holderRef} aria-hidden="true" />
}

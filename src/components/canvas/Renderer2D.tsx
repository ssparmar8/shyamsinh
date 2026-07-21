'use client'

import { useEffect, useRef } from 'react'
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
const INK = '#8d8d8d' // decorative only — never text, so the AA rule doesn't apply
const WIRE = hexBipyramid()

/**
 * The 2D-canvas constellation: the mandatory fallback, and a complete feature.
 *
 * DPR-aware so it isn't blurry on retina; capped at 2 so a 3x phone doesn't render
 * a 9x-area buffer. Redraws the shared simulation each frame. `count` comes from the
 * device tier; the caller only mounts this when the tier says '2d'.
 */
export function Renderer2D({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fieldRef = useRef<Particle[]>([])
  const sizeRef = useRef({ w: 0, h: 0 })
  const spinRef = useRef(0)
  const pointerRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      const w = innerWidth
      const h = innerHeight
      sizeRef.current = { w, h }
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fieldRef.current = createField(count, w, h, 1)
    }
    resize()
    addEventListener('resize', resize)
    return () => removeEventListener('resize', resize)
  }, [count])

  useRafLoop((dt) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { w, h } = sizeRef.current
    const field = fieldRef.current

    // Ease the pointer toward its target; parallax the field against it.
    const tgt = pointerTarget()
    const pt = pointerRef.current
    pt.x += (tgt.x - pt.x) * POINTER_EASE
    pt.y += (tgt.y - pt.y) * POINTER_EASE
    const ox = pt.x * FIELD_PARALLAX
    const oy = pt.y * FIELD_PARALLAX

    stepField(field, w, h, dt)

    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(ox, oy)
    ctx.strokeStyle = INK
    for (const [i, j] of nearLinks(field, LINK_DIST)) {
      const a = field[i]
      const b = field[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const alpha = 0.18 * (1 - Math.sqrt(dx * dx + dy * dy) / LINK_DIST)
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.5
    ctx.fillStyle = INK
    for (const p of field) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.restore()

    // Centerpiece: same geometry + projection as the WebGL renderer, driven by scroll
    // progress and the eased pointer (which the field does not share — different depths).
    spinRef.current += WIRE_SPIN * dt
    const sc = scrollProgress()
    const angleY = spinRef.current + sc * WIRE_SCROLL_TURN + pt.x * WIRE_MOUSE_YAW
    const angleX = WIRE_TILT + pt.y * WIRE_MOUSE_PITCH
    const scale = Math.min(w, h) * WIRE_SCALE * (1 + sc * WIRE_ZOOM)
    const pts = rotateProject(WIRE.vertices, angleX, angleY, scale, w / 2, h / 2)
    ctx.globalAlpha = WIRE_OPACITY
    ctx.strokeStyle = INK
    ctx.beginPath()
    for (const [i, j] of WIRE.edges) {
      ctx.moveTo(pts[i].x, pts[i].y)
      ctx.lineTo(pts[j].x, pts[j].y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }, true)

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}

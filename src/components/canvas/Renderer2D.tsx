'use client'

import { useEffect, useRef } from 'react'
import { createField, stepField, nearLinks, type Particle } from '@/lib/canvas/simulation'
import { useRafLoop } from '@/lib/canvas/useRafLoop'

const LINK_DIST = 120
const INK = '#8d8d8d' // decorative only — never text, so the AA rule doesn't apply

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
    stepField(field, w, h, dt)

    ctx.clearRect(0, 0, w, h)
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
  }, true)

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}

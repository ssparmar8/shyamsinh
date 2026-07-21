'use client'

import { useEffect, useRef } from 'react'
import { landDots, lonLatToXY, cellToXY } from '@/lib/canvas/worldDots'
import { getTelemetryNodes, type TelemetryNode } from '@/content'
import { useRafLoop } from '@/lib/canvas/useRafLoop'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

const INK = '#2b2b2b'
const DIM = '#8d8d8d'
const FONT = '9px ui-monospace, monospace'

type MapState = {
  base: HTMLCanvasElement // the static layer (map, arcs, client nodes, crosshair), drawn once
  home: TelemetryNode
  w: number
  h: number
  t: number
}

/** Draw the static layer to an offscreen canvas once per resize — cheap to blit each frame. */
function drawBase(base: HTMLCanvasElement, w: number, h: number, dpr: number, home: TelemetryNode, clients: TelemetryNode[]) {
  base.width = w * dpr
  base.height = h * dpr
  const ctx = base.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // Land: one faint dot per equirectangular land cell.
  ctx.fillStyle = DIM
  ctx.globalAlpha = 0.45
  const r = Math.max(0.6, w / 950)
  for (const [c, rr] of landDots()) {
    const { x, y } = cellToXY(c, rr, w, h)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const hp = lonLatToXY(home.lon, home.lat, w, h)

  // Delivery arcs: home → each client region, bowed.
  ctx.strokeStyle = DIM
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 1
  for (const cl of clients) {
    const p = lonLatToXY(cl.lon, cl.lat, w, h)
    const dx = p.x - hp.x
    const dy = p.y - hp.y
    const len = Math.hypot(dx, dy) || 1
    const bow = Math.min(64, len * 0.2)
    const cx = (hp.x + p.x) / 2 + (-dy / len) * bow
    const cy = (hp.y + p.y) / 2 + (dx / len) * bow
    ctx.beginPath()
    ctx.moveTo(hp.x, hp.y)
    ctx.quadraticCurveTo(cx, cy, p.x, p.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Client node markers + labels.
  ctx.font = FONT
  for (const cl of clients) {
    const p = lonLatToXY(cl.lon, cl.lat, w, h)
    ctx.fillStyle = INK
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
    ctx.fillStyle = DIM
    ctx.fillText(`${cl.label}·${cl.count}`, p.x + 6, p.y + 3)
  }

  // Static crosshair through the home node.
  ctx.strokeStyle = INK
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.moveTo(0, hp.y)
  ctx.lineTo(w, hp.y)
  ctx.moveTo(hp.x, 0)
  ctx.lineTo(hp.x, h)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Coordinate readout by the home node.
  ctx.fillStyle = DIM
  ctx.font = FONT
  const lat = `${Math.abs(home.lat).toFixed(2)}°${home.lat >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(home.lon).toFixed(2)}°${home.lon >= 0 ? 'E' : 'W'}`
  ctx.fillText(home.label, hp.x + 14, hp.y - 20)
  ctx.fillText(`${lat} / ${lon}`, hp.x + 14, hp.y - 9)
}

/** Draw the animated overlay (pulse + rotating reticle). `t = 0` gives a valid static frame. */
function drawOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, home: TelemetryNode, t: number) {
  const hp = lonLatToXY(home.lon, home.lat, w, h)

  // Expanding pulse ring.
  const phase = (t % 2000) / 2000
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.5 * (1 - phase)
  ctx.beginPath()
  ctx.arc(hp.x, hp.y, 4 + phase * 18, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Home node.
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(hp.x, hp.y, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Slowly-rotating diamond reticle locked on the home node.
  ctx.save()
  ctx.translate(hp.x, hp.y)
  ctx.rotate(t * 0.0008)
  ctx.strokeStyle = INK
  ctx.globalAlpha = 0.8
  const d = 11
  ctx.beginPath()
  ctx.moveTo(0, -d)
  ctx.lineTo(d, 0)
  ctx.lineTo(0, d)
  ctx.lineTo(-d, 0)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
  ctx.globalAlpha = 1
}

function drawFrame(ctx: CanvasRenderingContext2D, s: MapState) {
  ctx.clearRect(0, 0, s.w, s.h)
  ctx.drawImage(s.base, 0, 0, s.w, s.h)
  drawOverlay(ctx, s.w, s.h, s.home, s.t)
}

/**
 * The telemetry world map — a dotted equirectangular map with the client regions,
 * delivery arcs from Gujarat, and a crosshair reticle locked on the home node.
 *
 * Decorative and `aria-hidden`: the real, accessible data (origin + per-region
 * delivery counts) lives in Telemetry.tsx's DOM list, so a no-JS visitor, a crawler,
 * and a reduced-motion user all get the facts. Reduced motion still renders the full
 * map — it just draws once (no pulse, no rotation) with the rAF loop disabled.
 */
export function TelemetryMap() {
  const reduced = usePrefersReducedMotion()
  const holderRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<MapState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const holder = holderRef.current
    if (!canvas || !holder) return
    const { home, clients } = getTelemetryNodes()
    const base = document.createElement('canvas')

    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      const w = holder.clientWidth
      if (!w) return
      const h = Math.round(w / 2) // equirectangular 2:1
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawBase(base, w, h, dpr, home, clients)
      stateRef.current = { base, home, w, h, t: 0 }
      drawFrame(ctx, stateRef.current) // initial static frame (also the reduced-motion frame)
    }

    resize()
    addEventListener('resize', resize)
    return () => removeEventListener('resize', resize)
  }, [])

  useRafLoop((dt) => {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!s || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    s.t += dt
    drawFrame(ctx, s)
  }, !reduced)

  return (
    <div ref={holderRef} aria-hidden="true" className="mt-8 w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  )
}

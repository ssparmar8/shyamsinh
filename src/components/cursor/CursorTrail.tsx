'use client'

import { useEffect, useRef } from 'react'
import { cursorPos, cursorMoved } from '@/lib/canvas/cursor'
import { useRafLoop } from '@/lib/canvas/useRafLoop'
import { useCursorEnabled } from '@/lib/motion/useCursorEnabled'
import { scrambleFrame } from '@/lib/scramble'

const SHED_DIST2 = 140 // px² the pointer must travel before shedding a glyph
const MAX_GLYPHS = 24 // hard cap on live trail nodes
const IDLE_FRAMES = 30 // still frames before the caret fades

/**
 * The glyph-trail cursor: a block caret that tracks the raw pointer and sheds fading
 * glyph noise as it moves — the site's decode signature, following the hand. Mounted at
 * `/` only. Not rendered at all unless useCursorEnabled() (fine pointer + motion), so
 * touch / reduced-motion / record-route visitors keep the native cursor. aria-hidden
 * throughout; pointer-events:none; native cursor hidden only while this is active. It is
 * the sole per-frame consumer of cursorMoved() (a read-and-clear latch).
 */
export function CursorTrail() {
  const enabled = useCursorEnabled()
  const caretRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const lastShed = useRef({ x: 0, y: 0 })
  const seed = useRef(0)
  const idle = useRef(0)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('cursor-none')
    return () => document.documentElement.classList.remove('cursor-none')
  }, [enabled])

  useRafLoop(() => {
    const caret = caretRef.current
    const layer = layerRef.current
    if (!caret || !layer) return
    const { x, y } = cursorPos()
    caret.style.transform = `translate(${x}px, ${y}px)`

    if (cursorMoved()) {
      idle.current = 0
      caret.style.opacity = '1'
    } else if (++idle.current > IDLE_FRAMES) {
      caret.style.opacity = '0.25'
    }

    const dx = x - lastShed.current.x
    const dy = y - lastShed.current.y
    if (dx * dx + dy * dy > SHED_DIST2 && layer.childElementCount < MAX_GLYPHS) {
      lastShed.current = { x, y }
      const g = document.createElement('span')
      g.className = 'cursor-glyph'
      g.textContent = scrambleFrame('X', 0, seed.current++) // one deterministic noise glyph
      g.style.transform = `translate(${x + (Math.random() * 12 - 6)}px, ${y + (Math.random() * 12 - 6)}px)`
      layer.appendChild(g)
      setTimeout(() => g.remove(), 650)
    }
  }, enabled)

  if (!enabled) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div ref={layerRef} className="absolute inset-0" />
      <div
        ref={caretRef}
        data-testid="cursor-caret"
        className="absolute top-0 left-0 -mt-[6px] -ml-[3px] h-3 w-[6px] bg-[var(--color-ink)] transition-opacity duration-300"
      />
    </div>
  )
}

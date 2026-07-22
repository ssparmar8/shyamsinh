'use client'

import { useEffect, useRef } from 'react'
import { scrollProgressOf } from '@/lib/canvas/pointer'

/**
 * A hairline scroll-progress track on the right frame edge plus a percent readout — HUD
 * position feedback for the tall pages. Lib-free (plain passive scroll listener + rAF,
 * no gsap/lenis/three), so it is safe on every route including the record pages. Writes to
 * refs each frame, no React state. aria-hidden; shown from `sm` up. Works identically under
 * Lenis (`/`) and native scroll (records, reduced motion) since both move window.scrollY.
 * Hides itself (via a ref-toggled inline `display`) when the page can't scroll, e.g. /contact.
 */
export function ScrollProgress() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fillRef = useRef<HTMLDivElement | null>(null)
  const pctRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    let ticking = false
    const paint = () => {
      ticking = false
      const p = scrollProgressOf(scrollY, document.documentElement.scrollHeight, innerHeight)
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p})`
      if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100)).padStart(3, '0')
      const scrollable = document.documentElement.scrollHeight - innerHeight > 1
      if (rootRef.current) rootRef.current.style.display = scrollable ? '' : 'none'
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        raf = requestAnimationFrame(paint)
      }
    }
    paint()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 z-20 hidden h-dvh w-px sm:block"
    >
      <div className="absolute inset-0 bg-[var(--color-hair)]" />
      <div
        ref={fillRef}
        className="absolute inset-x-0 top-0 h-full origin-top bg-[var(--color-dim)]"
        style={{ transform: 'scaleY(0)' }}
      />
      <div
        ref={pctRef}
        data-testid="scroll-pct"
        className="absolute top-1/2 right-2 font-mono text-[9px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]"
      >
        000
      </div>
    </div>
  )
}

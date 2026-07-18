'use client'

import { useEffect, useRef } from 'react'

/**
 * A rAF loop that pauses when the tab is hidden.
 *
 * The pause is the point: a portfolio sits open in a background tab for hours, and
 * an unpaused particle loop burns a CPU core the whole time (spec §12). `cb`
 * receives dt in ms, clamped so a long pause doesn't teleport the sim on resume.
 */
export function useRafLoop(cb: (dtMs: number) => void, enabled: boolean): void {
  const cbRef = useRef(cb)
  // Mirroring `cb` into a ref must happen in an effect, not during render — the
  // plan's original draft assigned `cbRef.current = cb` directly in the render
  // body, which `react-hooks/refs` (eslint-plugin-react-hooks 7.x, shipped with
  // Next 16) rejects: mutating a ref during render is impure under concurrent
  // rendering (React may render without committing). A plain `useEffect` with no
  // dependency array keeps the ref current after every render without restarting
  // the rAF effect below, whose own dependency array is just `[enabled]`.
  useEffect(() => {
    cbRef.current = cb
  })

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let last = performance.now()
    let running = true

    const tick = (now: number) => {
      if (!running) return
      const dt = Math.min(50, now - last) // clamp: never advance more than ~3 frames at once
      last = now
      cbRef.current(dt)
      raf = requestAnimationFrame(tick)
    }
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled])
}

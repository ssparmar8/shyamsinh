/**
 * Raw pointer position in CSS pixels, a module singleton mirroring pointer.ts. The
 * glyph-trail caret needs the true, un-eased pointer location — pointer.ts's normalised
 * −1..1 target is the wrong space. One lazy passive listener; read imperatively each
 * frame, no React re-render. No gsap/lenis/three import, so it is safe on any route.
 */
let x = 0
let y = 0
let moved = false
let attached = false

function attach(): void {
  if (attached || typeof window === 'undefined') return
  attached = true
  addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX
      y = e.clientY
      moved = true
    },
    { passive: true },
  )
}

/** Current raw pointer position in client pixels. */
export function cursorPos(): { x: number; y: number } {
  attach()
  return { x, y }
}

/** True once since the last call if the pointer moved — lets the caret fade when idle. */
export function cursorMoved(): boolean {
  attach()
  const m = moved
  moved = false
  return m
}

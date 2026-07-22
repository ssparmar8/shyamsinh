/**
 * Shared input signals for the canvas renderers: a normalised pointer offset from the
 * viewport centre (−1..1 on each axis), scroll progress (0..1 down the page), and scroll
 * velocity (smoothed speed magnitude). Pointer offset and scroll progress are tracked by
 * passive window listeners attached once, lazily, and sampled by the renderers each frame
 * — the same shared-singleton shape as AudioBus. Scroll velocity is instead pushed in
 * externally by the Lenis scroll layer (there is no native velocity event to listen for).
 *
 * Only the animated canvas reads these, and it never renders under reduced motion
 * (tier `none`), so there is nothing to gate here: if no one samples, no listener attaches.
 */

/** Pure: client coords → offset from centre, −1..1. */
export function normPointer(clientX: number, clientY: number, w: number, h: number): { x: number; y: number } {
  return { x: w ? (clientX / w) * 2 - 1 : 0, y: h ? (clientY / h) * 2 - 1 : 0 }
}

/** Pure: scroll position → 0..1 progress, clamped, safe when the page can't scroll. */
export function scrollProgressOf(scrollY: number, scrollHeight: number, viewH: number): number {
  const max = scrollHeight - viewH
  if (max <= 0) return 0
  return Math.min(1, Math.max(0, scrollY / max))
}

/**
 * Pure: smoothed scroll-speed magnitude. Attacks instantly toward a faster sample and
 * releases ~0.9/frame, so the centerpiece reacts immediately to a flick and settles
 * when scrolling stops. Snaps to 0 below a noise floor so "at rest" is exactly rest.
 */
export function smoothVelocity(prev: number, sample: number): number {
  const next = Math.max(Math.abs(sample), prev * 0.9)
  return next < 0.01 ? 0 : next
}

let targetX = 0
let targetY = 0
let progress = 0
let attached = false

function attach(): void {
  if (attached || typeof window === 'undefined') return
  attached = true
  addEventListener(
    'pointermove',
    (e) => {
      const p = normPointer(e.clientX, e.clientY, innerWidth, innerHeight)
      targetX = p.x
      targetY = p.y
    },
    { passive: true },
  )
  const onScroll = () => {
    progress = scrollProgressOf(scrollY, document.documentElement.scrollHeight, innerHeight)
  }
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

/** Current pointer target (−1..1). Renderers ease toward this for smooth parallax. */
export function pointerTarget(): { x: number; y: number } {
  attach()
  return { x: targetX, y: targetY }
}

/** Current scroll progress (0..1). */
export function scrollProgress(): number {
  attach()
  return progress
}

let velocity = 0

/** Feed a raw signed scroll velocity (px/frame); stored as a smoothed magnitude. */
export function pushScrollVelocity(sample: number): void {
  velocity = smoothVelocity(velocity, sample)
}

/** Current smoothed scroll-speed magnitude (0 at rest). Renderers ease toward this. */
export function scrollVelocity(): number {
  return velocity
}

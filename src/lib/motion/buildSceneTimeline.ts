import { gsap } from 'gsap'
import { scrambleFrame } from '@/lib/scramble'
import type { LayerReg } from '@/components/motion/SceneContext'

const STAGGER = 0.12 // timeline-time between consecutive layers when `at` is not given

const TAIL_START = 0.8 // fraction of the pin after which the beat begins settling out
const TAIL_LIFT = 16 // px the outgoing beat lifts as it settles

/**
 * Pure: the outgoing beat's lift for a given pin progress (0..1). A no-op until TAIL_START,
 * then eases to −TAIL_LIFT by progress 1 so a released beat settles out instead of snapping.
 * Reverses cleanly when scrubbed back up.
 *
 * Movement only. This used to also fade the beat to 0.5 alpha across the same range, which
 * meant the section a visitor was still reading dimmed under them as they scrolled — the
 * text got harder to read at exactly the moment they were finishing it. Nothing on this site
 * changes opacity on scroll any more; see the note in buildSceneTimeline below.
 */
export function holdLift(progress: number): { y: number } {
  const f = progress > TAIL_START ? (progress - TAIL_START) / (1 - TAIL_START) : 0
  return { y: -TAIL_LIFT * f + 0 } // + 0 normalises -0 → 0
}

/**
 * Build ONE paused timeline for a Scene from its registered layers, sorted by DOM order.
 * With no layers, a default: the whole section rises across the first part of the pin, so
 * even an un-annotated beat assembles on scroll. ScrollTrigger scrubs this.
 *
 * NO LAYER ANIMATES OPACITY, and that is deliberate. Every kind here used to run
 * `autoAlpha: 0 → 1` alongside its movement, so mid-scroll — which, being scrubbed, is most
 * of the time a visitor spends with a beat — text sat at a partial alpha and read as blurred
 * or washed out. Motion now comes from position (rise), from clipping (mask), and from the
 * glyph decode; none of them make text harder to read while it is on screen. Keep it that
 * way: reach for transform or clip-path, not alpha.
 */
export function buildSceneTimeline(root: HTMLElement, layers: LayerReg[]) {
  const tl = gsap.timeline({ paused: true })

  if (layers.length === 0) {
    tl.fromTo(root, { y: 24 }, { y: 0, duration: 0.6, ease: 'none' })
    tl.to({}, { duration: 0.4 }) // hold, so the beat sits settled through the rest of the pin
    return tl
  }

  const ordered = [...layers].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )

  ordered.forEach((layer, i) => {
    const at = layer.at ?? i * STAGGER
    if (layer.kind === 'rise') {
      tl.fromTo(
        layer.el,
        { y: layer.offset ?? 24 },
        { y: 0, duration: layer.duration ?? 0.5, ease: 'none' },
        at,
      )
    } else if (layer.kind === 'mask') {
      // The clip alone hides the element before its turn — an alpha ramp on top of it added
      // nothing but a washed-out midpoint.
      tl.fromTo(
        layer.el,
        { clipPath: 'inset(0 0 100% 0)', y: 14 },
        {
          clipPath: 'inset(0 0 0% 0)',
          y: 0,
          duration: layer.duration ?? 0.5,
          ease: 'none',
        },
        at,
      )
    } else {
      // decode: tween a proxy 0→1 and write scrambleFrame() into the aria-hidden node.
      const target = layer.text ?? layer.el.textContent ?? ''
      const seed = layer.seed ?? 0
      const proxy = { p: 0 }
      tl.to(
        proxy,
        {
          p: 1,
          duration: layer.duration ?? 0.45,
          ease: 'none',
          onUpdate: () => {
            layer.el.textContent = scrambleFrame(target, proxy.p, seed)
          },
        },
        at,
      )
    }
  })

  return tl
}

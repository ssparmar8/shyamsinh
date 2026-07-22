import { gsap } from 'gsap'
import { scrambleFrame } from '@/lib/scramble'
import type { LayerReg } from '@/components/motion/SceneContext'

const STAGGER = 0.12 // timeline-time between consecutive layers when `at` is not given

const TAIL_START = 0.8 // fraction of the pin after which the beat begins settling out
const TAIL_ALPHA = 0.5 // lowest alpha the outgoing beat reaches (never fully gone)
const TAIL_LIFT = 16 // px the outgoing beat lifts as it settles

/**
 * Pure: the outgoing beat's alpha/lift for a given pin progress (0..1). A no-op until
 * TAIL_START, then eases to (TAIL_ALPHA, −TAIL_LIFT) by progress 1 so a released beat
 * settles out instead of snapping. Reverses cleanly when scrubbed back up.
 */
export function holdFade(progress: number): { alpha: number; y: number } {
  const f = progress > TAIL_START ? (progress - TAIL_START) / (1 - TAIL_START) : 0
  return { alpha: 1 - f * (1 - TAIL_ALPHA), y: -TAIL_LIFT * f + 0 }
}

/**
 * Build ONE paused timeline for a Scene from its registered layers, sorted by DOM order.
 * With no layers, a default: the whole section rises + fades across the first part of the
 * pin, so even an un-annotated beat assembles on scroll. ScrollTrigger scrubs this.
 */
export function buildSceneTimeline(root: HTMLElement, layers: LayerReg[]) {
  const tl = gsap.timeline({ paused: true })

  if (layers.length === 0) {
    tl.fromTo(root, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'none' })
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
        { autoAlpha: 0, y: layer.offset ?? 24 },
        { autoAlpha: 1, y: 0, duration: layer.duration ?? 0.5, ease: 'none' },
        at,
      )
    } else if (layer.kind === 'mask') {
      tl.fromTo(
        layer.el,
        { clipPath: 'inset(0 0 100% 0)', y: 14, autoAlpha: 0 },
        {
          clipPath: 'inset(0 0 0% 0)',
          y: 0,
          autoAlpha: 1,
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

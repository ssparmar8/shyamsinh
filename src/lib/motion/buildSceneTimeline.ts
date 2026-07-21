import { gsap } from 'gsap'
import { scrambleFrame } from '@/lib/scramble'
import type { LayerReg } from '@/components/motion/SceneContext'

const STAGGER = 0.12 // timeline-time between consecutive layers when `at` is not given

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

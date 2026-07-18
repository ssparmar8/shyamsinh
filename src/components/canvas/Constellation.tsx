'use client'

import dynamic from 'next/dynamic'
import { useDeviceTier } from '@/lib/canvas/useDeviceTier'
import { Renderer2D } from './Renderer2D'

// Three.js is heavy; load the WebGL renderer only when the tier actually chooses it,
// so devices that fall back to 2D — and every SSR pass — never download Three.
const RendererWebGL = dynamic(() => import('./RendererWebGL').then((m) => m.RendererWebGL), {
  ssr: false,
})

/**
 * The constellation background, mounted at / only.
 *
 * The tier decides the renderer: 'webgl' → Three, '2d' → canvas, 'none' → nothing
 * (reduced motion, or SSR before the client confirms). Content never depends on
 * this — it's a fixed, aria-hidden, pointer-events-none layer at z-0.
 */
export function Constellation() {
  const tier = useDeviceTier()
  if (tier.renderer === 'none') return null
  if (tier.renderer === '2d') return <Renderer2D count={tier.count} />
  return <RendererWebGL count={tier.count} />
}

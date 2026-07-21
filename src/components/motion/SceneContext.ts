'use client'

import { createContext } from 'react'
import type { SceneMode } from '@/lib/motion/sceneMode'

export type LayerKind = 'decode' | 'mask' | 'rise'

/** A single animated element registered by a layer primitive with its parent Scene. */
export type LayerReg = {
  el: HTMLElement
  kind: LayerKind
  /** Optional explicit timeline position (0..1). Default: staggered by DOM order. */
  at?: number
  duration?: number
  /** rise: px travelled. */
  offset?: number
  /** decode: target string + noise seed. */
  text?: string
  seed?: number
}

export type SceneCtx = {
  mode: SceneMode
  register: (reg: LayerReg) => () => void
}

export const SceneContext = createContext<SceneCtx | null>(null)

'use client'

import { useCallback, useContext, type ElementType, type ReactNode, type Ref } from 'react'
import { SceneContext } from '../SceneContext'

/**
 * Spatial-rise layer: in a scrub Scene, registers its element so the Scene timeline
 * translates it up + fades it in on scroll. Outside scrub (static/reveal/no Scene) it
 * renders children in their settled state — the Scene handles reveal-mode fade wholesale.
 */
export function Rise({
  children,
  as: Tag = 'div',
  className,
  offset = 24,
}: {
  children: ReactNode
  as?: ElementType
  className?: string
  offset?: number
}) {
  const ctx = useContext(SceneContext)
  const scrub = ctx?.mode === 'scrub'

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !ctx || ctx.mode !== 'scrub') return
      return ctx.register({ el, kind: 'rise', offset })
    },
    [ctx, offset],
  )

  if (!scrub) return <Tag className={className}>{children}</Tag>
  return (
    <Tag ref={ref as Ref<Element>} className={className}>
      {children}
    </Tag>
  )
}

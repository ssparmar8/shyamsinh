'use client'

import { useCallback, useContext, type ElementType, type ReactNode, type Ref } from 'react'
import { SceneContext } from '../SceneContext'

/**
 * Clip-wipe layer: in a scrub Scene, the Scene timeline animates clip-path inset from
 * fully-clipped to open (with a small rise), so the element wipes up from behind an edge.
 * Outside scrub it renders its settled state.
 */
export function MaskWipe({
  children,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  as?: ElementType
  className?: string
}) {
  const ctx = useContext(SceneContext)
  const scrub = ctx?.mode === 'scrub'

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !ctx || ctx.mode !== 'scrub') return
      return ctx.register({ el, kind: 'mask' })
    },
    [ctx],
  )

  if (!scrub) return <Tag className={className}>{children}</Tag>
  return (
    <Tag ref={ref as Ref<Element>} className={className}>
      {children}
    </Tag>
  )
}

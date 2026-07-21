'use client'

import { useCallback, useContext, type ElementType, type Ref } from 'react'
import { SceneContext } from '../SceneContext'
import { scrambleFrame } from '@/lib/scramble'

/**
 * Scrub-driven decode. Same a11y contract as ScrambleTextAnimated: the real string is an
 * always-present sr-only node (accessible name from first paint); the animated noise is a
 * separate aria-hidden layer the Scene timeline writes into (scrambleFrame by scroll
 * progress). Static/reveal/no-Scene → exactly one plain text node, no noise layer.
 */
export function DecodeLine({
  text,
  as: Tag = 'span',
  className,
  seed = 0,
}: {
  text: string
  as?: ElementType
  className?: string
  seed?: number
}) {
  const ctx = useContext(SceneContext)
  const scrub = ctx?.mode === 'scrub'

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !ctx || ctx.mode !== 'scrub') return
      return ctx.register({ el, kind: 'decode', text, seed })
    },
    [ctx, text, seed],
  )

  if (!scrub) return <Tag className={className}>{text}</Tag>
  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" ref={ref as Ref<HTMLSpanElement>}>
        {scrambleFrame(text, 0, seed)}
      </span>
    </Tag>
  )
}

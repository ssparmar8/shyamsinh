import type { ElementType } from 'react'

type Props = {
  text: string
  as?: ElementType
  className?: string
}

/**
 * Renders text that a later plan will animate with a decode effect.
 *
 * The real string is always the DOM's text content, so screen readers and search
 * engines see it from first paint (spec §13). The animation, when added, mutates a
 * separate aria-hidden layer only — it must never become the accessible name.
 */
export function ScrambleText({ text, as: Tag = 'span', className }: Props) {
  return <Tag className={className}>{text}</Tag>
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

const EDGES: Record<Corner, string> = {
  tl: 'top-3 left-3 border-l border-t',
  tr: 'top-3 right-3 border-r border-t',
  bl: 'bottom-3 left-3 border-l border-b',
  br: 'bottom-3 right-3 border-r border-b',
}

/** Purely decorative chrome — always hidden from assistive tech. */
export function CornerBracket({ corner }: { corner: Corner }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute h-4 w-4 border-[var(--color-ghost)] ${EDGES[corner]}`}
    />
  )
}

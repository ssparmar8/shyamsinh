import type { CSSProperties } from 'react'

/**
 * Faint circuit-trace accents that route inward from each corner and draw themselves
 * on load (`.hud-trace` + the keyframe in globals.css; reduced motion makes it
 * near-instant). A deliberately restrained nod to the reference's schematic wiring —
 * the grid it wired to was removed, so this stays at the frame edges rather than
 * cluttering the now-clean background. Decorative, aria-hidden, pointer-events-none.
 */
const CORNERS: CSSProperties[] = [
  { top: '2rem', left: '2.5rem' },
  { top: '2rem', right: '2.5rem', transform: 'scaleX(-1)' },
  { bottom: '2rem', left: '2.5rem', transform: 'scaleY(-1)' },
  { bottom: '2rem', right: '2.5rem', transform: 'scale(-1)' },
]

export function HudTraces() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 hidden md:block">
      {CORNERS.map((style, i) => (
        <svg
          key={i}
          width="84"
          height="44"
          viewBox="0 0 84 44"
          fill="none"
          className="absolute text-[var(--color-ghost)]"
          style={style}
        >
          <path className="hud-trace" d="M2 8 H64 M64 8 V38" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
          <circle cx="64" cy="8" r="2.2" fill="currentColor" fillOpacity="0.55" />
        </svg>
      ))}
    </div>
  )
}

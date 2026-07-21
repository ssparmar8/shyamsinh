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
          width="112"
          height="62"
          viewBox="0 0 112 62"
          fill="none"
          className="absolute text-[var(--color-ghost)]"
          style={style}
        >
          <path className="hud-trace" d="M2 12 H90 M90 12 V52" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.75" />
          <circle cx="90" cy="12" r="3" fill="currentColor" fillOpacity="0.9" />
        </svg>
      ))}
    </div>
  )
}

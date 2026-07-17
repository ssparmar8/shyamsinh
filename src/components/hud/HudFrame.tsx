import Link from 'next/link'
import { CornerBracket } from './CornerBracket'

type Props = {
  children: React.ReactNode
  label?: string
}

/**
 * The persistent chrome: grid, corner brackets, and a contact link that is
 * reachable at every scroll depth (spec §9.07).
 */
export function HudFrame({ children, label }: Props) {
  return (
    <div className="hud-grid relative min-h-dvh w-full">
      <CornerBracket corner="tl" />
      <CornerBracket corner="tr" />
      <CornerBracket corner="bl" />
      <CornerBracket corner="br" />

      {label && (
        <div className="absolute top-6 left-8 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]">
          {label}
        </div>
      )}

      <Link
        href="/contact"
        className="absolute top-6 right-8 z-20 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
      >
        ◂ UPLINK
      </Link>

      {children}
    </div>
  )
}

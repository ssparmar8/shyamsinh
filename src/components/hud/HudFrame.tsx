import { MagneticLink } from '@/components/motion/MagneticLink'
import { CornerBracket } from './CornerBracket'
import { HudReadout } from './HudReadout'
import { HudTraces } from './HudTraces'
import { ScrollProgress } from './ScrollProgress'

type Props = {
  children: React.ReactNode
  label?: string
}

/**
 * The persistent chrome: corner brackets, a live terminal readout, and a contact
 * link reachable at every scroll depth (spec §9.07).
 *
 * The chrome is `fixed`, deliberately. An earlier version positioned it `absolute`
 * inside a `min-h-dvh` box — which is only a *floor*, so the box grows to content
 * height and the chrome anchors to the document rather than the viewport. Measured
 * on a 3096px page in a 964px viewport: at mid-scroll there was no chrome on screen
 * at all, and the contact link — the whole reason this component exists — had
 * scrolled away. It looked correct only because every route was shorter than one
 * viewport. Plan 2's ~13,000px homepage would have exposed it immediately.
 *
 * Layering: content at z-10, decorative brackets at z-20 framing the viewport,
 * interactive chrome at z-30 on top. The brackets layer is `pointer-events-none`
 * so it never intercepts a click meant for content — a full-viewport fixed overlay
 * that swallows clicks is the classic way this pattern goes wrong.
 */
export function HudFrame({ children, label }: Props) {
  return (
    <div className="relative min-h-dvh w-full">
      {/* Brackets are `absolute` within this fixed box, so they frame the viewport. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20">
        <CornerBracket corner="tl" />
        <CornerBracket corner="tr" />
        <CornerBracket corner="bl" />
        <CornerBracket corner="br" />
      </div>

      <HudTraces />

      {label && (
        <div className="fixed top-6 left-8 z-30 max-w-[45vw] truncate font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]">
          {label}
        </div>
      )}

      <MagneticLink
        href="/contact"
        text="◂ UPLINK"
        className="fixed top-6 right-8 z-30 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
      />

      <ScrollProgress />
      <HudReadout />

      <div className="relative z-10">{children}</div>
    </div>
  )
}

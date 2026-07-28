import { CornerBracket } from './CornerBracket'
import { HudReadout } from './HudReadout'
import { HudTraces } from './HudTraces'
import { ScrollProgress } from './ScrollProgress'

type Props = {
  children: React.ReactNode
}

/**
 * The persistent chrome: corner brackets and a live terminal readout. The top row
 * is deliberately bare — no route label, no contact link.
 *
 * The chrome is `fixed`, deliberately. An earlier version positioned it `absolute`
 * inside a `min-h-dvh` box — which is only a *floor*, so the box grows to content
 * height and the chrome anchors to the document rather than the viewport. Measured
 * on a 3096px page in a 964px viewport: at mid-scroll there was no chrome on screen
 * at all. It looked correct only because every route was shorter than one viewport.
 * Plan 2's ~13,000px homepage would have exposed it immediately.
 *
 * Layering: content at z-10, decorative brackets at z-20 framing the viewport,
 * interactive chrome at z-30 on top. The brackets layer is `pointer-events-none`
 * so it never intercepts a click meant for content — a full-viewport fixed overlay
 * that swallows clicks is the classic way this pattern goes wrong.
 */
export function HudFrame({ children }: Props) {
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

      <ScrollProgress />
      <HudReadout />

      <div className="relative z-10">{children}</div>
    </div>
  )
}

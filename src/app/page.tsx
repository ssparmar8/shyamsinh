import { Constellation } from '@/components/canvas/Constellation'
import { EntryOverlay } from '@/components/boot/EntryOverlay'
import { SmoothScroll } from '@/components/scroll/SmoothScroll'
import { HudFrame } from '@/components/hud/HudFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Identity } from '@/components/sections/Identity'
import { Trajectory } from '@/components/sections/Trajectory'
import { Systems } from '@/components/sections/Systems'
import { Telemetry } from '@/components/sections/Telemetry'
import { ArchiveIndex } from '@/components/sections/ArchiveIndex'
import { Uplink } from '@/components/sections/Uplink'

export default function Home() {
  return (
    <>
      <Constellation />
      <SmoothScroll />
      <EntryOverlay>
        <HudFrame label="ARCHIVE://">
          <main className="mx-auto max-w-3xl px-6">
            {/*
              Every beat is server-rendered, always — Reveal only wraps
              already-rendered content with opacity/transform styling as a
              client-side enhancement; it never gates it (see Reveal.tsx).
              Identity is above the fold, so its ScrollTrigger fires on the
              same initial refresh that creates it, not on a scroll that can
              never happen — its own hero decode (ScrambleTextAnimated) is
              untouched by this, since Reveal only ever animates the section
              as a whole, never the name text inside it. The small
              incremental delayMs is a subtle stagger for the case where more
              than one section's trigger fires at once (e.g. a keyboard End
              jump to the bottom), not a mechanism content depends on.
            */}
            <Reveal delayMs={0}>
              <Identity />
            </Reveal>
            <Reveal delayMs={50}>
              <Trajectory />
            </Reveal>
            {/* Systems reveals per-record internally (see Systems.tsx), so it is
                not wrapped in a single section-level Reveal. */}
            <Systems />
            <Reveal delayMs={150}>
              <Telemetry />
            </Reveal>
            <Reveal delayMs={200}>
              <ArchiveIndex />
            </Reveal>
            <Reveal delayMs={250}>
              <Uplink />
            </Reveal>
          </main>
        </HudFrame>
      </EntryOverlay>
    </>
  )
}

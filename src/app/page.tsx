import { Constellation } from '@/components/canvas/Constellation'
import { EntryOverlay } from '@/components/boot/EntryOverlay'
import { SmoothScroll } from '@/components/scroll/SmoothScroll'
import { CursorTrail } from '@/components/cursor/CursorTrail'
import { HudFrame } from '@/components/hud/HudFrame'
import { Scene } from '@/components/motion/Scene'
import { Identity } from '@/components/sections/Identity'
import { Trajectory } from '@/components/sections/Trajectory'
import { Systems } from '@/components/sections/Systems'
import { Stack } from '@/components/sections/Stack'
import { Telemetry } from '@/components/sections/Telemetry'
import { ArchiveIndex } from '@/components/sections/ArchiveIndex'
import { Uplink } from '@/components/sections/Uplink'

export default function Home() {
  return (
    <>
      <Constellation />
      <SmoothScroll />
      <CursorTrail />
      <EntryOverlay>
        <HudFrame label="ARCHIVE://">
          <main className="mx-auto max-w-3xl px-6">
            {/* Each beat is a Scene: pinned + scroll-scrubbed on pointer/wide, one-shot
                reveal on touch, full static content under reduced motion (see Scene.tsx).
                The star is the scrubbed assemble-on-entrance; `length` is a SHORT pin-hold
                (viewport multiples) that punctuates each beat. Tall beats (Systems,
                ArchiveIndex) get a brief hold, then scroll through with their per-item decode
                — a long hold would freeze the top records while the rest wait below. */}
            <Scene length={0.5}>
              <Identity />
            </Scene>
            <Scene length={0.4}>
              <Trajectory />
            </Scene>
            <Scene length={0.5}>
              <Systems />
            </Scene>
            <Scene length={0.4}>
              <Stack />
            </Scene>
            <Scene length={0.5}>
              <Telemetry />
            </Scene>
            <Scene length={0.4}>
              <ArchiveIndex />
            </Scene>
            <Scene length={0.5}>
              <Uplink />
            </Scene>
          </main>
        </HudFrame>
      </EntryOverlay>
    </>
  )
}

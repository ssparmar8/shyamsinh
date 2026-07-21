import { Constellation } from '@/components/canvas/Constellation'
import { EntryOverlay } from '@/components/boot/EntryOverlay'
import { SmoothScroll } from '@/components/scroll/SmoothScroll'
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
      <EntryOverlay>
        <HudFrame label="ARCHIVE://">
          <main className="mx-auto max-w-3xl px-6">
            {/* Each beat is a Scene: pinned + scroll-scrubbed on pointer/wide, one-shot
                reveal on touch, full static content under reduced motion (see Scene.tsx).
                Per-beat `length` (viewport multiples) paces how much scroll each holds —
                Systems is longest so its six records assemble in sequence across the pin. */}
            <Scene length={0.8}>
              <Identity />
            </Scene>
            <Scene length={1}>
              <Trajectory />
            </Scene>
            <Scene length={2.2}>
              <Systems />
            </Scene>
            <Scene length={0.7}>
              <Stack />
            </Scene>
            <Scene length={1.2}>
              <Telemetry />
            </Scene>
            <Scene length={1}>
              <ArchiveIndex />
            </Scene>
            <Scene length={0.8}>
              <Uplink />
            </Scene>
          </main>
        </HudFrame>
      </EntryOverlay>
    </>
  )
}

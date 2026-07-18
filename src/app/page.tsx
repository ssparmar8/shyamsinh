import { Constellation } from '@/components/canvas/Constellation'
import { EntryOverlay } from '@/components/boot/EntryOverlay'
import { SmoothScroll } from '@/components/scroll/SmoothScroll'
import { HudFrame } from '@/components/hud/HudFrame'
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
            <Identity />
            <Trajectory />
            <Systems />
            <Telemetry />
            <ArchiveIndex />
            <Uplink />
          </main>
        </HudFrame>
      </EntryOverlay>
    </>
  )
}

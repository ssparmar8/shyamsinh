import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { personJsonLd, serializeJsonLd } from '@/lib/jsonLd'
import { SITE_TITLE, SITE_DESCRIPTION } from './layout'
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

// Declared here rather than left to the root layout so that the homepage's canonical and
// og:url are a deliberate choice, not an inheritance every other route has to remember to
// undo. See src/lib/seo.ts.
export const metadata: Metadata = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: '/',
  // SITE_TITLE already ends in the name; without this the layout template would append it twice.
  titleIsBranded: true,
})

export default function Home() {
  return (
    <>
      {/*
        The Person graph. Deliberately outside EntryOverlay: the boot sequence is a client
        component, and a crawler that never runs it must still see this in the served HTML.
        Content is our own constants, and serializeJsonLd escapes `<` regardless.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd()) }}
      />
      <Constellation />
      <SmoothScroll />
      <CursorTrail />
      <EntryOverlay>
        <HudFrame>
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

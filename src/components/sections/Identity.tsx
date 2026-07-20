import { IDENTITY, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * Beat 02 — the hero. Content extracted verbatim from the interim single-screen
 * page.tsx (see git history) — only the outer layout changed: this now sits as
 * the first beat of the eight-beat scroll (`py-20 md:py-28`, like every other
 * section) instead of the old `min-h-dvh flex justify-center` box, which made
 * sense for a one-screen page but would leave a giant dead gap now that five
 * more real sections follow it.
 */
export function Identity() {
  return (
    <section id="identity" className="py-20 md:py-28">
      <ScrambleTextAnimated as="div" text="// IDENTITY" className={LABEL} seed={1} />
      {/*
        The animated decode, not the static ScrambleText. This is the site's
        signature effect and it was orphaned — built and unit-tested in Plan 2
        but wired into nothing, so the hero rendered as plain text and e2e caught
        it. The real name is always the accessible name (sr-only); the glyph
        noise is an aria-hidden layer. Above the fold once the gate dismisses,
        which is why useOnScreen's bottom-only rootMargin matters here.
      */}
      <ScrambleTextAnimated
        as="h1"
        text={IDENTITY.name}
        durationMs={1100}
        className="mt-3 font-mono text-2xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl"
      />
      <div className={`${LABEL} mt-3`}>{IDENTITY.title.toUpperCase()}</div>
      {/*
        Uses countClientRegions(), NOT countRegions() — the latter includes his own
        base and would claim work delivered to India. See src/content/index.ts.
      */}
      <ScrambleTextAnimated
        as="div"
        seed={2}
        text={`${yearsExperience()} YRS · ${countSystems()} SYSTEMS · ${countSectors()} SECTORS · ${countClientRegions()} CLIENT REGIONS`}
        className={`${LABEL} mt-1`}
      />
      <div className={`${LABEL} mt-1`}>{IDENTITY.location.toUpperCase()} · REMOTE</div>
    </section>
  )
}

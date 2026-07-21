import { IDENTITY, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * Beat 02 — the hero. The label, name, and stat line keep their on-load glyph decode
 * (ScrambleTextAnimated, timer-driven, aria-safe) — the site's signature effect, and the one
 * animation that actually reads on an above-the-fold beat whose scrub-assemble is already
 * complete at load (see Scene.tsx). The sublines rise inside a scrub Scene; all of it is
 * plain settled text under static/reveal.
 */
export function Identity() {
  return (
    <section id="identity" className="py-20 md:py-28">
      <ScrambleTextAnimated as="div" text="// IDENTITY" className={LABEL} seed={1} />
      <ScrambleTextAnimated
        as="h1"
        text={IDENTITY.name}
        durationMs={1100}
        className="mt-3 font-mono text-2xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl"
      />
      <Rise as="div" className={`${LABEL} mt-3`}>
        {IDENTITY.title.toUpperCase()}
      </Rise>
      {/*
        Uses countClientRegions(), NOT countRegions() — the latter includes his own base and
        would claim work delivered to India. See src/content/index.ts.
      */}
      <ScrambleTextAnimated
        as="div"
        seed={2}
        text={`${yearsExperience()} YRS · ${countSystems()} SYSTEMS · ${countSectors()} SECTORS · ${countClientRegions()} CLIENT REGIONS`}
        className={`${LABEL} mt-1`}
      />
      <Rise as="div" className={`${LABEL} mt-1`}>
        {IDENTITY.location.toUpperCase()} · REMOTE
      </Rise>
    </section>
  )
}

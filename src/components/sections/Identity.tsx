import { IDENTITY, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * Beat 02 — the hero. In a scrub Scene the label decodes, the name mask-wipes up, and the
 * sublines rise; under static/reveal every layer renders as plain settled text (the name
 * is still an <h1> with its real accessible name). See Scene.tsx / the layer primitives.
 */
export function Identity() {
  return (
    <section id="identity" className="py-20 md:py-28">
      <DecodeLine as="div" text="// IDENTITY" className={LABEL} seed={1} />
      <MaskWipe
        as="h1"
        className="mt-3 font-mono text-2xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl"
      >
        {IDENTITY.name}
      </MaskWipe>
      <Rise as="div" className={`${LABEL} mt-3`}>
        {IDENTITY.title.toUpperCase()}
      </Rise>
      {/*
        Uses countClientRegions(), NOT countRegions() — the latter includes his own base and
        would claim work delivered to India. See src/content/index.ts.
      */}
      <DecodeLine
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

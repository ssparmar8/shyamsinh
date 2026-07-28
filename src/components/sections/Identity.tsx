import { IDENTITY, AVAILABILITY, availabilityLabel, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
import { MagneticLink } from '@/components/motion/MagneticLink'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * The four derived figures as value/label pairs.
 *
 * Read as a ruled row rather than one run-on line, because as a single 10px string the
 * numbers sat at the same weight as the location and the job title and nothing in the beat
 * had a second focal point after the name.
 *
 * A function, not a constant: every value is derived at call time (yearsExperience() reads
 * the clock), and a module-level constant would freeze the year count at import.
 */
const stats = () => [
  { value: String(yearsExperience()), label: 'YRS', seed: 21 },
  { value: String(countSystems()), label: 'SYSTEMS', seed: 22 },
  { value: String(countSectors()), label: 'SECTORS', seed: 23 },
  // countClientRegions(), NOT countRegions() — the latter includes his own base and would
  // claim work delivered to India. See src/content/index.ts.
  { value: String(countClientRegions()), label: 'CLIENT REGIONS', seed: 24 },
]

/**
 * Beat 02 — the hero. The label, name, and stat figures keep their on-load glyph decode
 * (ScrambleTextAnimated, timer-driven, aria-safe) — the site's signature effect, and the one
 * animation that actually reads on an above-the-fold beat whose scrub-assemble is already
 * complete at load (see Scene.tsx). Everything else rises inside a scrub Scene; all of it is
 * plain settled text under static/reveal.
 */
export function Identity() {
  return (
    <section id="identity" className="py-20 md:py-28">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <ScrambleTextAnimated as="div" text="// IDENTITY" className={LABEL} seed={1} />
        {/*
          The dot is decorative and aria-hidden — the status is already the label's own text,
          and a second announcement would just be noise. It pulses only when he is open; a
          pulsing "booked" light reads as an invitation.
        */}
        <div className={`${LABEL} flex items-center gap-2`}>
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              AVAILABILITY.open ? 'status-pulse bg-[var(--color-ink)]' : 'bg-[var(--color-ghost)]'
            }`}
          />
          {availabilityLabel()}
        </div>
      </div>

      <ScrambleTextAnimated
        as="h1"
        text={IDENTITY.name}
        durationMs={1100}
        className="mt-4 font-mono text-3xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl"
      />
      {/* Ink, not dim, and a step up in size: the title is the first thing that qualifies the
          name, so it should not sit at the same weight as the location footnote below. */}
      <Rise
        as="div"
        className="mt-3 font-mono text-xs tracking-[var(--tracking-hud)] text-[var(--color-ink)] md:text-sm"
      >
        {IDENTITY.title.toUpperCase()}
      </Rise>

      {/* The one sentence of prose on the page, so it drops tracking-hud (0.2em is a HUD-label
          setting — at sentence length it stops being readable) and caps its measure. */}
      <Rise
        as="p"
        className="mt-6 max-w-xl font-mono text-sm leading-relaxed tracking-[0.02em] text-[var(--color-dim)]"
      >
        {IDENTITY.pitch}
      </Rise>

      <Rise
        as="ul"
        className="mt-10 grid grid-cols-2 border-y border-[var(--color-border)] sm:grid-cols-4"
      >
        {stats().map((s) => (
          <li key={s.label} className="py-4">
            <ScrambleTextAnimated
              as="div"
              text={s.value}
              seed={s.seed}
              className="font-mono text-2xl tracking-[var(--tracking-hud)] text-[var(--color-ink)]"
            />
            <div className={`${LABEL} mt-1`}>{s.label}</div>
          </li>
        ))}
      </Rise>

      <Rise as="div" className={`${LABEL} mt-4`}>
        {IDENTITY.location.toUpperCase()} · REMOTE
      </Rise>

      {/* Routes, not in-page anchors: every beat below is a pinned Scene, so an #uplink jump
          lands inside a pin's scroll range and reads as a broken scroll position. */}
      <Rise as="div" className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
        <MagneticLink
          href="/archive"
          text="▸ VIEW THE ARCHIVE"
          className={`${LABEL} inline-block hover:text-[var(--color-ink)]`}
        />
        <MagneticLink
          href="/contact"
          text="▸ START AN UPLINK"
          className={`${LABEL} inline-block hover:text-[var(--color-ink)]`}
        />
      </Rise>
    </section>
  )
}

import { CAPABILITIES, STACK } from '@/content/stack'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 04.5 — the toolchain. Sits after SYSTEMS ("here's the work → here's what
 * it's built with"). Two blocks: the architecture capability areas (label +
 * readable list), then the concrete stack as bordered tags — the same tag
 * treatment SystemRecord uses, so the toolset reads as one vocabulary with the
 * per-record stacks above it. Server-rendered like every beat; the heading
 * decodes via ScrambleTextAnimated, the lists are plain (decoding a wall of
 * tech names would be noise, not texture).
 */
export function Stack() {
  return (
    <section id="stack" className="py-20 md:py-28">
      <ScrambleTextAnimated as="h2" text="NODE: STACK" seed={8} className={HEADING} />
      <div className={`${LABEL} mt-3`}>ARCHITECTURE CAPABILITIES · TECHNICAL STACK</div>

      <dl className="mt-10 space-y-4">
        {CAPABILITIES.map((c) => (
          <div key={c.area} className="grid grid-cols-1 gap-1 md:grid-cols-[13rem_1fr] md:gap-x-4">
            <dt className={LABEL}>{c.area}</dt>
            <dd className="font-mono text-sm leading-relaxed text-[var(--color-ink)]">
              {c.items.join(' · ')}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 space-y-6">
        {STACK.map((g) => (
          <div key={g.group} className="grid grid-cols-1 gap-2 md:grid-cols-[13rem_1fr] md:gap-x-4">
            <div className={LABEL}>{g.group}</div>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((t) => (
                <li
                  key={t}
                  className="border border-[var(--color-border)] px-2 py-1 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

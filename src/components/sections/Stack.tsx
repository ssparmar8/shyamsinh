import { CAPABILITIES, STACK } from '@/content/stack'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 04.5 — the toolchain. In a scrub Scene the heading decodes, the sub-label wipes in,
 * and the capability rows + stack groups rise in sequence. Lists stay plain text (decoding a
 * wall of tech names would be noise, not texture). Server-rendered like every beat.
 */
export function Stack() {
  return (
    <section id="stack" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: STACK" seed={8} className={HEADING} />
      <MaskWipe as="div" className={`${LABEL} mt-3`}>
        ARCHITECTURE CAPABILITIES · TECHNICAL STACK
      </MaskWipe>

      <dl className="mt-10 space-y-4">
        {CAPABILITIES.map((c) => (
          <Rise
            as="div"
            key={c.area}
            className="grid grid-cols-1 gap-1 md:grid-cols-[13rem_1fr] md:gap-x-4"
          >
            <dt className={LABEL}>{c.area}</dt>
            <dd className="font-mono text-sm leading-relaxed text-[var(--color-ink)]">
              {c.items.join(' · ')}
            </dd>
          </Rise>
        ))}
      </dl>

      <div className="mt-12 space-y-6">
        {STACK.map((g) => (
          <Rise
            as="div"
            key={g.group}
            className="grid grid-cols-1 gap-2 md:grid-cols-[13rem_1fr] md:gap-x-4"
          >
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
          </Rise>
        ))}
      </div>
    </section>
  )
}

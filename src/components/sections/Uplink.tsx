import { IDENTITY } from '@/content/identity'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 07 — the contact CTA, mirroring /contact's content. In a scrub Scene the heading
 * decodes, the email address wipes up, and the phone / location / links rise in.
 */
export function Uplink() {
  return (
    <section id="uplink" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: UPLINK" seed={7} className={HEADING} />

      {/*
        break-all and the tighter mobile tracking are load-bearing, not styling — the email
        has no break opportunity and at 375px would otherwise force horizontal scroll. See
        /contact's page.tsx, where this was first measured and fixed.
      */}
      <MaskWipe>
        <a
          href={`mailto:${IDENTITY.email}`}
          className="mt-4 inline-block break-all font-mono text-base tracking-[0.08em] text-[var(--color-ink)] underline underline-offset-8 md:text-2xl md:tracking-[0.14em]"
        >
          {IDENTITY.email}
        </a>
      </MaskWipe>

      <Rise as="div" className="mt-3">
        <a
          href={`tel:${IDENTITY.phone.replace(/\s/g, '')}`}
          className={`${LABEL} block w-fit underline-offset-4 hover:text-[var(--color-ink)] hover:underline`}
        >
          {IDENTITY.phone}
        </a>
      </Rise>

      <Rise as="div" className={`${LABEL} mt-1`}>
        {IDENTITY.location.toUpperCase()} · REMOTE · FREELANCE CONTRACT
      </Rise>

      <Rise as="ul" className="mt-12 flex flex-wrap gap-x-6 gap-y-3">
        {IDENTITY.links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
            >
              {l.label} ▸
            </a>
          </li>
        ))}
      </Rise>
    </section>
  )
}

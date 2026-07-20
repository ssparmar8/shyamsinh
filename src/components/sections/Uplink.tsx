import { IDENTITY } from '@/content/identity'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 07 — the contact CTA, mirroring /contact's content (same email
 * treatment, same links) so a visitor who scrolls to the end of the archive
 * sees the same facts as one who lands on the dedicated route.
 */
export function Uplink() {
  return (
    <section id="uplink" className="py-20 md:py-28">
      <ScrambleTextAnimated as="h2" text="NODE: UPLINK" seed={7} className={HEADING} />

      {/*
        break-all and the tighter mobile tracking are load-bearing, not styling.
        `parmarshyamsingh8@gmail.com` has no space or hyphen, so it offers the
        browser no break opportunity: at 375px it needed more width than a
        327px box gave it and dragged the whole page into horizontal scroll.
        See /contact's page.tsx, where this was first measured and fixed.
      */}
      <a
        href={`mailto:${IDENTITY.email}`}
        className="mt-4 inline-block break-all font-mono text-base tracking-[0.08em] text-[var(--color-ink)] underline underline-offset-8 md:text-2xl md:tracking-[0.14em]"
      >
        {IDENTITY.email}
      </a>

      <div className={`${LABEL} mt-3`}>
        {IDENTITY.location.toUpperCase()} · REMOTE · FREELANCE CONTRACT
      </div>

      <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3">
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
      </ul>
    </section>
  )
}

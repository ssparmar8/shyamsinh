import type { Metadata } from 'next'
import Link from 'next/link'
import { IDENTITY } from '@/content/identity'
import { HudFrame } from '@/components/hud/HudFrame'

export const metadata: Metadata = {
  title: 'Uplink',
  description: `Contact ${IDENTITY.name}.`,
}

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export default function ContactPage() {
  return (
    <HudFrame label="UPLINK://">
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-24">
        <div className={LABEL}>{'// UPLINK'}</div>

        {/*
          break-all and the tighter mobile tracking are load-bearing, not styling.
          `parmarshyamsingh8@gmail.com` has no space or hyphen, so it offers the
          browser no break opportunity: at 375px it needed 360px inside a 327px box,
          clipped to "…gmail.con", and dragged the whole page into horizontal scroll.
          On the one page whose entire job is showing a client the address.
          A wrapped monospace address suits a terminal readout anyway.
        */}
        <a
          href={`mailto:${IDENTITY.email}`}
          className="mt-4 break-all font-mono text-base tracking-[0.08em] text-[var(--color-ink)] underline underline-offset-8 md:text-2xl md:tracking-[0.14em]"
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

        <Link href="/" className={`${LABEL} mt-16 hover:text-[var(--color-ink)]`}>
          ◂ BACK
        </Link>
      </main>
    </HudFrame>
  )
}

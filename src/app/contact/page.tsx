import type { Metadata } from 'next'
import Link from 'next/link'
import { IDENTITY, AVAILABILITY, availabilityLabel } from '@/content/identity'
import { HudFrame } from '@/components/hud/HudFrame'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, canonicalUrl, clampDescription, contactJsonLd } from '@/lib/seo'

/**
 * 'Uplink' is the site's own word for this page and means nothing to someone searching for
 * an AI developer to hire, so the TITLE carries the site language while the DESCRIPTION
 * carries the words a person actually types. `Contact ${name}.` was 26 characters and gave a
 * result listing nothing to read.
 */
const DESCRIPTION = clampDescription(
  `Hire ${IDENTITY.name}, ${IDENTITY.title} — available for freelance and contract work on AI, ` +
    `voice agent and backend projects. Remote from ${IDENTITY.location}.`,
)

export const metadata: Metadata = {
  title: 'Contact',
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl('/contact') },
  openGraph: {
    type: 'website',
    title: `Contact ${IDENTITY.name}`,
    description: DESCRIPTION,
    url: canonicalUrl('/contact'),
  },
}

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
/** Kept in step with the Uplink beat's ROW — this page and that beat are the same content. */
const ROW =
  'grid grid-cols-1 gap-1 border-b border-[var(--color-hair)] py-4 md:grid-cols-[5rem_1fr] md:gap-x-4'

export default function ContactPage() {
  return (
    <HudFrame>
      <JsonLd data={contactJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-24">
        {/* A real <h1>. This page had no heading element at all, so crawlers and screen
            readers met it as an untitled slab of contact details.

            The heading holds ONLY the words, and the `// UPLINK` wordmark stays a separate
            element beside it. Nesting the two inside one h1 concatenated their text into
            "// UPLINKContact Shyamsinh Parmar" — aria-hidden keeps that out of a screen
            reader, but a crawler reads text content and would have indexed the mangled form. */}
        <h1 className="sr-only">{`Contact ${IDENTITY.name}`}</h1>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className={LABEL}>{'// UPLINK'}</div>
          {/* Whether he is taking work is the first thing this page has to answer. */}
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

        <dl className="mt-6 border-t border-[var(--color-border)]">
          <div className={ROW}>
            <dt className={LABEL}>EMAIL</dt>
            <dd>
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
                className="inline-block break-all font-mono text-base tracking-[0.08em] text-[var(--color-ink)] underline underline-offset-8 md:text-2xl md:tracking-[0.14em]"
              >
                {IDENTITY.email}
              </a>
            </dd>
          </div>

          <div className={ROW}>
            <dt className={LABEL}>PHONE</dt>
            <dd>
              <a
                href={`tel:${IDENTITY.phone.replace(/\s/g, '')}`}
                className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)] underline-offset-4 hover:underline"
              >
                {IDENTITY.phone}
              </a>
            </dd>
          </div>

          <div className={ROW}>
            <dt className={LABEL}>BASE</dt>
            <dd className={LABEL}>
              {IDENTITY.location.toUpperCase()} · REMOTE · FREELANCE CONTRACT
            </dd>
          </div>
        </dl>

        <div className={`${LABEL} mt-12`}>{'// PROFILES'}</div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
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

        {/* prefetch={false}: keep this lean route from viewport-prefetching /'s
            heavy cinematic bundle. See archive/page.tsx for the full rationale. */}
        <Link href="/" prefetch={false} className={`${LABEL} mt-16 hover:text-[var(--color-ink)]`}>
          ◂ BACK
        </Link>
      </main>
    </HudFrame>
  )
}

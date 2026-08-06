import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeatured, getArchive, countSystems, countSectors, recordNumber, SYSTEMS } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, canonicalUrl, clampDescription, collectionJsonLd } from '@/lib/seo'
import type { System } from '@/content/schema'

/**
 * Counts come from the data, so the description can never advertise a number of systems the
 * archive does not contain. 'Every system, by year.' was 22 characters — far under the ~150
 * a result will display, and it named none of the terms someone would search for.
 */
const DESCRIPTION = clampDescription(
  `Every system Shyamsinh Parmar has shipped: ${countSystems()} production AI and backend projects across ` +
    `${countSectors()} sectors — healthcare, legal, compliance, commerce and more, by year.`,
)

export const metadata: Metadata = {
  title: 'Archive Index',
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl('/archive') },
  openGraph: {
    type: 'website',
    title: `Archive Index — ${countSystems()} systems`,
    description: DESCRIPTION,
    url: canonicalUrl('/archive'),
  },
}

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/** Kept identical to the home beat's GRID (ArchiveIndex.tsx) — same records, same columns. */
const GRID =
  'grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-3 md:grid-cols-[2.5rem_1fr_1fr_auto]'

function Head() {
  return (
    <div className={`${GRID} ${LABEL} mt-3 border-b border-[var(--color-border)] pb-2`}>
      <span>NO</span>
      <span>SYSTEM</span>
      <span className="hidden md:block">DOMAIN</span>
      <span className="text-right">REGION · YEAR</span>
    </div>
  )
}

function Row({ system }: { system: System }) {
  return (
    <li>
      <Link
        href={`/systems/${system.slug}`}
        className={`${GRID} border-b border-[var(--color-border)] py-3 hover:border-[var(--color-ink)]`}
      >
        <span className={`${LABEL} col-start-1 row-start-1`}>
          {String(recordNumber(system.slug)).padStart(2, '0')}
        </span>
        <span className="col-start-2 row-start-1 font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
          {system.name}
        </span>
        {/* Wraps to a second line below md rather than being hidden: the domain is the field
            that says what a record is, and dropping it left a phone with a name and a year. */}
        <span className={`${LABEL} col-start-2 row-start-2 md:col-start-3 md:row-start-1`}>
          {system.domain}
        </span>
        <span className={`${LABEL} col-start-3 row-start-1 text-right md:col-start-4`}>
          {system.region} · {system.year} ▸
        </span>
      </Link>
    </li>
  )
}

export default function ArchivePage() {
  return (
    <HudFrame>
      {/* The archive had no structured data at all, so its 18 records read to a crawler as
          18 unrelated pages rather than one catalogue with an owner. */}
      <JsonLd
        data={collectionJsonLd(
          SYSTEMS.map((s) => ({ name: s.name, slug: s.slug })),
          '/archive',
          'Archive Index',
          DESCRIPTION,
        )}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Archive Index', path: '/archive' },
        ])}
      />
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        <h1 className="font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]">
          ARCHIVE INDEX
        </h1>
        <div className={`${LABEL} mt-2`}>
          {countSystems()} SYSTEMS · {countSectors()} SECTORS · BY YEAR
        </div>

        <div className={`${LABEL} mt-12`}>{'// FEATURED'}</div>
        <Head />
        <ul>
          {getFeatured().map((s) => <Row key={s.slug} system={s} />)}
        </ul>

        <div className={`${LABEL} mt-12`}>{'// INDEX'}</div>
        <Head />
        <ul>
          {getArchive().map((s) => <Row key={s.slug} system={s} />)}
        </ul>

        {/* prefetch={false}: this is a lean route, and / carries the heavy cinematic
            bundle (Lenis now, WebGL later). Next viewport-prefetches a static route's
            whole bundle when its link scrolls in; without this, the escape-hatch
            routes silently pull the animation libs they exist to avoid. */}
        <Link href="/" prefetch={false} className={`${LABEL} mt-10 inline-block hover:text-[var(--color-ink)]`}>
          ◂ BACK
        </Link>
      </main>
    </HudFrame>
  )
}

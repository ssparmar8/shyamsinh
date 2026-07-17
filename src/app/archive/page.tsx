import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeatured, getArchive, countSystems, countSectors, recordNumber } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import type { System } from '@/content/schema'

export const metadata: Metadata = {
  title: 'Archive Index',
  description: 'Every system, by year.',
}

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

function Row({ system }: { system: System }) {
  return (
    <li>
      <Link
        href={`/systems/${system.slug}`}
        className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 border-b border-[var(--color-border)] py-3 hover:border-[var(--color-ink)] md:grid-cols-[2.5rem_1fr_1fr_auto]"
      >
        <span className={LABEL}>{String(recordNumber(system.slug)).padStart(2, '0')}</span>
        <span className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
          {system.name}
        </span>
        <span className={`${LABEL} hidden md:block`}>{system.domain}</span>
        <span className={LABEL}>
          {system.region} · {system.year} ▸
        </span>
      </Link>
    </li>
  )
}

export default function ArchivePage() {
  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        <h1 className="font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]">
          ARCHIVE INDEX
        </h1>
        <div className={`${LABEL} mt-2`}>
          {countSystems()} SYSTEMS · {countSectors()} SECTORS · BY YEAR
        </div>

        <div className={`${LABEL} mt-12`}>{'// FEATURED'}</div>
        <ul className="mt-3">
          {getFeatured().map((s) => <Row key={s.slug} system={s} />)}
        </ul>

        <div className={`${LABEL} mt-12`}>{'// INDEX'}</div>
        <ul className="mt-3">
          {getArchive().map((s) => <Row key={s.slug} system={s} />)}
        </ul>

        <Link href="/" className={`${LABEL} mt-10 inline-block hover:text-[var(--color-ink)]`}>
          ◂ BACK
        </Link>
      </main>
    </HudFrame>
  )
}

import Link from 'next/link'
import { IDENTITY, yearsExperience } from '@/content/identity'
import { getFeatured, countSystems, countSectors, countClientRegions } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { ScrambleText } from '@/components/text/ScrambleText'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export default function Home() {
  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-24">
        <div className={LABEL}>{'// IDENTITY'}</div>
        <ScrambleText
          as="h1"
          text={IDENTITY.name}
          className="mt-3 font-mono text-2xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl"
        />
        <div className={`${LABEL} mt-3`}>{IDENTITY.title.toUpperCase()}</div>
        {/*
          Uses countClientRegions(), NOT countRegions() — the latter includes his own
          base and would claim work delivered to India. See src/content/index.ts.
        */}
        <div className={`${LABEL} mt-1`}>
          {yearsExperience()} YRS · {countSystems()} SYSTEMS · {countSectors()} SECTORS ·{' '}
          {countClientRegions()} CLIENT REGIONS
        </div>
        <div className={`${LABEL} mt-1`}>{IDENTITY.location.toUpperCase()} · REMOTE</div>

        <ul className="mt-14 space-y-3">
          {getFeatured().map((s) => (
            <li key={s.slug}>
              <Link
                href={`/systems/${s.slug}`}
                className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-3 hover:border-[var(--color-ink)]"
              >
                <span className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
                  {s.name}
                </span>
                <span className={LABEL}>{s.domain} · {s.year} ▸</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/archive" className={`${LABEL} mt-8 hover:text-[var(--color-ink)]`}>
          ▸ FULL ARCHIVE INDEX
        </Link>
      </main>
    </HudFrame>
  )
}

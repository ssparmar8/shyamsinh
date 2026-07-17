import Link from 'next/link'
import { HudFrame } from '@/components/hud/HudFrame'
import { countSystems } from '@/content'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * Without this, an unknown route drops into Next's stock 404 — black background,
 * white sans-serif — which is a jarring exit from a near-white monochrome site and
 * reads as "this page is broken" rather than "that record doesn't exist".
 *
 * Stays in character: a lookup that returned nothing, with a way back.
 */
export default function NotFound() {
  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-24">
        <div className={LABEL}>{'// LOOKUP'}</div>
        <h1 className="mt-3 font-mono text-2xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl">
          NO RECORD
        </h1>
        <div className={`${LABEL} mt-3`}>QUERY RETURNED 0 ROWS · 404</div>

        <p className="mt-8 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]">
          Nothing is archived at this address. The record may have been renamed, or it
          may never have existed.
        </p>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" prefetch={false} className={`${LABEL} hover:text-[var(--color-ink)]`}>
            ◂ IDENTITY
          </Link>
          <Link href="/archive" className={`${LABEL} hover:text-[var(--color-ink)]`}>
            ▸ ARCHIVE INDEX · {countSystems()} SYSTEMS
          </Link>
          <Link href="/contact" className={`${LABEL} hover:text-[var(--color-ink)]`}>
            ▸ UPLINK
          </Link>
        </div>
      </main>
    </HudFrame>
  )
}

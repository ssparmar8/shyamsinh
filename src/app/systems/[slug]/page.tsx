import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getBySlug, getAllSlugs, recordNumber } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { SystemRecord } from '@/components/record/SystemRecord'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const system = getBySlug(slug)
  if (!system) return {}
  return {
    title: `${system.name} — ${system.domain}`,
    description: system.summary,
  }
}

export default async function SystemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const system = getBySlug(slug)
  if (!system) notFound()

  // recordNumber() spans all 18 records. Deriving this from getFeatured() made
  // every archive system render as RECORD 01 — 13 of 18 shared one number.
  const index = recordNumber(slug) - 1

  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        {/* animate=false: this addressable route is spec'd "fast, static" (design §8);
            the decode/typewriter belongs to the home scroll, not the one-link detail page. */}
        <SystemRecord system={system} index={index === -1 ? 0 : index} animate={false} />

        {system.caseStudy && (
          <dl className="mt-10 space-y-6 border-t border-[var(--color-border)] pt-8">
            <div>
              <dt className={LABEL}>PROBLEM</dt>
              <dd className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]">
                {system.caseStudy.problem}
              </dd>
            </div>
            <div>
              <dt className={LABEL}>DECISIONS</dt>
              <dd className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]">
                {system.caseStudy.decisions}
              </dd>
            </div>
            <div>
              <dt className={LABEL}>DELIVERED</dt>
              <dd className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]">
                {system.caseStudy.delivered}
              </dd>
            </div>
          </dl>
        )}

        <Link
          href="/archive"
          className="mt-8 inline-block font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] hover:text-[var(--color-ink)]"
        >
          ◂ BACK TO INDEX
        </Link>
      </main>
    </HudFrame>
  )
}

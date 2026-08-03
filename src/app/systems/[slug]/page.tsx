import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getBySlug, getAllSlugs, recordNumber, getRelated } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { SystemRecord } from '@/components/record/SystemRecord'
import { pageMetadata, recordTitle } from '@/lib/seo'
import { recordJsonLd, serializeJsonLd } from '@/lib/jsonLd'

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
  // Each record canonicalises to itself. Inheriting the root's canonical would have told
  // Google all 18 of these were duplicates of the homepage — the single most valuable set
  // of pages on the site, deindexed by one line in a layout. See src/lib/seo.ts.
  return pageMetadata({
    // Both composed rather than taken raw: a title or description that overflows the SERP is
    // written, indexed, and then not shown. See recordTitle() and SystemSchema.metaDescription.
    title: recordTitle(system.name, system.domain),
    description: system.metaDescription ?? system.summary,
    path: `/systems/${slug}/`,
  })
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
    <HudFrame>
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(recordJsonLd(system)) }}
        />
        {/* animate=false: this addressable route is spec'd "fast, static" (design §8);
            the decode/typewriter belongs to the home scroll, not the one-link detail page. */}
        {/* headingLevel=1: this route IS the record, so its name is the page's h1. */}
        <SystemRecord
          system={system}
          index={index === -1 ? 0 : index}
          animate={false}
          headingLevel={1}
        />

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

        {/*
          Related records. Before this, a record page linked to exactly one other page on the
          site — the index — so 18 of the most specific, most rankable pages here were
          crawlable dead ends (SEO_RULES.md §12 asks for 5-10 internal links).

          Rows follow /archive's grammar deliberately: catalogue number, name, domain, year.
          A reader arriving mid-site from a search result should recognise the shape of a
          record row wherever it appears. Related-ness is derived in getRelated().
        */}
        <section className="mt-14 border-t border-[var(--color-border)] pt-8">
          <h2 className={LABEL}>RELATED RECORDS</h2>
          <ul className="mt-4">
            {getRelated(slug).map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/systems/${r.slug}`}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-3 border-b border-[var(--color-border)] py-3 hover:border-[var(--color-ink)] md:grid-cols-[2.5rem_1fr_1fr_auto]"
                >
                  <span className={LABEL}>{String(recordNumber(r.slug)).padStart(2, '0')}</span>
                  <span className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
                    {r.name}
                  </span>
                  <span className={`${LABEL} hidden md:block`}>{r.domain}</span>
                  <span className={`${LABEL} text-right`}>
                    {r.region} · {r.year}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

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

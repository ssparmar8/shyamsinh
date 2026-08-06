import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getBySlug, getAllSlugs, recordNumber } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { SystemRecord } from '@/components/record/SystemRecord'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, canonicalUrl, clampDescription, ogImageFor, systemJsonLd } from '@/lib/seo'

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

  // The summary is written for a reader, not for a result listing, so a long one gets cut at
  // a word boundary rather than mid-word by the search engine. The sector and year are
  // appended when there is room: they are the terms that distinguish this record from the
  // other seventeen in a list of blue links.
  /*
    A third of the summaries are written tighter than a search snippet can display (VetWise's
    is 100 characters against the ~155 Google will show), which wastes the most valuable line
    of text this page gets. Short ones are extended with the record's own stack — true by
    construction, since it comes from the same data the page renders, and it adds the
    technology names someone actually types ("Twilio", "pgvector") rather than filler.
  */
  const description = clampDescription(
    system.summary.length >= 120
      ? system.summary
      : `${system.summary} Built with ${system.stack.slice(0, 3).join(', ')}.`,
  )

  return {
    title: `${system.name} — ${system.domain}`,
    description,
    alternates: { canonical: canonicalUrl(`/systems/${slug}`) },
    openGraph: {
      type: 'article',
      title: `${system.name} — ${system.domain}`,
      description,
      url: canonicalUrl(`/systems/${slug}`),
      // Names the project, not the person: a shared record link previously advertised
      // "Shyamsinh Parmar — AI & Backend Architect" as the description of a card showing
      // a completely different subject.
      images: ogImageFor(
        `/systems/${slug}`,
        `${system.name} — ${system.domain}, ${system.year}. Built by Shyamsinh Parmar.`,
      ),
    },
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
    <HudFrame>
      {/* The record as a CreativeWork, credited to the one Person @id the home page defines,
          plus the trail that lets a result render "Archive › AIVA Chat" instead of a path. */}
      <JsonLd data={systemJsonLd(system)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Archive Index', path: '/archive' },
          { name: system.name, path: `/systems/${system.slug}` },
        ])}
      />
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        {/* animate=false: this addressable route is spec'd "fast, static" (design §8);
            the decode/typewriter belongs to the home scroll, not the one-link detail page. */}
        <SystemRecord
          system={system}
          index={index === -1 ? 0 : index}
          animate={false}
          as="h1"
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

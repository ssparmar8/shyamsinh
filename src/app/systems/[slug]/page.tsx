import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getBySlug, getAllSlugs, getFeatured } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { SystemRecord } from '@/components/record/SystemRecord'

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

  const index = getFeatured().findIndex((s) => s.slug === slug)

  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        <SystemRecord system={system} index={index === -1 ? 0 : index} />
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

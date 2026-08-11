import { ImageResponse } from 'next/og'
import { getAllSlugs, getBySlug, recordNumber } from '@/content'
import { OG_CONTENT_TYPE, OG_SIZE, identityCard, recordCard } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const dynamic = 'force-static'

/**
 * One card per record. Required for `output: 'export'` — the image is its own route, so it
 * needs its own params; without this the build emits nothing for the 18 slugs and every
 * project link falls back to the generic identity card.
 */
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default async function SystemOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const system = getBySlug(slug)
  // A slug with no record cannot happen (dynamicParams is false and these params come from
  // getAllSlugs), but the image route must still return something rather than throw.
  if (!system) return new ImageResponse(identityCard(), size)
  return new ImageResponse(recordCard(system, recordNumber(slug)), size)
}

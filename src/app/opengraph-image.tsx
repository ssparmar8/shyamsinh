import { ImageResponse } from 'next/og'
import { IDENTITY } from '@/content/identity'
import { OG_CONTENT_TYPE, OG_SIZE, identityCard } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `${IDENTITY.name} — ${IDENTITY.title}`

/**
 * Required by `output: 'export'`: a generated-image route is a Route Handler, and the export
 * build refuses to guess whether one is static.
 */
export const dynamic = 'force-static'

/**
 * The homepage share card, generated at build time and shipped as a real PNG.
 *
 * Deliberately no custom font. Loading Geist would mean a build-time fetch or a binary in the
 * repo, and a failed font fetch fails the build; the layout is set in a stack satori always
 * has. The card reads as the site through its palette, rules and HUD corner marks.
 */
export default function OpengraphImage() {
  return new ImageResponse(identityCard(), size)
}

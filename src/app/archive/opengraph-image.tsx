import { ImageResponse } from 'next/og'
import { countSystems } from '@/content'
import { OG_CONTENT_TYPE, OG_SIZE, archiveCard } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `Archive Index — ${countSystems()} systems`
export const dynamic = 'force-static'

/** Co-located, so /archive shares a card about the catalogue rather than the identity card. */
export default function ArchiveOpengraphImage() {
  return new ImageResponse(archiveCard(), size)
}

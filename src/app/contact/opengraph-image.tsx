import { ImageResponse } from 'next/og'
import { AVAILABILITY, availabilityLabel, IDENTITY } from '@/content/identity'
import { OG_CONTENT_TYPE, OG_SIZE, contactCard } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `Contact ${IDENTITY.name} — ${availabilityLabel()}`
export const dynamic = 'force-static'

/** The card answers the page's only question: is he taking work, and how is he reached. */
export default function ContactOpengraphImage() {
  return new ImageResponse(contactCard(AVAILABILITY.open, availabilityLabel()), size)
}

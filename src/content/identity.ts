import { CAREER_START_YEAR } from './schema'

export const IDENTITY = {
  name: 'Shyamsinh Parmar',
  title: 'AI & Backend Architect',
  /**
   * The one sentence a visitor reads before deciding whether to keep scrolling — the hero
   * carried a name, a job title and four counts, none of which say what the work IS.
   *
   * It is a claim, so it stays inside what the archive can back: voice/conversational agents
   * (AIVA, MOF FrontDesk), the platforms underneath them, and architecture-plus-delivery as
   * the actual role (see CONTRACT_ROLE in systems.ts). The three named verticals are the
   * three with the most records. Narrow it or widen it when the archive moves, not before.
   */
  pitch:
    'I design and ship production AI systems — voice agents, LLM pipelines, and the backends that carry them — for teams in healthcare, legal, and compliance.',
  location: 'Gujarat, India',
  locationCode: 'IN',
  email: 'parmarshyamsingh8@gmail.com',
  // Supplied by Shyamsinh on the résumé. Display keeps the spaced grouping; the
  // tel: href strips them (see Uplink/contact). Published deliberately — a
  // freelance client wanting a call should get the number, not a form.
  phone: '+91 88660 60908',
  /**
   * The source documents gave display names, not URLs, so early drafts of this list
   * were guesses — and the guesses were wrong. Upwork and LinkedIn both pointed at
   * nothing. Verification status per row is noted below; do not add a row here
   * without opening it. A dead link in the contact section is worse than no link.
   */
  links: [
    // Supplied by Shyamsinh directly. The `?mp_source=share` tracking parameter his
    // share link carried is stripped deliberately — it is share attribution, not part
    // of the address.
    { label: 'UPWORK', href: 'https://www.upwork.com/freelancers/~017c3a05a797c7d41a' },
    // Verified: live profile, name/stack/location all match.
    { label: 'GITHUB', href: 'https://github.com/ssparmar8' },
    { label: 'WOYCE TECH', href: 'https://github.com/woyce-tech' },
    { label: 'FIVERR', href: 'https://www.fiverr.com/ssparmar8' },
    // UNCONFIRMED. Found by search, not supplied — name, GTU education and Rajkot
    // location match, but Shyamsinh has not confirmed it. Confirm or drop before launch.
    { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/shyamsinh-parmar-7ba284167/' },
  ],
} as const

/**
 * Whether he is taking work, as data rather than prose.
 *
 * Deliberately NOT inside the `as const` IDENTITY object: there, `open` would narrow to the
 * literal type `true` and the booked branch would become unreachable at the type level — a
 * status field that cannot be turned off is a lie waiting to ship. The explicit `boolean`
 * keeps both branches real, so going booked is a one-word edit here and nothing else.
 */
export type Availability = { open: boolean; openLabel: string; closedLabel: string }

export const AVAILABILITY: Availability = {
  open: true,
  openLabel: 'AVAILABLE FOR CONTRACT',
  // Not "unavailable" — the phone and email stay published either way (see IDENTITY.phone).
  closedLabel: 'BOOKED · ENQUIRIES OPEN',
}

export const availabilityLabel = (a: Availability = AVAILABILITY): string =>
  a.open ? a.openLabel : a.closedLabel

/** Derived, never hardcoded — so correcting the anchor corrects the whole site. */
export const yearsExperience = (now = new Date().getFullYear()): number =>
  now - CAREER_START_YEAR

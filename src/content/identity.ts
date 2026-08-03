import { CAREER_START_YEAR } from './schema'

/**
 * The canonical origin, no trailing slash.
 *
 * Every absolute URL the site emits — `metadataBase`, the canonical link, the og:image
 * crawlers fetch — composes from here, so moving the domain is a one-line edit. It has to
 * be absolute and it has to be right: Open Graph consumers do not resolve relative paths,
 * and without `metadataBase` Next falls back to `http://localhost:3000`, which ships a
 * social card pointing at the developer's own machine.
 */
export const SITE_URL = 'https://shyamsinh.qzz.io'

/**
 * Google Search Console verification token, or '' when the site is not yet verified.
 *
 * Paste the value out of the "HTML tag" method — the `content="..."` attribute only, not the
 * whole tag — and redeploy; layout.tsx emits the meta tag only when this is non-empty, so an
 * empty string ships no broken half-tag. The HTML-tag method is the one to use here because
 * shyamsinh.qzz.io is a subdomain of a service whose DNS we do not control, which rules out
 * the TXT-record method.
 *
 * Verification is what turns the sitemap from a file nobody requested into indexing you can
 * actually watch. Until it is set, nothing about this site's search performance is visible.
 */
export const GOOGLE_SITE_VERIFICATION = ''

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
  /**
   * The city, not just the state. Confirmed by Shyamsinh 2026-08-03.
   *
   * It was 'Gujarat, India', which meant the site could not be found by anyone searching for
   * someone in Rajkot — a city the site never named. Every visible location string on the
   * site reads this field (hero, contact, OG card, both meta descriptions), so this is the
   * only place it needs to be true. Widening it back to the state would silently remove the
   * site's entire local signal, so do it deliberately or not at all.
   */
  location: 'Rajkot, Gujarat, India',
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
   *
   * `sameAs` marks a row as safe to publish in the JSON-LD Person graph (see lib/jsonLd.ts),
   * and it is a STRICTER test than "the link works". schema.org sameAs is an assertion that
   * the URL identifies THIS PERSON, and search engines use it to resolve which Shyamsinh the
   * site is about. A wrong entry there does not fail quietly — it actively teaches Google the
   * wrong entity, which is worse than publishing no graph at all. So it is false for anything
   * unconfirmed, and false for anything that is not him.
   */
  links: [
    // Supplied by Shyamsinh directly. The `?mp_source=share` tracking parameter his
    // share link carried is stripped deliberately — it is share attribution, not part
    // of the address.
    { label: 'UPWORK', href: 'https://www.upwork.com/freelancers/~017c3a05a797c7d41a', sameAs: true },
    // Verified: live profile, name/stack/location all match.
    { label: 'GITHUB', href: 'https://github.com/ssparmar8', sameAs: true },
    // sameAs: false — this is the Woyce Tech ORGANISATION, not Shyamsinh. Claiming a company
    // account as an alias of a person is a category error. It is published as `worksFor` in
    // the Person graph instead, which is what it actually is.
    { label: 'WOYCE TECH', href: 'https://github.com/woyce-tech', sameAs: false },
    // Same handle as the verified GitHub account (`ssparmar8`), which is what carries it.
    { label: 'FIVERR', href: 'https://www.fiverr.com/ssparmar8', sameAs: true },
    // UNCONFIRMED. Found by search, not supplied — name, GTU education and Rajkot
    // location match, but Shyamsinh has not confirmed it. Confirm or drop before launch.
    // Stays out of the entity graph until he does: see the sameAs note above.
    { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/shyamsinh-parmar-7ba284167/', sameAs: false },
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

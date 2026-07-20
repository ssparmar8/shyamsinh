import { CAREER_START_YEAR } from './schema'

export const IDENTITY = {
  name: 'Shyamsinh Parmar',
  title: 'AI & Backend Architect',
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

/** Derived, never hardcoded — so correcting the anchor corrects the whole site. */
export const yearsExperience = (now = new Date().getFullYear()): number =>
  now - CAREER_START_YEAR

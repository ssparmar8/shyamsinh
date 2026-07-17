import { CAREER_START_YEAR } from './schema'

export const IDENTITY = {
  name: 'Shyamsinh Parmar',
  title: 'AI & Backend Architect',
  location: 'Gujarat, India',
  locationCode: 'IN',
  email: 'parmarshyamsingh8@gmail.com',
  // UNVERIFIED. The source documents give display names, not URLs — these hrefs are
  // constructed guesses. Each must be opened and confirmed to resolve before launch,
  // or the row dropped. A dead link in the contact section is worse than a missing one.
  links: [
    { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/shyamsinh-parmar-7ba284167/' },
    { label: 'GITHUB', href: 'https://github.com/ssparmar8' },
    { label: 'WOYCE TECH', href: 'https://github.com/woyce-tech' },
    { label: 'UPWORK', href: 'https://www.upwork.com/freelancers/~shyamsinhparmar' },
    { label: 'FIVERR', href: 'https://www.fiverr.com/ssparmar8' },
  ],
} as const

/** Derived, never hardcoded — so correcting the anchor corrects the whole site. */
export const yearsExperience = (now = new Date().getFullYear()): number =>
  now - CAREER_START_YEAR

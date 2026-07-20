import { describe, it, expect } from 'vitest'
import { getBySlug } from './index'

// The four systems whose scope Shyamsinh confirmed against the résumé case studies.
const WITH_CASE_STUDY = ['aiva', 'health-wealth-safe', 'yellowpad', 'mof-frontdesk']

describe('case studies', () => {
  it('the four mapped systems each carry a full Problem / Decisions / Delivered writeup', () => {
    for (const slug of WITH_CASE_STUDY) {
      const s = getBySlug(slug)
      expect(s, slug).toBeDefined()
      expect(s!.caseStudy, `${slug} caseStudy`).toBeDefined()
      expect(s!.caseStudy!.problem).toMatch(/\S/)
      expect(s!.caseStudy!.decisions).toMatch(/\S/)
      expect(s!.caseStudy!.delivered).toMatch(/\S/)
    }
  })

  it("never re-introduces YellowPad's disproven 'drafting' claim (spec §5)", () => {
    // The live product does structured extraction + citation, not drafting. The
    // résumé's case study for it was titled "Legal Drafting" and claimed agreements
    // were drafted — the same stale claim systems.ts already corrected. This guard
    // fails the build if any of YellowPad's copy ever says "draft" again.
    const yp = getBySlug('yellowpad')!
    const copy = [yp.summary, yp.caseStudy!.problem, yp.caseStudy!.decisions, yp.caseStudy!.delivered]
      .join(' ')
      .toLowerCase()
    expect(copy).not.toMatch(/draft/)
  })
})

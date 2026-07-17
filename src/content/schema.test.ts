import { describe, it, expect } from 'vitest'
import { SystemSchema, PRIVATE_HOSTS } from './schema'

const valid = {
  slug: 'aiva',
  name: 'AIVA Chat',
  domain: 'Voice AI',
  sector: 'Conversational AI' as const,
  region: 'US' as const,
  engagement: 'Client contract' as const,
  year: 2025,
  role: 'Architecture + led a small team',
  stack: ['Twilio', 'ElevenLabs', 'OpenAI'],
  summary: 'AI voice agents and embeddable chat widgets.',
  url: 'https://aivachat.io/',
  status: 'LIVE' as const,
  featured: true,
}

describe('SystemSchema', () => {
  /**
   * The fixture must be valid, and this must be the first thing asserted.
   *
   * Zod does not run `.refine()` once the base object parse fails. So if `valid`
   * ever drifts out of sync with the schema — a new required field is added and
   * not added here — every guard test below starts failing on "missing field"
   * without ever reaching the guard it claims to test. That is not hypothetical:
   * adding the `sector` field did exactly this, and the two tests that assert a
   * bare `.toThrow()` stayed GREEN throughout, because something did throw.
   *
   * A quieter version of that change leaves the UAT-link guard untested while the
   * suite reports success. This test is the tripwire for it.
   */
  it('the fixture itself is valid — guard tests below are worthless otherwise', () => {
    expect(() => SystemSchema.parse(valid)).not.toThrow()
  })

  it('accepts a well-formed system', () => {
    expect(SystemSchema.parse(valid)).toMatchObject({ slug: 'aiva' })
  })

  it('rejects a slug that is not url-safe', () => {
    // Asserts the MESSAGE, not a bare .toThrow(). A bare throw assertion passes
    // when the parse fails for an unrelated reason — see the fixture note above.
    expect(() => SystemSchema.parse({ ...valid, slug: 'AIVA Chat' })).toThrow(/slug/i)
  })

  it('rejects a url pointing at a known-private host', () => {
    const host = PRIVATE_HOSTS[0]
    expect(() =>
      SystemSchema.parse({ ...valid, url: `https://${host}/login` }),
    ).toThrow(/private/i)
  })

  it('rejects a PRIVATE system that carries a url', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, status: 'PRIVATE' }),
    ).toThrow(/PRIVATE/)
  })

  it('accepts a PRIVATE system with no url', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, url: undefined, status: 'PRIVATE' }),
    ).not.toThrow()
  })

  it('rejects a year before the 2018 anchor', () => {
    // Asserts the message so this can't pass because the fixture broke instead.
    expect(() => SystemSchema.parse({ ...valid, year: 2017 })).toThrow(/>=\s*2018/)
  })

  // --- Guard boundary. A trailing dot is the FQDN root label: the browser
  // resolves `host.` and `host` to the SAME server, so without normalisation
  // one keystroke defeats the guard entirely. `%2e` is the encoded form and
  // the URL parser decodes it into the same trailing dot.
  it('rejects a private host disguised with a trailing dot', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, url: `https://${PRIVATE_HOSTS[0]}./login` }),
    ).toThrow(/private/i)
  })

  it('rejects a private host disguised with a percent-encoded dot', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, url: `https://${PRIVATE_HOSTS[0]}%2e/login` }),
    ).toThrow(/private/i)
  })

  // The guard must be precise in BOTH directions — over-blocking would silently
  // drop legitimate client links, which is its own kind of failure.
  it('does not reject the legitimate apex domain', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, url: 'https://medicalofficeforce.co/' }),
    ).not.toThrow()
  })

  it('does not reject a different host that merely contains the private host', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, url: 'https://ai-uat.medicalofficeforce.co.attacker.io/' }),
    ).not.toThrow()
  })

  it('rejects a subdomain of a private host', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, url: `https://app.${PRIVATE_HOSTS[0]}/x` }),
    ).toThrow(/private/i)
  })

  /**
   * Anchored to the LITERAL host, deliberately not to `PRIVATE_HOSTS[0]`.
   *
   * Every other must-block test above derives its url from the constant, so they
   * all stay green if someone fat-fingers the constant itself — leaving the real
   * client link completely unguarded while the suite reports success. This test is
   * the only one that fails in that case. Do not "DRY" it up against the constant;
   * the duplication is the entire point.
   */
  it('rejects the real client UAT host, spelled out', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, url: 'https://ai-uat.medicalofficeforce.co/login' }),
    ).toThrow(/private/i)
  })
})

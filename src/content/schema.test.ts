import { describe, it, expect } from 'vitest'
import { SystemSchema, PRIVATE_HOSTS } from './schema'

const valid = {
  slug: 'aiva',
  name: 'AIVA Chat',
  domain: 'Voice AI',
  region: 'US' as const,
  year: 2025,
  role: 'Architecture + led a small team',
  stack: ['Twilio', 'ElevenLabs', 'OpenAI'],
  summary: 'AI voice agents and embeddable chat widgets.',
  url: 'https://aivachat.io/',
  status: 'LIVE' as const,
  featured: true,
}

describe('SystemSchema', () => {
  it('accepts a well-formed system', () => {
    expect(SystemSchema.parse(valid)).toMatchObject({ slug: 'aiva' })
  })

  it('rejects a slug that is not url-safe', () => {
    expect(() => SystemSchema.parse({ ...valid, slug: 'AIVA Chat' })).toThrow()
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
    const { url, ...rest } = valid
    expect(() =>
      SystemSchema.parse({ ...rest, status: 'PRIVATE' }),
    ).not.toThrow()
  })

  it('rejects a year before the 2018 anchor', () => {
    expect(() => SystemSchema.parse({ ...valid, year: 2017 })).toThrow()
  })
})

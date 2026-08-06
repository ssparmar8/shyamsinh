import { describe, it, expect } from 'vitest'
import {
  SITE_URL,
  canonicalPath,
  canonicalUrl,
  clampDescription,
  personJsonLd,
  webSiteJsonLd,
  breadcrumbJsonLd,
  systemJsonLd,
  collectionJsonLd,
  contactJsonLd,
  jsonLdScript,
  sectorsCovered,
  DESCRIPTION_MAX,
} from './seo'
import { SYSTEMS } from '@/content'
import { IDENTITY } from '@/content/identity'
import { PRIVATE_HOSTS } from '@/content/schema'

describe('canonical URLs', () => {
  /**
   * http would point every canonical at a URL that 301s to https — declaring that the
   * preferred address is one the server immediately redirects away from.
   */
  it('is https and carries no trailing slash', () => {
    expect(SITE_URL.startsWith('https://')).toBe(true)
    expect(SITE_URL.endsWith('/')).toBe(false)
  })

  it('gives the homepage the bare origin, matching what Next emits after normalisation', () => {
    expect(canonicalUrl('/')).toBe(SITE_URL)
    expect(canonicalUrl()).toBe(SITE_URL)
  })

  it('gives every other path exactly one trailing slash', () => {
    expect(canonicalUrl('/archive')).toBe(`${SITE_URL}/archive/`)
    expect(canonicalUrl('archive')).toBe(`${SITE_URL}/archive/`)
    expect(canonicalUrl('/archive/')).toBe(`${SITE_URL}/archive/`)
    expect(canonicalUrl('/systems/aiva')).toBe(`${SITE_URL}/systems/aiva/`)
  })

  it('never emits a doubled slash, whatever the caller passes', () => {
    for (const input of ['/', '//', '/archive//', '///systems//aiva//']) {
      expect(canonicalUrl(input)).not.toMatch(/([^:])\/\//)
    }
    expect(canonicalPath('//')).toBe('/')
  })
})

describe('descriptions', () => {
  it('leaves a description that already fits alone', () => {
    const text = 'A short description.'
    expect(clampDescription(text)).toBe(text)
  })

  /** A snippet cut mid-word reads as broken; the cut lands on a word boundary instead. */
  it('trims an over-long one at a word boundary', () => {
    const long = `${'word '.repeat(60)}end`
    const out = clampDescription(long)
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toMatch(/\s…$/) // no dangling space before the ellipsis
  })
})

describe('structured data', () => {
  it('describes the person, linked to the profiles that already carry reputation', () => {
    const person = personJsonLd()
    expect(person['@type']).toBe('Person')
    expect(person.name).toBe(IDENTITY.name)
    expect(person.url).toBe(SITE_URL)
    expect(person.sameAs).toEqual(IDENTITY.links.filter((l) => l.sameAs).map((l) => l.href))
  })

  /**
   * knowsAbout is derived from the archive's own sectors, so the site cannot claim a
   * specialism with no delivered project behind it.
   */
  it('claims only the sectors the archive actually contains', () => {
    const claimed = personJsonLd().knowsAbout as string[]
    const real = new Set(SYSTEMS.map((s) => s.sector))
    expect(claimed).toEqual(sectorsCovered())
    for (const sector of claimed) expect(real.has(sector as never)).toBe(true)
  })

  /** One identity, one site: every other page points at these @ids instead of restating them. */
  it('ties the website to the person by @id rather than duplicating them', () => {
    expect(webSiteJsonLd().publisher).toEqual({ '@id': `${SITE_URL}/#person` })
    expect(personJsonLd()['@id']).toBe(`${SITE_URL}/#person`)
  })

  it('numbers breadcrumb positions from 1, with absolute items', () => {
    const crumbs = breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Archive Index', path: '/archive' },
    ])
    const items = crumbs.itemListElement as Array<Record<string, unknown>>
    expect(items.map((i) => i.position)).toEqual([1, 2])
    expect(items[0].item).toBe(SITE_URL)
    expect(items[1].item).toBe(`${SITE_URL}/archive/`)
  })

  it('marks up every system, and the collection lists all of them', () => {
    for (const system of SYSTEMS) {
      const data = systemJsonLd(system)
      expect(data['@type']).toBe('CreativeWork')
      expect(data.url).toBe(canonicalUrl(`/systems/${system.slug}`))
      expect(data.creator).toEqual({ '@id': `${SITE_URL}/#person` })
    }
    const list = collectionJsonLd(
      SYSTEMS.map((s) => ({ name: s.name, slug: s.slug })),
      '/archive',
      'Archive Index',
      'desc',
    )
    const main = list.mainEntity as { numberOfItems: number }
    expect(main.numberOfItems).toBe(SYSTEMS.length)
  })

  /**
   * A PRIVATE system deliberately withholds its URL (see schema.ts's refinement). Structured
   * data is a second, easily-forgotten place that same URL could leak out of — `sameAs` is
   * published to crawlers just as loudly as an anchor tag would be.
   */
  it('never publishes a url for a system that has none, or a private client host', () => {
    const serialised = SYSTEMS.map((s) => JSON.stringify(systemJsonLd(s))).join(' ')
    for (const host of PRIVATE_HOSTS) expect(serialised).not.toContain(host)
    for (const system of SYSTEMS) {
      if (!system.url) expect(systemJsonLd(system)).not.toHaveProperty('sameAs')
      else expect(systemJsonLd(system).sameAs).toBe(system.url)
    }
  })

  it('exposes the contact channels the contact page renders', () => {
    const data = contactJsonLd()
    expect(data['@type']).toBe('ContactPage')
    expect(JSON.stringify(data)).toContain(IDENTITY.email)
  })
})

describe('jsonLdScript', () => {
  /**
   * A `<` inside the payload would otherwise let a value close the script tag early and inject
   * whatever followed. Nothing here is untrusted today — but this is the one function every
   * future block passes through, and JSON-LD is exactly where untrusted data ends up.
   */
  it('escapes < so a value cannot close the script tag', () => {
    const out = jsonLdScript({ name: '</script><img src=x onerror=alert(1)>' })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c')
    expect(JSON.parse(out).name).toBe('</script><img src=x onerror=alert(1)>')
  })

  it('round-trips real payloads as valid JSON', () => {
    for (const data of [personJsonLd(), webSiteJsonLd(), contactJsonLd()]) {
      expect(() => JSON.parse(jsonLdScript(data))).not.toThrow()
    }
  })
})

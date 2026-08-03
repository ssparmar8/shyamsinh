import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { IDENTITY, AVAILABILITY, availabilityLabel, yearsExperience, SITE_URL } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'
import { OG_IMAGE_ALT, OG_IMAGE_SIZE } from '@/lib/seo'

/**
 * The card a link to this site unfurls into — in search results, Slack, LinkedIn, X.
 *
 * Generated rather than drawn, so it can never drift from the site: the name, the title,
 * the pitch and all four figures are the same exports the hero renders (see Identity.tsx).
 * A hand-made PNG would still claim "7 YRS" a year from now.
 *
 * It runs at build time — `next build` prerenders it to a static PNG, which is what makes
 * it compatible with `output: 'export'` (see next.config.ts). Nothing here may touch a
 * request, or the export will fail rather than degrade.
 *
 * CONSTRAINTS, because this is satori and not a browser:
 *   - flexbox only. `display: grid` silently renders nothing.
 *   - any element with more than one child needs an explicit `display: flex`.
 *   - CSS custom properties do not resolve, so the palette below is duplicated from
 *     globals.css as literals. Change one, change both.
 *   - ttf/otf/woff only — never woff2, which is the format next/font already cached.
 */

// Duplicated from globals.css @theme; satori cannot read var(). GHOST stays decorative
// (brackets and rules) for the same contrast reason it does on the site — it fails AA
// as text, and an OG card is often viewed at a third of its rendered size.
const BG = '#e9e9e9'
const INK = '#2b2b2b'
const DIM = '#696969'
const GHOST = '#8d8d8d'
const RULE = 'rgba(0, 0, 0, 0.13)'

const FONT = 'Geist Mono'
const PAD = 72

/**
 * Required, not optional, under `output: export`. Metadata images compile to Route
 * Handlers, and Next refuses to export a route it has not been told is static — the build
 * fails outright with "export const dynamic = force-static ... not configured". It is also
 * the guard that keeps this file honest: reach for a request-time API here and the build
 * stops rather than quietly dropping the card.
 */
export const dynamic = 'force-static'

// Imported from lib/seo.ts, not declared here: the same alt and dimensions are published as
// og:image:alt / og:image:width on every route (see OG_IMAGE there). Two declarations would
// let the tags drift from the picture they describe.
export const alt = OG_IMAGE_ALT

export const size = OG_IMAGE_SIZE

export const contentType = 'image/png'

/** The hero's four figures, derived at build time exactly as the page derives them. */
const stats = () => [
  { value: String(yearsExperience()), label: 'YRS' },
  { value: String(countSystems()), label: 'SYSTEMS' },
  { value: String(countSectors()), label: 'SECTORS' },
  // countClientRegions(), NOT countRegions() — see src/content/index.ts. The wider count
  // includes his own base, and next to a system count it would read as delivered work.
  { value: String(countClientRegions()), label: 'CLIENT REGIONS' },
]

/**
 * The four viewport brackets, echoing CornerBracket.tsx at OG scale.
 *
 * Spelled out per corner rather than derived from the corner name, for the same reason
 * CornerBracket.tsx keeps an EDGES table: a computed style key defeats the CSSProperties
 * check, which is the only thing catching a typo in a file no test renders.
 */
const ARM = `1px solid ${GHOST}`
const INSET = 28
const BRACKETS: React.CSSProperties[] = [
  { top: INSET, left: INSET, borderTop: ARM, borderLeft: ARM },
  { top: INSET, right: INSET, borderTop: ARM, borderRight: ARM },
  { bottom: INSET, left: INSET, borderBottom: ARM, borderLeft: ARM },
  { bottom: INSET, right: INSET, borderBottom: ARM, borderRight: ARM },
]

export default async function Image() {
  // process.cwd() is the project root during `next build`. The file is committed rather
  // than fetched so the build stays offline-safe.
  const mono = await readFile(join(process.cwd(), 'src/app/fonts/GeistMono-Regular.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: BG,
          color: INK,
          fontFamily: FONT,
          padding: PAD,
        }}
      >
        {BRACKETS.map((edges, i) => (
          <div key={i} style={{ position: 'absolute', width: 26, height: 26, ...edges }} />
        ))}

        {/* Beat 02's label row, verbatim. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 15,
            letterSpacing: '0.2em',
            color: DIM,
          }}
        >
          {/* Braced string, not bare text: `<div>// IDENTITY</div>` trips
              react/jsx-no-comment-textnodes, which reads the slashes as a stray comment. */}
          <div>{'// IDENTITY'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: AVAILABILITY.open ? INK : GHOST,
              }}
            />
            <div>{availabilityLabel()}</div>
          </div>
        </div>

        <div
          style={{
            marginTop: 52,
            fontSize: 56,
            letterSpacing: '0.32em',
            color: INK,
          }}
        >
          {IDENTITY.name.toUpperCase()}
        </div>

        <div style={{ marginTop: 20, fontSize: 20, letterSpacing: '0.2em', color: INK }}>
          {IDENTITY.title.toUpperCase()}
        </div>

        {/* Prose, so it drops to near-zero tracking — 0.2em is a HUD-label setting and
            stops being readable at sentence length. Same reasoning as Identity.tsx. */}
        <div
          style={{
            marginTop: 28,
            maxWidth: 940,
            fontSize: 21,
            lineHeight: 1.55,
            letterSpacing: '0.01em',
            color: DIM,
          }}
        >
          {IDENTITY.pitch}
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            borderTop: `1px solid ${RULE}`,
            borderBottom: `1px solid ${RULE}`,
          }}
        >
          {stats().map((s) => (
            <div
              key={s.label}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 20, paddingBottom: 20 }}
            >
              <div style={{ fontSize: 34, letterSpacing: '0.2em', color: INK }}>{s.value}</div>
              <div style={{ marginTop: 8, fontSize: 13, letterSpacing: '0.2em', color: DIM }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            letterSpacing: '0.2em',
            color: DIM,
          }}
        >
          {/* One template string, not `{expr} · REMOTE`: that is two child nodes to satori,
              which then demands an explicit display on the wrapper and fails the build. */}
          <div>{`${IDENTITY.location.toUpperCase()} · REMOTE`}</div>
          <div>{SITE_URL.replace('https://', '')}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: FONT, data: mono, style: 'normal', weight: 400 }],
    }
  )
}

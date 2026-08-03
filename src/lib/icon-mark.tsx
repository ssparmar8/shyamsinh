import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * The site mark, rendered at whatever size the caller needs.
 *
 * One function rather than a copy in each icon route, because a favicon that disagrees with
 * the apple-touch icon is the kind of drift nobody notices until it is on someone's home
 * screen. icon.tsx and apple-icon.tsx are both thin wrappers around this.
 *
 * The mark is a monospace "S" knocked out of an ink tile — the site's palette inverted. It
 * is inverted deliberately: the site's own ground (#e9e9e9) is almost exactly the colour of
 * a light browser tab strip, so a light-ground favicon dissolves into the chrome at 16px.
 * Dark tile, light glyph reads in both light and dark browser themes.
 *
 * No corner brackets, no wordmark: at 16px — which is the size that actually matters — a
 * second element turns the whole thing to mush. The typeface carries the brand.
 *
 * Same satori constraints as opengraph-image.tsx: flexbox only, no CSS variables, ttf/otf
 * only for fonts.
 */

const INK = '#2b2b2b'
const PAPER = '#e9e9e9'
const FONT = 'Geist Mono'

export async function renderIconMark(size: number): Promise<ImageResponse> {
  const mono = await readFile(join(process.cwd(), 'src/app/fonts/GeistMono-Regular.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: INK,
          color: PAPER,
          fontFamily: FONT,
          // ~0.19 of the edge is the squircle ratio iOS uses. Harmless where the platform
          // applies its own mask, and stops the tile reading as a hard square everywhere else.
          borderRadius: Math.round(size * 0.19),
          // 0.8 of the edge, which puts the cap-height at ~56% of the tile. Sized up from a
          // more conservative 0.66 after looking at the 32px render: Geist Mono is a light
          // face, and at tab-strip size its stems thin out to nothing. Scaling the glyph
          // scales the stems with it, which buys the weight back without a second font file.
          fontSize: Math.round(size * 0.8),
          lineHeight: 1,
          // Optical, not metric: Geist Mono's cap-height sits high in the em box, so a
          // mathematically centred glyph looks like it is falling out of the top of the tile.
          paddingBottom: Math.round(size * 0.04),
        }}
      >
        S
      </div>
    ),
    { width: size, height: size, fonts: [{ name: FONT, data: mono, style: 'normal', weight: 400 }] }
  )
}

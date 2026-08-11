import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Required by `output: 'export'`: a generated-image route is a Route Handler, and the export
 * build refuses to guess whether one is static. Without it the build fails outright rather
 * than silently shipping no image.
 */
export const dynamic = 'force-static'

/**
 * The tab icon: the site's block caret on its paper grey, which is the one mark the whole
 * design is built from. Generated so it stays in step with the palette rather than being a
 * binary nobody can edit. `favicon.ico` remains for browsers that ask for it by that name.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e9e9e9',
        }}
      >
        <div style={{ display: 'flex', width: 10, height: 18, background: '#2b2b2b' }} />
      </div>
    ),
    size,
  )
}

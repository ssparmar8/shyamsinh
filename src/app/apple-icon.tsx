import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Required by `output: 'export'`: a generated-image route is a Route Handler, and the export
 * build refuses to guess whether one is static. Without it the build fails outright rather
 * than silently shipping no image.
 */
export const dynamic = 'force-static'

/**
 * The home-screen icon. Bigger canvas, so it carries the initials as well as the caret —
 * at 180px a lone block would read as a rendering error rather than a mark.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e9e9e9',
          color: '#2b2b2b',
        }}
      >
        <div style={{ display: 'flex', fontSize: 72, letterSpacing: 2 }}>SP</div>
        <div style={{ display: 'flex', width: 56, height: 6, background: '#2b2b2b', marginTop: 12 }} />
      </div>
    ),
    size,
  )
}

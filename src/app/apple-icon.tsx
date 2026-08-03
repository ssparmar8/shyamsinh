import { renderIconMark } from '@/lib/icon-mark'

// Required under `output: 'export'` — see the same const in opengraph-image.tsx.
export const dynamic = 'force-static'

// 180x180 is the size iOS asks for on a @3x home screen; it downsamples cleanly to the
// smaller slots. The tile is deliberately opaque — iOS composites apple-touch icons onto
// black, so any transparency here would show up as a dark halo on a home screen.
export const size = { width: 180, height: 180 }

export const contentType = 'image/png'

export default function AppleIcon() {
  return renderIconMark(size.width)
}

import { renderIconMark } from '@/lib/icon-mark'

// Required under `output: 'export'` — see the same const in opengraph-image.tsx.
export const dynamic = 'force-static'

// 32px, not 16: browsers downscale for the tab strip but reach for the larger source on
// retina displays and in bookmark/history lists.
export const size = { width: 32, height: 32 }

export const contentType = 'image/png'

export default function Icon() {
  return renderIconMark(size.width)
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*<>/#$%&_'

/**
 * How fast unsettled glyphs churn as progress advances.
 *
 * Roughly this many distinct noise states across a full 0 → 1 decode. At ~60fps
 * over a ~1s animation that lands near one change per frame, which reads as
 * shimmer rather than strobe. Tuning this changes the texture of the effect, not
 * its correctness.
 */
const SHIMMER = 97

/**
 * Deterministic PRNG.
 *
 * Determinism is a requirement, not an accident: the decode is scroll-driven, so
 * the same scroll position must always produce the same frame. Otherwise the noise
 * jumps every time the user scrolls back a pixel.
 *
 * The `+ 1` offset matters. `Math.sin(0)` is exactly 0, so without it the first
 * glyph of a default-seed string is deterministically 'A' on every run.
 */
const rand = (n: number): number => {
  const x = Math.sin((n + 1) * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/**
 * One frame of the decode effect.
 *
 * Characters resolve left to right: at progress `p`, the first `p * length`
 * characters are settled and the rest are glyph noise. Spaces never scramble —
 * they hold the word shape steady so the layout doesn't jitter.
 *
 * @param target   the final string
 * @param progress 0 = fully scrambled, 1 = fully resolved. Clamped; a non-finite
 *                 value is treated as 0.
 * @param seed     varies the noise between instances. Same (target, progress, seed)
 *                 always yields the same output.
 */
export const scrambleFrame = (target: string, progress: number, seed = 0): string => {
  // Non-finite progress is pinned to 0 rather than left to propagate. A caller
  // computing `elapsed / duration` hands us NaN whenever duration is 0, and NaN
  // flows silently through Math.min/max, through the hash, and out of GLYPHS[NaN]
  // as the literal string "undefined".
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
  const settled = Math.floor(target.length * p)

  let out = ''
  for (let i = 0; i < target.length; i++) {
    const ch = target[i]
    if (i < settled || ch === ' ') {
      out += ch
    } else {
      // `p` is in the hash, not just in the reveal boundary. Without it the noise
      // is a STATIC mask that gets eaten left to right: every unsettled position
      // shows one glyph for the entire animation, which reads as dead rather than
      // decoding. Measured before this was added — index 8 of a 9-character string
      // showed exactly one distinct glyph across 31 frames.
      const g = Math.floor(rand(seed + i * 7.13 + p * SHIMMER) * GLYPHS.length)
      out += GLYPHS[g]
    }
  }
  return out
}

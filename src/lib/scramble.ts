const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*<>/#$%&_'

/** Deterministic PRNG — animation must be reproducible for tests and for resume-on-scroll. */
const rand = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/**
 * One frame of the decode effect.
 *
 * Characters resolve left to right: at progress p, the first p*length characters
 * are settled and the rest are glyph noise. Spaces never scramble — they hold the
 * word shape steady so the layout doesn't jitter.
 *
 * @param target   the final string
 * @param progress 0 = fully scrambled, 1 = fully resolved (clamped)
 * @param seed     varies the noise; same seed + same progress = same output
 */
export const scrambleFrame = (target: string, progress: number, seed = 0): string => {
  const p = Math.min(1, Math.max(0, progress))
  const settled = Math.floor(target.length * p)

  let out = ''
  for (let i = 0; i < target.length; i++) {
    const ch = target[i]
    if (i < settled || ch === ' ') {
      out += ch
    } else {
      const g = Math.floor(rand(seed + i * 7.13) * GLYPHS.length)
      out += GLYPHS[g]
    }
  }
  return out
}

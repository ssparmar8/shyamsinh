export type Particle = { x: number; y: number; vx: number; vy: number }

// Deterministic PRNG so a given seed reproduces a field — matters for tests and
// for not reshuffling the whole constellation on every resize.
const rng = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const SPEED = 0.012 // px per ms — a slow drift, not a swarm

export function createField(count: number, w: number, h: number, seed = 1): Particle[] {
  const r = rng(seed)
  return Array.from({ length: count }, () => ({
    x: r() * w,
    y: r() * h,
    vx: (r() - 0.5) * SPEED,
    vy: (r() - 0.5) * SPEED,
  }))
}

/** Advance by dt ms. Particles bounce off the edges so the field stays populated. */
export function stepField(f: Particle[], w: number, h: number, dt: number): void {
  for (const p of f) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.x <= 0 || p.x >= w) { p.vx *= -1; p.x = Math.min(w, Math.max(0, p.x)) }
    if (p.y <= 0 || p.y >= h) { p.vy *= -1; p.y = Math.min(h, Math.max(0, p.y)) }
  }
}

/** Index pairs closer than `dist`. O(n²) — the tier budget keeps n small on purpose. */
export function nearLinks(f: Particle[], dist: number): Array<[number, number]> {
  const d2 = dist * dist
  const out: Array<[number, number]> = []
  for (let i = 0; i < f.length; i++) {
    for (let j = i + 1; j < f.length; j++) {
      const dx = f[i].x - f[j].x
      const dy = f[i].y - f[j].y
      if (dx * dx + dy * dy <= d2) out.push([i, j])
    }
  }
  return out
}

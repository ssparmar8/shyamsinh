export type SceneMode = 'static' | 'reveal' | 'scrub'

/**
 * Which motion treatment a Scene gets. Ordered by guardrail priority:
 * reduced motion → no motion at all; touch/narrow → today's one-shot reveal;
 * otherwise the full pinned scrub. Pure so it's testable without a browser.
 */
export function pickSceneMode(reduced: boolean, coarseOrNarrow: boolean): SceneMode {
  if (reduced) return 'static'
  if (coarseOrNarrow) return 'reveal'
  return 'scrub'
}

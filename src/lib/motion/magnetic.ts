/**
 * Pure: how far to pull an element toward the cursor. Zero at the element center, a
 * `strength` fraction of the offset otherwise, capped at ±`max` px per axis so a distant
 * cursor can't fling the element. No DOM, no deps — unit-testable and safe on any route.
 */
export function magneticOffset(
  cursorX: number,
  cursorY: number,
  rect: { left: number; top: number; width: number; height: number },
  strength: number,
  max: number,
): { x: number; y: number } {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const clamp = (v: number) => Math.max(-max, Math.min(max, v))
  return { x: clamp((cursorX - cx) * strength), y: clamp((cursorY - cy) * strength) }
}

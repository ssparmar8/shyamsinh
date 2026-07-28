import { describe, it, expect, vi } from 'vitest'

const fromTo = vi.fn().mockReturnThis()
const to = vi.fn().mockReturnThis()
vi.mock('gsap', () => ({ gsap: { timeline: vi.fn(() => ({ fromTo, to, kill: vi.fn() })) } }))

import { buildSceneTimeline, holdLift } from './buildSceneTimeline'
import type { LayerReg } from '@/components/motion/SceneContext'

function el(): HTMLElement {
  return document.createElement('div')
}

describe('buildSceneTimeline', () => {
  it('with no layers, animates the root itself (default reveal)', () => {
    fromTo.mockClear()
    const root = el()
    buildSceneTimeline(root, [])
    expect(fromTo).toHaveBeenCalledWith(root, expect.anything(), expect.anything())
  })

  it('decode layer writes scrambleFrame into the element via onUpdate', () => {
    to.mockClear()
    const node = el()
    const layer: LayerReg = { el: node, kind: 'decode', text: 'HELLO', seed: 1 }
    buildSceneTimeline(el(), [layer])
    const call = to.mock.calls.find((c) => c[1] && typeof c[1].onUpdate === 'function')
    expect(call).toBeTruthy()
    // proxy is the first arg; simulate GSAP setting p=1 before onUpdate
    const proxy = call![0] as { p: number }
    const vars = call![1] as { onUpdate: () => void }
    proxy.p = 1
    vars.onUpdate()
    expect(node.textContent).toBe('HELLO')
  })

  it('mask layer animates clip-path on the element', () => {
    fromTo.mockClear()
    const node = el()
    const layer: LayerReg = { el: node, kind: 'mask' }
    buildSceneTimeline(el(), [layer])
    const call = fromTo.mock.calls.find((c) => c[0] === node)
    expect(call).toBeTruthy()
    expect(call![1]).toHaveProperty('clipPath')
  })

  /**
   * Scroll must never dim anything. Text animated between two alphas is legible-but-washed
   * for the whole tween, and under a scrub that is most of the time a beat is on screen — it
   * reads as blurred text rather than as motion. Movement and clipping only, in every kind.
   */
  it('animates no opacity in any layer kind', () => {
    fromTo.mockClear()
    to.mockClear()
    const kinds: LayerReg[] = [
      { el: el(), kind: 'rise' },
      { el: el(), kind: 'mask' },
      { el: el(), kind: 'decode', text: 'X' },
    ]
    buildSceneTimeline(el(), kinds)
    buildSceneTimeline(el(), []) // the un-annotated-beat default, too
    const vars = [...fromTo.mock.calls, ...to.mock.calls].flatMap((c) => c.slice(1, 3))
    expect(vars.length).toBeGreaterThan(0)
    for (const v of vars) {
      expect(v).not.toHaveProperty('autoAlpha')
      expect(v).not.toHaveProperty('opacity')
    }
  })
})

describe('holdLift', () => {
  it('is a no-op for the first 80% of the pin', () => {
    expect(holdLift(0)).toEqual({ y: 0 })
    expect(holdLift(0.8)).toEqual({ y: 0 })
  })

  it('lifts 16px by the end of the pin, without touching alpha', () => {
    expect(holdLift(1)).toEqual({ y: -16 })
    expect(holdLift(0.9).y).toBeCloseTo(-8) // halfway through the tail
  })
})

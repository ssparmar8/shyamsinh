import { describe, it, expect, vi } from 'vitest'

const fromTo = vi.fn().mockReturnThis()
const to = vi.fn().mockReturnThis()
vi.mock('gsap', () => ({ gsap: { timeline: vi.fn(() => ({ fromTo, to, kill: vi.fn() })) } }))

import { buildSceneTimeline, holdFade } from './buildSceneTimeline'
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
})

describe('holdFade', () => {
  it('is a no-op for the first 80% of the pin', () => {
    expect(holdFade(0)).toEqual({ alpha: 1, y: 0 })
    expect(holdFade(0.8)).toEqual({ alpha: 1, y: 0 })
  })

  it('fades toward 0.5 alpha and lifts 16px by the end of the pin', () => {
    expect(holdFade(1)).toEqual({ alpha: 0.5, y: -16 })
    const mid = holdFade(0.9) // halfway through the tail
    expect(mid.alpha).toBeCloseTo(0.75)
    expect(mid.y).toBeCloseTo(-8)
  })
})

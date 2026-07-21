import { describe, it, expect } from 'vitest'
import { pickSceneMode } from './sceneMode'

describe('pickSceneMode', () => {
  it('reduced motion wins over everything → static', () => {
    expect(pickSceneMode(true, false)).toBe('static')
    expect(pickSceneMode(true, true)).toBe('static')
  })
  it('touch/narrow but not reduced → reveal', () => {
    expect(pickSceneMode(false, true)).toBe('reveal')
  })
  it('pointer + wide + not reduced → scrub', () => {
    expect(pickSceneMode(false, false)).toBe('scrub')
  })
})

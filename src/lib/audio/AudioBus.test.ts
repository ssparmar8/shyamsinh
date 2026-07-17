import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioBus } from './AudioBus'

class FakeOsc {
  frequency = { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  type = ''
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}
class FakeGain {
  gain = { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }
  connect = vi.fn()
}
class FakeCtx {
  currentTime = 0
  destination = {}
  state = 'running'
  createOscillator = vi.fn(() => new FakeOsc())
  createGain = vi.fn(() => new FakeGain())
  resume = vi.fn()
  close = vi.fn()
}

let ctx: FakeCtx
beforeEach(() => {
  ctx = new FakeCtx()
  // NOTE: must be a `function` expression, not an arrow function. AudioBus.ts
  // constructs the context with `new Ctor()`, and Vitest 4's mock functions
  // reject `new` on an arrow-function implementation with
  // `TypeError: ... is not a constructor` (arrow functions have no
  // [[Construct]], and Vitest does not paper over that). That throw was
  // getting silently swallowed by AudioBus's own try/catch, which made
  // `createOscillator` look like it was never called — failing the very next
  // test — and, more subtly, made the "constructor that throws" test below
  // pass for the wrong reason (it never reached its own thrown "blocked"
  // Error; it hit this same "is not a constructor" TypeError instead, which
  // the test's `not.toThrow()` assertion couldn't tell apart from the real
  // thing). Verified empirically before changing this.
  vi.stubGlobal('AudioContext', vi.fn(function () { return ctx }))
  AudioBus.reset()
})

describe('AudioBus', () => {
  it('creates no AudioContext until enabled', () => {
    AudioBus.play('click')
    expect(AudioContext).not.toHaveBeenCalled()
  })

  it('plays a tone once enabled', () => {
    AudioBus.enable()
    AudioBus.play('click')
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  /** Muted must be a true no-op, not a zero-volume tone — no context, no cost. */
  it('is a no-op when disabled', () => {
    AudioBus.enable()
    AudioBus.disable()
    ctx.createOscillator.mockClear()
    AudioBus.play('click')
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('survives an AudioContext constructor that throws', () => {
    // Same function-vs-arrow requirement as above — see the beforeEach note.
    vi.stubGlobal('AudioContext', vi.fn(function () { throw new Error('blocked') }))
    AudioBus.reset()
    expect(() => { AudioBus.enable(); AudioBus.play('click') }).not.toThrow()
  })

  it('survives a browser with no AudioContext at all', () => {
    vi.stubGlobal('AudioContext', undefined)
    AudioBus.reset()
    expect(() => { AudioBus.enable(); AudioBus.play('boot') }).not.toThrow()
  })

  it('reports its enabled state', () => {
    expect(AudioBus.isEnabled()).toBe(false)
    AudioBus.enable()
    expect(AudioBus.isEnabled()).toBe(true)
  })

  /**
   * The gate promises "NO AMBIENT LOOP". Make that structurally true rather than a
   * matter of discipline: every voice must be a short one-shot with a stop time.
   * A looping oscillator would make the gate's own copy a lie.
   */
  it('always schedules a stop — no sound can loop', () => {
    AudioBus.enable()
    const osc = new FakeOsc()
    ctx.createOscillator.mockReturnValueOnce(osc as never)
    AudioBus.play('boot')
    expect(osc.stop).toHaveBeenCalled()
  })
})

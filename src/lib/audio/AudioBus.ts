type Sound = 'click' | 'decode' | 'boot' | 'complete'

/** Short, dry, machine-ish. Deliberately not musical. */
const VOICES: Record<Sound, { freq: number; to: number; ms: number; type: OscillatorType; gain: number }> = {
  click:    { freq: 880,  to: 660,  ms: 45,  type: 'square',   gain: 0.035 },
  decode:   { freq: 1400, to: 1400, ms: 18,  type: 'square',   gain: 0.012 },
  boot:     { freq: 220,  to: 440,  ms: 260, type: 'sawtooth', gain: 0.03 },
  complete: { freq: 520,  to: 1040, ms: 180, type: 'triangle', gain: 0.04 },
}

/**
 * Synthesized SFX. No audio files exist in this project and none should.
 *
 * Muted is a genuine no-op: no AudioContext is constructed at all, so a visitor
 * who chose OFF pays nothing — not a download, not a suspended context. That is
 * also why the gate's "NO AMBIENT LOOP" claim is true by construction rather than
 * by discipline: there is no loop to forget to stop.
 *
 * Every browser call is wrapped. Audio is decoration; a browser that blocks or
 * lacks the API must degrade to silence, never to a broken page.
 */
class Bus {
  private ctx: AudioContext | null = null
  private enabled = false

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
    try {
      this.ctx?.close()
    } catch {
      /* already closed */
    }
    this.ctx = null
  }

  isEnabled() {
    return this.enabled
  }

  /** Test seam. Not for production use. */
  reset() {
    this.enabled = false
    this.ctx = null
  }

  private context(): AudioContext | null {
    if (!this.enabled) return null
    if (this.ctx) return this.ctx
    try {
      const Ctor = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      return this.ctx
    } catch {
      return null
    }
  }

  play(sound: Sound) {
    const ctx = this.context()
    if (!ctx) return
    try {
      if (ctx.state === 'suspended') void ctx.resume()
      const v = VOICES[sound]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const now = ctx.currentTime
      const dur = v.ms / 1000

      osc.type = v.type
      osc.frequency.setValueAtTime(v.freq, now)
      if (v.to !== v.freq) osc.frequency.exponentialRampToValueAtTime(v.to, now + dur)

      gain.gain.setValueAtTime(v.gain, now)
      // Ramp to near-zero, not zero: exponentialRamp to 0 is a no-op in spec.
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + dur)
    } catch {
      /* audio is decoration — never break the page for it */
    }
  }
}

export const AudioBus = new Bus()
export type { Sound }

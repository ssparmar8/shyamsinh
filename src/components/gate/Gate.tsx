'use client'

import { useAudio } from '@/lib/audio/useAudio'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * The audio consent prompt. Mirrors the reference site's opening move: it tells the
 * visitor this is a system before it tells them anything else.
 *
 * OFF is a first-class path, not a penalty — nothing is gated behind audio. The
 * "NO AMBIENT LOOP" claim is literally true: AudioBus only ever plays short SFX,
 * and when disabled it constructs no AudioContext at all.
 */
export function Gate({ onChoose }: { onChoose: (audioOn: boolean) => void }) {
  const { setEnabled, play } = useAudio()

  const choose = (on: boolean) => {
    setEnabled(on)
    if (on) play('click')
    onChoose(on)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Audio output routing"
      className="hud-grid fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-bg)]"
    >
      <div className={LABEL}>{'// AUDIO · RX'}</div>
      <h2 className="mt-3 font-mono text-sm tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-base">
        OUTPUT ROUTING
      </h2>
      <p className={`${LABEL} mt-3 px-6 text-center`}>
        SELECT CHANNEL STATE TO INITIALIZE INTERFACE
      </p>
      <p className={`${LABEL} mt-1 px-6 text-center`}>
        SCOPE: SFX · NO AMBIENT LOOP
      </p>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => choose(true)}
          className="border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-2 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
        >
          ◂ ON
        </button>
        <button
          type="button"
          onClick={() => choose(false)}
          className="border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-2 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
        >
          ◂ OFF
        </button>
      </div>
    </div>
  )
}

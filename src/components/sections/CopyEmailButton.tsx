'use client'

import { useState } from 'react'
import { AudioBus } from '@/lib/audio/AudioBus'

/**
 * The only part of the UPLINK beat that needs the browser (clipboard, audio, click state).
 * Split out so Uplink itself can stay a server component: a 'use client' Uplink pulled
 * '@/content/identity' -> schema.ts (and PRIVATE_HOSTS) into the browser bundle, which
 * check-no-private-hosts.mjs exists to catch. Takes the email as a plain string prop —
 * never re-import '@/content' here.
 */
export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    void navigator.clipboard.writeText(email)
    setCopied(true)
    if (AudioBus.isEnabled()) AudioBus.play('click')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopyEmail}
      className="hud-pill-hover cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-panel)]/80 px-2.5 py-1 font-mono text-[9px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] transition-all"
    >
      {copied ? '✓ COPIED' : '⎘ COPY'}
    </button>
  )
}

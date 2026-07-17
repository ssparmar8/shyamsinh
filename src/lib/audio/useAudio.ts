'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { AudioBus, type Sound } from './AudioBus'

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function useAudio() {
  const enabled = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => AudioBus.isEnabled(),
    () => false, // server snapshot — audio is never on during SSR
  )

  const setEnabled = useCallback((on: boolean) => {
    if (on) AudioBus.enable()
    else AudioBus.disable()
    emit()
  }, [])

  const play = useCallback((s: Sound) => AudioBus.play(s), [])

  return { enabled, setEnabled, play }
}

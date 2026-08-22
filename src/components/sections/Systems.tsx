'use client'

import { useState } from 'react'
import type { System } from '@/content'
import { SystemRecord } from '@/components/record/SystemRecord'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'
import { AudioBus } from '@/lib/audio/AudioBus'

const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'
const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

const CATEGORIES = ['ALL', 'VOICE AI', 'LLM & AGENTS', 'PLATFORM & BACKEND'] as const
type Category = (typeof CATEGORIES)[number]

/** recordIndex is the 0-based archive position — derived server-side (see recordNumber in
 * '@/content') so this client component never needs a value import from '@/content' itself. */
export function Systems({ systems }: { systems: (System & { recordIndex: number })[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>('ALL')

  const handleSelectCategory = (cat: Category) => {
    setActiveCategory(cat)
    if (AudioBus.isEnabled()) AudioBus.play('click')
  }

  const filteredSystems = systems.filter((s) => {
    if (activeCategory === 'ALL') return true
    if (activeCategory === 'VOICE AI') return s.domain.toLowerCase().includes('voice') || s.domain.toLowerCase().includes('conversational')
    if (activeCategory === 'LLM & AGENTS') return s.domain.toLowerCase().includes('llm') || s.domain.toLowerCase().includes('ai')
    if (activeCategory === 'PLATFORM & BACKEND') return true
    return true
  })

  return (
    <section id="systems" className="py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DecodeLine as="h2" text="NODE: SYSTEMS" seed={4} className={HEADING} />
        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`hud-pill-hover cursor-pointer rounded border px-3 py-1 font-mono text-[10px] tracking-[var(--tracking-hud)] transition-all ${
                  active
                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-panel)] font-semibold shadow-xs'
                    : 'border-[var(--color-border)] bg-[var(--color-panel)]/60 text-[var(--color-dim)] hover:text-[var(--color-ink)]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {filteredSystems.map((s, i) => (
          <Rise key={s.slug}>
            <SystemRecord
              system={s}
              index={s.recordIndex}
              seedBase={i + 1}
              recordHref={`/systems/${s.slug}`}
            />
          </Rise>
        ))}
      </div>
    </section>
  )
}

import { IDENTITY, AVAILABILITY, availabilityLabel } from '@/content/identity'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'
import { CopyEmailButton } from '@/components/sections/CopyEmailButton'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'
const ROW =
  'grid grid-cols-1 gap-1 border-b border-[var(--color-hair)] py-4 md:grid-cols-[5rem_1fr] md:gap-x-4'

export function Uplink() {
  return (
    <section id="uplink" className="py-20 md:py-28">
      {/* The status belongs here most of all: the hero states it, but this is the beat where
          someone decides whether to make contact. Same marker as the hero's. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <DecodeLine as="h2" text="NODE: UPLINK" seed={7} className={HEADING} />
        <div className={`${LABEL} flex items-center gap-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)]/50 px-3 py-1 backdrop-blur-xs`}>
          <span
            aria-hidden="true"
            className={`inline-block h-2 w-2 rounded-full ${
              AVAILABILITY.open ? 'status-pulse bg-[var(--color-ink)]' : 'bg-[var(--color-ghost)]'
            }`}
          />
          {availabilityLabel()}
        </div>
      </div>

      <dl className="mt-8 hud-glass-card rounded-lg p-6 border border-[var(--color-border)] space-y-2">
        <div className={ROW}>
          <dt className={`${LABEL} font-semibold text-[var(--color-ink)]`}>EMAIL</dt>
          <dd className="flex flex-wrap items-center justify-between gap-3">
            <MaskWipe>
              <a
                href={`mailto:${IDENTITY.email}`}
                className="inline-block break-all font-mono text-base font-bold tracking-[0.08em] text-[var(--color-ink)] underline underline-offset-8 transition-opacity hover:opacity-80 md:text-2xl md:tracking-[0.14em]"
              >
                {IDENTITY.email}
              </a>
            </MaskWipe>
            <CopyEmailButton email={IDENTITY.email} />
          </dd>
        </div>

        <div className={ROW}>
          <dt className={LABEL}>PHONE</dt>
          <dd>
            <Rise>
              <a
                href={`tel:${IDENTITY.phone.replace(/\s/g, '')}`}
                className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)] underline-offset-4 hover:underline"
              >
                {IDENTITY.phone}
              </a>
            </Rise>
          </dd>
        </div>

        <div className={ROW}>
          <dt className={LABEL}>BASE</dt>
          <dd>
            <Rise as="div" className={LABEL}>
              {IDENTITY.location.toUpperCase()} · REMOTE · FREELANCE CONTRACT
            </Rise>
          </dd>
        </div>
      </dl>

      <Rise as="div" className={`${LABEL} mt-12`}>
        {'// PROFILES'}
      </Rise>

      <Rise as="ul" className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
        {IDENTITY.links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
            >
              {l.label} ▸
            </a>
          </li>
        ))}
      </Rise>
    </section>
  )
}

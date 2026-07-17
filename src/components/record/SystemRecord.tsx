import type { System } from '@/content/schema'
import { ScrambleText } from '@/components/text/ScrambleText'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export function SystemRecord({ system, index }: { system: System; index: number }) {
  const num = String(index + 1).padStart(2, '0')
  const host = system.url ? new URL(system.url).hostname.replace(/^www\./, '') : null

  return (
    <article className="relative border border-[var(--color-border)] bg-[var(--color-panel)]/60 px-7 py-7 md:px-8">
      <div className={LABEL}>RECORD {num}</div>

      <ScrambleText
        as="h2"
        text={system.name}
        className="mt-3 font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]"
      />

      <dl className="mt-5 space-y-1">
        <div className="flex gap-3">
          <dt className={LABEL}>DOMAIN</dt>
          <dd className={LABEL}>{system.domain} · {system.region}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={LABEL}>ROLE</dt>
          <dd className={LABEL}>{system.role}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={LABEL}>YEAR</dt>
          <dd className={LABEL}>{system.year}</dd>
        </div>
      </dl>

      <p className="mt-5 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]">
        {system.summary}
      </p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {system.stack.map((t) => (
          <li
            key={t}
            className="border border-[var(--color-border)] px-2 py-1 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]"
          >
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {system.url && host ? (
          <a
            href={system.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-ink)] underline underline-offset-4"
          >
            ▸ {host}
          </a>
        ) : (
          <span className={LABEL}>STATUS: PRIVATE · NOT PUBLICLY LINKABLE</span>
        )}
      </div>
    </article>
  )
}

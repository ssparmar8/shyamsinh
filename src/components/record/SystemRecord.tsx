import type { System } from '@/content/schema'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
import { TypeOut } from '@/components/text/TypeOut'
import { MagneticLink } from '@/components/motion/MagneticLink'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const NAME = 'mt-3 font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'
const SUMMARY = 'mt-5 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]'

export function SystemRecord({
  system,
  index,
  seedBase = 0,
  animate = true,
  recordHref,
  headingLevel = 2,
}: {
  system: System
  index: number
  /** Varies the decode noise between records so adjacent ones don't shimmer in sync. */
  seedBase?: number
  /**
   * Whether the name/domain decode and the summary types out. The home scroll wants
   * the motion; the addressable `/systems/[slug]` route is spec'd "fast, static"
   * (design §8), so it renders this plain — the same end state reduced motion gets,
   * but forced regardless of the visitor's motion preference.
   */
  animate?: boolean
  /**
   * Where this record's own page lives. Omitted on `/systems/[slug]` itself — that page IS
   * the record, and a card linking to the page it is already on is a dead control.
   */
  recordHref?: string
  /**
   * The heading level the record's name renders at. Defaults to 2, because the home page
   * stacks six of these under the `NODE: SYSTEMS` h2 and a card is a subsection there.
   *
   * `/systems/[slug]` passes 1: on that route the record IS the page, and it shipped with
   * no h1 at all — 18 pages, the most specific content on the site, each headless. This is
   * a prop rather than a hardcoded h1 precisely because the same component renders in both
   * places; promoting it unconditionally would give the home page six h1 elements, which is
   * a worse document outline than the one it replaced.
   */
  headingLevel?: 1 | 2
}) {
  // `const` and capitalised so JSX reads it as a component rather than the literal tag <Heading>.
  const Heading = `h${headingLevel}` as const
  const num = String(index + 1).padStart(2, '0')
  const host = system.url ? new URL(system.url).hostname.replace(/^www\./, '') : null
  const domainText = `${system.domain} · ${system.region}`

  return (
    <article className="relative border border-[var(--color-border)] bg-[var(--color-panel)]/60 px-7 py-7 md:px-8">
      {/*
        `status` was carried on every record in the data and rendered nowhere but the private
        systems' footer line, so a LIVE system said nothing about being live. Paired with the
        record number it also gives the card a header rather than a lone dangling label.

        The marker is a CSS pseudo-element, NOT a <span aria-hidden>: a reduced-motion e2e
        asserts a record contains zero aria-hidden nodes, which is how "no decode noise layer"
        is detected. A decorative dot in the DOM would make a real regression there
        indistinguishable from a bullet.
      */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className={LABEL}>RECORD {num}</div>
        <div
          className={`${LABEL} status-mark ${
            system.status === 'LIVE' ? 'text-[var(--color-ink)]' : 'status-mark-hollow'
          }`}
        >
          {system.status}
        </div>
      </div>

      {animate ? (
        <ScrambleTextAnimated
          as={Heading}
          text={system.name}
          seed={seedBase * 10 + 1}
          className={NAME}
        />
      ) : (
        <Heading className={NAME}>{system.name}</Heading>
      )}

      {/*
        A grid with a fixed label column, not flex rows: the whole conceit is a
        machine-tabulated record, and ragged columns read as sloppy. Values align
        because the column is declared, not because the labels happen to be a
        similar length.
      */}
      <dl className="mt-5 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1">
        <dt className={LABEL}>DOMAIN</dt>
        <dd className={LABEL}>
          {animate ? (
            <ScrambleTextAnimated text={domainText} seed={seedBase * 10 + 2} />
          ) : (
            domainText
          )}
        </dd>

        <dt className={LABEL}>ROLE</dt>
        <dd className={LABEL}>{system.role}</dd>

        <dt className={LABEL}>YEAR</dt>
        <dd className={LABEL}>{system.year}</dd>
      </dl>

      {animate ? (
        <TypeOut as="p" text={system.summary} className={SUMMARY} />
      ) : (
        <p className={SUMMARY}>{system.summary}</p>
      )}

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

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
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
          // The header chip already says PRIVATE; this says why there is nothing to click.
          <span className={LABEL}>NOT PUBLICLY LINKABLE</span>
        )}
        {/*
          The case study (problem → decisions → delivered) lives only on the record page, and
          the home scroll had no route to it: the archive rows below linked to their records
          while the six FEATURED systems — the strongest work on the site — did not.
        */}
        {recordHref && (
          <MagneticLink
            href={recordHref}
            text="▸ OPEN RECORD"
            className={`${LABEL} hover:text-[var(--color-ink)]`}
          />
        )}
      </div>
    </article>
  )
}

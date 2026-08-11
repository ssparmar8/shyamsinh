import type { ReactElement } from 'react'
import type { System } from '@/content/schema'
import { IDENTITY, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'

/** 1200×630 is the size every platform crops from; anything else gets letterboxed. */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const BG = '#e9e9e9'
const INK = '#2b2b2b'
const DIM = '#696969'
const GHOST = '#8d8d8d'
const RULE = '#00000022'

/**
 * Share cards, all four built from one frame so a project card and the identity card read as
 * the same site. Every page used to share the identical generic card: posting a link to one
 * project showed his name and a stat line, saying nothing about the project being linked.
 *
 * Satori supports flexbox only, and every element containing children needs an explicit
 * `display`. No custom font is loaded — see the note in app/opengraph-image.tsx.
 */
function Frame({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: BG,
        color: INK,
        padding: '64px 72px',
        position: 'relative',
      }}
    >
      {/* The HUD corner traces the site frames every page with. */}
      <div style={{ position: 'absolute', top: 36, left: 36, width: 56, height: 2, background: GHOST, display: 'flex' }} />
      <div style={{ position: 'absolute', top: 36, left: 36, width: 2, height: 56, background: GHOST, display: 'flex' }} />
      <div style={{ position: 'absolute', bottom: 36, right: 36, width: 56, height: 2, background: GHOST, display: 'flex' }} />
      <div style={{ position: 'absolute', bottom: 36, right: 36, width: 2, height: 56, background: GHOST, display: 'flex' }} />
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }): ReactElement {
  return <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, color: DIM }}>{children}</div>
}

/** The signature line every card ends with, so a cropped card still says whose work it is. */
function Signature(): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', width: '100%', height: 1, background: RULE }} />
      <div style={{ display: 'flex', marginTop: 20, justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 2 }}>{IDENTITY.name}</div>
        <div style={{ display: 'flex', fontSize: 18, letterSpacing: 4, color: DIM }}>
          {IDENTITY.title.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

/** Home: who he is and the four figures the hero leads with. */
export function identityCard(): ReactElement {
  const stats: Array<[string, string]> = [
    [String(yearsExperience()), 'YRS'],
    [String(countSystems()), 'SYSTEMS'],
    [String(countSectors()), 'SECTORS'],
    [String(countClientRegions()), 'CLIENT REGIONS'],
  ]
  return (
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label>{'// IDENTITY'}</Label>
        <div style={{ display: 'flex', fontSize: 82, letterSpacing: 4, marginTop: 18 }}>
          {IDENTITY.name}
        </div>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 8, marginTop: 14 }}>
          {IDENTITY.title.toUpperCase()}
        </div>
        <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.45, marginTop: 28, maxWidth: 900, color: DIM }}>
          {IDENTITY.pitch}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', width: '100%', height: 1, background: RULE }} />
        <div style={{ display: 'flex', marginTop: 22, gap: 64 }}>
          {stats.map(([value, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 40 }}>{value}</div>
              <div style={{ display: 'flex', fontSize: 18, letterSpacing: 4, color: DIM, marginTop: 6 }}>
                {label}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 18, letterSpacing: 4, color: DIM }}>
            {IDENTITY.location.toUpperCase()} · REMOTE
          </div>
        </div>
      </div>
    </Frame>
  )
}

/**
 * One record. The name is the subject, so it gets the size the person's name gets on the
 * identity card — a link to a project should look like it is about that project.
 */
export function recordCard(system: System, recordNumber: number): ReactElement {
  // The summary is written for a page, not a card; two lines is what fits before the stack
  // row, and a card that overflows its frame renders as clipped text on every platform.
  const summary =
    system.summary.length > 150 ? `${system.summary.slice(0, 147).replace(/\s+\S*$/, '')}…` : system.summary

  return (
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Label>{`RECORD ${String(recordNumber).padStart(2, '0')}`}</Label>
          <Label>{system.status}</Label>
        </div>
        <div style={{ display: 'flex', fontSize: 68, letterSpacing: 2, marginTop: 16 }}>
          {system.name}
        </div>
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, marginTop: 12, color: DIM }}>
          {`${system.domain.toUpperCase()} · ${system.region} · ${system.year}`}
        </div>
        <div style={{ display: 'flex', fontSize: 24, lineHeight: 1.45, marginTop: 24, maxWidth: 940, color: DIM }}>
          {summary}
        </div>
        <div style={{ display: 'flex', marginTop: 26, gap: 12, flexWrap: 'wrap' }}>
          {system.stack.slice(0, 5).map((tech) => (
            <div
              key={tech}
              style={{
                display: 'flex',
                border: `1px solid ${RULE}`,
                padding: '6px 14px',
                fontSize: 18,
                letterSpacing: 2,
                color: DIM,
              }}
            >
              {tech}
            </div>
          ))}
        </div>
      </div>
      <Signature />
    </Frame>
  )
}

/** The archive: the catalogue's size, which is the reason to open it. */
export function archiveCard(): ReactElement {
  const stats: Array<[string, string]> = [
    [String(countSystems()), 'SYSTEMS'],
    [String(countSectors()), 'SECTORS'],
    [String(countClientRegions()), 'CLIENT REGIONS'],
  ]
  return (
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label>{'// INDEX'}</Label>
        <div style={{ display: 'flex', fontSize: 72, letterSpacing: 6, marginTop: 18 }}>
          ARCHIVE INDEX
        </div>
        <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.45, marginTop: 22, maxWidth: 900, color: DIM }}>
          Every system shipped, by year — production AI and backend work across healthcare,
          legal, compliance and commerce.
        </div>
        <div style={{ display: 'flex', marginTop: 30, gap: 64 }}>
          {stats.map(([value, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 44 }}>{value}</div>
              <div style={{ display: 'flex', fontSize: 18, letterSpacing: 4, color: DIM, marginTop: 6 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Signature />
    </Frame>
  )
}

/** Contact: the one question this page answers is whether he is taking work. */
export function contactCard(available: boolean, availability: string): ReactElement {
  return (
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label>{'// UPLINK'}</Label>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: available ? INK : 'transparent',
              border: `2px solid ${available ? INK : GHOST}`,
              marginRight: 18,
            }}
          />
          <div style={{ display: 'flex', fontSize: 34, letterSpacing: 6 }}>{availability}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 44, marginTop: 34 }}>{IDENTITY.email}</div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 14, color: DIM }}>
          {IDENTITY.phone}
        </div>
        <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, marginTop: 22, color: DIM }}>
          {`${IDENTITY.location.toUpperCase()} · REMOTE · FREELANCE CONTRACT`}
        </div>
      </div>
      <Signature />
    </Frame>
  )
}

/**
 * "The climb" — spec §4.2.
 * Deliberately unadorned: dates and facts only. No adjectives about grit or
 * journey. The restraint is the point.
 */
export const TRAJECTORY = [
  { year: 2012, label: 'ITI RAJKOT', note: 'TRADE', detail: 'N.C.V.T. · 78%' },
  { year: 2015, label: 'DIPLOMA · GTU', note: '+3 YRS', detail: 'Sanjaybhai Rajguru · CGPA 8.68' },
  { year: 2018, label: 'B.E. · GTU', note: '+3 YRS', detail: 'Marwadi · S.P.I. 6.0' },
  { year: 2018, label: 'FIRST BACKEND SYSTEM', note: '', detail: '' },
  // detail intentionally left blank: the system/domain/region counts are derived
  // from SYSTEMS (countSystems() / countDomains() / countRegions() in ./index),
  // not hardcoded here — see Task 3 correction. The UI composes the final string
  // in Task 8 so this row can never drift from the actual data.
  { year: 2026, label: 'AI & BACKEND ARCHITECT', note: '', detail: '' },
] as const

export const CONTINUITY = 'NO BREAK SINCE 2018'

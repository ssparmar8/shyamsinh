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
  // detail intentionally left blank: the counts are derived from SYSTEMS
  // (countSystems() / countSectors() / countClientRegions() in ./index), not
  // hardcoded here, so this row can never drift from the actual data.
  //
  // If this row states systems and regions together it MUST use
  // countClientRegions() (3), never countRegions() (4). "18 SYSTEMS · 3 REGIONS"
  // is true; "18 SYSTEMS · 4 REGIONS" is not — the 4th node is home, not a client.
  // See the countRegions() doc comment in ./index.
  { year: 2026, label: 'AI & BACKEND ARCHITECT', note: '', detail: '' },
] as const

export const CONTINUITY = 'NO BREAK SINCE 2018'

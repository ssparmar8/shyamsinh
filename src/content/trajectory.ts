/**
 * "The climb" — spec §4.2.
 * Deliberately unadorned: dates and facts only. No adjectives about grit or
 * journey. The restraint is the point.
 */
/**
 * `note` and `span` are two different facts and used to share one field.
 *
 * `note` qualifies the node itself — 2012's 'TRADE' is what kind of programme ITI was.
 * `span` is the distance from the node ABOVE, which belongs to the gap between two rows, not
 * to either row's description. While both lived in `note` the section rendered them the same
 * way and '+3 YRS · Sanjaybhai Rajguru · CGPA 8.68' read as though the college took 3 years.
 * The timeline rail now draws `span` in the gap it measures, which only works because the
 * two are distinguishable here.
 */
export const TRAJECTORY = [
  { year: 2012, label: 'ITI RAJKOT', note: 'TRADE', span: '', detail: 'N.C.V.T. · 78%' },
  {
    year: 2015,
    label: 'DIPLOMA · GTU',
    note: '',
    span: '+3 YRS',
    detail: 'Sanjaybhai Rajguru · CGPA 8.68',
  },
  { year: 2018, label: 'B.E. · GTU', note: '', span: '+3 YRS', detail: 'Marwadi · S.P.I. 6.0' },
  { year: 2018, label: 'FIRST BACKEND SYSTEM', note: '', span: '', detail: '' },
  // detail intentionally left blank: the counts are derived from SYSTEMS
  // (countSystems() / countSectors() / countClientRegions() in ./index), not
  // hardcoded here, so this row can never drift from the actual data.
  //
  // If this row states systems and regions together it MUST use
  // countClientRegions() (3), never countRegions() (4). "18 SYSTEMS · 3 REGIONS"
  // is true; "18 SYSTEMS · 4 REGIONS" is not — the 4th node is home, not a client.
  // See the countRegions() doc comment in ./index.
  { year: 2026, label: 'AI & BACKEND ARCHITECT', note: '', span: '', detail: '' },
] as const

export const CONTINUITY = 'NO BREAK SINCE 2018'

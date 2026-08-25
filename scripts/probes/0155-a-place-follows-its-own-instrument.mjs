// The breaks behind docs/decisions/0155-a-place-follows-its-own-instrument.md.
//
// ⚠️ THE ONE THAT WAS FIRST HERE IS RETIRED — docs/decisions/0192-a-guard-holds-an-invariant.md.
// *No two places follow the same instrument at every rung* is a design goal rather than an invariant:
// a place written as a reprise of another would redden it and be correct. It is measured in
// `tests/authored.test.ts` and it cannot fail a suite.
//
// ⚠️ THE ONE THAT REMAINS ALREADY FIRED FOR REAL, on this table's first run: `mire` followed `toll` at `surge`
// and the ladder does not open `toll` until `approach`. A place following silence for a whole
// section reads, from every other measurement in the repository, as a place with a quiet section.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0155',
    suite: 'tests/arrangement.test.ts',
    broke: 'a place following a layer its rung never opens, so it follows silence for a section',
    guard: '0155 — A PLACE FOLLOWS ITS OWN INSTRUMENT, and it is still exactly one',
    edit: {
      path: 'src/content/arrangement.ts',
      find: "  mire: { run: 'sub', push: 'groove', surge: 'drive', approach: 'toll', boss: 'toll' },",
      replace: "  mire: { run: 'sub', push: 'groove', surge: 'toll', approach: 'toll', boss: 'toll' },",
    },
  },
];

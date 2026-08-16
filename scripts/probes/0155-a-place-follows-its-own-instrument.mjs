// The breaks behind docs/decisions/0155-a-place-follows-its-own-instrument.md.
//
// ⚠️ THE FIRST ONE IS THE DEFECT 0155 EXISTS FOR, PUT BACK. Seven places that follow the same
// instrument at every rung are one arrangement played seven ways, whatever their gains say — and
// 0147's balance floor was green over exactly that for the whole life of the seven places.
//
// ⚠️ THE SECOND ALREADY FIRED FOR REAL, on this table's first run: `mire` followed `toll` at `surge`
// and the ladder does not open `toll` until `approach`. A place following silence for a whole
// section reads, from every other measurement in the repository, as a place with a quiet section.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0155',
    suite: 'tests/arrangement.test.ts',
    broke: 'two places following the same instrument at every rung, which is one arrangement twice',
    guard: 'and no two places follow the same thing all the way through, which is the whole point',
    edit: {
      path: 'src/content/arrangement.ts',
      // Rime handed Ember Nebula's leads exactly. Both still differ from every OTHER place, so only
      // the pairwise guard can see it — which is the whole reason it is pairwise.
      find: "  rime: { run: 'chords', push: 'lead', surge: 'lead', boss: 'wraith' },",
      replace: "  rime: { run: 'chords', push: 'arp', approach: 'toll', boss: 'wraith' },",
    },
  },
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

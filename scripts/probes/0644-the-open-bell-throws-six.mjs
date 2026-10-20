// The breaks behind docs/decisions/0644-the-open-bell-throws-six.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0644',
    suite: 'tests/medusa.test.ts',
    // The ring put back to eight: on Burn the void eats every arc link and every paintball, and the fight never ends.
    broke: 'an open bell throwing eight void a ring on Burn',
    guard: 'and on Burn every gun finishes her from the bell’s lane',
    edit: {
      path: 'src/content/bosses.ts',
      find: "      { upTo: 0.31, fireEvery: 48, shots: 6, spread: 0, patrolScale: 1.2, stance: { kind: 'open', damageScale: 2 },",
      replace: "      { upTo: 0.31, fireEvery: 48, shots: 8, spread: 0, patrolScale: 1.2, stance: { kind: 'open', damageScale: 2 },",
    },
  },
];

// The eagle throws quills — docs/decisions/0262-the-eagle-throws-quills.md
//
// Every guard 0262 adds, broken on purpose. `node scripts/prove-guard.mjs 0262`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0262',
    suite: 'tests/volans.test.ts',
    // The fish back on the lancer's lance.
    broke: 'the fish throwing the lance again',
    guard: '0262 — THE QUILL: the fish’s bullet is a feather',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    shot: 'quill',\n    phases: [\n      // A fan of three quills, raking",
      replace: "    shot: 'lance',\n    phases: [\n      // A fan of three quills, raking",
    },
  },
  {
    decision: '0262',
    suite: 'tests/volans.test.ts',
    // One dart down the lane again — the fan that was boring.
    broke: 'the opening fan back to one dart, so there is nothing to rake',
    guard: '0262 — THE QUILL: the fish’s bullet is a feather',
    edit: {
      path: 'src/content/bosses.ts',
      find: "      { upTo: 1, fireEvery: 78, shots: 3, spread: 0.6, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },",
      replace: "      { upTo: 1, fireEvery: 78, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },",
    },
  },
  {
    decision: '0262',
    suite: 'tests/volans.test.ts',
    // The horde back down the lane in a file.
    broke: 'the kites called at the leading edge again, in a file down the lane',
    guard: 'THE SUMMONS: a volley at half health',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0270, which said how many of the horde may stand.
      find: "attack: { kind: 'summon', enemy: 'kite', count: 3, formation: 'vee', from: 'sides', standing: 6 } },",
      replace: "attack: { kind: 'summon', enemy: 'kite', count: 3, formation: 'vee', from: 'lead', standing: 6 } },",
    },
  },
  {
    decision: '0262',
    suite: 'tests/volans.test.ts',
    // Every call from the same side: the toggle dropped.
    broke: 'every call from the same side, so the horde is a file after all',
    guard: 'THE SUMMONS: a volley at half health',
    edit: {
      path: 'src/app/frame.ts',
      find: '    boss.spin = boss.spin > 0 ? -1 : 1;\n',
      replace: '    boss.spin = 1;\n',
    },
  },
  {
    decision: '0262',
    suite: 'tests/volans.test.ts',
    // The kite weaving again rather than diving.
    broke: 'the kite on its weave again, so it drifts in rather than dives',
    guard: 'THE KITE: Ember Nebula’s horde',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    motion: { kind: 'hunt', agility: 0.9 },\n  },",
      replace: "    motion: { kind: 'weave', amplitude: 16, wavelength: 90 },\n  },",
    },
  },
];

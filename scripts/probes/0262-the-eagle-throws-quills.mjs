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
    guard: '0262 — THE SPINE: the fish’s bullet is its own',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0316, which redrew the bullet and renamed it with the drawing, and by 0317,
      // which rewrote the comment over the opening phase.
      find: "    shot: 'spine',\n    phases: [",
      replace: "    shot: 'lance',\n    phases: [",
    },
  },
  {
    decision: '0262',
    suite: 'tests/volans.test.ts',
    // One dart down the lane again — the fan that was boring.
    broke: 'the opening fan back to one dart, so there is nothing to rake',
    guard: '0262 — THE SPINE: the fish’s bullet is its own',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0317, which quickened the opening and widened its fan.
      // ⚠️ Re-anchored by 0380: the opening stage is the rake of seven with the kites, kindled.
      find: "      { upTo: 1, fireEvery: 54, shots: 7, spread: 1.1, patrolScale: 1.3, stance: { kind: 'volley' }, look: KINDLED, shot: null, attack: null, escort:",
      replace: "      { upTo: 1, fireEvery: 54, shots: 1, spread: 0, patrolScale: 1.3, stance: { kind: 'volley' }, look: KINDLED, shot: null, attack: null, escort:",
    },
  },
  /*
    ⚠️ A PROBE WENT HERE WITH THE FLANK — docs/decisions/0373-the-fish-spits-its-adds.md. *The kites
    called at the leading edge again, in a file down the lane* broke 0262's flanking entry, and the
    kites do not flank any more: they are spat out of the mouth, and 0373's own probes break that.
  */
  {
    decision: '0262',
    suite: 'tests/volans.test.ts',
    // Every call from the same side: the toggle dropped.
    broke: 'every call from the same side, so the horde is a file after all',
    guard: 'THE SUMMONS: a volley at the last sixth',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0314: the escort writes `spin` too, so the bare line appears twice and the
      // harness refuses an ambiguous `find`. The comment above the summons's is what tells them apart.
      find: '      boss.spin = boss.spin > 0 ? -1 : 1;\n      // ⚠️ Anchored by',
      replace: '      boss.spin = 1;\n      // ⚠️ Anchored by',
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

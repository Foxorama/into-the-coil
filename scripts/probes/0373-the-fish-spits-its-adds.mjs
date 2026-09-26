// The fish spits its adds — docs/decisions/0373-the-fish-spits-its-adds.md
//
// Every guard 0373 adds, broken on purpose. `node scripts/prove-guard.mjs 0373`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    // THE ASKED-FOR ONE undone on one phase: the kites flank from the sides again, as 0262 had them.
    broke: 'the kites called from the sides again, so a horde arrives beside the ship rather than out of the mouth',
    guard: '0373 — THE ASKED-FOR ONE: every horde the fish calls comes OUT OF ITS MOUTH',
    edit: {
      path: 'src/content/bosses.ts',
      find: "escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'mouth', standing: 5, every: 150 } },",
      replace: "escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'sides', standing: 5, every: 150 } },",
    },
  },
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE ROW SAYS MOUTH AND THE FRAME THROWS THEM THE WRONG WAY: a spat body holding the screen
      instead of closing on the player, which is exactly what a summoned flanker used to do and why
      *"a dive that never arrives"* was the report. Every assertion about WHERE they appeared stays
      green; the one about which way they went is the one that reads it.
    */
    broke: 'a spat horde holding its place on the screen rather than flying at the player',
    guard: '0373 — THE ASKED-FOR ONE: every horde the fish calls comes OUT OF ITS MOUTH',
    edit: {
      path: 'src/app/frame.ts',
      find: '      e.velAlong = -row.closing * w.difficulty.closing + w.scrollPerStep;\n      e.velAcross = lane > e.across',
      replace: '      e.velAlong = w.scrollPerStep;\n      e.velAcross = lane > e.across',
    },
  },
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    // The jaw shut as the horde comes out: the mouth is not the tell for a spit.
    broke: 'the jaw no longer opening before a spit, so the horde comes out of a shut mouth',
    guard: '0373 — THE ASKED-FOR ONE: every horde the fish calls comes OUT OF ITS MOUTH',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (boss.fireIn <= FACE_GAPE || boss.sprayLeft > 0 || spitting) {',
      replace: '  if (boss.fireIn <= FACE_GAPE || boss.sprayLeft > 0) {',
    },
  },
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE FIRST CALL OF A PHASE LANDING ON THE STEP THE PHASE OPENS, which is what 0314 had: the
      jaw has had no time to open, so the first shoal of the breaker phase comes out of a shut mouth
      and every later one comes out of an open one. The guard asks the first call of every phase.
    */
    broke: 'the first call of a spitting phase landing before the jaw has opened',
    guard: '0373 — THE ASKED-FOR ONE: every horde the fish calls comes OUT OF ITS MOUTH',
    edit: {
      path: 'src/app/frame.ts',
      find: "    if (w.bossRow.phases[phase]!.escort?.from === 'mouth') w.bossEscortIn = Math.max(w.bossEscortIn, FACE_GAPE + 1);\n",
      replace: '',
    },
  },
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE GRACE ZEROED: a spat body is hittable on the step it is born, inside the column of shots
      already in flight down the lane the fish has stalked onto. Traced at one to nine steps of life
      before this constant existed — the horde the play never saw.
    */
    broke: 'the spit’s grace zeroed, so an add is born hittable inside the player’s own fire',
    guard: '0373 — and a spat add LIVES to leave the mouth',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const SPIT_GRACE = 18;',
      replace: 'const SPIT_GRACE = 0;',
    },
  },
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    // The fan folded: every add of a call steering for the boss's own lane, which is a stream.
    broke: 'the fan folded, so a call leaves the mouth as a single file',
    guard: '0373 — and they FAN',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const SPIT_FAN = 5;',
      replace: 'const SPIT_FAN = 0;',
    },
  },
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    // The minnow's gun taken away again: a horde that does not shoot is the one the play called trash.
    broke: 'the minnow without a gun again',
    guard: '0373 — and the adds FIRE',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    // One aimed spine every 96 steps (1.6 s): at four standing, about two and a half shots a second.\n    fireEvery: 96,',
      replace: '    // One aimed spine every 96 steps (1.6 s): at four standing, about two and a half shots a second.\n    fireEvery: 0,',
    },
  },
  {
    decision: '0373',
    suite: 'tests/volans.test.ts',
    // And the kite's, on the row 0249 wrote it out of.
    broke: 'the kite without a gun again, which is 0249 as it was',
    guard: 'THE KITE: Ember Nebula’s horde',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    fireEvery: 132,\n    shot: 'spit',",
      replace: "    fireEvery: 0,\n    shot: 'spit',",
    },
  },
];

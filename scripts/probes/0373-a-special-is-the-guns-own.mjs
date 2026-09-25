// The breaks behind docs/decisions/0373-a-special-is-the-guns-own.md.
//
// ⚠️ Every one of these is a working game. A bomb for every overflow, a stack read from the wrong
// end and a surge that lights an aura and changes nothing are each what the code was, or what one
// line away from it looks like, and none of them throws.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    // What the overflow was until this decision: a bomb whatever the face.
    broke: 'every overflow a bomb again, whatever the face',
    guard: 'THE ASK: every gun and every tube, overflowed, stocks the special its row names',
    edit: {
      path: 'src/content/pickups.ts',
      find: "  return kind === 'weapon' ? WEAPONS[weaponFaceOf(face)].special : MISSILES[missileFaceOf(face)].special;",
      replace: "  return 'bomb';",
    },
  },
  {
    decision: '0373',
    suite: 'tests/bombs.test.ts',
    // The stack read from the bottom: the oldest charge thrown first, which is the queue not asked for.
    broke: 'the stack spent from the bottom, so the oldest charge goes first',
    guard: 'THE REPORTED ONE: a charge goes on top, and the trigger throws the newest first',
    edit: {
      path: 'src/state/slices/run.ts',
      // ⚠️ Re-anchored by 0376: each side's stack spends from its own top.
      find: '      const left = spentFrom.slice(0, -1);',
      replace: '      const left = spentFrom.slice(1);',
    },
  },
  {
    decision: '0373',
    suite: 'tests/bombs.test.ts',
    // A surge thrown like a bomb: a charge spent on nothing, or on the wrong thing.
    broke: 'a surge sent down the thrown path',
    guard: 'a surge throws nothing at all',
    edit: {
      path: 'src/content/specials.ts',
      // ⚠️ Re-anchored by 0376, which put the trigger's side on every row.
      find: "    label: 'Hunt',\n    side: 'tubes',\n    charges: 1,\n    shot: null,\n    becomes: null,",
      replace: "    label: 'Hunt',\n    side: 'tubes',\n    charges: 1,\n    shot: 'bomb',\n    becomes: 'blast',",
    },
  },
  /*
    ⚠️ The gun surge's two probes were here; 0375 moved the golden surge onto the forward missiles, and
    its breaks moved with it.
  */
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    broke: 'the golden surge that lights an aura and multiplies nothing',
    guard: 'a missile launched in the surge carries the row’s damage and pierce',
    edit: {
      path: 'src/app/frame.ts',
      find: '      missile.damage *= surge.tubes.damage;\n',
      replace: '',
    },
  },
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    // The pierce forgotten: the missile is three times the damage and still spent by the first body.
    broke: 'the golden surge whose missiles never pierce',
    guard: 'and a pierced body does not spend the missile',
    edit: {
      path: 'src/app/frame.ts',
      find: '      missile.health = surge.tubes.pierce;\n',
      replace: '',
    },
  },
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    broke: 'the tube surge that multiplies nothing',
    guard: 'a missile launched in the surge carries the row’s damage and fuse',
    edit: {
      path: 'src/app/frame.ts',
      find: '      missile.damage *= surge.tubes.damage;\n',
      replace: '',
    },
  },
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    // *"They travel twice as far"* dropped, leaving the damage.
    broke: 'the tube surge that leaves the fuse alone',
    guard: 'a missile launched in the surge carries the row’s damage and fuse',
    edit: {
      path: 'src/app/frame.ts',
      find: '      missile.lifeFor *= surge.tubes.fuse;\n',
      replace: '',
    },
  },
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    // An effect the picture never mentions — 0036: the numbers change and the ship looks the same.
    broke: 'the aura never put on the ship',
    guard: 'its aura is on the ship for as long as it lasts',
    edit: {
      path: 'src/app/frame.ts',
      find: '    stepSurge(w);\n',
      replace: '',
    },
  },
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    // The end discovered rather than seen coming.
    broke: 'the aura that never blinks before it goes',
    guard: 'its aura is on the ship for as long as it lasts, blinks at the end',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const blinkOff = w.surgeFor < SURGE_WARN_STEPS && Math.floor(w.surgeFor / SURGE_BLINK_STEPS) % 2 === 1;',
      replace: '  const blinkOff = false;',
    },
  },
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    // Where the first version put it: with the exhaust, over every shot.
    broke: 'the aura drawn over the shots',
    guard: 'and is drawn under every shot',
    edit: {
      path: 'src/app/mount.ts',
      // ⚠️ Re-anchored by 0374, which put the whirlpool in the order beside the shots.
      find: 'debris, aura, enemyShots, playerShots, whirl, missiles, bombs, bolts, exhaust,',
      replace: 'debris, enemyShots, playerShots, whirl, missiles, bombs, bolts, aura, exhaust,',
    },
  },
  {
    decision: '0373',
    suite: 'tests/surge.test.ts',
    // A surge carried onto the replacement ship, which is a power the player did not earn twice.
    broke: 'a surge that outlives the ship that wore it',
    guard: 'and it goes with the ship that wore it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.surgeFor = 0;\n  w.aura.clear();\n',
      replace: '',
    },
  },
];

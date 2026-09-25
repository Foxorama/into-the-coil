// The breaks behind docs/decisions/0375-the-bomb-is-a-missile.md.
//
// ⚠️ Each is a picture or a rule that still works: a bomb that is still the old circle for longer, an
// explosion with one frame, a trigger that throws as fast as the thumb goes. The last of those is the
// one that matters most, because 0024's flash cap is safety and not taste.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0375',
    suite: 'tests/surge.test.ts',
    // The pairing before the swap: the auto-gun buying the golden surge again.
    broke: 'the auto-gun overflowing to the golden surge again',
    guard: 'and the ask’s own pairings, as 0375 swapped them',
    edit: {
      path: 'src/content/weapons.ts',
      find: "    // The bomb since 0375; it was the golden aura (0373).\n    special: 'bomb',",
      replace: "    // The bomb since 0375; it was the golden aura (0373).\n    special: 'overdrive',",
    },
  },
  {
    decision: '0375',
    suite: 'tests/bombs.test.ts',
    // One picture for its whole life: *"basically a yellow circle."*
    broke: 'the explosion never stepped through its pictures',
    guard: 'burns, rolls and smokes',
    edit: { path: 'src/app/frame.ts', find: '    stepExplosions(w);\n', replace: '' },
  },
  {
    decision: '0375',
    suite: 'tests/bombs.test.ts',
    broke: 'the explosion on the pyre’s short clock',
    guard: 'burns, rolls and smokes',
    edit: { path: 'src/app/frame.ts', find: '      blast.lifeFor = EXPLOSION_STEPS;', replace: '      blast.lifeFor = BLAST_STEPS;' },
  },
  {
    decision: '0375',
    suite: 'tests/bombs.test.ts',
    // A frame of the explosion drawn smaller than what it kills — 0053's promise about the edge.
    broke: 'a frame of the explosion drawn off its damage radius',
    guard: 'and every picture of it is drawn at the radius that does the damage',
    edit: { path: 'src/content/sprites.ts', find: '  blastFire: 68,', replace: '  blastFire: 60,' },
  },
  {
    decision: '0375',
    suite: 'tests/bombs.test.ts',
    // The gap never set: every press a throw, and a screen that flashes as fast as a thumb.
    broke: 'the throw gap never set',
    guard: 'never goes off more than three times a second',
    edit: { path: 'src/app/frame.ts', find: '  w.throwIn = THROW_GAP_STEPS;\n', replace: '' },
  },
  {
    decision: '0375',
    suite: 'tests/bombs.test.ts',
    broke: 'the throw gap never asked',
    guard: 'never goes off more than three times a second',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return SPECIALS[kind].shot === null || w.throwIn <= 0;',
      replace: '  return SPECIALS[kind].shot !== undefined;',
    },
  },
];

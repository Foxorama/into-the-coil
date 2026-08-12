// The breaks behind docs/decisions/0134-the-place-keeps-the-games-pace.md.
//
// ⚠️ THE FIRST TWO ARE THE SHIPPED DEFECT, RESTORED. Ember Nebula's first version opened at 61 notes
// a bar against level one's 118 and put 31.5% of its energy under 300 Hz at `surge` against 40.0%,
// and every guard in the repository was green over it — a place half the speed of the game it plays
// under, shipped and merged. The edits below put the held pedal and the two-notes-a-bar drum back.
//
// ⚠️ THE THIRD IS THE GUARD THAT COULD NOT SEE ITS OWN SUBJECT. `no theme at any rung drives the bus
// past full scale` baked ONE set of loops with no theme in it and applied every theme's multipliers
// to level one's samples, so a place whose own material clipped was exactly what it could not catch.
// It ran green over the whole of 0132 without baking a note of it, and the break restores that.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0134',
    suite: 'tests/themes.test.ts',
    broke: 'the undercurrent held instead of running, which is the pace the report was written about',
    guard: '0134 — NO PLACE IS SUBSTANTIALLY SLOWER THAN THE BASE COMPOSITION, at any rung',
    edit: {
      path: 'src/content/nebula.ts',
      find: '  return [root, root + 12, fifth, root, root, fifth, root + 12, fifth];',
      replace: '  return [root, _, _, _, _, _, fifth, _];',
    },
  },
  {
    decision: '0134',
    suite: 'tests/themes.test.ts',
    broke: 'the choir left with no floor under it, which is *no deep bassy times*',
    guard: 'and none is substantially BRIGHTER, which is the other half of the same report',
    edit: {
      path: 'src/content/themes.ts',
      find: '      groove: 1.363,\n      drone: 1.222,\n      sub: 1.109,',
      replace: '      groove: 0.5,\n      drone: 0.5,\n      sub: 0.5,',
    },
  },
  {
    decision: '0134',
    suite: 'tests/themes.test.ts',
    broke: 'the clipping guard baking one composition and applying every place’s mix to it',
    guard: 'and no theme at any rung drives the bus past full scale',
    edit: {
      path: 'tests/themes.test.ts',
      find: '      const loops = loopsAt(SAMPLE_RATE, theme);',
      replace: '      const loops = loopsAt(SAMPLE_RATE);',
    },
  },
];

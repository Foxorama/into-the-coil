// The storm is lightning — docs/decisions/0487-the-storm-is-lightning.md
//
// Every guard 0487 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0487`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0487',
    suite: 'tests/serpent.test.ts',
    // The report, put back: lightning in one place on the animal rather than across it.
    broke: 'every body bolt from the first node',
    guard: 'THE REPORTED ONE, DRIVEN: the lightning runs along the whole body',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const from = Math.min(nodes - span, Math.floor(w.bodyBoltRng.range(0, nodes - span + 1)));',
      replace: '      const from = 0;',
    },
  },
  {
    decision: '0487',
    suite: 'tests/serpent.test.ts',
    // A bolt that never goes out: a second aura in red, not a flicker.
    broke: 'every body bolt lit for its whole life',
    guard: 'and the red lightning flickers',
    edit: {
      path: 'src/app/frame.ts',
      find: '    table[at + 4] = age < storm.lit ? 1 : 0;',
      replace: '    table[at + 4] = 1;',
    },
  },
  {
    decision: '0487',
    suite: 'tests/serpent.test.ts',
    // A bolt swung wide of the body: lightning off the animal, read as lightning at the ship.
    broke: 'a body bolt jagged past the body',
    guard: 'THE CONSIDERED ONE, IN PIXELS',
    edit: {
      path: 'src/render/scene.ts',
      find: 'const BODY_BOLT_JAG = 0.45;',
      replace: 'const BODY_BOLT_JAG = 3;',
    },
  },
  {
    decision: '0487',
    suite: 'tests/serpent.test.ts',
    // The animal's lightning in the player's ink.
    broke: 'a body bolt in the player’s hand',
    guard: 'THE CONSIDERED ONE, IN PIXELS',
    edit: {
      path: 'src/render/scene.ts',
      find: '    surface.bolt(BODY_PATH, count, BOLT_WIDTH * BODY_BOLT_WIDTH * view.scale, 1, true);',
      replace: '    surface.bolt(BODY_PATH, count, BOLT_WIDTH * BODY_BOLT_WIDTH * view.scale, 1, false);',
    },
  },
];

// Damage sheds — docs/decisions/0480-damage-sheds.md
//
// Every guard 0480 adds, broken on purpose. `node scripts/prove-guard.mjs 0480`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0480',
    suite: 'tests/shed.test.ts',
    // The report, put back: nothing is shed, so nothing between the flash and the bar says it is hurt.
    broke: 'no fragment thrown when a hit lands',
    guard: 'jormungandr: a hit sheds its own fragment',
    edit: {
      path: 'src/app/frame.ts',
      find: '    // After every pairing that can light the animal, so a hit this step is shed this step — 0480.\n    shedHits(w);',
      replace: '    void shedHits;',
    },
  },
  {
    decision: '0480',
    suite: 'tests/shed.test.ts',
    // The cap gone: every body the serpent has lit is shed from, many a flash.
    broke: 'a shed with no rest between fragments',
    guard: 'jormungandr: a hit sheds its own fragment, from where it landed, and never more than five a second',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (shed === null || w.bossShedIn > 0 || w.bossPool.size === 0) return;',
      replace: '  if (shed === null || w.bossPool.size === 0) return;',
    },
  },
  {
    decision: '0480',
    suite: 'tests/shed.test.ts',
    // One mechanism wearing one fragment for every lord: 0282's tell.
    broke: 'the jellyfish shedding the frost ship’s ice',
    guard: 'and every lord sheds its own',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    shed: SPRITE.shedGlass,',
      replace: '    shed: SPRITE.shedIce,',
    },
  },
];

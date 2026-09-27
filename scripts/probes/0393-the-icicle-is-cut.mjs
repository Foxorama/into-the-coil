// The break behind docs/decisions/0393-the-icicle-is-cut.md.
//
// Asked for: *"the melting icicles are good, but need to be slightly smaller and look slightly cooler…
// the original frost attack itself that splits is over-shadowed. Not too small though, only about 15%
// smaller than they are now."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0393',
    suite: 'tests/accents.test.ts',
    // The icicle back at the shard's size, which is what the play found over-shadowing it.
    broke: 'the icicle drawn at the shard’s own size again',
    guard: '0393 — IN CSS PIXELS: the icicle reaches no further',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  frostSpent: 5.6,',
      replace: '  frostSpent: 6.6,',
    },
  },
];

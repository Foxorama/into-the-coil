// The glow is its health — docs/decisions/0491-the-glow-is-its-health.md
//
// Every guard 0491 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0491`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0491',
    suite: 'tests/medusa.test.ts',
    // A phase that wears the bell before it: one step of the glow missing.
    broke: 'the second phase wearing the whole bell’s glow',
    guard: 'THE ASK, DRIVEN, IN THE INK: every phase wears its own glow',
    edit: {
      path: 'src/content/bosses.ts',
      find: ', hull: { rest: SPRITE.boss14Lime, hit: SPRITE.boss14LimeHit } },',
      replace: ' },',
    },
  },
  {
    decision: '0491',
    suite: 'tests/medusa.test.ts',
    // A bell of its own drawn in another's light: the step worn and not seen.
    broke: 'the lime bell lit green',
    guard: 'THE ASK, DRIVEN, IN THE INK: every phase wears its own glow',
    edit: {
      path: 'src/render/bake.ts',
      find: "  if (kind.startsWith('boss14Lime')) return 1;",
      replace: "  if (kind.startsWith('boss14Lime')) return 0;",
    },
  },
  {
    decision: '0491',
    suite: 'tests/medusa.test.ts',
    // The amber the first draft chose, a hair under the floor over the place's mauve.
    broke: 'the amber bell under the gameplay floor',
    guard: 'THE JELLYFISH: its glass, laid over the place’s nebula',
    edit: {
      path: 'src/render/bake.ts',
      find: "'#ffe14a', '#ffb44e', '#ffa898'] as const;",
      replace: "'#ffe14a', '#ffa23a', '#ffa898'] as const;",
    },
  },
];

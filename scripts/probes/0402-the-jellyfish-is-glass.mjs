// The jellyfish is glass, and it opens — docs/decisions/0402-the-jellyfish-is-glass.md
//
// Every guard 0402 adds, broken on purpose. `node scripts/prove-guard.mjs 0402`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0402',
    suite: 'tests/medusa.test.ts',
    // The last fifth taking twice the damage and looking exactly as the four before it — the report.
    broke: 'the open bell taken off the last phase',
    guard: 'THE ASK: the last phase wears the bell open',
    edit: {
      path: 'src/content/bosses.ts',
      find: ", hull: { rest: SPRITE.boss14Open, hit: SPRITE.boss14OpenHit } },",
      replace: ' },',
    },
  },
  {
    decision: '0402',
    suite: 'tests/medusa.test.ts',
    // A body left wearing the last phase's hull after a heal carries it back out of that phase.
    broke: 'the row’s own body never put back when the phase authors none',
    guard: 'THE ASK: the last phase wears the bell open',
    edit: {
      path: 'src/app/frame.ts',
      find: '  } else if (boss.spriteBase !== w.bossRow.sprite && wearsAsHull(w.bossRow, boss.spriteBase)) {',
      replace: '  } else if (boss.spriteBase < 0 && wearsAsHull(w.bossRow, boss.spriteBase)) {',
    },
  },
];

// The leap is a target — docs/decisions/0477-the-leap-is-a-target.md
//
// Every guard 0477 adds, broken on purpose. `node scripts/prove-guard.mjs 0477`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0477',
    suite: 'tests/volans.test.ts',
    // The report, put back: the leap is the entrance replayed and refuses every hit, as 0380 had it.
    broke: 'a leap that refuses every hit, as the entrance does',
    guard: 'THE ASK: a shot that meets the fish in its leap is spent on it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.bossPool.size === 0 || (w.bossEntering >= 0 && !w.bossLeaping)) return false;',
      replace: '  if (w.bossPool.size === 0 || w.bossEntering >= 0) return false;',
    },
  },
  {
    decision: '0477',
    suite: 'tests/volans.test.ts',
    // The bar hidden for the leap, as it was.
    broke: 'the bar hidden for the leap',
    guard: 'THE ASK: a shot that meets the fish in its leap is spent on it, and the bar stays up',
    edit: {
      path: 'src/app/frame.ts',
      find: '      bossOnField(w) && (w.bossEntering < 0 || w.bossLeaping) && barOver > 0',
      replace: '      bossOnField(w) && w.bossEntering < 0 && barOver > 0',
    },
  },
  {
    decision: '0477',
    suite: 'tests/volans.test.ts',
    // A fish killed in the air left flying its entrance.
    broke: 'a fish killed in its leap left flying in',
    guard: 'and a fish killed in its leap dies there',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.bossEntering = -1;\n      w.bossLeaping = false;',
      replace: '      void 0;',
    },
  },
  {
    decision: '0477',
    suite: 'tests/volans.test.ts',
    // The flag never lowered at the arrival's hand-over, so the NEXT arrival is a target too.
    broke: 'the opening breach as much a target as the leap',
    guard: 'and the arrival is still untouchable',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.bossEntering = entrance === null ? -1 : 0;\n  w.bossLeaping = false;',
      replace: '  w.bossEntering = entrance === null ? -1 : 0;\n  w.bossLeaping = true;',
    },
  },
  {
    decision: '0477',
    suite: 'tests/level.test.ts',
    // The fish without its weights: its leap no longer free time, the arc takes it in 35.5 s.
    broke: 'the fish without its weights on the arc, the shuriken and the ray',
    guard: 'a real boss lasts forty seconds at max weapons, and every phase gets eight volleys away, so every attack is seen — the arc',
    edit: {
      path: 'src/content/bosses.ts',
      // 0545 weighted the Catherine wheel on the same row, and 0549 and 0551 re-weighed it; the break still takes only the other three.
      find: '    gunWeights: { arc: 1.3, shuriken: 0.95, ray: 0.95, catherine: 0.45 },',
      replace: '    gunWeights: { arc: 1.5, shuriken: 1, ray: 1, catherine: 0.45 },',
    },
  },
];

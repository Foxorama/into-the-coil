// The flame slows and the void lasts — docs/decisions/0479-the-flame-slows.md
//
// The two pools 0479 grew, put back, so the guards that need them are seen to need them.
// `node scripts/prove-guard.mjs 0479`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0479',
    suite: 'tests/level.test.ts',
    // The hostile pool at its old 150, under a flame on the screen half again as long: a curtain cut short.
    // ⚠️ Re-sized by 0501: with a hole per stance, the gyre's eighth wall arrives whole at 150 and this
    // went STILL GREEN in CI. At 140 that wall is cut to 37 shots, short of its line's end, as before.
    broke: 'the hostile-shot pool at 140 under the slower flame',
    guard: 'EVERY WALL ARRIVES WHOLE',
    edit: {
      path: 'src/app/mount.ts',
      find: '  enemyShots: 200,',
      replace: '  enemyShots: 140,',
    },
  },
  {
    decision: '0479',
    suite: 'tests/void.test.ts',
    // The blast pool at its old six, under a rift open for 150 steps: a banked void that never opens.
    broke: 'the blast pool at six under the longer rift',
    guard: 'a salvo thrown as fast as the triggers allow opens every rift it throws',
    edit: {
      path: 'src/app/mount.ts',
      find: '  blasts: 9,',
      replace: '  blasts: 6,',
    },
  },
];

// A wall arrives whole — docs/decisions/0333-a-wall-arrives-whole.md
//
// Every guard 0333 adds, broken on purpose. `node scripts/prove-guard.mjs 0333`.

export const PROBES = [
  {
    decision: '0333',
    suite: 'tests/level.test.ts',
    // The floor authored away: 0332's ladder puts three walls in the air and the pool truncates them.
    broke: 'the gyre’s floor between walls authored away, so a fast gun stacks them and the pool drops what will not fit',
    guard: 'EVERY WALL ARRIVES WHOLE',
    edit: {
      path: 'src/content/bosses.ts',
      find: "quicken: { by: 0.88, least: 0.04 }, apart: 150 },",
      replace: "quicken: { by: 0.88, least: 0.04 }, apart: 0 },",
    },
  },
  {
    decision: '0333',
    suite: 'tests/level.test.ts',
    // The floor never read by the frame, which is the same defect one layer down.
    broke: 'the floor never read by the frame, so a wall is thrown on the step the notch turns however recent the last one',
    guard: 'EVERY WALL ARRIVES WHOLE',
    edit: {
      path: 'src/app/frame.ts',
      find: '    } else if (notch > w.bossUncoilAt && w.bossWallIn <= 0 && w.bossWheelIn <= 0 && onPoint(w, boss, uncoil)) {',
      replace: '    } else if (notch > w.bossUncoilAt) {',
    },
  },
  {
    decision: '0333',
    suite: 'tests/level.test.ts',
    // The queue spent as a SKIP: the count jumps to the notch and the stances in between never happen.
    broke: 'the owed walls skipped rather than queued, so the hull’s spike names a wall that never comes',
    guard: 'a wall the health has earned is owed rather than lost',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.bossUncoilAt++;\n      w.bossWallIn = uncoil.apart;',
      replace: '      w.bossUncoilAt = notch;\n      w.bossWallIn = uncoil.apart;',
    },
  },
  {
    decision: '0333',
    suite: 'tests/level.test.ts',
    // The gap never counted down, so after the first wall nothing is ever thrown again.
    broke: 'the gap never counted down, so a fight throws one wall and then none',
    guard: 'a wall the health has earned is owed rather than lost',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.bossWallIn > 0) w.bossWallIn--;',
      replace: '    if (w.bossWallIn < 0) w.bossWallIn--;',
    },
  },
];

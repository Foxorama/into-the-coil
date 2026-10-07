// The breaks behind docs/decisions/0581-the-weapons-sit-right.md.
//
// ⚠️ Every way a weapon could go back to where it was asked away from — the fighter's gun over its art or at a
// car's size, its tubes back on the nose, its pulse off its own outline, a fitted gun firing from the unscaled
// mouth — and every way a loaded tube could stop saying its kind or stop sitting where its missile leaves.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0581',
    suite: 'tests/weapons-sit.test.ts',
    broke: 'the fighter’s gun back over its canopy and its art, at 1.18',
    guard: 'THE ASK: carries every gun on its nose',
    edit: { path: 'src/content/ships.ts', find: 'const FIGHTER_HARDPOINT: Mount = { along: 2.73, across: 0 };', replace: 'const FIGHTER_HARDPOINT: Mount = { along: 1.18, across: 0 };' },
  },
  {
    decision: '0581',
    suite: 'tests/weapons-sit.test.ts',
    broke: 'the fighter’s guns at a car’s size',
    guard: 'THE ASK: carries every gun on its nose',
    edit: { path: 'src/content/ships.ts', find: 'const FIGHTER_MOUNT_SCALE = 0.6;', replace: 'const FIGHTER_MOUNT_SCALE = 1;' },
  },
  {
    decision: '0581',
    suite: 'tests/weapons-sit.test.ts',
    broke: 'the fighter’s tubes back at its nose',
    guard: 'hangs its tubes under its wings',
    edit: { path: 'src/content/ships.ts', find: '{ along: -0.45, across: -1.76 }], [{ along: -0.45', replace: '{ along: 3, across: -1.76 }], [{ along: -0.45' },
  },
  {
    decision: '0581',
    suite: 'tests/gun-layer.test.ts',
    broke: 'a fitted gun firing from its mount’s unscaled mouth, ahead of where it is drawn',
    guard: 'with another’s, fires it from its hardpoint plus the gun’s own mount',
    edit: { path: 'src/content/ships.ts', find: '  const s = row.mountScale;', replace: '  const s = 1;' },
  },
  {
    decision: '0581',
    suite: 'tests/accents.test.ts',
    broke: 'the fighter’s own pulse painted off its hull’s outline',
    guard: 'THE 0149 ONE: every solid mark on a body is inside its hull',
    edit: { path: 'src/render/bake.ts', find: '      if (own) trace(ctx, f, fighterPulseHull());\n', replace: '' },
  },
  {
    decision: '0581',
    suite: 'tests/weapons-sit.test.ts',
    broke: 'every loaded tube drawn as a missile tube whatever its kind',
    guard: 'THE ASK: is laid at each of its ship’s places in its own kind’s picture',
    edit: {
      path: 'src/app/frame.ts',
      find: "const art = MISSILES[kinds[i] ?? 'straight'].loaded[w.shipRow.tubeLook];",
      replace: 'const art = MISSILES.straight.loaded[w.shipRow.tubeLook];',
    },
  },
  {
    decision: '0581',
    suite: 'tests/weapons-sit.test.ts',
    broke: 'a loaded tube laid with its middle, not its nose, where its missile leaves',
    guard: 'THE ASK: is laid at each of its ship’s places in its own kind’s picture',
    edit: { path: 'src/app/frame.ts', find: 'w.ship.along + at.along - w.shipRow.tubeLength / 2', replace: 'w.ship.along + at.along' },
  },
  {
    decision: '0581',
    suite: 'tests/weapons-sit.test.ts',
    broke: 'the loaded tubes never laid on',
    guard: 'THE ASK: is laid at each of its ship’s places in its own kind’s picture',
    edit: { path: 'src/app/frame.ts', find: '    stepLoaded(w);\n', replace: '' },
  },
];

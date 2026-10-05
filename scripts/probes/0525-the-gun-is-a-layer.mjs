// The breaks behind docs/decisions/0525-the-gun-is-a-layer.md.
//
// ⚠️ A borrowed gun is one thing in three places — the muzzle the frame fires from, the mount the bake
// draws, and the gun the run carries — and each break below leaves two of them saying one gun and the
// third another.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0525',
    suite: 'tests/gun-layer.test.ts',
    broke: 'a borrowed gun fired from the bare hardpoint, not its own mount’s mouth',
    guard: 'fires it from its hardpoint plus the gun’s own mount',
    edit: {
      path: 'src/content/ships.ts',
      find: '  return { ...row, weapon: gun, muzzle: { along: row.hardpoint.along + mount.along, across: row.hardpoint.across + mount.across } };',
      replace: '  return { ...row, weapon: gun, muzzle: row.hardpoint };',
    },
  },
  {
    decision: '0525',
    suite: 'tests/gun-layer.test.ts',
    broke: 'a ship drawn with its own gun whatever it flies',
    guard: 'drawn without its own, and with the mount laid on last',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const own = gun === SHIPS[ship].weapon;',
      replace: '  const own = true;',
    },
  },
  {
    decision: '0525',
    suite: 'tests/gun-layer.test.ts',
    broke: 'every mount drawn about the hardpoint, its mouth nowhere near the muzzle',
    guard: 'muzzle is inside a mark its mount paints',
    edit: {
      path: 'src/render/bake.ts',
      find: '  MOUNTS[gun][row.view](ctx, f, palette, (x, y) => [hx + x, hy + y], [muzzle.along / BOX_R, muzzle.across / BOX_R]);',
      replace: '  MOUNTS[gun][row.view](ctx, f, palette, (x, y) => [hx + x, hy + y], [0, 0]);',
    },
  },
  {
    decision: '0525',
    suite: 'tests/gun-layer.test.ts',
    broke: 'a run begun in the world on the ship’s own row, whatever gun it was fitted with',
    guard: 'begins in the world with the fitted ship',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: '      world.shipRow = fitted(SHIPS[ship], gun ?? SHIPS[ship].weapon);',
      replace: '      world.shipRow = SHIPS[ship];',
    },
  },
  {
    decision: '0525',
    suite: 'tests/gun-layer.test.ts',
    broke: 'a run begun on its ship’s own gun whatever the shell named',
    guard: 'flies the gun it began with',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        gun: action.gun ?? SHIPS[action.ship].weapon,',
      replace: '        gun: SHIPS[action.ship].weapon,',
    },
  },
];

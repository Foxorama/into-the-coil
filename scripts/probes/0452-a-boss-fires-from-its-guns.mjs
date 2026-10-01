// A boss fires from its guns — docs/decisions/0452-a-boss-fires-from-its-guns.md
//
// Every guard 0452 adds, broken on purpose. `node scripts/prove-guard.mjs 0452`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0452',
    suite: 'tests/muzzles.test.ts',
    // The row's muzzle read and thrown away: every volley from the middle of the hull, as before.
    broke: 'the row’s muzzle ignored, so every volley leaves the middle of the hull again',
    guard: 'THE VOLLEY LEAVES IT, IN PIXELS',
    edit: {
      path: 'src/app/boss.ts',
      find: '  return boss.along + turnedAlong(muzzle.along, muzzle.across, boss.turn);',
      replace: '  return boss.along;',
    },
  },
  {
    decision: '0452',
    suite: 'tests/muzzles.test.ts',
    // The muzzle where it is unturned, while the head it belongs to rears.
    broke: 'the muzzle left unturned, so a reared serpent fires from beside its jaw',
    guard: 'THE MUZZLE TURNS WITH THE HEAD',
    edit: {
      path: 'src/app/boss.ts',
      find: '  return boss.along + turnedAlong(muzzle.along, muzzle.across, boss.turn);',
      replace: '  return boss.along + muzzle.along;',
    },
  },
  {
    decision: '0452',
    suite: 'tests/muzzles.test.ts',
    // The sentinel's muzzle put back in its middle, its drawing's prow unchanged.
    broke: 'the sentinel firing from its centre while its drawing has a prow',
    guard: 'THE ROWS ARE THE DRAWING',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    muzzle: { along: -10.9, across: 0 },',
      replace: '    muzzle: { along: 0, across: 0 },',
    },
  },
  {
    decision: '0452',
    suite: 'tests/muzzles.test.ts',
    // The laser head goes on following the ship while its beam is fixed across the lane.
    broke: 'the hydra’s laser head turning after the ship while its beam is held',
    guard: 'THE LANCE STAYS IN THE JAW',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const holding = !fresh && hull.holdFor > 0 && hull.muzzleAt === k;',
      replace: '    const holding = false;',
    },
  },
  {
    decision: '0452',
    suite: 'tests/quetzal.test.ts',
    // The re-pin forgets the root's own along: every beam back level with the chest after one step.
    broke: 'the beam re-pinned to the muzzle without its root, so the cannons fire from the chest again',
    guard: 'THE WINGS AND THE MOUTH, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '      b.fromAlong = muzzleAlongOf(boss, w.bossRow, w.mouths) + b.rootAlong - b.along;',
      replace: '      b.fromAlong = muzzleAlongOf(boss, w.bossRow, w.mouths) - b.along;',
    },
  },
  {
    decision: '0452',
    suite: 'tests/quetzal.test.ts',
    // The throat's beam back in the chest: the reported defect, in the row.
    broke: 'the mouth’s beam rooted level with the chest, behind the throat cannon it is drawn coming out of',
    guard: 'THE SHOULDER CANNONS',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'const THROAT_AHEAD = -10;',
      replace: 'const THROAT_AHEAD = 0;',
    },
  },
];

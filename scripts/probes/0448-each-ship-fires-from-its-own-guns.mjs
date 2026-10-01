// Each ship fires from its own guns — docs/decisions/0448-each-ship-fires-from-its-own-guns.md
//
// Every guard 0448 adds, broken on purpose. `node scripts/prove-guard.mjs 0448`.
//
// ⚠️ NO PROBE FOR THE PULSE'S MUZZLE. The fighter and the saucer both fire from the nose, which is
// where every ship fired from before, so a pulse put back on the centreline is a break no ship today
// would show — a probe of it would be STILL GREEN by construction. The arc and the blades are the guns
// whose muzzle is off the centreline, and they are what is broken below.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0448',
    suite: 'tests/mounts.test.ts',
    broke: 'the lightning leaving the centreline, in front of the estate’s door, as it did',
    guard: 'THE GUN: every ship’s first shot leaves its own muzzle',
    edit: {
      path: 'src/app/frame.ts',
      find: '  let fromAcross = w.ship.across + w.shipRow.muzzle.across;',
      replace: '  let fromAcross = w.ship.across;',
    },
  },
  {
    decision: '0448',
    suite: 'tests/blades.test.ts',
    broke: 'the blades thrown from the strand, beside the car, rather than out of the launcher on its hood',
    guard: 'THE HELIX: a blade leaves the gun for the wingtip',
    edit: {
      path: 'src/app/frame.ts',
      find: '    reset(blade, w.ship.along + muzzle.along, w.ship.across + muzzle.across, row, BLADE_KIND);',
      replace: '    reset(blade, w.ship.along + muzzle.along, strand, row, BLADE_KIND);',
    },
  },
  {
    decision: '0448',
    suite: 'tests/blades.test.ts',
    broke: 'the blades leaving the gun onto a helix already turning, so they never go out to the wingtip first',
    guard: 'THE HELIX: a blade leaves the gun for the wingtip',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (b.outFor > 0) b.outFor--;\n    else b.orbitAngle += b.orbitTurn;',
      replace: '    if (b.outFor > 0) b.outFor--;\n    b.orbitAngle += b.orbitTurn;',
    },
  },
  {
    decision: '0448',
    suite: 'tests/mounts.test.ts',
    broke: 'the missiles leaving 0097’s two places for every ship, under a car rather than from its roof',
    guard: 'THE TUBES: a missile leaves its own tube',
    edit: {
      path: 'src/app/frame.ts',
      find: '    reset(missile, w.ship.along + tube.along, w.ship.across + tube.across, row);',
      replace: '    reset(missile, w.ship.along + 3, w.ship.across + 1.8 * side, row);',
    },
  },
  {
    decision: '0448',
    suite: 'tests/mounts.test.ts',
    broke: 'the Firebird’s turret moved on its row and not in its drawing',
    guard: 'THE ROWS ARE THE DRAWING',
    edit: {
      path: 'src/content/ships.ts',
      find: "    tubes: [[], [{ along: 0.76, across: -1.92 }],",
      replace: "    tubes: [[], [{ along: 1.76, across: -1.92 }],",
    },
  },
  {
    decision: '0448',
    suite: 'tests/thrust.test.ts',
    broke: 'every flame on the centreline again, so a car’s burns into the slope of its boot',
    guard: '0448 — burns one flame on each of its own nozzles',
    edit: {
      path: 'src/app/frame.ts',
      find: '    flame.across = w.ship.across + at.across;',
      replace: '    flame.across = w.ship.across;',
    },
  },
  {
    decision: '0448',
    suite: 'tests/thrust.test.ts',
    broke: 'the fighter’s pair laid once, as one bitmap did, so every ship burns one flame',
    guard: '0448 — burns one flame on each of its own nozzles',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const want = flying ? nozzles.length : 0;',
      replace: '  const want = flying ? 1 : 0;',
    },
  },
];

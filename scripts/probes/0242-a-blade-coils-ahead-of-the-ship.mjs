// A blade coils ahead of the ship — docs/decisions/0242-a-blade-coils-ahead-of-the-ship.md
//
// Every guard 0242 adds, broken on purpose. `node scripts/prove-guard.mjs 0242`.

export const PROBES = [
  {
    decision: '0242',
    suite: 'tests/blades.test.ts',
    // One blade a throw, from the nose: the ask's pair and its wingtips both gone.
    broke: 'a throw made one blade rather than a pair',
    guard: 'THE PAIR: a throw is two blades',
    edit: {
      path: 'src/app/frame.ts',
      find: '  for (let s = 0; s < BLADE_SIDES.length; s++) {',
      replace: '  for (let s = 0; s < 1; s++) {',
    },
  },
  {
    decision: '0242',
    suite: 'tests/blades.test.ts',
    // Both blades turning the same way: two parallel coils that never cross the centre line together.
    broke: 'both blades of a pair turning the same way, so they never cross ahead of the nose',
    guard: 'THE PAIR: a throw is two blades',
    edit: {
      path: 'src/app/frame.ts',
      find: '    blade.orbitTurn = -side * w.weapon.turn;',
      replace: '    blade.orbitTurn = w.weapon.turn;',
    },
  },
  {
    decision: '0242',
    suite: 'tests/blades.test.ts',
    // The pair thrown from the nose rather than the wingtips.
    broke: 'the pair thrown from the nose rather than the wingtips',
    guard: 'THE COIL: a blade leaves the wingtip',
    edit: {
      path: 'src/app/frame.ts',
      find: '    blade.orbitAngle = side * (Math.PI / 2);',
      replace: '    blade.orbitAngle = 0;',
    },
  },
  {
    decision: '0242',
    suite: 'tests/blades.test.ts',
    // The coil ladder authored flat, so a rung buys a fire-rate step and no band.
    broke: 'the loop the same size at every rung, so an upgrade buys no more band',
    guard: 'THE LADDER: a rung is a wider band',
    edit: {
      path: 'src/content/weapons.ts',
      find: '    coil: [7, 9, 12, 15, 18],',
      replace: '    coil: [7, 7, 7, 7, 7],',
    },
  },
];

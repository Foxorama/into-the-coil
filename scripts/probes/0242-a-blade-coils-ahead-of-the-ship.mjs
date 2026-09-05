// A blade coils ahead of the ship — docs/decisions/0242-a-blade-coils-ahead-of-the-ship.md
//
// Every guard 0242 adds, broken on purpose, as docs/decisions/0244-a-blade-rides-a-helix.md left
// them. `node scripts/prove-guard.mjs 0242`.
//
// ⚠️ One probe is retired by 0244: "both blades of a pair turning the same way". A helix's strand
// is a sine, and a sine advanced backwards is the same sine, so which way a blade's phase runs no
// longer changes the picture and there is nothing to break. The pair's half-turn is what the
// crossing rides on now, and the nose probe below breaks that.

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
    // The pair thrown from the nose rather than the wingtips: both strands in phase, one line drawn twice.
    broke: 'the pair thrown from the nose rather than the wingtips',
    guard: 'THE HELIX: a blade leaves the wingtip',
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

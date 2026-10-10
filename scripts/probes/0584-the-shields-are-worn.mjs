// The breaks behind docs/decisions/0584-the-shields-are-worn.md.
//
// ⚠️ The slot's rule, what is kept, the run wearing the shell fitted, and every shell its own picture.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0584',
    suite: 'tests/shells.test.ts',
    broke: 'a shell Cosmo’s sells worn on any ship without a shard spent',
    guard: 'its own shell always; another ship’s on the dash’s rule',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return from === null ? state.owned[shell] : plateOpen(state, ship, from);',
      replace: '  return from === null ? true : plateOpen(state, ship, from);',
    },
  },
  {
    decision: '0584',
    suite: 'tests/shells.test.ts',
    broke: 'a saved shell fitted that its own wins and wares never opened',
    guard: 'is kept, and a document fits no shell',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (raw !== undefined && shellOpen(holding, kind, raw)) shell[kind] = raw;',
      replace: '    if (raw !== undefined) shell[kind] = raw;',
    },
  },
  {
    decision: '0584',
    suite: 'tests/shells.test.ts',
    broke: 'a run opening in the ship’s own shell whatever the hangar fitted',
    guard: 'begins in the shell the hangar fitted',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: '      if (shell !== undefined) world.shipRow = shelled(world.shipRow, shell);',
      replace: '      if (shell !== undefined) world.shipRow = shelled(world.shipRow, SHIPS[ship].shield.look);',
    },
  },
  {
    decision: '0584',
    suite: 'tests/shells.test.ts',
    broke: 'the disco ball drawn as the aurora',
    guard: 'no two shells are one picture',
    edit: {
      path: 'src/render/bake.ts',
      find: "    case 'disco':\n      drawDiscoPlate(ctx, at, shimmer, palette);",
      replace: "    case 'disco':\n      drawAuroraPlate(ctx, at, shimmer, palette);",
    },
  },
];

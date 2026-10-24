// The breaks behind docs/decisions/0614-the-shields-come-down-a-tier.md.
//
// Each one undoes a line of the ask, and names the guard that has to go red.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0614',
    suite: 'tests/tier-shell.test.ts',
    // Savior's level back on the hull: *"start each level with 1 shield"* undone.
    broke: 'a Savior level opening on the hull',
    guard: 'THE ASK: Legend opens every life full',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    shellOpen: 1,\n    shellLevel: 1,',
      replace: '    shellOpen: 1,\n    shellLevel: 0,',
    },
  },
  // *"Don't give saviour a shield on death"* was taken back by 0650, and its break moved there inverted.
  {
    decision: '0614',
    suite: 'tests/tier-shell.test.ts',
    // A run's start left on a life's shell, so Savior's first level opens on the hull.
    broke: 'a run’s start opening on the life’s shell rather than the level’s',
    guard: 'at the run’s start, after a death and after a continue',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.ship.health = levelHealthFor(w.shipRow, w.difficulty);\n  w.regenSeen = w.ship.health;\n}',
      replace: '  w.regenSeen = w.ship.health;\n}',
    },
  },
  {
    decision: '0614',
    suite: 'tests/tier-shell.test.ts',
    // A boundary renewing to a life's shell: Savior's later levels open on the hull.
    broke: 'a level boundary renewing to the life’s shell',
    guard: 'raises what the ship carries to the tier’s opening shell',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const opens = levelHealthFor(w.shipRow, w.difficulty);',
      replace: '  const opens = openingHealthFor(w.shipRow, w.difficulty);',
    },
  },
  {
    decision: '0614',
    suite: 'tests/tier-shell.test.ts',
    // Burn carrying none again: *"the capacity for each ship to gain up to 3 shields"* undone.
    broke: 'Burn carrying no shields',
    guard: 'THE ASK: Legend opens every life full',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    shellLevel: 0,\n    shellCap: 3,\n    // One void',
      replace: '    shellLevel: 0,\n    shellCap: 0,\n    // One void',
    },
  },
  {
    decision: '0614',
    suite: 'tests/tier-shell.test.ts',
    // The level's random pickups never offering a shield: *"not just for boss drops"* undone.
    broke: 'the random pickups withholding every shield',
    guard: 'the random pickups draw a shield on every tier that can carry one',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const offered = offeredAs(w, drawKind(w.pickupRng));',
      replace: '  const drawn = drawKind(w.pickupRng);\n  const offered = w.pickupRows[w.pickupKinds[drawn]]?.effect === \'shield\' ? w.pickupRows[w.pickupKinds[drawn]]!.bare : drawn;',
    },
  },
];

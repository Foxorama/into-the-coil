// The breaks behind docs/decisions/0441-a-pilot-flies-their-own-ship.md.
//
// Asked for: *"each pilot has their own ship and a weapon will be keyed to that ship only … each ship
// will start with max weapons … weapon pickups will instead be bomb pickups … a game starts with two
// bombs."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0441',
    suite: 'tests/run.test.ts',
    // Every run opens on the fighter's two bombs, whoever is flying.
    broke: 'a run opened on two bombs whatever ship it was in',
    guard: 'a run begins in the ship it is given',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '  const own = WEAPONS[SHIPS[ship].weapon].special;',
      replace: "  const own: SpecialKind = 'bomb';",
    },
  },
  {
    decision: '0441',
    suite: 'tests/run.test.ts',
    // A run kept the default ship, so the pilot's choice never reached the field.
    broke: 'a run began in the default ship whatever it was given',
    guard: 'a run begins in the ship it is given',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        ship: action.ship,\n        missile: SHIPS[action.ship].missile,',
      replace: '        ship: DEFAULT_SHIP,\n        missile: SHIPS[action.ship].missile,',
    },
  },
  {
    decision: '0441',
    suite: 'tests/run.test.ts',
    // A take pushed two of everything, as the bomb's row once did.
    broke: 'a take pushed two charges',
    guard: 'a take pushes exactly one charge',
    edit: {
      path: 'src/state/slices/run.ts',
      // ⚠️ Re-anchored by 0447, which builds every side's stack through `withStack`.
      find: '      const arsenal = withStack(state.arsenal, side, [...state.arsenal[side], action.special]);',
      replace: '      const arsenal = withStack(state.arsenal, side, [...state.arsenal[side], action.special, action.special]);',
    },
  },
  {
    decision: '0441',
    suite: 'tests/weapons.test.ts',
    // Two ships sharing a drawing: the roster is a recolour, not four ships.
    broke: 'the Firebird drawn as the estate',
    guard: 'THE HULLS: every ship has a hull at each tube stage',
    edit: {
      path: 'src/content/ships.ts',
      find: '      { base: SPRITE.firebird, hit: SPRITE.firebirdHit },',
      replace: '      { base: SPRITE.estate, hit: SPRITE.estateHit },',
    },
  },
  {
    decision: '0441',
    suite: 'tests/surge.test.ts',
    // The bomb pickup offering only the bomb: a ship could never buy another gun's special.
    broke: 'the bomb pickup offering only the bomb',
    guard: 'every gun’s own special is a face the bomb pickup shows',
    edit: {
      path: 'src/content/pickups.ts',
      find: "export const BOMB_KINDS: readonly SpecialKind[] = SPECIAL_KINDS.filter((k) => SPECIALS[k].side === 'gun');",
      replace: "export const BOMB_KINDS: readonly SpecialKind[] = SPECIAL_KINDS.filter((k) => k === 'bomb');",
    },
  },
];

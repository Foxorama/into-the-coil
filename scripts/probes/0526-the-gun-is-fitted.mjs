// The breaks behind docs/decisions/0526-the-gun-is-fitted.md.
//
// ⚠️ The special's four links again — the rule, the save, the shell, the run — and a fifth that is the
// readout: the one place a reader is told which gun is flying, since the icon is hidden from them.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0526',
    suite: 'tests/gun-slot.test.ts',
    broke: 'every gun open to every ship, won or not',
    guard: 'the estate’s lightning on the fighter, once both are won',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: 'export function gunOpen(state: HangarState, ship: ShipKind, from: ShipKind): boolean {\n  return plateOpen(state, ship, from);',
      replace: 'export function gunOpen(state: HangarState, ship: ShipKind, from: ShipKind): boolean {\n  return true;',
    },
  },
  {
    decision: '0526',
    suite: 'tests/gun-slot.test.ts',
    broke: 'a run flying its ship’s own gun whatever was fitted',
    guard: 'flies the fitted gun, from the fitted ship’s hardpoint',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        gun: action.gun ?? SHIPS[action.ship].weapon,',
      replace: '        gun: SHIPS[action.ship].weapon,',
    },
  },
  {
    decision: '0526',
    suite: 'tests/gun-slot.test.ts',
    broke: 'a saved gun fitted without asking whether its wins open it',
    guard: 'keeps the fitting, and refuses one its own wins do not open',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (from !== null && gunOpen(opened, kind, from)) gun[kind] = from;',
      replace: '    if (from !== null) gun[kind] = from;',
    },
  },
  {
    decision: '0526',
    suite: 'tests/gun-slot.browser.test.ts',
    broke: 'the shell beginning a run on the ship’s own gun, never the hangar’s',
    guard: 'the estate’s arc fitted to the fighter',
    edit: {
      path: 'src/app/mount.ts',
      find: 'ownSpecial(state.hangar.special[ship]), SHIPS[state.hangar.gun[ship]].weapon, state.hangar.rim[ship]);',
      replace: 'ownSpecial(state.hangar.special[ship]), SHIPS[ship].weapon, state.hangar.rim[ship]);',
    },
  },
  {
    decision: '0526',
    suite: 'tests/gun-floor.test.ts',
    // Red only through the estate's bonnet: the saucer's own ray clears the serpent by twenty seconds.
    broke: 'the serpent’s first phase over in under eight volleys of the ray fired from the estate',
    guard: 'every won ship that can borrow the ray, against every boss',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    gunWeights: { arc: 1, ray: 0.93 },',
      replace: '    gunWeights: { arc: 1 },',
    },
  },
  {
    decision: '0526',
    suite: 'tests/gun-slot.browser.test.ts',
    broke: 'the readout naming the ship’s own gun whatever it flies',
    guard: 'the estate’s arc fitted to the fighter',
    edit: {
      path: 'src/app/chrome.ts',
      find: '      livesGun = WEAPONS[ship.weapon].label;',
      replace: '      livesGun = WEAPONS[kind === undefined ? ship.weapon : SHIPS[kind].weapon].label;',
    },
  },
];

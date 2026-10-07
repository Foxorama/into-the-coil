// The breaks behind docs/decisions/0524-the-special-is-fitted.md.
//
// ⚠️ A fitting is four links long — the rule that opens it, the save that keeps it, the shell that
// hands it to the run, the run that opens on it — and a break in any one leaves the hangar saying one
// special and the run flying another.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0524',
    suite: 'tests/special-slot.test.ts',
    broke: 'every special open to every ship, won or not',
    guard: 'the shuriken’s special on the lightning gun, once both are won',
    edit: {
      path: 'src/state/slices/hangar.ts',
      // The signature with it, since 0526's gun slot says the same line under its own.
      find: 'export function specialOpen(state: HangarState, ship: ShipKind, from: ShipKind): boolean {\n  return plateOpen(state, ship, from);',
      replace: 'export function specialOpen(state: HangarState, ship: ShipKind, from: ShipKind): boolean {\n  return true;',
    },
  },
  {
    decision: '0524',
    suite: 'tests/special-slot.test.ts',
    broke: 'a run opening on its ship’s own special whatever was fitted',
    guard: 'opens on two of the fitted special',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        arsenal: startingArsenal(action.ship, action.difficulty, action.special ?? ownSpecial(action.ship)),',
      replace: '        arsenal: startingArsenal(action.ship, action.difficulty),',
    },
  },
  {
    decision: '0524',
    suite: 'tests/special-slot.test.ts',
    broke: 'a saved special fitted without asking whether its wins open it',
    guard: 'keeps the fitting, and refuses one its own wins do not open',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (from !== null && specialOpen(opened, kind, from)) special[kind] = from;',
      replace: '    if (from !== null) special[kind] = from;',
    },
  },
  {
    decision: '0524',
    suite: 'tests/special-slot.browser.test.ts',
    broke: 'the shell beginning a run on the ship’s own special, never the hangar’s',
    guard: 'the Thunderbolt’s storm fitted to the fighter',
    edit: {
      path: 'src/app/mount.ts',
      // Re-anchored by 0578, which laid the call a line an argument when it added the rack's tubes.
      find: '      state.settings.credits,\n      ownSpecial(state.hangar.special[ship]),',
      replace: '      state.settings.credits,\n      ownSpecial(ship),',
    },
  },
];

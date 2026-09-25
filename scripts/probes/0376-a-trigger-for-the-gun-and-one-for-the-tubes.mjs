// The breaks behind docs/decisions/0376-a-trigger-for-the-gun-and-one-for-the-tubes.md.
//
// ⚠️ Both are the one-stack design 0373 shipped, put back one line at a time — the design the
// player called "trash", and the one that let a charge be thrown through a weapon it was not earned from.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0376',
    suite: 'tests/bombs.test.ts',
    // Every charge onto the gun's stack, whatever it is: one stack again, under another name.
    broke: 'every charge pushed onto the gun’s stack',
    guard: 'each trigger throws its own side’s stack and never the other’s',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      const side = SPECIALS[action.special].side;',
      replace: "      const side: Side = 'gun';",
    },
  },
  {
    decision: '0376',
    suite: 'tests/bombs.test.ts',
    // A spend that takes from the gun whichever trigger was pressed.
    broke: 'a spend that empties the gun whichever trigger was pressed',
    guard: 'each trigger throws its own side’s stack and never the other’s',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      const spentFrom = state.arsenal[action.side];',
      replace: '      const spentFrom = state.arsenal.gun;',
    },
  },
];

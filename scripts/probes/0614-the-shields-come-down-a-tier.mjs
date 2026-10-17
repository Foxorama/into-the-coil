// The breaks behind docs/decisions/0614-the-shields-come-down-a-tier.md.
//
// Each one puts a tier's shell back as 0355 had it, and names the guard that has to go red.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0614',
    suite: 'tests/tier-shell.test.ts',
    // Savior back on the hull: *"start each level with 1 shield"* undone.
    broke: 'a Savior life opening on the hull',
    guard: 'THE ASK: Legend opens every life full',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    shellOpen: 1,\n    shellCap: 3,',
      replace: '    shellOpen: 0,\n    shellCap: 3,',
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
      find: '    shellOpen: 0,\n    shellCap: 3,\n    // One void',
      replace: '    shellOpen: 0,\n    shellCap: 0,\n    // One void',
    },
  },
];

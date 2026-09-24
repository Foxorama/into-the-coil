// An end boss takes its fire with it — docs/decisions/0366-an-end-boss-takes-its-fire-with-it.md
//
// Every guard 0366 adds, broken on purpose. `node scripts/prove-guard.mjs 0366`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0366',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ THE END BOSS'S FIRE LEFT ON THE FIELD, which is what shipped: a wall thrown in the gyre's
      still room stands still in the world, and the camera and then the burn drive the ship into it.
    */
    broke: 'the end boss’s fire left on the field, so a wall thrown in a still room waits for the ship',
    guard: 'THE REPORTED ONE: a wall still on the field when the gyre dies does not wait for the ship',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (w.fight === 1) cancelFire(w);',
      replace: '      if (w.fight === 2) cancelFire(w);',
    },
  },
];

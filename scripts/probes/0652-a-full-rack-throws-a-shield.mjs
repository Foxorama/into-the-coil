// The breaks behind docs/decisions/0652-a-full-rack-throws-a-shield.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0652',
    suite: 'tests/pickups.test.ts',
    // The swap never drawn: a full rack's missile is always a supercharge, as before 0652.
    broke: 'a full rack whose missiles never come up shields',
    guard: 'THE ASK, ON THE MID-BOSS’S THROW',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (!w.pickupRng.bool(swap.share)) return kind;',
      replace: '  if (swap.share >= 0) return kind;',
    },
  },
  {
    decision: '0652',
    suite: 'tests/pickups.test.ts',
    // The mid-boss's throw swaps and the level's own pickups do not.
    broke: 'a level’s pickups that skip the swap',
    guard: 'THE ASK, ON A LEVEL’S OWN PICKUPS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const offered = fullAs(w, drawn);',
      replace: '  const offered = drawn;',
    },
  },
];

// A boss is fought to the end — docs/decisions/0260-a-boss-is-fought-to-the-end.md
//
// Every guard 0260 adds, broken on purpose. `node scripts/prove-guard.mjs 0260`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0260',
    suite: 'tests/level.test.ts',
    /*
      A real boss back at 0247's health: twenty-three seconds at max weapons on the tuned tier.

      ⚠️ **RE-ANCHORED BY 0307 FROM THE SERPENT TO THE EAGLE, BECAUSE THIS LINE NO LONGER READS THE
      SERPENT.** Its body is armour, so `health / FASTEST` means nothing for it and the guard skips it;
      the serpent's forty seconds are held flown, and `scripts/probes/0307-*.mjs` breaks that. The
      break here is the same one on the next boss the arithmetic still describes.
    */
    broke: 'the hellkite authored back at half its health, so the fight is over in twenty-three seconds',
    guard: '0260 — a real boss lasts forty seconds at max weapons',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    health: 1520,',
      replace: '    health: 760,',
    },
  },
  {
    decision: '0260',
    suite: 'tests/level.test.ts',
    // The gyre's curtain back to the second half of the fight.
    broke: 'the gyre’s first wall put back to half health, which is the second half of the fight',
    guard: '0260 — the gyre throws its first wall inside six seconds',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    uncoil: { from: 0.9, every: 0.1, gap: 3, at: 26, hole: 14, spin: true },',
      replace: '    uncoil: { from: 0.5, every: 0.1, gap: 3, at: 26, hole: 14, spin: true },',
    },
  },
];

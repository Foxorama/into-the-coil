// The fish wears its fire — docs/decisions/0395-the-fish-wears-its-fire.md
//
// Every guard 0395 adds or takes over, broken on purpose. `node scripts/prove-guard.mjs 0395`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0395',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE FIRE LAID UNTURNED AGAIN, WHICH IS WHAT THE LEAP LOOKED LIKE BEFORE. On station it is
      invisible — the hull's heading is zero there too — so nothing but a banking hull can see it.
    */
    broke: 'the fire laid at heading zero while the fish banks through its leap',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.bossBody.size === 0) {\n      flame.turn = head.turn;\n      flame.prevTurn = head.prevTurn;\n    }\n',
      replace: '',
    },
  },
  {
    decision: '0395',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE RIBBONS SLID AFT OFF THE ANIMAL: the same ribbons, twisting the same way, every one of
      them behind the fish and none of them passing under it — fire NEAR the animal rather than on it,
      which is the cloud beside the fish the trails guard names.
    */
    broke: 'the ribbons slid aft off the animal, so the fire is beside the fish rather than wound round it',
    guard: 'THE ASKED-FOR ONE: the animal TRAILS',
    edit: {
      path: 'src/render/bake.ts',
      find: '    return [(x + nx * off) * fish, (y + ny * off) * fish];',
      // Past the stump at 0.8, so no ribbon starts under the flesh — 1.4 left the contour's root on the wing.
      replace: '    return [(x + nx * off + 2.2) * fish, (y + ny * off) * fish];',
    },
  },
];

// The serpent has menace — docs/decisions/0277-the-serpent-has-menace.md
//
// Every guard 0277 adds, broken on purpose. `node scripts/prove-guard.mjs 0277`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0277',
    suite: 'tests/serpent.test.ts',
    // The muzzle put back where it was: the middle of the body, which is what was reported.
    broke: 'a boss throwing from its hull’s centre again, which is the body coughing',
    guard: 'THE MOUTH: the acid and the void leave the serpent’s SKULL, and not the middle of its body',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const muzzleAlong = boss.along + (row.muzzle?.along ?? 0);',
      replace: '  const muzzleAlong = boss.along;',
    },
  },
  {
    decision: '0277',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE ROW EMPTIED RATHER THAN THE CODE BROKEN, which is the other half of the claim: the guard
      has to fail when the TABLE stops naming a mouth, not only when the painter stops reading it.
    */
    broke: 'the serpent’s row no longer naming a mouth, so the table forgets where its face is',
    guard: 'THE MOUTH: the acid and the void leave the serpent’s SKULL, and not the middle of its body',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    muzzle: { along: -24, across: 1 },',
      replace: '    muzzle: null,',
    },
  },
  {
    decision: '0277',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE OLD TAIL HOOK PUT BACK — the one the report named. Three samples reversing inside the
      room the box has left is a sixty-degree turn on a body an eighth of the frame thick, which is a
      kink and not a curve.
    */
    broke: 'the serpent’s tail hooked back on itself again, which is a twist no spine could make',
    guard: '0264 — THE HEADS',
    edit: {
      path: 'src/render/bake.ts',
      find: '  [0.87, 0.52],\n  [0.955, 0.575],\n  [1.02, 0.6],\n];',
      replace: '  [0.9, 0.5],\n  [0.99, 0.28],\n  [1.02, 0.04],\n];',
    },
  },
  {
    decision: '0277',
    suite: 'tests/accents.test.ts',
    // The aura let off its leash: a halo that runs into the next bitmap in the atlas.
    broke: 'the serpent’s aura swelling by a constant, so its thinnest end runs off its own tile',
    guard: 'and a translucent mark — a plume, a halo — stays inside the sprite’s own box',
    edit: {
      path: 'src/render/bake.ts',
      find: '    const out = (i: number): number => serpentHalf(i) * (1 + swell) + lift;',
      // ⚠️ ×26 and not ×12: the tail TRAILS now rather than running down the screen, so the halo's
      // widest reach moved and a flat swell of the old size no longer leaves the tile. The break has
      // to stay bigger than the thing it is breaking.
      replace: '    void swell;\n    const out = (i: number): number => serpentHalf(i) + lift * 26;',
    },
  },
];

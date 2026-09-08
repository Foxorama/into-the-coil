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
    // The aura let off its leash: a halo that runs into the next bitmap in the atlas.
    broke: 'the serpent’s aura swelling by a constant, so its thinnest end runs off its own tile',
    guard: 'and a translucent mark — a plume, a halo — stays inside the sprite’s own box',
    edit: {
      path: 'src/render/bake.ts',
      find: '    const out = (i: number): number => serpentHalf(i) * (1 + swell) + lift;',
      replace: '    void swell;\n    const out = (i: number): number => serpentHalf(i) + lift * 12;',
    },
  },
];

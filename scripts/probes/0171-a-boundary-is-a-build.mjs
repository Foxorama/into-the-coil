// The breaks behind docs/decisions/0171-a-boundary-is-a-build.md.
//
// ⚠️ THE FIRST ONE IS THE DEFECT PUT BACK, AND IT IS THE STATE THE GAME SHIPPED IN FOR ITS WHOLE
// LIFE. Every arrival on one downbeat is what *"it just jumps"* means, and three existing guards over
// the same boundary — 0164's roles, 0166's magnitude, 0167's duck floor — are green over it, because
// not one of them has a time axis in it.
//
// ⚠️ THE SECOND IS THE ONE THAT WOULD HAVE BEEN EASY TO GET BACKWARDS AND HARD TO HEAR. A build that
// runs from the part down to the bed is still a stagger, still spreads over four bars, and still
// passes the *no boundary is a step* guard — it is just a decrescendo wearing a build's shape. What
// separates them is the order, which is `MUSIC_ROLES`' and not a new opinion.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0171',
    suite: 'tests/music.test.ts',
    broke: 'every arrival back on the boundary downbeat, which is what a section change did until today',
    guard: 'THE REPORTED ONE: no boundary in any place delivers every arrival at one instant',
    edit: {
      path: 'src/app/music.ts',
      find: 'export const BUILD_BARS = 3;',
      replace: 'export const BUILD_BARS = 0;',
    },
  },
  {
    decision: '0171',
    suite: 'tests/music.test.ts',
    broke: 'the build running down the arrangement instead of up, so the part lands first and the bed last',
    guard: 'and the arrivals go up the arrangement, so what a place asks you to FOLLOW lands last',
    edit: {
      path: 'src/app/music.ts',
      find: '      rank(a.layer) - rank(b.layer) ||',
      replace: '      rank(b.layer) - rank(a.layer) ||',
    },
  },
];

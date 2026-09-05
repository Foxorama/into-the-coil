// The guns answer the third play-test — docs/decisions/0239-the-guns-answer-the-third-play-test.md
//
// Every guard 0239 adds, broken on purpose. `node scripts/prove-guard.mjs 0239`.

export const PROBES = [
  {
    decision: '0239',
    suite: 'tests/weapons.test.ts',
    // The arc's face back in the pickup ink — the reported picture, restored exactly.
    broke: 'the arc’s face given the pickup ink again, so two faces of the weapon pickup share a colour',
    guard: 'THE INKS: no two faces of one pickup',
    edit: {
      path: 'src/render/bake.ts',
      find: "  pickupArc: 'player',",
      replace: "  pickupArc: 'pickup',",
    },
  },
  {
    decision: '0239',
    suite: 'tests/weapons.test.ts',
    // The seeker's face back in the pickup ink — the reported picture, restored exactly.
    broke: 'the seeker’s face given the pickup ink again, so the missile pickup’s two faces share a colour',
    guard: 'THE INKS: no two faces of one pickup',
    edit: {
      path: 'src/render/bake.ts',
      find: "  pickupSeeker: 'ally',",
      replace: "  pickupSeeker: 'pickup',",
    },
  },
  {
    decision: '0239',
    suite: 'tests/weapons.test.ts',
    // The first face in a weapon's ink rather than the pickup's, so a pickup that has just appeared is not one.
    broke: 'the first face of the weapon pickup given the pulse’s ink, so a fresh pickup reads as a bullet',
    guard: 'THE INKS: no two faces of one pickup',
    edit: {
      path: 'src/render/bake.ts',
      find: "  pickupWeapon: 'pickup',",
      replace: "  pickupWeapon: 'bullet',",
    },
  },
];

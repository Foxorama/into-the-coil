// The guns answer the third play-test — docs/decisions/0239-the-guns-answer-the-third-play-test.md
//
// Every guard 0239 adds, broken on purpose. `node scripts/prove-guard.mjs 0239`.

export const PROBES = [
  {
    decision: '0239',
    suite: 'tests/weapons.test.ts',
    // The arc's face in the pulse's ink — two faces of one pickup in one colour, which is the
    // reported picture. ⚠️ Re-aimed by 0240: it used to be the pickup ink, and since the pulse's own
    // face wears the pulse's orange, the pickup ink would no longer collide with anything.
    broke: 'the arc’s face given the pulse’s ink, so two faces of the weapon pickup share a colour',
    guard: 'THE INKS: no two faces of one pickup',
    edit: {
      path: 'src/render/bake.ts',
      find: "  pickupArc: 'player',",
      replace: "  pickupArc: 'bullet',",
    },
  },
  {
    decision: '0239',
    suite: 'tests/weapons.test.ts',
    // The seeker's face in the missile's ink — the missile pickup's two faces in one colour, which
    // is the reported picture. ⚠️ Re-aimed by 0240 on the arc probe's terms above.
    broke: 'the seeker’s face given the missile’s ink, so the missile pickup’s two faces share a colour',
    guard: 'THE INKS: no two faces of one pickup',
    edit: {
      path: 'src/render/bake.ts',
      find: "  pickupSeeker: 'ally',",
      replace: "  pickupSeeker: 'bullet',",
    },
  },
  // ⚠️ A third probe — the first face given the pulse's ink — was retired by 0240 with the clause it
  // reddened: the pulse's face IS in the pulse's ink now, at the fourth play-test's ask.
];

// The picture answers the second play-test — docs/decisions/0238-the-picture-answers-the-second-play-test.md
//
// Every guard 0238 adds, broken on purpose. `node scripts/prove-guard.mjs 0238`.

export const PROBES = [
  {
    decision: '0238',
    suite: 'tests/blades.test.ts',
    // The blade put back in the pulse's ink — the reported picture, restored exactly.
    broke: 'the blade drawn in the pulse’s ink again, so a ring of blades is a ring of bullets',
    guard: 'THE STEEL: a blade wears an ink of its own',
    edit: {
      path: 'src/render/bake.ts',
      find: "  shuriken: 'blade',\n  shurikenTurn: 'blade',",
      replace: "  shuriken: 'bullet',\n  shurikenTurn: 'bullet',",
    },
  },
  {
    decision: '0238',
    suite: 'tests/blades.test.ts',
    // The two turns in two inks, so the star flickers between colours as it spins.
    broke: 'the blade’s other turn given a different ink, so it changes colour as it spins',
    guard: 'THE STEEL: a blade wears an ink of its own',
    edit: {
      path: 'src/render/bake.ts',
      find: "  shurikenTurn: 'blade',",
      replace: "  shurikenTurn: 'impact',",
    },
  },
  {
    decision: '0238',
    suite: 'tests/seekers.test.ts',
    // The seeker put back in the pulse's ink — the reported picture, restored exactly.
    broke: 'the seeker drawn in the pulse’s ink again, so the two missiles differ by a fin',
    guard: 'THE TWO TUBES: a seeker is told from a missile',
    // ⚠️ Re-anchored by 0241: the seeker wears the ally ink now, not the ship's.
    edit: {
      path: 'src/render/bake.ts',
      find: "  seeker: 'ally',",
      replace: "  seeker: 'bullet',",
    },
  },
];

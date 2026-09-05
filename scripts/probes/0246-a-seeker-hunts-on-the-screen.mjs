// A seeker hunts on the screen, and burns out — docs/decisions/0246-a-seeker-hunts-on-the-screen.md
//
// Every guard 0246 adds, broken on purpose. `node scripts/prove-guard.mjs 0246`.

export const PROBES = [
  {
    decision: '0246',
    suite: 'tests/seekers.test.ts',
    // The box's leading edge pushed ten views out: a seeker sees a body the screen does not again.
    broke: 'the hunt reaching ten screens ahead, so a seeker turns toward a body the player cannot see',
    guard: 'THE SCREEN: a body beyond the leading edge',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const to = w.cameraAlong + w.view.alongSpan;\n',
      replace: '  const to = w.cameraAlong + w.view.alongSpan * 10;\n',
    },
  },
  {
    decision: '0246',
    suite: 'tests/seekers.test.ts',
    // No fuse: a seeker that is still turning lives until something kills it.
    broke: 'the fuse authored to never, so a seeker that cannot catch its body hunts forever',
    guard: 'THE FUSE: a seeker burns out',
    edit: {
      path: 'src/content/missiles.ts',
      find: '    seek: 0.09,\n    fuse: 90,',
      replace: '    seek: 0.09,\n    fuse: 0,',
    },
  },
  {
    decision: '0246',
    suite: 'tests/seekers.test.ts',
    // The puff removed: the missile goes out and the picture says nothing.
    broke: 'a seeker going out with no puff, so the picture never mentions it',
    guard: 'THE FUSE: a seeker burns out',
    edit: {
      path: 'src/app/frame.ts',
      find: "    if (m.lifeFor === 1) flare(w, m.along + m.velAlong, m.across + m.velAcross, 'spark');\n",
      replace: '',
    },
  },
  {
    decision: '0246',
    suite: 'tests/seekers.test.ts',
    // The straight missile given the seeker's fuse: a missile that no longer reaches the far edge.
    broke: 'the straight missile put on a fuse too, so it goes out short of the far edge',
    guard: 'and the straight missile has no fuse',
    edit: {
      path: 'src/content/missiles.ts',
      find: '    seek: 0,\n    fuse: 0,',
      replace: '    seek: 0,\n    fuse: 30,',
    },
  },
];

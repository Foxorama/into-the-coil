// The breaks behind docs/decisions/0302-the-bolt-shows-its-reach.md.
//
// ⚠️ Three things landed and each is broken on its own: the DRAWING (a dry bolt drawn at the whole
// reach, so the gun states its range), the FALLOFF (each jump reaching a share of the one before),
// and the TABLE that says a chaining weapon has to spend itself at all. Every break here is the
// previous behaviour put back — which is the shape a probe wants, because that behaviour compiled,
// shipped and was reported.
//
// ⚠️ **THE CEILING ON THE TWIG HAS NO PROBE, BECAUSE IT HAS NO GUARD.** The decision says why: the
// figure a bolt cuts is a look the player judges by playing, and the two guards this project wrote
// for it were both a threshold answering a question in advance —
// docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md is the standing rule about those.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0302',
    suite: 'tests/weapons.test.ts',
    /*
      The dry bolt drawn at 0.55 of its reach again — the exact line 0302 deleted, and the reason
      the report says the range is not on screen. It is invisible to every model guard in the
      repository: the gun still reaches exactly as far as it did, and only the picture lies.
    */
    broke: 'the dry bolt drawn at a share of its reach again, so the line stops being the range',
    guard: 'THE RANGE, in pixels',
    edit: {
      path: 'src/app/frame.ts',
      find: '      toAlong = fromAlong + reach;',
      replace: '      toAlong = fromAlong + reach * 0.55;',
    },
  },
  {
    decision: '0302',
    suite: 'tests/weapons.test.ts',
    // The chain no longer spending itself: every jump the length of the first hit, which is the
    // search-the-whole-screen volley 0297 was reported for.
    broke: 'the falloff dropped from the loop, so every jump reaches as far as the first hit',
    guard: 'THE FALLOFF',
    edit: {
      path: 'src/app/frame.ts',
      find: '    reach *= w.weapon.falloff;',
      replace: '    reach *= 1;',
    },
  },
  {
    decision: '0302',
    suite: 'tests/weapons.test.ts',
    // And the same thing done in the table rather than in the code — a chaining row authored to
    // keep its whole reach at every link. The frame is untouched and correct; the content is not.
    broke: 'the arc’s falloff authored at 1, so the row asks for the chain that was reported',
    guard: 'a ladder per rung',
    edit: {
      path: 'src/content/weapons.ts',
      find: '    falloff: 0.6,',
      replace: '    falloff: 1,',
    },
  },
];

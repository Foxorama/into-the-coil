// The breaks behind docs/decisions/0118-the-mix-has-a-width.md.
//
// ⚠️ THE FIRST TWO PUT BACK STATES THE GAME HAS BEEN IN FOR ITS WHOLE LIFE — mono, and a low end
// free to wander. The third is the one that matters most and is the easiest to write by accident: a
// pan table of zeros passes every bound and buys nothing, which is the shape of vacuous guard 0116
// already found once in this repository.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0118',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ A PANNED LOW END. It spends headroom on one side, arrives in a room as the same
      non-directional thump, and collapses badly to mono — and the guard is driven off the BAKED
      AUDIO, so it goes on being true when a layer is re-voiced. A typed list of layer names would
      have passed this break.
    */
    /*
      ⚠️ THE FIRST VERSION OF THIS PROBE PANNED `groove` AND WENT RED ON THE WRONG TEST — which is the
      more useful outcome, because it says the guard does not cover the bass line. Measured, `groove`
      is 18% in `low` and not low-HEAVY at all: it is a bass line in the sense of a part, not in the
      sense of a spectrum. `sub` is what this guard is actually about, and aiming the break at it is
      how that was established rather than assumed.
    */
    broke: 'the sub pushed off centre, so the deepest thing in the game is panned',
    guard: 'THE ONE THAT IS A MEASUREMENT AND NOT A TASTE: a layer whose weight is low is centred',
    edit: {
      path: 'src/content/music.ts',
      find: '  sub: 0,\n  engine: 0,\n  perc: -0.45,',
      replace: '  sub: -0.5,\n  engine: 0,\n  perc: -0.45,',
    },
  },
  {
    decision: '0118',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ HARD PANNING, which is one character and looks like more width. A layer at ±1 is a layer a
      player with one earbud in simply does not have —
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`'s *"there is one game and it is the
      loud one"* is not served by a mix that is missing a part depending on how you listen.
    */
    broke: 'a layer pushed hard to one side, so half the mix is gone in one earbud',
    guard: 'and nothing is hard panned, because a player may have one earbud in',
    edit: {
      path: 'src/content/music.ts',
      find: '  hook: 0.55,',
      replace: '  hook: 1,',
    },
  },
  {
    decision: '0118',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE VACUOUS ONE, AND IT IS THE POINT OF THE DECISION. A table of zeros satisfies every bound
      above — nothing is low-panned, nothing is hard-panned, the mix does not lean — and the game is
      mono in everything but the node graph. `docs/decisions/0116-the-rig-plays-the-level.md` found
      exactly this shape of guard once already: one that holds a limit nobody is near.
    */
    /*
      ⚠️ THE FIRST VERSION ZEROED TWO LAYERS AND REPORTED STILL GREEN, which is correct: fourteen were
      still placed and the mix was still a mix. A break has to reach the thing the guard reads —
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`'s half about the BREAK, which this
      session has now hit three times.
    */
    broke: 'every layer centred, so the graph is stereo and the mix is not',
    guard: 'THE POINT OF IT: the field is actually used, and the two sides are balanced',
    edit: {
      path: 'src/content/music.ts',
      find:
        '  perc: -0.45,\n  chords: 0.2,\n  groove: 0,\n  arp: -0.55,\n  ride: 0.5,\n  call: -0.3,\n' +
        '  hook: 0.55,\n  drive: 0.25,\n  toll: -0.5,\n  crash: -0.35,\n  dread: 0.15,\n  lead: 0.3,\n  counter: -0.4,',
      replace:
        '  perc: 0,\n  chords: 0,\n  groove: 0,\n  arp: 0,\n  ride: 0,\n  call: 0,\n' +
        '  hook: 0,\n  drive: 0,\n  toll: 0,\n  crash: 0,\n  dread: 0,\n  lead: 0,\n  counter: 0,',
    },
  },
  {
    decision: '0118',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE REPORTED DEFECT, PUT BACK. `arp` and `hook` are what `push` and `surge` open — the two
      rungs the report calls *"less noticeable because the ongoing beat and melody is strong and the
      additions are subtle"*. Stacked in one place they compete on level alone, which is the masking
      six rounds of gains were spent on.
    */
    broke: 'the riff moved on top of the sixteenths, so nothing but level separates the two things a rung opens',
    guard: 'and the two layers most likely to mask each other are not in the same place',
    edit: {
      path: 'src/content/music.ts',
      find: '  hook: 0.55,',
      replace: '  hook: -0.55,',
    },
  },
];

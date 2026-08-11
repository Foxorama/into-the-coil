// The breaks behind docs/decisions/0123-a-rung-changes-the-notes.md.
//
// ⚠️ THE FIRST PUTS BACK EXACTLY WHAT THE PLAYER REPORTED — a rung that replaces almost nothing.
// `surge` was 13% and `approach` was 2%, called "far too subtle" and "not noticeable at all"; both
// were legal under every guard the repository had, because every guard was about ADDING.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0123',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE REPORTED STATE. Putting the sixteenths back at `surge` means the rung opens three quiet
      things over a bed that keeps playing — 13% of the notes replaced, which the player heard as one
      change rather than three. Nothing about it was illegal before this decision.
    */
    /*
      ⚠️ THE FIRST VERSION OF THIS BREAK REMOVED `arp` FROM `RUNG_CLOSES` AND WENT RED ON THE WRONG
      TEST — the closure became undeclared, which 0120's guard catches first. A probe is one edit, and
      the declaration and the gain have to agree; so the break is aimed at what ARRIVES instead, which
      is the other half of the same quantity and needs no declaration to change.
    */
    /*
      ⚠️ AIMED AT `push`, WHERE THE ARRIVALS ARE THE WHOLE CHURN. The rungs above it get most of
      theirs from CLOSURES, and a closure cannot be broken by one edit — the gain and its declaration
      in `RUNG_CLOSES` have to agree, so removing either alone reddens 0120's guard instead. `push`
      closes nothing, so taking its two dense arrivals away is a clean 60% → 12%.
    */
    broke: 'the two dense things push opens taken away, so the clearest rung in the level replaces almost nothing',
    guard: 'THE REPORTED ONE: every rung replaces a real share of what is playing',
    edit: {
      path: 'src/content/music.ts',
      find: 'arp: 0.64, ride: 0.58, call: 0.68, hook: 0.64,',
      replace: 'arp: 0, ride: 0.58, call: 0.68, hook: 0,',
    },
  },
  {
    decision: '0123',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE LEITMOTIF HELD BACK, which is 0114's design and which the player has now heard and asked
      to be undone: *"the boss music gets good around phase 3 — this is where it should be starting."*
      The fight is 4.6s at max weapons on level one, so a rung that waits for 78% health is a rung
      that lasts one second.
    */
    broke: 'the leitmotif held back to bossPeak, so the fight opens sparse',
    guard: 'AND THE FIGHT OPENS AT ITS FULL ARRANGEMENT, which is where the player said it gets good',
    edit: {
      path: 'src/content/music.ts',
      find: 'stomp: 0.92, frenzy: 0.86, wraith: 0.8,',
      replace: 'stomp: 0.92, frenzy: 0.86, wraith: 0,',
    },
  },
  {
    decision: '0123',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE BOSS MADE SMALLER THAN A RUNG BELOW IT. The fight is the arrival and has to be the
      biggest thing that happens; without this a later mix pass could make `push` the loudest event in
      a level and nothing would say so. Closing the two layers the fight brings does it.
    */
    broke: 'the fight’s own drums closed, so the boss changes less than a rung of the level does',
    guard: 'and the fight is the largest change in the piece, because it is the arrival',
    edit: {
      path: 'src/content/music.ts',
      find: 'stomp: 0.92, frenzy: 0.86, wraith: 0.8, auraSlow: 1,',
      replace: 'stomp: 0, frenzy: 0, wraith: 0.8, auraSlow: 1,',
    },
  },
];

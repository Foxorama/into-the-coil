// The breaks behind docs/decisions/0134-the-place-keeps-the-games-pace.md.
//
// ⚠️ THE FIRST TWO ARE THE SHIPPED DEFECT, RESTORED. Ember Nebula's first version opened at 61 notes
// a bar against level one's 118 and put 31.5% of its energy under 300 Hz at `surge` against 40.0%,
// and every guard in the repository was green over it — a place half the speed of the game it plays
// under, shipped and merged. The edits below put the held pedal and the two-notes-a-bar drum back.
//
// ⚠️ THE THIRD IS THE GUARD THAT COULD NOT SEE ITS OWN SUBJECT. `no theme at any rung drives the bus
// past full scale` baked ONE set of loops with no theme in it and applied every theme's multipliers
// to level one's samples, so a place whose own material clipped was exactly what it could not catch.
// It ran green over the whole of 0132 without baking a note of it, and the break restores that.

// ⚠️ AND THE FLOOR BREAK IS RETIRED BY 0176. It retuned the processional out of the basement — 96 Hz
// to 880 — and reddened *every place has a bottom AND a top* while that floor was 28% of the energy
// under 300 Hz. 0176 re-derived it to 24% against the mix that ships, having measured that twelve
// place/rung pairs fell under 28 without one of them losing a decibel of bass, and Ember Nebula now
// clears the new number with the pedal broken.
//
// ⚠️ IT WAS TRIED HIGHER AND THE RESULT IS WHY THIS IS RETIRED RATHER THAN RE-AIMED. At 2600 Hz the
// suite went fully GREEN where 880 had at least reddened 0164 — a break getting bigger and reaching
// LESS is a sign the quantity is not the one being reasoned about, and 0044 says establish that
// rather than turn the dial. The other two breaks in this file still hold 0134's pace claim and its
// clipping claim.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0134',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ RE-AIMED BY 0172, AND THE REASON IS THE INTERESTING PART. This broke the UNDERCURRENT — the
      held pedal the report was written about — and `npm run prove` reported *went red, but on the
      wrong test*: with the pedal held, Ember Nebula sits at 93.9% of the base composition's pace
      against a 90% floor, so 0134's own guard correctly does not fire and two others do.

      ⚠️ THE PLACE GOT FASTER UNDERNEATH ITS OWN PROBE. docs/decisions/0172-a-place-opens-with-its-own-four.md
      opens `arp` at Ember Nebula's `run` — the mixture, 32 notes a bar, the largest single
      contributor there — expressly so the place could lose its kit and keep its pace. **That is the
      guard's subject being satisfied a different way**, which makes the old break insufficient rather
      than wrong.

      ⚠️ SO THE BREAK MOVES TO THE LAYER THAT NOW CARRIES THE PACE, which is the same claim aimed at
      the same rung: a fast layer becoming a slow one. It is the second time a probe in this file has
      been re-anchored for exactly this reason — the note under the next one records the first.
    */
    broke: 'the mixture held instead of running, which is the pace the report was written about',
    guard: '0134 — NO PLACE IS SUBSTANTIALLY SLOWER THAN THE BASE COMPOSITION, at any rung',
    edit: {
      path: 'src/content/nebula.ts',
      find: `  return [
    root, third, fifth, third,
    root + 12, third, fifth, root + 12,
    fifth, third, root, third,
    fifth, root + 12, fifth, third,
  ];`,
      replace: `  return [
    root, null, null, null,
    null, null, null, null,
    null, null, null, null,
    null, null, null, null,
  ];`,
    },
  },
  {
    decision: '0134',
    suite: 'tests/themes.test.ts',
    broke: 'the clipping guard baking one composition and applying every place’s mix to it',
    guard: 'and no theme at any rung drives the bus past full scale',
    edit: {
      path: 'tests/themes.test.ts',
      find: '      const loops = loopsAt(SAMPLE_RATE, theme);',
      replace: '      const loops = loopsAt(SAMPLE_RATE);',
    },
  },
];

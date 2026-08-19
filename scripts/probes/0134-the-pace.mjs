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
  /*
    ── THE PACE BREAK IS RETIRED WITH THE GUARD IT FIRED ───────────────────────────────────────────

    ⚠️ docs/decisions/0182-a-mix-number-has-no-band.md deleted `NO PLACE IS SUBSTANTIALLY SLOWER THAN
    THE BASE COMPOSITION`, which held every place within a tenth of level one's notes a bar at every
    rung. A ratio against the base makes the base a target, which is exactly what
    docs/decisions/0147-a-place-is-a-balance.md found and fixed for this file's OTHER floor — the low
    band, which became an absolute band and survives.

    ⚠️ AND THIS PROBE'S OWN HISTORY IS PART OF THE ARGUMENT. It was re-anchored twice in two days,
    the second time because docs/decisions/0172-a-place-opens-with-its-own-four.md made the place
    faster underneath it, and the bound itself was moved from 0.85 to 0.9 because at 0.85 both breaks
    reported STILL GREEN. docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md: a guard that
    keeps having to be relaxed — or tightened onto the shipped music — is not being refined.

    ⚠️ THE CLIPPING BREAK BELOW IS UNTOUCHED, and it is the half of 0134 that is about whether the
    sound works rather than about what shape it has.
  */

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

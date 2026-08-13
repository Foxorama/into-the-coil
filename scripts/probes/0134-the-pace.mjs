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

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0134',
    suite: 'tests/themes.test.ts',
    broke: 'the undercurrent held instead of running, which is the pace the report was written about',
    guard: '0134 — NO PLACE IS SUBSTANTIALLY SLOWER THAN THE BASE COMPOSITION, at any rung',
    edit: {
      path: 'src/content/nebula.ts',
      find: '  return [root, root + 12, fifth, root, root, fifth, root + 12, fifth];',
      replace: '  return [root, _, _, _, _, _, fifth, _];',
    },
  },
  {
    decision: '0134',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ ANCHORED ON THE MATERIAL AND NOT ON THE MIX, WHICH IS WHY IT SURVIVED 0147 AND ITS PREVIOUS
      ANCHOR DID NOT — docs/decisions/0147-a-place-is-a-balance.md. It was pinned to three of Ember
      Nebula's mix values and every one of them moved the first time a hand re-balanced the place.
      The floor of a place is where its lowest voice SITS, and an octave is a structural fact.

      ⚠️ THE PROCESSIONAL IS RETUNED OUT OF THE BASEMENT — 96 Hz becomes 880 — so the place keeps
      every note and every rhythm it had and loses the weight under them. That is *no deep bassy
      times* exactly.

      ⚠️ AND IT IS AN UNPITCHED VOICE ON PURPOSE, WHICH IS WHAT MAKES IT LAND ON THE RIGHT GUARD. A
      first attempt raised `sub`'s root three octaves and went red on 0136's ARC instead: a pitched
      break moves `pitchOf` as well as the band, and a probe that fires the wrong guard proves nothing
      about the one it names. `pitchOf` skips unpitched voices, so a drum's tuning is the low end and
      nothing else.
    */
    broke: 'the choir left with no floor under it, which is *no deep bassy times*',
    guard: 'and every place has a bottom AND a top, which is a band and used to be a race to the floor',
    edit: {
      path: 'src/content/nebula.ts',
      find: "      note: { wave: 'sine', from: 96, to: 36, seconds: 0.62,",
      replace: "      note: { wave: 'sine', from: 880, to: 640, seconds: 0.62,",
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

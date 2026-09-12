// The storm runs the whole body — docs/decisions/0310-the-storm-runs-the-whole-body.md
//
// Every guard 0310 adds, broken on purpose. `node scripts/prove-guard.mjs 0310`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0310',
    suite: 'tests/serpent.test.ts',
    // The state of `main`: two frames of six, which is nine of twenty-seven flames and a row of sparks.
    broke: 'the lightning back on two frames of six, which is a third of the body at any instant',
    guard: 'THE REPORTED ONE: the lightning is on nearly every frame, so it is across the whole body',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const STORM_LIT: readonly number[] = [0, 1, 2, 3, 4];',
      replace: 'const STORM_LIT: readonly number[] = [0, 3];',
    },
  },
  {
    decision: '0310',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ AND THE OTHER END OF IT, WHICH IS THE HALF A COUNT ALONE WOULD MISS. Every frame lit is a
      constant crackle and the word asked for was *flickers* — nothing goes out, so the animal glows
      rather than flickering. It is the change a hand reaching for *more lightning* would make.
    */
    broke: 'every frame lit, so nothing ever goes out and the crackle is a glow',
    guard: 'THE REPORTED ONE: the lightning is on nearly every frame, so it is across the whole body',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const STORM_LIT: readonly number[] = [0, 1, 2, 3, 4];',
      replace: 'const STORM_LIT: readonly number[] = [0, 1, 2, 3, 4, 5];',
    },
  },
  {
    decision: '0310',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ 0305's OWN LADDER, WHICH IS THE THING THAT DID NOT READ. Half and then a third: the escalation
      shrinks exactly where it is meant to peak, and every number in the file is still a number somebody
      chose. What the guard holds is the SHAPE — no step smaller than the one before it.
    */
    broke: 'the horns back on 0305’s ladder, whose last step is smaller than its first',
    guard: 'and the HORNS are longer again, by more than the step before them',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const HORN_GROWTH = { 2: 1.5, 3: 3 } as const;',
      replace: 'const HORN_GROWTH = { 2: 1.5, 3: 2 } as const;',
    },
  },
  {
    decision: '0310',
    suite: 'tests/serpent.test.ts',
    // No flare authored at all: the crown never charges, which is the state before this decision.
    broke: 'the flare taken off the phase, so the crown never charges before a strike',
    guard: 'and the CROWN flares for half a second before a strike, and at no other time',
    edit: {
      path: 'src/content/bosses.ts',
      find: '            flare: [SPRITE.serpentFlare0, SPRITE.serpentFlare1, SPRITE.serpentFlare2],\n',
      replace: '',
    },
  },
  {
    decision: '0310',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE TELL THAT IS ALWAYS ON, WHICH IS NO TELL. A flare held for the whole phase satisfies *the
      horns flare* and says nothing about when the lightning is coming — and it is the cheapest possible
      version of this feature, so it is the one worth being able to detect.
    */
    broke: 'the crown flaring all the time rather than before a strike',
    guard: 'and the CROWN flares for half a second before a strike, and at no other time',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (bolt.lifeFor > BOLT_STEPS && bolt.lifeFor <= BOLT_STEPS + FLARE_STEPS) charging = true;',
      replace: '      charging = true;\n      if (bolt.lifeFor < 0) charging = false;',
    },
  },
  {
    decision: '0310',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ AND THE FLARE ON THE WHOLE ANIMAL, WHICH IS THE OTHER WAY TO LOSE IT. Every flame wearing the
      discharge is the creature getting brighter for half a second; the tell is that the CROWN does
      something the body does not.
    */
    broke: 'every flame wearing the crown’s discharge, so the tell is the animal getting brighter',
    guard: 'and the CROWN flares for half a second before a strike, and at no other time',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const set = charging && on === head && flare !== undefined ? flare : aura.frames;',
      replace: '    const set = charging && flare !== undefined ? flare : aura.frames;',
    },
  },
  {
    decision: '0310',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE ONE THE SHEET COULD NOT SHOW AND THE ONE THAT WAS ACTUALLY WRONG. The discharge is placed on
      the grown horn tips by carrying a point between two tiles of different extents, one blitted at a
      swell — and the draft that assumed the body diameter was 11 put it where the horns are not. The
      bake and the row agreeing is what this holds, and the swell is the number they have to agree on.
    */
    broke: 'the bake assuming a different flame size from the row, so the discharge is not on the horns',
    guard: 'and the flare is drawn where the horns are, which is the one thing the bake has to assume',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const FLARE_SWELL = 15 / SERPENT_BODY_DIAMETER;',
      replace: 'export const FLARE_SWELL = 15 / 11;',
    },
  },
];

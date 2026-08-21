// The breaks behind docs/decisions/0188-a-place-owns-four-slots.md.
//
// ⚠️ THE FIRST TWO ARE THE HALF-DECLARED SLOT, WHICH IS THE ONLY WAY THIS MECHANISM CAN GO WRONG
// QUIETLY. A slot nobody touches is silent and harmless; a slot a place OPENS without stating its
// instrument, or without saying what it is, sounds — or fails to — with nothing checking it. The role
// half is the one a diff hides: `roleOf` returns null, `adriftAt` skips the layer, and 0164 never
// asks whether anybody can hear it, which is the state 0172 left seven layer-rungs in.
//
// ⚠️ AND THE THIRD IS THE MECHANISM ITSELF BEING UNEXERCISED, which is `rungIn`'s own lesson one
// table over: with every slot empty, a `roleOf` that ignored OWN_ROLES entirely would answer
// correctly for all seven places and every other assertion here would pass.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0188',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE ROLE TAKEN AWAY FROM A SLOT THAT STILL SOUNDS. Saurian Belt goes on opening `ownA` at
      `surge` and `approach`, the raptor call goes on playing, and 0164 stops being able to see it —
      the layer is outside the arrangement's promise entirely.
    */
    broke: 'an own slot opened with no role, so the layer sounds and 0164 cannot see it',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: a slot a place OPENS has voices and a role at that rung',
    edit: {
      path: 'src/content/arrangement.ts',
      // Re-anchored by 0189, which opened `ownB` at every rung and gave it a role at each.
      find:
        "  saurian: {\n" +
        "    run: { ownB: 'pulse' },\n" +
        "    push: { ownA: 'counter', ownB: 'pulse' },\n" +
        "    surge: { ownA: 'counter', ownB: 'pulse' },\n" +
        "    approach: { ownA: 'counter', ownB: 'pulse' },\n" +
        "    boss: { ownB: 'pulse' },\n" +
        "    bossPeak: { ownB: 'pulse' },\n" +
        "  },",
      replace: '  saurian: {},',
    },
  },
  {
    decision: '0188',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE INSTRUMENT TAKEN AWAY FROM A SLOT THAT STILL OPENS. The ladder still asks for `ownA` at
      two rungs and there is nothing to sound — a gain node ramping over silence, which is 0090's seam
      arriving through the newest door in the building.
    */
    broke: 'an own slot opened with no voices, so a gain ramps over silence',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: a slot a place OPENS has voices and a role at that rung',
    edit: {
      path: 'src/content/saurian.ts',
      // ⚠️ THE KEY IS RENAMED RATHER THAN THE ARRAY EMPTIED, so the voices stay in the file and the
      // break is one identifier. `voicesOf` answers empty for `ownA` and the ladder goes on opening it.
      find: '  ownA: [',
      replace: '  ownAUnused: [',
    },
  },
  {
    decision: '0188',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ EVERY SLOT EMPTY, WHICH IS THE STATE THIS DECISION SHIPPED IN FOR ABOUT AN HOUR. The tables,
      the readers and the guards are all there and nothing exercises any of them.
    */
    broke: 'no place filling a slot, so the whole mechanism is guarded by nothing',
    guard: 'AND AT LEAST ONE PLACE ACTUALLY FILLS ONE, or this whole mechanism is guarded by nothing',
    edit: {
      path: 'src/content/themes.ts',
      /*
        ⚠️ IT WAS THE SAME ONE-IDENTIFIER EDIT AS THE BREAK ABOVE AND 0189 MADE IT A WRONG TEST.
        Renaming `ownA` used to leave zero filled slots in the whole game; Saurian Belt fills
        `ownB` as well now — the jungle break — so the claim *no place fills one* stayed TRUE, this
        guard stayed GREEN, and `npm run prove` reported the break landing on somebody else's
        assertion. **A probe can be stranded by a decision that never touches it**, which is
        docs/decisions/0019-a-probe-must-be-seen-to-apply.md's subject reached from a third side: the
        anchor still applied, the code still broke, and the claim quietly stopped being about it.

        ⚠️ SO IT TAKES THE WHOLE TABLE AWAY RATHER THAN ONE SLOT, which is the only edit that still
        makes the sentence false — and it is a plausible one: a place's `voices` line is one
        identifier, and dropping it is how a place goes back to the base composition by accident.
      */
      find: '    voices: SAURIAN_VOICES,',
      replace: '    voices: {},',
    },
  },
];

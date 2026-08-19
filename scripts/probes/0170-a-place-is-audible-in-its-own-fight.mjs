// The breaks behind docs/decisions/0170-a-place-is-audible-in-its-own-fight.md.
//
// ⚠️ BOTH BREAKS ARE THE DEFECT PUT BACK, AND NEITHER IS A GAIN THE GUARD ASKED FOR. 0170 raised
// VOICE gains in src/content/core.ts because a mix multiplier could not reach the two layers the
// Black Heart is named for — so the break that matters is the material going back down, not a
// multiplier moving.
//
// ⚠️ THE SECOND ONE IS THE INTERESTING HALF. `LEADS.core.boss` said `drive`, which is near the top
// of every place in the game; with the howl and the tremolo audible, `drive` reads adrift at `boss`
// against the `part` target being the lead gives it. The first attempt at this change treated that
// as a mix fault and raised `drive` back — which would have undone the whole pass to keep a claim
// nothing had checked. What core's own fight follows is `frenzy`.

// ⚠️ AND ITS FIRST BREAK IS RETIRED BY 0176, WHICH IS WORTH MORE THAN THE PROBE WAS. It put the
// howl's material back at the gain that left it 17 dB down, and the suite stays GREEN — at 0.075, and
// still at 0.012. The re-based balance was DERIVED FROM the material by a solver targeting a role
// margin, so a layer's mix scale already carries the inverse of how quiet its voice is: dropping the
// voice cannot push it under a floor the table was built to hold it above.
//
// ⚠️ THAT DOES NOT WEAKEN 0170 — IT IS 0170'S OWN FINDING ARRIVING AS A MECHANISM. *A place's named
// character is a voice gain* was true when the mix was a hand's tint; under a solved balance the two
// are one quantity, and the second break below still holds the half that is about the ARRANGEMENT
// rather than the material. A break re-aimed until something reddens would be theatre —
// docs/decisions/0019-a-probe-must-be-seen-to-apply.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0170',
    suite: 'tests/themes.test.ts',
    broke: "core following `drive` in its own boss fight again — a layer loud in all seven places",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/arrangement.ts',
      find: "  core: { run: 'engine', surge: 'lead', approach: 'counter', boss: 'frenzy' },",
      replace: "  core: { run: 'engine', surge: 'lead', approach: 'counter', boss: 'drive' },",
    },
  },
];

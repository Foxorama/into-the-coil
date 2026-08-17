// The breaks behind docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md.
//
// ⚠️ THE GUARD SHIPS GREEN OVER NINETY-ONE KNOWN OFFENDERS, AND THAT IS THE HARD CASE FOR 0005. A
// known-bad list is the one shape of guard that can be green for the wrong reason twice over: it can
// fail to notice a NEW offender, and it can fail to notice that a listed one has been FIXED. Both
// look identical from a green run, and the second is unusual enough that nobody thinks to check it.
// There is a probe for each direction.
//
// ⚠️ AND THE THIRD IS THE FLOOR ITSELF, which is what CLAUDE.md's *no counting guard* warning is
// about. A list this long can carry the whole result: widen `ROLE_FLOOR_DB` far enough and the guard
// still has ninety-one names in it and asserts nothing about any of them. The third probe is what
// says the number is load-bearing rather than decorative.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0164',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE REPORTED DIRECTION: a mix edit pushes a layer under its role and nothing says so. Mire's
      `sub` is promoted to `pulse` by `PROMOTES` — *"still water with something under it"*, the whole
      bottom stepping up out of the bed — so it is the one layer in that place whose absence would
      cost the place its brief. Halving it is an ordinary-looking mix edit, and it drops `sub` past
      the floor at rungs that are not on the known list.
    */
    broke: 'mire’s sub halved, so the place’s promoted bottom falls past the floor at rungs nobody listed',
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/themes.ts',
      // `sub: 0.8` appears twice in this file; the line above it is what makes this mire's.
      find: 'perc: 0.95,\n      sub: 0.8,',
      replace: 'perc: 0.95,\n      sub: 0.4,',
    },
  },
  {
    decision: '0164',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE DIRECTION A KNOWN-BAD LIST NORMALLY FORGETS. Without the second assertion the list can
      only grow stale: a mix pass fixes a layer, the line stays, and the next pass cannot tell which
      of the ninety-one are still real. `approach/run/chords` is comfortably OVER its role — it is one
      of the layers doing the burying — so listing it is exactly the shape of a line left behind after
      a fix, and the guard has to refuse it.
    */
    broke: 'a layer that clears the floor left sitting on the known-adrift list, as a stale line would be',
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'tests/themes.test.ts',
      find: "    approach: ['run/perc',",
      replace: "    approach: ['run/chords', 'run/perc',",
    },
  },
  {
    decision: '0164',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE FLOOR IS LOAD-BEARING, AND A LIST THIS LONG COULD HIDE THAT IT IS NOT. Widened to −30 dB
      nothing in the game reaches it, so every one of the ninety-one clears — and the second assertion
      is what notices. A version of this guard whose floor had been quietly widened until it went
      quiet would look exactly like a version that had been fixed, which is how a threshold stops
      meaning anything (`AUDIBLE_FLOOR_DB`'s comment names the same failure).
    */
    broke: 'the floor widened until nothing reaches it, which is how a threshold is silently retired',
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'tests/pace.ts',
      find:
        '  const rungs = MUSIC_ROLES.map((role) => ROLE_MARGIN_DB[role]).sort((a, b) => a - b);\n' +
        '  return -Math.max(...rungs.slice(1).map((margin, i) => margin - rungs[i]!));',
      replace: '  return -30;',
    },
  },
];

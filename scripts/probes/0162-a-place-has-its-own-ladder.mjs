// The breaks behind docs/decisions/0162-a-place-has-its-own-ladder.md.
//
// ⚠️ THE HARD PART OF THIS DECISION IS THAT NO PLACE STATES A LADDER YET. The mechanism lands empty
// so that the diff is provable, which means the override path is code nothing exercises — and a code
// path nothing exercises is guarded by nothing, however many tests are green. That is
// docs/decisions/0005-a-guard-must-be-seen-to-fail.md reached from the other side: not a guard that
// cannot fail, but a branch no data can reach.
//
// ⚠️ SO `rungIn` TAKES THE TABLE AS AN ARGUMENT and the probes below break it with synthetic places.
// The alternative was to author a real override in the same PR, which would have made a musical
// judgement and a mechanism land together — exactly what 0158's landing was careful to avoid.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0162',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE OVERRIDE IGNORED ENTIRELY, which is the shape this would ship in if nobody checked: with
      every place's `ladder` absent, a lookup that never consults it returns the correct number for all
      seven places at all seven rungs. Every other guard in the repository stays green, `dist` is
      unchanged, and the feature does not exist.
    */
    broke: 'the place’s own ladder never consulted, so the mechanism is a field nothing reads',
    guard: 'a place’s own number wins, and a layer it does not mention falls back to the shared ladder',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return ladder?.[rung]?.[layer] ?? MUSIC_LADDER[rung][layer];',
      replace: '  return MUSIC_LADDER[rung][layer];',
    },
  },
  {
    decision: '0162',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ `||` INSTEAD OF `??`, WHICH IS THE ONE-CHARACTER VERSION OF THE WHOLE DECISION. A place that
      CLOSES a layer states zero, and `||` reads zero as *not stated* and falls through to the shared
      ladder — so the place is ignored at exactly the moment it was trying to be quiet, and only then.
      Every open-a-layer case still works, which is what makes it the plausible mistake rather than a
      silly one.
    */
    broke: 'the fallback written with `||`, so a place that closes a layer is silently ignored',
    guard: 'and ZERO is a value a place may state, because closing a layer is a thing a rung may do',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return ladder?.[rung]?.[layer] ?? MUSIC_LADDER[rung][layer];',
      replace: '  return ladder?.[rung]?.[layer] || MUSIC_LADDER[rung][layer];',
    },
  },
  {
    decision: '0162',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ `rungOf` READING THE WRONG PLACE'S TABLE, AND THIS PROBE IS THE REASON THE GUARD IS A SCAN.
      It was first aimed at a value comparison over all seven places at every rung — and **reported
      STILL GREEN**, because every `ladder` is absent today, so reading the wrong place's table gives
      the right answer for all of them. The harness caught a vacuous guard that had been written the
      same hour, which is docs/decisions/0019-a-probe-must-be-seen-to-apply.md earning its place again.

      ⚠️ IT BECOMES A REAL DEFECT THE INSTANT THE FIRST OVERRIDE IS AUTHORED, and would present as
      *the level I edited did not change and a different one did*. 0162 records the debt: when a place
      states a ladder, this should be re-aimed at a value and the scan retired.
    */
    broke: 'the themed lookup reading one fixed place’s ladder rather than the one it was asked about',
    guard: '0162 — NOTHING UNDER src/ OR rig/ READS THE SHARED LADDER, because a place may differ from it',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return rungIn(THEMES[theme].ladder, rung, layer);',
      replace: "  return rungIn(THEMES.approach.ladder, rung, layer);",
    },
  },
  {
    decision: '0162',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ A CALL SITE LEFT ON THE SHARED LADDER, which is the failure the scan exists for and the one
      this repository has already paid for twice through 0116. The dashboard's coverage table is the
      measurement a drag is FOR (0126), so a version of it reading the shared row would describe a
      level nobody plays — while redrawing correctly, and while every value on the page looked sane.
    */
    broke: 'the coverage table read off the shared ladder, so it describes a level nobody plays',
    guard: '0162 — NOTHING UNDER src/ OR rig/ READS THE SHARED LADDER, because a place may differ from it',
    edit: {
      path: 'rig/transport.ts',
      find: '      const on = rungOf(LEVELS[kind].theme, mark.rung, layer) > 0;',
      replace: '      const on = MUSIC_LADDER[mark.rung][layer] > 0;',
    },
  },
];

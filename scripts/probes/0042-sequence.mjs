// The breaks behind docs/decisions/0042-a-run-is-a-sequence-of-levels.md.
//
// ⚠️ Three of these are ONE COMPARISON each, which is the point. A level ending and a run ending are
// `>=` against `>`; carrying a run forward and starting one over are the same four fields with one
// of them replaced. None of these edits looks wrong in review, and every one of them changes what
// the game is.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0042',
    suite: 'tests/run.test.ts',
    // The death rule wearing the wrong name. `lifeLost` clears these three lines up, so clearing
    // them here too reads as consistency.
    broke: 'a level boundary that empties the arsenal, which is the death rule wearing the wrong name',
    guard: 'carries everything forward across a level boundary',
    edit: {
      path: 'src/state/slices/run.ts',
      // ⚠️ Anchored on `level + 1` and the line after it, rather than on the whole returned literal.
      // The old anchor was the literal, and it went stale the day 0047 added a field to it — CI
      // refused the probe, which is the harness doing its job. `level + 1` is the one line in this
      // arm that says what a level boundary IS, so it is the part that will not move.
      // ⚠️ Re-anchored by 0372, which took the clear's charge away: the arsenal passes through.
      find: '        level: state.level + 1,\n        arsenal: state.arsenal,\n        upgrades: state.upgrades,',
      replace: '        level: state.level + 1,\n        arsenal: [],\n        upgrades: [],',
    },
  },
  {
    decision: '0042',
    suite: 'tests/run.test.ts',
    // ⚠️ ONE COMPARISON. The run never ends, and the shell walks off the end of the level list — where
    // `enterLevel` clamps, so the player replays the last level forever and nothing reports anything.
    broke: 'the last level cleared and the run carrying on into a level that is not there',
    guard: 'a level cleared past the last one IS the end of the run',
    edit: {
      path: 'src/state/root.ts',
      find: "  if (state.screen.current === 'cleared' && state.run.level >= LEVEL_KINDS.length) {",
      replace: "  if (state.screen.current === 'cleared' && state.run.level > LEVEL_KINDS.length) {",
    },
  },
  {
    decision: '0042',
    suite: 'tests/run.test.ts',
    // The same comparison the other way: the run ends after the first level and the second is never
    // seen by anybody.
    broke: 'the run-finished agreement fired one level early',
    guard: 'a level cleared with more still to come is not the end of the run',
    edit: {
      path: 'src/state/root.ts',
      find: "  if (state.screen.current === 'cleared' && state.run.level >= LEVEL_KINDS.length) {",
      replace: "  if (state.screen.current === 'cleared' && state.run.level >= 1) {",
    },
  },
  /*
    ── ⚠️ AND THE *EASIER AS IT DIES* PROBE IS RETIRED, WHICH IS A LOSS AND IS SAID SO — 0322 ───────

    It cut a mid-boss's last phase from seven shots to one and watched `tests/level.test.ts`'s **every
    phase is reachable, and they only get harder** go red. **That comparison is a taste now**
    (`0322-volley` in `tests/authored.ts`), so the break reports **STILL GREEN** — and
    `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` is explicit that a probe reporting STILL
    GREEN is worse than no probe, because it wears a tick.

    ⚠️ **WHAT IS ACTUALLY LOST: nothing hard now catches a phase table that throws FEWER things as the
    bar empties.** The cadence half is still hard in `tests/difficulty.test.ts` — a later phase never
    fires slower — and the count half is printed every run with the offenders named, where a human sees
    it and a suite does not. `docs/decisions/0322-the-ball-is-worth-shooting.md` has the argument for
    why the count cannot hold the claim: the serpent's last third is ONE ball the player must destroy
    against a spray of twenty-one, which is fewer objects and more to do, and three separate decisions
    had to redefine the quantity to keep saying otherwise.

    ⚠️ **0042's OWN CLAIM IS UNAFFECTED AND STILL HAS FOUR PROBES.** *A run is a sequence of levels* is
    about what carries forward and where a run ends; a boss's phase table was the one break here that
    was about neither.
  */
  /*
    ── THE WARDEN PROBE WAS HERE, AND 0295 RETIRED IT WITH THE GUARD IT AIMED AT ───────────────────

    It cut the warden to 7 to redden `the enemy that takes more killing is drawn bigger`, which
    `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md` deleted — a total ordering of
    thirteen extents by health, which no successor guard replaces. Deleted rather than re-aimed, for
    the reason `scripts/probes/0035-legibility.mjs` records beside its twin.
  */
];

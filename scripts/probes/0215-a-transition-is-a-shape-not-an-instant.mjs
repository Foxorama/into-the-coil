// The breaks behind docs/decisions/0215-a-transition-is-a-shape-not-an-instant.md.
//
// ⚠️ THE FIRST IS THE DEFECT THAT SHIPPED, PUT BACK. Every write took RAMP_SECONDS whatever it was
// doing — a layer opening from silence and a layer nudging up a fifth of a decibel got the same 1.6
// seconds. Equal time over unequal distance is unequal rate, which is what an ear calls a jump.
// Reported of The Approach: "at 41sec in, the volume increases a bit too loudly", and then of The
// Black Heart: "a similar issue, so run a pass on all the levels just to check". Five of seven had it.
//
// ⚠️ AND EVERY GUARD HERE IS IN dB OF THE SUMMED MIX, because tests/music.test.ts already held the
// ramps and was green over every one of those spikes: it asserted that each write took the same tau,
// which was true and was the bug.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0215',
    suite: 'tests/transition.test.ts',
    /*
      ⚠️ ONE RAMP FOR EVERYTHING IS THE SIMPLER-LOOKING CODE, and it is what was there. Nothing at the
      call site suggests that the size of a move should decide anything about its timing.
    */
    broke: 'every move back on one ramp length, so the biggest arrivals land as steps',
    /*
      ⚠️ RE-AIMED BY 0226. With every rung held to one loudness there is no climb for a fast arrival
      to step up to — the bed steps down in the same arrivals' own ramps, so the sum barely moves —
      and what this break produces instead is departures gone in half a second under a four-bar
      build. That is the hole guard's subject, and it is the one that goes red.
    */
    guard: 'never shortens a departure to fit a short build',
    edit: {
      path: 'src/app/music.ts',
      // ⚠️ Re-anchored by 0331, which multiplied this by the place's own `glide`. Deleting the line
      // outright would now also delete that, breaking two rules with one edit and leaving the verdict
      // ambiguous — so the break is stated as the assignment it used to be: one ramp length for every
      // move, `glide` and all, which is exactly *the size of a move decides nothing about its timing*.
      find: '    if (!aura) write.tau = (RAMP_SECONDS * rampScaleOf(was, target) * (standing ? (THEMES[theme].glide ?? 1) : 1)) / 3;',
      replace: '    if (!aura) write.tau = (RAMP_SECONDS * (standing ? (THEMES[theme].glide ?? 1) : 1)) / 3;',
    },
  },
  {
    decision: '0215',
    suite: 'tests/transition.test.ts',
    /*
      ⚠️ THE HOLE IS INVISIBLE TO EVERY OTHER INSTRUMENT. Departures leaving on the downbeat while
      arrivals stagger out to four bars is what 0120 asks for, read literally — and it leaves the mix
      quieter than BOTH ends of the boundary for a few seconds. Five of the seven places had one.
    */
    broke: 'a departure no longer lasting as long as the build it makes room for',
    guard: 'is never quieter than both the rung it left and the rung it is reaching',
    edit: {
      path: 'src/app/music.ts',
      // 0226 replaced the fade with one step per arrival; the same defect is every step landing on
      // the downbeat, so what leaves is gone before what replaces it has begun.
      // ⚠️ Re-anchored by 0331: a step standing for several arrivals sharing a downbeat takes the
      // SLOWEST of their ramps now rather than whichever sorted last, so the field is `together`.
      // ⚠️ AND ITS GUARD NOW HAS ONE NAMED EXCEPTION — The Black Heart's `run → push`, which 0331
      // measured at −1.01 dB. This break puts every departure on the downbeat in all seven places, so
      // it reddens the other thirty-four boundaries and not only the exempted one; `npm run prove`
      // reporting STILL GREEN here would mean that assumption is wrong and the exception is too wide.
      find: '      staged.push({ layer: write.layer, target, at: step.at, tau: together });',
      replace: '      staged.push({ layer: write.layer, target, at: bar, tau: RAMP_SECONDS / 3 });',
    },
  },
  {
    decision: '0215',
    suite: 'tests/transition.test.ts',
    /*
      ⚠️ THIS IS THE BUG I ACTUALLY SHIPPED INTO THE MEASUREMENT AND THEN FOUND IN THE TABLE. Writing
      the departure rule as an assignment rather than a floor makes the fade SHORTER wherever the
      build is under four bars wide — so The Toxic Mire's hole got deeper while the change was
      supposed to be closing it. An override that looks like a special case and is a regression.
    */
    broke: 'the departure rule written as an override, so a short build shortens the fade',
    guard: 'never shortens a departure to fit a short build',
    edit: {
      path: 'src/app/music.ts',
      // 0226: a departure's steps take each arrival's own ramp; a step on a short ramp is the same
      // defect — the fade shortened to something other than the build it is making room for.
      // ⚠️ Re-anchored by 0331, on the same terms as the probe above: the field is `together`.
      find: '      staged.push({ layer: write.layer, target, at: step.at, tau: together });',
      replace: '      staged.push({ layer: write.layer, target, at: step.at, tau: RAMP_SECONDS / 3 });',
    },
  },
  {
    decision: '0215',
    suite: 'tests/transition.test.ts',
    /*
      ⚠️ A LITERAL IS WHAT THIS WAS BEFORE IT WAS DERIVED, and 4 is the value it currently has — so
      the break is invisible until BUILD_BARS moves, which is exactly the drift 0184 is named for. The
      guard holds the RELATIONSHIP rather than the number, which is the only way to catch it.
    */
    broke: 'the longest ramp typed as a literal, so retuning the build no longer carries the ramps',
    guard: 'caps the longest ramp at the width of a build',
    edit: {
      path: 'src/app/music.ts',
      find: 'export const RAMP_SPREAD = ((BUILD_BARS + 1) * BAR_SECONDS) / RAMP_SECONDS;',
      replace: 'export const RAMP_SPREAD = 3;',
    },
  },
  {
    decision: '0215',
    suite: 'tests/transition.test.ts',
    /*
      ⚠️ THE CAP IS WHAT STOPS A RAMP OUTRUNNING THE BUILD IT LANDS IN. Without it a layer moving 20 dB
      would still be climbing when the next section's arrivals began — and the arc would look FINE,
      because a slow enough rise never trips a per-bar ceiling. The monotonic guard is the one that
      can see it.
    */
    broke: 'the ramp scale uncapped, so a big enough move ramps past the build and into the next one',
    guard: 'gives a bigger move a longer ramp, and never one longer than the build',
    edit: {
      path: 'src/app/music.ts',
      find: '  const share = Math.min(1, moveDb / RAMP_FULL_AT_DB);',
      replace: '  const share = moveDb / RAMP_FULL_AT_DB;',
    },
  },
];

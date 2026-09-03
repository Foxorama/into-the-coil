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
    guard: 'never climbs more in one bar than the arrangement itself asks for',
    edit: {
      path: 'src/app/music.ts',
      find: '    if (!aura) write.tau = (RAMP_SECONDS * rampScaleOf(was, target)) / 3;',
      replace: '',
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
      find: '  for (const write of closing) write.tau = Math.max(write.tau, spread / 3);',
      replace: '  for (const write of closing) write.tau = RAMP_SECONDS / 3;',
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
      find: '  for (const write of closing) write.tau = Math.max(write.tau, spread / 3);',
      replace: '  for (const write of closing) write.tau = spread / 3;',
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

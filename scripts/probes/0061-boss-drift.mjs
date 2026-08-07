// The breaks behind docs/decisions/0061-a-boss-keeps-flying.md.
//
// ⚠️ Every one of these leaves a boss that arrives correctly, holds the camera's frame correctly, and
// fights correctly. What they take away is MOTION, and a still frame cannot see motion at all — which
// is why three of the five drive nine hundred steps of the real fight and measure how much of the
// screen the hull covered while it was doing it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0061',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly: a station that is one distance from the camera and stays
      there. It is the tidiest line in the file, it is what 0040 shipped, and it is the whole of *"no
      longer any flowing movement"*.
    */
    broke: 'the station pinned again, so the boss holds one distance and only slides up and down',
    guard: 'it never stops moving along the lane, which is what a fight is',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const drift = row.drift > 0 && row.driftWavelength > 0\n    ? row.drift * Math.sin((cameraAlong * TAU) / row.driftWavelength)\n    : 0;',
      replace: '  const drift = 0;\n  void TAU;',
    },
  },
  {
    decision: '0061',
    suite: 'tests/level.test.ts',
    // The drift read from a step counter rather than from the camera. Indistinguishable while the
    // world scrolls at a constant rate, which is every frame the game currently has — and it is the
    // difference between a shape in the world and a wobble in time.
    broke: 'the drift read from the boss’s own position rather than from the camera',
    guard: 'arrives, closes on its station, and then holds it',
    edit: {
      path: 'src/app/boss.ts',
      find: '    ? row.drift * Math.sin((cameraAlong * TAU) / row.driftWavelength)',
      replace: '    ? row.drift * Math.sin((boss.along * TAU) / row.driftWavelength) * 4',
    },
  },
  {
    decision: '0061',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE ONE THE TRACKER EXISTS FOR. The bang-bang approach 0040 shipped is correct against a
      station that does not move; against one that does it switches state every few steps at five
      times the drift rate. The boss still averages the right place, so every assertion about WHERE
      it settled passes — what it loses is the flight.
    */
    broke: 'the bang-bang approach put back, so the boss chases a moving station instead of flying it',
    guard: 'it never stops moving along the lane, which is what a fight is',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const pull = (station - boss.along) * STATION_TRACK;\n  boss.velAlong =\n    scrollPerStep + (pull > APPROACH_PER_STEP ? APPROACH_PER_STEP : pull < -APPROACH_PER_STEP ? -APPROACH_PER_STEP : pull);',
      replace:
        '  void STATION_TRACK;\n  boss.velAlong = boss.along > station ? scrollPerStep - APPROACH_PER_STEP : scrollPerStep;',
    },
  },
  {
    decision: '0061',
    suite: 'tests/level.test.ts',
    // The cap removed. The entrance stops being an arrival and becomes a snap — 0040 leaves seven
    // seconds of quiet in front of a boss precisely so the player watches it come in.
    broke: 'the approach cap removed, so the boss snaps onto its station rather than arriving',
    guard: 'its arrival is still something the player watches happen',
    edit: {
      path: 'src/app/boss.ts',
      find: '    scrollPerStep + (pull > APPROACH_PER_STEP ? APPROACH_PER_STEP : pull < -APPROACH_PER_STEP ? -APPROACH_PER_STEP : pull);',
      replace: '    scrollPerStep + (station - boss.along);',
    },
  },
  {
    decision: '0061',
    suite: 'tests/level.test.ts',
    // The content half: a swing wide enough to push the hull off the narrowest screen there is. The
    // table gives no sign of it, and it is right on every monitor the author owns.
    broke: 'a drift widened past what the narrowest device can show',
    guard: 'the whole hull stays on screen on the narrowest device',
    /*
      ⚠️ **Anchored on the sentinel's WAVELENGTH, because `drift: 14` stopped being unique.** The
      roster went from two bosses to seven — `docs/decisions/0071-five-more-levels-and-one-idea-each.md`
      — and `axis` happens to swing the same distance. An ambiguous `find` is refused by the harness
      rather than applied to whichever row came first, which is the whole reason it counts matches.
    */
    edit: {
      path: 'src/content/bosses.ts',
      find: '    drift: 14,\n    // About six seconds a cycle',
      replace: '    drift: 40,\n    // About six seconds a cycle',
    },
  },
];

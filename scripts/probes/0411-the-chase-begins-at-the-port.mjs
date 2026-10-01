// The breaks behind docs/decisions/0411-the-chase-begins-at-the-port.md.
//
// One per claim in tests/intro.test.ts and tests/intro.browser.test.ts, and one for the painter's place
// on tests/budget.test.ts's hot list: the page opens on the title again, the beats run out of order, the
// picture does not end in black or goes dark mid-shot, a baked piece is never drawn, a ship is still on
// the screen when its shot ends, the fighter covers the pilot, the pilot jumps between the run and the
// leap, and the intro draws nothing. The skip's own went to 0412's file, which replaced it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the page opens on the title again',
    // Re-anchored by 0415, whose page opens on the splash that leads to the intro.
    guard: 'follows the splash, has no panel',
    edit: {
      path: 'src/state/slices/screen.ts',
      find: "export const initialScreen: ScreenState = { current: 'splash' };",
      replace: "export const initialScreen: ScreenState = { current: 'title' };",
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter goes after her before she has gone',
    guard: 'runs its beats in the order they are written',
    edit: {
      path: 'src/content/port.ts',
      // Re-anchored by 0414, 0416 and 0444, which moved the beat.
      find: '  blueRuns: 1036,',
      replace: '  blueRuns: 888,',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the last fade taken out, so the title cuts in over the stars',
    // Since 0416 the fades are to the backdrop, not to black.
    guard: 'opens out of the backdrop and ends in it',
    edit: {
      path: 'src/render/port.ts',
      find: '  else if (t >= BEATS.fadeOut) veil = Math.min(1, (t - BEATS.fadeOut) / (BEATS.end - BEATS.fadeOut));',
      replace: '',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the hangar fading from the fighter’s launch rather than after it',
    guard: 'is never veiled in the middle of a shot',
    edit: {
      path: 'src/render/port.ts',
      // The WHOLE line: moving only the condition left the darkness counting from the old cut, so it
      // came out negative, nothing was drawn, and the proof reported the guard STILL GREEN over a
      // break that never applied.
      find: '  else if (t >= BEATS.cut - FADE && t < BEATS.outside) veil = Math.min(1, (t - (BEATS.cut - FADE)) / FADE);',
      replace: '  else if (t >= BEATS.blueGo - FADE && t < BEATS.outside) veil = Math.min(1, (t - (BEATS.blueGo - FADE)) / FADE);',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the alarm beacons baked and never drawn',
    guard: 'draws every piece of the port it bakes',
    edit: {
      path: 'src/render/port.ts',
      find: '      put(surface, view, PORT_SPRITE.beacon, at[0], at[1], lit, 0, 1 + 0.6 * sweep);',
      replace: '      void at;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the Viper crawling off her pad, still in the hangar when the pilot comes out',
    guard: 'has the Viper through the bay before the bar door opens',
    edit: {
      path: 'src/render/port.ts',
      find: '  const viperAlong = STAGE.viperPad + launched(t, BEATS.viperGo);',
      replace: '  const viperAlong = STAGE.viperPad + launched(t, BEATS.viperGo) * 0.05;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter too slow to reach the bay before the dark',
    guard: 'has the fighter through the bay before the hangar fades',
    edit: {
      path: 'src/render/port.ts',
      // Re-anchored by 0414, which gave the fighter its own, slower launch.
      find: '  const blueAlong = STAGE.bluePad + launched(t, BEATS.blueGo, BLUE_LAUNCH_ACCEL);',
      replace: '  const blueAlong = STAGE.bluePad + launched(t, BEATS.blueGo, BLUE_LAUNCH_ACCEL) * 0.3;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter holding station outside until the picture goes',
    guard: 'has both ships off the widest screen before the last fade',
    edit: {
      path: 'src/render/port.ts',
      // Re-anchored by 0414, whose fighter is placed by `blueAlongAt`.
      find: '  return mouth + (CHASE.blue.along - mouth) * blueArrived(s) + launched(s, BLUE_RUNS);',
      replace: '  return mouth + (CHASE.blue.along - mouth) * blueArrived(s) + launched(s, BEATS.fadeOut - BEATS.outside);',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter drawn over the pilot, which is what the first photographs showed',
    guard: 'never lets the fighter cover the pilot',
    edit: {
      path: 'src/render/port.ts',
      // Re-anchored by 0444: the hangar draws the ship as it sees it, which is `blueSide`.
      find: '  // The canopy catching the light as the pilot drops in.',
      replace: '  put(surface, view, PORT_SPRITE.blueSide, blueAlong, blueAcross);\n  // The canopy catching the light as the pilot drops in.',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the leap starting from the pad rather than from where the run ended',
    guard: 'carries the pilot from the run into the leap without a jump',
    edit: {
      path: 'src/render/port.ts',
      find: '      const along = LEAP_FROM + (toAlong - LEAP_FROM) * u;',
      replace: '      const along = STAGE.bluePad + (toAlong - STAGE.bluePad) * u;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/budget.test.ts',
    broke: 'the intro’s painter building an array every frame',
    guard: 'no hot file allocates',
    edit: {
      path: 'src/render/port.ts',
      // ⚠️ Re-anchored by 0450, which reads each ship's intro size between the two.
      find: '  surface.clear();\n  // Each ship at its own size',
      replace: '  surface.clear();\n  void [t].map((n) => n);\n  // Each ship at its own size',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the frame clearing the canvas in place of drawing the intro',
    // 0415 folded *the intro draws* into the test that looks for the picked golfer in it.
    guard: 'runs the golfer who was picked out of the bar',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0441, which hands the port the ship's own wingtip, and by 0444, which hands
      // it the ship's row for its cockpit too.
      find: '      paintPort(w.surface, w.view, w.intro + alpha, w.sky, w.shipRow);',
      replace: '      w.surface.clear();',
    },
  },
  /*
    The four probes on the skip — Enter carrying through, the skip unlocking the sound, and a key and a
    click that did not skip — moved to scripts/probes/0412-the-port-is-heard.mjs with the code they
    break: 0412 replaced *any press skips* with a button, three keys, and a press that asks for sound.
  */
];

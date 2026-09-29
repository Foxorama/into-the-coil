// The breaks behind docs/decisions/0414-the-chase-is-a-chase.md.
//
// One per claim in tests/intro.test.ts's *the chase is a chase*: her line drifting again, the fighter on
// her line with no lag, the fighter close behind, the fighter as quick off the pad as she is, no trail
// when she jets off, and a trail before anyone has.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0414',
    suite: 'tests/intro.test.ts',
    broke: 'her line drifting on a slow wave again — the floating that was reported',
    guard: 'holds her line between breaks',
    edit: {
      // On top of her line, not under it: a drift added before the jinks is overwritten by each one
      // that finishes, and the proof said STILL GREEN over it — correctly.
      path: 'src/render/port.ts',
      find: '    across += (jink.to - across) * ease(s, jink.at, jink.at + JINK_STEPS);\n  }\n  return across;',
      replace: '    across += (jink.to - across) * ease(s, jink.at, jink.at + JINK_STEPS);\n  }\n  return across + 6 * Math.sin(s / 20);',
    },
  },
  {
    decision: '0414',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter on her line at the same moment she is, which is formation flying rather than a chase',
    guard: 'has the fighter fly her line, late',
    edit: {
      path: 'src/render/port.ts',
      find: '  const track = viperLine(s - TRACK_DELAY) + (CHASE.blue.across - CHASE.viper.across);',
      replace: '  const track = viperLine(s) + (CHASE.blue.across - CHASE.viper.across);',
    },
  },
  {
    decision: '0414',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter close on her heels, where 0411 had it',
    guard: 'opens up well behind her',
    edit: {
      path: 'src/content/port.ts',
      // Re-anchored by 0416, which moved the fighter back to hold the gap on screen under its zoom.
      find: '  blue: { along: 30, across: 60 },',
      replace: '  blue: { along: 110, across: 60 },',
    },
  },
  {
    decision: '0414',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter off its pad as fast as she was',
    guard: 'leaves the pad slower off the mark than she did',
    edit: {
      path: 'src/render/port.ts',
      find: 'launched(t, BEATS.blueGo, BLUE_LAUNCH_ACCEL)',
      replace: 'launched(t, BEATS.blueGo)',
    },
  },
  {
    decision: '0414',
    suite: 'tests/intro.test.ts',
    broke: 'no trail behind her as she jets off',
    guard: 'draws no trail before a ship jets off, and trails off its wingtips after',
    edit: {
      path: 'src/render/port.ts',
      find: '  paintTrail(surface, view, s, VIPER_RUNS, false, -8.7, 7.7);\n  paintTrail(surface, view, s, VIPER_RUNS, false, -5.7, -6.4);\n',
      replace: '',
    },
  },
  {
    decision: '0414',
    suite: 'tests/intro.test.ts',
    broke: 'trails drawn all through the chase, before anyone has jetted off',
    guard: 'draws no trail before a ship jets off, and trails off its wingtips after',
    edit: {
      path: 'src/render/port.ts',
      find: '    if (at < runs) return;',
      replace: '    if (at < 0) return;',
    },
  },
];

// The breaks behind docs/decisions/0175-an-experiment-arrives-the-way-the-game-does.md.
//
// ⚠️ THE FIRST TWO ARE THE DEFECT PUT BACK, IN ITS TWO HALVES. The dashboard's non-shipped modes
// wrote their targets straight onto the gain nodes after `setLevel` had scheduled its own — off the
// bar, and over 30 ms instead of 1600. Both of 0117's and 0171's guard sets stayed green throughout,
// because both run over `levelWrites` and the dashboard was not calling it.
//
// ⚠️ AND THE THIRD IS THE ONE THAT LOOKS LIKE A TIDY-UP. Letting a handed-in table cover the aura as
// well is one fewer special case, and it stops the boss approaching: the aura's gain is a distance
// the player is steering (0091) and no solver produces one, so a table that included it would pin
// the dread wherever the last solve left it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0175',
    suite: 'tests/music.test.ts',
    broke: 'a handed-in table ignored, so an audition is the shipped mix with the readout of another',
    guard: 'and the table it is handed is the one it schedules, aura excepted',
    edit: {
      path: 'src/app/music.ts',
      find: '    const stated = aura ? undefined : gains?.[layer];',
      replace: '    const stated = undefined;',
    },
  },
  {
    decision: '0175',
    suite: 'tests/music.test.ts',
    broke: 'the desk writing a gain outside `restate` again, which is how the cut got in',
    guard: 'and the dashboard does not write a music gain behind the mixer’s back',
    edit: {
      path: 'rig/dash.ts',
      find: '  const moment = now();\n  const music = out.music();',
      replace:
        '  const moment = now();\n  const music = out.music();\n  ' +
        'if (music !== null) for (const l of moment.layers) music.gainOf(l.layer).setTargetAtTime(l.target, 0, HOLD_SECONDS);',
    },
  },
  {
    decision: '0175',
    suite: 'tests/music.test.ts',
    broke: 'the handed-in table covering the aura too, so the boss stops approaching',
    guard: 'and the aura is still computed from nearness, because no solver produces one',
    edit: {
      path: 'src/app/music.ts',
      find: '    const stated = aura ? undefined : gains?.[layer];',
      replace: '    const stated = gains?.[layer];',
    },
  },
];

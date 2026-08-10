// The breaks behind docs/decisions/0096-the-enemies-play-along.md.
//
// ⚠️ THE ONE THAT IS NOT HERE is "every enemy of a kind fires in unison". It is the failure the
// RELATIVE reload exists to avoid, and making it happen is a one-word edit — swap `nextOnGrid` at the
// spawn for the absolute reload the player's gun uses. There is no guard that could catch it: the
// shots would all be on the grid, every content table would be untouched, and *five turrets fire
// together* is a statement about how it feels rather than about a number. The decision carries it and
// the eyes-on rig is what would show it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0096',
    suite: 'tests/difficulty.test.ts',
    /*
      ⚠️ THE DIFFICULTY MULTIPLIER LEFT TO ROUND FREELY, which is the code as it shipped and is the
      single line the whole decision turns on. Every cadence in the content tables is authored on the
      grid and guarded there — and 0.7 of a grid value is not a grid value, so one multiply puts all
      of it back off the beat with the content guard still perfectly green.
    */
    broke: 'the tier multiplier rounding to any step again, so a difficulty takes every enemy off the beat',
    guard: 'and the DIFFICULTY MULTIPLIER cannot take them off it, which is the step that would',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  return onFireGrid(base * tier.fireGap);',
      replace: '  return Math.max(1, Math.round(base * tier.fireGap));',
    },
  },
  {
    decision: '0096',
    suite: 'tests/difficulty.test.ts',
    /*
      ⚠️ A CADENCE AUTHORED OFF THE GRID. This is what the content guard is for and it is the edit a
      level designer makes by accident: 75 is a perfectly reasonable number to reach by feel, and it
      is 12.5 sixteenths.
    */
    broke: 'an enemy cadence authored off the grid, which is what tuning one by feel produces',
    guard: 'THE ASK: every authored cadence is a whole number of grid units',
    edit: {
      path: 'src/content/enemies.ts',
      // ⚠️ Re-anchored by 0105, which lengthened every enemy cadence — *"enemies shoot too fast"*.
      // The break is unchanged in kind: a number a hand would reach by feel that is not a whole
      // number of sixteenths. 100 is 16.67 of them.
      find: '    fireEvery: 102,',
      replace: '    fireEvery: 100,',
    },
  },
  {
    decision: '0096',
    suite: 'tests/difficulty.test.ts',
    /*
      ⚠️ THE SPAWN ALIGNMENT QUANTISED FORWARD RATHER THAN BACK. `Math.ceil` is the obvious way to
      write *the next position on the grid* and it makes every body on the field open fire up to a
      grid unit LATE — a change to how quickly a wave becomes dangerous, which is a balance number
      nobody asked to move and which no test of *is it on the grid* would notice.
    */
    broke: 'the spawn alignment rounded forward, so every body opens fire later than its own cadence',
    guard: 'and a body never waits LONGER than its own cadence to open fire',
    edit: {
      path: 'src/content/music.ts',
      find: '  const base = gap - FIRE_GRID + (FIRE_GRID - (steps % FIRE_GRID));',
      replace: '  const base = gap + (FIRE_GRID - (steps % FIRE_GRID));',
    },
  },
  {
    decision: '0096',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE FIRST SHOT LEFT UNALIGNED, so a body keeps a musical PERIOD at whatever phase the step it
      spawned on happens to give it. This is the defect this decision is most likely to be shipped
      with, because it looks finished: every cadence is on the grid, every multiplier is snapped, and
      not one shot lands on a beat.

      It is caught in `tests/spawns.test.ts` and not in the content suite on purpose —
      docs/decisions/0027-measure-the-picture-not-the-model.md. The tables would all still agree with
      each other.
    */
    broke: 'the first shot left unaligned, so a correct period lands at an arbitrary phase',
    guard: 'THE PICTURE: every enemy bullet appears on a step the grid allows',
    edit: {
      path: 'src/app/frame.ts',
      find: '    e.fireIn = nextOnGrid(w.steps, fireGapFor(row.fireEvery, w.difficulty), (i + index) / wave.count);',
      replace: '    e.fireIn = fireGapFor(row.fireEvery, w.difficulty);',
    },
  },
  {
    decision: '0096',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE CLOCK FROZEN WHILE A BODY IS OFF SCREEN, which is exactly how the code shipped and is
      what both visibility comments already claimed it did not do. An arbitrary pause in a periodic
      clock is an arbitrary phase shift; a body that spends two seconds of its approach off the
      leading edge arrives correct in tempo and wrong in phase, for the rest of its life.

      **This is the probe that found the defect rather than confirming it.** The content guards were
      all green and 84 of 88 volleys were off the beat.
    */
    broke: 'the fire clock frozen while a body is off screen, so its approach shifts its phase',
    guard: 'THE PICTURE: every enemy bullet appears on a step the grid allows',
    edit: {
      path: 'src/app/frame.ts',
      find: "    e.fireIn--;\n    if (e.fireIn > 0) continue;\n    /*\n      The tier's gap, not the row's",
      /*
        ⚠️ THE LEADING EDGE AND NOT THE `across` ONE, AND `npm run prove` INSISTED. A first draft
        froze the clock on the `across` test, which reads as the same break — and the fixture's
        enemies fly down the middle of a lane they never leave, so nothing was ever frozen and the
        probe came back STILL GREEN. The freeze that shipped, and the one that actually shifts a
        phase, is the approach: every wave spawns beyond the view and spends seconds getting into it.
      */
      replace:
        "    if (e.along - e.radius > w.cameraAlong + w.view.alongSpan) continue;\n    e.fireIn--;\n    if (e.fireIn > 0) continue;\n    /*\n      The tier's gap, not the row's",
    },
  },
];

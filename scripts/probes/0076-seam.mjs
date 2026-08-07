// The breaks behind docs/decisions/0076-a-level-has-an-origin.md.
//
// ⚠️ The first two are the reported state of the world, restored one half at a time — the ship
// teleporting and the sky snapping back are the same line, and each has its own guard so a partial
// fix cannot look like a whole one. The last two are the failure an origin MAKES POSSIBLE, which is
// a script read against the wrong zero: silent in both directions, and invisible in a screenshot.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0076',
    suite: 'tests/seam.test.ts',
    /*
      ⚠️ THE REPORTED ONE. `respawn` is what put the hull back at `SHIP_START_ALONG`, so the one thing
      the player's hand is on teleported at the moment the banner cleared. Restoring the call is the
      whole of the old behaviour.
    */
    broke: 'the boundary respawning the ship, so the one thing the player is holding teleports',
    guard: 'THE REPORTED ONE: the ship is drawn in the same place across the boundary',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored when the shared reset was extracted; the break is still *the boundary respawns*.
      find: '  w.levelOrigin = w.cameraAlong;\n  beginScript(w);',
      replace: '  w.levelOrigin = w.cameraAlong;\n  beginScript(w);\n  respawn(w);',
    },
  },
  {
    decision: '0076',
    suite: 'tests/seam.test.ts',
    /*
      ⚠️ THE OTHER HALF OF THE SAME REPORT, and it is a separate guard because a fix could plausibly
      do one and not the other. The parallax is a function of the camera (0065), so a camera sent back
      to zero snaps every sky layer back to its start under a ship that did not move.
    */
    broke: 'the camera sent back to zero at the boundary, so the sky snaps back under the ship',
    guard: 'and the sky does not jump either, which is the other half of the report',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.levelOrigin = w.cameraAlong;',
      replace: '  w.cameraAlong = 0;\n  w.prevCameraAlong = 0;\n  w.levelOrigin = 0;',
    },
  },
  {
    decision: '0076',
    suite: 'tests/seam.test.ts',
    /*
      ⚠️ THE FAILURE AN ORIGIN MAKES POSSIBLE, and the reason `resetScene` reset the camera in the
      first place: *"a second run that started where the first one ended would be playing a different
      level with the same name."* With the origin dropped from the horizon, a level entered nine
      thousand units into a run reads its whole script as already behind the player and spawns the
      lot on one step.
    */
    broke: 'the horizon read in run coordinates, so a level entered late plays itself instantly',
    guard: 'THE ONE resetScene WARNED ABOUT: a wave arrives at the same place relative to the level',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const horizon = spawnAlong(w.cameraAlong) - w.levelOrigin;',
      replace: '    const horizon = spawnAlong(w.cameraAlong);',
    },
  },
  {
    decision: '0076',
    suite: 'tests/seam.test.ts',
    /*
      ⚠️ THE SAME MISTAKE ON THE OTHER SIDE OF THE COMPARISON, and it is the one that looks most like
      a tidy-up: the horizon is corrected and the PLACEMENT is not, so a wave arrives on time and is
      put where the level would have been if the run had just started — behind the camera, culled on
      the step it is created, and a level that plays out in silence.
    */
    broke: 'the boss placed in run coordinates, so it arrives on time and is nowhere near the player',
    guard: 'and the boss still arrives its authored distance into the level, not into the run',
    edit: {
      path: 'src/app/frame.ts',
      find: '  reset(boss, w.level.bossAt + w.levelOrigin, ACROSS_SPAN / 2, w.bossRow);',
      replace: '  reset(boss, w.level.bossAt, ACROSS_SPAN / 2, w.bossRow);',
    },
  },
  {
    decision: '0076',
    suite: 'tests/continue.test.ts',
    /*
      ⚠️ THE ONE THE EXISTING SUITE CAUGHT IN A FIRST DRAFT, kept as a probe. A boundary that swept
      nothing is *more* seamless and breaks
      `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md`: every level opens on an
      empty screen so the player can find the controls before anything finds them, and the last
      level's enemies would fill exactly that stretch.
    */
    broke: 'the boundary sweeping nothing, so a level opens on the last one’s field',
    guard: 'and so does the next level, which is the same rule and the other caller',
    edit: {
      path: 'src/app/frame.ts',
      // The seamless path skipping the shared reset entirely — which is what "seamless" means if it
      // is taken to include the bodies, and it is what a first draft of 0076 actually did.
      find: '  w.levelOrigin = w.cameraAlong;\n  beginScript(w);',
      replace: '  w.levelOrigin = w.cameraAlong;\n  w.nextWave = 0;\n  w.nextPickup = 0;\n  w.bossSpawned = false;\n  w.bossBeaten = false;\n  w.clearedIn = 0;',
    },
  },
];

// The breaks behind docs/decisions/0068-a-run-over-is-a-continue.md.
//
// ⚠️ A continue and a restart are one word apart in the code and a whole game apart on the screen,
// and every break below is a way of writing the restart by accident. The last one is the only guard
// over which of the three transitions the BUTTON is wired to, and it is why there is a browser test.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0068',
    suite: 'tests/continue.test.ts',
    /*
      ⚠️ THE REPORTED ONE INVERTED: *"the game itself doesn't reset and restart, but the ship and
      player stuff does."* `enterLevel` is what the other two transitions call and it is one line
      away — a continue that reached for it would sweep the field, rewind the camera and put the
      player back at the start line, which is precisely the thing they asked not to happen.
    */
    broke: 'a continue that re-enters the level, which is what the other two transitions do',
    guard: 'THE REPORTED ONE: the level carries on from exactly where it stopped',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: '      respawn(world);',
      replace: '      enterLevel(true);\n      respawn(world);',
    },
  },
  {
    decision: '0068',
    suite: 'tests/continue.test.ts',
    /*
      ⚠️ THE COUPLING BETWEEN THE TWO DISPATCHES. `src/state/root.ts` raises the run-over screen for a
      run at zero lives on the playing screen, so a resume that shows the screen without restocking
      the run is a button that does nothing — and does nothing every time it is pressed.
    */
    broke: 'the restock dropped, so the screen agreement puts the run-over screen straight back up',
    guard: 'THE REPORTED ONE: the level carries on from exactly where it stopped',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: "      dispatch({ slice: 'run', type: 'continued' });",
      replace: '      void dispatch;',
    },
  },
  {
    decision: '0068',
    suite: 'tests/run.test.ts',
    // `continued` is `begin` with one line deleted, so the break is that line put back — which is
    // exactly what a copy-paste of `begin` produces, and it reads as consistent rather than as wrong.
    broke: 'the level reset by the reducer, which is `begin` copied one line too far',
    guard: 'THE POINT OF IT: the level does not move',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      return {\n        lives: livesFor(state.difficulty),\n        level: state.level,',
      replace: '      return {\n        lives: livesFor(state.difficulty),\n        level: 0,',
    },
  },
  {
    decision: '0068',
    suite: 'tests/run.test.ts',
    // The other direction: a continue that keeps the level and forgets to restock, so the player is
    // handed back a run with nothing in it. Silent, because the screen half would still work.
    broke: 'the lives left where the last death put them',
    guard: 'and everything else goes back to what a run starts with',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        lives: livesFor(state.difficulty),',
      replace: '        lives: state.lives,',
    },
  },
  {
    decision: '0068',
    suite: 'tests/continue.test.ts',
    // The run restocked and no ship put on the field. The state would be perfect and the player would
    // be watching their own wreck ride the level — 0036's rule, from the other side.
    broke: 'the run restocked and the wreck left on the field',
    guard: 'and the ship is the one a death the run survives would have given them',
    edit: { path: 'src/app/lifecycle.ts', find: '      respawn(world);', replace: '      void world;' },
  },
  {
    decision: '0068',
    suite: 'tests/continue.test.ts',
    // Copied from `onward`, where it is right. Mid-level it deals the rest of that level a different
    // hand from the one the player was already flying through — 0021.
    broke: 'the spawn stream reseeded mid-level, which is the line `begin` and `onward` both carry',
    guard: 'and never reseeds the level’s own randomness, which is what would make it a new run',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: '      respawn(world);',
      replace: "      world.rng = makeRng('proof-scene').stream('spawns');\n      respawn(world);",
    },
  },
  /*
    ── THE PROBE FOR *the scatter the last death threw swept away by the continue* WAS HERE ─────────

    `docs/decisions/0256-a-pickup-keeps-the-count.md` took the scatter out of a death, so the last
    death throws nothing for a continue to sweep; that the field is otherwise left as it stood is
    `THE REPORTED ONE` above, whose probes stand.
  */
  {
    decision: '0068',
    suite: 'tests/continue.test.ts',
    // The word itself. It is the only account of this the player ever gets, and the screen has no
    // other line on it to correct the impression.
    broke: 'the button offering to start again rather than to continue',
    guard: 'says Continue, and the word is the promise',
    edit: {
      path: 'src/state/screens.ts',
      find: "    actions: [{ label: 'Continue', hint: '' }],",
      replace: "    actions: [{ label: 'Again', hint: '' }],",
    },
  },
  {
    decision: '0068',
    suite: 'tests/continue.browser.test.ts',
    /*
      ⚠️ THE WIRING, AND THE ONLY GUARD OVER IT. Everything above proves what `resume` does; this is
      the one line that decides the run-over screen calls it at all. Removed, the screen falls through
      to the branch every other screen takes and the button goes back to the title — which is what it
      did before 0068, and which no unit test can see because the decision is made over a canvas.
    */
    broke: 'the run-over button wired back to the title, which is what it did before this decision',
    guard: 'says Continue, and puts the player back into the game rather than back to the title',
    edit: {
      path: 'src/app/mount.ts',
      find: "    else if (screen === 'gameOver') lifecycle.resume();\n",
      replace: '',
    },
  },
];

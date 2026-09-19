// The Coil is a route — docs/decisions/0340-the-coil-is-a-route.md
//
// Every guard 0340 adds, broken on purpose. `node scripts/prove-guard.mjs 0340`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE FLOOR IGNORED, WHICH IS WHAT THE CROSSING LOOKS LIKE IF READINESS ALONE ENDS IT. Six of
      the seven places state little or no material of their own and 0331 bakes the next one from the
      approach, so by the time a boss is dead the place is usually already in the mixer's hands — and
      the chart would appear and vanish inside one frame for most of a run. A flicker between two
      levels, which is the thing this screen exists not to be.
    */
    broke: 'the crossing ends the moment the place is ready, with no floor at all',
    guard: 'holds through its floor even when the place is already loaded',
    edit: {
      path: 'src/content/travel.ts',
      find: '  return steps >= (skipped ? 0 : TRAVELS[travel].floorSteps) && ready;',
      replace: '  return ready;',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ AND A PRESS TAKING THE WAIT AS WELL AS THE FLOOR, WHICH IS THE CONTROL BECOMING A LIE. A press
      cannot make a bake land. The Black Heart is thirty-five seconds of synthesis and its first
      movement is twenty-five seconds long (0331); a crossing that ended on the press would arrive in
      silence, and the piece the whole place is built on would be over before it could be played.
    */
    broke: 'a press ends the crossing whether or not the place has arrived',
    guard: 'and a press takes the floor away and NOT the wait',
    edit: {
      path: 'src/content/travel.ts',
      find: '  return steps >= (skipped ? 0 : TRAVELS[travel].floorSteps) && ready;',
      replace: '  return skipped || (steps >= TRAVELS[travel].floorSteps && ready);',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ AND THE CEILING GONE, WHICH TURNS A BAKE THAT NEVER LANDS INTO A RUN THAT NEVER CONTINUES. It
      is the one branch here that exists for a machine or a browser nobody on this project has; the
      honest failure is a level that starts without its music, which is what every level did before
      0331 and is therefore a state the game is known to survive.
    */
    broke: 'the twenty-second ceiling removed, so a bake that never lands holds the run for ever',
    guard: 'and the ceiling ends it whatever the music is doing',
    edit: {
      path: 'src/content/travel.ts',
      find: '  if (steps >= TRAVEL_MAX_STEPS) return true;\n',
      replace: '',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE CHART NEVER RAISED AT ALL — `onward` as it was before this change. Everything else about a
      level boundary goes on working: the level is entered, the script changes, the run advances. The
      whole feature is simply absent, which is exactly the shape a feature regresses in when somebody
      resolves a conflict in this file by taking the older side.
    */
    broke: 'Onward goes straight back to the level, so the crossing never happens',
    guard: 'Onward goes to the chart, and the chart goes to the level',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: "      dispatch({ slice: 'screen', type: 'show', screen: 'travel' });",
      replace: "      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });",
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ AND THE CROSSING ADVANCING THE LEVEL A SECOND TIME, WHICH IS 0339 WEARING THIS CHANGE'S
      CLOTHES. Four commits before this one, a re-armed countdown fired `onCleared` nine times in
      twenty seconds and a run went from The Labyrinth to The Toxic Mire with Rime Shelf never played.
      A second screen between two levels, with its own clock and its own way out, is the same shape —
      so the assertion is written against the real verbs rather than assumed from the fix next door.
    */
    broke: 'arriving clears a level as well as lifting the curtain, so a crossing skips one',
    guard: 'THE BUG NEXT DOOR: crossing a level advances it exactly once',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: "      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });\n    },\n\n    resume(): void {",
      replace:
        "      dispatch({ slice: 'run', type: 'levelCleared' });\n" +
        "      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });\n    },\n\n    resume(): void {",
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE RADIUS BACK TO A STRAIGHT LINE, WHICH IS THE DEFECT THIS CHANGE SHIPPED FIRST AND THE
      GUARD CAUGHT. With the radius falling linearly while the angle advances at a constant rate, the
      inner legs die out: the last two places come out EXACTLY seven lane units apart, which is exactly
      a stop's own diameter, so the final two discs are tangent and the destination's ring cuts through
      the one before it. Every other claim about the curve stays green — it still descends, it still
      ends at the centre, and it is still inside its tile. It is only unreadable.
    */
    broke: 'the spiral’s radius falls in a straight line again, so its inner turns crowd into each other',
    guard: 'and no two places land on top of each other, measured in lane units',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  return CHART_OUTER * Math.pow(1 - u, CHART_TIGHTEN);',
      replace: '  return CHART_OUTER * (1 - u);',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ AND THE ROUTE PUSHED BACK OUT TO WHERE ITS OWN RING LEAVES THE BITMAP. 0.44 puts the first
      place's destination ring at 0.5135 of the tile, which is off the edge of it — the same bug 0277
      shipped with a serpent's halo bleeding into the next sprite in the atlas, and invisible in every
      screenshot until the run happens to be crossing into level one.
    */
    broke: 'the route widened until the outermost stop’s ring runs off its own bitmap',
    guard: 'and every stop is inside its own bitmap, halo and all',
    edit: {
      path: 'src/content/sprites.ts',
      find: 'export const CHART_OUTER = 0.42;',
      replace: 'export const CHART_OUTER = 0.44;',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ A PLACE LEFT OFF THE CHART, WHICH IS THE ONE THING THE TRACING PEN IS HERE FOR. Every
      arithmetic claim about the curve above is about the GEOMETRY and would stay perfectly green with
      six discs drawn on it; what this breaks is the picture, and 0027 is the decision that says the
      model agreeing with itself is not evidence about what the player is looking at.
    */
    broke: 'the last place is left off the drawing, though the curve still says where it goes',
    guard: 'and the drawing is one disc per level, at the positions the geometry says',
    edit: {
      path: 'src/render/bake.ts',
      find: '  for (let stop = 0; stop < stops.length; stop += 1) {',
      replace: '  for (let stop = 0; stop < stops.length - 1; stop += 1) {',
    },
  },
  {
    decision: '0340',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ THE BACKING DELETED WHILE `dims: false` STAYS, WHICH IS 0210's INVISIBLE-SCREEN BUG SEEN FROM
      THE OTHER SIDE. The dim is what makes every other panel readable for free; the moment a screen
      opts out, its words are on whatever the canvas is drawing — here a stroked spiral of coloured
      discs, directly under the place's own name. Nothing about the screen stops working and no
      assertion about its row moves.
    */
    broke: 'the crossing’s panel loses its backing, so the place name is written across its own route',
    guard: 'the crossing, which does not dim either, gives its panel a backing of its own',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-travel-panel {\n  background: color-mix(in srgb, var(--itc-void) 72%, transparent);\n',
      replace: '.itc-travel-panel {\n',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.browser.test.ts',
    /*
      ⚠️ THE OVERRIDE DROPPED, SO THE SHARED `margin: auto` CENTRES THE PANEL AGAIN — WHICH IS 0063's
      OWN BUG WITH ITS SIGN FLIPPED. There it was a banner that stayed over the middle of the playfield
      where the ship is; here it is a plate that sits over the middle of the chart, where the innermost
      stop is drawn. The rule is still in the stylesheet either way, so `tests/menu.test.ts`'s regex
      over `STYLE` stays green and only a computed measurement can see it — three of 0063's ten probes
      were computed style for exactly this reason.
    */
    broke: 'the panel’s bottom margin dropped, so the shared auto margin centres it over the chart again',
    guard: 'sits in the bottom half, keeps its backing, and its control still takes a press',
    /*
      ⚠️ THIS PROBE WENT STILL GREEN ONCE AND THE GUARD WAS NOT THE PROBLEM. It removed a
      `margin-top: auto` that the shared panel rule already sets on every side, so the break broke
      nothing — and the rule it meant to test, the SMALL bottom margin, was untouched and still doing
      its job. The redundant line is gone and this now points at the one that moves the panel.
    */
    edit: {
      path: 'src/app/chrome.ts',
      find: '  margin-bottom: min(1.25rem, 4cqh);',
      replace: '',
    },
  },
];

// The Coil is a route — docs/decisions/0340-the-coil-is-a-route.md
//
// Every guard 0340 adds, broken on purpose. `node scripts/prove-guard.mjs 0340`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE FLOOR IGNORED, WHICH IS WHAT THE BURN LOOKS LIKE IF READINESS ALONE LANDS THE SHIP. Six of
      the seven places state little or no material of their own and 0331 bakes the next one from the
      approach, so by the time a boss is dead the place is usually already in the mixer's hands — and
      the engines would start trailing off on the first step, before they had built at all.
    */
    broke: 'the ship may land the moment the place is ready, with no floor at all',
    guard: 'holds through its floor even when the place is already loaded',
    edit: {
      path: 'src/content/travel.ts',
      find: '  return steps >= TRAVELS[travel].floorSteps && ready;\n}\n\n/**\n * How hard the ship is burning',
      replace: '  return ready;\n}\n\n/**\n * How hard the ship is burning',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ AND THE WAIT IGNORED, WHICH IS THE BURN AS A TIMER. The Black Heart is thirty-five seconds of
      synthesis and its first movement is twenty-five seconds long (0331); a ship that landed on its
      floor regardless would arrive in silence, and the piece the whole place is built on would be over
      before it could be played.
    */
    broke: 'the ship lands on its floor whether or not the place has arrived',
    guard: 'and holds past its floor while the place is still being made',
    edit: {
      path: 'src/content/travel.ts',
      find: '  return steps >= TRAVELS[travel].floorSteps && ready;\n}\n\n/**\n * How hard the ship is burning',
      replace: '  return steps >= TRAVELS[travel].floorSteps;\n}\n\n/**\n * How hard the ship is burning',
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
    broke: 'the twenty-second ceiling removed, so a bake that never lands holds the burn for ever',
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
      ⚠️ THE EASE TAKEN OUT OF THE BURN, WHICH IS THE WORD *SMOOTHER* DELETED. Everything about the
      burn still works: it builds, holds and trails off, reaches full, and ends at nought. It does it
      in straight lines, so the rate every star on the screen moves at has a corner at each end of each
      ramp — four jolts a crossing, in the whole sky at once, which is a cut wearing a ramp's clothes.
    */
    broke: 'the burn ramps in straight lines, so it starts and stops with a corner',
    guard: 'builds from nothing, holds at full, and trails off to nothing — with no step in it anywhere',
    edit: {
      path: 'src/content/travel.ts',
      find: '  return t * t * (3 - 2 * t);',
      replace: '  return t < 1 ? t * 0.5 : 1;',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE SHIP LEFT BEHIND BY ITS OWN CAMERA, WHICH IS THE BUG THIS CHANGE FOUND WITH THIS GUARD.
      `flyShip` lags the ship's velocity towards `scroll + ask` with its mass, which is harmless while
      the scroll is constant and drags the ship the change in rate times four steps when it is not: at
      full burn, twenty-six units down the screen to the rear wall of its box, out of the player's
      hands, and the same distance forward again on arrival. Measured at 13.6 against 40.
    */
    broke: 'the ship is not told the camera accelerated, so the burn drags it to the back of its box',
    guard: 'the camera runs at the engine’s own multiple, and the ship goes with it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.warp > 0) w.ship.velAlong += w.scrollPerStep - scrolledAt;\n',
      replace: '',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE FLAME SWOLLEN ON ITS OLD OFFSET, WHICH IS THE FIRST VERSION OF THE LINE AS IT WAS WRITTEN.
      A blit scales about the sprite's centre and the flame's root is at its forward edge, so a flame
      2.8 times the size on the same centre starts six units inside the hull. The size is right, the
      row is right and the pulse is right; the flame is simply not coming out of the engines.
    */
    broke: 'the flame swells about its centre, so its root slides forward into the hull as it grows',
    guard: 'and the flame swells with the burn while its ROOT stays on the tail',
    edit: {
      path: 'src/app/frame.ts',
      find: '  flame.along = w.ship.along - row.trail - BURN_HALF * (swell - 1);',
      replace: '  flame.along = w.ship.along - row.trail;',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE LEVEL ENTERED AT THE START OF THE BURN, WHICH IS WHERE `onward` ALWAYS ENTERED IT. A
      level's opening waves are placed inside the spawn horizon on purpose (`src/content/levels.ts`),
      so a script entered before several seconds at twelve times the scroll rate has them flown past
      unseen — and the run arrives in a level that has already started without it.
    */
    broke: 'Onward enters the next level as well as starting the burn, so its opening is flown past',
    guard: 'Onward starts the burn and touches nothing, and arriving is what enters the level',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: "      dispatch({ slice: 'screen', type: 'show', screen: 'travel' });",
      replace: "      enterLevel(true);\n      dispatch({ slice: 'screen', type: 'show', screen: 'travel' });",
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ AND THE CROSSING ADVANCING THE LEVEL A SECOND TIME, WHICH IS 0339 WEARING THIS CHANGE'S
      CLOTHES. Four commits before this one, a re-armed countdown fired `onCleared` nine times in
      twenty seconds and a run went from The Labyrinth to The Toxic Mire with Rime Shelf never played.
      A second thing between two levels, with its own clock and its own way out, is the same shape.
    */
    broke: 'arriving clears a level as well as entering one, so a crossing skips a place',
    guard: 'THE BUG NEXT DOOR: crossing a level advances it exactly once',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: "      enterLevel(true);\n      world.rng = makeRng('proof-scene').stream('spawns');\n      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });\n    },\n\n    resume(): void {",
      replace:
        "      dispatch({ slice: 'run', type: 'levelCleared' });\n      enterLevel(true);\n      world.rng = makeRng('proof-scene').stream('spawns');\n      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });\n    },\n\n    resume(): void {",
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE WORLD STOPPED UNDER THE BURN, WHICH IS THE FIRST BUILD OF THIS FEATURE IN ONE WORD. It
      stopped the world and drew a chart in place of it, passed everything, and was played as *"it
      takes the player out of the game."* The row is the one place that design is a fact rather than a
      feeling, so it is the one place a guard can hold it.
    */
    broke: 'the crossing stops the world again, so the player is taken out of the game for it',
    guard: 'and the row it is on is the game with words over it, exactly as the level break is',
    edit: {
      path: 'src/state/screens.ts',
      find: '    actions: [],\n    choices: [],\n    steps: true,\n    dims: false,\n    timeout: null,\n    pushed: true,',
      replace: '    actions: [],\n    choices: [],\n    steps: false,\n    dims: false,\n    timeout: null,\n    pushed: true,',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE RADIUS BACK TO A STRAIGHT LINE, WHICH IS THE DEFECT THE CHART SHIPPED FIRST AND THE GUARD
      CAUGHT. With the radius falling linearly while the angle advances at a constant rate, the inner
      legs die out: the last two places come out EXACTLY one disc apart, tangent, with the destination's
      ring cutting through the one before it. It still descends, still ends at the centre, and is still
      inside its canvas. It is only unreadable.
    */
    broke: 'the spiral’s radius falls in a straight line again, so its inner turns crowd into each other',
    guard: 'and no two places land on top of each other, measured in their own discs',
    edit: {
      path: 'src/render/bake.ts',
      find: '  return CHART_OUTER * Math.pow(1 - u, CHART_TIGHTEN);',
      replace: '  return CHART_OUTER * (1 - u);',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ AND THE ROUTE PUSHED BACK OUT TO WHERE ITS OWN RING LEAVES THE CANVAS. 0.44 puts the first
      place's destination ring at 0.5135 of the tile, which is off the edge of it — invisible in every
      screenshot until the run happens to be crossing into level one.
    */
    broke: 'the route widened until the outermost stop’s ring runs off its own canvas',
    guard: 'and every stop is inside the canvas, ring and all',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const CHART_OUTER = 0.42;',
      replace: 'export const CHART_OUTER = 0.44;',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ EVERY LEG DRAWN AS FLOWN, WHICH IS THE CHART SAYING NOTHING ABOUT THE RUN. The route, the
      stops, the ring and every position are untouched and every geometric claim stays green; what is
      gone is the one thing the picture exists to say — *these are behind you and that one is not* —
      because a leg's colour is the whole of how it says it.
    */
    broke: 'every leg of the route takes its place’s colour, flown or not, so the chart shows no progress',
    guard: 'and the drawing is one disc per level where the curve says, with the legs behind it in their places’ colours',
    edit: {
      path: 'src/render/bake.ts',
      find: '    const done = leg < flown;\n    ctx.lineWidth = Math.max(1, size * 0.008);',
      replace: '    const done = leg < legs;\n    ctx.lineWidth = Math.max(1, size * 0.008);',
    },
  },
  {
    decision: '0340',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ THE BACKING DELETED WHILE `dims: false` STAYS, WHICH IS 0210's INVISIBLE-SCREEN BUG SEEN FROM
      THE OTHER SIDE. The dim is what makes every other panel readable for free; this one's words are
      over forty-four bright streaks at full burn, which is the busiest the backdrop ever gets.
    */
    broke: 'the banner loses its backing, so the place name is written across the sky at speed',
    guard: 'the crossing, which does not dim either, gives its panel a backing of its own',
    edit: {
      path: 'src/app/chrome.ts',
      // ⚠️ The backing became five layers — 0341's plate. Same break: the declaration stops being one,
      // so every layer of it goes and the words are on the sky. A custom property nothing reads.
      find: '  background:\n    var(--itc-hairline) top left / var(--itc-cut) var(--itc-cut) no-repeat,',
      replace: '  --itc-unread:\n    var(--itc-hairline) top left / var(--itc-cut) var(--itc-cut) no-repeat,',
    },
  },
  {
    decision: '0340',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ THE CROSSING DIMMED, WHICH PAINTS THE SPACE COLOUR OVER THE BURN IT IS A CAPTION ON. The
      world still steps, the streaks still stroke and the flame still swells, all of it under a lid.

      ⚠️ AND THIS IS THE PROBE THAT PROVES THE GUARD CAN SEE THE ROW AT ALL, which for one commit it
      could not: the test's own copy of *what chrome is* did not know about `pushed`, skipped a screen
      with no heading and no button, and went green over a row it had not looked at. Found only because
      a test that should have gone red did not.
    */
    broke: 'the crossing dims, so the space colour is painted over the burn it is a caption on',
    guard: 'and the screens that show the scene through them are the two that say so',
    edit: {
      path: 'src/state/screens.ts',
      find: '    steps: true,\n    dims: false,\n    timeout: null,\n    pushed: true,\n  },\n  /**\n   * Every level in the run is behind the player.',
      replace: '    steps: true,\n    dims: true,\n    timeout: null,\n    pushed: true,\n  },\n  /**\n   * Every level in the run is behind the player.',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.browser.test.ts',
    /*
      ⚠️ THE TOP MARGIN DROPPED, SO THE SHARED `margin: auto` PULLS THE BANNER DOWN OVER THE SHIP — 0063's
      OWN BUG. The rule is still in the stylesheet either way, so `tests/menu.test.ts`'s regex over
      `STYLE` stays green and only a computed measurement can see it.

      ⚠️ THE FIRST VERSION OF THIS PROBE WENT STILL GREEN, AND THE GUARD WAS NOT THE PROBLEM. It removed
      a line the shared rule already implied, so the break broke nothing; the redundant line was
      deleted and the probe re-pointed at the one that moves the panel.
    */
    broke: 'the banner’s top margin dropped, so the shared auto margins centre it over the ship',
    guard: 'sits clear of the middle, keeps its backing, takes no pointer and has nothing to press',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  margin-top: min(1.25rem, 4cqh);\n  margin-bottom: auto;\n',
      replace: '',
    },
  },
  {
    decision: '0340',
    suite: 'tests/travel.browser.test.ts',
    /*
      ⚠️ AND THE OVERLAY TAKING THE POINTER, WHICH LOOKS LIKE NOTHING AT ALL UNTIL A THUMB IS ON IT. A
      full-bleed box across a playfield the player is still steering in swallows every drag — 0063
      says so of the level break, and one of its three computed-style probes is this one.
    */
    broke: 'the crossing’s overlay takes pointer events, so it swallows the hand that is still flying',
    guard: 'sits clear of the middle, keeps its backing, takes no pointer and has nothing to press',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-travel, .itc-travel * { pointer-events: none; }\n',
      replace: '',
    },
  },
];

// The breaks behind docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md.
//
// ⚠️ The first one restores code that SHIPPED and that every guard in the repository was green for.
// That is the point: 0023's clamp is working exactly as written, and the player reported the result
// as *"almost a quarter of the screen space is not playable"* — the model right and the picture
// wrong, which is `docs/decisions/0027-measure-the-picture-not-the-model.md`'s whole subject.
//
// ⚠️ The load-bearing guard is in PIXELS of a real screen, because *a quarter of the screen* is a
// statement about the glass and not about world units.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0080',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly: the aspect floor back at 1.5. The box goes back to 150
      units against a 16:9 view of 177.8, and the strip the ship cannot enter goes back to a fifth of
      the screen. Nothing about the code looks wrong in this state — it is what shipped.
    */
    broke: 'the aspect floor returned to 1.5, so a fifth of the screen stops being playable again',
    guard: 'THE REPORTED ONE: the strip in front of the wall is a sliver, in pixels of a real screen',
    edit: { path: 'src/sim/camera.ts', find: 'export const MIN_ASPECT = REFERENCE_ASPECT;', replace: 'export const MIN_ASPECT = 1.5;' },
  },
  {
    decision: '0080',
    suite: 'tests/flight.test.ts',
    /*
      ⚠️ THE HALF-FIX, and it is the one a hand would actually write: raise the floor and leave the
      margin flat. The box then reaches 96% along and 88% across — the screen's shape and the
      playable area disagree, which is the half of the report the floor alone does not answer.
    */
    broke: 'the along inset left as a flat margin, so the box is not the shape of the screen',
    guard: 'insets by the same fraction on both axes',
    edit: {
      path: 'src/sim/flight.ts',
      find: 'export const PLAYER_ALONG_MARGIN = PLAYER_ALONG_SPAN * PLAYER_INSET;',
      replace: 'export const PLAYER_ALONG_MARGIN = PLAYER_MARGIN;',
    },
  },
  {
    decision: '0080',
    suite: 'tests/flight.test.ts',
    /*
      ⚠️ THE TRAILING EDGE, which is the end a reader forgets. The clamp reads the along margin at
      both ends of the box; leaving the across one on the back edge is invisible in a screenshot and
      hands the player a box that is generous at one end and mean at the other.
    */
    broke: 'the trailing edge left on the across margin, so the box is lopsided along the lane',
    guard: 'the box travels with the camera, so retreat distance never grows',
    edit: {
      path: 'src/sim/flight.ts',
      find: '  const minAlong = cameraAlong + PLAYER_ALONG_MARGIN;',
      replace: '  const minAlong = cameraAlong + PLAYER_MARGIN;',
    },
  },
  {
    decision: '0080',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE LEAD LEFT ON THE ACROSS MARGIN, which is the OTHER end of probe 3's break and is
      invisible to the picture. `PLAYER_LEAD` is the one description both the clamp and the painter
      read (0074), so moving it moves the wall and the mark together — nothing about the line looks
      wrong. What is wrong is the box: the forward inset becomes 6 while the trailing one stays 10.7,
      and the player owns a lopsided rectangle. Only a guard over the two ends can see it.
    */
    broke: 'the forward inset left on the across margin, so the box is lopsided the other way',
    guard: 'and the trailing edge gives up the same share, because the box is the view’s own shape',
    edit: {
      path: 'src/sim/flight.ts',
      find: 'export const PLAYER_LEAD = PLAYER_ALONG_SPAN - PLAYER_ALONG_MARGIN;',
      replace: 'export const PLAYER_LEAD = PLAYER_ALONG_SPAN - PLAYER_MARGIN;',
    },
  },
  {
    decision: '0080',
    suite: 'tests/camera.test.ts',
    /*
      ⚠️ THE COST, UNCHECKED. Which devices get bars is what this decision spent to buy the box, and
      a floor nudged up again — to catch one more class of screen — is exactly the edit that looks
      harmless and is a product decision.
    */
    broke: 'the floor nudged past 16:9, so another class of screen is quietly letterboxed',
    guard: 'bars the two laptop classes the player traded away, and nothing else that was inside',
    edit: { path: 'src/sim/camera.ts', find: 'export const MIN_ASPECT = REFERENCE_ASPECT;', replace: 'export const MIN_ASPECT = 1.9;' },
  },
  {
    decision: '0080',
    suite: 'tests/camera.test.ts',
    /*
      ⚠️ THE ONE THE FLOOR ITSELF EXPOSED. `scale` is the smaller of two ratios, so the axis it came
      from divides out exactly — in real arithmetic. In floating point a 16:10 laptop against a
      16:9 floor lands a ten-thousandth of a nanometre below zero, and a negative gutter is *world
      that exists and is not on screen*. Without the floor, a crop and a rounding error are the same
      shape.
    */
    broke: 'the gutter left unfloored, so a rounding error and a crop wear the same sign',
    guard: 'never crops, and never stretches',
    edit: {
      path: 'src/sim/camera.ts',
      find: '    gutterAlong: Math.max(0, (long - alongSpan * scale) / 2),',
      replace: '    gutterAlong: (long - alongSpan * scale) / 2,',
    },
  },
  {
    decision: '0080',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE SKY'S PERSPECTIVE, taken back. The near layer at the size it had is the *"still too close
      to play view"* the report describes — and it is under a bullet either way, so the guard that
      catches it has to be about the layer's relationship to the far one rather than about a ceiling.
    */
    broke: 'the near layer’s stars returned to the far layer’s size, so the depth cue is size alone again',
    guard: 'and the near layer is the quiet one, on every count that buys attention',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.2 };',
      replace: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.6 };',
    },
  },
];

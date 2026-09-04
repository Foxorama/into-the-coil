// The breaks behind docs/decisions/0221-a-planet-is-not-a-space.md.
//
// ⚠️ THREE FAULTS WITH ONE CAUSE, AND 0220's OWN GUARDS WERE GREEN THROUGH ALL OF THEM. Reported:
// *"the planets still have the starry space backdrop visible, ground features need be properly have
// nothing behind them and the sky in the background needs to match the sky."* 0220 had checked where
// a skyline sat and how its ridges receded — both true of ground painted into the WEATHER tile, at an
// alpha, with two star fields drawn on top of it afterwards.
//
// ⚠️ A GUARD ON THE RIGHT QUANTITY IN THE WRONG LAYER IS STILL GREEN, which is 0027's *measure the
// picture, not the model* arriving one level up: the model of a horizon was right and the horizon was
// see-through and behind the stars.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0221',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE REPORT ITSELF. Star fields are drawn AFTER the weather, so any ground that lives in the
      weather tile has them in front of it — and putting them back into a planet's sky reads in a diff
      as *a planet got its depth back*. There is nothing to draw over a field of dots that is better
      than not drawing it.
    */
    broke: 'the star fields put back into a planet’s sky, which is the backdrop that was reported',
    guard: 'a planet has no field of stars in its sky',
    edit: {
      path: 'src/app/mount.ts',
      find: 'export const SKY_ON_A_PLANET = [\n  { sprite: SPRITE.skyNebula, extent: SPRITE_EXTENT.skyNebula, depth: 0.09 },',
      replace:
        'export const SKY_ON_A_PLANET = [\n  { sprite: SPRITE.skyNebula, extent: SPRITE_EXTENT.skyNebula, depth: 0.09 },\n' +
        '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },',
    },
  },
  {
    decision: '0221',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ ORDER AND DEPTH CONFLATED, WHICH IS THE MISTAKE THAT LOOKS LIKE A FIX. A mountain range is far
      away and in front of the stars, and those are separate facts: `paintScene` walks the array in
      order and that is the only thing deciding what covers what. Sorting the sky by depth is the
      obvious tidy-up and it puts the ground back behind everything.
    */
    broke: 'the ground drawn before the weather, so something is in front of a planet again',
    guard: 'the ground is drawn LAST',
    edit: {
      path: 'src/app/mount.ts',
      find: '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 2.7 },\n  { sprite: SPRITE.skyGround, extent: SPRITE_EXTENT.skyGround, depth: 0.45 },',
      replace:
        '  { sprite: SPRITE.skyGround, extent: SPRITE_EXTENT.skyGround, depth: 0.45 },\n' +
        '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 2.7 },',
    },
  },
  {
    decision: '0221',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE OTHER HALF OF THE REPORT, AND IT IS ONE NUMBER. *"Ground features need be properly have
      nothing behind them."* 0220's ridges were opaque in intent and 0.45 to 0.88 in fact, and every
      claim about their shape and position was true. An alpha on a mass looks like a tuning knob.
    */
    broke: 'the ground made translucent, so the sky comes through the land again',
    guard: 'the ground is OPAQUE',
    edit: {
      path: 'src/render/bake.ts',
      find: 'function fillTo(ctx: Pen, colour: string, crest: readonly number[][], size: number, downward: boolean): void {\n  ctx.globalAlpha = 1;',
      replace:
        'function fillTo(ctx: Pen, colour: string, crest: readonly number[][], size: number, downward: boolean): void {\n  ctx.globalAlpha = 0.8;',
    },
  },
  {
    decision: '0221',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE FOURTH TIME THIS EXACT TRAP HAS BEEN WALKED INTO. The tile is twice the lane and blitted
      centred, so tile y 0.25 to 0.75 is everything the player can see: The Approach's horizon shipped
      at 0.86, the Pillars' far columns were given feet at 0.97, and Saurian Belt's ridges were
      authored against the same misunderstanding. `0.95` is a horizon low in its tile, which is exactly
      where a horizon goes and is entirely off the screen.
    */
    broke: 'a planet’s ground authored below the lane, where the tile is but the player is not',
    guard: 'a planet’s skyline is on the lane',
    edit: {
      path: 'src/render/bake.ts',
      find: '    { base: 0.6, jag: 0.026, haze: 0.55, steps: 26, lit: 0.3 },\n    { base: 0.655, jag: 0.04, haze: 0.28, steps: 19, lit: 0.45 },\n    { base: 0.715, jag: 0.055, haze: 0, steps: 14, lit: 0.6 },',
      replace:
        '    { base: 0.95, jag: 0.026, haze: 0.55, steps: 26, lit: 0.3 },\n' +
        '    { base: 0.96, jag: 0.04, haze: 0.28, steps: 19, lit: 0.45 },\n' +
        '    { base: 0.97, jag: 0.055, haze: 0, steps: 14, lit: 0.6 },',
    },
  },
  {
    decision: '0221',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE HORIZON INVERTED, AND IT IS THE ACCESSIBILITY FLOOR RATHER THAN A TASTE. A planet now
      covers a third of the screen with something `tests/sky.test.ts` has never heard of — that guard
      measures every ink against a place's `space` — so land brighter than its sky would put the
      game's worst contrast somewhere nothing is checking. Brightening the ground is also the obvious
      thing to try when a mountain range reads as too dark.
    */
    broke: 'a planet’s land made brighter than its own sky, which puts the worst contrast off the guard',
    guard: 'land is DARKER than the sky over it',
    edit: {
      path: 'src/content/themes.ts',
      find: "    ground: { vivid: '#0a1220', 'high-contrast': '#000208' },",
      replace: "    ground: { vivid: '#8fa8d0', 'high-contrast': '#c8d4e8' },",
    },
  },
  {
    decision: '0221',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE TWO TABLES DISAGREEING, WHICH IS 0220's LANDMARK HOLE ARRIVING A SECOND TIME. A place with
      a ground COLOUR and no ground DRAWING keeps its empty tile and loses its star fields — so it is a
      place with nothing in the sky at all, which draws perfectly and says nothing.
    */
    broke: 'a place given a ground colour and no ground drawing, so it is a planet with nothing on it',
    guard: 'a place has land in `THEMES` exactly when it draws land',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rime: (ctx, land, sky, glow, size) => drawShelf(ctx, land, sky, glow, size),',
      replace: '  rime: null,',
    },
  },
  {
    decision: '0221',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE CORRIDOR OPENED UNTIL IT IS A SKY WITH A FLOOR. *"A tight narrow corridor above the toxic
      pools below and beneath the overhanging canopy above."* Raising the canopy is what anybody does
      when they think the backdrop is crowding the game — and the lane is a fixed 100 units that the
      ship uses all of, so it is a real tension rather than a silly edit.
    */
    broke: 'the canopy lifted out of the way, so the mire stops being an enclosure',
    guard: 'The Toxic Mire’s corridor is tight',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const canopy = skyline(size, 'mire/canopy', 0.4, 0.075, 24, 'down');",
      replace: "  const canopy = skyline(size, 'mire/canopy', 0.27, 0.075, 24, 'down');",
    },
  },
  {
    decision: '0221',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ AND THE SECOND SKY HAS TO OBEY 0069 TOO. Every rule in `tests/budget.test.ts` was written when
      there was one sky, so a planet's could have crossed in front of the game with nothing to say so —
      *only the streak layer may be in front, and only one of them*. The ground at 1.2 is a plausible
      number for something close to the camera and it is a curtain.
    */
    broke: 'a planet’s ground moved in front of the game, where only the streaks may go',
    guard: 'only the streak layer may be in FRONT of the game',
    edit: {
      path: 'src/app/mount.ts',
      find: '  { sprite: SPRITE.skyGround, extent: SPRITE_EXTENT.skyGround, depth: 0.45 },',
      replace: '  { sprite: SPRITE.skyGround, extent: SPRITE_EXTENT.skyGround, depth: 1.2 },',
    },
  },
];

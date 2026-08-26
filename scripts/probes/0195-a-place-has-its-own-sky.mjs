// The breaks behind docs/decisions/0195-a-place-has-its-own-sky.md.
//
// ⚠️ NOTHING HERE BREAKS WHETHER A SKY LOOKS RIGHT — docs/decisions/0192-a-guard-holds-an-invariant.md.
// *Ice shards read as ice* is a taste. What these break are the three things that make the field a
// field: that it is keyed to the place, that the place cannot thicken it past the bound that keeps a
// sky behind the game, and that a level boundary asks for a new one at all.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0195',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE STATE THE GAME SHIPPED IN, AND IT IS ONE STRING. With the stream keyed by the layer alone,
      all seven places draw the same stars in the same places and every guard in the repository is
      green over it — which is exactly what happened, and is the report this decision answers:
      *"the same starry canvas and a slight hue change on each level."*
    */
    broke: 'the sky stream keyed by the layer alone, so all seven places draw the same stars',
    guard: 'THE REPORTED ONE: no two places draw the same stars in the same places',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const rng = makeRng(\'sky\').stream(`${theme}/${kind}`);',
      replace: "  const rng = makeRng('sky').stream(kind);",
    },
  },
  {
    decision: '0195',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE CLAMP REMOVED, WHICH IS THE DEFECT A GUARD ALREADY CAUGHT ONCE. A first draft of the style
      table asked for marks 1.3× the shared ceiling for tumbling rock, and tests/budget.test.ts measured
      skyNear at 0.36 world units — 40% of a bullet. docs/decisions/0069-the-sky-is-behind-the-game.md's
      bound lives on the shared constant, so the clamp is what keeps it true of every place rather than
      of the one that shipped first.

      ⚠️ IT REDDENS ON A NUMBER THE TABLE IS ALLOWED TO HOLD, which is why the guard reads the field
      rather than the row — docs/decisions/0027-measure-the-picture-not-the-model.md.
    */
    broke: 'the ceiling clamp removed, so a place may draw scenery as thick as a bullet',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: a place may THIN its sky and may never thicken it',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const biggest = perUnit * SKY_MAX_STAR_UNITS[kind] * Math.min(1, style.size);',
      replace: '  const biggest = perUnit * SKY_MAX_STAR_UNITS[kind] * (style.size * 1.6);',
    },
  },
  {
    decision: '0195',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE WHOLE DECISION MADE INERT WITH THE SUITE STILL GREEN ON EVERY FIELD. Seven different skies
      exist, are measured, and never reach the screen: the atlas is baked once at boot and nothing else
      asks for another. This is the assertion that turns a table into a picture.
    */
    broke: 'the place dropped from the staleness test, so the atlas never re-bakes at a level boundary',
    guard: 'THE ONE THE BOUNDARY TURNS ON: an atlas baked for one place is STALE for another',
    edit: {
      path: 'src/render/bake.ts',
      find: '  if (atlas.theme !== theme) return true;',
      replace: '  // the place no longer makes an atlas stale',
    },
  },
  {
    decision: '0195',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE CLOUDS LEFT SHARED WHILE THE STARS MOVED, which is the half-arrival this decision would
      otherwise ship. The nebula is the loudest thing in the backdrop at Ember Nebula — fourteen clouds
      where The Coil Labyrinth has two — and one photograph in seven colours is the complaint one layer
      down from the one being answered.
    */
    broke: 'the nebula stream left shared, so every place has the same clouds in the same places',
    guard: 'and the nebula is a place’s too',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const rng = makeRng('sky').stream(`${theme}/nebula`);",
      replace: "  const rng = makeRng('sky').stream('nebula');",
    },
  },
];

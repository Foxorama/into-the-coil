// The breaks behind docs/decisions/0232-each-place-has-its-own-enemy.md.
//
// ⚠️ NOTHING HERE BREAKS HOW A RAPTOR LOOKS — docs/decisions/0192-a-guard-holds-an-invariant.md.
// Whether a crescent reads as a jaw is judged on `scripts/shot-sheet.mjs`. What these break is what
// makes a signature a signature: one per place, sent by that place only, a silhouette of its own,
// and a bullet-and-pattern of its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0232',
    suite: 'tests/signature.test.ts',
    /*
      ⚠️ TWO PLACES GIVEN ONE SIGNATURE, which is the copy a hand makes starting an eighth place from
      a seventh's row — and it leaves Ember Nebula with The Approach's picket and nothing of its own.
    */
    broke: 'two places given one signature',
    guard: 'THE REPORTED ONE: every place names a signature kind, and no two places name the same one',
    edit: {
      path: 'src/content/enemies.ts',
      find: "  nebula: 'moth',",
      replace: "  nebula: 'picket',",
    },
  },
  {
    decision: '0232',
    suite: 'tests/signature.test.ts',
    /*
      ⚠️ A SIGNATURE SENT BY A SECOND LEVEL. One wave copied between levels is enough: the moth is
      then a thing the player meets in two places, and the whole of *unique per level* is gone from
      the one axis a body can be unique on.
    */
    broke: 'a signature sent by a second level',
    guard: 'and a signature is sent by its own place’s level and by no other',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 584, enemy: 'moth', formation: 'column', count: 5, lane: 35 },",
      replace: "  { at: 584, enemy: 'picket', formation: 'column', count: 5, lane: 35 },",
    },
  },
  {
    decision: '0232',
    suite: 'tests/signature.test.ts',
    /*
      ⚠️ A SIGNATURE GIVEN ANOTHER KIND'S HULL. The picket drawn with the shard's hexagon is still a
      row, still a place's own, still painted in its skin — and at twenty pixels it is a shard.
    */
    broke: 'a signature given another kind’s hull',
    guard: 'and every signature is a new silhouette against every other enemy hull',
    edit: {
      path: 'src/render/bake.ts',
      find: '      trace(ctx, f, PICKET_HULL);',
      replace: '      trace(ctx, f, SHARD_HULL);',
    },
  },
  {
    decision: '0232',
    suite: 'tests/signature.test.ts',
    /*
      ⚠️ A SIGNATURE GIVEN ANOTHER SHOOTER'S BULLET AND PATTERN. The sentry throwing the turret's
      three-way spray of slabs is a turret with corners — 0110's rule, on the seven.
    */
    broke: 'a signature given another shooter’s bullet and pattern',
    guard: 'and a firing signature sends a bullet-and-pattern no other kind sends',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    attack: { kind: 'wall', shots: 2, gap: 15 },",
      replace: "    attack: { kind: 'spray', shots: 3, spread: 0.85 },",
    },
  },
];

// The breaks behind docs/decisions/0227-a-sprite-is-painted-not-filled.md.
//
// ⚠️ NOTHING HERE BREAKS HOW A SHIP LOOKS — docs/decisions/0192-a-guard-holds-an-invariant.md.
// Whether the fighter's canopy is the right shape is a taste, judged on `npm run sheet` and
// `scripts/shot-sheet.mjs`. What these break is what the paint may never do: leave the hull while
// solid, reach the next bitmap while translucent, or survive onto a hurt twin — and, for the flares,
// the mechanism that turns a page, which every table would be green without.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0227',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE PLUME MADE SOLID. It is authored to trail past the tail, and it is allowed to because it
      is translucent — a plume is not a part of the hull the ship collides as. At full alpha it is a
      solid slab hanging off the back of a silhouette every extent and every pairing were written
      against, and on the sheet it looks like a slightly longer exhaust.
    */
    broke: 'the ship’s exhaust plume drawn solid, so a translucent mark outside the hull becomes a solid one',
    guard: 'THE 0149 ONE: every solid mark on a body is inside its hull',
    edit: {
      path: 'src/render/bake.ts',
      find: '  for (const side of [SHIP_PLUME, mirrored(SHIP_PLUME)]) poly(ctx, f, palette.bullet, side, 0.55);',
      replace: '  for (const side of [SHIP_PLUME, mirrored(SHIP_PLUME)]) poly(ctx, f, palette.bullet, side, 1);',
    },
  },
  {
    decision: '0227',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ A HALO GROWN INTO THE NEXT BITMAP. The pulse's glow may leave the disc because it is a light;
      what it may not do is reach the edge of the sprite's own box, where the bake clips it flat and
      the next bitmap in the atlas begins. A bigger number here is a brighter bullet on the sheet and
      a square-edged one in the game.
    */
    broke: 'the pulse’s halo drawn out to the edge of its own bitmap',
    guard: 'and a translucent mark — a plume, a halo — stays inside the sprite’s own box',
    edit: {
      path: 'src/render/bake.ts',
      find: '      glow(ctx, f, palette.bullet, 0, 0, 1.15, 0.55);',
      replace: '      glow(ctx, f, palette.bullet, 0, 0, 1.4, 0.55);',
    },
  },
  {
    decision: '0227',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE PAINT LEFT ON THE FLASH. It is the obvious simplification — one arm, one call, no
      condition — and it produces a paler ship where 0035 wants a hit: the canopy and the engines
      still there in the middle of the yellow.
    */
    broke: 'the ship’s paint drawn onto its hurt twin, so a hit reads as a paler ship',
    guard: 'and a hurt twin is the hull flat in its flash ink',
    edit: {
      path: 'src/render/bake.ts',
      find: '      seal(ctx);\n      if (!hurt) paintShip(ctx, f, palette, 0);\n      return;',
      replace: '      seal(ctx);\n      paintShip(ctx, f, palette, 0);\n      return;',
    },
  },
  {
    decision: '0227',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ THE PAGE THAT NEVER TURNS. Four frames in the atlas, four in the row, a life of sixteen steps
      — and an entity that shows the flash for all of them. Every table is correct; only a stepped
      world can see that the walk stalls.
    */
    broke: 'a flare that never turns a page, so the explosion is a flash held for its whole life',
    guard: 'turns every page in order, holds each for its whole count, and goes out on the last',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const page = last - Math.floor((e.lifeFor - 2) / row.hold);',
      replace: '    const page = 0 * last;',
    },
  },
  {
    decision: '0227',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ THE HITS LOG NOT HANDED TO THE MISSILE PAIRING. `collideInto` defaults it to null, so the
      line compiles, the missiles land, the enemies flash, and nothing marks where — which is exactly
      what a missile landing looked like before 0227.
    */
    broke: 'the missile pairing run without its hits log, so a landing marks nothing',
    guard: 'and a missile landing on something that survives it sparks where it hit',
    edit: {
      path: 'src/app/frame.ts',
      find: '    killedByShots += collideInto(w.missiles, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths, w.hits);',
      replace: '    killedByShots += collideInto(w.missiles, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);',
    },
  },
  {
    decision: '0227',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ A FRAME LISTED TWICE, which is the edit a hand makes copying a row: the walk stalls on one
      picture for two holds and the last frame is never shown.
    */
    broke: 'a burst frame listed twice, so the walk stalls and the last frame is never shown',
    guard: 'every frame of a flare is a different bitmap, and each is bigger than the last',
    edit: {
      path: 'src/content/debris.ts',
      find: 'const BURST_FRAMES: readonly number[] = [SPRITE.burst0, SPRITE.burst1, SPRITE.burst2, SPRITE.burst3];',
      replace: 'const BURST_FRAMES: readonly number[] = [SPRITE.burst0, SPRITE.burst1, SPRITE.burst1, SPRITE.burst3];',
    },
  },
  {
    decision: '0227',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ THE FIREBALL NOT LIT AT AN ENEMY DEATH — the one line the whole ask rests on, and the one an
      unrelated edit to that loop is likeliest to lose. Shards still fly; the picture is 0227 undone.
    */
    broke: 'an enemy death throwing shards and no fireball',
    guard: 'THE REPORTED ONE: an enemy dying lights a burst where it died',
    edit: {
      path: 'src/app/frame.ts',
      find: "      flare(w, w.deaths.along[i]!, w.deaths.across[i]!, 'burst');\n",
      replace: '',
    },
  },
];

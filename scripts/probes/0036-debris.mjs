// The breaks behind docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md.
//
// ⚠️ The first of these restores the state the game shipped in for three play-tests: a death was a
// release and nothing else, so "it died", "it drifted off the edge" and "the collision missed and it
// is behind something" all drew the same picture — none. Every one of those was reported as a
// COLLISION bug, and the collision was correct every time.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0036',
    suite: 'tests/combat.test.ts',
    broke: 'a death leaving nothing behind, so the screen cannot tell dying from vanishing',
    guard: 'an enemy that dies leaves fragments where it died',
    edit: {
      path: 'src/app/frame.ts',
      find: '      burst(w, w.deaths.along[i]!, w.deaths.across[i]!, BURST.enemy);',
      replace: '      if (i < 0) burst(w, w.deaths.along[i]!, w.deaths.across[i]!, BURST.enemy);',
    },
  },
  {
    decision: '0036',
    suite: 'tests/combat.test.ts',
    // ⚠️ The position is recorded BEFORE the release, because `releaseAt` swaps the last live item
    // into the freed slot and a released slot is the next thing `spawn` hands out. Read it after and
    // the burst lands on whatever moved into the hole.
    broke: 'the death position never recorded, so a burst lands wherever the log was last left',
    guard: 'an enemy that dies leaves fragments where it died',
    edit: {
      path: 'src/sim/collide.ts',
      find: '          deaths.along[deaths.count] = target.along;',
      replace: '          deaths.along[deaths.count] = 0;',
    },
  },
  {
    decision: '0036',
    suite: 'tests/combat.test.ts',
    broke: 'debris waiting for the camera to cull it rather than retiring on its own timer',
    guard: 'the fragments retire themselves, without the camera having to pass them',
    edit: {
      path: 'src/sim/entity.ts',
      find: '    if (e.lifeFor > 0 && --e.lifeFor === 0) {',
      replace: '    if (false && e.lifeFor > 0 && --e.lifeFor === 0) {',
    },
  },
  {
    decision: '0036',
    suite: 'tests/combat.test.ts',
    // ⚠️ 0021's exact case: a fragment's direction is the most cosmetic roll in the game, and on the
    // shared stream it would shift every spawn after it — so the level a player gets would depend on
    // how many things they happened to blow up.
    broke: 'the burst drawing from the spawn stream, so blowing something up rebuilds the level after it',
    guard: 'the burst rolls on its own stream, so an explosion cannot move a wave',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const angle = w.burstRng.range(0, Math.PI * 2);',
      replace: '    const angle = w.rng.range(0, Math.PI * 2);',
    },
  },
  {
    decision: '0036',
    suite: 'tests/combat.test.ts',
    broke: 'the ship blinking to the same ink an enemy flashes, which is one channel carrying two meanings',
    guard: 'every enemy kind has a hit sprite that is not its ordinary one',
    edit: {
      path: 'src/content/ships.ts',
      find: '    spriteHit: SPRITE.shipHit,',
      replace: '    spriteHit: SPRITE.ship,',
    },
  },
  {
    decision: '0036',
    suite: 'tests/combat.test.ts',
    // ⚠️ NOT a probe for a bug that happened — for one that nearly did, while adding `debris`.
    // `SPRITE_KINDS` is the baking order and `SPRITE` is the blit index, they are two descriptions of
    // one fact, and nothing type-checks that they agree. Out of step, every entity in the game draws
    // as something else.
    broke: 'the baking order and the blit index disagreeing, so every entity draws as the wrong thing',
    guard: 'every kind blits at the index its baking order gives it',
    edit: {
      path: 'src/content/sprites.ts',
      find: "  'pickup',\n  'debris',\n];",
      replace: "  'debris',\n  'pickup',\n];",
    },
  },
];

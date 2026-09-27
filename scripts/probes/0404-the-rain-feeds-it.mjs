// The rain feeds it — docs/decisions/0404-the-rain-feeds-it.md
//
// Every guard 0404 adds, broken on purpose. `node scripts/prove-guard.mjs 0404`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0404',
    suite: 'tests/medusa.test.ts',
    // The rain passing through the animal that let it fall, as it did before.
    broke: 'the feed never run',
    guard: 'THE ASK: a moon jelly that drifts into the jellyfish is gone',
    edit: {
      path: 'src/app/frame.ts',
      find: '    feedBoss(w);',
      replace: '    void feedBoss;',
    },
  },
  {
    decision: '0404',
    suite: 'tests/medusa.test.ts',
    // Only the bell feeds it: *"this includes if they hit a tentacle"* dropped.
    broke: 'the tentacles left out of what a jelly may touch',
    guard: 'and one that drifts into a tentacle feeds it too',
    edit: {
      path: 'src/app/frame.ts',
      find: '    for (let j = 0; !touches && j < w.bossBody.size; j++) touches = overlaps(e, w.bossBody.at(j), 1);',
      replace: '    for (let j = 0; !touches && j < 0; j++) touches = overlaps(e, w.bossBody.at(j), 1);',
    },
  },
  {
    decision: '0404',
    suite: 'tests/medusa.test.ts',
    // A heal held under the last fifth's line, so a bell once open stays open — the answer not given.
    broke: 'the heal capped under the last fifth’s line',
    guard: 'and a heal over the last fifth',
    edit: {
      path: 'src/app/frame.ts',
      find: '    hull.health = Math.min(w.bossFullHealth, hull.health + fall.feeds * w.bossFullHealth);',
      replace: '    hull.health = Math.min(w.bossFullHealth * 0.2, hull.health + fall.feeds * w.bossFullHealth);',
    },
  },
  {
    decision: '0404',
    suite: 'tests/medusa.test.ts',
    // The rain falling on its side, which is what was reported.
    broke: 'no quarter turn for a falling jelly',
    guard: 'THE RAIN, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    e.turn = Math.PI / 2;',
      replace: '    e.turn = 0;',
    },
  },
  {
    decision: '0404',
    suite: 'tests/medusa.test.ts',
    // Every jelly the same glow.
    broke: 'every falling jelly the rose glow',
    guard: 'THE RAIN, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const tint = tints[Math.floor((hashed - Math.floor(hashed)) * tints.length)]!;',
      replace: '      const tint = tints[1]!;',
    },
  },
];

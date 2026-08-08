// The breaks behind docs/decisions/0078-the-sky-moves-a-third-faster.md.
//
// ⚠️ All three plant a sky that renders perfectly, costs exactly the same number of blits, and wraps
// without a seam. A depth is invisible to every other guard in this file's suite — which is how the
// copy 0078 deleted survived being wrong for three decisions.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0078',
    suite: 'tests/budget.test.ts',
    // ⚠️ THE REPORTED ONE, restored exactly: 0065's depths, which is the casual stroll.
    broke: 'the sky returned to its old rate, which is the stroll that was reported',
    guard: 'moves both layers a third faster, which is what was asked for',
    edit: {
      path: 'src/app/mount.ts',
      find: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.4 },',
      replace: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.3 },',
    },
  },
  {
    decision: '0078',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE HALF-READ, and it is what a hand does with *"both layers a third faster"* at speed: the
      near one moves and the far one does not. The sky is then a third faster and has lost the only
      thing that made it read as depth, and no screenshot of a single frame can show it.
    */
    broke: 'only the near layer sped up, so the parallax pays for the speed',
    guard: 'scales BOTH by the same factor, so the depth cue is not what paid for the speed',
    edit: {
      path: 'src/app/mount.ts',
      find: '{ sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.16 },',
      replace: '{ sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.12 },',
    },
  },
  {
    decision: '0078',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE OTHER SIDE OF THE CORRIDOR, and the one a report like this invites. *"Faster"* has no
      natural stopping point, and a second pass answering it the same way puts the near field at the
      rate of the things that can kill the player — which is 0069's subject, and the sky ceasing to be
      a background at all.
    */
    broke: 'the sky sped up again until it moves with the world and stops being a background',
    guard: 'is still behind the game, which is the ceiling 0065 set',
    edit: {
      path: 'src/app/mount.ts',
      find: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.4 },',
      replace: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.8 },',
    },
  },
];

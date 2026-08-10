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
    //
    // ⚠️ RENAMED GUARD — `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md`
    // multiplied a second ask onto this one, so the assertion is now against twice what 0065 shipped
    // rather than a third more. The break is the same line and the same restore.
    broke: 'the sky returned to its old rate, which is the stroll that was reported',
    guard: 'moves both layers twice as fast as they shipped, which is what was asked for',
    edit: {
      path: 'src/app/mount.ts',
      find: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.825 },',
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
      find: '{ sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },',
      replace: '{ sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.16 },',
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
    /*
      ⚠️ **AND WHICH RULE REFUSES IT CHANGED WITH 0103, WHICH IS WORTH MORE THAN THE RE-POINT.** Under
      0065's absolute, 1.2 was refused for the single reason that it is above 1. Under 0103 a depth of
      1.2 is a perfectly legal place — for a mark thin enough to earn it — and what refuses THIS one is
      that it is made of DOTS: `and only the streak layer may be in FRONT of the game`. The near
      layer's own clearance is 0.155 and 1.2 clears it, so the arithmetic alone lets this through.

      That is the same shape 0101 recorded about 0097's exception list, one turn further on: the
      reason a fast dot field is wrong was never *it is above a number*, it is *it is a field of
      dot-shaped things flying at the player*. `npm run prove` reported WRONG TEST and that is what it
      was pointing at.
    */
    broke: 'the sky sped up again until it moves with the world and stops being a background',
    guard: 'and only the streak layer may be in FRONT of the game, and only one of them',
    edit: {
      path: 'src/app/mount.ts',
      find: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.825 },',
      replace: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 1.2 },',
    },
  },
];

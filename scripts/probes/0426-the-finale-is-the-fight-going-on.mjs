// The breaks behind docs/decisions/0426-the-finale-is-the-fight-going-on.md.
//
// One per claim: the heart cleared on the step the jellyfish dies (the hold keyed on the latch that is
// still down then), the heart left behind by the camera as she dies, the finale opening out of the
// backdrop, the heart staged somewhere other than where the fight had it, the fire never breaking out
// of it, the fighter's bubble hung over the Viper, and a ship drawn away from where its bubble is put.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0426',
    suite: 'tests/finale.test.ts',
    broke: 'the hold keyed on `bossBeaten`, which is still down on the step she dies — the heart cleared with her',
    guard: 'keeps the heart where she left it',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (head === null && w.bossSpawned && move.kind === 'socket'",
      replace: "  if (head === null && w.bossBeaten && move.kind === 'socket'",
    },
  },
  {
    decision: '0426',
    suite: 'tests/finale.test.ts',
    broke: 'the heart standing still in the world as the camera goes on, so it slides off its place',
    guard: 'keeps the heart where she left it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    seat.prevAcross = seat.across;\n    seat.along += w.scrollPerStep;\n    return;',
      replace: '    seat.prevAcross = seat.across;\n    return;',
    },
  },
  {
    decision: '0426',
    suite: 'tests/finale.test.ts',
    broke: 'the finale fading up out of the backdrop — the cut the report was about',
    guard: 'opens on the fight’s last frame',
    edit: {
      path: 'src/render/finale.ts',
      find: '  if (t < FINALE_BEATS.fadeOut) return 0;',
      replace: '  if (t < FINALE_BEATS.fadeOut) return t < 24 ? 1 - t / 24 : 0;',
    },
  },
  {
    decision: '0426',
    suite: 'tests/finale.test.ts',
    broke: 'the heart staged where 0418 stood it rather than where the fight left it',
    guard: 'opens on the fight’s last frame',
    edit: {
      path: 'src/render/finale.ts',
      find: '  const heartAlong = from.heartAlong + shake * (hash(t | 0) - 0.5) * 2;',
      replace: '  const heartAlong = 106 + shake * (hash(t | 0) - 0.5) * 2;',
    },
  },
  {
    decision: '0426',
    suite: 'tests/finale.test.ts',
    broke: 'a heart that bursts with no fire breaking out of it first',
    guard: 'races the heart, sets it on fire, and bursts it',
    edit: {
      path: 'src/render/finale.ts',
      find: '    fire(surface, view, t - eruptionAt(k),',
      replace: '    if (k < 0) fire(surface, view, t - eruptionAt(k),',
    },
  },
  {
    decision: '0426',
    suite: 'tests/finale.test.ts',
    broke: 'the fighter’s bubble hung above it, over the Viper — the first photograph',
    guard: 'says each line from its own ship',
    edit: {
      path: 'src/content/finale.ts',
      find: "export const SAVING_MOUTH = { ahead: 2, across: 5, hang: 'below' } as const;",
      replace: "export const SAVING_MOUTH = { ahead: 2, across: -5, hang: 'above' } as const;",
    },
  },
  {
    decision: '0426',
    suite: 'tests/finale.test.ts',
    broke: 'the Viper drawn off the place her bubble is put from',
    guard: 'says each line from its own ship',
    edit: {
      path: 'src/render/finale.ts',
      find: '  const along = VIPER_AT[0]!;',
      replace: '  const along = VIPER_AT[0]! + 12;',
    },
  },
];

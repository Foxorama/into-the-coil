// The breaks behind docs/decisions/0537-the-candle-is-lit.md.
//
// One per guard tests/candle.test.ts adds, and one for each guard in tests/bombs.test.ts that 0537
// widened to know a candle: a special that is seven shapes now, and a thrown one that goes off silent.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'the candle on the ward trigger, where the bomb pickup never offers it',
    guard: 'is a gun special, so the bomb pickup offers it to every ship',
    edit: {
      path: 'src/content/specials.ts',
      find: "    hint: 'A spray of fireworks ahead',\n    side: 'gun',",
      replace: "    hint: 'A spray of fireworks ahead',\n    side: 'ward',",
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'the stars after the first off the grid, a step late every time',
    guard: 'fires every star, the first on the press and the rest a grid slot apart',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.candleIn = stepsToGrid(w.steps, candle.every);',
      replace: '  w.candleIn = candle.every + 1;',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'every star drawn pointing up the lane whatever way it flies',
    guard: 'sweeps the fan from one side of the nose to the other',
    edit: {
      path: 'src/app/frame.ts',
      find: '  star.turn = angle;',
      replace: '  star.turn = 0;',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'every firework in the one colour',
    guard: 'every star bursts, in turn through the three colours',
    edit: {
      path: 'src/app/frame.ts',
      find: '  blast.face = w.fireworks % FIREWORK_PAGES.length;',
      replace: '  blast.face = 0;',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'a firework shrunk to a third of its reach, a few sparks rather than a screen of them',
    guard: 'the fireworks cover a good chunk of the screen ahead of the ship',
    edit: {
      path: 'src/content/shots.ts',
      find: '  firework: { sprite: SPRITE.fireworkGold, spriteHit: SPRITE.fireworkGold, radius: 22,',
      replace: '  firework: { sprite: SPRITE.fireworkGold, spriteHit: SPRITE.fireworkGold, radius: 7,',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'a firework going off as the star that hurts nothing',
    guard: 'a firework lands its damage on what is inside it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  reset(blast, along, across, SHOTS[candle.burst], FIREWORK_KIND);',
      replace: '  reset(blast, along, across, SHOTS[candle.star], FIREWORK_KIND);',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'a candle let through the throw gap as if it threw nothing',
    guard: 'holds the throw gap for as long as it fires',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return (row.shot === null && row.candle === null) || w.throwIn <= 0;',
      replace: '  return row.shot === null || w.throwIn <= 0;',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'a candle still firing for the ship that came back',
    guard: 'goes out with the ship that held it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  // And a candle still firing: its stars and fireworks went with the pools above — 0537.\n  w.candleKind = null;',
      replace: '  // And a candle still firing: its stars and fireworks went with the pools above — 0537.',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'a star flying off the side of the lane and going off past it',
    guard: 'a star fanned off the edge of the lane goes off at the edge',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (next <= 0 || next >= ACROSS_SPAN) bomb.lifeFor = 1;',
      replace: '      if (next <= -1e9) bomb.lifeFor = 1;',
    },
  },
  {
    decision: '0537',
    suite: 'tests/candle.test.ts',
    broke: 'the blast pool back at nine, full beside a void salvo',
    guard: 'fits the pools: three stars aloft at most',
    edit: {
      path: 'src/app/mount.ts',
      find: '  blasts: 13,',
      replace: '  blasts: 9,',
    },
  },
  {
    decision: '0537',
    suite: 'tests/bombs.test.ts',
    broke: 'the candle with a second shape, a blast it is thrown as as well',
    guard: 'a surge throws nothing at all, and every row is exactly one of the two shapes',
    edit: {
      path: 'src/content/specials.ts',
      find: "    side: 'gun',\n    shot: null,\n    becomes: null,\n    reach: 0,\n    bossShare: 0,\n    surge: null,\n    storm: null,\n    whirl: null,\n    rift: null,\n    nova: null,\n    candle: {",
      replace: "    side: 'gun',\n    shot: null,\n    becomes: 'blast',\n    reach: 0,\n    bossShare: 0,\n    surge: null,\n    storm: null,\n    whirl: null,\n    rift: null,\n    nova: null,\n    candle: {",
    },
  },
  {
    decision: '0537',
    suite: 'tests/bombs.test.ts',
    broke: 'the candle going off silent',
    guard: 'no two specials share a press, and no two thrown ones share what they go off as',
    edit: {
      path: 'src/content/specials.ts',
      find: "    cue: 'candle',\n    lands: 'firework',",
      replace: "    cue: 'candle',\n    lands: null,",
    },
  },
];

// The volcanoes belch — docs/decisions/0251-the-volcanoes-belch.md
//
// Every guard 0251 adds, broken on purpose. `node scripts/prove-guard.mjs 0251`.

export const PROBES = [
  {
    decision: '0251',
    suite: 'tests/volcano.test.ts',
    // The rock made quick: faster than the flame, the smallest bullet, while still the biggest.
    broke: 'the rock made the quickest bullet in the game while still the biggest',
    guard: 'THE ROCK: the biggest and slowest',
    edit: {
      path: 'src/content/shots.ts',
      find: "rock: { sprite: SPRITE.rock, spriteHit: SPRITE.rock, radius: 2.2, health: 1, damage: 2, speed: 0.7 },",
      replace: "rock: { sprite: SPRITE.rock, spriteHit: SPRITE.rock, radius: 2.2, health: 1, damage: 2, speed: 1.9 },",
    },
  },
  {
    decision: '0251',
    suite: 'tests/volcano.test.ts',
    // The fall never read: the row says rock and nothing falls.
    broke: 'the fall never read by the frame, so the row’s rock never falls',
    guard: 'THE BELCH, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0255, which gave a fall a health it starts at.
      find: '  const fall = w.bossRow.fall;\n  if (fall !== null && boss.health <= fall.from * w.bossFullHealth) {',
      replace: '  const fall = w.bossRow.fall;\n  if (fall !== null && boss.health <= fall.from * w.bossFullHealth && w.steps < 0) {',
    },
  },
  {
    decision: '0251',
    suite: 'tests/volcano.test.ts',
    // The rocks falling a whole view up the lane, where the ship cannot be.
    broke: 'the rocks falling a whole view up the lane, beyond the box the ship can reach',
    guard: 'THE BELCH, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '    const along = cameraAlong + rockRng.range(PLAYER_ALONG_MARGIN, PLAYER_LEAD);\n    reset(shot, along, -rock.radius, rock);',
      replace: '    const along = cameraAlong + PLAYER_LEAD + rockRng.range(PLAYER_ALONG_MARGIN, PLAYER_LEAD);\n    reset(shot, along, -rock.radius, rock);',
    },
  },
  {
    decision: '0251',
    suite: 'tests/volcano.test.ts',
    // The first belch on the arrival step: the rock arrives with the boss.
    broke: 'the first belch on the step the boss arrives, so the rock is the arrival',
    guard: 'and the first rock waits',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.bossFallIn = w.bossRow.fall === null ? 0 : fireGapFor(w.bossRow.fall.every, w.difficulty);',
      replace: '  w.bossFallIn = 0;',
    },
  },
  {
    decision: '0251',
    suite: 'tests/volcano.test.ts',
    // A rock that never retires: it rides the camera under the screen, one slot each, for ever.
    broke: 'a rock given no life, so it rides the camera under the screen for ever',
    guard: 'and a rock retires below the lane',
    edit: {
      path: 'src/app/boss.ts',
      find: '    shot.lifeFor = Math.ceil((ACROSS_SPAN + 2 * rock.radius) / speed) + 1;\n',
      replace: '',
    },
  },
  {
    decision: '0251',
    suite: 'tests/volcano.test.ts',
    // A rock that does not hurt.
    broke: 'the rock hitting for nothing',
    guard: 'and a rock hurts the ship',
    edit: {
      path: 'src/content/shots.ts',
      find: "rock: { sprite: SPRITE.rock, spriteHit: SPRITE.rock, radius: 2.2, health: 1, damage: 2, speed: 0.7 },",
      replace: "rock: { sprite: SPRITE.rock, spriteHit: SPRITE.rock, radius: 2.2, health: 1, damage: 0, speed: 0.7 },",
    },
  },
  {
    decision: '0251',
    suite: 'tests/volcano.test.ts',
    // The embers not thrown: a rock appears from nowhere.
    broke: 'the embers not thrown, so a rock appears from nowhere',
    guard: 'THE PICTURE: every rock comes in on a burst',
    edit: {
      path: 'src/app/frame.ts',
      find: '        burst(w, thrown.along, 0, BURST.belch);\n',
      replace: '        void thrown;\n',
    },
  },
];

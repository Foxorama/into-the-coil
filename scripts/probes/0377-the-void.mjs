// The breaks behind docs/decisions/0377-the-void.md.
//
// ⚠️ Each is one clause of the ask — "negates everything but your ship and bosses … bullets and
// chunks of the labyrinth wall … lasers fired by enemies will disappear into" — taken back out.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a shield taken at a full shell that spills into nothing',
    guard: 'a shield taken at a full shell is a void missile',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.ship.health >= full) return PICKUPS.shield.spills;',
      replace: '  if (w.ship.health >= full) return null;',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'the void on the gun’s trigger rather than the tubes’',
    guard: 'the void goes on the tubes’ stack',
    edit: {
      path: 'src/content/specials.ts',
      find: "    label: 'Void',\n    side: 'tubes',",
      replace: "    label: 'Void',\n    side: 'gun',",
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a rift that lets hostile shots through',
    guard: 'takes every hostile shot inside it',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (inRift(rift, shot, shot.radius)) w.enemyShots.releaseAt(i);',
      replace: '      void shot;',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    // Off the death log: the body is gone, and nothing bursts or is heard — 0036's shape.
    broke: 'a rift that takes a body without logging it as a kill',
    guard: 'kills every body inside it, as a kill that bursts',
    edit: {
      path: 'src/app/frame.ts',
      find: 'strike(w.enemies, i, body.health + 1, IMPACT_FLASH_STEPS, w.deaths)',
      replace: 'strike(w.enemies, i, body.health + 1, IMPACT_FLASH_STEPS, null)',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a rift the serpent’s columns fall straight through',
    guard: 'swallows a boss’s lightning that crosses it',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (Math.abs(bolt.along - rift.along) <= rift.radius + bolt.radius) w.bolts.releaseAt(i);',
      replace: '        void bolt;',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    // The beam measured from its point alone, so one that crosses the rift mid-length survives it.
    broke: 'a beam tested at its point rather than along its length',
    guard: 'swallows a boss’s lightning that crosses it',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const dAlong = nearest - rift.along;',
      replace: '        const dAlong = bolt.along - rift.along;',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a rift that stays open after the ship that threw it is lost',
    guard: 'closes with the ship that threw it',
    edit: { path: 'src/app/frame.ts', find: '  w.blasts.clear();', replace: '' },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a rift drawn smaller than it negates',
    guard: 'is drawn at exactly the radius it negates at',
    edit: { path: 'src/content/sprites.ts', find: '  riftZone: 72,', replace: '  riftZone: 60,' },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a rift that closes halfway through its row’s steps',
    guard: 'negates for exactly as long as the row says',
    edit: { path: 'src/app/frame.ts', find: '  body.lifeFor = rift.steps;', replace: '  body.lifeFor = rift.steps / 2;' },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a rift that negates at half the radius it is drawn at',
    guard: 'is drawn at exactly the radius it negates at',
    edit: { path: 'src/app/frame.ts', find: '  body.radius = rift.radius;', replace: '  body.radius = rift.radius / 2;' },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    // The pool at its size before 0377: a banked salvo's last rifts find it full and open nothing.
    broke: 'a blast pool too small for a salvo of rifts',
    guard: 'a salvo thrown as fast as the triggers allow opens every rift it throws',
    edit: { path: 'src/app/mount.ts', find: '  blasts: 6,', replace: '  blasts: 4,' },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    // The slots as first sized, against a level's pickups rather than a banked salvo.
    broke: 'carve slots sized for four rifts a level',
    guard: 'closes no carved stone still on the screen',
    edit: { path: 'src/app/frame.ts', find: 'export const CARVE_PASSAGES = carvesOnScreen();', replace: 'export const CARVE_PASSAGES = 8;' },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a carve written on the wall across from the one it covered',
    guard: 'opens the near wall it covers',
    edit: {
      path: 'src/app/frame.ts',
      find: '    corridor.passages[slot + 2] = side;',
      replace: '    corridor.passages[slot + 2] = -side;',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    // Every carve into the first slot: each new rift closes the one before it, still on the screen.
    broke: 'every carve written over the last one',
    guard: 'closes no carved stone still on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (corridor.passages[s + 1]! < lowest) {',
      replace: '      if (k === 0) {',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a painter that draws the stone the model has carved away',
    guard: 'the painter leaves undrawn exactly the stone the model opened',
    edit: {
      path: 'src/render/scene.ts',
      find: '      if (opened(corridor.passages, start, start + extent, side)) continue;',
      replace: '      if (opened(corridor.passages.subarray(0, (corridor.fixed + 16) * 3), start, start + extent, side)) continue;',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    broke: 'a rift that lands twice its share on a boss',
    guard: 'a tenth of its full health, as it opens',
    edit: {
      path: 'src/app/frame.ts',
      find: '      strike(w.bossPool, 0, rift.bossShare * w.bossFullHealth * open,',
      replace: '      strike(w.bossPool, 0, 2 * rift.bossShare * w.bossFullHealth * open,',
    },
  },
  {
    decision: '0377',
    suite: 'tests/void.test.ts',
    // As it was from 0053: a thrown special culled at the edge of the screen goes off nowhere.
    broke: 'a thrown special released at the edge of the screen without going off',
    guard: 'goes off at the edge rather than vanishing',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (bomb.lifeFor > 1 && bomb.along + bomb.velAlong >= edge) bomb.lifeFor = 1;',
      replace: '',
    },
  },
  {
    decision: '0377',
    suite: 'tests/bombs.test.ts',
    // A thrown ball that opens nothing where it lands: a charge the trigger spends on nothing.
    broke: 'a void missile with no rift on its row',
    guard: 'every row is exactly one of the two shapes',
    edit: {
      path: 'src/content/specials.ts',
      find: '    rift: { radius: 36, steps: 90, bossShare: 0.1 },',
      replace: '    rift: null,',
    },
  },
];

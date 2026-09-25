// The breaks behind docs/decisions/0374-the-storm-and-the-whirlpool.md.
//
// ⚠️ Every one of these still throws something and still looks like a special. A storm that never
// chains is a bigger bomb; a whirlpool whose blades land once is a picture of blades; one that closes
// early is a whirlpool that stops being where the player is looking.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    broke: 'the arc’s overflow a bomb again',
    guard: 'THE ASK: the lightning gun overflows to the storm',
    edit: { path: 'src/content/weapons.ts', find: "    special: 'storm',", replace: "    special: 'bomb'," },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    // *"Chains twice for each hit"* dropped: the storm is its first strikes and nothing more.
    broke: 'a storm that never chains',
    guard: 'strikes the nearest bodies, chains once from each',
    edit: {
      path: 'src/app/frame.ts',
      find: '    for (let c = 0; c < storm.chains; c++) {',
      replace: '    for (let c = 0; c < 0; c++) {',
    },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    // The search allowed back onto what it just struck: one body taking the whole storm.
    broke: 'a storm that strikes the same body again',
    guard: 'strikes the nearest bodies, chains once from each, and lands each strike once',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const enemy = nearestFrom(w.enemies, fromAlong, fromAcross, reach, true, edge, w.corridor);\n  const boss = allowBoss',
      replace: '  const enemy = nearestFrom(w.enemies, fromAlong, fromAcross, reach, false, edge, w.corridor);\n  const boss = allowBoss',
    },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    broke: 'a storm that lands a flat strike on a boss',
    guard: 'lands its share on a boss, once',
    edit: {
      path: 'src/app/frame.ts',
      find: '(share > storm.damage ? share : storm.damage) * open',
      replace: 'storm.damage * open',
    },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    // One flicker and out — *"lightning flickering all across the screen"* as a single frame's worth.
    broke: 'the flicker never renewed',
    guard: 'flickers across the screen for as long as the row says',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.stormFor > 0 && w.stormFor % BOLT_STEPS === 0) flickerStorm(w);\n',
      replace: '',
    },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    broke: 'the whirlpool never stepped, so it neither turns nor grows',
    guard: 'opens with every blade, turns and grows',
    edit: { path: 'src/app/frame.ts', find: '    stepWhirl(w);\n', replace: '' },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    // The gate never counted down: every blade lands once and is a picture from then on.
    broke: 'a whirlpool blade that lands once and never again',
    guard: 'lands on the same body again and again',
    edit: { path: 'src/app/frame.ts', find: '    if (blade.landIn > 0) blade.landIn--;\n', replace: '' },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    // No pairing: blades drawn through bodies that feel nothing.
    broke: 'the whirlpool in no collision pairing',
    guard: 'lands on the same body again and again',
    edit: { path: 'src/app/frame.ts', find: '    collideInto(w.whirl, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths, w.hits);\n', replace: '' },
  },
  {
    decision: '0374',
    suite: 'tests/storm.test.ts',
    // Closed on the half-way corner: arms still sweeping the screen vanish.
    broke: 'the whirlpool closed while part of it is still on the screen',
    guard: 'and is gone once none of it can be on the screen, and not before',
    edit: { path: 'src/app/frame.ts', find: '  if (inner > corner) {', replace: '  if (inner > corner / 2) {' },
  },
];

// The breaks behind docs/decisions/0593-the-hamster-ball-rolls.md.
//
// One per guard tests/ball.test.ts adds.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'Unity open from the first run, with no crash asked',
    guard: 'opens after ten lives lost to something flown into, and the band counts them down',
    edit: { path: 'src/content/golfers.ts', find: '    opens: { after: [], crashes: 10, bought: 0 },', replace: '    opens: { after: [], crashes: 0, bought: 0 },' },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a whole ball hurt by the body it rams',
    guard: 'a body the ball flies into is rammed to death, and the ship is not hurt by it',
    edit: {
      path: 'src/app/frame.ts',
      find: "      const shelled = untouchable || (w.weapon.flight === 'ram' && w.ramBrokenFor === 0);",
      replace: '      const shelled = untouchable;',
    },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a landing that heats nothing',
    guard: 'every landing heats the ball, and a full gauge breaks it',
    edit: { path: 'src/app/frame.ts', find: '    w.ramHeat += landed * ram.heat;', replace: '    w.ramHeat += 0;' },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a ball that breaks with no window, inside what it was ramming',
    guard: 'broken, the ball is drawn without the ball, rams nothing, and a body hurts it',
    edit: {
      path: 'src/app/frame.ts',
      find: "  w.ship.invulnFor = INVULN_STEPS;\n  burst(w, w.ship.along, w.ship.across, BURST.dying);\n  w.onCue('ballBreak', w.ship.across);",
      replace: "  burst(w, w.ship.along, w.ship.across, BURST.dying);\n  w.onCue('ballBreak', w.ship.across);",
    },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a broken ball that never mends',
    guard: 'comes back whole and cool after its recharge — seconds broken, as the row says',
    edit: { path: 'src/app/frame.ts', find: '    if (--w.ramBrokenFor === 0) mendBall(w);', replace: '    if (--w.ramBrokenFor === 0) w.ramBrokenFor = 1;' },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a ball that never cools',
    guard: 'the heat cools once the ball has touched nothing for a while',
    edit: {
      path: 'src/app/frame.ts',
      find: '  else if (w.ramHeat > 0) w.ramHeat = Math.max(0, w.ramHeat - ram.drain);',
      replace: '  else if (w.ramHeat > 0) w.ramHeat = Math.max(0, w.ramHeat - 0);',
    },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'the heat never drawn — the ram always at its coolest picture',
    guard: 'the heat is drawn: the ram under the ball wears the gauge’s stage',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const stage = heat >= 0.75 ? 3 : heat >= 0.5 ? 2 : heat >= 0.25 ? 1 : 0;',
      replace: '  const stage = 0;',
    },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a whole ball that shrugs off fire as well as bodies',
    guard: 'fire still lands on a whole ball: it is only bodies the ball shrugs off',
    edit: { path: 'src/app/frame.ts', find: '      if (!untouchable) {\n        collideIntoOne(w.enemyShots,', replace: '      if (!shelled) {\n        collideIntoOne(w.enemyShots,' },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'the ram lent to every other ship',
    guard: 'no ship may fly the ram, and the ball may fly no other gun, however much is won',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  if (from !== ship && !(WEAPONS[SHIPS[from].weapon].lends && WEAPONS[SHIPS[ship].weapon].lends)) return false;',
      replace: '  if (from !== ship && !WEAPONS[SHIPS[ship].weapon].lends) return false;',
    },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'the ball allowed every other ship’s gun',
    guard: 'no ship may fly the ram, and the ball may fly no other gun, however much is won',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  if (from !== ship && !(WEAPONS[SHIPS[from].weapon].lends && WEAPONS[SHIPS[ship].weapon].lends)) return false;',
      replace: '  if (from !== ship && !WEAPONS[SHIPS[from].weapon].lends) return false;',
    },
  },
  // The War Dance kept to the ball until every ship could dance was 0593's, and 0594 retired it: its
  // gate on the pickup is `scripts/probes/0594-every-ship-dances.mjs`'s now.
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a dance that never turns off the edge of the box',
    guard: 'the ship bounces round its box on its own, and stays in it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if ((nextAcross < PLAYER_MARGIN && w.danceAcross < 0) || (nextAcross > ACROSS_SPAN - PLAYER_MARGIN && w.danceAcross > 0)) w.danceAcross = -w.danceAcross;\n',
      replace: '',
    },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a dancing ship hurt as any ship is',
    guard: 'nothing hurts a dancing ship, and it heats nothing as it rams',
    edit: { path: 'src/app/frame.ts', find: '      const untouchable = w.danceFor > 0;', replace: '      const untouchable = false;' },
  },
  {
    decision: '0593',
    suite: 'tests/ball.test.ts',
    broke: 'a dance pressed again while it dances',
    guard: 'a press while it dances is refused, so it costs nothing',
    edit: { path: 'src/app/frame.ts', find: '  if (row.dance !== null) return w.danceFor <= 0;', replace: '  if (row.dance !== null) return true;' },
  },
];

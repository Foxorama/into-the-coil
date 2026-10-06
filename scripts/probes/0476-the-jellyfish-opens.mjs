// The jellyfish opens — docs/decisions/0476-the-jellyfish-opens.md
//
// Every guard 0476 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0476`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0476',
    suite: 'tests/medusa.test.ts',
    // The report, put back: a twentieth of Savior's health a feed — 0.08 of the authored.
    broke: 'a feed worth a twentieth of the fight again',
    guard: 'THE REPORTED ONE, at Savior',
    edit: {
      path: 'src/content/bosses.ts',
      find: "fall: { kind: 'body', enemy: 'moonJelly', every: 75, count: 2, from: 0.75, feeds: 0.032 },",
      replace: "fall: { kind: 'body', enemy: 'moonJelly', every: 75, count: 2, from: 0.75, feeds: 0.08 },",
    },
  },
  {
    decision: '0476',
    suite: 'tests/medusa.test.ts',
    // A feed as a share of the tier's full health, which Burn's longer fight lands two and a half times.
    broke: 'a feed as a share of the tier’s full health',
    guard: 'and on Burn, where the fight is longest',
    edit: {
      path: 'src/app/frame.ts',
      find: '    hull.health = Math.min(w.bossFullHealth, hull.health + fall.feeds * w.bossRow.health);',
      replace: '    hull.health = Math.min(w.bossFullHealth, hull.health + fall.feeds * w.bossFullHealth);',
    },
  },
  {
    decision: '0476',
    suite: 'tests/medusa.test.ts',
    // Where it stood: 33 units behind the bell for the ship to fly round into.
    broke: 'the jellyfish back at 152',
    guard: 'IN LANE UNITS: the bell stands past the ship’s box',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    station: 190,',
      replace: '    station: 152,',
    },
  },
  {
    decision: '0476',
    suite: 'tests/music.test.ts',
    // The aura measured to the bell alone at 190: 0.04 of its ceiling from the back of the box.
    broke: 'the jellyfish heard from its bell and not its tentacles',
    guard: 'a player who backs off to dodge is still inside the aura',
    edit: {
      path: 'src/content/bosses.ts',
      find: '  return boss.tendrils === undefined ? boss.radius : Math.max(boss.radius, -boss.tendrils.reach);',
      replace: '  return boss.radius;',
    },
  },
  {
    decision: '0476',
    suite: 'tests/level.test.ts',
    // Re-banded without the arc's weight: the open bell's wider band and the arc's 38.5 s.
    broke: 'the jellyfish without its weight on the arc',
    guard: 'a real boss lasts forty seconds at max weapons, and every phase gets eight volleys away, so every attack is seen — the arc',
    edit: {
      path: 'src/content/bosses.ts',
      // 0549 weighted the Catherine wheel on the same row, and 0551 re-weighed it; the break still takes only the arc's.
      find: '    gunWeights: { arc: 1.4, catherine: 0.5 },',
      replace: '    gunWeights: { arc: 1.5, catherine: 0.5 },',
    },
  },
];

// The breaks behind docs/decisions/0229-the-picture-answers-the-report.md.
//
// ⚠️ THREE OF THE FOUR ITEMS IN THAT REPORT WERE GREEN BY EVERY GUARD, which is 0027's whole point:
// a fireball under the bodies, a pod four pixels tall and a valentine were all correct by the
// arithmetic. What is guarded here is the two facts that CAN be stated — where debris sits in the
// draw order, and that a burst and a tier have room — and the rest is judged on the sheet.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0229',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ THE ORDER 0036 SHIPPED, PUT BACK. Debris first, under everything, was right for eight
      shards and wrong for a fireball, and it is the obvious tidy-up: the comment above the array
      still half-argues for it.
    */
    broke: 'debris put back under the enemies, so a fireball is behind the body beside it',
    guard: 'is drawn over the bodies and under every shot — 0229',
    edit: {
      path: 'src/app/mount.ts',
      // ⚠️ Re-anchored by 0230, which put the exhaust in the order.
      find: '    layers: [blasts, pickupPool, bossPool, enemies, debris, enemyShots, playerShots, missiles, bombs, exhaust, shieldOrbs, shipPool],',
      replace: '    layers: [debris, blasts, pickupPool, bossPool, enemies, enemyShots, playerShots, missiles, bombs, exhaust, shieldOrbs, shipPool],',
    },
  },
  {
    decision: '0229',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ THE OTHER WAY TO MAKE A FIREBALL VISIBLE, AND THE ONE THAT COSTS A LIFE: over the bullets.
      A 14-unit smoke ring over a lane of pink squares is the one thing the draw order is absolute
      about, and it looks spectacular on the sheet.
    */
    broke: 'debris drawn over the enemy shots, so a fireball can hide a bullet',
    guard: 'is drawn over the bodies and under every shot — 0229',
    edit: {
      path: 'src/app/mount.ts',
      // ⚠️ Re-anchored by 0230, which put the exhaust in the order.
      find: '    layers: [blasts, pickupPool, bossPool, enemies, debris, enemyShots, playerShots, missiles, bombs, exhaust, shieldOrbs, shipPool],',
      replace: '    layers: [blasts, pickupPool, bossPool, enemies, enemyShots, debris, playerShots, missiles, bombs, exhaust, shieldOrbs, shipPool],',
    },
  },
  {
    decision: '0229',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ THE BURST SHRUNK BACK UNDER THE BIGGEST ENEMY, which is what a hand tidying the extents
      towards their neighbours does, and it is the size nobody saw.
    */
    broke: 'the burst’s last frame shrunk back under the biggest enemy',
    guard: 'a burst is never as big as a boss and a spark is never as big as a burst',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  burst2: 12,\n  burst3: 14,',
      replace: '  burst2: 8,\n  burst3: 9,',
    },
  },
  {
    decision: '0229',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ A TIER GIVEN THE PREVIOUS TIER'S BOX, which is the copy-paste that lost the pods the first
      time: the parts are drawn in the hull's radius and the box decides whether they fit.
    */
    broke: 'the third tier’s sprite made the second’s size, so its canards have no room',
    guard: '0229 — a hull tier is a wider sprite than the one before it',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  shipMk3: 9.4,\n  shipMk3Hit: 9.4,',
      replace: '  shipMk3: 8.2,\n  shipMk3Hit: 8.2,',
    },
  },
];

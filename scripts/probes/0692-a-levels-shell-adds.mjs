// The breaks behind docs/decisions/0692-a-levels-shell-adds.md: a boundary raising the shell to the level's floor
// again, as 0355 had it, and one that forgets the cap.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0692',
    suite: 'tests/tier-shell.test.ts',
    broke: 'a boundary raising a ship carrying less to the level’s shell and leaving one carrying more alone',
    guard: '0692 — a boundary ADDS the level’s shell to what the ship carries',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.ship.health > 0 && adds > 0) w.ship.health = Math.min(capped, w.ship.health + adds);\n',
      replace: '  if (w.ship.health > 0 && w.ship.health < w.shipRow.health + adds) w.ship.health = w.shipRow.health + adds;\n',
    },
  },
  {
    decision: '0692',
    suite: 'tests/tier-shell.test.ts',
    broke: 'a boundary handing a fourth shield to a ship carrying three',
    guard: '0692 — a boundary ADDS the level’s shell to what the ship carries',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.ship.health > 0 && adds > 0) w.ship.health = Math.min(capped, w.ship.health + adds);\n',
      replace: '  if (w.ship.health > 0 && adds > 0) w.ship.health = w.ship.health + adds;\n',
    },
  },
];

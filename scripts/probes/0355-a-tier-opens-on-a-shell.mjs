// The breaks behind docs/decisions/0355-a-tier-opens-on-a-shell.md.
//
// Each one puts back a line as it stood before 0355, or makes the row say something the ask forbids,
// and names the guard that has to go red. The first four are the four sites the plan names —
// `reports/the-tiers-planned-2026-09-22.md` — and the rest are the rows.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0355',
    suite: 'tests/tier-shell.test.ts',
    // A life opens on the hull on every tier, as it did before: *"start with full"* undone.
    broke: 'respawn opening every life on the hull, whatever the tier',
    guard: 'at the run’s start, after a death and after a continue',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.ship.health = openingHealthFor(w.shipRow, w.difficulty);\n  holdStation(w.ship, w.scrollPerStep);',
      replace: '  holdStation(w.ship, w.scrollPerStep);',
    },
  },
  {
    decision: '0355',
    suite: 'tests/tier-shell.test.ts',
    // The boundary keeps the shell (0058) and renews nothing: *"3 shields fully renewed"* undone.
    broke: 'a level boundary keeping the shell without topping it up',
    guard: 'raises what the ship carries to the tier’s opening shell',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.ship.health > 0 && w.ship.health < opens) w.ship.health = opens;\n',
      replace: '  void opens;\n',
    },
  },
  {
    decision: '0355',
    suite: 'tests/tier-shell.test.ts',
    // Every piece thrown whatever the tier can carry, as before: Burn's mid-boss throws a shield.
    broke: 'the mid-boss throwing a shield to a tier that can carry none',
    guard: 'the mid-boss’s death throws every piece the tier can carry',
    edit: {
      path: 'src/app/frame.ts',
      find: "  return row === undefined || row.effect !== 'shield' || w.difficulty.shellCap > 0;",
      replace: '  return true;',
    },
  },
  {
    decision: '0355',
    suite: 'tests/tier-shell.test.ts',
    // The pickup capped at the ceiling rather than at the tier, as it was in `src/app/mount.ts`.
    broke: 'a shield capped at MAX_SHIELDS rather than at the tier’s shell',
    guard: 'a shield never raises health past the tier’s full shell',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.ship.health = Math.min(w.ship.health + 1, fullHealthFor(w.shipRow, w.difficulty));',
      replace: '  w.ship.health = Math.min(w.ship.health + 1, w.shipRow.health + 3);',
    },
  },
  {
    decision: '0355',
    suite: 'tests/hud.browser.test.ts',
    // The readout sized by the ceiling: three empty sockets on Burn, for a shell it may never carry.
    broke: 'the readout sized by MAX_SHIELDS rather than by the tier',
    guard: 'draws one pip per shield the ship can carry on its tier',
    edit: {
      path: 'src/app/mount.ts',
      // ⚠️ Re-anchored by 0373, which counts the stack where `chargesOf` totalled the entries.
      find: 'shieldsOf(shipRow, world.ship.health), world.difficulty.shellCap, stacksOf()',
      replace: 'shieldsOf(shipRow, world.ship.health), MAX_SHIELDS, stacksOf()',
    },
  },
  {
    decision: '0355',
    suite: 'tests/tier-shell.test.ts',
    // A cap past the pool: a fourth mark with no slot to be drawn in.
    broke: 'a tier allowed four shields in a pool of three',
    guard: 'a tier opens on no more than it may carry',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    shellOpen: 3,\n    shellCap: 3,',
      replace: '    shellOpen: 3,\n    shellCap: 4,',
    },
  },
  {
    decision: '0355',
    suite: 'tests/difficulty.test.ts',
    // The gentlest tier carrying less than the one above it — a harder tier that is kinder on one axis.
    broke: 'the easiest tier carrying fewer shields than the next',
    guard: 'on every axis at once, and never softer on any of them',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    shellOpen: 3,\n    shellCap: 3,',
      replace: '    shellOpen: 0,\n    shellCap: 2,',
    },
  },
  {
    decision: '0355',
    suite: 'tests/tier-shell.test.ts',
    // The baseline armoured: every guard that names no tier would fly a ship that takes four hits.
    broke: 'the baseline opening a life on a shell',
    guard: 'THE BASELINE',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  lives: 5,\n  shellOpen: 0,',
      replace: '  lives: 5,\n  shellOpen: 3,',
    },
  },
];

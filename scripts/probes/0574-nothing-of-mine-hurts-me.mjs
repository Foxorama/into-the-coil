// The breaks behind docs/decisions/0574-nothing-of-mine-hurts-me.md.
//
// ⚠️ Two halves of one ask about consistency: the player's own fire never reaching their ship, and the
// strip standing the triggers where the pad's buttons stand. Each is one line to put back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0574',
    suite: 'tests/bombs.test.ts',
    // 0053's pairing put back: the bomb, the candle and the ray hurt their own ship again.
    broke: 'the player’s own blasts paired with the ship again',
    guard: 'every kind of the player’s blast, landing on the ship, costs it nothing',
    edit: {
      path: 'src/app/frame.ts',
      find: "      // The player's own blasts are not paired with the ship — 0574.",
      replace:
        '      collideIntoOne(w.blasts, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false, w.corridor);',
    },
  },
  {
    decision: '0574',
    suite: 'tests/bombs.test.ts',
    broke: 'the player’s own blasts paired with the ship again, read by chasing a bomb',
    guard: 'a ship that chases its own bomb into the blast keeps every shield',
    edit: {
      path: 'src/app/frame.ts',
      find: "      // The player's own blasts are not paired with the ship — 0574.",
      replace:
        '      collideIntoOne(w.blasts, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false, w.corridor);',
    },
  },
  {
    decision: '0574',
    suite: 'tests/hud.browser.test.ts',
    // The strip back in the binding order: special, missile, guard over buttons that read guard, special, missile.
    broke: 'the triggers stood in the binding order rather than the pad’s',
    guard: 'stands the triggers as the pad’s buttons stand',
    edit: {
      path: 'src/app/chrome.ts',
      find: '...slotsLeftToRight(stackGroups.length).map((slot) => stackGroups[slot]!.group));',
      replace: '...stackGroups.map((s) => s.group));',
    },
  },
];

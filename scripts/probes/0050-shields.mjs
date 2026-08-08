// The breaks behind
// docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md.
//
// ⚠️ The shell is a PICTURE of a number, so half of these break the number and half break the
// picture. A guard over only the first passes while the ship wears three marks and dies to one
// bullet; a guard over only the second passes while the marks are decoration. Both were written
// because docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md records three
// bugs of exactly that shape, each one reported as a collision fault that did not exist.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    // The hull back to a buffer. Every screenshot of the game looks identical, and the whole of what
    // was asked for is gone.
    broke: 'the hull given health back, so the ship survives hits it should not',
    guard: 'dies to a single contact',
    edit: {
      path: 'src/content/ships.ts',
      find: '    radius: 2,\n    health: 1,',
      replace: '    radius: 2,\n    health: 3,',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    /*
      ⚠️ THE ONE THE WHOLE CLAMP EXISTS FOR. An enemy carries 2 damage, so without this a single
      contact spends two shields — and the player is told, by three pips and three marks, that they
      have three hits in hand when they have two. Nothing about the picture looks wrong until the
      second one goes.
    */
    broke: 'damage riding through, so one contact spends two shields',
    guard: 'an enemy that reaches a shielded ship still only takes one shield',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.ship.health < healthBefore) w.ship.health = healthBefore - ONE_HIT;',
      replace: '    void healthBefore;',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    // The shell stops following the number it is a picture of. The ship keeps its marks after
    // spending the shields they stood for, which is the readout lying in the player's favour.
    broke: 'the shell left to spawn but never to release, so a spent shield keeps its mark',
    guard: 'wears one mark per shield',
    edit: {
      path: 'src/app/frame.ts',
      find: '  while (w.shieldOrbs.size > want) {',
      replace: '  while (false) {',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    // A shield absorbing a hit, resolved by the model and never mentioned by the picture — 0036's
    // exact shape. The ship is unharmed, the hit landed, and the screen says nothing at all.
    broke: 'a spent shield leaving no burst, so absorbing a hit is invisible',
    guard: 'leaves a burst where a mark was',
    edit: {
      path: 'src/app/frame.ts',
      find: '    burst(w, orb.along, orb.across, BURST.shield);',
      replace: '    void orb;',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    /*
      The shell spaced by a fixed slot rather than by what is actually being carried. Three marks
      look perfect; one mark sits at an arbitrary angle and reads as a piece having fallen off. This
      is the break a screenshot of a full shell cannot show.
    */
    broke: 'the shell spaced against a fixed three rather than against what it is carrying',
    guard: 'spaces its marks evenly',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const step = TAU / count;',
      replace: '  const step = TAU / 3;',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    // The shell turning on a step counter instead of on the camera. It looks right in every still
    // image and in most motion — and it keeps turning while the game is paused behind a menu.
    broke: 'the shell turned by a clock rather than by the camera',
    guard: 'turns as the camera travels',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const base = w.cameraAlong * SHIELD_SPIN;',
      replace: '  const base = (w.shieldTurn = (w.shieldTurn ?? 0) + SHIELD_SPIN);',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    // The shell outliving the ship. Three marks pop off the replacement ship a step after it
    // arrives, which reads as the new life starting by losing everything.
    broke: 'the shell left in place across a respawn',
    guard: 'is gone the moment the ship is',
    edit: {
      path: 'src/app/frame.ts',
      /*
        ⚠️ **It used to anchor on this line AND the `reset` under it, and 0079 put a block between
        them.** The pair was there to make the anchor unique; it is unique on its own now — the only
        other `shieldOrbs.clear()` in the file is inside a comment saying why `wreckShip` does not
        have one — so the shorter anchor is the honest one rather than a looser one.
      */
      find: '  w.shieldOrbs.clear();',
      replace: '',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    // The narrowing that was a ternary on one name. A shield filed as a spread gives the player a
    // barrel for their armour, silently, and the pickup they flew for does nothing they can see.
    broke: 'the upgrade list and the pickup table allowed to disagree',
    guard: 'every upgrade-effect pickup is an upgrade kind',
    edit: {
      path: 'src/content/pickups.ts',
      find: "export const UPGRADE_KINDS = ['rapid', 'spread', 'missileRate', 'missileSpread'] as const;",
      replace: "export const UPGRADE_KINDS = ['rapid', 'missileRate', 'missileSpread'] as const;",
    },
  },
  {
    decision: '0050',
    suite: 'tests/budget.test.ts',
    // The budget nothing was holding until now. A pool added on top of a full 500 rather than out of
    // it, which is invisible everywhere except on the phone 0022 is written for.
    broke: 'a pool grown without taking the slots from anywhere',
    guard: 'never asks the frame to draw more entities than the budget was measured for',
    edit: {
      path: 'src/app/mount.ts',
      // The subtrahends grow as pools are added — 0066 took four more for the scatter — and the
      // break is the same one: a pool that pays for itself out of nothing.
      find: '  debris: 200 - MAX_SHIELDS - 24 - 8 - 4,',
      replace: '  debris: 200 - MAX_SHIELDS - 24,',
    },
  },
  {
    decision: '0050',
    suite: 'tests/hud.browser.test.ts',
    // The readout still counting health. It draws one pip and never moves, because the hull is one
    // hit — so the player's shell has no readout at all and the HUD looks fine.
    broke: 'the readout drawing the hull instead of the shell',
    guard: 'draws one pip per shield the ship can carry',
    edit: {
      path: 'src/app/mount.ts',
      find:
        '    chrome.setHud(state.run.lives, shieldsOf(shipRow, world.ship.health), MAX_SHIELDS, chargesOf(state.run.arsenal));',
      replace:
        '    chrome.setHud(state.run.lives, world.ship.health, shipRow.health, chargesOf(state.run.arsenal));',
    },
  },
];

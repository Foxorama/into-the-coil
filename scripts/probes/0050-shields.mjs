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
      // ⚠️ Re-anchored by 0441: four ships share this pair, and the fighter's own hit sprite above it
      // is what makes it the fighter's — the one the guard's quiet world flies.
      find: '    spriteHit: SPRITE.fighterHit,\n    radius: 2,\n    health: 1,',
      replace: '    spriteHit: SPRITE.fighterHit,\n    radius: 2,\n    health: 3,',
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
      // ⚠️ Re-anchored by 0430: the plates stand at a layout per count rather than a turn divided by it.
      find: '  const layout = SHIELD_LAYOUT[count] ?? SHIELD_LAYOUT[SHIELD_LAYOUT.length - 1]!;',
      replace: '  const layout = SHIELD_LAYOUT[SHIELD_LAYOUT.length - 1]!;',
    },
  },
  {
    decision: '0050',
    suite: 'tests/shields.test.ts',
    // The shell moving on a step counter instead of on the camera. It looks right in every still
    // image and in most motion — and it keeps moving while the game is paused behind a menu. Since
    // 0430 what moves is the shimmer rather than the spin, and the break is the same one.
    broke: 'the shell shimmered by a clock rather than by the camera',
    guard: 'stands still on the ship and shimmers with the camera',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const shimmer = Math.floor(w.cameraAlong / SHIELD_SHIMMER) % 3;',
      replace: '  const shimmer = Math.floor((w.shieldTick = (w.shieldTick ?? 0) + 1) / SHIELD_SHIMMER) % 3;',
    },
  },
  {
    decision: '0430',
    suite: 'tests/shields.test.ts',
    /*
      Every plate wearing the fore plate's picture. The model is perfect — three plates, evenly round
      the ship — and the picture is three copies of one arc, two of them curving round a point that is
      not the ship. Only a guard that asks which picture stands where can see it.
    */
    broke: 'every plate drawn as the fore plate, wherever it stands',
    guard: 'is drawn curving round the ship from where each plate actually stands',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0492, which gave every ship its own shell: still the fore plate's frames.
      find: '    const sprite = frames[shimmer === 1 ? 1 : shimmer === 2 ? 2 : 0];',
      replace: '    const sprite = w.shipRow.shield.places[0]![shimmer === 1 ? 1 : shimmer === 2 ? 2 : 0];',
    },
  },
  {
    decision: '0430',
    suite: 'tests/shields.test.ts',
    // A lone shield stood behind the engines. Still evenly spaced, still one plate per shield — and
    // the last shield is covering the one side nothing shoots at.
    broke: 'a lone plate stood aft rather than on the nose',
    guard: 'always covers the nose',
    edit: {
      path: 'src/content/ships.ts',
      find: 'export const SHIELD_LAYOUT: readonly (readonly number[])[] = [[], [0], [0, 2], [0, 1, 3]];',
      replace: 'export const SHIELD_LAYOUT: readonly (readonly number[])[] = [[], [2], [0, 2], [0, 1, 3]];',
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
      /*
        ⚠️ RE-ANCHORED BY 0082, AND THE BREAK CHANGED SIDES. It used to drop `spread` from
        `UPGRADE_KINDS`, leaving the list one short of the table. `UPGRADE_KINDS` now has a single
        member, so shortening it makes `UpgradeKind` uninhabitable and the tree stops building —
        which is a compile error rather than a red guard, and `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`
        wants the guard to be the thing that speaks.

        So the disagreement is staged from the TABLE instead: a pickup reclassified as a special while
        the upgrade list still calls it an upgrade. That is also the likelier real mistake now — 0082
        added a `special` effect and a bomb pickup in the same change.
      */
      // ⚠️ Re-anchored by 0441, whose one upgrade is the tubes: the weapon pickup is a special now, so
      // the missile pickup is the upgrade the table can disagree about.
      // ⚠️ Re-anchored by 0458, which put the row's `how` between its hint and its effect.
      find: "    how: 'Fly in on the tubes you want; at a full rack it is a surge for your missile trigger',\n    effect: 'upgrade',",
      replace: "    how: 'Fly in on the tubes you want; at a full rack it is a surge for your missile trigger',\n    effect: 'special',",
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
      // And 0230 took one more for the exhaust.
      // ⚠️ Re-anchored by 0283, which takes eleven slots out of the same share for a serpent's body.
      find: '  debris: 200 - MAX_SHIELDS - 1 - 24 - 8 - 4 - 11,',
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
      // ⚠️ Re-anchored by 0355, which sizes the row by the tier's cap rather than by `MAX_SHIELDS`, and
      // by 0373, which counts the stack and names what it throws next.
      // ⚠️ Re-anchored by 0441: the ship's row is the world's, set per run.
      // ⚠️ And by 0539: the stacks are read off the arsenal given, so the stand can count an opening one.
      find:
        '    chrome.setHud(state.run.lives, shieldsOf(world.shipRow, world.ship.health), world.difficulty.shellCap, stacksOf(state.run.arsenal));',
      replace:
        '    chrome.setHud(state.run.lives, world.ship.health, world.shipRow.health, stacksOf(state.run.arsenal));',
    },
  },
];

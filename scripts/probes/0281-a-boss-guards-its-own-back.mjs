// A boss guards its own back — docs/decisions/0281-a-boss-guards-its-own-back.md
//
// Every guard 0281 adds or leans on, broken on purpose. `node scripts/prove-guard.mjs 0281`.
//
// ⚠️ Two of these redden a guard belonging to ANOTHER decision, and that is the honest anchor: the
// claim *a wake fits in the hostile pool* is 0270's assertion, not a second copy of it here.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0281',
    suite: 'tests/back.test.ts',
    // The state of `main` before this decision: nothing leaves a hull's back at all.
    broke: 'the lash gone, so a boss lays nothing behind itself — which is what was played',
    guard: 'THE REPORTED ONE: a ship parked against the up-lane wall',
    edit: {
      path: 'src/app/boss.ts',
      find: '    if (shots.size <= TAIL_YIELD) throwTail(bullet, bulletKind, boss, row, shots, cameraAlong, scrollPerStep);\n',
      replace: '',
    },
  },
  {
    decision: '0281',
    suite: 'tests/back.test.ts',
    /*
      The second draft's defect: a fan that throws the same bearings for ever. It still covers the
      axis, so a ship in the middle of the lane is still found — what goes red is a ship standing at
      the lane's edge, which is where the measurement found the hydra never reaching.
    */
    broke: 'the sweep frozen, so the lash throws the same seven bearings for ever and the gaps stay where they are',
    guard: 'THE REPORTED ONE: a ship parked against the up-lane wall',
    edit: {
      path: 'src/app/boss.ts',
      find: '  boss.tailAt += TAIL_TURN;\n',
      replace: '',
    },
  },
  {
    decision: '0281',
    suite: 'tests/back.test.ts',
    /*
      ⚠️ **THE CORRIDOR CLOSED BY BEING LETHAL RATHER THAN EXPENSIVE.** The standoff is the one thing
      holding the fair-warning floor on the serpent: its tail sits ten units from the wall the ship is
      pinned against, of which the two hurtboxes are half, and a lash laid there arrives in 36 steps
      against the 45 every other threat in the game gives. Remove it and the longest body in the game
      throws from inside the player's own box.

      ⚠️ **AND IT IS DELIBERATELY NOT A CHANGE TO `TAIL_SPEED`, WHICH WAS TRIED TWICE.** Both a lash
      at the thrower's bullet speed and a lash at 0.5 redden the COVERAGE claim above this one as
      well, and the reason is worth writing down: **the wake covers the corridor by LINGERING in it,
      not by arriving.** Speed it up and the corridor empties between one lash and the next. A probe
      that reddens two guards has not shown which one holds what — the standoff moves the origin and
      leaves the wake otherwise exactly as it is.
    */
    broke: 'the standoff gone, so the longest body in the game lays its wake inside the player’s own box',
    guard: 'and the lash that finds it there never arrives quicker than the fair warning',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const limit = cameraAlong + PLAYER_LEAD - TAIL_STANDOFF;',
      replace: '  const limit = cameraAlong + PLAYER_LEAD;',
    },
  },
  {
    decision: '0281',
    suite: 'tests/crowd.test.ts',
    /*
      ⚠️ The third draft's defect, which the pool found and nothing else would have: a lash with no
      fuse flies to a cull sized for the widest device, 240 units out, when only the first 200 steps
      of its life can touch anything. Measured at a full 150 of 150 hostile shots alive.
    */
    broke: 'the lash flying on for ever, past anywhere the ship is allowed to be',
    guard: 'and the pool always has room for the volley after this one',
    edit: {
      path: 'src/app/boss.ts',
      find: '    shot.lifeFor = life;\n',
      replace: '',
    },
  },
  {
    decision: '0281',
    suite: 'tests/crowd.test.ts',
    /*
      ⚠️ **THE ONE FIGHT THAT CANNOT AFFORD A WAKE.** The frost ship's last phase at `burn` already
      stands at 111 of the 126 that guard allows, on its own shards alone. Stop the wake standing
      aside and it goes to 130 — and no cadence reaches it, because the peak is a burst that
      coincides with the shatter rather than an accumulation.
    */
    broke: 'the wake laid whatever else is on the field, so the densest fight in the game loses its next volley',
    guard: 'and the pool always has room for the volley after this one',
    edit: {
      path: 'src/app/boss.ts',
      find: '    if (shots.size <= TAIL_YIELD) throwTail(',
      replace: '    if (shots.size <= 9999) throwTail(',
    },
  },
  {
    decision: '0281',
    suite: 'tests/back.test.ts',
    /*
      ⚠️ **THE DEFECT THIS BRANCH FOUND IN ANOTHER GUARD, PUT BACK.** The fixture used to zero the
      intent on every step, so no test could fly the ship and `tests/crowd.test.ts` spent 0270
      believing it had a pilot. Restored, `back.test.ts` can no longer reach the up-lane wall at all —
      the ship holds station at `SHIP_START_ALONG`, forty units from the trailing edge, and is never
      in the corridor it is asserting about.
    */
    broke: 'the fixture zeroing the intent again, so no test can fly a ship anywhere',
    guard: 'THE REPORTED ONE: a ship parked against the up-lane wall',
    edit: {
      path: 'tests/world.ts',
      find: '        intent.along = stick.along;\n        intent.across = stick.across;',
      replace: '        intent.along = 0;\n        intent.across = 0;',
    },
  },
];

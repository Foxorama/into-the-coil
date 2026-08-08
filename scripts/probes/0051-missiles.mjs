// The breaks behind docs/decisions/0051-a-missile-is-the-second-auto-weapon.md.
//
// ⚠️ Two weapons leaving the same ship at the same time is a picture problem as much as a model one.
// Half of these break what a missile IS — its damage, its cadence, its pool — and half break where it
// comes from, which is the half a player reads as *the upgrade I flew for did nothing*.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // The ratio the ask fixed, turned into a number that happens to agree today. Tuning the pulse
    // then silently changes what a missile is worth, which is the one thing that was specified.
    broke: 'the missile’s damage written as a number rather than as three pulses',
    guard: 'carries three times the pulse’s damage',
    edit: {
      path: 'src/content/shots.ts',
      find: "  missile: { sprite: SPRITE.missile, spriteHit: SPRITE.missile, radius: 1.3, health: 1, damage: 3, speed: 1.5 },",
      replace:
        "  missile: { sprite: SPRITE.missile, spriteHit: SPRITE.missile, radius: 1.3, health: 1, damage: 2, speed: 1.5 },",
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // A second weapon that fires as fast as the first is not a second weapon.
    broke: 'the missile cadence dropped to the pulse’s, so the two weapons stop being different',
    guard: 'fires less often than the pulse does',
    edit: {
      path: 'src/content/ships.ts',
      find: '    missileEvery: 45,',
      replace: '    missileEvery: 5,',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // One clock for both weapons — the shape of mistake that looks like a tidy refactor and makes
    // every upgrade to either move both.
    broke: 'the missiles put on the pulse’s clock',
    guard: 'keeps its own clock',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.missileIn--;\n  if (w.missileIn > 0) return;\n  w.missileIn = w.weapon.missileEvery;',
      replace: '  if (w.fireIn > 0) return;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // Every tube firing from the centreline. The launcher upgrade still adds missiles, so the model
    // is right and the ship simply stops showing what the player earned.
    //
    // ⚠️ RE-AIMED BY 0077, which changed both the cap and the geometry. The break is the same one —
    // the sides collapsed to the centreline — and the guard it reddens now counts to two.
    broke: 'every launcher firing from the centreline, so a launcher upgrade is invisible',
    guard: 'puts one tube on the centreline and two on the wings',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const side = w.weapon.launchers === 1 ? 0 : i === 0 ? -1 : 1;',
      replace: '    const side = 0;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE HALF THAT TURNS IT INTO A DIFFERENT WEAPON. A side missile that never straightens is a
      spread weapon: it keeps crossing the lane, so position stops mattering and the fan the pulse
      owns is duplicated by the missiles. In motion it looks deliberate.
    */
    broke: 'the side tubes never straightening, so the missiles fan across the lane',
    guard: 'pops the side tubes out clear of the hull, then straightens them',
    edit: {
      path: 'src/app/frame.ts',
      find: '      m.across = m.steerAcross;\n      m.velAcross = 0;',
      replace: '      m.across = m.steerAcross;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // The pop removed. The tubes are still on the sides, so a screenshot of the moment of firing
    // looks right, and everything after it is three missiles in a line.
    broke: 'the side tubes firing straight, so nothing pops clear of the hull',
    guard: 'pops the side tubes out clear of the hull, then straightens them',
    edit: {
      path: 'src/app/frame.ts',
      find: '      missile.velAcross = LAUNCHER_POP_SPEED * side;',
      replace: '      missile.velAcross = 0;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // A missile upgrade reaching into the other weapon — the copy-paste `weaponFor` invites, and one
    // a player only notices by realising the pickup they flew for changed something else.
    /*
      ⚠️ RE-ANCHORED BY 0082, AND THE RULE IT DEFENDS IS THE OPPOSITE OF WHAT IT WAS. When there were
      four upgrade kinds, the break was a missile pickup reaching into the pulse and the guard was
      *never moves the other weapon*. 0082 merged the kinds so that one pickup moves BOTH by design —
      *"increase its tier and rate of fire together"* — and the copy-paste that matters now is the one
      that leaves the missile cadence behind, which un-merges the pickup without changing its name.
    */
    broke: 'the merged rung wired to the pulse twice, so the missile cadence never moves',
    guard: 'THE MERGE: one pickup moves BOTH weapons',
    edit: {
      path: 'src/content/pickups.ts',
      find: '    const fasterMissiles = Math.round(missileEvery * MISSILE_FACTOR);\n    if (fasterMissiles >= MISSILE_FASTEST) missileEvery = fasterMissiles;',
      replace: '    const fasterMissiles = Math.round(fireEvery * RAPID_FACTOR);\n    if (fasterMissiles >= FASTEST_FIRE) fireEvery = fasterMissiles;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ RE-ANCHORED BY 0082. It used to break the launcher's OVERFLOW — a tube past the cap that
      bought nothing — and that overflow is deleted, because unbounded overflow damage is exactly the
      reported defect *"max speed auto-fire is way too strong."*

      What is worth breaking in the merged ladder is the CAP itself. Reported from play once already:
      *"after a player's first death, the player can then have 3 missile tubes instead of being capped
      at two."* Removing the `launchers < MAX_LAUNCHERS` term leaves the proportional test on its own,
      which keeps handing out tubes forever — and every one of them fires, which is what the player
      counted.
    */
    broke: 'the launcher cap dropped, so a long run reaches a rung the ask does not have',
    guard: 'fires one missile per launcher, and stops at two tubes',
    edit: {
      path: 'src/content/pickups.ts',
      /*
        ⚠️ THE CONSTANT, AND TWO ATTEMPTS AT ONE OF ITS USES WENT STILL GREEN FIRST. `MAX_LAUNCHERS`
        appears in `grows` (should the loop still run) and in the hardpoint line (which side does this
        rung buy), and at the current constants `grows` stops the loop before the other one could
        matter — so removing either occurrence alone changes nothing. Neither is redundant; the cap is
        one number doing two jobs, and `src/content/pickups.ts` says so where it happens.

        ⚠️ Breaking the constant is also the more faithful probe. THREE is not a hypothetical: it is
        what shipped. 0051 set the cap for a ship that started with one tube at the centreline, 0056
        took the base tube away and left the ceiling where it was, and it was reported from play as
        *"after a player's first death, the player can then have 3 missile tubes instead of being
        capped at two."*
      */
      find: 'const MAX_LAUNCHERS = 2;',
      replace: 'const MAX_LAUNCHERS = 3;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/pickups.test.ts',
    /*
      The pool arithmetic, from the other end: a fire floor low enough that three tubes overrun their
      own pool. The symptom is the one already reported once from play — the later tubes of every
      volley are refused, so a three-launcher ship fires like a one-launcher ship at exactly the
      moment the player has earned otherwise.
    */
    broke: 'the missile fire floor dropped below what the pool can hold',
    guard: 'a volley is never truncated',
    edit: {
      path: 'src/content/pickups.ts',
      find: 'const MISSILE_FASTEST = 20;',
      replace: 'const MISSILE_FASTEST = 4;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // Missiles culled with the content rather than with the view, so they kill things the player
    // cannot see — 0048's bug, in the weapon added after it was fixed.
    broke: 'missiles culled with the content, so they outlive the screen they were fired into',
    guard: 'is culled at the edge of the view',
    edit: {
      path: 'src/app/frame.ts',
      find: '    stepEntities(w.missiles, w.cameraAlong, cullPlayerShotAlong(w.cameraAlong, w.view.alongSpan));',
      replace: '    stepEntities(w.missiles, w.cameraAlong);',
    },
  },
];

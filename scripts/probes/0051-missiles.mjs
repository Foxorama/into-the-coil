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
      // ⚠️ RE-ANCHORED BY 0093, and the break moved file. `missileEvery` is gone from the row: the
      // missile's cadence is `MISSILE_BEAT_RATIO` times the pulse's on the same rung, which is the
      // 5:1 counter-beat written down instead of left to two interpolations that happened to agree.
      // So *the missile fires as fast as the pulse* is now exactly `MISSILE_BEAT_RATIO = 1`, which
      // is a cleaner statement of the same break than the old hand-set 5 ever was.
      path: 'src/content/pickups.ts',
      find: 'export const MISSILE_BEAT_RATIO = 5;',
      replace: 'export const MISSILE_BEAT_RATIO = 1;',
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
      // ⚠️ Re-anchored by 0094, which reloads both clocks to the step grid rather than to a cadence.
      // The break is unchanged: the missiles reading the PULSE's countdown instead of their own.
      find: '  w.missileIn--;\n  if (w.missileIn > 0) return;',
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
    guard: '0097 — puts the first tube on the across-minus side and the second on the across-plus side',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const side = i === 0 ? -1 : 1;',
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
      find: '    missile.velAcross = LAUNCHER_POP_SPEED * side;',
      replace: '    missile.velAcross = 0;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ RE-ANCHORED TWICE AND THE RULE HAS BEEN BOTH WAYS ROUND. With four upgrade kinds the break was
      a missile pickup reaching into the pulse, and the guard was *never moves the other weapon*. 0082
      merged the kinds so that one pickup moved BOTH by design, and the guard inverted. 0083 split them
      again — *"I want weapons and missiles as separate upgrades"* — so separation is the rule once
      more, and this is the copy-paste that breaks it: a weapon tier reaching into the missile cadence.

      ⚠️ **Each version was the right guard for the taxonomy it was written against**, which is what a
      probe tied to a decision looks like when the decision moves. Worth reading before assuming an
      inverted assertion is a mistake.
    */
    broke: 'the weapon ladder wired into the missile cadence, so one pickup moves both again',
    guard: 'THE SPLIT: a weapon pickup never touches the missiles',
    edit: {
      path: 'src/content/pickups.ts',
      /*
        ⚠️ Re-anchored by 0093 and again on 2026-08-10. The cadence is derived from a ladder of note
        values, so the copy-paste that breaks separation is reading the GUN's tier where the missile's
        belongs. **The missiles have a list of their own now** — `missileEvery`, added because
        sharing the pulse's forced the second tube out to the third pickup — so the break has to read
        the gun's TIER rather than the gun's list, or it would be caught by the compiler instead of by
        the guard and prove nothing about the separation.
      */
      find: '  const missileEvery = MISSILE_BEAT_RATIO * missileEveryAt(ship, tubes);',
      replace: '  const missileEvery = MISSILE_BEAT_RATIO * missileEveryAt(ship, gun);',
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
    /*
      ⚠️ RE-ANCHORED BY 0093, AND THE CONSTANT IT USED TO BREAK NO LONGER EXISTS. It dropped
      `MISSILE_FASTEST` from 20 to 4; the missile's cadence is derived now — `MISSILE_BEAT_RATIO`
      times the pulse's on the same rung — so the constant took part in no arithmetic at all and this
      probe came back STILL GREEN. 0093 deleted it on this file's own *one guarantee, one mechanism*
      argument rather than leaving a rule nothing could break.

      ⚠️ The break is the same failure reached through the thing that now controls it: a ratio of 1
      puts the missile on the pulse's own cadence, which at a full loadout is two launchers at four
      steps against a pool of 24 — 65 slots asked for. The probe above breaks the same constant for a
      different reason (the two weapons stop being different); one edit, two consequences, and each
      is checked against its own guard.
    */
    broke: 'the missile ratio collapsed onto the pulse, so a full loadout outruns the missile pool',
    guard: 'a volley is never truncated',
    edit: {
      path: 'src/content/pickups.ts',
      find: 'export const MISSILE_BEAT_RATIO = 5;',
      replace: 'export const MISSILE_BEAT_RATIO = 1;',
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

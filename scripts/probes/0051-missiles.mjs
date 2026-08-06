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
    broke: 'every launcher firing from the centreline, so a launcher upgrade is invisible',
    guard: 'puts the second tube on one side and the third on the other',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const side = i === 0 ? 0 : i === 1 ? -1 : 1;',
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
    broke: 'a missile upgrade wired to the pulse’s barrels',
    guard: 'a missile upgrade never moves the pulse',
    edit: {
      path: 'src/content/pickups.ts',
      find: '      if (faster < MISSILE_FASTEST) missileDamage++;\n      else missileEvery = faster;',
      replace: '      if (faster < MISSILE_FASTEST) missileDamage++;\n      else fireEvery = faster;',
    },
  },
  {
    decision: '0051',
    suite: 'tests/missiles.test.ts',
    // A launcher past the cap that buys nothing. `docs/game.md`: an upgrade that cannot change the
    // outcome is worse than none — and a player at three tubes takes every one of them.
    broke: 'a launcher past the cap spending itself on nothing',
    guard: 'spends an upgrade that has nowhere left to go on damage instead',
    edit: {
      path: 'src/content/pickups.ts',
      find: '      if (launchers >= MAX_LAUNCHERS) missileDamage++;',
      replace: '      if (launchers >= MAX_LAUNCHERS) void 0;',
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

// The breaks behind docs/decisions/0083-two-ladders-of-four.md.
//
// ⚠️ The subject is a NUMBER that used to be an accident. Before 0083 the tier count was whatever
// `round(9 × 0.78ⁿ) ≥ 4` produced — three, as it turned out, with nothing saying so and no guard able
// to notice. Every probe here breaks a different way of making it accidental again.
//
// ⚠️ 0083 also amends 0082, and the probes for the parts it CHANGED live here rather than there: the
// scatter going back to 100%, and shields staying out of it. What stayed 0082's — the max-speed nerf,
// the ring's spacing, the budget ceiling — stayed in `0082-taxonomy.mjs`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0083',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE TIER COUNT AND THE PICKUP BUDGET ARE ONE DECISION, and this is the break that proves it.
      *"The player should be able to cap weapons before the 1st boss… so we need 9 upgrades per level."*
      Four weapon pickups cap four tiers; move the tier count on its own and a level either cannot cap
      or wastes a pickup, and nothing about either file looks wrong on its own.
    */
    broke: 'the tier count moved without the levels, so a level can no longer cap the guns',
    guard: 'THE TARGET: a level offers exactly enough weapons to cap the guns',
    edit: { path: 'src/content/pickups.ts', find: 'export const UPGRADE_TIERS = 4;', replace: 'export const UPGRADE_TIERS = 3;' },
  },
  {
    decision: '0083',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE INTERPOLATION DROPPED, which is what a ladder looks like when somebody "simplifies" the
      hardpoints back to a constant. Every tier then buys the same ship, so a level hands out four
      weapon pickups of which three change nothing — `docs/game.md`'s *an upgrade that cannot change
      the outcome is worse than none*, four times over.
    */
    /*
      ⚠️ RE-ANCHORED AGAIN ON 2026-08-10, WHEN `rung` WAS DELETED OUTRIGHT. The last interpolated
      quantity — the launchers — became a capped count, because interpolating a count is what put the
      second missile tube on the third pickup (*"missile tubes don't get a second firing till like the
      3rd upgrade"*). There is no curve left in this file to flatten, so the break moves to the LIST
      the flattening would now be written in.
    */
    broke: 'the missile rate ladder flattened, so the last two tiers resolve to the same ship',
    guard: 'THE TIERS: each ladder is exactly UPGRADE_TIERS long',
    edit: {
      // ⚠️ Re-anchored by 0233: the ladder is the missile kind's now, not the ship's.
      path: 'src/content/missiles.ts',
      // ⚠️ Re-anchored by 0235: the seeker shares the ladder, so the straight row's `seek: 0` two
      // lines down is what makes this the straight missile's.
      find: '    missileEvery: [8, 8, 8, 6, 4],\n    launchers: [0, 1, 2, 2, 2],\n    seek: 0,',
      replace: '    missileEvery: [8, 8, 8, 8, 8],\n    launchers: [0, 1, 2, 2, 2],\n    seek: 0,',
    },
  },
  {
    decision: '0083',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE LAST TIER LEFT SHORT OF THE FLOOR, which is exactly what the old multiplicative ladder
      did: it refused the rung that would cross, so a fully-upgraded ship never quite reached the
      fastest it was allowed to fire. Written back as an off-by-one, which is how it would return.
    */
    /*
      ⚠️ RE-POINTED BY 0093, BECAUSE `rung` GOVERNS ONE LADDER NOW INSTEAD OF FOUR. It drew the
      barrels, both cadences and the launchers; 0093 made the first three note values or lists on the
      ship's row, so shortening the interpolation no longer touches a FLOOR at all — the launchers
      still round up to `MAX_LAUNCHERS` at the last rung. `npm run prove` reported WRONG TEST.

      ⚠️ What a rung-short ladder costs now is a TIER THAT BUYS NOTHING: launchers become 0, 0, 1, 1, 2
      and the first missile pickup of a run lands on a ship it does not change. That is the same
      underlying mistake — an interpolation that does not span the tiers it claims to — arriving at
      the guard which can still see it.
    */
    /*
      ⚠️ RE-ANCHORED AGAIN ON 2026-08-10. The interpolation is gone — the tubes are a capped count now
      — so *one rung short* is written as a cap one below `MAX_LAUNCHERS`. The break costs the same
      thing it always did: the tubes stop climbing at tier 1, and tier 2 (which buys the second tube
      and nothing else, by design) lands on a ship it does not change.

      ⚠️ **THE GUARD IT REDDENS MOVED, AND `npm run prove` SAID SO — WRONG TEST.** It used to be
      caught by the generic *every tier changes something*; it is now caught FIRST by the launcher
      table, which since this play-test states the ask literally — 1 tube, then 2 —
      (`docs/decisions/0103-the-fast-layer-is-in-front.md`). That is the right guard to name here: a
      probe should point at the assertion that owns the claim, and the count table owns it now.
      Naming the generic one would have this reported as WRONG TEST for ever while both were red.
    */
    broke: 'the launcher ladder one tube short, so the second missile pickup buys nothing',
    guard: 'fires one missile per launcher, and stops at two tubes',
    edit: {
      path: 'src/content/pickups.ts',
      // ⚠️ Re-anchored by 0233: the tube count is read off the missile kind's ladder first.
      find: '  const launchers = tubesAt > MAX_LAUNCHERS ? MAX_LAUNCHERS : tubesAt;',
      replace: '  const launchers = tubesAt > MAX_LAUNCHERS - 1 ? MAX_LAUNCHERS - 1 : tubesAt;',
    },
  },
  {
    decision: '0083',
    suite: 'tests/shields.test.ts',
    /*
      ⚠️ ONE LADDER'S CEILING STEALING THE OTHER'S UPGRADES, and it is the mistake the split invites.
      Asking *how many upgrades has this player taken* instead of *how many of THIS kind* is the
      shorter line and reads fine — until a player who spent four on the guns finds every missile
      pickup turning into a bomb charge, with the missile rack still empty.

      ⚠️ This is the assertion 0083 exists for. Nothing before it could have made one: there was only
      ever one ladder to be full.
    */
    broke: 'the bomb conversion asked about the whole list, so a full gun ladder caps the missiles too',
    guard: 'an upgrade pickup taken at its cap becomes a bomb charge',
    edit: {
      path: 'src/content/pickups.ts',
      // ⚠️ Re-anchored by 0233: the narrowing is the last line of `effectOf` now, and it asks the
      // loadout. The break is the same — the whole list where the kind's own ladder should be.
      find: "  return upgradeGrows(loadout.upgrades, kind) ? 'upgrade' : 'special';",
      replace: "  return loadout.upgrades.length < UPGRADE_TIERS ? 'upgrade' : 'special';",
    },
  },
  {
    decision: '0083',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ A FILTER BACK ON THE SCATTER. 0082 made a death throw each upgrade on a 50% coin and a
      play-test called it *"too punishing"*; halving the count is the tidiest way that could come back
      and the hardest to notice, because the ring still looks like a ring.
    */
    broke: 'a filter put back on the scatter, so a death keeps half of what it took',
    guard: 'THE COST OF DYING: gives back every upgrade, on every seed',
    edit: {
      path: 'src/app/frame.ts',
      find: '  scatterRing(w, upgrades, upgrades.length > room ? room : upgrades.length);',
      replace: '  scatterRing(w, upgrades, Math.ceil((upgrades.length > room ? room : upgrades.length) / 2));',
    },
  },
  {
    decision: '0083',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ SHIELDS BACK IN THE SCATTER — *"but no shields spawn on death."* This is the half of the ask
      that is true by a TYPE rather than by a rule: `scatterUpgrades` takes `UpgradeKind[]` and a
      shield is not one. A type stops being a guarantee the moment somebody widens it, and 0083 widened
      this one from a single member to two.
    */
    broke: 'a shield admitted to the scatter, so a death puts armour back on the field',
    guard: 'and never throws a shield, because a shield was never in the list',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const kind = w.pickupKinds[upgrades[i]!];',
      replace: "    const kind = w.pickupKinds['shield'];",
    },
  },
];

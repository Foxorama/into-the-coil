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
    broke: 'the rungs flattened, so every tier resolves to the base ship',
    guard: 'THE TIERS: each ladder is exactly UPGRADE_TIERS long',
    edit: {
      path: 'src/content/pickups.ts',
      find: '  return Math.round(base + (cap - base) * (tier / UPGRADE_TIERS));',
      replace: '  void tier;\n  return base;',
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
    broke: 'the ladder one rung short, so a maxed ship never reaches its own floor',
    guard: 'THE FLOORS: the last tier lands exactly on them',
    edit: {
      path: 'src/content/pickups.ts',
      find: '  return Math.round(base + (cap - base) * (tier / UPGRADE_TIERS));',
      replace: '  return Math.round(base + (cap - base) * (tier / (UPGRADE_TIERS + 1)));',
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
      find: '  return effect === \'upgrade\' && isUpgrade(kind) && !upgradeGrows(upgrades, kind) ? \'special\' : effect;',
      replace:
        '  return effect === \'upgrade\' && isUpgrade(kind) && upgrades.length >= UPGRADE_TIERS ? \'special\' : effect;',
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

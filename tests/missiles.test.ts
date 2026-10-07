import { describe, it, expect } from 'vitest';
import { ACROSS_SPAN, MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { GameFrame, type World } from '../src/app/frame.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { MISSILES } from '../src/content/missiles.ts';
import { SHOTS } from '../src/content/shots.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { FASTEST_FIRE, MAX_LAUNCHERS, MISSILE_BEAT_RATIO, weaponFor } from '../src/content/pickups.ts';
import { MISSILE_KINDS, type MissileKind } from '../src/content/missiles.ts';
import { playableWorld, NO_LEVEL } from './world.ts';

/**
 * THE SECOND AUTO-WEAPON.
 *
 * `docs/decisions/0051-a-missile-is-the-second-auto-weapon.md`. Asked for after playing the two-level
 * build: *"missiles — a second auto-weapon. Slower than the pulse, 3× its damage, fired from
 * launchers on the ship. The base ship has one, at the middle; the first upgrade adds one on the
 * `across`-minus side and the second on the `across`-plus side, and those two pop out before they
 * straighten."*
 *
 * ⚠️ **Nothing here asserts on a value a hand is meant to settle** — not the speed, not the cadence,
 * not how far a tube pops out. What is held are the relationships: three times the pulse, slower than
 * the pulse, one missile per launcher, and a side tube that clears the hull before it straightens.
 */

/** Long enough for a volley or two at any cadence anybody would author. */
const A_WHILE = 200;

/**
 * The smallest loadout that has a missile weapon at all.
 *
 * ⚠️ **The base ship carries NO tube** — `docs/decisions/0056-…` amends 0051's *"the base ship has
 * one, at the middle"*, so a test about missiles has to say it found one. Written as a named
 * constant rather than a literal in eight places, because it is the same fact each time and it is
 * exactly the fact that just moved.
 */
const ARMED: readonly MissileKind[] = ['straight'];

/*
  ⚠️ **EVERY SHIP'S HULL, SINCE 0441.** The tubes stand where `fireMissiles` puts them whatever ship
  is flown, and the four ships each draw three hulls, so *out of the hull* is held against the
  narrowest of them and *clear of the hull* against the widest — never against the one fighter.
*/
const HULL_EXTENTS = SHIP_KINDS.flatMap((kind) => SHIPS[kind].hulls.map((hull) => SPRITE_EXTENT[SPRITE_KINDS[hull.base]!]));
const NARROWEST_HULL = Math.min(...HULL_EXTENTS);
const WIDEST_HULL = Math.max(...HULL_EXTENTS);

function quietWorld(tubes: readonly MissileKind[] = []): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  built.world.weapon = weaponFor(built.world.shipRow, tubes);
  built.world.fireIn = built.world.weapon.fireEvery;
  built.world.missileIn = built.world.weapon.missileEvery;
  return { world: built.world, frame: new GameFrame(built.world) };
}

describe('a missile is worth three pulses and is slower than one', () => {
  it('carries three times the pulse’s damage, as a ratio rather than a number', () => {
    /*
      ⚠️ **A RATIO, because that is what was asked for**: *"3× its damage."* Written as a number it
      would be a second description of the pulse's damage, and tuning the pulse would silently change
      what a missile is worth relative to it — which is the only thing the ask actually fixed.
    */
    expect(SHOTS.missile.damage, 'a missile is no longer three pulses').toBe(SHOTS.pulse.damage * 3);
  });

  it('flies slower than the pulse, which is the whole of what makes it a different weapon', () => {
    expect(SHOTS.missile.speed, 'the missile is not slower than the pulse').toBeLessThan(SHOTS.pulse.speed);
  });

  it('is drawn longer than the pulse and shorter than the smallest enemy', () => {
    // Size is the cue that needs no learning at all — `src/content/sprites.ts` argues it for the
    // enemies and it is just as true of two streams leaving the same ship at the same time.
    expect(SPRITE_EXTENT.missile, 'a missile is no bigger than the pulse it has to be told apart from').toBeGreaterThan(
      SPRITE_EXTENT.bullet,
    );
    expect(SPRITE_EXTENT.missile, 'a missile is the size of an enemy').toBeLessThan(SPRITE_EXTENT.weaver);
  });
});

describe('the ship fires it without being asked', () => {
  it('launches on its own clock, with no input at all', () => {
    /*
      `src/content/actions.ts`: *there is no `fire` action and there must never be one.* The fixture
      contributes an empty intent every step, so anything that arrives here arrived by itself.
    */
    const { world, frame } = quietWorld(ARMED);
    for (let i = 0; i < A_WHILE; i++) frame.step();
    expect(world.missiles.size, 'nothing was fired without a trigger').toBeGreaterThan(0);
    for (let i = 0; i < world.missiles.size; i++) {
      expect(world.missiles.at(i).sprite, 'the missile pool is holding something else').toBe(SPRITE.missile);
    }
  });

  it('fires less often than the gun does, in every ship', () => {
    // Every ship since 0441: the second weapon is slower than whichever gun the ship flies.
    for (const ship of SHIP_KINDS) {
      // Not a wheel on a tether — 0545: thrown once and burning nine beats in ten, it has no rate of
      // fire to be slower than, as `tests/pickups.test.ts`'s counter-beat says of it too.
      if (WEAPONS[SHIPS[ship].weapon].flight === 'tether') continue;
      const base = weaponFor(SHIPS[ship], []);
      expect(base.missileEvery, `${ship}: the second weapon fires as fast as the first`).toBeGreaterThan(base.fireEvery);
    }
  });

  it('keeps its own clock, so one weapon cannot stall the other', () => {
    /*
      The failure this catches is a single `fireIn` shared by both: the missiles would then fire at
      the pulse's rate, or the pulse at the missile's, and every upgrade to either would move both.
    */
    const { world, frame } = quietWorld(ARMED);
    world.missileIn = 1;
    world.fireIn = 10_000;
    for (let i = 0; i < 4; i++) frame.step();
    expect(world.missiles.size, 'the missiles waited for the pulse').toBeGreaterThan(0);
    expect(world.playerShots.size, 'the pulse fired on the missile’s clock').toBe(0);
  });
});

describe('a launcher is a position on the ship', () => {
  it('fires one missile per launcher, and stops at two tubes', () => {
    /*
      ⚠️ **TWO, AND IT WAS THREE** —
      `docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md`. Three was the cap for a ship
      that started with one tube at the centreline (0051); 0056 took the base tube away on the ask
      *"default missile tubes should be 0 and increase to 1 then to 2"* and left the ceiling where it
      was, so a run reached a rung the ask does not have. Reported from play as *"after a player's
      first death, the player can then have 3 missile tubes instead of being capped at two."*

      ⚠️ **The overflow is held here rather than only in `weaponFor`'s unit test**, because the thing
      that broke was the number of missiles LEAVING THE SHIP, which is what the player counted.
    */
    /*
      ⚠️ **A MISSILE LADDER OF FOUR TIERS OVER TWO TUBES** — 0083, and the ask's own words: *"missile
      upgrades - add missile tubes and upgrade missile speed -> max of two tubes and 4 speed rate."*

      ── AND THE ORDER OF THE FOUR WAS THE REPORTED BUG ──────────────────────────────────────────

      ⚠️ **Reported from play, 2026-08-10: *"missile tubes don't get a second firing till like the 3rd
      upgrade — upgrades for missiles should be 1 tube, 2 tubes, faster fire rate."*** This table read
      `[2, 1], [3, 2]` and that was the defect, exactly as counted. `src/content/pickups.ts`
      INTERPOLATED the tubes across the tiers — `rung(0, 2, tier)` rounds to 0, 1, 1, 2, 2 — so the
      second tube waited for the third pickup, and nothing had chosen that.

      ⚠️ **The interpolation was not a mistuning, it was the only lever there was.** The missiles read
      the PULSE's cadence list, so a rate step could only land where the pulse's did; with both of
      those spent, staggering the tubes was the one way to make all four rungs buy something. The ship
      row carries `missileEvery` now, so the tubes are a count that climbs straight — 1, then 2 —
      and the rate has the last two rungs to itself.

      ⚠️ **The FIRST tier is a tube, and that is 0056 surviving three taxonomy changes.** The base ship
      has no launcher, so a ladder that handed the missile out at tier 2 would quietly un-earn the
      second weapon. The pair at count 1 is what holds it.

      ⚠️ **Written as the expected count per tier rather than as a formula.** A formula would be the
      ladder restated in a second place; this is a table of what the player gets, which is the thing a
      play-test can disagree with — and did.
    */
    /*
      ⚠️ **A COUNT OF TUBES SINCE 0577, AND IT WAS A COUNT OF RUNGS.** The ladder is gone; a list of
      fitted kinds is what the weapon is resolved from, and past two the hull has nowhere to put one.
    */
    const LAUNCHERS_AT: readonly (readonly [number, number])[] = [
      [1, 1],
      [2, 2],
      [3, 2],
      [12, 2],
    ];
    for (const [fittedCount, expected] of LAUNCHERS_AT) {
      const fitted: MissileKind[] = [];
      for (let i = 0; i < fittedCount; i++) fitted.push(MISSILE_KINDS[i % MISSILE_KINDS.length]!);
      const { world, frame } = quietWorld(fitted);
      expect(world.weapon.launchers, `${fittedCount} tubes did not produce ${expected} launchers`).toBe(expected);

      world.missileIn = 1;
      frame.step();
      expect(world.missiles.size, 'a volley is not one missile per launcher').toBe(expected);
    }
  });

  it('0097 — puts the first tube on the across-minus side and the second on the across-plus side', () => {
    /*
      ⚠️ **What is held is that a launcher upgrade is VISIBLE**, which is 0051's actual claim — a
      player who takes one can see what changed. The rung it used to count to has moved (0077) and the
      claim has not.

      ⚠️ **AND THE FIRST TUBE IS NO LONGER THE CENTRELINE** —
      `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`. Reported from play:
      *"the missiles now fire from the center of the ship and it looks like only one missile. First
      tube should fire from the top side of the ship — yes it will look off balance, that's the
      point when you only have one. Second tube should fire from the bottom side."*

      ⚠️ **The off-balance single is the ASK.** A missile down the centreline is the same silhouette
      as the pulse stream that never stops, so the second auto-weapon arrived invisible; one hung off
      the top of the hull cannot be anything else. What the ladder now reads as is *off balance, then
      balanced* rather than *one, then two*.

      ⚠️ **Asserted as `across`-minus and not as *top*, because the test cannot see a screen.** The
      two are one fact — `src/render/surface.ts` maps `across` down the screen in landscape and turns
      the whole atlas a quarter turn for portrait — and `tests/layout.browser.test.ts` is the file
      that owns that mapping.
    */
    const one = quietWorld(['straight']);
    one.world.missileIn = 1;
    one.frame.step();
    expect(one.world.missiles.size).toBe(1);
    /*
      ⚠️ **WHERE IT LEAVES, SINCE 0448 — the place before its first step, which the painter keeps as
      `prevAcross`.** Where a tube is became the ship's row (`tubes`), and the frame's `side` became only
      which path a missile pops onto. This read the missile a step into its pop, and the pop alone
      carries a missile off the centreline, so a tube put back on it read as off it.
    */
    const single = one.world.missiles.at(0).prevAcross - one.world.ship.prevAcross;
    expect(single, 'the single tube is on the centreline, which is the picture that was reported').toBeLessThan(0);
    /*
      ⚠️ **And it comes out of the HULL rather than beside it**, which is the other half of *a tube is
      a place on the ship*. Measured against the drawn hull, on 0027's terms.
    */
    expect(Math.abs(single), 'the single tube fires from beside the ship rather than off it').toBeLessThan(NARROWEST_HULL / 2);

    // ⚠️ FOUR, and it was two. The second launcher is the ladder's fourth rung since 0082 merged the
    // upgrade kinds — the test above has the table, and this is the first place that shape is felt.
    // ⚠️ THREE, and it was two: 0083 interpolates two tubes across four tiers, so the second lands at
    // tier 3. The table in the test above is where that shape is stated.
    const { world, frame } = quietWorld(['straight', 'straight']);
    world.missileIn = 1;
    frame.step();
    const across: number[] = [];
    for (let i = 0; i < world.missiles.size; i++) across.push(world.missiles.at(i).prevAcross - world.ship.prevAcross);
    expect(across.length).toBe(2);
    expect(across.some((a) => a < 0), 'nothing fired from the acrossMinus side').toBe(true);
    expect(across.some((a) => a > 0), 'nothing fired from the acrossPlus side').toBe(true);
    expect(across[0]! + across[1]!, 'the two tubes are not symmetric about the hull').toBeCloseTo(0, 6);
  });

  it('pops the side tubes out clear of the hull, then straightens them', () => {
    /*
      ⚠️ **BOTH HALVES, because either alone is a different weapon.** A missile that never straightens
      is a spread weapon and covers the lane; one that never pops is three missiles in a line, and the
      launcher upgrade becomes invisible.

      Measured against the hull's own drawn size, which is what the player sees the missile clear —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` on assertions in the player's units.
    */
    // ⚠️ FOUR, and it was two. The second launcher is the ladder's fourth rung since 0082 merged the
    // upgrade kinds — the test above has the table, and this is the first place that shape is felt.
    // ⚠️ THREE, and it was two: 0083 interpolates two tubes across four tiers, so the second lands at
    // tier 3. The table in the test above is where that shape is stated.
    const { world, frame } = quietWorld(['straight', 'straight']);
    world.missileIn = 1;
    frame.step();
    const shipAcross = world.ship.across;
    const sides = [];
    for (let i = 0; i < world.missiles.size; i++) {
      const m = world.missiles.at(i);
      if (m.velAcross !== 0) sides.push(m);
    }
    expect(sides.length, 'no tube popped out at all').toBe(2);

    /*
      ⚠️ **FORTY STEPS, AND IT WAS A HUNDRED AND TWENTY — 0364.** The pop is done in ten; what the
      wait has to stay short of is the missile leaving the screen, because the pool hands its slot to
      the next volley and `sides` then holds a missile half-way through ITS pop. The zoom's longer view
      moved that exit to the step the next volley fires, and the guard read the new missile.
    */
    for (let i = 0; i < 40; i++) frame.step();
    for (const missile of sides) {
      const out = Math.abs(missile.across - shipAcross);
      expect(out, 'a side missile straightened while it was still over the hull').toBeGreaterThan(WIDEST_HULL / 2);
      expect(missile.velAcross, 'a side missile never straightened — it is a spread weapon').toBe(0);
      expect(out, 'a side missile crossed half the dodge lane on its way out').toBeLessThan(ACROSS_SPAN / 4);
    }
  });
});

describe('a missile hits things, and stops where the player can see', () => {
  it('takes three times as much off an enemy as a pulse does', () => {
    const tough = { ...ENEMIES.turret, health: 99 };
    const byPulse = damageDealt('pulse', tough);
    const byMissile = damageDealt('missile', tough);
    expect(byMissile, 'a missile no longer lands three pulses worth').toBe(byPulse * 3);
  });

  it('is culled at the edge of the view, like every other thing the player fires', () => {
    /*
      0048: *you can shoot what you can see*, and it is one promise rather than one per weapon. A
      missile that outlived the view would kill things off-screen and hold a pool slot while doing it.
    */
    const { world, frame } = quietWorld(ARMED);
    world.view = viewOf(ACROSS_SPAN * MAX_ASPECT * 10, ACROSS_SPAN * 10);
    world.missileIn = 1;
    frame.step();
    const missile = world.missiles.at(0);
    let furthest = 0;
    for (let i = 0; i < 600; i++) {
      if (world.missiles.size === 0) break;
      furthest = Math.max(furthest, missile.along - world.cameraAlong);
      frame.step();
    }
    /*
      One step of grace, and it is arithmetic rather than tolerance: the cull runs after the step has
      integrated, so a body is always sampled at most one step of travel past the line it crosses.
      Anything beyond that is a shot living in the dark.
    */
    expect(furthest, 'a missile outlived the screen it was fired into').toBeLessThanOrEqual(
      world.view.alongSpan + SHOTS.missile.speed,
    );
    expect(furthest, 'the missile never got anywhere, so this measured nothing').toBeGreaterThan(ACROSS_SPAN / 4);
  });
});

/** How much health one shot of `kind` takes off a body, fired point-blank from the frame's own code. */
function damageDealt(kind: 'pulse' | 'missile', row: typeof ENEMIES.turret): number {
  const { world, frame } = quietWorld();
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along + 20, world.ship.across, row);
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = 0;
  const before = enemy.health;
  // One shot of the kind under test, and nothing else in the air.
  world.fireIn = Number.MAX_SAFE_INTEGER;
  world.missileIn = Number.MAX_SAFE_INTEGER;
  const pool = kind === 'pulse' ? world.playerShots : world.missiles;
  const shot = pool.spawn()!;
  reset(shot, world.ship.along + 5, world.ship.across, SHOTS[kind]);
  shot.velAlong = SHOTS[kind].speed + world.scrollPerStep;
  for (let i = 0; i < A_WHILE; i++) {
    frame.step();
    if (enemy.health < before) break;
  }
  return before - enemy.health;
}

describe('the upgrades reach the weapon rather than the wrong one', () => {
  it('THE SPLIT: a missile pickup never touches the gun, in any ship', () => {
    /*
      ── THIS ASSERTION HAS NOW BEEN BOTH WAYS ROUND IN TWO DAYS ────────────────────────────────────

      ⚠️ **It began as *a missile upgrade never moves the pulse*** — four upgrade kinds, and the
      failure it caught was a copy-paste in `weaponFor` sending a pickup to the wrong weapon.

      ⚠️ **0082 merged the kinds and inverted it to *one pickup moves BOTH*.** That was right for a
      single `weapon` ladder whose ask was *"increase its tier and rate of fire together."*

      ⚠️ **0083 split them again and it is back to separation** — *"I want weapons and missiles as
      separate upgrades because we're going to add different types of weapons and missiles."* Two
      ladders, two tier counts, and a pickup that reached across would make `tiersOf` a lie.

      ⚠️ **Worth stating plainly: the rule flipped because the CONTENT flipped, not because anyone was
      wrong.** Each version was the correct guard for the taxonomy it was written against, which is
      what a guard tied to a decision looks like when the decision moves.

      ── AND 0093 LOOSENED ONE HALF OF IT, WHICH IS WORTH BEING HONEST ABOUT ────────────────────────

      ⚠️ **It used to assert that a pickup moves its weapon's CADENCE specifically**, and that was a
      statement about the mechanism rather than about the rule: an interpolated ladder moved the
      cadence at every rung, so *the cadence moved* and *the weapon changed* were the same sentence.
      `docs/decisions/0093-the-gun-is-on-the-grid.md` puts the cadence on musical values, and there
      are only three usable subdivisions in the span the ladder occupies — so two rungs necessarily
      share one and buy a barrel instead.

      ⚠️ **What is asserted now is the rule itself, and on the separation half it is STRICTLY
      STRONGER**: a pickup changes something about its own weapon, and **nothing whatever** about the
      other one — checked field by field rather than on the two fields somebody remembered. *Every
      tier changes something* is the next test down and is where *worth taking* is held; this one is
      about the two ladders not touching.

      ⚠️ **AND IT IS WALKED OVER EVERY TIER, WHERE IT USED TO TEST ONE PICKUP.** `npm run prove`
      cross-wired the missile cadence to the gun's tier — the exact copy-paste this guard is named for
      — and reported WRONG TEST: at one upgrade the broken code is indistinguishable from the correct
      one, because tiers 0 and 1 share a cadence on the new ladder. A separation rule tested at a
      single rung is a separation rule with four rungs of hole in it.
    */
    /*
      ⚠️ **THE WEAPON PICKUP'S HALF IS GONE — 0441.** A gun has no ladder and no pickup climbs it, so
      *a weapon pickup never touches the missiles* has no subject; the bomb pickup that took its place
      touches neither ladder. The missile half is held in every ship, because every ship has a gun the
      tubes must leave alone.
    */
    /** The fields belonging to each weapon, so neither list can quietly lose one. */
    const GUN = ['fireEvery', 'shots', 'spread', 'damage', 'kind', 'flight', 'links', 'reach', 'falloff', 'coil', 'turn'] as const;
    const MISSILE = ['missileEvery', 'launchers', 'tubes'] as const;

    for (const ship of SHIP_KINDS) {
      const base = weaponFor(SHIPS[ship], []);
      for (let count = 1; count <= MAX_LAUNCHERS; count++) {
        for (const kind of MISSILE_KINDS) {
          const tube = weaponFor(SHIPS[ship], Array.from({ length: count }, () => kind));
          expect(
            MISSILE.some((f) => JSON.stringify(tube[f]) !== JSON.stringify(base[f])),
            `${ship}: ${count} ${kind} tubes changed nothing about the missiles`,
          ).toBe(true);
          for (const field of GUN) {
            expect(tube[field], `${ship}: ${count} ${kind} tubes moved the gun's ${field}`).toBe(base[field]);
          }
        }
      }

      // And the first tube is the second weapon ARRIVING, which 0056 must not lose.
      expect(
        weaponFor(SHIPS[ship], ['straight']).launchers,
        `${ship}: the first tube is not a launcher, so the second weapon is not earned`,
      ).toBe(base.launchers + 1);
    }
  });

  /*
    ── `THE TIERS: each ladder is exactly UPGRADE_TIERS long` WAS HERE, AND 0577 TOOK THE LADDER ──────

    It held that each of four rungs changed something and that a fifth did not. *"You either have full
    tier missiles or you don't"*: there are no rungs to walk, and what a tube changes is held below.
  */

  it('0577 — A TUBE IS FULL FROM THE MOMENT IT IS FITTED: one tube fires at the old top rate, and a second adds a tube and nothing else', () => {
    /*
      *"Let's remove the missile upgrades, you either have full tier missiles or you don't."* The ladder
      went tube, tube, rate, rate, so a single tube used to fire at a third of the top rate; now the
      first tube fires at the counter-beat's floor, `MISSILE_BEAT_RATIO` times the fastest the gun may
      fire, which is where the ladder's top rung stood — and the second changes only the count.
    */
    for (const ship of SHIP_KINDS) {
      for (const kind of MISSILE_KINDS) {
        const one = weaponFor(SHIPS[ship], [kind]);
        const two = weaponFor(SHIPS[ship], [kind, kind]);
        expect(one.missileEvery, `${ship}: one ${kind} tube does not fire at the top rate`).toBe(MISSILE_BEAT_RATIO * FASTEST_FIRE);
        expect(two.missileEvery, `${ship}: a second ${kind} tube moved the rate`).toBe(one.missileEvery);
        expect(two.launchers, `${ship}: a second ${kind} tube is not a second launcher`).toBe(one.launchers + 1);
      }
    }
  });

  it('0577 — two tubes of two kinds each fire their own missile in one volley, top tube first', () => {
    /*
      *"1 homing, 1 regular, 2 homing, 2 regular etc."* The volley is one cue and one clock; what leaves
      each tube is that tube's own kind — its shot, its hunt and its fuse.
    */
    for (const order of [['homing', 'straight'], ['straight', 'homing']] as const) {
      const { world, frame } = quietWorld(order);
      world.missileIn = 1;
      frame.step();
      expect(world.missiles.size, 'a mixed rack did not fire one missile per tube').toBe(2);
      const fired = [world.missiles.at(0), world.missiles.at(1)].sort((a, b) => a.across - b.across);
      order.forEach((kind, i) => {
        const row = MISSILES[kind];
        expect(fired[i]!.sprite, `tube ${i} fired something other than its ${kind}`).toBe(SHOTS[row.shot].sprite);
        expect(fired[i]!.seekTurn, `tube ${i}'s ${kind} does not hunt as its row says`).toBe(row.seek);
        expect(fired[i]!.damage, `tube ${i}'s ${kind} does not land what its row says`).toBe(SHOTS[row.shot].damage);
      });
    }
  });

  it('THE FLOORS: a full rack lands exactly on them, and nothing goes past', () => {
    /*
      ⚠️ **THE GUN'S HALF IS GONE — 0441**, and the tubes' ladder with 0577: what is held is that a full
      rack fires at the counter-beat and carries the hull's two tubes, and that a longer list is the
      same ship.
    */
    for (const ship of SHIP_KINDS) {
      const base = weaponFor(SHIPS[ship], []);
      const maxTube = weaponFor(SHIPS[ship], ['straight', 'straight']);

    /*
      ⚠️ **EQUALITY, AND IT WAS `toBeLessThan` — WHICH IS NOT WHAT THIS TEST IS NAMED.** *"The last
      tier lands exactly on them"* was asserted as *the last tier is faster than the base*, which is
      true of any ladder at all: `npm run prove` shortened the ladder by a rung and this stayed green
      while every missile test around it went red. A guard that cannot fail on its own subject is
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`'s STILL GREEN, found by the harness one
      pass after the test was written.

      ⚠️ **Naming the floor is legitimate here and would not be in a ladder test.** `FASTEST_FIRE` is
      a legibility number with its own reason, so this asserts that two independent things agree
      rather than that the code equals itself. It is exported for exactly this.

      ⚠️ **AND THE MISSILE'S HALF NO LONGER NAMES A CONSTANT, BECAUSE 0093 DELETED IT.**
      `MISSILE_FASTEST` was 20 and the derived cadence reaches 20 on its own — so asserting the one
      against the other had become a number agreeing with itself, and `npm run prove` proved it by
      dropping the constant to 4 and watching everything stay green. What is asserted instead is the
      relationship that is actually load-bearing: **both ladders land on their last rung together**,
      at the ratio the counter-beat is made of. `docs/decisions/0093-the-gun-is-on-the-grid.md`.
    */
      expect(maxTube.missileEvery, `${ship}: the missiles do not reach their last rung at the counter-beat`).toBe(
        MISSILE_BEAT_RATIO * FASTEST_FIRE,
      );
      expect(maxTube.launchers, `${ship}: the missiles never reach their tube cap`).toBe(MAX_LAUNCHERS);
      // A twentieth tube is the same as the second — the hull has two places, and the list is clamped.
      const absurd: MissileKind[] = Array.from({ length: 20 }, () => 'straight');
      expect(weaponFor(SHIPS[ship], absurd), `${ship}: the tubes kept climbing past the hull`).toEqual(maxTube);
      expect(maxTube.damage, `${ship}: the gun gains damage from the tubes`).toBe(base.damage);
    }
  });

  it('a death takes the missiles away entirely, because the base ship has no tube', () => {
    /*
      0039: a death is back to the base weapon, and there is no second description of what that is —
      it is what an empty upgrade list resolves to, for both weapons.

      ⚠️ **The base ship carries NO launcher**, which is `docs/decisions/0056-…` amending 0051's
      *"the base ship has one, at the middle"*. So this is no longer *back to one tube*: a death takes
      the second weapon away completely, and finding a launcher is what brings it back. That makes a
      death cost more than it did, which is a real change to the run and not a tidy-up.
    */
    // Every ship since 0441: none of the four opens with a tube.
    for (const ship of SHIP_KINDS) {
      const base = weaponFor(SHIPS[ship], []);
      expect(base.launchers, `${ship} still carries a launcher of its own`).toBe(0);
      // 0577: a bare ship's clock is the slowest kind's — the one a surge's pods ride (0379).
      expect(base.missileEvery).toBe(MISSILE_BEAT_RATIO * Math.max(...MISSILE_KINDS.map((k) => MISSILES[k].missileEvery)));
      expect(base.tubes, `${ship} carries a tube kind with no tube`).toEqual([]);
    }
  });

  it('fires nothing at all until a launcher is found', () => {
    /*
      ⚠️ **The reported bug, at the weapon**: *"missile secondary weapon keeps a missile tube on the
      player ship."* Asserting the COUNT is zero is not enough — a cadence that keeps counting down
      with no tube to fire from is the same bug one level in, and it would arm the first volley to
      leave the instant a pickup landed.
    */
    const { world, frame } = quietWorld();
    for (let i = 0; i < A_WHILE; i++) frame.step();
    expect(world.missiles.size, 'a ship with no launcher fired a missile').toBe(0);
    expect(world.playerShots.size, 'the pulse stopped too, so this proved nothing').toBeGreaterThan(0);
  });

  it('and does not run the missile clock down while it has nothing to fire from', () => {
    /*
      ⚠️ **The same bug one level in, and it is invisible in the missile COUNT.** A cadence that keeps
      counting while the ship has no tube reaches zero, resets, and reaches zero again — so the moment
      a launcher pickup lands, the clock is at a position nobody chose. The reward for finding the
      weapon would be a volley leaving from wherever the ship happened to be, up to a full cadence
      early, and it would look like the pickup firing the gun.

      Asserted on the clock rather than on a missile because the count is zero either way, which is
      exactly why this needs its own guard.

      ⚠️ **CHECKED EVERY STEP, AND IT USED TO BE CHECKED ONCE AT THE END — WHICH ALIASED.** A clock
      that runs when it should not still returns to its starting value every `missileEvery` steps, so
      a single reading after `A_WHILE` steps is a coin flip on whether `A_WHILE` happens to be a
      multiple of the cadence. 0093 moved the base cadence from 45 to 40, `A_WHILE` is 200, and 200 is
      exactly five times 40: the probe went STILL GREEN the same afternoon on a guard that had been
      correct for weeks. **Third time in this project that a guard has sampled one phase of a periodic
      quantity** — `docs/decisions/0087-a-pickup-never-parks.md` has the first and 0090's seam guard
      the second — and the only phase-proof form is to look at every step rather than at a chosen one.
    */
    const { world, frame } = quietWorld();
    for (let i = 0; i < A_WHILE; i++) {
      frame.step();
      expect(world.missileIn, `the missile clock ran while the ship had no launcher, by step ${i + 1}`).toBe(
        world.weapon.missileEvery,
      );
    }
  });
});

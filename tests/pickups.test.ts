import { describe, expect, it } from 'vitest';

import { PICKUPS, PICKUP_KINDS, UPGRADE_KINDS, weaponFor, type UpgradeKind } from '../src/content/pickups.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { ACROSS_SPAN, MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { GameFrame } from '../src/app/frame.ts';
import { initialState, reduce } from '../src/state/root.ts';
import { DEFAULT_DIFFICULTY } from '../src/state/slices/run.ts';
import { playableWorld } from './world.ts';
import { CAPACITY } from '../src/app/mount.ts';

/**
 * WHAT A PICKUP IS WORTH, AND WHAT A DEATH TAKES BACK.
 *
 * `docs/decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md` is the reasoning. Two rules
 * meet here and they are easy to get subtly wrong in opposite directions: an upgrade that cannot
 * change the outcome is worse than none, and a fifth one must not end the game.
 */

describe('an upgrade changes the ship, and stacking one changes it again', () => {
  it('every upgrade is worth taking', () => {
    /*
      `docs/game.md`: *"every upgrade is worth taking — an upgrade that cannot change the outcome is
      worse than none."* Stated as a property rather than as numbers: whatever a weapon is, adding
      any single upgrade to it has to produce a DIFFERENT weapon.
    */
    /*
      ⚠️ **Walked from the table, and it was a list of the two that existed.** The rule is about every
      upgrade there will ever be, so the loop has to be over every upgrade there is — and the fields
      compared have to be every field a weapon has, or the next upgrade to change a NEW field passes
      this while doing nothing the player can feel.
    */
    const base = weaponFor(SHIPS.proof, []);
    const fields = Object.keys(base) as (keyof typeof base)[];
    for (const upgrade of UPGRADE_KINDS) {
      const after = weaponFor(SHIPS.proof, [upgrade]);
      expect(
        fields.some((field) => after[field] !== base[field]),
        `taking a ${upgrade} changes nothing about the ship`,
      ).toBe(true);
    }
  });

  it('stacks — the second of a kind is not swallowed by the first', () => {
    /*
      The failure this catches is a `Set` where a list was meant, or a tier that saturates at one.

      ⚠️ **Driven through the REDUCER as well as through `weaponFor`, and the first version was not.**
      `npm run prove` deduplicated the list inside `src/state/slices/run.ts` and this stayed green,
      because a resolver handed a hand-built array cannot see what the thing building the array did.
      Two layers, two assertions — a guard over one of them is a guard over neither.
    */
    const one = weaponFor(SHIPS.proof, ['rapid']);
    const two = weaponFor(SHIPS.proof, ['rapid', 'rapid']);
    expect(two.fireEvery, 'a second rapid did nothing').toBeLessThan(one.fireEvery);
    expect(weaponFor(SHIPS.proof, ['spread', 'spread']).shots).toBeGreaterThan(
      weaponFor(SHIPS.proof, ['spread']).shots,
    );

    let state = reduce(initialState, { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY });
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'rapid' });
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'rapid' });
    expect(state.run.upgrades, 'the run kept one rapid where two were taken').toEqual(['rapid', 'rapid']);
  });

  it('never fires faster than a hit can be read, however many are taken', () => {
    /*
      ⚠️ **The other end of "worth taking".** `src/app/frame.ts` records that successive shots connect
      6 to 7 steps apart and that the impact flash must END before the next one lands, or two hits
      produce one picture and the player cannot count them —
      `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`. A weapon that outruns that
      makes damage unreadable, which is a bug that was already reported once.

      Twenty of them: far past anything a level would hand out, which is the point of a floor.
      Asserted against the flash's own length rather than a number typed here, so raising the flash
      raises the floor.
    */
    const many: UpgradeKind[] = [];
    for (let i = 0; i < 20; i++) many.push('rapid');
    const weapon = weaponFor(SHIPS.proof, many);
    expect(weapon.fireEvery, 'auto-fire outruns the impact flash and hits stop being countable').toBeGreaterThanOrEqual(4);
    expect(Number.isFinite(weapon.fireEvery)).toBe(true);
  });

  it('a volley is never truncated, however heavily the ship is loaded', () => {
    /*
      ⚠️ **THE BUG THIS GUARD EXISTS FOR, REPORTED FROM PLAY.** *"If you get too many weapon upgrades
      the weapon fire seems to get to two streams of bullets are continuous and the other streams slow
      down and it's a bit weird."*

      The cause was arithmetic nobody had done: barrels and fire rate multiplied with no ceiling, so a
      full loadout asked for twelve bullets every four steps against a pool of eighty and a shot that
      lived past the widest screen. The pool then refused the LATER barrels of every volley — the fan
      is spawned in order — so the first streams fired continuously and the rest stuttered. Measured
      at 284 of 900 steps spent at the cap.

      Asserted as *the pool never fills*, which is the property, at a loadout far past anything two
      levels can hand out. Every number involved — the barrel cap, the fire floor, the shot life and
      the pool size — is one of four that have to agree, and this is the only place they are checked
      against each other.
    */
    /*
      ⚠️ **EVERY upgrade there is, fifteen of each**, built by walking the table rather than by
      listing the two that existed when this was written. A weapon added to `UPGRADE_KINDS` and left
      out of this list would be a weapon whose pool nothing checks — which is the exact failure this
      test exists for, one table further back.
    */
    const everything: UpgradeKind[] = [];
    for (const kind of UPGRADE_KINDS) {
      for (let i = 0; i < 15; i++) everything.push(kind);
    }

    const { world } = playableWorld({
      waves: [],
      pickups: [],
      bossAt: Number.POSITIVE_INFINITY,
      boss: 'sentinel',
    });
    world.weapon = weaponFor(SHIPS.proof, everything);
    /*
      ⚠️ **THE WIDEST VIEW THE CLAMP ALLOWS, because the pool arithmetic depends on it.** A shot is
      culled at the edge of the screen in front of the player (0048), so a 21:9 monitor keeps a shot
      in flight nearly half as long again as a 16:9 one — and the fixture's default view is 16:9.
      Measured there, this test reports a peak the widest device never sees, which is the shape of
      guard that passes while the thing it guards is broken for a third of the players.
    */
    world.view = viewOf(ACROSS_SPAN * MAX_ASPECT * 10, ACROSS_SPAN * 10);
    const frame = new GameFrame(world);

    let peak = 0;
    let missilePeak = 0;
    // Long enough that anything accumulating has accumulated: fifteen seconds of continuous fire.
    for (let i = 0; i < 900; i++) {
      frame.step();
      if (world.playerShots.size > peak) peak = world.playerShots.size;
      if (world.missiles.size > missilePeak) missilePeak = world.missiles.size;
    }
    expect(
      peak,
      `a fully loaded weapon puts ${peak} bullets in flight against a pool of ${CAPACITY.playerShots}. ` +
        'The pool refuses the later barrels of every volley, so the fan fires unevenly — which is ' +
        'what the player sees as some streams stuttering.',
    ).toBeLessThan(CAPACITY.playerShots);
    /*
      ⚠️ **The same arithmetic for the second weapon, and it is why the missiles have a pool of their
      own.** Launchers, the missile fire floor, the flight time and the pool size are four numbers
      that have to agree; this is the only place they are checked against each other.
    */
    expect(
      missilePeak,
      `a fully loaded weapon puts ${missilePeak} missiles in flight against a pool of ${CAPACITY.missiles}. ` +
        'A full pool drops the later tubes of every volley, so a three-launcher ship fires like a ' +
        'one-launcher ship at exactly the moment the player has earned otherwise.',
    ).toBeLessThan(CAPACITY.missiles);
    expect(missilePeak, 'no missile was ever fired, so this measured nothing').toBeGreaterThan(0);
  });

  it('an empty list IS the base weapon, so a death needs no second description of one', () => {
    // 0039 says a death goes "back to the ship's base weapon". That sentence is only cheap because
    // the base weapon is what an empty list resolves to.
    const base = weaponFor(SHIPS.proof, []);
    expect(base.fireEvery).toBe(SHIPS.proof.fireEvery);
    expect(base.shots).toBe(1);
  });
});

describe('a pickup is legible before it is taken', () => {
  it('every kind has its own silhouette, so none of them is told apart by colour alone', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning
      alone* in the unconditional tier. Pickups are where that is most tempting to break: they all do
      the same thing to the player and differ only in what happens afterwards.
    */
    const sprites = new Set(PICKUP_KINDS.map((k) => PICKUPS[k].sprite));
    expect(sprites.size, 'two pickups share a silhouette and can only be told apart by their ink').toBe(
      PICKUP_KINDS.length,
    );
  });

  it('is drawn big enough to be aimed at, and never big enough to read as a threat', () => {
    const extentOf: number[] = [];
    for (const k of SPRITE_KINDS) extentOf[SPRITE[k]] = SPRITE_EXTENT[k];
    const smallestEnemy = Math.min(...ENEMY_KINDS.map((k) => extentOf[ENEMIES[k].sprite]!));
    const largestEnemy = Math.max(...ENEMY_KINDS.map((k) => extentOf[ENEMIES[k].sprite]!));
    for (const kind of PICKUP_KINDS) {
      const extent = extentOf[PICKUPS[kind].sprite]!;
      // It is the one thing the player is supposed to fly TOWARDS, so it may not be the smallest
      // thing on screen — it was, at 3.5, and was harder to pick out than everything it competed with.
      expect(extent, `${kind} is smaller than the smallest enemy`).toBeGreaterThanOrEqual(smallestEnemy * 0.85);
      expect(extent, `${kind} is as big as an enemy and will read as one`).toBeLessThan(largestEnemy);
    }
  });

  it('hurts nothing, because it is in no pairing that could', () => {
    for (const kind of PICKUP_KINDS) {
      expect(PICKUPS[kind].damage, `${kind} carries damage, and something will eventually apply it`).toBe(0);
    }
  });
});

describe('a level answers what a death costs', () => {
  it('never leaves the player unarmed for long', () => {
    /*
      ⚠️ **THE LOAD-BEARING GUARD, AND IT IS 0039'S BILL.** A death empties the arsenal, so the
      question a level has to answer is *how long is a player who just died without a weapon*. In
      SECONDS, which is a unit the player experiences —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` requires at least one assertion in
      one, and "every 600 world units" is the model talking to itself.

      Twenty seconds is a ceiling on the gap, not a target. It fails when a level has quietly grown a
      stretch with nothing in it to rearm from.
    */
    const unitsPerSecond = SCROLL_PER_STEP * 60;
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const upgrades = level.pickups.filter((p) => PICKUPS[p.kind].effect === 'upgrade');
      expect(upgrades.length, `${kind} has no upgrades in it at all`).toBeGreaterThan(0);

      let previous = 0;
      let worst = 0;
      let worstAt = 0;
      for (const pickup of upgrades) {
        const gap = (pickup.at - previous) / unitsPerSecond;
        if (gap > worst) {
          worst = gap;
          worstAt = pickup.at;
        }
        previous = pickup.at;
      }
      const tail = (level.bossAt - previous) / unitsPerSecond;
      if (tail > worst) {
        worst = tail;
        worstAt = level.bossAt;
      }
      expect(
        worst,
        `${kind} goes ${worst.toFixed(0)}s without an upgrade, ending at ${worstAt}. A player who ` +
          'died at the start of that stretch flies all of it with the base weapon.',
      ).toBeLessThan(20);
    }
  });

  it('lists its pickups in order, and inside the lane', () => {
    for (const kind of LEVEL_KINDS) {
      const pickups = LEVELS[kind].pickups;
      for (let i = 0; i < pickups.length; i++) {
        const item = pickups[i]!;
        const radius = PICKUPS[item.kind].radius;
        // The spawner walks this list once and never looks back, exactly as it does for waves.
        if (i > 0) expect(item.at, `${kind} pickup ${i} is behind the one before it`).toBeGreaterThanOrEqual(pickups[i - 1]!.at);
        expect(item.lane - radius, `${kind}'s ${item.kind} at ${item.at} hangs off the lane`).toBeGreaterThan(0);
        expect(item.lane + radius).toBeLessThan(ACROSS_SPAN);
      }
    }
  });

  it('has lives in it, because a fixed complement is what makes them findable', () => {
    // 0039 refused lives that refill at a level boundary and named this as the replacement. A level
    // with none is that refusal with nothing behind it.
    for (const kind of LEVEL_KINDS) {
      const lives = LEVELS[kind].pickups.filter((p) => PICKUPS[p.kind].effect === 'life');
      expect(lives.length, `${kind} has no extra lives in it, so the complement can only go down`).toBeGreaterThan(0);
    }
  });
});

describe('collecting one, in the real frame', () => {
  /** A level that is one pickup and nothing else, placed where the ship will fly through it. */
  function onePickup(kind: 'extraLife' | 'rapid'): ReturnType<typeof playableWorld> {
    return playableWorld({
      waves: [],
      pickups: [{ at: 200, kind, lane: ACROSS_SPAN / 2 }],
      bossAt: Number.POSITIVE_INFINITY,
      boss: 'sentinel',
    });
  }


  /**
   * Drive the frame, keeping the ship on the pickup's lane.
   *
   * ⚠️ **The ship used to be able to sit still, and a drifting pickup is why it cannot.**
   * `docs/decisions/0048-a-threat-may-arrive-from-the-side.md` gave
   * pickups a wandering flight, so a fixture that held station and waited was measuring whether the
   * drift happened to cross the centreline — which it does not. Steering is what a player does, and
   * it is what these tests are about: the collection, not the navigation.
   */
  function flyInto(world: ReturnType<typeof playableWorld>['world'], steps: number, each?: () => void): void {
    const frame = new GameFrame(world);
    for (let i = 0; i < steps; i++) {
      if (world.pickups.size > 0) world.ship.across = world.pickups.at(0).across;
      each?.();
      frame.step();
    }
  }

  it('is reported exactly once, and by name', () => {
    const { world, taken } = onePickup('rapid');
    flyInto(world, 600);
    expect(taken, 'the ship flew through a pickup and nothing was reported').toEqual(['rapid']);
  });

  it('leaves the field once taken, so it cannot be collected twice', () => {
    const { world } = onePickup('extraLife');
    flyInto(world, 600);
    expect(world.pickups.size, 'the pickup is still on the field after being collected').toBe(0);
  });

  it('is collectable while the ship is invulnerable', () => {
    /*
      ⚠️ **The case `collideIntoOne` would have got wrong.** It skips a target that is invulnerable —
      correct for damage, and exactly backwards here: the moments after a hit are when a player is
      most likely to be flying through things, and a pickup that silently passed through them would
      read as the collection being broken.
    */
    const { world, taken } = onePickup('rapid');
    // Held permanently invulnerable, which is the state under test rather than an incidental one.
    flyInto(world, 600, () => {
      world.ship.invulnFor = 60;
    });
    expect(taken, 'a pickup passed through an invulnerable ship').toEqual(['rapid']);
  });
});

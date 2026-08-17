import { describe, expect, it } from 'vitest';

import {
  FASTEST_FIRE,
  MAX_BARRELS,
  MISSILE_BEAT_RATIO,
  PICKUPS,
  PICKUP_KINDS,
  UPGRADE_KINDS,
  UPGRADE_TIERS,
  fireEveryAt,
  weaponFor,
  type PickupKind,
  type UpgradeKind,
} from '../src/content/pickups.ts';
import { BEAT_SECONDS, LOOP_SECONDS, STEPS_PER_BEAT } from '../src/content/music.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { ACROSS_SPAN, MAX_ASPECT, MIN_ASPECT, viewOf } from '../src/sim/camera.ts';
import {
  PLAYER_ALONG_MARGIN,
  PLAYER_ALONG_SPAN,
  PLAYER_LEAD,
  PLAYER_MARGIN,
  SCROLL_PER_STEP,
  SHIP_SPEED,
} from '../src/sim/flight.ts';
import { GameFrame, SHIP_START_ALONG, scatterUpgrades } from '../src/app/frame.ts';
import { initialState, reduce } from '../src/state/root.ts';
import { DEFAULT_DIFFICULTY } from '../src/state/slices/run.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { Rng } from '../src/sim/rng.ts';

/**
 * WHAT A PICKUP IS WORTH, AND WHAT A DEATH TAKES BACK.
 *
 * `docs/decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md` is the reasoning. Two rules
 * meet here and they are easy to get subtly wrong in opposite directions: an upgrade that cannot
 * change the outcome is worse than none, and a fifth one must not end the game.
 */

describe('0093 — the gun is on the musical grid, at every tier and not at two of them', () => {
  /*
    `docs/decisions/0093-the-gun-is-on-the-grid.md`. Asked for in play: *"we could almost make a
    rhythm style game if we change the player sounds a bit… what can we do so that as you pick up or
    lose power ups the music speeds up, slows down etc and works in a beat to the rhythm of the
    fire?"*

    ⚠️ **Auto-fire never stops** — `src/content/actions.ts` bans a fire action — so the gun is a
    metronome the player cannot switch off. Whether it is in time with the music is therefore not a
    nicety; it is the single most-heard rhythmic fact in the game.

    ⚠️ **NOTHING HERE ASSERTS ON A CADENCE'S VALUE**, on `src/content/shots.ts`'s terms: which rung a
    ship opens on is a hand's job. What is held is that every rung, whatever it is, lands on the beat.
  */
  /** Every rung of the pulse's ladder, in steps between volleys. */
  const RUNGS = Array.from({ length: UPGRADE_TIERS + 1 }, (_, tier) => fireEveryAt(SHIPS.proof, tier));

  it('THE ASK, in the unit the player hears: the gun closes with the music every single loop', () => {
    /*
      ⚠️ **This is the assertion written in the player's own terms** —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` requires at least one, and
      *"`fireEvery` divides `STEPS_PER_BEAT`"* is the model agreeing with itself. What the player
      experiences is that the gun and the music **come back together**: over one loop of music every
      tier fires a whole number of volleys, so the pattern never arrives half a beat out and the
      relationship between the two is the same in the third minute as in the first.

      A rung that divided the beat but not the loop would still drift within the phrase, which is the
      failure this catches and the divisor check below does not.
    */
    const loopSteps = LOOP_SECONDS * STEPS_PER_SECOND;
    expect(Number.isInteger(loopSteps), `a music loop is ${loopSteps} steps, which is not a whole number`).toBe(true);
    for (let tier = 0; tier < RUNGS.length; tier++) {
      const volleys = loopSteps / RUNGS[tier]!;
      expect(
        Number.isInteger(volleys),
        `at tier ${tier} the gun fires ${volleys.toFixed(2)} times per ${LOOP_SECONDS}s loop, so it walks off the music`,
      ).toBe(true);
    }
  });

  it('and every rung is a whole number of steps AND a musical fraction of a beat', () => {
    /*
      ⚠️ **THE FAILURE THIS EXISTS FOR IS THE LADDER AS IT SHIPPED**: 9, 8, 7, 5 and 4 steps against a
      beat of 27, of which exactly one divided anything. It was not a bug anybody could see — every
      guard in the repository was green — and it is why *"almost the right tempo"* was the report.

      Both halves are needed. A whole number of steps alone is trivially true of any integer; a
      fraction of a beat alone would allow 4.5 steps, which the fixed-step clock cannot express.
    */
    for (let tier = 0; tier < RUNGS.length; tier++) {
      const steps = RUNGS[tier]!;
      expect(Number.isInteger(steps), `tier ${tier} fires every ${steps} steps, which the clock cannot do`).toBe(true);
      expect(
        STEPS_PER_BEAT % steps,
        `tier ${tier} fires every ${steps} steps against a beat of ${STEPS_PER_BEAT}, so it is off the grid`,
      ).toBe(0);
    }
  });

  it('and the ladder respects the two floors it did not used to have to', () => {
    /*
      ⚠️ **These were ENDPOINTS of an interpolation and are now constraints on a table**, which is the
      one thing a hand-written ladder loses: `rung(base, FASTEST_FIRE, tier)` could not overshoot the
      floor, and a list can. Both floors are unchanged and both are still what they were —
      `FASTEST_FIRE` is legibility (`src/app/frame.ts` needs the impact flash to finish between hits)
      and `MAX_BARRELS` is the pool budget.
    */
    expect(SHIPS.proof.firePerBeat.length, 'the cadence ladder is not one rung per tier').toBe(UPGRADE_TIERS + 1);
    expect(SHIPS.proof.barrels.length, 'the barrel ladder is not one rung per tier').toBe(UPGRADE_TIERS + 1);
    for (let tier = 0; tier < RUNGS.length; tier++) {
      expect(RUNGS[tier], `tier ${tier} outruns the impact flash`).toBeGreaterThanOrEqual(FASTEST_FIRE);
      expect(SHIPS.proof.barrels[tier], `tier ${tier} asks for more barrels than the pool budgets`).toBeLessThanOrEqual(
        MAX_BARRELS,
      );
    }
  });

  it('THE COUNTER-BEAT: the missile is an exact ratio of the pulse at every rung, and was an accident', () => {
    /*
      ⚠️ **Reported from play as something that already worked** — *"the missile fire provided a great
      counter-beat"* — and nobody had chosen it. Two unrelated interpolations happened to start about
      five apart and stayed there: 5.00, 4.88, 4.71, 5.20, 5.00 across the old tiers. 0093 writes it
      down, and this is what stops a later tune to either ladder quietly dissolving it.

      ⚠️ **It also keeps 0051's *slower than the pulse* true by construction** rather than by two
      numbers that have to be kept in order, which is the second assertion here.
    */
    /*
      ⚠️ **THE FIRST VERSION OF THIS ASSERTION PROVED NOTHING AND `npm run prove` SAID SO.** It read
      `missileEvery / fireEvery === MISSILE_BEAT_RATIO`, which is the constant on both sides of the
      equals sign: setting the ratio to 4 moved the numerator and the expectation together and the
      suite stayed GREEN. That is
      `docs/decisions/0027-measure-the-picture-not-the-model.md`'s *a guard measuring a quantity
      defined in terms of the constant it guards proves only that the code agrees with itself*, caught
      by [0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md) inside a minute.

      **What is asserted instead is the musical property**, which the constant cannot satisfy by
      moving: a counter-beat must not land ON the beat. At a ratio of 4 the missile is exactly one
      beat apart wherever the gun is on sixteenths — a straight quarter note, the opposite of what was
      heard — and at 5 it never closes with a beat at any rung.
    */
    const ratios: number[] = [];
    for (let tier = 0; tier < RUNGS.length; tier++) {
      const missiles = Array.from({ length: tier }, () => 'missile' as const);
      const weapon = weaponFor(SHIPS.proof, missiles);
      const beats = weapon.missileEvery / STEPS_PER_BEAT;
      expect(
        Number.isInteger(beats),
        `at tier ${tier} a missile leaves every ${beats} beats exactly, which is ON the beat rather than across it`,
      ).toBe(false);
      ratios.push(weapon.missileEvery / fireEveryAt(SHIPS.proof, tier));
      expect(weapon.missileEvery, `at tier ${tier} the second weapon fires as often as the first`).toBeGreaterThan(
        weaponFor(SHIPS.proof, Array.from({ length: tier }, () => 'weapon' as const)).fireEvery,
      );
    }
    /*
      ── THE CLAIM HERE USED TO BE *THE RATIO IS IDENTICAL AT EVERY RUNG*, AND IT WAS AN ARTEFACT ───

      ⚠️ **It read `new Set(ratios).size === 1`, and it was true because the missile READ THE PULSE'S
      CADENCE LIST.** `weaponFor` asked `fireEveryAt(ship, tubes)` — one list, two indices — so a
      constant ratio was not a property the ladders had, it was the same division written twice. The
      moment the missiles got a list of their own (`missilePerBeat` on `ShipRow`, 2026-08-10, for
      *"missile tubes don't get a second firing till like the 3rd upgrade"*) it went red, correctly,
      and what it had been standing over turned out to be an identity rather than a rhythm.

      ⚠️ **WHAT A LISTENER ACTUALLY HEARS IS HOW OFTEN THE TWO STREAMS CLOSE**, and that is asserted
      instead. A counter-beat is a counter-beat because the missile does NOT arrive with a pulse most
      of the time; how many pulses pass between the two landing together is the thing the play-test
      was describing when it said *"the missile fire provided a great counter-beat"*.

      ⚠️ **It cannot be satisfied by moving `MISSILE_BEAT_RATIO`**, which is the trap the first
      version of this whole test fell into — [0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md)
      caught that one inside a minute. At a ratio of 4 the count below is 4 and this fails; at 5 it is
      5 at four of the five rungs and 20 at the other.

      ⚠️ **Tier 2 is the wide one and it is a CHANGE, written down rather than smoothed over.** With
      one shared list the two streams closed every 5 pulses at every rung; with the missiles on their
      own the pulse steps at tier 2 and the missile does not, so there the two close every 20 pulses —
      five beats — instead. Still a cross-rhythm, and a wider one. **Nobody has heard it**, and it is
      the first thing to listen for if the counter-beat stops reading.
    */
    for (let tier = 0; tier < RUNGS.length; tier++) {
      const missiles = Array.from({ length: tier }, () => 'missile' as const);
      const missileEvery = weaponFor(SHIPS.proof, missiles).missileEvery;
      const pulseEvery = fireEveryAt(SHIPS.proof, tier);
      // Both are whole steps, so the instant they next share is their least common multiple.
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const together = (missileEvery * pulseEvery) / gcd(missileEvery, pulseEvery);
      expect(
        together / pulseEvery,
        `at tier ${tier} a missile lands with a pulse every ${together / pulseEvery} volleys, which is with it rather than across it`,
      ).toBeGreaterThanOrEqual(MISSILE_BEAT_RATIO);
    }
  });

  it('and the tempo is a whole number of sim steps, which is what makes any of it possible', () => {
    /*
      ⚠️ **THE CROSS-FILE CHECK, and it cannot be an import.** `STEPS_PER_BEAT` lives in
      `src/content/music.ts` and `STEPS_PER_SECOND` in `src/state/screens.ts`;
      `docs/decisions/0015-the-layer-ladder.md` points the arrow from `content` to `state`, so content
      may not read it. The two are held to each other here instead — the same shape of guard
      `tests/bombs.test.ts` makes for a blast's reach and the bitmap it is drawn at.

      ⚠️ **A beat that is not a whole number of steps is a gun that CANNOT be put in time**, at any
      cadence, because the gap between volleys is counted in steps. That is the constraint the whole
      decision turns on, and it is one line.
    */
    expect(
      BEAT_SECONDS * STEPS_PER_SECOND,
      `a beat is ${(BEAT_SECONDS * STEPS_PER_SECOND).toFixed(3)} sim steps, so no cadence can land on it`,
    ).toBe(STEPS_PER_BEAT);
  });
});

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
    const one = weaponFor(SHIPS.proof, ['weapon']);
    const two = weaponFor(SHIPS.proof, ['weapon', 'weapon']);
    expect(two.fireEvery, 'a second rapid did nothing').toBeLessThan(one.fireEvery);
    expect(weaponFor(SHIPS.proof, ['weapon', 'weapon']).shots).toBeGreaterThan(
      weaponFor(SHIPS.proof, ['weapon']).shots,
    );

    let state = reduce(initialState, { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY });
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'weapon' });
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'weapon' });
    expect(state.run.upgrades, 'the run kept one rapid where two were taken').toEqual(['weapon', 'weapon']);
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
    for (let i = 0; i < 20; i++) many.push('weapon');
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
      sections: NO_SECTIONS,
      boss: 'sentinel',
      theme: 'approach',
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
    // 0093: the base cadence is rung 0 of the ship's own ladder rather than a field beside it.
    expect(base.fireEvery).toBe(fireEveryAt(SHIPS.proof, 0));
    expect(base.shots).toBe(SHIPS.proof.barrels[0]);
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
      ⚠️ **THE LOAD-BEARING GUARD, AND IT IS 0039'S BILL.** A death empties the UPGRADES — the
      charges stopped going with them at
      `docs/decisions/0085-a-death-does-not-cost-the-bombs.md`, and what a level has to rearm was
      always the guns — so the question a level has to answer is *how long is a player who just died
      without a weapon*. In
      SECONDS, which is a unit the player experiences —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` requires at least one assertion in
      one, and "every 600 world units" is the model talking to itself.

      ── THE CEILING WAS TWENTY SECONDS AND IT IS NOW FIFTY ─────────────────────────────────────────

      ⚠️ **This is the guard `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` had to move
      rather than keep, and moving a ceiling to fit the content is normally the thing this repository
      refuses.** It is written out because the exception has to be argued rather than assumed.

      The old number came straight from `docs/game.md`: *"a level may never leave the player more than
      twenty seconds without something to rearm from."* Reported from play: *"power ups are too common
      still and these are premium game pieces."* At the ask's own budget — two to three weapon pickups
      a level — no arrangement over 6,350 units makes twenty seconds. The two are in direct conflict
      and the ask wins, so the RULE changes and this changes with it.

      ⚠️ **What makes fifty survivable is a different mechanism, not a looser standard.** 0082 also
      made a death throw **half of what it took** back onto the field where it happened
      (`SCATTER_KEPT` in `src/app/frame.ts`). The question this guard asks is *what is a player who
      just died flying with*, and the answer is no longer *the next authored pickup* — it is *half of
      their own loadout, immediately*. Fifty-five seconds is what the levels actually author with three
      weapons in them (the worst is `gauntlet`, at fifty) plus a little slack; it is a drift detector
      now rather than a promise.

      ⚠️ **So this guard is weaker than it was and it says so.** If a play-test reports that dying is
      brutal, the thing to change is `SCATTER_KEPT`, and this number follows it.
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
          'died at the start of that stretch flies all of it with the base weapon and whatever half ' +
          'of their loadout the scatter handed back.',
      ).toBeLessThan(55);
    }
  });

  it('THE TARGET: a level offers exactly enough weapons to cap the guns, and it does it before the boss', () => {
    /*
      ── THE ONE PLACEMENT WITH A STATED TARGET BEHIND IT ───────────────────────────────────────────

      Asked for: *"the player should be able to cap weapons before the 1st boss and then also have a
      couple of additional shields/bombs."*
      `docs/decisions/0083-two-ladders-of-four.md`.

      ⚠️ **Held as ARITHMETIC against `UPGRADE_TIERS` rather than against the number four.** The tier
      count and the pickup budget are one decision — raising the tiers without raising the weapons
      leaves a player who can never cap, and lowering them leaves pickups that convert straight to
      bombs. A guard written as *four weapons* would be a copy of `src/content/levels.ts`; this fails
      the moment either number moves without the other.

      ⚠️ **And *"before the boss"* is the half that is easy to lose.** Four weapons in a level whose
      last one sits inside the boss fight satisfies a count and not the ask.
    */
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const weapons = level.pickups.filter((p) => p.kind === 'weapon');
      expect(
        weapons.length,
        `${kind} offers ${weapons.length} weapons against ${UPGRADE_TIERS} tiers, so the guns cannot be capped`,
      ).toBe(UPGRADE_TIERS);
      const capsAt = weapons[weapons.length - 1]!.at;
      expect(capsAt, `${kind} caps the guns at ${capsAt}, which is not before its boss at ${level.bossAt}`).toBeLessThan(
        level.bossAt,
      );
      /*
        ⚠️ **AND THE *"AND THEN ALSO"* HALF: something after the cap.** Once the guns are full a weapon
        pickup converts to a bomb charge, so a level whose last minute is all weapons is a level
        offering pickups whose face does not say what they give. Two is what the levels author; one is
        what this refuses to go below, because the ask says *a couple* and a guard should not be a copy
        of the content.
      */
      const afterCap = level.pickups.filter((p) => p.at > capsAt);
      expect(
        afterCap.length,
        `${kind} offers nothing after the guns cap at ${capsAt} — the run to the boss has no pickup in it`,
      ).toBeGreaterThan(0);
      for (const late of afterCap) {
        expect(
          late.kind === 'shield' || late.kind === 'bomb',
          `${kind} offers a ${late.kind} at ${late.at}, after the guns are already full`,
        ).toBe(true);
      }
    }
  });

  it('offers the budget the ask named, in every level', () => {
    /*
      ⚠️ **THE OTHER HALF, AND IT IS A CEILING RATHER THAN A FLOOR.** The guards above stop a level
      starving the player; this stops one drifting back to the stream of pickups the report called
      *"non-earned upgrades that make the game trivial"*.

      The numbers are the ask's: *"shields/lives should be kept to 1-2 per level"*, and the missiles
      come from *"have tier 2 on missiles"* — two pickups, because `tiersOf` counts them one for one.

      ⚠️ **Written as the ask's range and not as what the levels contain.** Every level currently
      authors nine, and asserting nine would make this a copy of `src/content/levels.ts` rather than a
      guard over it — `tests/level.test.ts`'s density floor records what that costs.
    */
    for (const kind of LEVEL_KINDS) {
      const counts = { weapon: 0, missile: 0, shield: 0, bomb: 0 };
      for (const entry of LEVELS[kind].pickups) counts[entry.kind]++;
      expect(counts.missile, `${kind} offers ${counts.missile} missiles, and the ask is tier 2`).toBeGreaterThanOrEqual(
        2,
      );
      expect(counts.missile, `${kind} offers ${counts.missile} missiles, and the ask is tier 2`).toBeLessThanOrEqual(3);
      expect(counts.shield, `${kind} offers ${counts.shield} shields, and the ask is 1-2`).toBeGreaterThanOrEqual(1);
      expect(counts.shield, `${kind} offers ${counts.shield} shields, and the ask is 1-2`).toBeLessThanOrEqual(2);
      /*
        ⚠️ **The bomb has no stated budget, so what is held is that a level HAS one.** 0053 left *how
        a player gets more bombs* to level clears alone and 0082 is what answers it; a level with no
        bomb in it would leave the arsenal back where 0053 found it.
      */
      expect(counts.bomb, `${kind} has no bomb in it, so the arsenal only grows between levels`).toBeGreaterThan(0);
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

  /*
    ── `has lives in it` WAS HERE, AND WHAT REPLACED IT IS NOT THE SAME PROMISE ────────────────────

    It held that every level authors at least one `extraLife`, because
    `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` refused lives that refill at
    a boundary and named findable ones as the replacement.

    ⚠️ **`docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` removed the extra life**, on
    the ask's reasoning that *"a shield is an extra life anyway and it's far more game impactful and
    meaningful"* — a shield stops the death, so it keeps the arsenal a death would cost.

    ⚠️ **The guard is NOT quietly weakened into *has a shield in it*, and that would have been the
    tempting move.** They are different promises: a shield lets a player survive a hit, and nothing in
    the game any more lets a run's life count go UP. The shield floor lives in the budget guard above,
    where it is stated as a budget rather than dressed as 0039's replacement.

    What 0039 is owed instead is a decision, and 0082 says so: the day
    `docs/decisions/0068-a-run-over-is-a-continue.md`'s free continue stops being free, a run has no
    way to gain a life and this is where the guard for whatever answers that will go.
  */
});

describe('collecting one, in the real frame', () => {
  /** A level that is one pickup and nothing else, placed where the ship will fly through it. */
  function onePickup(kind: PickupKind): ReturnType<typeof playableWorld> {
    return playableWorld({
      waves: [],
      pickups: [{ at: 200, kind, lane: ACROSS_SPAN / 2 }],
      bossAt: Number.POSITIVE_INFINITY,
      sections: NO_SECTIONS,
      boss: 'sentinel',
      theme: 'approach',
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
      if (world.pickups.size > 0) {
        world.ship.across = world.pickups.at(0).across;
        /*
          ⚠️ **AND `along`, since 0064.** A pickup no longer runs back through the whole view: it
          stops at `PICKUP_STATION` and waits there, which is ahead of where the ship starts. A
          fixture that only matched the lane was waiting for the pickup to come to it, and it never
          does any more — which is the change, not a fixture failing. Flying forward to a pickup that
          is waiting is what a player now does.
        */
        world.ship.along = world.pickups.at(0).along;
      }
      each?.();
      frame.step();
    }
  }

  it('is reported exactly once, and by the name the level authored', () => {
    /*
      ⚠️ **THE AUTHORED KIND, EXACTLY — AND FOR TWO YEARS' WORTH OF DECISIONS IT COULD NOT BE.**
      `docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md` made a pickup one of
      two things with the camera choosing, so this could only assert *something inside the pair*, and
      the real question — which one — lived in a suite of its own.

      `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` removed the cycle, so the
      assertion is now the one it always wanted to be: **what the level put there is what the player
      is handed.** That equality is the whole of what a level author can rely on.

      ⚠️ **Checked for every kind rather than for one**, because the collection loop resolves a name
      out of an index and an off-by-one in `PICKUP_KINDS` would hand over the neighbouring row — which
      is the bug `src/content/sprites.ts` records having shipped once already, in this exact shape.
    */
    for (const kind of PICKUP_KINDS) {
      const { world, taken } = onePickup(kind);
      flyInto(world, 600);
      expect(taken.length, `the ship flew through a ${kind} and nothing was reported`).toBe(1);
      expect(taken[0], `a ${kind} was handed over as something else`).toBe(kind);
    }
  });

  /**
   * HOW CLOSE THE SHIP HAS TO GET, in the only unit the player has.
   *
   * Reported from play: *"power ups are slightly too hard to pick up in size."*
   * `docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md`.
   *
   * ⚠️ **Measured as a FRACTION OF THE LANE and never against `COLLECT_REACH`.** The lane is a fixed
   * 100 across on every device (0023), so a fraction of it is a real distance a player experiences —
   * where an assertion written in terms of the multiplier would prove only that the code agrees with
   * itself, which is the failure `docs/decisions/0027-measure-the-picture-not-the-model.md` records
   * and `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` says a probe cannot catch.
   */
  /**
   * ⚠️ **THE SMALLEST PICKUP THERE IS, AND `npm run prove` IS WHY.** This used to take whichever kind
   * the caller had to hand, which was fine while every pickup was 2.4 units across.
   * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` gave the three kinds three sizes,
   * and the reach is the ship's own plus **the pickup's radius** — so measuring on the biggest one
   * bought 0.8 units of slack that the reach was not providing.
   *
   * 0056's probe went **STILL GREEN** because of it: `COLLECT_REACH` put back to the hull, a pass that
   * felt like a hit is a miss again, and this said nothing. The guard had stopped measuring the thing
   * it names while reading as thorough — which is
   * `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching exactly the failure it exists for,
   * one decision downstream of the change that caused it.
   *
   * The worst case is the smallest pickup, so that is what the corridor is measured on.
   */
  const SMALLEST: PickupKind = PICKUP_KINDS.reduce((a, b) => (PICKUPS[b].radius < PICKUPS[a].radius ? b : a));

  function grabbableFrom(offset: number): boolean {
    const { world, taken } = onePickup(SMALLEST);
    const frame = new GameFrame(world);
    for (let i = 0; i < 600; i++) {
      /*
        Held exactly `offset` off the pickup's lane, rather than steered onto it — and level with it
        ALONG the lane, because since 0064 a pickup waits ahead of where the ship starts.

        ⚠️ **The pickup's own wander is stopped, and it has to be.** It now spends seven seconds
        crossing the lane, so it reaches the edges — and a ship parked `offset` outside the lane there
        is pulled back inside it by `flyShip`'s clamp, closing the gap this is trying to hold open.
        The subject is the REACH; the drift is `tests/spawns.test.ts`'s.
      */
      if (world.pickups.size > 0) {
        world.pickups.at(0).velAcross = 0;
        world.pickups.at(0).across = ACROSS_SPAN / 2;
        world.ship.across = ACROSS_SPAN / 2 + offset;
        world.ship.velAcross = 0;
        world.ship.along = world.pickups.at(0).along;
      }
      frame.step();
    }
    return taken.length > 0;
  }

  it('is taken from 5% of the lane away, which one flick of the stick covers', () => {
    /*
      ⚠️ **The number the report is about.** Before this the reach was 4.4% of the lane and a pass
      that felt like a hit was a miss. The assertion is deliberately INSIDE the new reach and OUTSIDE
      the old one, so it fails if the change is reverted and it does not merely restate the constant.
    */
    expect(grabbableFrom(ACROSS_SPAN * 0.05), 'a pickup half a ship-width off the lane was missed').toBe(true);
    expect(grabbableFrom(-ACROSS_SPAN * 0.05), 'the reach is not symmetric across the lane').toBe(true);
  });

  it('and is still MISSED from far enough away, so this is a reach and not a magnet', () => {
    /*
      ⚠️ **The half that stops the fix going too far.** A collection radius nobody can miss is not a
      more forgiving game — it takes away the choice 0052 built the whole cycling pickup around, which
      is *which* of the two faces the player flies for.
    */
    expect(grabbableFrom(ACROSS_SPAN * 0.12), 'a pickup an eighth of the lane away collected itself').toBe(false);
  });

  it('leaves the field once taken, so it cannot be collected twice', () => {
    const { world } = onePickup('shield');
    flyInto(world, 600);
    expect(world.pickups.size, 'the pickup is still on the field after being collected').toBe(0);
  });

  /**
   * A DEATH SCATTERS WHAT IT TOOK.
   *
   * `docs/decisions/0066-a-death-scatters-what-it-took.md`. Asked for in play: *"when a player dies,
   * their power ups should explode from where they were and bounce around the screen"*, and
   * *"non-cycling and on a short timer so there's enough time to grab some, but maybe not all."*
   *
   * ⚠️ **This is the half of the dying-is-punishing report that 0057 deliberately did not answer**,
   * and 0056 made a death cost more in the same session.
   */
  describe('a death throws back what it took', () => {
    /**
     * A world with nothing in it, a ship that has just died carrying `upgrades`, and a replacement.
     *
     * ⚠️ **The ship is moved out of the way afterwards, because in the game it IS.** `onDeath` in
     * `src/app/mount.ts` scatters and then calls `respawn`, which puts the replacement back at
     * `SHIP_START_ALONG` — so the scatter and the new ship are only in the same place if the player
     * died at the very back of their box. A fixture that left them on top of each other would
     * collect the whole scatter on the first step and measure nothing at all, which is exactly what
     * the first version of this did.
     */
    function scattered(upgrades: readonly UpgradeKind[], seed: string): ReturnType<typeof playableWorld> {
      const built = playableWorld({
        waves: [],
        pickups: [],
        bossAt: Number.POSITIVE_INFINITY,
        sections: NO_SECTIONS,
        boss: 'sentinel',
      theme: 'approach',
      });
      built.world.scatterRng = new Rng(seed);
      scatterUpgrades(built.world, upgrades);
      built.world.ship.along = built.world.cameraAlong + PLAYER_MARGIN;
      built.world.ship.prevAlong = built.world.ship.along;
      return built;
    }

    /**
     * A death that happened to keep the WHOLE loadout, found by walking seeds.
     *
     * ⚠️ **A fixture, and it exists because 0082 made the scatter a coin toss.** Every test below
     * except the 50% one is about the ring's geometry, the lifetime or the set of kinds — properties
     * of *whatever is thrown* — and a fixture that sometimes threw two pieces and sometimes five would
     * make each of them measure a different thing on a different day.
     *
     * ⚠️ **Deterministic, not random.** It walks a fixed list of seeds and takes the first that keeps
     * everything, so the same seed is used on every run and on every machine; it THROWS rather than
     * skipping if none does, because a fixture that silently found nothing is
     * `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`'s subject wearing a different hat.
     */
    function died(upgrades: readonly UpgradeKind[]): ReturnType<typeof playableWorld> {
      for (let attempt = 0; attempt < 200; attempt++) {
        const built = scattered(upgrades, `scatter:${attempt}`);
        if (built.world.pickups.size === upgrades.length) return built;
      }
      throw new Error(`no seed in 200 kept all ${upgrades.length} upgrades — the scatter filter is not a coin`);
    }

    /** Where the scatter was thrown from — the ship's start, which is where it died. */
    const deathAlong = SHIP_START_ALONG;

    it('0100 — THE REPORTED ONE: a scatter never leaves a piece where the ship cannot reach it', () => {
      /*
        `docs/decisions/0100-a-level-places-its-pickups-too.md`. Reported from play: *"on player death
        the powerups can go to a section on the left side of the screen, where they are visible but
        the player cannot get to them."*

        ⚠️ **THE VIEW AND THE PLAYER'S BOX ARE NOT THE SAME BAND, and everything here assumed they
        were.** The view begins at the camera; the ship's own clamp begins at `PLAYER_ALONG_MARGIN`
        and ends at `PLAYER_LEAD` (`src/sim/flight.ts`). Everything below the margin is on the screen
        and out of reach, and `scatterRing` throws a full circle — so a ship that died in the back
        eleven units of its box put pieces there. `driftPickups` bounced a pickup off the LANE on the
        across axis and had no rule at all on the along one.

        ⚠️ **Driven from the very back of the box, which is where the defect is worst and where a
        player who has just been shot usually is.** `deathOffset` is where the ship died, in the
        camera's frame.

        ⚠️ **Reach is the two hurtboxes, not the ship's centre.** What the player has to do is touch
        it, so a piece a hair outside the clamp is still collectable and the guard would be wrong to
        refuse it. `src/sim/collide.ts` is the pairing; this is the same sum.
      */
      const built = died(['weapon', 'weapon', 'weapon', 'missile', 'missile']);
      const { world } = built;
      const frame = new GameFrame(world);
      world.deathOffset = PLAYER_ALONG_MARGIN;
      world.pickups.clear();
      world.scatterRng = new Rng('scatter:back-of-the-box');
      scatterUpgrades(world, ['weapon', 'weapon', 'weapon', 'missile', 'missile']);
      // The ship is put at the FAR end of its box, so it cannot collect the scatter it is being
      // measured against — the fixture leaves it beside the wreck, which would empty the pool.
      world.ship.along = world.cameraAlong + PLAYER_LEAD;
      world.ship.prevAlong = world.ship.along;
      expect(world.pickups.size, 'nothing was scattered, so this measured nothing').toBeGreaterThan(3);

      // Long enough for the along excursion to be spent — it is about eleven world units against an
      // ease, so a second of steps is far more than it needs.
      const stranded: string[] = [];
      for (let step = 0; step < 240; step++) {
        frame.step();
        for (let i = 0; i < world.pickups.size; i++) {
          const item = world.pickups.at(i);
          const inView = item.along - world.cameraAlong;
          const reach = world.ship.radius + item.radius;
          if (inView < PLAYER_ALONG_MARGIN - reach || inView > PLAYER_LEAD + reach) {
            stranded.push(`a piece sat ${inView.toFixed(1)} units ahead of the camera on step ${step}`);
          }
        }
      }
      expect(
        stranded.slice(0, 3),
        `${stranded.length} sightings of a scattered pickup outside the band the ship can reach ` +
          `(${PLAYER_ALONG_MARGIN.toFixed(1)}…${PLAYER_LEAD.toFixed(1)} ahead of the camera)`,
      ).toEqual([]);
    });

    it('0100 — and the piece is still THROWN, so the bounce did not turn the ring into a clamp', () => {
      /*
        ⚠️ **The counterweight, and without it the fix above is satisfied by not scattering at all.**
        `docs/decisions/0066-a-death-scatters-what-it-took.md` is a picture — pieces flying off a
        wreck — and a bounce that pinned everything to the wall would pass every assertion above while
        deleting the feature. What is held is that the pieces end up SPREAD along the lane rather than
        stacked on one line.
      */
      const built = died(['weapon', 'weapon', 'weapon', 'missile', 'missile']);
      const { world } = built;
      const frame = new GameFrame(world);
      world.deathOffset = PLAYER_ALONG_MARGIN;
      world.pickups.clear();
      world.scatterRng = new Rng('scatter:back-of-the-box');
      scatterUpgrades(world, ['weapon', 'weapon', 'weapon', 'missile', 'missile']);
      // The ship is put at the FAR end of its box, so it cannot collect the scatter it is being
      // measured against — the fixture leaves it beside the wreck, which would empty the pool.
      world.ship.along = world.cameraAlong + PLAYER_LEAD;
      world.ship.prevAlong = world.ship.along;
      for (let step = 0; step < 240; step++) frame.step();
      const offsets: number[] = [];
      for (let i = 0; i < world.pickups.size; i++) offsets.push(world.pickups.at(i).along - world.cameraAlong);
      expect(offsets.length, 'every piece was collected or expired, so this measured nothing').toBeGreaterThan(2);
      const spread = Math.max(...offsets) - Math.min(...offsets);
      expect(spread, `the whole scatter came to rest within ${spread.toFixed(1)} units of one line`).toBeGreaterThan(4);
    });

    it('THE REPORTED ONE: pickups where the ship was, and never more than it carried', () => {
      const carried: UpgradeKind[] = ['weapon', 'weapon', 'weapon'];
      const { world } = died(carried);
      expect(world.pickups.size, 'nothing at all was thrown back').toBeGreaterThan(0);
      expect(world.pickups.size, 'the scatter gave back more than the death took').toBeLessThanOrEqual(carried.length);
      for (let i = 0; i < world.pickups.size; i++) {
        const item = world.pickups.at(i);
        expect(Math.abs(item.along - deathAlong), 'a pickup was thrown from somewhere else').toBeLessThan(1);
        expect(Math.abs(item.across - ACROSS_SPAN / 2), 'a pickup was thrown from somewhere else').toBeLessThan(1);
      }
    });

    it('throws back nothing the player never had', () => {
      /*
        ⚠️ **The set, not the count.** A scatter that threw whatever was cheapest to look up would pass
        a count assertion and hand a player back something they never found — which is the game giving
        away an upgrade rather than returning one.

        ⚠️ **A SUBSET now rather than an equality, and 0082 is why.** A death used to throw everything
        it took; it now throws each piece with a 50% chance, so *exactly what was carried* is no longer
        the rule. What survives is the half that matters: nothing comes back that did not go in.
      */
      const carried: UpgradeKind[] = ['weapon', 'weapon', 'weapon'];
      const { world } = died(carried);
      for (let i = 0; i < world.pickups.size; i++) {
        const kind = PICKUP_KINDS[world.pickups.at(i).kind]!;
        expect(carried, `the scatter handed back a ${kind}, which the death never took`).toContain(kind);
      }
    });

    it('THE COST OF DYING: gives back every upgrade, on every seed', () => {
      /*
        ── THIS GUARD HELD THE OPPOSITE FOR ONE DAY, AND A PLAY-TEST IS WHY ────────────────────────

        ⚠️ **0082 made a death throw each upgrade on a 50% coin**, which was the ask at the time:
        *"current implementation means there's not really a cost to dying at all."* It was flown and
        the verdict was *"tested the 50% on death and it's too punishing, let's make 100% for weapons
        and missiles."* `docs/decisions/0083-two-ladders-of-four.md`.

        ⚠️ **Walked over MANY SEEDS even though there is no longer a draw**, and that is the point: a
        filter reintroduced anywhere — a coin, a cap, an off-by-one on the ring's count — shows up as
        one seed giving back fewer than it took. A single-seed assertion would pass against a coin that
        happened to come up heads.

        ⚠️ **And the whole ladder's worth, not two.** Both ladders cap at `UPGRADE_TIERS`, so eight is
        the most a shell can ever hand this — which makes it the loadout worth measuring.
      */
      const carried: UpgradeKind[] = [];
      for (let i = 0; i < UPGRADE_TIERS; i++) carried.push('weapon', 'missile');
      for (let seed = 0; seed < 40; seed++) {
        const { world } = scattered(carried, `whole:${seed}`);
        expect(
          world.pickups.size,
          `seed ${seed} gave back ${world.pickups.size} of ${carried.length} — something is filtering the scatter`,
        ).toBe(carried.length);
      }
    });

    it('and never throws a shield, because a shield was never in the list', () => {
      /*
        ⚠️ **Asked for in the same breath as the 100%**: *"but no shields spawn on death."*

        ⚠️ **It is already true and the guard is here because of WHY it is true.** A shield lives on
        the ship's `health`
        (`docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`),
        not in the upgrade list, so `scatterUpgrades` cannot see one: the signature is the guarantee.
        That makes it true by a type rather than by a rule, and a type stops being a guarantee the
        moment somebody widens it — which is exactly what 0083 just did to `UpgradeKind`, taking it
        from one member to two.

        ⚠️ **Driven at the largest loadout the shell can build**, so a widening that quietly admitted a
        shield would have to show up here.
      */
      const carried: UpgradeKind[] = [];
      for (let i = 0; i < UPGRADE_TIERS; i++) carried.push('weapon', 'missile');
      const { world } = scattered(carried, 'no-shields');
      expect(world.pickups.size, 'nothing was thrown, so this measured nothing').toBeGreaterThan(0);
      for (let i = 0; i < world.pickups.size; i++) {
        const kind = PICKUP_KINDS[world.pickups.at(i).kind]!;
        expect(kind, 'a death put a shield back on the field').not.toBe('shield');
      }
    });

    /*
      ⚠️ **`does not cycle, so what comes back is what was lost` WAS HERE.** It drove a scattered piece
      across a whole phase boundary and held that its sprite never changed, because
      `docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md`'s cycle was the one
      mechanism that could hand a player back something they never had.

      0082 removed the cycle, so *non-cycling* — the ask's own word — is now true of every pickup in
      the game by construction, and there is nothing left for this to catch. Its twin,
      `and an AUTHORED pickup still cycles`, went with it for the same reason. What survives of the
      concern is the subset assertion above.
    */

    it('leaves in every direction, and no two pieces travel together', () => {
      /*
        ⚠️ **THE SEPARATION IS NOW IN TWO AXES, AND SO IS THE GUARD** —
        `docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md`. This used to count distinct
        `across` lanes, because the scatter was a fan along one line and a lane was the only thing
        that could distinguish two pieces. A ring can put two pieces on the same lane and eleven world
        units apart, which is not stacking — so what is held is the thing 0066 actually wanted:
        *"bounce around the screen"* with every piece reachable as its own object.

        ⚠️ **In world units the player can check, per 0027**: a twentieth of the lane apart, which is
        wider than the reach that collects one, so no two can be taken as if they were one.

        Driven at the largest loadout, which is the worst case for the ring — the gap between
        neighbouring headings is narrowest when there are the most of them.
      */
      const { world } = died(['weapon', 'weapon', 'weapon', 'weapon', 'weapon', 'weapon']);

      /*
        ⚠️ **THE RING IS DIVIDED OVER WHAT IS ACTUALLY THROWN, and 0082 is what put that at risk.**
        Read off the velocities before a single step, because the along component decays
        (`PICKUP_EASE`) and the headings stop being recoverable from position within a second.

        A death now throws each piece on a 50% coin, so `scatterUpgrades` has to count the survivors
        BEFORE spacing them. The obvious way round — toss the coin while placing — divides the circle
        over the full loadout and leaves the survivors sitting on its headings, so a third of the ring
        is empty and the player reads it as pieces having failed to appear. `src/app/frame.ts` says so
        where the loop is; this is what would notice.

        Held as *the widest gap is under twice the narrowest*, which is loose enough to survive the
        jitter (`SCATTER_JITTER_SHARE` is under half a gap by construction) and tight enough that one
        missing piece — a 2:1 gap at six, worse at fewer — fails it.
      */
      const headings: number[] = [];
      for (let i = 0; i < world.pickups.size; i++) {
        const item = world.pickups.at(i);
        headings.push(Math.atan2(item.velAcross, item.velAlong - world.scrollPerStep));
      }
      headings.sort((a, b) => a - b);
      let widest = 0;
      let narrowest = Infinity;
      for (let i = 0; i < headings.length; i++) {
        const next = i + 1 === headings.length ? headings[0]! + Math.PI * 2 : headings[i + 1]!;
        const gap = next - headings[i]!;
        if (gap > widest) widest = gap;
        if (gap < narrowest) narrowest = gap;
      }
      expect(
        widest / narrowest,
        `the ring has a gap ${(widest / narrowest).toFixed(1)}x its narrowest, so it was spaced over ` +
          'pieces that were never thrown',
      ).toBeLessThan(2);

      const frame = new GameFrame(world);
      for (let i = 0; i < 90; i++) frame.step();
      let closest = Infinity;
      for (let a = 0; a < world.pickups.size; a++) {
        for (let b = a + 1; b < world.pickups.size; b++) {
          const one = world.pickups.at(a);
          const two = world.pickups.at(b);
          closest = Math.min(closest, Math.hypot(one.along - two.along, one.across - two.across));
        }
      }
      expect(closest, `two pieces of the scatter travelled together, ${closest.toFixed(1)} units apart`).toBeGreaterThan(
        ACROSS_SPAN / 20,
      );
    });

    it('is thrown in both axes, and the along half is spent rather than carried', () => {
      /*
        ⚠️ **0066 REFUSED THIS AND 0077 TAKES IT**, so both halves are held here. 0066's objection was
        that a piece thrown along *"would be off the front or the back of the screen inside two
        seconds"*, and it is answered by the decay rather than by not throwing: the excursion is
        `speed ÷ PICKUP_EASE`, and after it the piece is holding the distance the ship died at exactly
        as it did before — 0034's *every speed is in the camera's frame*.

        Three claims, and the middle one is the one that was not true before:

          it does not leave the view          — the excursion is a fraction of the narrowest screen
          it MOVES along, visibly             — or the ring is a fan again
          it settles, and stays settled       — or it is drifting out slowly instead of quickly
      */
      const { world } = died(['weapon', 'weapon', 'weapon', 'weapon']);
      const frame = new GameFrame(world);
      const start: number[] = [];
      for (let i = 0; i < world.pickups.size; i++) start.push(world.pickups.at(i).along - world.cameraAlong);

      let furthest = 0;
      for (let i = 0; i < 120; i++) frame.step();
      const settled: number[] = [];
      for (let i = 0; i < world.pickups.size; i++) {
        const onScreen = world.pickups.at(i).along - world.cameraAlong;
        settled.push(onScreen);
        furthest = Math.max(furthest, Math.abs(onScreen - start[i]!));
      }
      expect(furthest, 'nothing was thrown along at all — the scatter is still a line').toBeGreaterThan(2);
      expect(furthest, `a piece was thrown ${furthest.toFixed(1)} units along, which is off the screen`).toBeLessThan(
        ACROSS_SPAN / 4,
      );

      // And it has stopped. A piece still moving at 120 steps is leaving, just slowly.
      for (let i = 0; i < 130; i++) frame.step();
      for (let i = 0; i < world.pickups.size; i++) {
        const drift = Math.abs(world.pickups.at(i).along - world.cameraAlong - settled[i]!);
        expect(drift, 'a scattered piece never stopped, so it is drifting out of the view').toBeLessThan(2);
      }
    });

    it('is gone on a short timer, and says so when it goes', () => {
      /*
        ⚠️ *"A short timer so there's enough time to grab some, but maybe not all."* Both halves: it
        expires, and the expiry is an EVENT the picture mentions —
        `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`, which is named
        for three cases where the model resolved something and the screen said nothing.

        In seconds, per 0027, and as a band rather than a value: long enough to cross the lane, short
        enough that a full loadout cannot be recovered by flying calmly from one to the next.
      */
      const { world } = died(['weapon']);
      const frame = new GameFrame(world);
      world.debris.clear();
      let steps = 0;
      for (; steps < 1800 && world.pickups.size > 0; steps++) frame.step();
      const seconds = steps / STEPS_PER_SECOND;
      expect(seconds, `the scatter lasted ${seconds.toFixed(1)}s`).toBeGreaterThan(ACROSS_SPAN / SHIP_SPEED / 60);
      expect(seconds, `the scatter lasted ${seconds.toFixed(1)}s, which is not a short timer`).toBeLessThan(10);
      expect(world.debris.size, 'a scattered pickup vanished with nothing to say it had').toBeGreaterThan(0);
    });

    it('never asks the pool for more than it has, however long the run was', () => {
      /*
        `src/sim/pool.ts` drops rather than grows, and a player with a very long run should not take
        the game with them. Six times the pool, which is a loadout nothing can currently hand out.

        ⚠️ **`scattered` rather than `died`, and the fixture's own error message is what said why.**
        `died` walks seeds for a death that keeps EVERY piece, and at this size that is a one-in-2^72
        event — it threw *"no seed in 200 kept all 24 upgrades"*, which is the fixture correctly
        refusing to pretend. The 50% coin is not what this test is about: what it holds is that the
        cap is a cap, and 0082's filter only ever makes the number smaller.

        ⚠️ **Several seeds, because one draw could land under the cap by luck.** A filter bug that
        overran would do so on most seeds and this would catch it on the first; walking a handful means
        it cannot pass because one particular death happened to be unlucky.
      */
      const many: UpgradeKind[] = [];
      for (let i = 0; i < CAPACITY.pickups * 6; i++) many.push('weapon');
      for (let seed = 0; seed < 8; seed++) {
        const { world } = scattered(many, `overrun:${seed}`);
        expect(world.pickups.size, 'the scatter overran the pool').toBeLessThanOrEqual(CAPACITY.pickups);
        expect(world.pickups.size, 'the scatter threw nothing at all').toBeGreaterThan(0);
      }
    });

    it('and an AUTHORED pickup is still itself, all the way to the cull', () => {
      /*
        ⚠️ **This was the counterweight to the cycle and it is now the counterweight to nothing
        changing at all.** It used to hold that an authored pickup DOES flip, so that a break switching
        the cycle off everywhere could not satisfy the *non-cycling* assertions above by accident. 0082
        removed the cycle, so the property inverts: an authored pickup must keep the face the level
        gave it, for its whole life on the field.

        ⚠️ **Kept rather than deleted, because the failure it now catches is real and new.** A pickup
        is drawn from `spriteBase`, which `stepEntities` re-derives every step for the hit flash — so a
        drawing that reverted, drifted or picked up a neighbour's row would be invisible in a still and
        obvious in play. Nothing else in the suite watches one sprite over a whole lifetime.
      */
      const { world } = onePickup('weapon');
      const frame = new GameFrame(world);
      while (world.pickups.size === 0) frame.step();
      const item = world.pickups.at(0);
      const drawn = item.sprite;
      let steps = 0;
      while (world.pickups.size > 0 && steps < 2000) {
        frame.step();
        steps++;
        if (world.pickups.size === 0) break;
        expect(item.sprite, 'an authored pickup changed what it was drawn as').toBe(drawn);
      }
      expect(steps, 'the pickup never reached the field, so nothing was watched').toBeGreaterThan(100);
    });
  });

  /**
   * A PICKUP WAITS TO BE TAKEN.
   *
   * `docs/decisions/0064-a-pickup-waits-to-be-taken.md`. Reported from play: *"they enter the screen,
   * change when they get to player safe distance, then disappear off the screen. They need to bounce
   * and move around the screen so the player can grab them safely and grab the power up they want
   * safely"* — and, underneath it, *"shields are a hundred times more valuable than lives, and nine
   * times out of ten the player is picking up a life or placing themselves in danger to get a
   * shield."*
   */
  describe('and it waits where the player can reach it', () => {
    /** Where a pickup is on screen, in world units ahead of the camera, over its whole life. */
    function trackOffset(steps: number): { world: ReturnType<typeof playableWorld>['world']; offsets: number[] } {
      const { world } = onePickup('weapon');
      const frame = new GameFrame(world);
      const offsets: number[] = [];
      for (let i = 0; i < steps; i++) {
        frame.step();
        if (world.pickups.size > 0) offsets.push(world.pickups.at(0).along - world.cameraAlong);
      }
      return { world, offsets };
    }

    /**
     * Whether the pickup is WAITING on the step ending at `i`, from the picture alone.
     *
     * ── IT USED TO BE *THE OFFSET DID NOT MOVE*, AND 0077 MADE THAT WRONG ────────────────────────
     *
     * ⚠️ **A frozen offset was never the claim; it was how the claim happened to be implemented.**
     * `driftPickups` assigned `velAlong` in one step, so a waiting pickup was pinned to the camera to
     * the last decimal — and that was the bug reported as *"power ups hit a wall when they get to the
     * center of the screen"*. A pickup now eases in and bobs while it waits
     * (`docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md`), so nothing is ever frozen and
     * a guard looking for stillness measures the defect rather than the feature.
     *
     * ⚠️ **What the player sees is *it stopped running away*, so that is what this reads**: the
     * offset falling back through the view slower than half the rate it falls back at when the pickup
     * is doing nothing. An approaching pickup moves a full `SCROLL_PER_STEP` a step; a waiting one
     * moves at the bob, which is well under half of it. Nothing here reads `PICKUP_STATION`,
     * `PICKUP_EASE` or `PICKUP_BOB_SPEED` — per
     * `docs/decisions/0027-measure-the-picture-not-the-model.md`, a guard written against the
     * constants it guards proves only that the code agrees with itself.
     */
    function waiting(offsets: readonly number[], i: number): boolean {
      return Math.abs(offsets[i]! - offsets[i - 1]!) < SCROLL_PER_STEP / 2;
    }

    it('THE REPORTED ONE: it stops running away, and stays on screen for seconds', () => {
      /*
        ⚠️ **Measured as a place ON SCREEN — world units ahead of the camera — which is the frame the
        player watches it in.** Before 0064 a pickup carried no speed of its own, so it fell back
        through the whole view at the scroll rate and was gone in about nine seconds, most of which it
        spent either beyond the player's reach or already behind them. Nothing here asserts on
        `PICKUP_STATION` or on how long the wait is; what is held is that there IS one.
      */
      const { offsets } = trackOffset(1400);
      let longest = 0;
      let run = 0;
      for (let i = 1; i < offsets.length; i++) {
        if (waiting(offsets, i)) run++;
        else run = 0;
        if (run > longest) longest = run;
      }
      const seconds = longest / STEPS_PER_SECOND;
      expect(seconds, `the pickup never stopped; it waited for ${seconds.toFixed(1)}s`).toBeGreaterThan(1);
    });

    it('and it never stops dead, which is what read as a wall', () => {
      /*
        ⚠️ **THE THIRD PLAY-TEST'S DEFECT, HELD FROM THE OTHER SIDE** — *"power ups hit a wall when
        they get to the center of the screen and slide up/down it before continuing on."* The guard
        above says the pickup stops running away; this one says it does not do it in one step, which
        is the difference between arriving and colliding.

        ⚠️ **In the player's own units, per 0027: the biggest single-step change in how fast the
        pickup is crossing the screen.** A pure assignment made that the whole scroll rate in one
        step. A lag makes it a fraction of it, and no constant in `src/app/frame.ts` is named here.
      */
      /*
        ── ONE PICKUP WAS NOT ENOUGH, AND ONLY A PROBE COULD SAY SO ─────────────────────────────────

        ⚠️ **THIS GUARD WENT BLIND WHEN `docs/decisions/0087-a-pickup-never-parks.md` LANDED, AND IT
        STAYED GREEN ABOUT IT.** `npm run prove` reported STILL GREEN for *the ease removed, so a
        pickup stops dead at the station* — 0077's own reported defect, restored exactly, and the
        suite did not notice.

        ⚠️ **The reason is phase luck, and it is deterministic rather than flaky.** The jump the
        missing ease produces is `target − velAlong` on the single step the pickup slows, and under
        0087 the target on that step carries the bob. One fixture pickup crosses at one bob phase; for
        this one the phase happened to sit where the target was already near the pickup's speed, so
        the whole impact was 0.03 units. A guard that samples one phase of a periodic quantity is a
        guard that measures the phase.

        ⚠️ **So it samples six, at six different phases and six different crossings.** `bobPhase` is
        the golden angle times the pickup's index (0087), so a level's pickups are as spread over the
        cycle as they can be — which makes *several pickups* the natural fixture rather than a longer
        run of one. Keyed by that phase rather than by pool slot, because `releaseAt` swaps the last
        live entry into a freed one and an index is not a pickup.
      */
      const { world } = playableWorld({
        waves: [],
        pickups: [200, 400, 600, 800, 1000, 1200].map((at) => ({ at, kind: 'weapon' as const, lane: ACROSS_SPAN / 2 })),
        bossAt: Number.POSITIVE_INFINITY,
        sections: NO_SECTIONS,
        boss: 'sentinel',
      theme: 'approach',
      });
      const frame = new GameFrame(world);
      const seen = new Map<number, { offset: number; delta: number }>();
      let worst = 0;
      for (let step = 0; step < 2600; step++) {
        frame.step();
        for (let i = 0; i < world.pickups.size; i++) {
          const item = world.pickups.at(i);
          const offset = item.along - world.cameraAlong;
          const last = seen.get(item.bobPhase);
          if (last === undefined) {
            // ⚠️ `NaN` for the first sighting, so the step a pickup APPEARS is not read as a change
            // of speed. It has no previous speed; comparing against a zero would make every spawn an
            // impact and the guard would be measuring its own bookkeeping.
            seen.set(item.bobPhase, { offset, delta: Number.NaN });
            continue;
          }
          const delta = offset - last.offset;
          if (!Number.isNaN(last.delta)) worst = Math.max(worst, Math.abs(delta - last.delta));
          seen.set(item.bobPhase, { offset, delta });
        }
      }
      expect(seen.size, 'the fixture never put six pickups on the field, so it sampled one phase again').toBe(6);
      expect(worst, `a pickup changed speed by ${worst.toFixed(2)} units in one step, which is an impact`).toBeLessThan(
        SCROLL_PER_STEP / 4,
      );
    });

    it('wanders along the lane while it waits, rather than tracking one line', () => {
      /*
        ⚠️ **THE OTHER HALF OF THE WALL, and the half the report described rather than diagnosed** —
        *"…and slide up/down it before continuing on."* A pickup pinned to the station has a fixed
        `along` and a constant `across` drift, which for seven seconds is a straight line down an edge
        that is not drawn. `driftPickups` bobs it (0077) so the track is a curve.

        ⚠️ **WHAT IS MEASURED IS THAT IT GOES BOTH WAYS, and the first draft of this guard did not.**
        Measuring the width of the band it waits in looks like the same claim and is not: the ease-in
        is itself worth about five units of band, because a lag approaches its target and never
        arrives, so the guard passed with the bob switched off entirely. `npm run prove` reported it
        STILL GREEN, which is
        `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching
        `docs/decisions/0027-measure-the-picture-not-the-model.md`'s failure — a guard firing on a
        quantity next to the one it names.

        ⚠️ **An easing pickup only ever falls BACK through the view; a bobbing one also comes
        forward.** So the claim is total forward travel in world units, which no amount of easing can
        produce and which a line cannot have.
      */
      const { offsets } = trackOffset(1400);
      let forward = 0;
      let low = Infinity;
      let high = -Infinity;
      for (let i = 1; i < offsets.length; i++) {
        if (!waiting(offsets, i)) continue;
        forward += Math.max(0, offsets[i]! - offsets[i - 1]!);
        low = Math.min(low, offsets[i]!);
        high = Math.max(high, offsets[i]!);
      }
      expect(forward, 'the pickup only ever fell back — it waited on one line, which read as a wall').toBeGreaterThan(2);
      /*
        ⚠️ **THE BAND CEILING THAT WAS HERE IS NOW ITS OWN TEST, INVERTED** — see
        `and the wait is a journey that ends where the ship flies` below. It read *the pickup wandered
        N units, which is a journey and not a wait*, and a journey is exactly what a wait is since
        `docs/decisions/0087-a-pickup-never-parks.md`. Split out rather than rewritten in place,
        because the two claims fail for different reasons and a probe names one test.
      */
      expect(low).toBeLessThan(high);
    });

    it('and the wait is a journey that ends where the ship flies', () => {
      /*
        ── THE CEILING ON THE BAND BECAME A FLOOR UNDER IT ──────────────────────────────────────────

        ⚠️ **THIS IS THE INVERSE OF AN ASSERTION THAT USED TO LIVE IN THE TEST ABOVE** —
        `docs/decisions/0087-a-pickup-never-parks.md`. It held the wander to under a quarter of the
        lane, because 0077's pickup held a fixed `along` and the bob was a wobble around it. Reported
        from play against that build: *"pickups come up fast, still hit the middle barrier and then
        float a bit."* Easing onto a station is still arriving at a station, and a wait spent at one
        place on the screen is a barrier whatever the approach to it looked like.

        **A wait is a journey now, so the guard says so.** A guard tied to a decision inverts when the
        decision does; the alternative — a band loose enough to hold both — describes neither.

        ⚠️ **AND IT ENDS AT THE SHIP, which is the half that makes it a design rather than a drift.**
        `PICKUP_SLOW_AT` is derived so that a pickup nobody touches arrives at `SHIP_START_ALONG` —
        the ship's own place in the camera's frame — on the step its wait runs out. Two constants with
        their own separate reasons, checked against each other, which is the one shape
        `docs/decisions/0027-measure-the-picture-not-the-model.md` allows.

        ⚠️ **The tolerance is real and is stated in the lane's units.** A lag approaches its target
        and never quite reaches it, so the pickup gives up about seven units of the journey to the
        ease — and nothing here names `PICKUP_EASE`, `PICKUP_CLOSE_SHARE` or `PICKUP_SLOW_AT`.
      */
      const { offsets } = trackOffset(1400);
      let low = Infinity;
      let high = -Infinity;
      for (let i = 1; i < offsets.length; i++) {
        if (!waiting(offsets, i)) continue;
        low = Math.min(low, offsets[i]!);
        high = Math.max(high, offsets[i]!);
      }
      const band = high - low;
      expect(
        band,
        `the pickup's wait covered ${band.toFixed(1)} units, which is a station and not a journey`,
      ).toBeGreaterThan(ACROSS_SPAN / 2);
      expect(
        Math.abs(low - SHIP_START_ALONG),
        `the pickup's journey ended ${low.toFixed(1)} out, and the ship flies at ${SHIP_START_ALONG}`,
      ).toBeLessThan(ACROSS_SPAN / 6);
    });

    it('waits long enough to be crossed the whole lane for', () => {
      /*
        ── THIS GUARD WAS MEASURING THE CYCLE AND IT NOW MEASURES THE PLAYER ───────────────────────

        ⚠️ **It used to be *waits long enough to see both of its faces and choose*, held against
        `CYCLE_UNITS`.** That was the right question when a pickup was two things
        (`docs/decisions/0052-…`) and the complaint was *"nine times out of ten the player is picking
        up a life or placing themselves in danger to get a shield"*. 0082 removed the cycle, so the
        constant it was held against is gone and the reason with it.

        ⚠️ **What replaced it is a stronger claim, not a weaker one, and it is in the player's own
        units** — `docs/decisions/0027-measure-the-picture-not-the-model.md`. A level now offers six
        pickups (0082), so each one is something the player commits to a crossing for: the wait has to
        cover **flying the full width of the lane and back**, from wherever they happened to be. At
        `SHIP_SPEED` that is `2 × ACROSS_SPAN / SHIP_SPEED` steps, and nothing here restates either
        number.

        ⚠️ **Doubled deliberately.** One crossing would be a pickup reachable only by a player who
        starts moving the instant it appears and never has to dodge anything on the way. The whole
        point of the wait is that going for one is a decision made under fire.
      */
      const { offsets } = trackOffset(1400);
      let held = 0;
      for (let i = 1; i < offsets.length; i++) if (waiting(offsets, i)) held++;
      const crossingSteps = (2 * ACROSS_SPAN) / SHIP_SPEED;
      expect(
        held / crossingSteps,
        `the wait is ${(held / crossingSteps).toFixed(2)} of a there-and-back crossing, so a player ` +
          'who is not already beside it cannot reach it',
      ).toBeGreaterThan(1);
    });

    it('waits somewhere the ship can actually fly to, on the narrowest device there is', () => {
      /*
        ⚠️ **Both bounds, in world units against the two boxes that decide them.** A station beyond
        `PLAYER_ALONG_SPAN − PLAYER_MARGIN` is a pickup the player cannot reach; one beyond the
        narrowest view is a pickup that waits off the edge of a 3:2 laptop. Measured from the picture
        rather than from the constant — `docs/decisions/0027-measure-the-picture-not-the-model.md`.
      */
      const { offsets } = trackOffset(1400);
      /*
        ⚠️ **The FURTHEST OUT it ever waits, rather than the last place it stopped.** A pickup bobs
        while it waits (0077) and, since
        `docs/decisions/0087-a-pickup-never-parks.md`, spends the whole wait closing — so *where it
        waits* is a stretch and not a point, and the end of the stretch that matters is the far one,
        because that is where it starts and the one the ship might not reach.
      */
      let station = 0;
      let waited = false;
      for (let i = 1; i < offsets.length; i++) {
        if (!waiting(offsets, i)) continue;
        waited = true;
        station = Math.max(station, offsets[i]!);
      }
      expect(waited, 'the pickup never held station at all').toBe(true);
      expect(station, 'it waits further out than the ship can fly').toBeLessThan(PLAYER_ALONG_SPAN - PLAYER_MARGIN);
      expect(station, 'it waits off the edge of the narrowest screen there is').toBeLessThan(ACROSS_SPAN * MIN_ASPECT);
    });

    it('and then leaves, so the field does not fill up with things nobody took', () => {
      /*
        ⚠️ **The half that stops the wait becoming a park.** The pool is eight slots
        (`src/app/mount.ts`), and a pickup that held station forever would take one of them for the
        rest of the level — so the fourth pickup of a level would silently never appear.

        ── AND IT WAS ABOUT TO START PASSING FOR THE OTHER REASON ───────────────────────────────────

        ⚠️ **THE SHIP IS TAKEN OFF THE FIELD, and without that this guard measures COLLECTION** —
        `docs/decisions/0087-a-pickup-never-parks.md`. A pickup now spends its wait closing and ends
        it at `SHIP_START_ALONG`, which is where the fixture's ship sits, on the lane the fixture puts
        them both on. *The pool went back to zero* is then satisfied by the ship eating the pickup,
        and a probe that parks one forever still ends with an empty pool.

        ⚠️ **`npm run prove` said so**: 0064's re-aimed break — both arms of the drift given the
        camera's own rate, so an authored pickup holds station once its wait ends — came back STILL
        GREEN against this test. Releasing the ship leaves exactly one way for the pool to empty,
        which is the one the test is named for.
      */
      const { world } = onePickup('weapon');
      // Index 0, because `CAPACITY.ship` is 1 — the same line `wreckShip` uses to take it away.
      world.shipPool.releaseAt(0);
      const frame = new GameFrame(world);
      for (let i = 0; i < 2400; i++) frame.step();
      expect(world.pickups.size, 'the pickup waited for ever and kept its pool slot').toBe(0);
    });

    it('bounces across the lane while it waits, rather than sitting on one line', () => {
      // *"They need to bounce and move around the screen."* Measured as how much of the lane it
      // covered, which is the thing the player sees.
      const { world } = onePickup('weapon');
      const frame = new GameFrame(world);
      let lowest = Number.POSITIVE_INFINITY;
      let highest = Number.NEGATIVE_INFINITY;
      /*
        ⚠️ **The loop condition is the step count and NOT the pool**, which is the mistake
        `tests/spawns.test.ts` records making twice: the pickup has not spawned on step zero, so a
        `while (pickups.size > 0)` runs no steps at all and every assertion after it passes for
        entirely the wrong reason.
      */
      let seen = false;
      for (let i = 0; i < 1400; i++) {
        frame.step();
        if (world.pickups.size === 0) {
          if (seen) break;
          continue;
        }
        seen = true;
        const across = world.pickups.at(0).across;
        if (across < lowest) lowest = across;
        if (across > highest) highest = across;
      }
      const covered = highest - lowest;
      expect(covered, `the pickup covered ${covered.toFixed(0)} units of the lane`).toBeGreaterThan(ACROSS_SPAN / 4);
    });
  });

  it('is collectable while the ship is invulnerable', () => {
    /*
      ⚠️ **The case `collideIntoOne` would have got wrong.** It skips a target that is invulnerable —
      correct for damage, and exactly backwards here: the moments after a hit are when a player is
      most likely to be flying through things, and a pickup that silently passed through them would
      read as the collection being broken.
    */
    const { world, taken } = onePickup('weapon');
    // Held permanently invulnerable, which is the state under test rather than an incidental one.
    flyInto(world, 600, () => {
      world.ship.invulnFor = 60;
    });
    expect(taken.length, 'a pickup passed through an invulnerable ship').toBe(1);
  });
});

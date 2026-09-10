/**
 * The serpent strikes — `docs/decisions/0248-the-serpent-strikes.md`.
 *
 * The Approach's real boss, from the brief: *"Jormungandr … with acid blast attacks, void blast
 * attacks and then a space lightning bolt attack that rains down from the top of the screen, it'll
 * need warning lines."* Three phases, three weapons: what is held here is that a phase can change
 * what a boss throws, that the two new shots are their own things, and that the lightning warns
 * before it lands. What a boss IS — the roster, the fights — is `tests/bosses.test.ts`'s and
 * `tests/level.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES, RAIN_BOLT_KIND } from '../src/content/bosses.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS, SHOT_INDEX } from '../src/content/shots.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { BOLT_STEPS } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { ACROSS_SPAN, cullPlayerShotAlong } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The serpent alone, a short way in, with no mid-boss in front of it. */
const SERPENT_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'jormungandr',
  theme: 'approach',
};

/** A serpent on station at `fraction` of its health, its fan silenced until the test says, and an immortal ship. */
function serpentAt(fraction: number): {
  world: ReturnType<typeof playableWorld>['world'];
  frame: GameFrame;
  stick: ReturnType<typeof playableWorld>['stick'];
} {
  const { world, stick } = playableWorld(SERPENT_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the serpent never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  return { world, frame, stick };
}

/**
 * Turn the serpent's round to the lightning — 0261. At the last third its heads take turns, and the
 * rain is the third; `headAt` is the round's count, read off the row rather than typed.
 *
 * ⚠️ **IT WAS `firePhase` AND THAT IS THE BUG THIS BRANCH FOUND.** The serpent rakes in its opening
 * phase, and a rake advances `firePhase` by an ANGLE — so the count the heads indexed by was 5.4 by
 * the time the fight reached its second phase, and `heads[1.4]` is `undefined`. `src/sim/entity.ts`
 * carries the argument for the second field.
 */
function armRain(boss: { headAt: number }): void {
  const last = BOSSES.jormungandr.phases[BOSSES.jormungandr.phases.length - 1]!.attack;
  const heads = last !== null && last.kind === 'heads' ? last.heads : [];
  const index = heads.findIndex((h) => h.attack.kind === 'rain');
  expect(index, 'the serpent’s last third has no lightning head').toBeGreaterThanOrEqual(0);
  boss.headAt = index;
}

/**
 * Put one void blast in front of the ship, feed it the way `put` says, and report what it swallowed.
 *
 * ⚠️ **THREE ARRIVALS, THREE SHAPES, ONE QUESTION** — 0292. A missile is spent like a bullet; a
 * bomb's blast is an AREA that is not consumed by what it touches; and the arc is hitscan, so there
 * is nothing to place at all and the only way to feed it is to fire the gun. What is the same for all
 * three is the answer: the blast's health came down, or it came down to nothing and burst.
 *
 * ⚠️ **A BURST COUNTS AS A FULL MEAL, WHICH IS WHY THE POOL SIZE IS READ.** Once it comes apart the
 * thing being measured is gone and seven shards are in its place, so *is it still the one shot* is
 * how the two outcomes are told apart — and either is the feature working.
 */
function fedBy(put: (world: ReturnType<typeof playableWorld>['world'], at: { along: number; across: number }) => void): number {
  const { world, frame } = serpentAt(0.5);
  world.bossPool.at(0).fireIn = 999;
  const blast = world.enemyShots.spawn()!;
  reset(blast, world.ship.along + 14, world.ship.across, SHOTS.void, SHOT_INDEX.void);
  const before = blast.health;
  /*
    ⚠️ **THE SHIP'S OWN ARSENAL IS SILENCED, AND FORGETTING THE MISSILES MADE THIS VACUOUS.** `fireIn`
    was held off and `missileIn` was not, so the ship threw a seeker of its own every couple of
    seconds and fed the blast in every one of these tests — all three passed with the feature removed,
    and `npm run prove` said so: **STILL GREEN, three times.** That is 0019's whole purpose, and it
    caught three guards that measured the fixture rather than the game.

    ⚠️ **AND BOTH POOLS ARE EMPTIED EVERY STEP**, so the only thing that can reach the blast is the one
    `put` places on it. Belt and braces over the two cadences, because the next weapon added to this
    ship is a third one nobody will remember here either.
  */
  for (let i = 0; i < 6 && world.enemyShots.size === 1 && world.enemyShots.at(0).health === before; i++) {
    world.bossPool.at(0).fireIn = 999;
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    world.playerShots.clear();
    world.missiles.clear();
    /*
      ⚠️ **AND THE BLASTS, WHICH IS A POOL OF FOUR.** Left uncleared, a bomb placed every step
      exhausts it on the fifth and `spawn()` hands back `null` — which reddened the bomb's own probe
      with a TypeError out of the FIXTURE rather than a failure of the claim. A probe that goes red
      for the wrong reason is a guard nobody has proven.
    */
    world.blasts.clear();
    world.enemies.clear();
    world.ship.health = world.shipRow.health;
    put(world, world.enemyShots.at(0));
    frame.step();
  }
  return world.enemyShots.size === 1 ? before - world.enemyShots.at(0).health : before;
}

/** A surface that keeps every bolt stroke's hostility, so the picture can be asked whose lightning it drew. */
class Recorder implements Surface {
  readonly strokes: { count: number; alpha: number; hostile: boolean }[] = [];
  clear(): void {}
  blit(): void {}
  bolt(_points: Float32Array, count: number, _width: number, alpha: number, hostile: boolean): void {
    this.strokes.push({ count, alpha, hostile });
  }
}

describe('0248 — the serpent strikes', () => {
  it('THE THREE WEAPONS: a raking fan of acid while whole, acid and void in turn once hurt, acid, void and lightning in turn at the last third', () => {
    /*
      ⚠️ **0261 — `docs/decisions/0261-the-serpent-throws-together.md`.** 0248 gave the serpent one
      weapon a phase and the alpha play called that *"three separate fire fields"*; the phases are
      cumulative now, the hydra's heads taking turns, and the acid is a fan that rakes rather than a
      wall. The lightning is the same lightning.

      ⚠️ **AND THE ACID'S FAN IS A WAVE SINCE 0290**, which changes what this names and not what it
      claims. *"The acid attacks should fire out in a serpentine spray, as opposed [to] like the 3
      blobs now"* — so the kind is `serpentine` rather than `rake`, and what 0261 was holding is
      still held: it is a fan that TURNS, and it is not a wall.

      ⚠️ **THE TURN IS ASKED FOR RATHER THAN THE NAME**, because that is the property the guard below
      depends on: this boss's opening phase turns and its later phases index heads by a count, and the
      crash that came of sharing one field between the two is held two tests down by asserting the
      opening phase actually raked. An acid attack that stopped turning would leave that guard green
      and measuring nothing, so it is named here as the thing it is.
    */
    const row = BOSSES.jormungandr;
    const whole = phaseFor(row, row.health);
    const hurt = phaseFor(row, row.health * 0.6);
    const last = phaseFor(row, row.health * 0.3);
    expect(whole.shot ?? row.shot, 'the serpent does not open with acid').toBe('acid');
    const fan = whole.attack ?? row.attack;
    expect(fan.kind, 'the acid is not a spray that rakes — the wall is back').toBe('serpentine');
    expect(
      'turn' in fan ? fan.turn : 0,
      'the serpent’s opening acid does not turn, so the rake it is measured by two tests down is gone',
    ).toBeGreaterThan(0);
    const hurtHeads = (hurt.attack ?? row.attack).kind === 'heads' ? (hurt.attack as { heads: readonly { shot: string; attack: { kind: string } }[] }).heads : [];
    expect(hurtHeads.map((h) => `${h.shot}/${h.attack.kind}`), 'once hurt the serpent does not throw acid and void in turn').toEqual(['acid/serpentine', 'void/spray']);
    const lastHeads = (last.attack ?? row.attack).kind === 'heads' ? (last.attack as { heads: readonly { shot: string; attack: { kind: string } }[] }).heads : [];
    expect(lastHeads.map((h) => h.attack.kind), 'the last third does not throw acid, void and the lightning in turn').toEqual(['serpentine', 'spray', 'rain']);
    expect(lastHeads.map((h) => h.shot).slice(0, 2)).toEqual(['acid', 'void']);
    // And it is the Approach's real boss.
    expect(LEVELS.approach.boss).toBe('jormungandr');
    /*
      ⚠️ **AND DRIVEN, because the table is not the fight.** At the last third, three volleys in a
      row: acid in the air, then void, then lightning in the bolt pool and nothing in the air — the
      round the heads take, in the frame.
    */
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    const seen: string[] = [];
    for (let volley = 0; volley < 3; volley++) {
      world.enemyShots.clear();
      world.bolts.clear();
      boss.fireIn = 1;
      frame.step();
      const bolts = world.bolts.size > 0;
      const sprite = world.enemyShots.size > 0 ? world.enemyShots.at(0).sprite : -1;
      seen.push(bolts ? 'lightning' : sprite === SHOTS.acid.sprite ? 'acid' : sprite === SHOTS.void.sprite ? 'void' : 'nothing');
    }
    expect(seen, 'three volleys at the last third are not acid, void and lightning in turn').toEqual(['acid', 'void', 'lightning']);
    // And whole, the fan of acid turns a little each volley: two volleys, two centres.
    const opening = serpentAt(1);
    const centres: number[] = [];
    for (let volley = 0; volley < 2; volley++) {
      opening.world.enemyShots.clear();
      opening.world.bossPool.at(0).fireIn = 1;
      opening.frame.step();
      let sum = 0;
      for (let i = 0; i < opening.world.enemyShots.size; i++) {
        const s = opening.world.enemyShots.at(i);
        expect(s.sprite, 'the opening fan is not acid').toBe(SHOTS.acid.sprite);
        sum += Math.atan2(s.velAcross, s.velAlong - opening.world.scrollPerStep);
      }
      centres.push(sum / opening.world.enemyShots.size);
    }
    expect(Math.abs(centres[1]! - centres[0]!), 'the acid fan does not rake — two volleys point the same way').toBeGreaterThan(0.1);
  });

  it('0290 — THE REPORTED ONE: the acid leaves as a WAVE, and there are more than three of it', () => {
    /*
      ⚠️ **REPORTED**: *"the acid attacks should fire out in a serpentine spray, as opposed [to] like
      the 3 blobs now."* Two halves, and both are measured: how MANY, and what SHAPE.

      ⚠️ **THE SHAPE IS THE HALF A COUNT WOULD MISS.** Nine shots in a plain fan is three blobs with
      more blobs — the report is about the picture, not the density. So what is asked is that the
      beads' headings turn back on themselves: a fan's angles march one way from first to last, and a
      wave's reverse. Counting the reversals is counting the humps.
    */
    const { world, frame } = serpentAt(1);
    const boss = world.bossPool.at(0);
    world.enemyShots.clear();
    boss.fireIn = 1;
    frame.step();
    const fired = world.enemyShots.size;
    expect(fired, 'the serpent threw no acid at all, so this measures nothing').toBeGreaterThan(0);

    const whole = phaseFor(BOSSES.jormungandr, BOSSES.jormungandr.health);
    const shots = whole.shots;
    expect(
      fired,
      `the serpent threw ${fired} beads of acid where its phase asks for ${shots} — a wave cannot be drawn ` +
        'with three points, which is the whole of the report',
    ).toBeGreaterThan(shots * 2);

    /*
      ⚠️ **MEASURED OFF THE VELOCITIES, WHICH IS WHERE THE WAVE ACTUALLY IS.** The beads all leave the
      mouth on the same step and travel straight afterwards, so at the instant they are thrown they
      are all in the same place and the shape lives entirely in where they are POINTED. One step later
      it is a shape on the screen; here it is the thing that makes it one.
    */
    const headings: number[] = [];
    for (let i = 0; i < world.enemyShots.size; i++) {
      const shot = world.enemyShots.at(i);
      headings.push(Math.atan2(shot.velAcross, shot.velAlong));
    }
    let reversals = 0;
    for (let i = 2; i < headings.length; i++) {
      const before = headings[i - 1]! - headings[i - 2]!;
      const after = headings[i]! - headings[i - 1]!;
      if (before * after < 0) reversals++;
    }
    expect(
      reversals,
      `the acid's ${fired} beads sweep one way from first to last with ${reversals} turns in them, so they are a ` +
        'fan rather than a wave — more blobs is not the report',
    ).toBeGreaterThan(0);
  });

  it('THE MOUTH: the acid and the void leave the serpent’s SKULL, and not the middle of its body', () => {
    /*
      ⚠️ **0277.** Reported from play against the deployed preview: *"the acid blasts and voids
      currently originate from the back half of the body."* They did — every arm of `throwAttack`
      spawned at `(boss.along, boss.across)`, and a serpent's skull is at the far down-lane end of the
      widest sprite in the game.

      ⚠️ **AND SINCE 0283 THE SAME CLAIM IS MEASURED AGAINST THE BODY RATHER THAN AGAINST A BOX.**
      0277 asserted how far down-lane of the hull's centre a shot appeared, as a share of the sprite's
      half-extent, because the sprite was the whole animal and its centre was the midriff. The hull IS
      the skull now, so that arithmetic would be asking whether the mouth is in front of the mouth.

      What the report was actually about is *the shot comes out of the face and not out of the
      body* — so what is asserted is exactly that: every shot appears **down-lane of every node of the
      body**, by a clear margin. A serpent that threw from its flank fails it, a serpent that threw
      from its centre before the head became the hull fails it, and no arrangement of the table can
      satisfy it without the shot leaving the head.
    */
    for (const [name, fraction] of [
      ['the opening rake of acid', 1],
      ['the heads, once hurt', 0.6],
    ] as const) {
      const { world, frame } = serpentAt(fraction);
      const boss = world.bossPool.at(0);
      world.enemyShots.clear();
      boss.fireIn = 1;
      frame.step();
      expect(world.enemyShots.size, `${name} threw nothing`).toBeGreaterThan(0);
      expect(world.bossBody.size, `${name} was thrown by a serpent with no body`).toBeGreaterThan(0);
      // The nearest the body comes to the player: everything the shot must be in front of.
      let nearest = Number.POSITIVE_INFINITY;
      for (let i = 0; i < world.bossBody.size; i++) nearest = Math.min(nearest, world.bossBody.at(i).along);
      for (let i = 0; i < world.enemyShots.size; i++) {
        const shot = world.enemyShots.at(i);
        expect(
          nearest - shot.along,
          `${name} left the animal ${(nearest - shot.along).toFixed(1)} units down-lane of the nearest node of its ` +
            'body — a shot from anywhere but the skull reads as the body coughing',
        ).toBeGreaterThan(1);
      }
    }
  });

  it('THE ACID AND THE VOID: two shots of their own, in inks of their own, that are not the enemy’s bullet', () => {
    /*
      0098: a boss with three kinds of shot in one colour is one bullet wearing three shapes. The
      silhouettes being distinct from every other shot's is `tests/legibility.test.ts`'s; what is
      held here is the ink, and that an acid blast is fatter and slower than a void one.

      ⚠️ **AND WHICH ONE IS FATTER IS NO LONGER THE CLAIM — 0291 REVERSED IT ON PURPOSE.** *"The void
      blasts should be bigger and a bit random and should eat x amount of damage."* A bullet the
      player is meant to shoot at has to be a thing worth aiming at, so the void went 1.3 → 2.2 and
      is now the fat one. What 0248 was actually protecting is that the two are TOLD APART — 0098's
      *a boss with three kinds of shot in one colour is one bullet wearing three shapes* — so the
      size claim is a margin rather than a direction, and the ladder that still has a direction
      (slower, worth more) is left pointing where it was.
    */
    const acid = INK_OF[SPRITE_KINDS[SHOTS.acid.sprite]!];
    const voidInk = INK_OF[SPRITE_KINDS[SHOTS.void.sprite]!];
    expect(acid, 'acid wears the enemy’s bullet ink').not.toBe('enemy');
    expect(voidInk, 'void wears the enemy’s bullet ink').not.toBe('enemy');
    expect(acid, 'acid and void are one ink').not.toBe(voidInk);
    expect(voidInk, 'void wears the player’s ally ink, which is the seeker’s').not.toBe('ally');
    const fatter = Math.max(SHOTS.acid.radius, SHOTS.void.radius);
    const thinner = Math.min(SHOTS.acid.radius, SHOTS.void.radius);
    expect(
      fatter / thinner,
      `acid is ${SHOTS.acid.radius} across and void is ${SHOTS.void.radius}, which is too close to tell apart in ` +
        'the air — 0098: three kinds of shot the player cannot separate is one bullet wearing three shapes',
    ).toBeGreaterThan(1.2);
    expect(SHOTS.acid.speed, 'an acid blast is no slower than a void one').toBeLessThan(SHOTS.void.speed);
    expect(SHOTS.void.damage, 'a void blast is worth no more than an acid one').toBeGreaterThan(SHOTS.acid.damage);
  });

  it('0291 — THE REPORTED ONE: a void blast eats the player’s fire, and bursts when it has had enough', () => {
    /*
      ⚠️ **REPORTED**: *"the void blasts should be bigger and a bit random and should eat x amount of
      damage and then explode in a void blast."*

      ⚠️ **DRIVEN, BECAUSE NONE OF THIS EXISTS IN THE TABLE.** The row says `appetite: 6`; whether a
      pulse can reach a hostile bullet at all is a question about `src/app/frame.ts`, and until this
      decision the answer for every bullet in the game was no.
    */
    const { world, frame } = serpentAt(0.5);
    const boss = world.bossPool.at(0);
    const blast = world.enemyShots.spawn()!;
    const kind = SHOT_INDEX.void;
    reset(blast, world.ship.along + 20, world.ship.across, SHOTS.void, kind);
    const appetite = SHOTS.void.health;
    expect(SHOTS.void.swallows, 'the void does not swallow, so this measures nothing').toBe(true);
    expect(appetite, 'the void swallows a single hit, so there is no appetite to measure').toBeGreaterThan(1);

    /*
      Feed it one pulse at a time, on top of it, and watch the tally come down. The boss is silenced
      so nothing else lands in the pool while the count is being read.
    */
    let fedWith = 0;
    const startedAt = world.enemyShots.at(0).radius;
    let grewTo = startedAt;
    for (let i = 0; i < appetite * 2 && world.enemyShots.size === 1; i++) {
      boss.fireIn = 999;
      const pulse = world.playerShots.spawn()!;
      const at = world.enemyShots.at(0);
      reset(pulse, at.along, at.across, SHOTS.pulse, SHOT_INDEX.pulse);
      const before = world.enemyShots.at(0).health;
      frame.step();
      if (world.enemyShots.size >= 1 && world.enemyShots.at(0).health < before) fedWith += before - world.enemyShots.at(0).health;
      if (world.enemyShots.size >= 1 && world.enemyShots.at(0).turnsLeft === 0) grewTo = Math.max(grewTo, world.enemyShots.at(0).radius);
    }
    expect(fedWith, 'the player’s fire went straight through the void blast, which is what it did before 0291').toBeGreaterThan(0);
    /*
      ⚠️ **AND IT GREW WHILE IT ATE, WHICH IS THE ONLY THING THAT SAYS IT IS EATING.** Its hurt sprite
      is its own sprite, so a flash would be four steps of a colour change on a bullet two units
      across — 0036's subject, and its own finding is that an event the picture never mentions gets
      reported as a collision fault that does not exist. Measured on the HURTBOX as well as the
      drawing, because a blast drawn bigger than it collides as is the same bug pointed the other way.
    */
    expect(
      grewTo,
      'the void blast swallowed the player’s fire and did not change size, so nothing on screen said it had',
    ).toBeGreaterThan(startedAt);
    /*
      ⚠️ **AND WHAT IS LEFT IS A RING RATHER THAN NOTHING**, which is the other half of the sentence.
      One blast eaten is several shards in the air, so the pool grows through the burst rather than
      emptying — a void the player shoots is a void the player then has to fly through.
    */
    expect(
      world.enemyShots.size,
      'the void blast was eaten and left nothing behind, so it did not explode in a void blast',
    ).toBeGreaterThan(1);
  });

  it('0299 — THE REPORTED ONE: a SHARD can be killed too, and killing one never makes more', () => {
    /*
      ⚠️ **REPORTED**: *"the smaller voids need to be killable as well."* Until 0299 a shard was
      skipped outright by `feedVoids` and by `nearestVoid` — the player's fire passed through it and
      the lightning would not jump to it.

      ⚠️ **AND THE SKIP HAD A REAL REASON, WHICH IS THE HALF THIS GUARD HOLDS.** A shard carries the
      same row, so the same appetite, and at stage 1 one pulse would have popped each of seven into
      seven more, for ever. What 0299 changed is not *a shard is safe to feed* but that **being spent
      is not the same event as bursting**: `spendVoid` releases a shard and bursts only what a mouth
      threw.

      ⚠️ **SO THERE ARE TWO CLAIMS AND THE SECOND IS THE INVARIANT.** A shard takes damage, AND the
      pool never grows through one. The second is what a later tidy-up of the stage check would
      break, and it would break silently: the game would still play, for about four seconds.
    */
    const { world, frame } = serpentAt(0.5);
    const boss = world.bossPool.at(0);
    const kind = SHOT_INDEX.void;
    const shard = world.enemyShots.spawn()!;
    reset(shard, world.ship.along + 20, world.ship.across, SHOTS.void, kind);
    // What a burst makes: the same row at stage 1. `burstVoid` also softens it, and this asks the
    // frame for that rather than restating the fraction — a number restated is a number that drifts.
    shard.turnsLeft = 1;
    expect(shard.turnsLeft, 'this fixture is not holding a shard, so it measures a thrown blast').toBe(1);

    let fedWith = 0;
    let mostSeen = world.enemyShots.size;
    for (let i = 0; i < SHOTS.void.health * 3 && world.enemyShots.size > 0; i++) {
      boss.fireIn = 999;
      const at = world.enemyShots.at(0);
      const before = at.health;
      const pulse = world.playerShots.spawn()!;
      reset(pulse, at.along, at.across, SHOTS.pulse, SHOT_INDEX.pulse);
      frame.step();
      if (world.enemyShots.size > 0 && world.enemyShots.at(0).health < before) fedWith += before - world.enemyShots.at(0).health;
      mostSeen = Math.max(mostSeen, world.enemyShots.size);
    }

    expect(fedWith, 'the player’s fire went straight through the shard, which is what it did before 0299').toBeGreaterThan(0);
    expect(world.enemyShots.size, 'the shard soaked the whole volley and never died').toBe(0);
    /*
      ⚠️ **AND THE POOL NEVER GREW**, which is the recursion the old skip existed to prevent. One
      shard in, nothing but that shard for its whole life, and an empty pool at the end.
    */
    expect(mostSeen, 'killing a shard spawned more shards, so a ring can be farmed into a full pool').toBe(1);
  });

  it('0292 — THE REPORTED ONE: a MISSILE feeds it too', () => {
    /*
      ⚠️ **REPORTED**: *"let's change it so it eats missiles and bombs and that it sucks in the
      lightning from the player's cannon."* 0291 fed on the guns alone and named the gap rather than
      quietly narrowing the ask; this is the rest of the original brief — *"larger balls that absorb
      the player's weapons/missiles/bomb"* — plus the interaction the player had wondered about.

      ⚠️ **THREE ARRIVALS, THREE SHAPES, AND THE THIRD IS NOT A BODY AT ALL.** A missile is spent like
      a bullet. A bomb's blast is an AREA that is not consumed by what it touches. And the arc is
      hitscan — it resolves on the step it fires and spawns only a picture — so it never passes
      through a pool the collision could pair.
    */
    expect(
      fedBy((world, at) => {
        const missile = world.missiles.spawn()!;
        reset(missile, at.along, at.across, SHOTS.missile, SHOT_INDEX.missile);
      }),
      'a missile flew into a void blast and was not swallowed',
    ).toBeGreaterThan(0);
  });

  it('0292 — and a BOMB feeds it, which is an area rather than a body', () => {
    /*
      ⚠️ **A BLAST IS NOT CONSUMED BY WHAT IT TOUCHES**, which is `blastInto`'s own shape: it is a
      region that hurts everything standing in it, and one that vanished into a single void blast
      would be a bomb the player lost to a bullet. So the void takes a bite and the bomb goes on.

      ⚠️ **AND IT MAY NOT BITE ON EVERY STEP IT OVERLAPS.** A bomb held over a void would empty a
      six-point appetite in three frames, and the swell nobody saw would be the only warning there
      was. `landIn` — 0234's *already landed*, counted down beside the flash — holds it to once a
      flash, the same rate a blade lands on a body.
    */
    expect(
      fedBy((world, at) => {
        const bomb = world.blasts.spawn()!;
        reset(bomb, at.along, at.across, SHOTS.missile, SHOT_INDEX.missile);
        bomb.radius = 12;
        bomb.damage = 2;
      }),
      'a bomb went off inside a void blast and was not swallowed',
    ).toBeGreaterThan(0);
  });

  it('0292 — and the LIGHTNING is sucked in, which is hitscan and never touches a pool', () => {
    /*
      ⚠️ **THE ARC IS FED BY FIRING IT, NOT BY PLACING ANYTHING.** It resolves on the step it fires
      and spawns only a picture, so there is no body to put on top of the blast and no pool for a
      collision to pair — which is why 0291 could say, correctly, that *the lightning gun ignores void
      blasts entirely*. The only way to ask this question is to give the ship the gun and let it
      shoot, with the void in front of the nose and inside the weapon's own reach.
    */
    /*
      ⚠️ **A DRIFTER SITS NEARER THAN THE BLAST, AND THAT IS WHAT MAKES THIS *SUCKS IN*.** Against no
      competition the guard passes on a chain that merely CAN reach a void, and the probe that made
      the void one target among many stayed GREEN twice over: first because nothing else was in
      reach, and then because nearest-wins hits the drifter and JUMPS to the void on its next link,
      so *was it fed* is true either way. **What separates a pull from a coincidence is what the
      chain did NOT hit**, so the drifter's health is half the assertion.
    */
    const { world, frame } = serpentAt(0.5);
    world.bossPool.at(0).fireIn = 999;
    const blast = world.enemyShots.spawn()!;
    reset(blast, world.ship.along + 10, world.ship.across, SHOTS.void, SHOT_INDEX.void);
    const near = world.enemies.spawn()!;
    reset(near, world.ship.along + 6, world.ship.across, ENEMIES.drifter, world.enemyKinds.drifter);
    const whole = near.health;
    world.weapon = weaponFor(world.shipRow, ['weapon', 'weapon', 'weapon'], 'arc');
    world.missileIn = Number.MAX_SAFE_INTEGER;
    world.fireIn = 0;
    frame.step();

    const left = world.enemyShots.size === 1 ? world.enemyShots.at(0).health : 0;
    expect(
      SHOTS.void.health - left,
      'the lightning gun fired into a void blast and went straight past it',
    ).toBeGreaterThan(0);
    expect(
      world.enemies.size > 0 ? world.enemies.at(0).health : 0,
      'the chain struck the nearer drifter on its way, so the void is one target among many rather than a pull',
    ).toBe(whole);
  });

  it('and nothing else the serpent throws can be shot out of the air', () => {
    /*
      ⚠️ **THE HALF THAT KEEPS THIS ONE BULLET SPECIAL.** An appetite is not a tuning number, it is the
      switch that puts a hostile shot in front of the guns — and a game where every bullet can be shot
      down is a different game from the one in `docs/game.md`. The acid is the same boss's other shot
      and is thrown three times as often, so it is the one that would be noticed.
    */
    const { world, frame } = serpentAt(1);
    world.bossPool.at(0).fireIn = 999;
    const blast = world.enemyShots.spawn()!;
    reset(blast, world.ship.along + 20, world.ship.across, SHOTS.acid, SHOT_INDEX.acid);
    const health = blast.health;
    for (let i = 0; i < 8; i++) {
      world.bossPool.at(0).fireIn = 999;
      const at = world.enemyShots.at(0);
      const pulse = world.playerShots.spawn()!;
      reset(pulse, at.along, at.across, SHOTS.pulse, SHOT_INDEX.pulse);
      frame.step();
      if (world.enemyShots.size === 0) break;
    }
    expect(world.enemyShots.size, 'the acid was shot out of the air, and only the void may be').toBe(1);
    expect(world.enemyShots.at(0).health, 'the acid took damage from the player’s guns').toBe(health);
  });

  it('and a boss that rakes AND grows heads keeps the two counts apart, so the round survives the raking', () => {
    /*
      ⚠️ **THE CRASH THIS BRANCH SHIPPED WITH, HELD SO IT CANNOT COME BACK.** The serpent's opening
      phase rakes — the row's own attack — and its other two grow heads. A rake advances its count by
      an ANGLE, `turn` of a radian a volley; the heads index by it. On one shared field the count was
      about 5.4 by the second phase and `heads[5.4 % 2]` is `heads[1.4]`, which is `undefined` — a
      TypeError out of `throwAttack`, every serpent fight, at its first phase change.

      ⚠️ **NOTHING IN THE SUITE SAW IT.** 0261 was proven green: every guard about the serpent set the
      phase it wanted and measured that phase. What found it was
      `docs/decisions/0268-the-bob-keeps-its-centre.md`'s guard, which flies every BOBBING boss
      through all of its phases in order and was written about a hull leaving the lane — an accident,
      and one this assertion exists so as not to depend on twice.

      Driven rather than reasoned: rake the opening phase for real, then drop the health and take a
      volley from every head of the round.
    */
    const { world, frame } = serpentAt(1);
    const boss = world.bossPool.at(0);
    /*
      Long enough for the opening rake to throw several volleys and turn its angle well past the
      number of heads the later phases have. The health is held at full so the phase does not move,
      and the ship holds its fire so the subject survives being measured.
    */
    boss.fireIn = 0;
    for (let i = 0; i < 60 * 12; i++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      boss.health = world.bossFullHealth;
      frame.step();
    }
    expect(boss.firePhase, 'the opening phase never raked, so this measures nothing').toBeGreaterThan(1);
    expect(boss.headAt, 'a rake advanced the heads’ own count').toBe(0);

    const last = BOSSES.jormungandr.phases[BOSSES.jormungandr.phases.length - 1]!.attack;
    const heads = last !== null && last.kind === 'heads' ? last.heads : [];
    expect(heads.length, 'the serpent’s last third has no heads').toBeGreaterThan(1);
    const thrown = new Set<number>();
    for (let volley = 0; volley < heads.length * 3; volley++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      boss.health = world.bossFullHealth * 0.2;
      boss.fireIn = 0;
      const at = boss.headAt % heads.length;
      const before = world.enemyShots.size;
      // One step to fire; the round must land on a real head every time rather than on `undefined`.
      frame.step();
      if (world.enemyShots.size > before || world.bolts.size > 0) thrown.add(at);
    }
    expect(thrown.size, 'the round did not reach every head, so a rake is still steering it').toBe(heads.length);
  });

  it('THE RAIN: a volley draws its warning lines first, inside the box the ship flies in, and nothing hurts until they have run', () => {
    /*
      *"it'll need warning lines."* Driven: the serpent at its last third throws one volley; every
      column is a bolt in the arc's pool carrying `RAIN_BOLT_KIND`, its along inside the player's
      box, its life the warning plus the strike. The ship is parked in the first column and is not
      hurt for as long as the row's warning says — in seconds, at least half a one — and IS hurt on
      the step the line becomes lightning.
    */
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    armRain(boss);
    boss.fireIn = 1;
    world.ship.health = world.shipRow.health;
    frame.step();
    const columns: number[] = [];
    for (let i = 0; i < world.bolts.size; i++) {
      const b = world.bolts.at(i);
      if (b.kind === RAIN_BOLT_KIND) columns.push(b.along);
    }
    expect(columns.length, 'the volley threw no lightning').toBeGreaterThanOrEqual(2);
    for (const along of columns) {
      const inView = along - world.cameraAlong;
      expect(inView, `a column fell ${inView.toFixed(1)} into the view, behind the ship’s box`).toBeGreaterThanOrEqual(PLAYER_ALONG_MARGIN - 1);
      expect(inView, `a column fell ${inView.toFixed(1)} into the view, past the ship’s box`).toBeLessThanOrEqual(PLAYER_LEAD + 1);
    }
    // Park the ship in the first column and hold it there: every step, no other fire.
    const column = world.bolts.at(0);
    const before = world.ship.health;
    let hurtAt = -1;
    boss.fireIn = 999;
    for (let step = 1; step <= 200 && hurtAt < 0; step++) {
      world.ship.along = column.along;
      world.ship.velAlong = world.scrollPerStep;
      // Not still lit from an acid blast in the approach: the strike is the only thing that may hurt.
      world.ship.invulnFor = 0;
      world.enemyShots.clear();
      boss.fireIn = 999;
      frame.step();
      if (world.ship.health < before) hurtAt = step;
    }
    expect(hurtAt, 'the lightning never landed on a ship parked under it').toBeGreaterThan(0);
    expect(hurtAt / STEPS_PER_SECOND, `the strike landed ${(hurtAt / STEPS_PER_SECOND).toFixed(2)} s after its line was drawn`).toBeGreaterThanOrEqual(0.5);
    expect(hurtAt / STEPS_PER_SECOND, 'the warning outlasts the patience anyone has for one').toBeLessThan(2);
  });

  it('and a ship elsewhere on the lane is not touched by it, however close across', () => {
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    armRain(boss);
    boss.fireIn = 1;
    world.ship.health = world.shipRow.health;
    frame.step();
    expect(world.bolts.at(0).kind).toBe(RAIN_BOLT_KIND);
    // Somewhere in the ship's box that is clear of EVERY column by a column's width and a hull —
    // a volley is three, and a spot beside the first is under the second often enough.
    const clear = (offset: number): boolean => {
      for (let i = 0; i < world.bolts.size; i++) {
        const b = world.bolts.at(i);
        if (Math.abs(world.cameraAlong + offset - b.along) <= b.radius + world.ship.radius + 3) return false;
      }
      return true;
    };
    let offset = -1;
    for (let o = PLAYER_ALONG_MARGIN; o <= PLAYER_LEAD && offset < 0; o += 1) if (clear(o)) offset = o;
    expect(offset, 'the volley left nowhere in the box clear of a column, which is a wall and not a rain').toBeGreaterThan(0);
    const before = world.ship.health;
    let struck = false;
    for (let step = 1; step <= 200; step++) {
      // Held at that spot in the camera's frame — the columns ride the camera too.
      world.ship.along = world.cameraAlong + offset;
      world.ship.velAlong = world.scrollPerStep;
      world.ship.across = ACROSS_SPAN / 2;
      world.ship.invulnFor = 0;
      world.enemyShots.clear();
      boss.fireIn = 999;
      frame.step();
      // Watched every step: a ship of one health that is struck dies and is put back whole by the
      // end of the beat, so the health at the end of the loop says nothing.
      if (world.ship.health < before || world.dyingIn > 0) struck = true;
    }
    expect(struck, 'a ship beside the column was struck').toBe(false);
  });

  it('THE PICTURE: the warning is drawn dim and the strike bright, both in the enemy’s hand', () => {
    /*
      0036: the model resolves a strike, and the picture must mention both halves of it — the line,
      then the bolt. The surface is asked whose ink it stroked in and how loud.
    */
    const { world, frame } = serpentAt(0.3);
    const recorder = new Recorder();
    world.surface = recorder;
    armRain(world.bossPool.at(0));
    world.bossPool.at(0).fireIn = 1;
    frame.step();
    frame.draw(0);
    const warnings = recorder.strokes.filter((s) => s.hostile);
    expect(warnings.length, 'no hostile line was drawn on the step the volley was thrown').toBeGreaterThan(0);
    const dim = Math.max(...warnings.map((s) => s.alpha));
    expect(dim, 'the warning line is drawn as loud as a strike').toBeLessThan(0.7);
    // Let the warning run out, then look again.
    for (let i = 0; i < 60 && !world.bolts.size; i++) frame.step();
    const column = world.bolts.at(0);
    while (column.lifeFor > BOLT_STEPS) {
      world.bossPool.at(0).fireIn = 999;
      frame.step();
    }
    recorder.strokes.length = 0;
    frame.draw(0);
    const strikes = recorder.strokes.filter((s) => s.hostile);
    expect(strikes.length, 'the strike was not drawn').toBeGreaterThan(warnings.length);
    expect(Math.max(...strikes.map((s) => s.alpha)), 'the strike is no brighter than its warning').toBeGreaterThan(dim);
    expect(recorder.strokes.some((s) => !s.hostile), 'the serpent’s lightning was drawn in the player’s hand').toBe(false);
  });
});

/**
 * Where the animal's body is held — `docs/decisions/0283-the-serpent-is-a-chain.md`.
 *
 * ⚠️ **EVERY ASSERTION HERE IS DRIVEN AND IN WORLD UNITS**, which is the whole reason they moved out
 * of `tests/accents.test.ts`. That file measures a baked bitmap, and until 0283 the serpent WAS one —
 * so *no bend tighter than the animal's own spine allows* was checked against a path in a drawing
 * rather than against the creature on the screen. The body is laid out every step now, so the shape
 * the player watches is a thing a fixture can ask about.
 */
describe('0283 — the serpent is a chain', () => {
  /** The laid-out spine this step: every node's place, head-end first, in world units. */
  function spine(world: ReturnType<typeof playableWorld>['world']): { along: number; across: number; girth: number }[] {
    const out: { along: number; across: number; girth: number }[] = [];
    const head = world.bossPool.at(0);
    out.push({ along: head.along, across: head.across, girth: head.radius * 2 });
    // The pool is spawned tail-first so the neck draws over the tail, so read it backwards.
    for (let i = world.bossBody.size - 1; i >= 0; i--) {
      const node = world.bossBody.at(i);
      out.push({ along: node.along, across: node.across, girth: node.radius * 2 });
    }
    return out;
  }

  it('THE REPORTED ONE: the body moves, and it moves differently from the head', () => {
    /*
      ⚠️ **REPORTED TWICE, THREE PRs APART**: *"it needs to actually move/undulate, it's a static
      image that bounces up and down"*, and *"there's no movement to the sprite itself, it's a flat
      static image that isn't alive."*

      ⚠️ **THE SECOND HALF IS THE ASSERTION.** A body that only slid about with the head would satisfy
      *the body moves* and would be exactly what was reported: a rigid picture being carried around.
      What is measured is the SHAPE — each node's offset across the lane from the head — and that the
      shape itself changes. A baked bitmap cannot pass this at any amount of art.
    */
    const { world, frame } = serpentAt(1);
    const shapes: number[][] = [];
    for (let i = 0; i < 240; i++) {
      world.bossPool.at(0).fireIn = 999;
      frame.step();
      if (i % 20 === 0 && world.bossBody.size > 0) {
        const s = spine(world);
        shapes.push(s.map((n) => n.across - s[0]!.across));
      }
    }
    expect(shapes.length, 'the serpent never laid a body').toBeGreaterThan(6);
    let widest = 0;
    for (const shape of shapes) {
      for (let k = 0; k < shape.length; k++) {
        for (const other of shapes) widest = Math.max(widest, Math.abs(shape[k]! - other[k]!));
      }
    }
    expect(
      widest,
      `the body held the same shape relative to its head for four seconds — the widest any node moved ` +
        `against the head was ${widest.toFixed(2)} units, which is a picture being carried rather than an animal`,
    ).toBeGreaterThan(4);
  });

  it('and no bend is tighter than the animal’s own spine allows, on the body that is actually on the screen', () => {
    /*
      ── NO BEND TIGHTER THAN THE ANIMAL'S OWN SPINE ALLOWS — 0277, MEASURED ON THE CHAIN — 0283 ──

      ⚠️ **A WORM HAS NO SPINE AND CAN KINK; A VERTEBRATE CANNOT.** Reported of the serpent: *"the
      tail uplift is really really sharp and a snake/serpent would be more curved because of the
      spine, where a worm with no spine can sharp twist."*

      ⚠️ **AND THAT WAS A NOTE ABOUT THE BODY'S SHAPE RATHER THAN ABOUT ITS DESIGN**, said again when
      this was picked back up: *"previous instructions about sharp angles were only related to body
      shape not aesthetic design."* So it holds here, on the anatomy, and it says nothing whatever
      about how sharp the creature is allowed to LOOK.

      ⚠️ **A RATIO AND NOT AN ABSOLUTE, BECAUSE FLEXIBILITY SCALES WITH THICKNESS.** A whip-thin tail
      has more vertebrae per unit length than a thick midriff and really does bend tighter. An
      absolute floor would either forbid a tail tip from curling at all or wave a hairpin through the
      midriff — the two failures this sits between.

      ⚠️ **DRIVEN OVER A WHOLE WAVE, because the shape is different every step now.** A body checked
      at one moment is a body checked in one pose, and the tightest bend an undulating animal ever
      reaches is the thing the rule is about.
    */
    const { world, frame } = serpentAt(1);
    let tightest = Infinity;
    let at = -1;
    for (let i = 0; i < 300; i++) {
      world.bossPool.at(0).fireIn = 999;
      frame.step();
      if (world.bossBody.size === 0) continue;
      const s = spine(world);
      for (let k = 1; k < s.length - 1; k++) {
        const a = s[k - 1]!;
        const b = s[k]!;
        const c = s[k + 1]!;
        let turn = Math.atan2(c.across - b.across, c.along - b.along) - Math.atan2(b.across - a.across, b.along - a.along);
        while (turn > Math.PI) turn -= Math.PI * 2;
        while (turn < -Math.PI) turn += Math.PI * 2;
        if (turn === 0) continue;
        const arc = (Math.hypot(b.along - a.along, b.across - a.across) + Math.hypot(c.along - b.along, c.across - b.across)) / 2;
        const overGirth = arc / Math.abs(turn) / b.girth;
        if (overGirth < tightest) {
          tightest = overGirth;
          at = k;
        }
      }
    }
    expect(
      tightest,
      `the serpent kinks at node ${at}: its bend radius there is ${tightest.toFixed(2)} of its own girth, and a ` +
        'body that turns inside its own width has no spine in it',
    ).toBeGreaterThan(1.5);
  });

  it('0285 — THE REPORTED ONE: the head snaps at a ship that crosses it, and a ship that holds its lane is only watched', () => {
    /*
      ⚠️ **REPORTED**: *"it also needs to be aggressively moving its mouth to watch the player's ship
      moving — the body is animated now which is good, but it still feels like a non-interactive wall
      object rather than a living space serpent trying to battle the player."*

      ⚠️ **THE SECOND HALF IS THE ASSERTION, AND IT IS 0282's TEST.** *The mouth moves* is satisfied
      by a jaw worked on a timer, which is the same animation for every player and every run — a
      mechanism whose output cannot differ per instance is a constant wearing a mechanism's clothes.
      What is measured is that two DIFFERENT pilots get two different animals out of the same fight:
      one who cuts across the head is bitten at, and one who holds a lane never sees the snap at all.
      A boss on a clock cannot pass this at any amount of art.
    */
    const face = BOSSES.jormungandr.face;
    if (face === null) throw new Error('the serpent has no faces');

    /**
     * Fly a pilot for four seconds beside the serpent, and report every face the head wore.
     *
     * ⚠️ **THE FIRST SECOND AND A HALF IS FLOWN AND NOT RECORDED.** A pilot has to reach the lane it
     * intends to hold, and the trip there is itself a crossing — so a run recorded from the first
     * step reports a snap for every pilot, including the one whose whole point is not to cause one.
     */
    const flown = (fly: (step: number, world: ReturnType<typeof playableWorld>['world']) => number): Set<number> => {
      const { world, frame, stick } = serpentAt(1);
      const worn = new Set<number>();
      for (let i = -90; i < 240; i++) {
        // The volley tell outranks the snap, so it is silenced: what is under test is the other one.
        world.bossPool.at(0).fireIn = 999;
        world.ship.health = world.shipRow.health;
        stick.across = fly(i, world);
        frame.step();
        if (i >= 0) worn.add(world.bossPool.at(0).spriteBase);
      }
      return worn;
    };

    /*
      ⚠️ **THE CROSSING PILOT FLIES FULL STICK AND REVERSES**, which is what a player dodging a boss
      does and is the only way to be sure the ship actually passes the head rather than drifting near
      it. The head holds its own pattern across the lane while this happens, so the crossings are the
      two of them meeting rather than a number this test picked.
    */
    const crossing = flown((step) => (Math.floor((step + 90) / 40) % 2 === 0 ? 1 : -1));
    expect(
      crossing.has(face.shut),
      'a ship flown back and forth across the serpent’s head for four seconds was never snapped at — the mouth is ' +
        'not answering the player',
    ).toBe(true);

    /*
      ⚠️ **AND THE HOLDING PILOT SITS WHERE THE HEAD IS NOT**, so the ship never crosses it. This is
      the half that fails if the jaw is on a timer, and it is the half the report was about.
    */
    const holding = flown((_step, world) => {
      const gaze = world.ship.across - world.bossPool.at(0).across;
      return gaze > ACROSS_SPAN * 0.3 ? -1 : gaze < ACROSS_SPAN * 0.25 ? 1 : 0;
    });
    expect(
      holding.has(face.shut),
      'a ship that held its lane a third of the span away was snapped at anyway, so the jaw is on a clock and every ' +
        'player watches the same animal',
    ).toBe(false);
    /*
      ⚠️ **AND IT IS STILL WATCHED, WHICH IS WHY THIS IS NOT SIMPLY *NOTHING HAPPENED*.** A head that
      wore one face for the whole four seconds would pass the line above and be exactly the wall the
      report named.
    */
    expect(
      holding.has(face.up) || holding.has(face.down),
      'the head never turned its eye on a ship parked off to one side of it, so nothing about it is watching',
    ).toBe(true);
  });

  it('0289 — THE REPORTED ONE: the head rears, so it moves ALONG its lane and not only across it', () => {
    /*
      ⚠️ **REPORTED**: *"can we give it more motion, like have it rear back a bit rather than just have
      the head go up and down?"*

      ⚠️ **MEASURED AGAINST THE CAMERA AND NOT IN WORLD `along`, WHICH IS THE WHOLE TRICK.** Every boss
      holds station, and a station is a distance from the camera — so a hull matching the camera's rate
      is standing still on the screen while its world `along` climbs by `SCROLL_PER_STEP` every step. A
      guard reading `boss.along` would report a hundred units of magnificent rearing from a boss that
      never moved a pixel. What the player watches is `along − cameraAlong`.

      ⚠️ **AND THE SWING IS COMPARED TO THE DRIFT IT REPLACES.** *More motion* is a claim about the
      size of it: the serpent already slid five units either way on the camera's own wavelength and
      that is the thing the report calls *just going up and down*. So the floor is the drift, doubled —
      a rear worth having is bigger than the wobble nobody could see.
    */
    const { world, frame } = serpentAt(1);
    let nearest = Number.POSITIVE_INFINITY;
    let furthest = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < 600; i++) {
      world.bossPool.at(0).fireIn = 999;
      world.ship.health = world.shipRow.health;
      frame.step();
      const onScreen = world.bossPool.at(0).along - world.cameraAlong;
      nearest = Math.min(nearest, onScreen);
      furthest = Math.max(furthest, onScreen);
    }
    const swing = furthest - nearest;
    const floor = BOSSES.jormungandr.drift * 4;
    expect(
      swing,
      `the serpent's head swept ${swing.toFixed(1)} units along the lane in ten seconds, against the ${floor} its ` +
        'own drift would give it anyway — so it is going up and down, which is the report',
    ).toBeGreaterThan(floor);
  });

  it('and the lunge is locked to the bob, so it is one arc and not two wobbles', () => {
    /*
      ⚠️ **THE DIFFERENCE BETWEEN *REARING* AND *DRIFTING ABOUT*, AND IT IS THE HALF A SIZE CHECK
      MISSES.** An along swing on its own wavelength covers exactly the same ground as one locked to
      the bob and traces a wandering scribble instead of a stroke. The rear is a function of the bob's
      own angle, so the head is furthest back as it crosses the middle of the lane rising and nearest
      as it crosses falling — one withdrawal and one strike a cycle.

      ⚠️ **SO WHAT IS MEASURED IS WHERE ACROSS THE LANE THE HULL IS WHEN IT IS FURTHEST BACK.** Locked,
      that is the middle of its swing. Unlocked, it is wherever the two wavelengths happen to meet.
    */
    const { world: w2, frame: f2 } = serpentAt(1);
    let atFurthest = 0;
    let seen = Number.NEGATIVE_INFINITY;
    let mid = 0;
    let lanes = 0;
    for (let i = 0; i < 600; i++) {
      w2.bossPool.at(0).fireIn = 999;
      w2.ship.health = w2.shipRow.health;
      f2.step();
      const boss = w2.bossPool.at(0);
      mid += boss.across;
      lanes++;
      const onScreen = boss.along - w2.cameraAlong;
      if (onScreen > seen) {
        seen = onScreen;
        atFurthest = boss.across;
      }
    }
    const centre = mid / lanes;
    expect(
      Math.abs(atFurthest - centre),
      `the serpent was furthest back at ${atFurthest.toFixed(1)} across, against a swing centred on ` +
        `${centre.toFixed(1)} — so the lunge is not locked to the bob and the two read as separate wobbles`,
    ).toBeLessThan(BOSSES.jormungandr.move.kind === 'bob' ? BOSSES.jormungandr.move.amplitude * 0.5 : 0);
  });

  it('0286 — and it keeps every segment it was authored with, through the ARRIVAL and not only on station', () => {
    /*
      ⚠️ **THE DEFECT THIS CAUGHT, AND IT ONLY EXISTS BECAUSE THE ANIMAL GOT LONG.** A chain's nodes
      have no velocity — `layChain` writes each one to `head.along + offset` every step — but they sat
      in a pool that `stepEntities` culls at the leading edge like any flying thing. A serpent arrives
      FROM that edge, so during its approach the head is far up-lane and the tail is past the spawn
      margin: the node was released, and `layChain` re-lays only when the pool is EMPTY, so it never
      came back. **The animal fought the whole fight one segment short and nothing said so.**

      ⚠️ **AND AT ELEVEN NODES IT COULD NOT HAPPEN**, which is why no guard had ever asked. The body
      was 46 units long and the margin is deeper than that. The count was solved with the boss parked
      on station and spent during its arrival, which is
      `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`'s fourth rule —
      *a boss fight has an arrival, phases, windows and a death*, and a fixture that stands the boss on
      station has flown one of them.

      ⚠️ **SO IT IS WATCHED FROM THE FIRST STEP THE BODY EXISTS**, rather than sampled once after it
      has settled. A guard that looked only at the end would have gone on passing the moment `layChain`
      was given any *re*-laying behaviour, and would have been measuring the repair rather than the
      animal.
    */
    const nodes = BOSSES.jormungandr.chain?.girth.length ?? 0;
    const { world, frame } = serpentAt(1);
    let fewest = nodes;
    for (let i = 0; i < 600; i++) {
      world.bossPool.at(0).fireIn = 999;
      world.ship.health = world.shipRow.health;
      frame.step();
      if (world.bossBody.size > 0) fewest = Math.min(fewest, world.bossBody.size);
    }
    expect(
      fewest,
      `the serpent was down to ${fewest} of its ${nodes} segments at some point in the fight — a body that loses a ` +
        'node never gets it back, so the animal the player fights is shorter than the one the row authors',
    ).toBe(nodes);
  });

  it('and the body is one animal: a hit anywhere on it is a hit on the serpent', () => {
    /*
      ⚠️ **THE HURT SHAPE IS THE ANATOMY NOW**, which is the request 0277 could not answer: *"we need
      to update the boss collision to no longer be a disc if we can."* A node is as wide as the animal
      is where it stands, and what lands on it is spent on the head — so the tail is worth what the
      neck is, and neither is worth anything the drawing does not cover.
    */
    const { world, frame } = serpentAt(1);
    for (let i = 0; i < 60 && world.bossBody.size === 0; i++) frame.step();
    expect(world.bossBody.size, 'the serpent laid no body at all').toBe(BOSSES.jormungandr.chain?.girth.length);
    const before = world.bossPool.at(0).health;
    /*
      The node furthest up-lane of the skull that the player can still reach — the one a disc round
      the head misses.

      ⚠️ **IT WAS THE LAST NODE FULL STOP, AND 0286 MADE THAT UNREACHABLE.** The animal is 133 units
      long now and stands at 119, so its tail is 250 units up-lane — past
      `cullPlayerShotAlong`, which is *"you can shoot what you can see"* and is a promise this test
      must not quietly break. A shot placed out there is released before it can touch anything, and
      the guard reported the body as decoration when what it had actually measured was the cull.

      ⚠️ **THE CLAIM IS UNCHANGED AND IS STILL THE ONE 0277 COULD NOT ANSWER**: a hit on the BODY is a
      hit on the animal. Which node, as long as it is not the skull, was never the point — so the
      fixture asks for the furthest one inside the player's reach rather than the furthest one there
      is.
    */
    const s = spine(world);
    const reachable = cullPlayerShotAlong(world.cameraAlong, world.view.alongSpan);
    const tail = [...s].reverse().find((n) => n.along <= reachable);
    if (tail === undefined || tail === s[0]) throw new Error('no body node is inside the player’s reach');
    const shot = world.playerShots.spawn()!;
    reset(shot, tail.along, tail.across, SHOTS.pulse);
    world.bossPool.at(0).fireIn = 999;
    frame.step();
    expect(
      world.bossPool.at(0).health,
      'a shot on the serpent’s tail took nothing off the serpent — the body is decoration rather than the animal',
    ).toBeLessThan(before);
  });
});

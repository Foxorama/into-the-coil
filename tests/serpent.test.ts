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

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES, RAIN_BOLT_KIND } from '../src/content/bosses.ts';
import { DEBRIS_KIND } from '../src/content/debris.ts';
import { DIFFICULTIES, fireGapFor, type DifficultyKind } from '../src/content/difficulty.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS, SHOT_INDEX } from '../src/content/shots.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SERPENT_BODY_DIAMETER, SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { FLARE_SWELL, INK_OF, drawKind } from '../src/render/bake.ts';
import { tracingPen } from './paths.ts';
import { BOLT_STEPS, paintScene } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { ACROSS_SPAN, MIN_ASPECT, cullPlayerShotAlong, viewOf } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { DISTANCES, LANES, flyFight } from '../scripts/weigh-boss.mjs';

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
function serpentAt(fraction: number, difficulty?: DifficultyKind): {
  world: ReturnType<typeof playableWorld>['world'];
  frame: GameFrame;
  stick: ReturnType<typeof playableWorld>['stick'];
} {
  const { world, stick } = playableWorld(SERPENT_ONLY, difficulty);
  const frame = new GameFrame(world);
  /*
    ⚠️ **PAST ITS ENTRANCE AND THEN ITS ARRIVAL — 0306.** This waited 700 steps, which was the arrival
    with room to spare; the entrance is about six and a half seconds in front of it now, so the count
    starts when the entrance hands over. The ship is untouchable as well as healed: the entrance is
    fully live, and a ship killed by it would take the run through a death beat this fixture is not about.
  */
  let arrived = -1;
  for (let i = 0; i < 2400 && (arrived < 0 || i < arrived + 700); i++) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = 2;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
    if (arrived < 0 && world.bossPool.size > 0 && world.bossEntering < 0) arrived = i;
  }
  expect(world.bossPool.size, 'the serpent never arrived').toBe(1);
  expect(world.bossEntering, 'the serpent is still making its entrance').toBe(-1);
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
  it('THE THREE WEAPONS: five globes of acid straight ahead while whole, the spray and void in turn once hurt, the spray, void and lightning in turn at the last third', () => {
    /*
      ⚠️ **0261 — `docs/decisions/0261-the-serpent-throws-together.md`.** 0248 gave the serpent one
      weapon a phase and the alpha play called that *"three separate fire fields"*; the phases are
      cumulative now, the hydra's heads taking turns. The lightning is the same lightning.

      ⚠️ **AND THE ACID IS TWO ATTACKS SINCE 0304**: *"for phase 1 can we have it shoot a forward arc of
      5 globes, then phase 2 it does a spray…"* — a plain fan while whole, and a spray that turns while
      it is thrown once hurt, carried into the last third as every head there is. 0290's wave and the
      rake before it are gone, and so is the reason the opening phase had to turn: the crash its turn
      was measured for is held two tests down against the spray instead, which has counts of its own.
    */
    const row = BOSSES.jormungandr;
    const whole = phaseFor(row, row.health);
    const hurt = phaseFor(row, row.health * 0.6);
    const last = phaseFor(row, row.health * 0.3);
    expect(whole.shot ?? row.shot, 'the serpent does not open with acid').toBe('acid');
    const fan = whole.attack ?? row.attack;
    expect(fan.kind, 'the serpent’s opening acid is not a plain fan straight down the lane').toBe('spray');
    expect(whole.shots, 'the opening arc is not five globes').toBe(5);
    const hurtHeads = (hurt.attack ?? row.attack).kind === 'heads' ? (hurt.attack as { heads: readonly { shot: string; attack: { kind: string } }[] }).heads : [];
    expect(hurtHeads.map((h) => `${h.shot}/${h.attack.kind}`), 'once hurt the serpent does not throw the acid spray and void in turn').toEqual(['acid/sweep', 'void/spray']);
    const lastHeads = (last.attack ?? row.attack).kind === 'heads' ? (last.attack as { heads: readonly { shot: string; attack: { kind: string } }[] }).heads : [];
    expect(lastHeads.map((h) => h.attack.kind), 'the last third does not throw the spray, void and the lightning in turn').toEqual(['sweep', 'spray', 'rain']);
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
  });

  it('0304 — THE REPORTED ONE: whole, it throws a forward arc of FIVE globes, and every volley points the same way', () => {
    /*
      ⚠️ **ASKED FOR**: *"for phase 1 can we have it shoot a forward arc of 5 globes."* Three halves,
      each in something the player sees: how many, that the arc faces them, and that it holds still —
      the rake this replaces turned a little every volley, which is a different thing to dodge.

      ⚠️ **MEASURED OFF THE VELOCITIES IN THE CAMERA'S FRAME**, which is where the aim is: every globe
      leaves the mouth on the same step, so the arc is in where they point. The scroll is taken out,
      because it is in every velocity and is not the animal aiming anywhere.
    */
    const opening = serpentAt(1);
    const centres: number[] = [];
    for (let volley = 0; volley < 2; volley++) {
      opening.world.enemyShots.clear();
      opening.world.bossPool.at(0).fireIn = 1;
      opening.frame.step();
      const headings: number[] = [];
      for (let i = 0; i < opening.world.enemyShots.size; i++) {
        const s = opening.world.enemyShots.at(i);
        expect(s.sprite, 'the opening arc is not acid').toBe(SHOTS.acid.sprite);
        // Down the lane is π; measured from it so the arc's two sides are negative and positive.
        const off = Math.atan2(s.velAcross, s.velAlong - opening.world.scrollPerStep);
        headings.push(off < 0 ? off + Math.PI : off - Math.PI);
      }
      expect(headings.length, `the opening arc threw ${headings.length} globes, not five`).toBe(5);
      const wide = Math.max(...headings) - Math.min(...headings);
      expect(wide, 'the five globes left on one heading, so they are a line and not an arc').toBeGreaterThan(0.3);
      const centre = headings.reduce((a, b) => a + b, 0) / headings.length;
      expect(
        Math.abs(centre),
        `the arc is centred ${((centre * 180) / Math.PI).toFixed(1)}° off the lane, so it is not thrown forward at the player`,
      ).toBeLessThan(0.05);
      centres.push(centre);
    }
    expect(Math.abs(centres[1]! - centres[0]!), 'the arc turned between two volleys — the rake is back').toBeLessThan(0.05);
  });

  it('0304 — THE REPORTED ONE: once hurt, the acid is a SPRAY — one globe at a time, the aim turning from below-behind, round through the front, to above-behind', () => {
    /*
      ⚠️ **ASKED FOR**: *"phase 2 it does a spray starting from 60 degrees (so it will be shooting down
      behind it) then arcing around and finishing at 30 degrees (so it will be shooting up behind
      it)."* Read as asked, and confirmed before building: sixty degrees below straight-behind, then
      down, forward and up, to thirty above straight-behind — 270 degrees, the gap behind the animal.

      ⚠️ **MEASURED IN DEGREES AND SECONDS, WHICH IS WHAT THE PLAYER WATCHES** — 0027. What the frame
      stores is steps and radians; what makes it a spray and not a fan is that the globes leave over
      TIME, so the first thing asked is how long the stream lasts, and the angles are read in the
      picture's own terms: down, forward, up.
    */
    const { world, frame } = serpentAt(0.6);
    const boss = world.bossPool.at(0);
    boss.headAt = 0;
    world.enemyShots.clear();
    boss.fireIn = 1;
    /** Every acid globe as it first appears: when, which way, and where the mouth was on that step. */
    const globes: { step: number; heading: number; fromHead: number }[] = [];
    const known = new Set<object>();
    let gapedThroughout = true;
    for (let step = 0; step < STEPS_PER_SECOND * 2; step++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.ship.health = world.shipRow.health;
      // Hold the round on the acid, so nothing else is in the pool to be told apart from it.
      if (step > 0 && boss.fireIn < 2) boss.fireIn = 999;
      frame.step();
      for (let i = 0; i < world.enemyShots.size; i++) {
        const s = world.enemyShots.at(i);
        if (s.sprite !== SHOTS.acid.sprite || known.has(s)) continue;
        known.add(s);
        // Where it was thrown from is where it is less the one step it has flown, and the mouth on
        // that step is where the hull was before it moved. The round is held above, so no slot is
        // handed back out as a second globe inside the two seconds this watches.
        const d = Math.hypot(s.along - s.velAlong - boss.prevAlong, s.across - s.velAcross - boss.prevAcross);
        globes.push({ step, heading: Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep), fromHead: d });
      }
      // The gape the phase wears, which since 0305 is a longer-horned one than the row's.
      const faces = phaseFor(BOSSES.jormungandr, boss.health, world.bossFullHealth).look?.face ?? BOSSES.jormungandr.face!;
      if (boss.sprayLeft > 0 && boss.spriteBase !== faces.gape) gapedThroughout = false;
    }
    expect(globes.length, 'the serpent threw no acid once hurt, so this measures nothing').toBeGreaterThan(0);
    const first = globes[0]!;
    const final = globes[globes.length - 1]!;
    const lasted = (final.step - first.step) / STEPS_PER_SECOND;
    expect(
      lasted,
      `the spray's ${globes.length} globes all left within ${lasted.toFixed(2)}s, so it is a fan thrown at once rather than a spray`,
    ).toBeGreaterThan(0.5);
    expect(globes.length, `the spray threw ${globes.length} globes — a stream is more than a handful`).toBeGreaterThan(12);
    for (const g of globes) {
      expect(g.fromHead, `a globe left ${g.fromHead.toFixed(1)} units from the mouth, so the spray is not coming out of it`).toBeLessThan(2);
    }
    const deg = (r: number): number => (r * 180) / Math.PI;
    // The screen's own words: behind is along-plus, down is across-plus on the landscape screen.
    expect(Math.cos(first.heading), 'the spray does not START behind the animal').toBeGreaterThan(0);
    expect(Math.sin(first.heading), 'the spray does not start shooting DOWN behind it').toBeGreaterThan(0);
    expect(Math.abs(deg(first.heading) - 60), `the spray starts ${deg(first.heading).toFixed(0)}° from straight-behind, not 60° below it`).toBeLessThan(3);
    expect(Math.cos(final.heading), 'the spray does not FINISH behind the animal').toBeGreaterThan(0);
    expect(Math.sin(final.heading), 'the spray does not finish shooting UP behind it').toBeLessThan(0);
    expect(Math.abs(deg(final.heading) + 30), `the spray finishes ${deg(final.heading).toFixed(0)}° from straight-behind, not 30° above it`).toBeLessThan(3);
    // And it goes round through the FRONT, not the short way across the back: unwrapped, the aim only
    // ever increases, by 270 degrees in all, and on the way it points straight down the lane at the player.
    let turned = 0;
    let faced = false;
    for (let i = 1; i < globes.length; i++) {
      let d = globes[i]!.heading - globes[i - 1]!.heading;
      if (d < -Math.PI) d += 2 * Math.PI;
      if (d > Math.PI) d -= 2 * Math.PI;
      expect(d, 'the spray’s aim turned back on itself').toBeGreaterThan(0);
      turned += d;
      if (Math.cos(globes[i]!.heading) < -0.97) faced = true;
    }
    expect(Math.abs(deg(turned) - 270), `the spray turned ${deg(turned).toFixed(0)}°, not round through the front`).toBeLessThan(5);
    expect(faced, 'the spray never pointed down the lane at the player').toBe(true);
    // And the picture says so for as long as it lasts: a stream from a shut mouth is from nowhere (0036).
    expect(gapedThroughout, 'the jaw closed while the spray was still coming out of it').toBe(true);
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
      ['the opening arc of acid', 1],
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
      ⚠️ **WHAT SEPARATES A PULL FROM A COINCIDENCE IS WHAT THE CHAIN DID NOT HIT**, so the drifter's
      health is half the assertion. The probe that made the void one target among many stayed GREEN
      twice over until it was: first because nothing else was in reach, then because nearest-wins
      hit the drifter and JUMPED to the void on its next link, so *was it fed* was true either way.

      ⚠️ **THE DRIFTER STANDS BEHIND THE BLAST SINCE 0307, AND IT STOOD IN FRONT OF IT BEFORE.** 0292
      read *sucks in* as a pull over the whole reach, so a void took the link even with an enemy
      nearer; 0307 made it a void in the WAY, because a pull that ignores direction cannot be flown
      around and it cost the arc nine volleys in ten against the serpent. So the bolt is aimed at a
      drifter the blast is in front of — and the drifter coming through whole is still the proof that
      the blast took it rather than merely being fed afterwards.
    */
    const { world, frame } = serpentAt(0.5);
    world.bossPool.at(0).fireIn = 999;
    const blast = world.enemyShots.spawn()!;
    reset(blast, world.ship.along + 10, world.ship.across, SHOTS.void, SHOT_INDEX.void);
    const behind = world.enemies.spawn()!;
    reset(behind, world.ship.along + 20, world.ship.across, ENEMIES.drifter, world.enemyKinds.drifter);
    const whole = behind.health;
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
      'the chain went through the void to the drifter behind it, so the void is not sucking it in',
    ).toBe(whole);
  });

  it('0307 — THE REPORTED ONE: a void BESIDE the bolt’s line does not take it, and the thing it was aimed at is struck', () => {
    /*
      ⚠️ **REPORTED**: *"the lightning gun and auto-fire gun only hit the head so they take forever to
      kill the boss."* The lightning was not the head. Flown against the serpent, it took the first
      third in a dozen seconds and then over two hundred for the rest, because from the void phase on
      there was nearly always a void or a shard in reach and 0292's pull took any one of them, from
      any direction. Switched off, the arc killed the serpent in about half a minute.

      ⚠️ **SO THE HALF THIS HOLDS IS THE ONE THAT WAS WRONG**: a blast off to one side, well inside the
      reach but nowhere near the line to the target, leaves the bolt alone. Its health is the
      assertion that it was not fed, and the drifter's is the assertion that the volley went where it
      was aimed rather than nowhere.
    */
    const { world, frame } = serpentAt(0.5);
    world.bossPool.at(0).fireIn = 999;
    const blast = world.enemyShots.spawn()!;
    reset(blast, world.ship.along + 10, world.ship.across + 8, SHOTS.void, SHOT_INDEX.void);
    const ahead = world.enemies.spawn()!;
    reset(ahead, world.ship.along + 20, world.ship.across, ENEMIES.drifter, world.enemyKinds.drifter);
    const whole = ahead.health;
    world.weapon = weaponFor(world.shipRow, ['weapon', 'weapon', 'weapon'], 'arc');
    world.missileIn = Number.MAX_SAFE_INTEGER;
    world.fireIn = 0;
    frame.step();

    expect(world.enemyShots.size, 'the void blast burst, so something fed it').toBe(1);
    expect(world.enemyShots.at(0).health, 'a void off to the side of the bolt’s line swallowed it anyway').toBe(SHOTS.void.health);
    expect(
      world.enemies.size > 0 ? world.enemies.at(0).health : 0,
      'the bolt never reached the drifter it was aimed at, with nothing in its way',
    ).toBeLessThan(whole);
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

  it('0304 — and a boss that SPRAYS and grows heads finishes every spray: no head is thrown into one, on the hardest tier', () => {
    /*
      ⚠️ **THE SPRAY IS THE FIRST ATTACK THAT OUTLIVES THE STEP IT WAS THROWN ON**, and the round
      moves on while it is still coming out of the mouth. Two ways that goes wrong, and both are held
      by flying the fight rather than by setting the phase:

      - **the next spray starts over the top of the last.** The hardest tier halves the last third's
        cadence to eighteen steps, so its round of three heads is fifty-four, and a spray is sixty — a
        gate that did not wait would restart the stream from its first heading most of the way round:
        a hose that snaps back, and a spray the player never sees finish. On the content tier every
        round is longer than a spray, which is why this is flown on the hardest.
      - **the spray reads a count another attack writes.** 0261 crashed every serpent fight because a
        rake's angle and the heads' count were one field. The spray carries five fields of its own;
        were it to share either, the round or the stream would be steered by the other.

      ⚠️ **SO WHAT IS COUNTED IS THE PICTURE: every globe as it leaves the mouth, split into sprays
      wherever the aim jumps back to its start.** Each finished spray has every globe its attack
      authors and runs the whole way round. Read off the pool, not off `sprayLeft`, which would be the
      model agreeing with itself.
    */
    const { world, frame } = serpentAt(0.3, 'burn');
    const boss = world.bossPool.at(0);
    const last = phaseFor(BOSSES.jormungandr, BOSSES.jormungandr.health * 0.3).attack;
    const sweep = last !== null && last.kind === 'heads' ? last.heads.map((h) => h.attack).find((a) => a.kind === 'sweep') : undefined;
    expect(sweep, 'the serpent’s last third has no spray, so this measures nothing').toBeDefined();
    const { from, globes: authored } = sweep as { from: number; globes: number };
    const round = (a: number): number => (((a - from) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    /** How far round from its start each globe was aimed, in the order they left the mouth. */
    const aims: number[] = [];
    boss.fireIn = 1;
    for (let step = 0; step < STEPS_PER_SECOND * 12; step++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      world.ship.health = world.shipRow.health;
      // Twelve seconds under the lightning: the ship is untouchable, so nothing ends the fight being watched.
      world.ship.invulnFor = 2;
      boss.health = world.bossFullHealth * 0.3;
      frame.step();
      // Thrown THIS step: where it is less the one step it has flown is exactly where the hull was.
      const fresh: number[] = [];
      for (let i = 0; i < world.enemyShots.size; i++) {
        const s = world.enemyShots.at(i);
        if (s.sprite !== SHOTS.acid.sprite) continue;
        if (Math.abs(s.along - s.velAlong - boss.prevAlong) > 1e-6 || Math.abs(s.across - s.velAcross - boss.prevAcross) > 1e-6) continue;
        fresh.push(round(Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep)));
      }
      // A spray's last globe and the next one's first can share a step; the last is the one furthest round.
      fresh.sort((a, b) => b - a);
      aims.push(...fresh);
    }
    const sprays: number[][] = [];
    for (let i = 0; i < aims.length; i++) {
      if (i === 0 || aims[i]! < aims[i - 1]!) sprays.push([]);
      sprays[sprays.length - 1]!.push(aims[i]!);
    }
    // The last may still be spraying when the watch ends; every other one had its chance to finish.
    const finished = sprays.slice(0, -1);
    expect(finished.length, `only ${finished.length} sprays finished in twelve seconds, so this measures nothing`).toBeGreaterThan(2);
    for (const [n, s] of finished.entries()) {
      expect(s.length, `spray ${n} threw ${s.length} globes of the ${authored} it authors — the next one started over it`).toBe(authored);
      expect(s[0]!, `spray ${n} did not start at its first heading`).toBeLessThan(0.05);
      expect((s[s.length - 1]! * 180) / Math.PI, `spray ${n} stopped short of the way round`).toBeGreaterThan(265);
    }
    // And the round still turns: the void was thrown between the sprays, so neither count steered the other.
    expect(boss.headAt, 'the round never moved past the spray').toBeGreaterThan(finished.length);
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
/**
 * The laid-out spine this step: every node's place, head-end first, in world units.
 *
 * ⚠️ **AT THE FILE'S SCOPE SINCE 0309, AND IT WAS INSIDE 0283's BLOCK.** The bend rule and the reared
 * posture are two claims about the same shape, and a second copy of *what the spine IS* is the drift
 * `src/content/sprites.ts` records the cost of. Moved rather than duplicated.
 */
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

describe('0283 — the serpent is a chain', () => {
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
    /*
      ⚠️ **AND OVER THE REARED PHASE TOO, WHICH IS THE TIGHTEST THE ANIMAL EVER GETS — 0309.** This drove
      `serpentAt(1)` alone, and the bow the lightning phase adds is a curve the unreared body never has:
      authored at six over thirty-four it measured **1.39** and this guard catches it — the span was spent
      instead of the amplitude, and it reads **1.85** now against **2.50** whole.

      ⚠️ **THE SHIP IS WALKED ACROSS THE LANE**, because the bow takes the side of the head's committed
      gaze (0285): a fixture whose ship never moves exercises one half of the posture and calls it covered.
    */
    for (const fraction of [1, 0.2]) {
      const { world, frame } = serpentAt(fraction);
      let tightest = Infinity;
      let at = -1;
      for (let i = 0; i < 600; i++) {
        world.bossPool.at(0).fireIn = 999;
        world.bossPool.at(0).health = world.bossFullHealth * fraction;
        world.ship.across = i % 400 < 200 ? 8 : 92;
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
        `at ${fraction} of its health the serpent kinks at node ${at}: its bend radius there is ` +
          `${tightest.toFixed(2)} of its own girth, and a body that turns inside its own width has no spine in it`,
      ).toBeGreaterThan(1.5);
    }
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

  it('0307 — and the body is armour: a shot on it stops and sparks, and takes nothing off the serpent', () => {
    /*
      ⚠️ **THE HURT SHAPE IS THE ANATOMY**, which is the request 0277 could not answer: *"we need to
      update the boss collision to no longer be a disc if we can."* A node is as wide as the animal is
      where it stands — and since 0307 what lands on it is spent on the head at the row's `hurt`, which
      on the serpent is nothing. Reported: *"the shurikens kill the serpent boss in a reasonable time
      length, but the lightning gun and auto-fire gun only hit the head"*; asked for: *"reduce the body
      damage taken overall so shurikens only damage the head."*

      ⚠️ **THREE HALVES, AND TWO OF THEM ARE THE PICTURE.** Nothing off the head is the ask. That the
      shot STOPS is that armour is not a hole — a pulse passing through a drawn flank reads as a ghost.
      That the flank does not flash and a spark does is 0036 both ways round: a hurt twin on a body
      that took nothing is the picture saying HIT over a model that says miss, and a shot vanishing
      with no mark at all is the collision bug that report after report has filed.
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
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    world.playerShots.clear();
    world.debris.clear();
    const shot = world.playerShots.spawn()!;
    reset(shot, tail.along, tail.across, SHOTS.pulse);
    world.bossPool.at(0).fireIn = 999;
    frame.step();
    expect(world.playerShots.size, 'the shot went through the serpent’s flank — armour is not a hole').toBe(0);
    expect(world.bossPool.at(0).health, 'a shot on the serpent’s tail hurt the serpent, so the body is not armour').toBe(before);
    let lit = 0;
    for (let i = 0; i < world.bossBody.size; i++) if (world.bossBody.at(i).flashFor > 0) lit++;
    expect(lit, 'the flank flashed hurt for a shot that took nothing').toBe(0);
    let sparks = 0;
    for (let i = 0; i < world.debris.size; i++) if (world.debris.at(i).kind === DEBRIS_KIND.spark) sparks++;
    expect(sparks, 'the shot stopped on the flank and left no mark, so it vanished into the animal').toBeGreaterThan(0);
  });

  it('and a body that is not armour spends its share of a hit on the head, which is 0283’s animal', () => {
    /*
      ⚠️ **THE MECHANISM OUTLIVES ITS ONLY ROW'S USE OF IT, SO IT IS HELD ON A ROW MADE FOR THE TEST.**
      0283 built the body as one animal — a hit on the tail is a hit on the serpent — and 0307 made
      the serpent's flank armour, so the one row with a chain no longer passes anything and nothing
      in the content exercises the drain. `hurt` is a share on the row
      ([0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)), and
      a second creature with a soft belly is the reason it is a number rather than a switch. So the
      fight is flown with the serpent's own row wearing half of one: the share is what arrives.
    */
    const { world, frame } = serpentAt(1);
    const chain = BOSSES.jormungandr.chain!;
    world.bossRow = { ...BOSSES.jormungandr, chain: { ...chain, hurt: 0.5 } };
    for (let i = 0; i < 60 && world.bossBody.size === 0; i++) frame.step();
    const s = spine(world);
    const reachable = cullPlayerShotAlong(world.cameraAlong, world.view.alongSpan);
    const tail = [...s].reverse().find((n) => n.along <= reachable);
    if (tail === undefined || tail === s[0]) throw new Error('no body node is inside the player’s reach');
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    world.playerShots.clear();
    const before = world.bossPool.at(0).health;
    const shot = world.playerShots.spawn()!;
    reset(shot, tail.along, tail.across, SHOTS.pulse);
    world.bossPool.at(0).fireIn = 999;
    frame.step();
    expect(
      before - world.bossPool.at(0).health,
      'a shot on a half-soft flank did not take half a shot off the animal',
    ).toBeCloseTo(SHOTS.pulse.damage * 0.5, 6);
  });
});

/*
  ── 0308: THE ATTACKS ARE HEARD ─────────────────────────────────────────────────────────────────

  `docs/decisions/0308-the-attacks-are-heard.md`. Reported: *"sounds for all the attacks need to be
  massively buffed."* Half of that is level and lives in `src/content/cues.ts`, measured by
  `scripts/weigh-cue.mjs --loud` and claimed in `tests/authored.ts`. The half that is here is the word
  *all*: this animal's acid, its void and its lightning made ONE noise, which is 0282's own tell.
*/
describe('0308 — the attacks are heard', () => {
  /** Every cue the serpent's rows name, in the order its phases and heads name them. */
  function named(): string[] {
    const row = BOSSES.jormungandr;
    const out: string[] = [];
    for (const phase of row.phases) {
      const attack = phase.attack ?? row.attack;
      if (attack.kind === 'heads') for (const head of attack.heads) out.push(head.cue ?? 'bossShot');
      else out.push(phase.cue ?? 'bossShot');
    }
    return out;
  }

  it('THE REPORTED ONE: the acid, the void and the lightning are three different sounds', () => {
    /*
      ⚠️ **THE STATE OF `main` IS THAT THEY WERE ONE**, and nothing in the suite could say so: the cue
      was emitted at the fire gate, one line above the call that chooses which head throws. So the
      count below is the whole claim — three attacks the player reads one at a time, sounding three
      ways — and `bossShot` appearing anywhere in this animal's rows is the defect returning.
    */
    const all = named();
    expect(all.length, 'the serpent names no attacks at all, so this measured nothing').toBeGreaterThan(5);
    expect(
      all.filter((cue) => cue === 'bossShot'),
      'an attack of this animal still makes the crash every boss shares',
    ).toEqual([]);
    /*
      ⚠️ **PER ROUND, AND COUNTING OVER THE WHOLE TABLE LEFT `npm run prove` GREEN.** The first version
      asked that the serpent's phases name three distinct cues between them — and the probe that makes the
      last phase's void head sound like its acid head passed it, because phase TWO still has a void head
      and the set over all three phases was still three. **The claim was never about the table**: it is
      that a round of attacks the player meets one at a time makes one sound each, which is a claim about
      the round. `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` is what caught it.
    */
    const row = BOSSES.jormungandr;
    let rounds = 0;
    for (const phase of row.phases) {
      const attack = phase.attack ?? row.attack;
      if (attack.kind !== 'heads') continue;
      rounds++;
      const cues = attack.heads.map((head) => head.cue ?? 'bossShot');
      expect(
        new Set(cues).size,
        `a round of ${cues.length} attacks sounds ${new Set(cues).size} ways: ${cues.join(', ')} — the heads of ` +
          'one round are what the player is being asked to tell apart',
      ).toBe(cues.length);
    }
    expect(rounds, 'the serpent grows no heads at all, so no round was measured').toBeGreaterThan(1);
    expect(
      new Set(all).size,
      `the serpent's attacks sound ${new Set(all).size} ways: ${[...new Set(all)].join(', ')} — the acid, the ` +
        'void and the lightning are three things to tell apart',
    ).toBe(3);
  });

  it('and a VOLLEY still makes exactly one sound, however many bullets are in it', () => {
    /*
      ⚠️ **THE PROPERTY THE FIRE GATE WAS PROTECTING, AND MOVING THE CUE IS WHAT PUT IT AT RISK.** 0114
      put the cue at the gate because *"a rake puts nine shots out in one step; nine cues would be one
      smeared noise and would spend the whole per-step voice budget"* (0104's four voices). It is
      inside `throwAttack` now, and `heads` calls that function a second time — so *one per volley*
      stopped being true by construction and has to be measured.

      ⚠️ **DRIVEN THROUGH EVERY PHASE, because the round is what recurses.** The opening phase throws
      its own attack and the other two grow heads, so the arm that does not sound and the arm that
      does are both covered.
    */
    for (const fraction of [1, 0.5, 0.2]) {
      const { world, frame } = serpentAt(fraction);
      const heard: string[] = [];
      world.onCue = (kind): void => {
        if (kind.startsWith('boss') && kind !== 'bossPhase' && kind !== 'bossDown') heard.push(kind);
      };
      // One volley: the gate is armed for the next step and nothing else on the field can fire.
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      world.bossPool.at(0).fireIn = 1;
      world.bossPool.at(0).sprayLeft = 0;
      frame.step();
      expect(heard, `a volley at ${fraction} of its health sounded ${heard.length} cues: ${heard.join(', ')}`).toHaveLength(1);
      expect(named(), `a volley at ${fraction} sounded ${heard[0]}, which is not one of this animal's`).toContain(heard[0]);
    }
  });

  it('and the SPRAY it leaves behind does not sound again, because it is one attack', () => {
    /*
      ⚠️ **A SWEEP OUTLIVES THE STEP IT WAS THROWN ON — 0304 — AND IT IS THE ONE ATTACK THAT COULD.**
      Twenty-one globes over a second, thrown from `stepBoss` rather than from `throwAttack`: a cue
      beside any of them would be twenty-one crashes for one attack, which is the smear 0114 named.
    */
    const { world, frame } = serpentAt(0.5);
    const heard: string[] = [];
    world.onCue = (kind): void => {
      if (kind.startsWith('boss') && kind !== 'bossPhase' && kind !== 'bossDown') heard.push(kind);
    };
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    const boss = world.bossPool.at(0);
    boss.headAt = 0;
    boss.fireIn = 1;
    // Long enough for the whole sweep and no second volley: the gate is pushed out after the step.
    for (let i = 0; i < 70; i++) {
      if (i > 0) boss.fireIn = 999;
      frame.step();
    }
    expect(boss.sprayLeft, 'the sweep never ran, so nothing about its silence was measured').toBe(0);
    expect(heard, `the sweep sounded ${heard.length} times for one attack`).toHaveLength(1);
  });
});

/*
  ── 0309: THE SERPENT REARS BACK ────────────────────────────────────────────────────────────────

  `docs/decisions/0309-the-serpent-rears-back.md`. Reported: *"at the lightning phase, the serpent needs
  to rear back with it's head and upper body, keeping the rest of it's body off screen."*

  ⚠️ **THE SECOND HALF IS TRUE BEFORE THIS CHANGE AND IS MEASURED HERE ANYWAY**, because it is the
  constraint the first half had to be designed inside: the head plus five of twenty-six nodes is all that
  is ever on the narrowest screen.
*/
describe('0309 — the serpent rears back', () => {
  /** The reared phase's own numbers, read off the row rather than restated. */
  const rearOf = (fraction: number) => phaseFor(BOSSES.jormungandr, BOSSES.jormungandr.health * fraction).rear;

  /**
   * Fly the animal and report the ends of its swing, its tightest visible node and the head's turn.
   *
   * ⚠️ **THE SHIP IS WALKED ACROSS THE LANE**, because the bow takes the side of the head's committed
   * gaze — a fixture whose ship holds one lane exercises one half of the posture.
   */
  function flown(fraction: number, steps = 700): { near: number; far: number; turn: number; bow: number } {
    const { world, frame } = serpentAt(fraction);
    let near = Infinity;
    let far = -Infinity;
    let turn = 0;
    let bow = 0;
    for (let i = 0; i < steps; i++) {
      world.bossPool.at(0).fireIn = 999;
      world.bossPool.at(0).health = world.bossFullHealth * fraction;
      world.ship.across = i % 400 < 200 ? 8 : 92;
      frame.step();
      const head = world.bossPool.at(0);
      near = Math.min(near, head.along - world.cameraAlong);
      far = Math.max(far, head.along - world.cameraAlong);
      turn = Math.max(turn, Math.abs(head.turn));
      bow = Math.max(bow, Math.abs(world.bossBow));
    }
    return { near, far, turn, bow };
  }

  it('THE REPORTED ONE: at the lightning phase it holds further off than it ever has, and the skull is still on the screen', () => {
    /*
      ⚠️ **THE NEAR END OF THE SWING IS THE QUANTITY, WHICH IS 0101's OWN.** *"The bosses come too far
      into the screen"* was measured at `station − drift − rear − radius`, and a rear that moved only the
      station would be a boss that stands back and lunges just as far in. Both terms move here: `stand`
      shifts the whole swing and `lunge` cuts 0289's strike, so the near end travels nearly nineteen units
      and the far end does not move at all.

      ⚠️ **AND THE FAR END IS THE OTHER HALF, BECAUSE A HULL CAN REAR OFF THE SCREEN.** The leading edge
      of the narrowest view is 177.8 and the drawn skull is 38 units across in this phase, so what has to
      fit is `far + 19`. A guard on the near end alone would pass an animal that had backed out of the
      fight.
    */
    const rear = rearOf(0.2);
    expect(rear, 'the lightning phase does not rear at all, so nothing below measured it').toBeDefined();
    const reared = flown(0.2);
    const before = flown(0.5);
    expect(
      reared.near - before.near,
      `the reared phase's closest approach is ${reared.near.toFixed(1)} against ${before.near.toFixed(1)} in the ` +
        'phase before it — the animal did not pull back',
    ).toBeGreaterThan(12);
    // Where the drawn skull's leading edge gets to, against the narrowest screen the clamp allows.
    const edge = reared.far + SPRITE_EXTENT.boss8Horn3 / 2;
    const narrow = ACROSS_SPAN * MIN_ASPECT;
    expect(
      edge,
      `the reared skull's drawn edge reaches ${edge.toFixed(1)} of a screen ${narrow.toFixed(1)} wide — it has ` +
        'reared off the leading edge',
    ).toBeLessThan(narrow);
  });

  it('and the NECK bows, which is what stops it reading as a boss that repositioned', () => {
    /*
      ⚠️ **MEASURED AS A DEPARTURE FROM THE LAY-OUT THE BODY WOULD OTHERWISE HAVE**, not as an absolute
      shape: the sway and the lag put every node somewhere already, and what this adds is a crest. So the
      claim is that the node nearest the bow's own crest sits further off the line between its neighbours
      than any node does in the phase before — which is the definition of a bend that was not there.
    */
    const rear = rearOf(0.2)!;
    const worst = (fraction: number): number => {
      const { world, frame } = serpentAt(fraction);
      let most = 0;
      for (let i = 0; i < 500; i++) {
        world.bossPool.at(0).fireIn = 999;
        world.bossPool.at(0).health = world.bossFullHealth * fraction;
        world.ship.across = 8;
        frame.step();
        if (world.bossBody.size === 0) continue;
        const s = spine(world);
        // Only the stretch the bow runs over: beyond `span` it is the ordinary body and always was.
        for (let k = 1; k < s.length - 1; k++) {
          if (s[k]!.along - s[0]!.along > rear.span) break;
          const line = (s[k - 1]!.across + s[k + 1]!.across) / 2;
          most = Math.max(most, Math.abs(s[k]!.across - line));
        }
      }
      return most;
    };
    const reared = worst(0.2);
    const straight = worst(0.5);
    expect(
      reared / straight,
      `the reared neck departs from its own line by ${reared.toFixed(2)} units against ${straight.toFixed(2)} ` +
        'in the phase before — the bow is not in the body',
    ).toBeGreaterThan(1.5);
  });

  it('and the SKULL turns with its own neck, which is what stops a gap opening behind it', () => {
    /*
      ⚠️ **ONE DESCRIPTION, AND THE REASON IT IS ARITHMETIC RATHER THAN A FIELD.** 0284 closed a
      *"slight gap between head and body"* by measuring the first node against the skull's back edge; a
      head turned by a hand while its body left it straight would re-open exactly that on one side. So the
      turn IS the bow's slope at the skull, and this asserts the two agree rather than asserting a number
      somebody typed — `docs/decisions/0027-measure-the-picture-not-the-model.md`'s own complaint about a
      guard that measures a constant against itself.
    */
    const rear = rearOf(0.2)!;
    const { world, frame } = serpentAt(0.2);
    let checked = 0;
    for (let i = 0; i < 500; i++) {
      world.bossPool.at(0).fireIn = 999;
      world.bossPool.at(0).health = world.bossFullHealth * 0.2;
      world.ship.across = i % 400 < 200 ? 8 : 92;
      frame.step();
      const head = world.bossPool.at(0);
      const slope = (world.bossBow * rear.arch * Math.PI) / rear.span;
      expect(head.turn, `the skull is turned ${head.turn.toFixed(3)} where its neck leaves it at ${Math.atan(slope).toFixed(3)}`).toBeCloseTo(
        Math.atan(slope),
        6,
      );
      if (Math.abs(head.turn) > 0.1) checked++;
    }
    expect(checked, 'the skull never turned at all, so the agreement above was between two zeroes').toBeGreaterThan(200);
    // And it reaches the tilt the row's two numbers imply — 23 degrees — rather than a fraction of it.
    const full = Math.atan((rear.arch * Math.PI) / rear.span);
    expect(flown(0.2).turn, 'the skull never reaches the tilt its own bow asks for').toBeGreaterThan(full * 0.95);
  });

  it('and the bow EASES across when the player crosses it, because a neck cannot flip in a step', () => {
    /*
      ⚠️ **THE SIDE IS A DISCRETE ±1 AND FLIPS IN ONE STEP** — 0285's committed gaze. The crest is six
      world units off the spine, so a body following that directly crosses twelve units in a sixtieth of a
      second, through its own middle, carrying twenty-six hurtboxes and twenty-seven flames. What is
      asserted is the RATE: no step moves the bow by more than the ease allows.
    */
    const { world, frame } = serpentAt(0.2);
    let biggest = 0;
    let last = world.bossBow;
    let crossings = 0;
    for (let i = 0; i < 900; i++) {
      world.bossPool.at(0).fireIn = 999;
      world.bossPool.at(0).health = world.bossFullHealth * 0.2;
      // Teleported from one edge to the other, which is the worst a player can do to it.
      world.ship.across = i % 300 < 150 ? 4 : 96;
      frame.step();
      if (Math.sign(world.bossBow) !== Math.sign(last) && world.bossBow !== 0) crossings++;
      biggest = Math.max(biggest, Math.abs(world.bossBow - last));
      last = world.bossBow;
    }
    expect(crossings, 'the bow never changed sides, so nothing about the ease was measured').toBeGreaterThan(2);
    expect(
      biggest,
      `the bow moved ${biggest.toFixed(3)} of its range in one step — a neck that crosses the animal's own ` +
        'middle in a frame is a teleport, not a posture',
    ).toBeLessThan(0.06);
  });

  it('and nothing about the phases that do not rear has changed', () => {
    /*
      ⚠️ **THE HALF A NEW FIELD PUTS AT RISK.** `rear` is optional and absent on every phase of every
      other boss and on this animal's first two, so the arithmetic that reads it has to be identity when
      it is missing. A `stand` defaulting to anything but zero, or a `lunge` defaulting to anything but
      one, would move thirteen bosses nobody has played since.
    */
    for (const fraction of [1, 0.5]) {
      expect(rearOf(fraction), `the serpent rears at ${fraction} of its health, which is not the lightning phase`).toBeUndefined();
    }
    const whole = flown(1);
    expect(whole.turn, 'the unreared skull is turned, so the head faces somewhere the body does not go').toBe(0);
    expect(whole.bow, 'the unreared body bows, so a phase with no rear is not the body it used to be').toBe(0);
    /*
      The row's own station and lunge, which is what the unreared swing has to be made of.

      ⚠️ **TO WITHIN THE STATION TRACKER'S OWN LAG, WHICH IS A REAL 2.4 UNITS AND NOT SLOP.** `stepBoss`
      eases the hull toward its station at `STATION_TRACK` with the approach rate as a cap, so a hull
      chasing a station that is itself moving never quite arrives — measured, the far end reaches 146.6
      against the 149 the row describes. Asserting equality here would be asserting that 0061's tracker
      does not exist.
    */
    const row = BOSSES.jormungandr;
    const station = row.station + row.drift + (row.move.kind === 'bob' ? row.move.rear : 0);
    expect(
      station - whole.far,
      `the unreared far end is ${whole.far.toFixed(1)} against the ${station} its row describes — further off than ` +
        'the station tracker can account for',
    ).toBeLessThan(3);
  });
});

/*
  ── 0310: THE STORM RUNS THE WHOLE BODY, AND THE HORNS FIRE IT ──────────────────────────────────

  `docs/decisions/0310-the-storm-runs-the-whole-body.md`. Reported, of the look 0305 shipped:

  > *"3. the red lightning flickers need to be across the whole body and a bit more subdued*
  > *4. the horns need to grow and .5sec before the lightning attack happens, they need to flare with
  > red lightning"*
*/
describe('0310 — the storm runs the whole body, and the horns fire it', () => {
  /** How far a kind's drawing reaches from its centre, in WORLD units, so tiles of different extents compare. */
  function worldReach(kind: SpriteKind, only?: string, swell = 1): number {
    const size = SPRITE_EXTENT[kind] * viewOf(1280, 720).scale;
    const rec = tracingPen();
    drawKind(rec.pen, kind, PALETTES[DEFAULT_PALETTE], size, 'approach');
    const half = size / 2;
    const paths =
      only === undefined
        ? rec.trace.passes.flatMap((p) => p.subpaths)
        : rec.trace.inks.filter((i) => i.colour === only).flatMap((i) => i.subpaths);
    let out = 0;
    for (const path of paths) {
      for (const [x, y] of path) out = Math.max(out, (Math.hypot(x - half, y - half) / size) * SPRITE_EXTENT[kind] * swell);
    }
    return out;
  }

  /** How many strokes a kind draws in the storm's two reds — the discharge, traced. */
  function sparks(kind: SpriteKind): number {
    const size = SPRITE_EXTENT[kind] * viewOf(1280, 720).scale;
    const rec = tracingPen();
    drawKind(rec.pen, kind, PALETTES[DEFAULT_PALETTE], size, 'approach');
    return rec.trace.inks.filter((ink) => ink.colour === '#ff2238' || ink.colour === '#ffe4e4').length;
  }

  it('THE REPORTED ONE: the lightning is on nearly every frame, so it is across the whole body', () => {
    /*
      ⚠️ **THE ARITHMETIC IS WHY TWO FRAMES WAS NOT *ACROSS THE BODY*.** `Aura.stride` is 1 and the body is
      twenty-six nodes, so node `k` wears frame `(t + k) % 6` — with two of six lit, **nine of the
      twenty-seven flames** carry lightning at any instant. That is *spread* in the model and reads as a row
      of sparks in the picture, because two thirds of the animal is dark at every moment.

      ⚠️ **AND NOT ALL SIX, WHICH IS THE OTHER HALF OF THE WORD.** *Flickers* means something goes out. At
      five of six each node is dark one frame in six and the dark one walks down the body.
    */
    const storm = [0, 1, 2, 3, 4, 5].map((i) => sparks(`serpentStorm${i}` as SpriteKind));
    const lit = storm.filter((n) => n > 0).length;
    expect(lit, `${lit} of the storm's six frames carry lightning — ${storm.join(', ')} strokes each`).toBe(5);
    // And the void phase's aura carries none at all, which is what makes the two phases tellable apart.
    for (let i = 0; i < 6; i++) {
      expect(sparks(`serpentAura${i}` as SpriteKind), `the void phase's aura frame ${i} crackles`).toBe(0);
    }
  });

  /*
    ── THE HORNS HAVE NO GUARD OF THEIR OWN HERE, AND `npm run prove` IS WHY ──────────────────────

    ⚠️ **ONE WAS WRITTEN AND IT DID NOT FIRE.** *"Each step of the ladder at least as big as the one
    before"* looked like the shape of the escalation and is satisfied by the very numbers it was written
    to refuse: a horn grows from a base offset, so 0305's 1 → 1.5 → 2 reaches **11.6 → 13.9 → 16.4**
    world units, and the second step (2.5) is already bigger than the first (2.3). The probe that puts
    0305's ladder back reported STILL GREEN — `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`.

    ⚠️ **AND THE TIGHTER VERSION WOULD HAVE BEEN A CONTENT LIMITER.** *At least twice the first step*
    would have fired, and it is exactly what
    `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md` refuses: a boss whose horns leap early
    and creep late is a fight somebody is entitled to author, and a threshold here answers that question
    before it is asked. **How much is a taste**, and the eye that reported *"the horns need to grow"* is
    the instrument for it.

    ⚠️ **WHAT IS STILL HELD IS THE DIRECTION AND THE CEILING.** 0305's own guard holds that the horns
    grow at the void phase and grow again at the lightning; `tests/accents.test.ts` holds that no mark
    leaves 1.16 of the drawing radius, which is what makes 3 the last rung inside the tile. The
    measurements are in the decision.
  */

  it('and the CROWN flares for half a second before a strike, and at no other time', () => {
    /*
      ⚠️ **ASKED FOR AS A TIME AND HELD AS ONE**: *".5sec before the lightning attack happens."* The flare is
      read off the bolt already in the air rather than a timer of its own — a `rain` bolt strikes on the step
      its `lifeFor` reaches `BOLT_STEPS` — so what this drives is the whole round, watching which bitmap the
      head's flame wears against how far the nearest strike is from landing.

      ⚠️ **AND THE BODY MUST NOT FLARE, which is the half that makes it the horns.** The nodes go on crackling
      at their own rate; if they flared too, the tell would be the animal getting brighter.
    */
    const aura = phaseFor(BOSSES.jormungandr, BOSSES.jormungandr.health * 0.2).look?.aura;
    expect(aura?.flare, 'the lightning phase authors no flare at all').toBeDefined();
    const flare = new Set(aura!.flare!);
    const { world, frame } = serpentAt(0.2);
    armRain(world.bossPool.at(0));
    /*
      ⚠️ **THE FIXTURE HOLDS THE GATE OFF WHILE IT ARRIVES AND THIS IS THE ONE TEST THAT NEEDS IT OPEN.**
      `serpentAt` parks `fireIn` at 999 through the approach so a count starts on a boss standing still;
      letting it go is what makes the round turn over and the lightning fall. The ship is kept alive and
      untouchable because a strike that ended the run would end the measurement with it — and an invuln
      ship changes nothing about a bolt's own clock, which is the thing being watched.
    */
    world.bossPool.at(0).fireIn = 1;
    let within = 0;
    let outside = 0;
    let onTheBody = 0;
    let strikes = 0;
    for (let i = 0; i < 900; i++) {
      world.bossPool.at(0).health = world.bossFullHealth * 0.2;
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      frame.step();
      if (world.bossAura.size === 0) continue;
      /*
        How far the nearest strike is from landing, or `Infinity` when none is in the air.

        ⚠️ **A BOLT AT EXACTLY `BOLT_STEPS` IS STRIKING THIS STEP AND IS ZERO AWAY, NOT ABSENT.** The first
        version skipped those with the ones already fading, and reported six flares a run *outside* the
        window — every one of them on a step whose bolts were all at 8. `layAura` runs before the bolts'
        clocks do, so it saw 9 and the pool read after the step says 8: the flare was right and the
        measurement was calling a strike in progress *no strike at all*.
      */
      let until = Number.POSITIVE_INFINITY;
      for (let b = 0; b < world.bolts.size; b++) {
        const bolt = world.bolts.at(b);
        if (bolt.kind !== RAIN_BOLT_KIND || bolt.lifeFor < BOLT_STEPS) continue;
        until = Math.min(until, bolt.lifeFor - BOLT_STEPS);
      }
      if (until <= 1) strikes++;
      /*
        ⚠️ **THIRTY-ONE AND NOT THIRTY, AND THE ONE STEP IS THE MEASUREMENT'S RATHER THAN THE CODE'S.** The
        bolt's clock runs down inside the same `step()` that laid the flame, so the pool read after it is
        one tick further on than `layAura` saw. The window is thirty; this is thirty as read from here.
      */
      const head = world.bossAura.at(world.bossAura.size - 1);
      if (flare.has(head.sprite)) {
        if (until <= 31) within++;
        else outside++;
      }
      for (let k = 0; k < world.bossAura.size - 1; k++) if (flare.has(world.bossAura.at(k).sprite)) onTheBody++;
    }
    expect(strikes, 'no strike ever came, so nothing about the half-second before one was measured').toBeGreaterThan(2);
    expect(within, 'the crown never flared at all in the half-second before a strike').toBeGreaterThan(30);
    expect(outside, `the crown flared on ${outside} steps with no strike inside half a second of landing`).toBe(0);
    expect(onTheBody, `${onTheBody} body flames wore the crown's discharge — the flare is the horns, not the weather`).toBe(0);
  });

  it('and the flare is drawn where the horns are, which is the one thing the bake has to assume', () => {
    /*
      ⚠️ **THE BAKE CANNOT SEE THE ROW AND THE ROW CANNOT SEE THE BAKE.** `paintSerpentFlare` puts the
      discharge on the grown horn tips, and to do that it has to know how much bigger than its tile the
      head's flame is blitted — which is `aura.head / SERPENT_BODY_DIAMETER`, a number on the boss row.
      Importing `BOSSES` into `src/render/bake.ts` would make every sprite in the game depend on the boss
      table; this asserts the two agree instead, which is the shape `src/content/sprites.ts` uses for the
      atlas order and the reason it gives.

      ⚠️ **AND THE DISCHARGE IS OUTSIDE THE SKULL, WHICH IS THE HALF A PICTURE OF THE TILE CANNOT SHOW.**
      `scripts/shot-sheet.mjs` photographs the flame alone; in the fight the head is drawn over it, so what
      makes this a flare on the horns rather than a scribble behind the face is that its marks sit further
      out than the skull's own drawing reaches. In world units, across two tiles of different extents.
    */
    const aura = phaseFor(BOSSES.jormungandr, BOSSES.jormungandr.health * 0.2).look?.aura;
    expect(aura!.head / SERPENT_BODY_DIAMETER, 'the bake and the row disagree about how big the head’s flame is').toBeCloseTo(
      FLARE_SWELL,
      10,
    );
    const skull = worldReach('boss8Horn3');
    const discharge = worldReach('serpentFlare0', '#ff2238', FLARE_SWELL);
    expect(
      discharge,
      `the crown's discharge reaches ${discharge.toFixed(1)} world units where the skull itself reaches ` +
        `${skull.toFixed(1)} — it is behind the face rather than off the horns`,
    ).toBeGreaterThan(skull * 0.8);
  });
});

describe('0305 — the serpent darkens', () => {
  /** The phase the serpent is standing in, and the look it wears there. */
  const lookAt = (fraction: number) => phaseFor(BOSSES.jormungandr, BOSSES.jormungandr.health * fraction).look;

  it('THE REPORTED ONE: the void phase burns with an aura behind every node and the head, the lightning phase with another, and neither while whole', () => {
    /*
      ⚠️ **ASKED FOR**: *"when the void blast phase starts it needs to look more menacing and have a dark
      aura, kind of like a super saiyan aura… and then when the lightning attack phase starts it needs
      to get a super saiyan red lightning flicker through the aura."* Driven, because the table is not
      the fight: a flame is where its node is on the step, and there is one for every node and the head.
    */
    const hurtAura = lookAt(0.6)?.aura ?? null;
    const lastAura = lookAt(0.3)?.aura ?? null;
    expect(hurtAura, 'the void phase burns with no aura').not.toBeNull();
    expect(lastAura, 'the lightning phase burns with no aura').not.toBeNull();
    expect(new Set([...lastAura!.frames]).size, 'the lightning phase’s aura is the void phase’s, with nothing through it').toBe(lastAura!.frames.length);
    expect(lastAura!.frames.some((f) => hurtAura!.frames.includes(f)), 'the lightning phase wears the void phase’s very frames').toBe(false);
    for (const [fraction, aura] of [
      [1, null],
      [0.6, hurtAura],
      [0.3, lastAura],
    ] as const) {
      const { world, frame } = serpentAt(fraction);
      frame.step();
      const boss = world.bossPool.at(0);
      if (aura === null) {
        expect(world.bossAura.size, 'the serpent burns while whole — the aura is the void phase’s arrival').toBe(0);
        continue;
      }
      expect(world.bossAura.size, `at ${fraction} the aura is not one flame per node and one for the head`).toBe(world.bossBody.size + 1);
      for (let i = 0; i < world.bossAura.size; i++) {
        const flame = world.bossAura.at(i);
        const on = i < world.bossBody.size ? world.bossBody.at(i) : boss;
        expect(Math.hypot(flame.along - on.along, flame.across - on.across), 'a flame is not where its node is').toBeLessThan(1e-9);
        expect(aura.frames.includes(flame.sprite), 'a flame wears a frame its phase does not author').toBe(true);
      }
    }
    /*
      ⚠️ **AND IT IS BEHIND THE BODY, WHICH IS WHAT MAKES IT AN AURA.** In front, a flame lies over the
      flesh of the node beside it. Read off the GAME's draw order in `src/app/mount.ts`, as
      `tests/thrust.test.ts` reads the exhaust's — the fixture's is a hand copy of it, and a guard over
      the copy would prove the copy.
    */
    const source = readFileSync(resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/app/mount.ts'), 'utf8');
    const order = /layers: \[([^\]]+)\]/.exec(source)![1]!.split(',').map((s) => s.trim());
    expect(order.indexOf('bossAura'), 'the aura is not drawn at all').toBeGreaterThanOrEqual(0);
    expect(order.indexOf('bossAura'), 'the aura is drawn over the body it burns behind').toBeLessThan(order.indexOf('bossBody'));
  });

  it('and it FLICKERS: neighbouring flames wear different frames, and a flame changes frame as the fight goes on', () => {
    /*
      *"Flicker"* is the word, and a still aura is a glow. Both halves in the picture's own terms: at one
      moment the body is not one frame end to end, and a moment later the flames have moved on.
    */
    const { world, frame } = serpentAt(0.6);
    frame.step();
    const at = (): number[] => Array.from({ length: world.bossAura.size }, (_, i) => world.bossAura.at(i).sprite);
    const now = at();
    expect(new Set(now).size, 'every flame on the body wears the same frame, so the aura blinks rather than flickers').toBeGreaterThan(1);
    for (let i = 0; i < 12; i++) frame.step();
    const later = at();
    expect(later.filter((s, i) => s !== now[i]).length, 'a fifth of a second on and no flame has changed').toBeGreaterThan(now.length / 2);
  });

  it('THE REPORTED ONE: the horns grow at the void phase and grow again at the lightning — in the picture, and nothing else about the head does', () => {
    /*
      ⚠️ **ASKED FOR**: *"it's horns grow longer"*, then *"it's horns grow a bit longer again."* Measured
      on the traced hull at the size the sprite is drawn on a 1280×720 screen, so a pixel here is a pixel
      of the fight — 0027. The horn tips are the highest thing on the skull, so how far the hull reaches
      above its centre IS the horns; how far it reaches below is the jaw, which must not move.
    */
    const scale = viewOf(1280, 720).scale;
    const reach = (index: number): { up: number; down: number } => {
      const kind = SPRITE_KINDS[index]!;
      const size = SPRITE_EXTENT[kind] * scale;
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'approach');
      const hull = trace.passes[0]!.subpaths[0]!;
      return { up: size / 2 - Math.min(...hull.map(([, y]) => y)), down: Math.max(...hull.map(([, y]) => y)) - size / 2 };
    };
    const whole = reach(BOSSES.jormungandr.face!.rest);
    const hurt = reach(lookAt(0.6)!.face.rest);
    const last = reach(lookAt(0.3)!.face.rest);
    expect(hurt.up - whole.up, `the void phase's horns reach ${(hurt.up - whole.up).toFixed(1)}px further — not longer`).toBeGreaterThan(2);
    expect(last.up - hurt.up, `the lightning phase's horns reach ${(last.up - hurt.up).toFixed(1)}px further again — not longer again`).toBeGreaterThan(1);
    for (const [name, stage] of [
      ['void', hurt],
      ['lightning', last],
    ] as const) {
      expect(Math.abs(stage.down - whole.down), `the ${name} phase's skull is a different size below the horns — the head grew, not the horns`).toBeLessThan(0.5);
    }
    // And every face of a phase wears that phase's horns, or they would shrink each time the jaw moved.
    for (const fraction of [0.6, 0.3]) {
      const face = lookAt(fraction)!.face;
      const tall = reach(face.rest).up;
      for (const other of [face.up, face.down, face.gape, face.shut]) {
        expect(Math.abs(reach(other).up - tall), `a face at ${fraction} wears different horns from its resting one`).toBeLessThan(1);
      }
    }
  });

  it('and the red lightning is through the lightning phase’s aura, on some of its frames and not all — and never through the void phase’s', () => {
    /*
      *"A super saiyan red lightning flicker through the aura."* A flicker is on and off; a bolt on
      every frame is a second aura drawn in red. Read off the trace of the real drawing: a stroke is
      lightning, and the aura's own flame is fills.
    */
    const strokesIn = (index: number): number => {
      const kind = SPRITE_KINDS[index]!;
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], SPRITE_EXTENT[kind] * 8, 'approach');
      return trace.inks.length;
    };
    const hurt = lookAt(0.6)!.aura!.frames.map(strokesIn);
    const last = lookAt(0.3)!.aura!.frames.map(strokesIn);
    expect(hurt.every((n) => n === 0), 'the void phase’s aura has lightning in it before the lightning phase').toBe(true);
    expect(last.some((n) => n > 0), 'the lightning phase’s aura has no lightning in it').toBe(true);
    expect(last.some((n) => n === 0), 'every frame of the lightning phase’s aura is lit, so it glows red rather than flickering').toBe(true);
  });
});

describe('0306 — the serpent coils in', () => {
  /** One step of the entrance, as the picture has it: every node and the head, in the camera's frame. */
  interface Pose {
    entering: number;
    head: { along: number; across: number; turn: number; velAlong: number; velAcross: number };
    body: { along: number; across: number; radius: number }[];
    /** The furthest any node is drawn moving between two frames of this step, in world units. */
    jump: number;
  }

  /**
   * Fly the serpent from the moment it is put on the field until its entrance has handed over, with
   * an untouchable ship that holds its fire, recording every step.
   */
  function flyEntrance(): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame; poses: Pose[] } {
    const { world } = playableWorld(SERPENT_ONLY);
    const frame = new GameFrame(world);
    const poses: Pose[] = [];
    for (let i = 0; i < 2400; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      frame.step();
      if (world.bossPool.size === 0) continue;
      const head = world.bossPool.at(0);
      poses.push({
        entering: world.bossEntering,
        head: { along: head.along - world.cameraAlong, across: head.across, turn: head.turn, velAlong: head.velAlong - world.scrollPerStep, velAcross: head.velAcross },
        body: Array.from({ length: world.bossBody.size }, (_, k) => {
          const n = world.bossBody.at(k);
          return { along: n.along - world.cameraAlong, across: n.across, radius: n.radius };
        }),
        jump: Math.max(0, ...Array.from({ length: world.bossBody.size }, (_, k) => {
          const n = world.bossBody.at(k);
          return Math.hypot(n.along - n.prevAlong, n.across - n.prevAcross);
        })),
      });
      if (world.bossEntering < 0 && poses.length > 1) break;
    }
    return { world, frame, poses };
  }

  it('THE REPORTED ONE: it flies in, coils ROUND the middle of the screen leaving the centre open, goes off, and then arrives where it always has', () => {
    /*
      ⚠️ **ASKED FOR**: *"can we make it fly onto screen, do a coil, fly off and then enter where it is
      now?"* — and *"there's needs to be a gap in the center of the screen. Players can learn the
      pattern."* Four claims, each measured off the animal the frame actually flew, in world units
      the player's own lane is measured in (0027): the head goes all the way round a point; nothing
      of the animal comes within a third of the lane of that point, so the middle is a place to be;
      the whole animal is off the screen before it comes back; and then it is the fight it always was.
    */
    const entrance = BOSSES.jormungandr.entrance!;
    expect(entrance, 'the serpent makes no entrance').not.toBeNull();
    const { world, frame, poses } = flyEntrance();
    const flying = poses.filter((p) => p.entering >= 0);
    expect(flying.length, 'the serpent arrived without an entrance').toBeGreaterThan(60);
    // Round: the head's bearing about the coil's centre, unwrapped, turns through a whole circle.
    const { along: cx, across: cy } = entrance.centre;
    let wound = 0;
    for (let i = 1; i < flying.length; i++) {
      let d = Math.atan2(flying[i]!.head.across - cy, flying[i]!.head.along - cx) - Math.atan2(flying[i - 1]!.head.across - cy, flying[i - 1]!.head.along - cx);
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      wound += d;
    }
    expect(Math.abs(wound), `the head went ${((Math.abs(wound) * 180) / Math.PI).toFixed(0)}° round the centre — not a coil`).toBeGreaterThan(2 * Math.PI);
    /*
      ⚠️ **OPEN IN THE MIDDLE, ASKED AS THE PLAYER WOULD ASK IT: DOES A SHIP SITTING THERE GET HIT?** A
      first draft held the hole to a third of the lane, and that was a number chosen here rather than
      a thing asked for — 0295's *a threshold answers the question before it is asked*. *"Players can
      learn the pattern to avoid the damage"* is the claim, so the guard is the pattern learned: a live
      ship, hurtbox and all, parked in the middle of the coil for the whole of a fully-live entrance.
    */
    {
      const parked = playableWorld(SERPENT_ONLY).world;
      const flown = new GameFrame(parked);
      let hits = 0;
      let seen = 0;
      for (let i = 0; i < 2400 && !(parked.bossPool.size > 0 && parked.bossEntering < 0); i++) {
        parked.fireIn = Number.MAX_SAFE_INTEGER;
        parked.missileIn = Number.MAX_SAFE_INTEGER;
        parked.ship.health = parked.shipRow.health;
        parked.ship.invulnFor = 0;
        parked.ship.along = parked.cameraAlong + cx;
        parked.ship.across = cy;
        parked.ship.prevAlong = parked.ship.along;
        parked.ship.prevAcross = parked.ship.across;
        flown.step();
        if (parked.bossEntering > 0) seen++;
        if (parked.ship.health < parked.shipRow.health) hits++;
      }
      expect(seen, 'the parked ship never saw the entrance, so this measures nothing').toBeGreaterThan(60);
      expect(hits, 'a ship sitting in the middle of the coil was hit — there is no gap to learn').toBe(0);
    }
    // And the middle IS the middle: the coil's centre is inside the narrowest screen, in its middle third.
    const narrowest = viewOf(1280, 720).alongSpan;
    expect(cx / narrowest, 'the coil is not round the middle of the screen').toBeGreaterThan(1 / 3);
    expect(cx / narrowest, 'the coil is not round the middle of the screen').toBeLessThan(2 / 3);
    // Off: on the last step of the entrance, every node and the head are clear of the widest screen.
    const last = flying[flying.length - 1]!;
    const widest = viewOf(2400, 1000).alongSpan;
    const clear = (along: number, across: number, r: number): boolean => across - r > ACROSS_SPAN || across + r < 0 || along - r > widest || along + r < 0;
    expect(clear(last.head.along, last.head.across, BOSSES.jormungandr.radius), 'the head was still on the screen when the arrival took over').toBe(true);
    expect(last.body.every((n) => clear(n.along, n.across, n.radius)), 'some of the body was still on the screen when the arrival took over — a jump anybody could see').toBe(true);
    /*
      ⚠️ **AND THE BODY IS LAID THERE, NOT DRAWN SLIDING THERE.** The step the arrival takes over, every
      node goes from off the bottom of the screen to off its leading edge; the renderer draws between
      where a node was and where it is, so a node that was moved rather than laid is drawn for a frame
      across the corner in between.
    */
    const handed = poses[poses.indexOf(last) + 1];
    expect(handed, 'the entrance never handed over').toBeDefined();
    expect(handed!.jump, `a node was drawn sliding ${handed!.jump.toFixed(0)} units across the screen as the arrival took over`).toBeLessThan(5);
    // Then where it is now: the arrival every boss has, from the place it was put on the field, to its
    // station — within the drift and the rear its row authors.
    for (let i = 0; i < 700; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      frame.step();
    }
    const row = BOSSES.jormungandr;
    const band = row.drift + (row.move.kind === 'bob' ? row.move.rear : 0) + 1;
    const standing = world.bossPool.at(0).along - world.cameraAlong;
    expect(Math.abs(standing - row.station), `the serpent stands ${standing.toFixed(1)} units ahead after its entrance, not on its station`).toBeLessThan(band);
  });

  it('and nothing it throws, and nothing that hits it, until the fight begins — but a ship that touches it is hit', () => {
    /*
      ⚠️ **"NOT-SHOOTABLE, FULLY LIVE."** Driven three ways during the entrance: a pulse laid on the head
      and on a node goes on flying and takes nothing off the serpent; the serpent throws nothing; and a
      ship put on its body loses a life's worth of hull.
    */
    const { world } = playableWorld(SERPENT_ONLY);
    const frame = new GameFrame(world);
    for (let i = 0; i < 400 && (world.bossPool.size === 0 || world.bossEntering < 150); i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      frame.step();
    }
    expect(world.bossEntering, 'the serpent is not making its entrance, so this measures nothing').toBeGreaterThan(0);
    const boss = world.bossPool.at(0);
    const whole = boss.health;
    let thrown = 0;
    for (let i = 0; i < 30; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      world.playerShots.clear();
      const node = world.bossBody.at(Math.floor(world.bossBody.size / 2));
      for (const on of [boss, node]) {
        const shot = world.playerShots.spawn()!;
        reset(shot, on.along, on.across, SHOTS.pulse, SHOT_INDEX.pulse);
      }
      const before = world.enemyShots.size;
      frame.step();
      thrown += Math.max(0, world.enemyShots.size - before) + world.bolts.size;
      expect(world.playerShots.size, 'a shot laid on the serpent was spent on it — its entrance is not shootable').toBe(2);
    }
    expect(boss.health, 'the serpent took damage while making its entrance').toBe(whole);
    expect(thrown, 'the serpent threw something while making its entrance').toBe(0);
    // Fully live: the ship put on its flank.
    const node = world.bossBody.at(Math.floor(world.bossBody.size / 2));
    world.ship.invulnFor = 0;
    world.ship.health = world.shipRow.health;
    world.ship.along = node.along;
    world.ship.across = node.across;
    world.ship.prevAlong = node.along;
    world.ship.prevAcross = node.across;
    const hull = world.ship.health;
    frame.step();
    expect(world.ship.health, 'a ship flown into the serpent’s body during its entrance took no hit').toBeLessThan(hull);
  });

  it('and its head faces where it flies, its body turned along the coil — in the picture as well as the model', () => {
    /*
      ⚠️ **THE HEAD IS BAKED FACING DOWN THE LANE AND A COIL FLIES IT EVERY WAY**, which is why the
      renderer learned to turn a bitmap (0306). What is asked is what the player sees: the turn the
      painter is HANDED for the head, against the way the head is travelling — and zero once the fight
      begins, where the face watches the ship rather than its own path.
    */
    const { poses } = flyEntrance();
    const round = poses.filter((p) => p.entering >= 0 && Math.hypot(p.head.velAlong, p.head.velAcross) > 0.5);
    expect(round.length, 'the head never flew, so this measures nothing').toBeGreaterThan(60);
    let worst = 0;
    for (const p of round) {
      const heading = Math.atan2(p.head.velAcross, p.head.velAlong);
      let off = p.head.turn - (heading - Math.PI);
      off = Math.atan2(Math.sin(off), Math.cos(off));
      worst = Math.max(worst, Math.abs(off));
    }
    expect((worst * 180) / Math.PI, 'the head faced somewhere other than where it was flying').toBeLessThan(6);
    const turns = new Set(round.map((p) => Math.round(p.head.turn * 4)));
    expect(turns.size, 'the head never turned — it flew the coil facing one way').toBeGreaterThan(4);

    // The picture: a surface that keeps the turn each blit is handed, painted during the coil.
    class Turns implements Surface {
      readonly handed = new Map<number, number[]>();
      clear(): void {}
      bolt(): void {}
      blit(sprite: number, _x: number, _y: number, _scale: number, turn = 0): void {
        const list = this.handed.get(sprite) ?? [];
        list.push(turn);
        this.handed.set(sprite, list);
      }
    }
    const { world } = playableWorld(SERPENT_ONLY);
    const frame = new GameFrame(world);
    const surface = new Turns();
    for (let i = 0; i < 2400 && !(world.bossPool.size > 0 && world.bossEntering < 0); i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      frame.step();
      if (world.bossEntering > 0) paintScene(surface, world.view, world.layers, world.cameraAlong, 0.5);
    }
    const headTurns = surface.handed.get(BOSSES.jormungandr.sprite) ?? [];
    expect(headTurns.length, 'the head was never painted during its entrance').toBeGreaterThan(0);
    expect(headTurns.some((t) => Math.abs(t) > 1), 'the painter was never handed a turn for the head — it is drawn facing down the lane round the whole coil').toBe(true);
    const bodyTurns = surface.handed.get(BOSSES.jormungandr.chain!.sprite) ?? [];
    expect(bodyTurns.some((t) => Math.abs(t) > 1), 'the body was never turned along the coil').toBe(true);
    // And once the fight begins the head faces down the lane again.
    for (let i = 0; i < 60; i++) frame.step();
    expect(world.bossPool.at(0).turn, 'the head is still turned after the entrance handed over').toBe(0);
  });
});

describe('0307 — the serpent is armoured', () => {
  it('flown at the cap on the tuned tier, no gun kills the serpent inside forty seconds from any place, and every phase gets eight volleys away', () => {
    /*
      ⚠️ **0260's FLOOR, IN THE FIGHT RATHER THAN IN THE ARITHMETIC.** *"I think I only saw about 50%
      of their attacks before they died"* — so a real boss lasts forty seconds at max weapons on the
      tuned tier and every phase gets eight volleys away. `tests/level.test.ts` holds that as
      `health × toughness / FASTEST`, which is every shot of the fullest loadout counting in full;
      armour is an arrival that counts for nothing, so that line skips this boss and this one flies
      it, through `scripts/weigh-boss.mjs`.

      ⚠️ **THE QUICKEST FIGHT OF ALL OF THEM, BECAUSE THE FLOOR IS ABOUT THE WORST CASE.** Each gun is
      flown from fifteen held places and on the boss's own lane at three distances, and only the
      quickest has to clear forty: a floor met on average is a boss that evaporates for whoever found
      the right place, and that player is the one who reported 0260. Measured when this landed: the
      arc, 41 seconds from its best place; the shuriken, 53; the pulse on the head's lane at 45
      units, 58.

      ⚠️ **CAPPED AT FOUR MINUTES, WHICH NO QUICKEST FIGHT COMES NEAR.** A place the gun cannot reach
      from never ends, and ten minutes of it three times over is the cost of this test and none of
      its claim.
    */
    const row = BOSSES.jormungandr;
    const tuned = DIFFICULTIES.savior;
    for (const gun of WEAPON_KINDS) {
      let quickest: ReturnType<typeof flyFight> | null = null;
      for (const lane of [...LANES, 'boss' as const]) {
        for (const short of DISTANCES) {
          const fight = flyFight('jormungandr', gun, { lane, short, cap: 240 });
          if (fight.seconds !== null && (quickest === null || fight.seconds < quickest.seconds!)) quickest = fight;
        }
      }
      expect(quickest, `the ${gun} never killed the serpent from any place, so this measured nothing`).not.toBeNull();
      expect(quickest!.seconds!, `the ${gun} kills the serpent in ${quickest!.seconds!.toFixed(1)}s at the cap on the tuned tier`).toBeGreaterThanOrEqual(40);
      expect(
        quickest!.phaseAt.map((p) => p.phase),
        `the ${gun}'s quickest fight skipped a phase, so an attack was never thrown at all`,
      ).toEqual(row.phases.map((_phase, i) => i));
      quickest!.phaseAt.forEach((entered, i) => {
        const ends = quickest!.phaseAt[i + 1]?.at ?? quickest!.seconds!;
        const volleys = ((ends - entered.at) * STEPS_PER_SECOND) / fireGapFor(row.phases[entered.phase]!.fireEvery, tuned);
        expect(
          volleys,
          `against the ${gun}, the serpent's phase ${entered.phase + 1} lasts ${(ends - entered.at).toFixed(1)}s and gets ${volleys.toFixed(1)} volleys away`,
        ).toBeGreaterThanOrEqual(8);
      });
    }
  });
});

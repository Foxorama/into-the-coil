/**
 * The Hamster Ball rolls — `docs/decisions/0593-the-hamster-ball-rolls.md`, item 2 of
 * [`the-secret-pilots-planned`](../reports/the-secret-pilots-planned-2026-10-11.md) — and takes its knocks,
 * `docs/decisions/0609-the-ball-takes-its-knocks.md`.
 *
 * The page: *"Least Weasel Pilot — Hamster ball — flies into things to kill them — how to die? / challenge —
 * Unlock – 10 non-bullet deaths — "overheat" → need to let shields recharge. Hamster ball break + recharge."*
 * Answered while it was planned: *"No weapon change for hamster ball"*, and *"hints for unlocks is good"*.
 * And after it was played: *"let's change it so it gets 3 shields on every difficulty and instead of the ball
 * disappearing on ram, it has a shield regen rate - currently it's way too punishing with the bullets."*
 *
 * ⚠️ **THROUGH THE REAL STEP, NEVER BY WRITING INTO THE GAUGE.** What is under test is the ram landing
 * through the pairings that exist, the heat its landings raise, what that heat costs, and the shell coming
 * back — a fixture that set `ramHeat` or `health` by hand mid-flight could see none of it. The one place the
 * gauge is held cool is said where it is, and it is there to take the heat OUT of a claim about bodies.
 *
 * ⚠️ **IN THE PLAYER'S UNITS WHERE THERE ARE ANY** — 0027: seconds to a shield back, and which picture the
 * ship and its heat are drawn as on a given step.
 *
 * 0593's claims about a broken ball — drawn bare, ramming nothing, hurt by bodies, mending after its
 * `recharge` — went with the break, which 0609 took out. The decision says so.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, RAM_KIND, canThrow, launchSpecial, respawn, wearHull, type World } from '../src/app/frame.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { GOLFERS } from '../src/content/golfers.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { BALL_RADIUS, MAX_SHIELDS, SHIPS, SHIP_KINDS, fitted, fullHealthFor, openingHealthFor, shieldsOf } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { SPRITE } from '../src/content/sprites.ts';
import type { CueKind } from '../src/content/cues.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_MARGIN } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND, lockHint, gunWhy } from '../src/state/screens.ts';
import { gunOpen, initialHangar, pilotRecord } from '../src/state/slices/hangar.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const RAM = WEAPONS.ram.ram!;
const DANCE = SPECIALS.warDance.dance!;
const REGEN = SHIPS.ball.regen!;
/** The ball's health with its whole shell on. */
const FULL = SHIPS.ball.health + SHIPS.ball.shields!;

/** A world flying the Hamster Ball, its gun held off nothing — there is nothing to hold off. */
function inTheBall(level: LevelRow = NO_LEVEL): { world: World; frame: GameFrame; cues: CueKind[] } {
  const built = playableWorld(level);
  built.world.shipRow = fitted(SHIPS.ball, 'ram');
  built.world.weapon = weaponFor(built.world.shipRow, []);
  built.world.missileIn = Number.MAX_SAFE_INTEGER;
  // A life in the ball, as the run would open it: its own shell, whatever the tier.
  respawn(built.world);
  wearHull(built.world);
  const cues: CueKind[] = [];
  built.world.onCue = (kind) => {
    cues.push(kind);
  };
  return { world: built.world, frame: new GameFrame(built.world), cues };
}

/** A body planted on the ship, riding the camera and holding its fire — `health` of it. */
function bodyOn(world: World, health: number): Entity {
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along, world.ship.across, ENEMIES.drifter);
  enemy.health = health;
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

/**
 * One step with every body laid back on the ball — 0615: a body the ball cannot break knocks it off, so a
 * fixture asking what the ball does PRESSED into one holds it there, as a player holding the stick into it does.
 */
function pressed(world: World, frame: GameFrame): void {
  for (let i = 0; i < world.enemies.size; i++) {
    const e = world.enemies.at(i);
    e.along = e.prevAlong = world.ship.along;
    e.across = e.prevAcross = world.ship.across;
  }
  frame.step();
}

/** An enemy shot laid on the ship, so it lands on the next step. */
function shotOn(world: World): void {
  const shot = world.enemyShots.spawn()!;
  reset(shot, world.ship.along, world.ship.across, SHOTS.spit);
  shot.velAlong = world.scrollPerStep;
}

/** The ram's body, if the ship is ramming. */
function ramBody(world: World) {
  for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i).kind === RAM_KIND) return world.playerShots.at(i);
  return null;
}

describe('0593 — the ask: Unity in a hamster ball, flying into things', () => {
  it('Unity flies the ball, and the ball flies the ram and nothing else', () => {
    expect(GOLFERS.unity.ship).toBe('ball');
    expect(GOLFERS.unity.figure).toBe('weasel');
    expect(SHIPS.ball.weapon).toBe('ram');
    expect(WEAPONS.ram.flight).toBe('ram');
    expect(WEAPONS.ram.special).toBe('warDance');
  });

  it('opens after ten lives lost to something flown into, and the band counts them down', () => {
    expect(GOLFERS.unity.opens).toEqual({ after: [], crashes: 10, bought: 0, tiers: [] });
    expect(lockHint(GOLFERS.unity.opens, pilotRecord(initialHangar), 'Unity')).toBe('Lose 10 more lives to a crash to fly Unity');
    expect(lockHint(GOLFERS.unity.opens, pilotRecord({ ...initialHangar, crashes: 9 }), 'Unity')).toBe('Lose 1 more life to a crash to fly Unity');
    expect(lockHint(GOLFERS.unity.opens, pilotRecord({ ...initialHangar, crashes: 10 }), 'Unity')).toBe(null);
  });

  it('the ram reaches to the drawn ball, and the dance as far', () => {
    expect(RAM.reach).toBe(BALL_RADIUS);
    expect(SHOTS.ram.radius).toBe(BALL_RADIUS);
    expect(DANCE.reach).toBe(BALL_RADIUS);
  });
});

describe('0593 — the ram lands on what the ball flies into', () => {
  it('a body the ball flies into is rammed to death, and the ship is not hurt by it', () => {
    const { world, frame } = inTheBall();
    world.ship.invulnFor = 0;
    const health = world.ship.health;
    bodyOn(world, 1);
    let killed = false;
    for (let i = 0; i < 30 && !killed; i++) {
      frame.step();
      killed = world.enemies.size === 0;
    }
    expect(killed, 'the ball sat on a body for half a second and it did not die').toBe(true);
    expect(world.ship.health, 'the body the ball rammed hurt the ship').toBe(health);
    // And one that will not die, pressed on it with no window a hit gives. The gauge is held cool here and
    // only here: what this asks is whether a BODY hurts the ball, and a burn is the heat's (below).
    bodyOn(world, 100000);
    for (let i = 0; i < 2 * STEPS_PER_SECOND; i++) {
      world.ship.invulnFor = 0;
      world.ramHeat = 0;
      frame.step();
      expect(world.ship.health, `a body hurt the ball ${i + 1} steps in`).toBe(health);
    }
  });

  it('the heat cools once the ball has touched nothing for a while', () => {
    const { world, frame } = inTheBall();
    bodyOn(world, 100000);
    for (let i = 0; i < 30 && world.ramHeat < 0.3; i++) pressed(world, frame);
    world.enemies.clear();
    const hot = world.ramHeat;
    expect(hot).toBeGreaterThan(0);
    for (let i = 0; i < RAM.cool; i++) frame.step();
    expect(world.ramHeat, 'it cooled before its row says it starts to').toBe(hot);
    for (let i = 0; i < 2 * STEPS_PER_SECOND; i++) frame.step();
    expect(world.ramHeat, 'two seconds touching nothing and it did not cool').toBeLessThan(hot);
  });

  it('the heat is drawn: the ram under the ball wears the gauge’s stage', () => {
    const { world, frame } = inTheBall();
    frame.step();
    expect(ramBody(world)?.sprite).toBe(SPRITE.ramHeat0);
    bodyOn(world, 100000);
    for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ramHeat < 0.8; i++) pressed(world, frame);
    pressed(world, frame);
    expect(ramBody(world)?.sprite, `at ${world.ramHeat.toFixed(2)} of the gauge the heat under the ball is not drawn`).toBe(SPRITE.ramHeat3);
  });

  /** The heat laid over the ball this step — 0648 — or `null` for none. */
  function glowOn(world: World): number | null {
    const glows: number[] = [SPRITE.ramGlow1, SPRITE.ramGlow2, SPRITE.ramGlow3, SPRITE.ramGlow4];
    for (let i = 0; i < world.wheels.size; i++) if (glows.includes(world.wheels.at(i).sprite)) return world.wheels.at(i).sprite;
    return null;
  }

  it('0648: the ball itself goes yellow, amber and red with its heat, and nothing while it is cool', () => {
    const { world, frame } = inTheBall();
    const at = (heat: number): number | null => {
      world.ramHeat = heat;
      frame.step();
      return glowOn(world);
    };
    expect(at(0.1), 'a cool ball wore a glow').toBe(null);
    expect(at(0.3), 'a quarter hot and not yellow').toBe(SPRITE.ramGlow1);
    expect(at(0.6), 'half hot and not amber').toBe(SPRITE.ramGlow2);
    expect([SPRITE.ramGlow3, SPRITE.ramGlow4], 'three quarters hot and not red').toContain(at(0.9));
    const glow = world.wheels.at(0);
    expect(glow.along, 'the glow is not on the ball').toBe(world.ship.along);
    expect(glow.across).toBe(world.ship.across);
  });

  it('0648: red-hot, it throbs between its two frames slower than three times a second and faster than once', () => {
    const { world, frame } = inTheBall();
    let swaps = 0;
    let was: number | null = null;
    const steps = 4 * STEPS_PER_SECOND;
    for (let i = 0; i < steps; i++) {
      world.ramHeat = 0.9;
      frame.step();
      const now = glowOn(world);
      expect(now === SPRITE.ramGlow3 || now === SPRITE.ramGlow4, 'red-hot and not red').toBe(true);
      if (was !== null && now !== was) swaps++;
      was = now;
    }
    // Two swaps a throb.
    const perSecond = swaps / 2 / 4;
    expect(perSecond, `${perSecond} throbs a second`).toBeLessThan(3);
    expect(perSecond, `${perSecond} throbs a second`).toBeGreaterThan(1);
  });

  it('fire still lands on the ball: it is only bodies the ball shrugs off', () => {
    const { world, frame } = inTheBall();
    world.ship.invulnFor = 0;
    const health = world.ship.health;
    const shot = world.enemyShots.spawn()!;
    reset(shot, world.ship.along + 6, world.ship.across, SHOTS.spit);
    shot.velAlong = -SHOTS.spit.speed + world.scrollPerStep;
    for (let i = 0; i < 12; i++) frame.step();
    expect(world.ship.health, 'an enemy shot passed through the ball').toBeLessThan(health);
  });
});

describe('0609 — a full gauge burns a shield off, and the ball rolls on', () => {
  it('0638 — the readout is told the gauge and how far the next shield is back, and nothing for a full shell', () => {
    const { world, frame } = inTheBall();
    const heat: number[] = [];
    const mend: number[] = [];
    world.onHeat = (f) => heat.push(f);
    world.onMend = (f) => mend.push(f);
    frame.step();
    expect(heat.at(-1), 'the ball flew and the readout was told no gauge').toBe(0);
    expect(mend.at(-1) ?? -1, 'a full shell was told a shield is coming back').toBe(-1);
    world.ramHeat = 0.5;
    world.ramCoolIn = 1000;
    frame.step();
    expect(heat.at(-1), 'half a gauge was not drawn as half').toBe(0.5);
    // A shield down: the countdown starts, and the readout climbs from nothing to all but whole before it lands.
    world.ship.health = FULL - 1;
    world.ship.invulnFor = 1e9;
    const told: number[] = [];
    for (let i = 0; i < REGEN.rest + 2 && world.ship.health < FULL; i++) {
      frame.step();
      told.push(world.shownMend);
    }
    expect(world.ship.health, 'the shield never came back').toBe(FULL);
    expect(Math.min(...told.slice(0, 3)), 'the countdown opened part way along').toBeLessThanOrEqual(0.05);
    expect(Math.max(...told), 'the readout never neared a whole shield before it landed').toBeGreaterThanOrEqual(0.9);
    expect(mend.at(-1), 'the shield came back and the readout still says one is coming').toBe(-1);
  });

  it('0639 — a boss takes more landings before the ball burns than a body does', () => {
    /*
      Played: *"the boss damage for the hamster ball also needs to be buffed slightly, took all the power ups and
      still a very long time to kill bosses 1, 2 and 3."* Counted in what the player does: landings, from a cool
      gauge to the burn, pressed into a body and then into a boss.
    */
    const landingsToBurn = (on: 'body' | 'boss'): number => {
      const { world, frame } = inTheBall();
      world.ship.invulnFor = 0;
      world.enemies.clear();
      const target = on === 'body' ? bodyOn(world, 1e9) : world.bossPool.spawn()!;
      if (on === 'boss') {
        reset(target, world.ship.along, world.ship.across, BOSSES.sentinel);
        target.health = 1e9;
        world.bossFullHealth = 1e9;
        target.fireIn = Number.MAX_SAFE_INTEGER;
        target.velAlong = world.scrollPerStep;
      }
      let landings = 0;
      for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ship.health === FULL; i++) {
        const was = world.ramHeat;
        target.along = target.prevAlong = world.ship.along;
        target.across = target.prevAcross = world.ship.across;
        frame.step();
        if (world.ramHeat > was) landings++;
      }
      expect(world.ship.health, `pressed into a ${on}, the ball never burnt`).toBeLessThan(FULL);
      return landings;
    };
    const body = landingsToBurn('body');
    const boss = landingsToBurn('boss');
    expect(boss, `the boss burnt the ball in ${boss} landings, the body in ${body}`).toBeGreaterThan(body);
    expect(boss, 'a boss burns the ball sooner than its row says').toBeGreaterThanOrEqual(Math.ceil(1 / RAM.bossHeat) - 1);
  });

  it('every landing heats the ball, and a full gauge costs one shield — the ball whole, cool and ramming after', () => {
    const { world, frame, cues } = inTheBall();
    world.ship.invulnFor = 0;
    expect(world.ship.health, 'the ball did not open on its own shell').toBe(FULL);
    bodyOn(world, 100000);
    let burnt = -1;
    for (let i = 0; i < 20 * STEPS_PER_SECOND && burnt < 0; i++) {
      pressed(world, frame);
      if (world.ship.health < FULL) burnt = i;
    }
    expect(burnt, 'pressed into a body that would not die, the heat never cost the ball anything').toBeGreaterThan(0);
    // At the ram's own clock: one landing every `landGap` steps (four owed at once), each `heat` of the gauge.
    expect(burnt / STEPS_PER_SECOND, 'burnt sooner than its landings could have heated it').toBeGreaterThan(((1 / RAM.heat - 4) * (WEAPONS.ram.landGap ?? 0)) / STEPS_PER_SECOND);
    expect(world.ship.health, 'a burn took more than one shield').toBe(FULL - 1);
    expect(world.ramHeat, 'the gauge did not go cool when it burnt').toBeLessThan(0.25);
    expect(cues, 'a burn was not heard as itself').toContain('ballBurns');
    // And the ball is still the ball, ramming, never the bare hull 0593 broke it to.
    frame.step();
    expect(world.ship.spriteBase).toBe(SPRITE.ball);
    expect(ramBody(world), 'the ball stopped ramming when it burnt').not.toBe(null);
  });

  it('a burn waits out the window a hit gives, and then lands — one hit a step, as every hit is', () => {
    const { world, frame } = inTheBall();
    // As if a shot had just landed: the ship blinking for longer than the gauge takes to fill.
    world.ship.invulnFor = 4 * STEPS_PER_SECOND;
    bodyOn(world, 100000);
    for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ramHeat < 1; i++) pressed(world, frame);
    expect(world.ramHeat, 'the gauge never filled').toBe(1);
    while (world.ship.invulnFor > 1) {
      pressed(world, frame);
      expect(world.ship.health, 'a burn landed inside the window a hit gives').toBe(FULL);
      expect(world.ramHeat, 'the gauge was not held full while it waited').toBe(1);
    }
    for (let i = 0; i < 3; i++) frame.step();
    expect(world.ship.health, 'the window ran out and the full gauge never burnt').toBe(FULL - 1);
  });

  it('with no shield left, a burn is a death — and a crash, since it was the ball’s own', () => {
    const { world, frame } = inTheBall();
    world.ship.invulnFor = 0;
    // Spend the shell the way the game spends it: three shots, each after the window the last one gave.
    for (let k = 0; k < SHIPS.ball.shields!; k++) {
      while (world.ship.invulnFor > 0) frame.step();
      shotOn(world);
      frame.step();
    }
    expect(shieldsOf(world.shipRow, world.ship.health), 'three shots did not spend three shields').toBe(0);
    while (world.ship.invulnFor > 0) frame.step();
    bodyOn(world, 100000);
    for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ship.health > 0; i++) pressed(world, frame);
    expect(world.ship.health, 'a full gauge with no shield left did not kill the ball').toBeLessThanOrEqual(0);
    expect(world.killedBy, 'a burn was counted as fire').toBe('body');
  });
});

describe('0609 — three shields on every tier, and they come back', () => {
  it('the ball opens every life on three and carries no more, on every tier — and every other ship on its tier’s', () => {
    expect(SHIPS.ball.shields).toBe(3);
    expect(SHIPS.ball.shields!).toBeLessThanOrEqual(MAX_SHIELDS);
    for (const kind of DIFFICULTY_KINDS) {
      const tier = DIFFICULTIES[kind];
      expect(openingHealthFor(SHIPS.ball, tier), `the ball opens a life on ${kind} short of three`).toBe(FULL);
      expect(fullHealthFor(SHIPS.ball, tier), `the ball may carry other than three on ${kind}`).toBe(FULL);
      for (const ship of SHIP_KINDS) {
        if (ship === 'ball') continue;
        expect(openingHealthFor(SHIPS[ship], tier), `the ${ship} opens on ${kind} other than its tier says`).toBe(SHIPS[ship].health + tier.shellOpen);
        expect(fullHealthFor(SHIPS[ship], tier), `the ${ship} may carry on ${kind} other than its tier says`).toBe(SHIPS[ship].health + tier.shellCap);
      }
    }
    // Through the real life: Burn, which opens every other ship on its hull alone.
    const { world } = playableWorld(NO_LEVEL, 'burn');
    world.shipRow = fitted(SHIPS.ball, 'ram');
    respawn(world);
    expect(shieldsOf(world.shipRow, world.ship.health), 'a life in the ball on Burn opened short of three').toBe(3);
  });

  it('a spent shield comes back after its rest, and then one every `every`, until the shell is full — in seconds', () => {
    const { world, frame, cues } = inTheBall();
    world.ship.invulnFor = 0;
    shotOn(world);
    frame.step();
    while (world.ship.invulnFor > 0) frame.step();
    shotOn(world);
    frame.step();
    const low = world.ship.health;
    expect(low, 'two shots did not spend two shields').toBe(FULL - 2);
    const back: number[] = [];
    for (let i = 1; i <= 20 * STEPS_PER_SECOND && world.ship.health < FULL; i++) {
      const was = world.ship.health;
      frame.step();
      if (world.ship.health > was) back.push(i);
    }
    expect(back.length, 'the shell never came back').toBe(FULL - low);
    expect(back[0]! / STEPS_PER_SECOND, 'the first shield came back at the wrong time').toBeCloseTo(REGEN.rest / STEPS_PER_SECOND, 1);
    expect((back[1]! - back[0]!) / STEPS_PER_SECOND, 'the next came back at the wrong time').toBeCloseTo(REGEN.every / STEPS_PER_SECOND, 1);
    expect(cues.filter((cue) => cue === 'shieldBack').length, 'a shield came back unheard').toBe(back.length);
    // And never past the shell the ball may carry.
    for (let i = 0; i < 2 * REGEN.every; i++) frame.step();
    expect(world.ship.health, 'the shell grew past three').toBe(FULL);
  });

  it('a mark comes back on the shell on the step the shield does', () => {
    const { world, frame } = inTheBall();
    world.ship.invulnFor = 0;
    shotOn(world);
    frame.step();
    expect(world.shieldOrbs.size).toBe(SHIPS.ball.shields! - 1);
    let grew = false;
    for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ship.health < FULL; i++) {
      frame.step();
      grew = world.ship.health === FULL;
    }
    expect(grew, 'the shield never came back').toBe(true);
    expect(world.shieldOrbs.size, 'a shield came back and the shell did not show it').toBe(SHIPS.ball.shields!);
  });

  it('any hit puts the rest back, so a shield never comes back under fire', () => {
    const { world, frame } = inTheBall();
    world.ship.invulnFor = 0;
    shotOn(world);
    frame.step();
    // Hit again just before the rest runs out: nothing may come back until a whole rest after it.
    for (let i = 0; i < REGEN.rest - 10; i++) frame.step();
    expect(world.ship.health, 'a shield came back before its rest').toBe(FULL - 1);
    world.ship.invulnFor = 0;
    shotOn(world);
    frame.step();
    expect(world.ship.health).toBe(FULL - 2);
    let back = 0;
    for (let i = 1; i <= 20 * STEPS_PER_SECOND && back === 0; i++) {
      frame.step();
      if (world.ship.health > FULL - 2) back = i;
    }
    expect(back / STEPS_PER_SECOND, 'the second hit did not put the rest back').toBeCloseTo(REGEN.rest / STEPS_PER_SECOND, 1);
  });

  it('no other ship regenerates', () => {
    for (const ship of SHIP_KINDS) if (ship !== 'ball') expect(SHIPS[ship].regen, ship).toBe(null);
  });
});

describe('0593 — the ram is the ball, and goes on no other ship', () => {
  const everyWin = { ...initialHangar, won: Object.fromEntries(SHIP_KINDS.map((k) => [k, true])) as typeof initialHangar.won };

  it('no ship may fly the ram, and the ball may fly no other gun, however much is won', () => {
    for (const ship of SHIP_KINDS) {
      if (ship === 'ball') continue;
      expect(gunOpen(everyWin, ship, 'ball'), `the ${ship} may fly the ram`).toBe(false);
      expect(gunOpen(everyWin, 'ball', ship), `the ball may fly the ${ship}'s gun`).toBe(false);
    }
    expect(gunOpen(everyWin, 'ball', 'ball')).toBe(true);
    expect(gunWhy('ball', true, false)).toBe('The Hamster Ball flies nothing but its ram');
  });
});

describe('0593 — the War Dance', () => {
  it('the ship bounces round its box on its own, and stays in it', () => {
    const { world, frame } = inTheBall();
    launchSpecial(world, 'warDance');
    expect(world.danceFor).toBe(DANCE.steps);
    let turned = 0;
    let was = world.danceAcross;
    for (let i = 0; i < DANCE.steps - 1; i++) {
      frame.step();
      if (Math.sign(world.danceAcross) !== Math.sign(was)) turned++;
      was = world.danceAcross;
      expect(world.ship.across).toBeGreaterThanOrEqual(PLAYER_MARGIN - 1e-6);
      expect(world.ship.across).toBeLessThanOrEqual(ACROSS_SPAN - PLAYER_MARGIN + 1e-6);
    }
    expect(turned, 'three seconds of dance never met an edge of the box').toBeGreaterThan(0);
    frame.step();
    expect(world.danceFor, 'the dance outlived its row').toBe(0);
  });

  it('nothing hurts a dancing ship, and it heats nothing as it rams', () => {
    const { world, frame } = inTheBall();
    launchSpecial(world, 'warDance');
    world.ship.invulnFor = 0;
    const health = world.ship.health;
    for (let i = 0; i < 60; i++) {
      // Something on the ship every step it dances: a body to ram and a shot to be hit by.
      if (world.enemies.size === 0) bodyOn(world, 100000);
      else reset(world.enemies.at(0), world.ship.along, world.ship.across, ENEMIES.drifter);
      world.enemies.at(0).health = 100000;
      world.enemies.at(0).fireIn = Number.MAX_SAFE_INTEGER;
      const shot = world.enemyShots.spawn();
      if (shot !== null) reset(shot, world.ship.along, world.ship.across, SHOTS.spit);
      frame.step();
    }
    expect(world.ship.health, 'a dancing ship was hurt').toBe(health);
    expect(world.ramHeat, 'the dance heated the ball').toBe(0);
  });

  it('a press while it dances is refused, so it costs nothing', () => {
    const { world } = inTheBall();
    expect(canThrow(world, 'warDance')).toBe(true);
    launchSpecial(world, 'warDance');
    expect(canThrow(world, 'warDance')).toBe(false);
  });
});

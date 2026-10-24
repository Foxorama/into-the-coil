/**
 * Venoma flies the Viper — `docs/decisions/0666-venoma-flies-the-viper.md`, item 1 of
 * [`the-notebook-pages`](../reports/the-notebook-pages-2026-10-24.md).
 *
 * The page: *"Venoma secret ship — unlocked if beat all diffs with any character. Has the serpent boss attacks →
 * acid spray; missile turrets are the void blasts from serpent boss + special is red lightning called down from the
 * sky."*
 *
 * ⚠️ **THROUGH THE REAL STEP AND THE REAL REDUCER.** What is under test is a volley leaving the jaw, a tube firing,
 * a press calling lightning down and a run ending — a fixture that laid shots or bolts by hand could see none of it.
 *
 * ⚠️ **IN THE PLAYER'S UNITS WHERE THERE ARE ANY** — 0027: degrees across the fan, a share of the screen the
 * spray reaches, and where on the lane a bolt starts.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, canThrow, launchSpecial, wearHull, type World } from '../src/app/frame.ts';
import { DIFFICULTY_KINDS, DIFFICULTIES } from '../src/content/difficulty.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { GOLFERS, GOLFER_KINDS, pilotOf, pilotOpen, rescuable } from '../src/content/golfers.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { MISSILES } from '../src/content/missiles.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, fitted } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SMITE_BOLT_KIND, SPECIALS } from '../src/content/specials.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { FLAMES } from '../src/content/flames.ts';
import { VIPER } from '../src/content/port.ts';
import { CUES } from '../src/content/cues.ts';
import { SCREENS, lockHint } from '../src/state/screens.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { reset } from '../src/sim/entity.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { initialHangar, pilotRecord, reduceHangar } from '../src/state/slices/hangar.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const SMITE = SPECIALS.redLightning.smite!;

/** A world flying the Viper with its own acid, its tubes as given. */
function inTheViper(tubes: Parameters<typeof weaponFor>[1] = []): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  built.world.shipRow = fitted(SHIPS.viper, 'acid');
  built.world.weapon = weaponFor(built.world.shipRow, tubes);
  if (tubes.length === 0) built.world.missileIn = Number.MAX_SAFE_INTEGER;
  wearHull(built.world);
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** A body `along` ahead of the ship and `across` off its line, riding the camera, holding its fire. */
function bodyAt(world: World, along: number, across: number, health: number): void {
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along + along, world.ship.across + across, ENEMIES.drifter);
  enemy.health = health;
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = world.scrollPerStep;
}

/** A hangar with the tiers given finished. */
function finished(tiers: readonly (typeof DIFFICULTY_KINDS)[number][]): typeof initialHangar {
  let hangar = initialHangar;
  for (const difficulty of tiers) hangar = reduceHangar(hangar, { slice: 'hangar', type: 'finished', difficulty });
  return hangar;
}

describe('0666 — the pilot', () => {
  it('THE ASK: she opens once every tier is finished, in any ship, and not one tier before', () => {
    expect(pilotOf('viper'), 'the Viper is not hers').toBe('venoma');
    expect(pilotOpen('venoma', pilotRecord(initialHangar)), 'open from the first run').toBe(false);
    for (const missing of DIFFICULTY_KINDS) {
      const hangar = finished(DIFFICULTY_KINDS.filter((tier) => tier !== missing));
      expect(pilotOpen('venoma', pilotRecord(hangar)), `open with ${missing} still owed`).toBe(false);
      // The band says which tier is owed, by the word the player knows it by.
      expect(lockHint(GOLFERS.venoma.opens, pilotRecord(hangar), 'Venoma'), `the hint does not name ${missing}`).toContain(DIFFICULTIES[missing].short);
    }
    expect(pilotOpen('venoma', pilotRecord(finished(DIFFICULTY_KINDS))), 'shut with every tier finished').toBe(true);
  });

  it('is never the golfer found in the Viper, whoever flies', () => {
    for (const chosen of GOLFER_KINDS) expect(rescuable(chosen), `${chosen}'s finale finds her in her own ship`).not.toContain('venoma');
  });

  it('her run finished goes to the victory screen, and every other pilot’s to the finale', () => {
    const finish = (ship: Parameters<typeof pilotOf>[0]): State => {
      let state: State = initialState;
      const actions: Action[] = [
        { slice: 'run', type: 'begin', difficulty: DIFFICULTY_KINDS[0]!, ship, credits: 'free' },
        { slice: 'screen', type: 'show', screen: 'playing' },
      ];
      for (const action of actions) state = reduce(state, action);
      for (let i = 0; i < LEVEL_KINDS.length; i++) state = reduce(state, { slice: 'run', type: 'levelCleared' });
      return reduce(state, { slice: 'screen', type: 'show', screen: 'cleared' });
    };
    expect(finish('viper').screen.current, 'her finale found someone in her own cockpit').toBe('victory');
    // And the win still counts: the ship won and the tier finished, as every finished run's are (0521, 0608).
    expect(finish('viper').hangar.won.viper).toBe(true);
    expect(finish('fighter').screen.current, 'the story stopped being told').toBe('outro');
    for (const kind of GOLFER_KINDS) expect(GOLFERS[kind].story, kind).toBe(kind !== 'venoma');
  });
});

describe('0666 — the acid', () => {
  it('THE ASK: a spray — a fan of four, twice as wide as the pulse’s, that reaches three quarters of the screen', () => {
    const { world, frame } = inTheViper();
    world.fireIn = 1;
    frame.step();
    const shots = Array.from({ length: world.playerShots.size }, (_, i) => world.playerShots.at(i));
    expect(shots.length, 'not four spits').toBe(4);
    const headings = shots.map((s) => Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep));
    const fan = ((Math.max(...headings) - Math.min(...headings)) * 180) / Math.PI;
    const pulse = (weaponFor(SHIPS.fighter).spread * 180) / Math.PI;
    expect(fan, `the fan is ${fan.toFixed(0)}° and the pulse's ${pulse.toFixed(0)}°`).toBeGreaterThan(pulse * 1.8);
    for (const s of shots) expect(s.sprite, 'a spit is not drawn as Venoma’s').toBe(SHOTS.venom.sprite);
    // 0667: run it out, in the camera's frame from the jaw: every spit flies three quarters of the screen and no further.
    const from = world.ship.along + world.shipRow.muzzle.along - world.cameraAlong;
    let furthest = 0;
    for (let step = 0; step < 200; step++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      frame.step();
      for (let i = 0; i < world.playerShots.size; i++) furthest = Math.max(furthest, world.playerShots.at(i).along - world.cameraAlong - from);
    }
    expect(world.playerShots.size, 'a spit outlived its range').toBe(0);
    const share = furthest / world.view.alongSpan;
    expect(share, `the spray reaches ${(share * 100).toFixed(0)}% of the screen`).toBeGreaterThan(0.72);
    expect(share, `the spray reaches ${(share * 100).toFixed(0)}% of the screen`).toBeLessThan(0.78);
  });

  it('THE ASK: a spit splats where it lands, as the marker’s paint does, and is heard hissing', () => {
    const { world, frame } = inTheViper();
    const heard: string[] = [];
    world.onCue = (kind): void => {
      heard.push(kind);
    };
    bodyAt(world, 30, 0, 999);
    world.fireIn = 1;
    for (let step = 0; step < 40 && world.paint.size === 0; step++) frame.step();
    expect(world.paint.size, 'a spit landed and left no burn').toBeGreaterThan(0);
    expect(world.paint.at(0).sprite, 'the burn is not the acid’s').toBe(SPRITE.acidSplat);
    expect(heard, 'the burn was not heard hissing').toContain('acidHiss');
    expect(heard, 'the burn was heard as the marker’s paint').not.toContain('splat');
  });

  it('every other gun keeps the pulse’s fan and no range', () => {
    for (const kind of ['pulse', 'arc', 'shuriken', 'ray', 'catherine', 'ram', 'paintball'] as const) {
      expect(WEAPONS[kind].fan, kind).toBeUndefined();
      expect(WEAPONS[kind].range, kind).toBeUndefined();
    }
  });
});

describe('0666 — the tubes', () => {
  it('THE ASK: throw the serpent’s void, and fly as the fitted kind says', () => {
    const { world, frame } = inTheViper(['straight', 'homing']);
    world.missileIn = 1;
    frame.step();
    expect(world.missiles.size, 'no volley').toBe(2);
    for (let i = 0; i < world.missiles.size; i++) {
      const missile = world.missiles.at(i);
      expect(missile.sprite, 'a tube fired a missile and not a void').toBe(SHOTS.venomVoid.sprite);
      expect(missile.radius).toBe(SHOTS.venomVoid.radius);
    }
    // The fitted kind's hunt and damage, and its speed.
    expect(world.missiles.at(0).damage).toBe(SHOTS[MISSILES.straight.shot].damage);
    expect(world.missiles.at(1).seekTurn).toBe(MISSILES.homing.seek);
    expect(world.missiles.at(0).velAlong - world.scrollPerStep).toBeCloseTo(SHOTS[MISSILES.straight.shot].speed, 6);
  });

  it('and every other ship fires its kind’s own missile', () => {
    const built = playableWorld(NO_LEVEL);
    built.world.weapon = weaponFor(built.world.shipRow, ['straight']);
    built.world.missileIn = 1;
    new GameFrame(built.world).step();
    expect(built.world.missiles.at(0).sprite).toBe(SHOTS[MISSILES.straight.shot].sprite);
  });
});

describe('0666 — Red Lightning', () => {
  it('THE ASK: called down from the top of the lane onto the body nearest the ship, a bolt at a time', () => {
    const { world, frame } = inTheViper();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    // Three bodies, the nearest first; each takes two bolts to kill.
    bodyAt(world, 30, 0, SMITE.damage * 2);
    bodyAt(world, 60, 20, SMITE.damage * 2);
    bodyAt(world, 90, -20, SMITE.damage * 2);
    const nearest = world.enemies.at(0);
    launchSpecial(world, 'redLightning');
    // The first bolt answers the press, on the nearest body, falling from across 0 — the top of the lane.
    let bolt = null;
    for (let i = 0; i < world.bolts.size; i++) if (world.bolts.at(i).kind === SMITE_BOLT_KIND) bolt = world.bolts.at(i);
    expect(bolt, 'no bolt on the press').not.toBeNull();
    expect(bolt!.across + bolt!.fromAcross, 'the bolt does not fall from the top of the lane').toBeCloseTo(0, 6);
    expect(bolt!.fromAlong, 'the bolt does not fall straight down').toBeCloseTo(0, 6);
    expect(bolt!.along).toBeCloseTo(nearest.along, 6);
    expect(nearest.health, 'the nearest body was not struck').toBe(SMITE.damage);
    // The rest on its clock, holding the throw gap while it falls.
    expect(canThrow(world, 'bomb'), 'another special may be thrown while it falls').toBe(false);
    for (let step = 0; step < SMITE.strikes * SMITE.every + 12; step++) frame.step();
    expect(world.smiteFired, 'not every bolt fell').toBe(SMITE.strikes);
    expect(world.smiteKind, 'it is still falling').toBeNull();
    expect(world.enemies.size, 'three bodies of two bolts each outlived eight bolts').toBe(0);
  });
});

describe('0667 — what play asked of her', () => {
  it('THE ASK: the Viper burns the violet the intro sees her leave the port on', () => {
    expect(SHIPS.viper.flame, 'the Viper burns another flame').toBe('wyrmFlame');
    // The intro's own inks, read off the port's row rather than written again here.
    expect(FLAMES.wyrmFlame.inks, 'the Viper’s flame is not the port’s violet').toEqual({ outer: VIPER.flame, inner: VIPER.core });
    expect(FLAMES.wyrmFlame.from).toBe('viper');
  });

  it('THE ASK: Cosmo’s toggle is just Owned, with no line under it to run into', () => {
    const toggle = SCREENS.shop.actions[2]!;
    expect(toggle.label).toBe('Owned');
    expect(toggle.hint, 'the toggle has a line under it again').toBe('');
  });

  it('the spray is heard as its own, quieter than the pulse it fires as often as', () => {
    expect(WEAPONS.acid.cue).toBe('spit');
    expect(CUES.spit.gain, 'the spray is as loud as the pulse').toBeLessThan(CUES.pulse.gain);
    // No layer of it is bright noise held as long as 0666's hiss: the top is the burn's, where a spit lands.
    for (const layer of CUES.spit.layers) {
      if (layer.wave !== 'noise') continue;
      expect(layer.seconds, 'the spray hisses on every volley').toBeLessThan(0.04);
    }
    expect(WEAPONS.acid.paint?.lands).toBe('acidHiss');
  });
});

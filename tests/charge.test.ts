/**
 * The dance is earned — `docs/decisions/0613-the-dance-is-earned.md`.
 *
 * The ask, from a play of the Hamster Ball: *"hamster ball needs some haptic feedback or something for when
 * you hit a ship or an enemy, but it can't be overwhelming because it's a lot and I think we need to change
 * it's special to be a charge bar, when you kill x amount of enemies or do x amount of damage (so that bosses
 * count) you refill your special to do the war dance. it currently has no aoe so feels like it needs
 * something a bit more interactive there … it should allow you to war dance every 10-15 secs or so I think"*.
 *
 * Three things, then: the ball's War Dance is a bar its ram fills, the ball's landings are felt and seen, and
 * the dance throws shockwaves.
 *
 * ⚠️ **THROUGH THE REAL STEP.** The bar is filled by what the pairings land, the wave by what its edge crosses,
 * and the feel by what the step names — none of it is written by hand mid-flight.
 *
 * ⚠️ **IN THE PLAYER'S UNITS WHERE THERE ARE ANY** — 0027: seconds to a full bar, flown; the wave's reach as a
 * share of the lane, and drawn at the edge it lands at.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, WAVE_KIND, chargeFull, launchSpecial, respawn, throwEarned, wearHull, type World } from '../src/app/frame.ts';
import { attachRumble } from '../src/app/pad.ts';
import { BOSSES } from '../src/content/bosses.ts';
import type { CueKind } from '../src/content/cues.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { FEELS, FEEL_GAP_MS, FEEL_KINDS, type FeelKind } from '../src/content/feels.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, SHIP_KINDS, fitted, type ShipKind } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { reset } from '../src/sim/entity.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND, optionWhy, specialWhy } from '../src/state/screens.ts';
import { initialHangar, specialOpen } from '../src/state/slices/hangar.ts';
import { startingArsenal } from '../src/state/slices/run.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';
import { readFileSync } from 'node:fs';

const CHARGE = SHIPS.ball.charge!;
const DANCE = SPECIALS.warDance.dance!;
const WAVE = SHOTS[DANCE.wave.shot];

/** A world flying `ship` with its own gun, the tubes silenced, recording cues and feels. */
function flying(ship: ShipKind = 'ball', level: LevelRow = NO_LEVEL, tier?: Parameters<typeof playableWorld>[1]) {
  const built = playableWorld(level, tier);
  built.world.shipRow = fitted(SHIPS[ship], SHIPS[ship].weapon);
  built.world.weapon = weaponFor(built.world.shipRow, []);
  built.world.missileIn = Number.MAX_SAFE_INTEGER;
  respawn(built.world);
  wearHull(built.world);
  const cues: CueKind[] = [];
  const feels: FeelKind[] = [];
  built.world.onCue = (kind) => {
    cues.push(kind);
  };
  built.world.onFeel = (feel) => {
    feels.push(feel);
  };
  return { ...built, frame: new GameFrame(built.world), cues, feels };
}

/** A body planted on the ship, riding the camera and holding its fire — `health` of it. */
function bodyOn(world: World, health: number, along = world.ship.along, across = world.ship.across) {
  const enemy = world.enemies.spawn()!;
  reset(enemy, along, across, ENEMIES.drifter);
  enemy.health = health;
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

/** Every shockwave out. */
function waves(world: World) {
  const out = [];
  for (let i = 0; i < world.blasts.size; i++) if (world.blasts.at(i).kind === WAVE_KIND) out.push(world.blasts.at(i));
  return out;
}

/** Land `count` rams on a body that never dies, the ball held cool so its heat says nothing here. */
function landRams(world: World, frame: GameFrame, count: number): void {
  const body = bodyOn(world, 1e9);
  let landed = 0;
  for (let step = 0; landed < count && step < count * 20; step++) {
    world.ramHeat = 0;
    const before = world.charge;
    frame.step();
    landed += world.charge - before;
    body.along = world.ship.along;
    body.across = world.ship.across;
  }
}

describe('0613 — the War Dance is a bar the ball fills', () => {
  it('the ball earns its own special and no other ship earns one — every other row stocks as it did', () => {
    expect(WEAPONS[SHIPS.ball.weapon].special).toBe('warDance');
    for (const ship of SHIP_KINDS) if (ship !== 'ball') expect(SHIPS[ship].charge, ship).toBe(null);
  });

  it('a run in the ball opens on no War Dance — the empty bar is its stock — and every other ship on its pair', () => {
    for (const tier of ['legendary', 'savior', 'burn'] as const) {
      expect(startingArsenal('ball', tier).gun, tier).toEqual([]);
      expect(startingArsenal('fighter', tier).gun.length, tier).toBeGreaterThan(0);
    }
    // Whatever a document says is fitted, the ball's own is read (`specialOpen` fits it no other).
    expect(startingArsenal('ball', 'savior', 'bomb').gun).toEqual([]);
  });

  it('a press on an empty or part-full bar throws nothing and costs nothing, and the stack is asked instead', () => {
    const { world, frame } = flying();
    expect(throwEarned(world, 'gun'), 'an empty bar threw').toBe('none');
    landRams(world, frame, CHARGE.fill - 1);
    expect(chargeFull(world)).toBe(false);
    expect(throwEarned(world, 'gun'), 'a bar one short threw').toBe('none');
    expect(world.danceFor).toBe(0);
    expect(world.charge, 'a refused press spent the bar').toBe(CHARGE.fill - 1);
  });

  it('each landing is one, on a body or a boss alike, and a full bar holds until it is thrown', () => {
    const { world, frame, cues } = flying();
    landRams(world, frame, 5);
    expect(world.charge, 'five landings on a body did not fill five').toBe(5);
    // A boss counts the same coin: a landing, whatever its weight or its window (0613).
    const boss = world.bossPool.spawn()!;
    reset(boss, world.ship.along, world.ship.across, BOSSES.sentinel);
    boss.health = 1e9;
    world.bossFullHealth = 1e9;
    boss.fireIn = Number.MAX_SAFE_INTEGER;
    boss.velAlong = world.scrollPerStep;
    world.enemies.clear();
    let steps = 0;
    while (world.charge < 10 && steps++ < 200) {
      world.ramHeat = 0;
      boss.along = world.ship.along;
      boss.across = world.ship.across;
      frame.step();
    }
    expect(world.charge, 'five landings on the boss were not five').toBe(10);
    world.bossPool.clear();
    landRams(world, frame, CHARGE.fill - world.charge);
    expect(world.charge, 'the bar went past full').toBe(CHARGE.fill);
    expect(chargeFull(world)).toBe(true);
    // Held: more landings on a full bar fill nothing more and say nothing more.
    const ready = cues.filter((c) => c === 'danceReady').length;
    const body = bodyOn(world, 1e9);
    for (let i = 0; i < 60; i++) {
      world.ramHeat = 0;
      body.along = world.ship.along;
      body.across = world.ship.across;
      frame.step();
    }
    expect(world.charge).toBe(CHARGE.fill);
    expect(cues.filter((c) => c === 'danceReady').length, 'a full bar filled again').toBe(ready);
  });

  it('a full bar is heard, felt and seen: the cue, the feel, the readout and the flare round the ship', () => {
    const { world, frame, cues, feels } = flying();
    const shown: number[] = [];
    world.onCharge = (f) => {
      shown.push(f);
    };
    landRams(world, frame, CHARGE.fill);
    expect(cues.filter((c) => c === 'danceReady').length, 'the bar filled unheard').toBe(1);
    expect(feels, 'the bar filled unfelt').toContain('ready');
    expect(shown[shown.length - 1], 'the readout never showed the bar full').toBe(1);
    expect(shown.every((f, i) => i === 0 || f >= shown[i - 1]!), 'the readout went back down while it filled').toBe(true);
    // The dance's flare, lit round a ship that is not dancing.
    frame.step();
    let lit = false;
    for (let i = 0; i < world.aura.size; i++) if (DANCE.flare.includes(world.aura.at(i).sprite)) lit = true;
    expect(lit, 'the full bar was not seen on the ship').toBe(true);
  });

  it('thrown, the bar is empty and the ball dances — and nothing it lands while it dances fills the next', () => {
    const { world, frame } = flying();
    landRams(world, frame, CHARGE.fill);
    expect(throwEarned(world, 'gun')).toBe('thrown');
    expect(world.danceFor, 'the bar was spent and the ball did not dance').toBeGreaterThan(0);
    expect(world.charge).toBe(0);
    // A press inside the dance is refused and costs nothing, as every dance press is.
    const body = bodyOn(world, 1e9);
    for (let i = 0; i < DANCE.steps - 2; i++) {
      body.along = world.ship.along;
      body.across = world.ship.across;
      frame.step();
    }
    expect(world.charge, 'the dance filled the bar it was thrown from').toBe(0);
  });

  it('a life opens on an empty bar', () => {
    const { world, frame } = flying();
    landRams(world, frame, 12);
    expect(world.charge).toBeGreaterThan(0);
    respawn(world);
    expect(world.charge).toBe(0);
  });

  it('only the trigger the special throws on asks the bar', () => {
    const { world, frame } = flying();
    landRams(world, frame, CHARGE.fill);
    expect(throwEarned(world, 'tubes')).toBe('none');
    expect(throwEarned(world, 'ward')).toBe('none');
    expect(chargeFull(world), 'a press of another trigger spent the bar').toBe(true);
  });

  it('the hangar fits the ball with no other special, and says why; every other ship still borrows the ball’s', () => {
    const won = { ...initialHangar, won: Object.fromEntries(SHIP_KINDS.map((k) => [k, true])) as typeof initialHangar.won };
    for (const from of SHIP_KINDS) expect(specialOpen(won, 'ball', from), from).toBe(from === 'ball');
    for (const ship of SHIP_KINDS) expect(specialOpen(won, ship, 'ball'), ship).toBe(true);
    expect(specialWhy('ball', true, false)).toBe('The Hamster Ball earns its War Dance by ramming');
    expect(optionWhy('special', 'ball', SHIP_KINDS.indexOf('fighter'), won.won)).toBe('The Hamster Ball earns its War Dance by ramming');
  });
});

/*
  ── THE ASK'S WINDOW, FLOWN — 0027 ────────────────────────────────────────────────────────────────────

  *"It should allow you to war dance every 10-15 secs or so."* Seconds, and flown: a ball that keeps ramming
  the nearest thing and backs off down its box before its heat burns a shield, through the first level and
  against that level's end boss alone. 0613's table has every level and boss; this holds the first of each in
  the window the ask names, with the margin a pilot that backs off all the way to cool leaves.
*/
describe('0613 — a ball that keeps ramming fills its bar in the ask’s window', () => {
  /**
   * Seconds a bar takes while `counted` holds, flown by the heat-minding pilot: the bar's fill over the landings
   * a second it counted — the bar emptied as it fills, so it never holds and every landing is counted.
   */
  function secondsPerBar(level: LevelRow, seconds: number, counted: (world: World) => boolean): number {
    const { world, frame, stick } = flying('ball', level, 'savior');
    let backing = false;
    let steps = 0;
    let landed = 0;
    for (let step = 0; step < seconds * STEPS_PER_SECOND; step++) {
      world.ship.health = SHIPS.ball.health + SHIPS.ball.shields!;
      world.ship.invulnFor = Number.MAX_SAFE_INTEGER;
      const bossUp = world.bossPool.size > 0 && world.bossEntering < 0 && !world.bossBeaten;
      let tA: number | null = null;
      let tC = 0;
      let best = Infinity;
      if (bossUp) {
        tA = world.bossPool.at(0).along;
        tC = world.bossPool.at(0).across;
      } else
        for (let i = 0; i < world.enemies.size; i++) {
          const e = world.enemies.at(i);
          const d = Math.hypot(e.along - world.ship.along, e.across - world.ship.across);
          if (d < best) {
            best = d;
            tA = e.along;
            tC = e.across;
          }
        }
      if (world.ramHeat >= 0.85) backing = true;
      if (world.ramHeat <= 0) backing = false;
      if (backing) {
        stick.along = -1;
        stick.across = tC > world.ship.across ? -1 : 1;
      } else if (tA !== null) {
        stick.along = Math.max(-1, Math.min(1, (tA - world.ship.along) / 4));
        stick.across = Math.max(-1, Math.min(1, (tC - world.ship.across) / 4));
      } else {
        stick.along = 0;
        stick.across = 0;
      }
      const counting = counted(world);
      const before = world.charge;
      frame.step();
      if (counting) {
        steps++;
        landed += world.charge - before;
      }
      // Thrown the moment it fills, so the bar never holds; the dance itself is not flown.
      if (chargeFull(world)) world.charge = 0;
    }
    // Enough landings that a rate is a rate, whatever the bar is set to.
    expect(landed, 'too little landed to measure a bar').toBeGreaterThan(40);
    return CHARGE.fill / (landed / (steps / STEPS_PER_SECOND));
  }

  /*
    ⚠️ **THE PILOT IS THE SLOWEST WAY TO RAM, SO ITS SECONDS ARE THE MOST A BAR TAKES**, and the bounds are read
    that way: under the ask's fifteen against a boss, and under twenty in a level, where most of the wait is for
    the next wave and a pilot that presses on fills it in five to fifteen. The floor is the other half of the
    ask — a dance every few seconds would be the special always on, which nobody asked for.
  */
  it('in the first level, while no boss is up', () => {
    const level = LEVELS.approach;
    const s = secondsPerBar(level, 150, (w) => w.bossPool.size === 0);
    expect(s, `${s.toFixed(1)} s a bar in The Approach`).toBeGreaterThanOrEqual(6);
    expect(s, `${s.toFixed(1)} s a bar in The Approach`).toBeLessThanOrEqual(20);
  });

  it('against the first level’s end boss, alone', () => {
    const level = LEVELS.approach;
    const arena: LevelRow = { ...level, waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS };
    const s = secondsPerBar(arena, 90, (w) => w.bossPool.size > 0 && w.bossEntering < 0 && !w.bossBeaten);
    expect(s, `${s.toFixed(1)} s a bar against the ${level.boss}`).toBeGreaterThanOrEqual(6);
    expect(s, `${s.toFixed(1)} s a bar against the ${level.boss}`).toBeLessThanOrEqual(15);
  });
});

describe('0613 — a landing is felt, and seen, and never overwhelms', () => {
  it('a landing is a knock, a kill a smash, a boss a smash, and the heat burning a shield a burn', () => {
    const { world, frame, feels } = flying();
    const body = bodyOn(world, 1e9);
    for (let i = 0; i < 4; i++) {
      world.ramHeat = 0;
      body.along = world.ship.along;
      body.across = world.ship.across;
      frame.step();
    }
    expect(feels, 'a landing on a body that lives was not a knock').toContain('knock');
    expect(feels).not.toContain('smash');
    world.enemies.clear();
    bodyOn(world, 1);
    world.ramHeat = 0;
    frame.step();
    expect(feels, 'a kill was not a smash').toContain('smash');
    // A full gauge burns a shield off: the one strong pulse.
    world.ramHeat = 1;
    world.ship.invulnFor = 0;
    frame.step();
    expect(feels, 'a shield burnt off unfelt').toContain('burn');
  });

  it('the feels are light, the burn the one strong one, and ranked weakest first', () => {
    for (const kind of FEEL_KINDS) {
      const row = FEELS[kind];
      for (const m of [row.strong, row.weak]) expect(m, kind).toBeGreaterThanOrEqual(0);
      for (const m of [row.strong, row.weak]) expect(m, kind).toBeLessThanOrEqual(1);
    }
    // A knock is a tap: under a quarter of the light motor and under a twentieth of a second.
    expect(FEELS.knock.weak).toBeLessThanOrEqual(0.25);
    expect(FEELS.knock.strong).toBe(0);
    expect(FEELS.knock.ms).toBeLessThanOrEqual(50);
    for (const kind of FEEL_KINDS) if (kind !== 'burn') expect(FEELS[kind].strong, kind).toBeLessThan(FEELS.burn.strong);
  });

  it('a pad is pulsed at most once a gap, unless a stronger feel arrives inside it', () => {
    const played: { strong: number; weak: number; duration: number }[] = [];
    const pad = {
      connected: true,
      vibrationActuator: {
        playEffect: (_type: string, p: { strongMagnitude: number; weakMagnitude: number; duration: number }) => {
          played.push({ strong: p.strongMagnitude, weak: p.weakMagnitude, duration: p.duration });
          return Promise.resolve('complete');
        },
      },
    } as unknown as Gamepad;
    const rumble = attachRumble({ pads: () => [pad] });
    // A ball pressed into a wave: a knock every step for half a second.
    for (let t = 0; t < 500; t += 1000 / 60) rumble('knock', t);
    expect(played.length, `${played.length} pulses in half a second of knocks`).toBeLessThanOrEqual(Math.ceil(500 / FEEL_GAP_MS));
    expect(played.length).toBeGreaterThan(0);
    const before = played.length;
    rumble('burn', 501);
    expect(played.length, 'a burn inside the gap of a knock was dropped').toBe(before + 1);
    expect(played[played.length - 1]!.strong).toBe(FEELS.burn.strong);
  });

  it('with no pad that can rumble and no motor handed over, nothing is played and nothing throws', () => {
    const rumble = attachRumble({ pads: () => [null, { connected: true } as unknown as Gamepad] });
    expect(() => rumble('burn', 0)).not.toThrow();
    const buzzed: number[] = [];
    const phone = attachRumble({ pads: () => [], buzz: (ms) => buzzed.push(ms) });
    phone('knock', 0);
    phone('knock', 10);
    expect(buzzed, 'a phone buzzed twice inside the gap').toEqual([FEELS.knock.buzz]);
  });

  it('the frame names the feel and cannot see the setting — 0024', () => {
    const frame = readFileSync(new URL('../src/app/frame.ts', import.meta.url), 'utf8');
    const feels = readFileSync(new URL('../src/content/feels.ts', import.meta.url), 'utf8');
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(strip(frame).includes('content/rumble'), 'the frame imports the rumble setting').toBe(false);
    expect(strip(feels).includes('rumble.ts'), 'the feels import the rumble setting').toBe(false);
  });

  it('the ball is drawn bigger the step it lands and settles back within a tenth of a second', () => {
    const { world, frame } = flying();
    expect(world.ship.swell).toBe(1);
    const body = bodyOn(world, 1e9);
    world.ramHeat = 0;
    frame.step();
    expect(world.ship.swell, 'the landing step drew the ball no bigger').toBeGreaterThan(1);
    expect(world.ship.swell, 'the punch is more than a tenth').toBeLessThanOrEqual(1.1 + 1e-9);
    world.enemies.releaseAt(world.enemies.size - 1);
    void body;
    for (let i = 0; i < STEPS_PER_SECOND / 10; i++) frame.step();
    expect(world.ship.swell, 'the punch had not settled in a tenth of a second').toBe(1);
  });
});

describe('0613 — the War Dance sends out a shockwave', () => {
  it('reaches a tenth of the lane either side, about — no further than a fifth, no nearer than the ram’s own twice', () => {
    expect(WAVE.radius / ACROSS_SPAN).toBeGreaterThanOrEqual(0.08);
    expect(WAVE.radius / ACROSS_SPAN).toBeLessThanOrEqual(0.2);
    expect(WAVE.radius).toBeGreaterThan(2 * DANCE.reach);
  });

  it('every ship that dances sends one off a wall, and its edge is drawn where it lands', () => {
    for (const ship of SHIP_KINDS) {
      const { world, frame } = flying(ship);
      launchSpecial(world, 'warDance');
      let seen = 0;
      for (let i = 0; i < DANCE.steps && world.danceBounces === 0; i++) frame.step();
      expect(world.danceBounces, `the ${ship} met no wall`).toBeGreaterThan(0);
      for (let i = 0; i < DANCE.wave.grow + DANCE.wave.fade; i++) {
        for (const wave of waves(world)) {
          seen++;
          // The ring is its reach: drawn at `swell` of a bitmap the row's radius across both ways.
          expect(wave.swell * (SPRITE_EXTENT[SPRITE_KINDS[wave.sprite]!] / 2), `the ${ship}'s wave is drawn off its edge`).toBeCloseTo(wave.radius, 6);
          expect(wave.radius).toBeLessThanOrEqual(WAVE.radius + 1e-9);
        }
        frame.step();
      }
      expect(seen, `the ${ship} sent out no wave`).toBeGreaterThan(0);
    }
  });

  it('lands once on every body its edge crosses, and on nothing past its reach', () => {
    const { world, frame } = flying('fighter');
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'warDance');
    // Hold the dance off every wall so the only wave is the one a landing sends.
    // A body on the ship for the dance to land on, which sends the wave.
    bodyOn(world, 100, world.ship.along, world.ship.across);
    const ring = bodyOn(world, 100, world.ship.along + WAVE.radius - 2, world.ship.across);
    const far = bodyOn(world, 100, world.ship.along + WAVE.radius + ENEMIES.drifter.radius + 4, world.ship.across);
    world.danceAlong = 0;
    world.danceAcross = 0;
    frame.step();
    expect(waves(world).length, 'the dance landed and sent out no wave').toBe(1);
    for (let i = 0; i < DANCE.wave.grow + DANCE.wave.fade; i++) {
      // Riding with the ship so the landing on `near` is the dance's and the others stay where they were put.
      for (const e of [ring, far]) e.velAlong = world.scrollPerStep;
      world.danceAlong = 0;
      world.danceAcross = 0;
      world.waveIn = Number.MAX_SAFE_INTEGER;
      frame.step();
    }
    expect(100 - ring.health, 'the body under the ring took it other than once').toBe(WAVE.damage);
    expect(far.health, 'a body past the reach was struck').toBe(100);
  });

  it('never two inside its gap, so a dance sends a dozen or so and not one a step', () => {
    const { world, frame } = flying('ball');
    launchSpecial(world, 'warDance');
    let sent = 0;
    let last = -1;
    for (let i = 0; i < DANCE.steps; i++) {
      const before = waves(world).filter((w) => w.face === 0).length;
      bodyOn(world, 1e9);
      frame.step();
      void before;
      for (const w of waves(world))
        if (w.radius <= DANCE.reach + (WAVE.radius - DANCE.reach) / DANCE.wave.grow + 1e-9) {
          if (last >= 0) expect(i - last, 'two waves inside the gap').toBeGreaterThanOrEqual(DANCE.wave.gap);
          if (last !== i) sent++;
          last = i;
        }
      world.enemies.clear();
    }
    expect(sent, `${sent} waves in a dance`).toBeLessThanOrEqual(Math.ceil(DANCE.steps / DANCE.wave.gap));
    expect(sent).toBeGreaterThan(3);
  });

  it('on a boss it lands once a wave, at the window', () => {
    const { world, frame } = flying('fighter');
    world.fireIn = Number.MAX_SAFE_INTEGER;
    const boss = world.bossPool.spawn()!;
    reset(boss, world.ship.along + WAVE.radius - 1, world.ship.across, BOSSES.sentinel);
    boss.radius = 1;
    boss.health = 1e6;
    world.bossFullHealth = 1e6;
    boss.fireIn = Number.MAX_SAFE_INTEGER;
    boss.velAlong = world.scrollPerStep;
    launchSpecial(world, 'warDance');
    world.danceAlong = 0;
    world.danceAcross = 0;
    // A body on the ship to land on, so the wave is sent, and the boss out of the ram's reach.
    bodyOn(world, 1e9);
    for (let i = 0; i < DANCE.wave.grow + DANCE.wave.fade; i++) {
      world.danceAlong = 0;
      world.danceAcross = 0;
      world.waveIn = i === 0 ? 0 : Number.MAX_SAFE_INTEGER;
      // Held where the wave will reach it, inside the edge's last step of growth; the boss's own drive moves it.
      boss.along = world.ship.along + WAVE.radius - 1;
      boss.across = world.ship.across;
      frame.step();
    }
    expect(1e6 - boss.health, 'the boss took the wave other than once, at one window').toBeCloseTo(WAVE.damage, 6);
  });
});

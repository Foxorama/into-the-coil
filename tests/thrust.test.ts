import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GameFrame, type World } from '../src/app/frame.ts';
import { BURN_ASK, BURN_ROOT, EASE_ASK, LEAN_KINDS, PULSE_STEPS, THRUST, THRUST_KINDS, type LeanKind } from '../src/content/exhaust.ts';

/** Every bitmap a thrust state can show, whichever way it leans. */
function frames(kind: 'idle' | 'burn' | 'ease'): number[] {
  return LEAN_KINDS.flatMap((lean) => [...THRUST[kind].frames[lean]]);
}

/** Which way a flame's bitmap leans, read off the rows — or `null` for a sprite no row lists. */
function leanOf(sprite: number): LeanKind | null {
  for (const kind of THRUST_KINDS) {
    for (const lean of LEAN_KINDS) {
      if (THRUST[kind].frames[lean].includes(sprite)) return lean;
    }
  }
  return null;
}
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { MAX_NOZZLES, SHIP_KINDS, SHIPS } from '../src/content/ships.ts';
import { SHIP_SPEED } from '../src/sim/flight.ts';
import type { Intent } from '../src/sim/intent.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE SHIP FLIES — 0230.
 *
 * `docs/decisions/0230-the-ship-flies.md`. Asked for: *"ship engines need to be pulsing ion
 * thrusters that burn when you hard push to the right and that sway up, down, forward and reverse
 * in response to movement, as it doesn't feel like I'm flying, it feels like I'm just moving a thing
 * around."* What is held is the mechanism: there is a flame while the ship flies and none while it
 * does not; it sits behind the tail; it burns on a hard push and eases on a hard pull, read off the
 * ASK; it pulses on the step clock; and it hangs against the ship's sideways velocity.
 *
 * ⚠️ **DRIVEN THROUGH THE REAL FRAME, WITH A HAND ON THE STICK.** The fixture's input asks for
 * nothing, so every test here swaps in an ask of its own — the one thing about the exhaust a table
 * cannot show is that it answers the hand.
 */

/** A world whose stick this test holds. */
function piloted(): { world: World; frame: GameFrame; ask: { along: number; across: number } } {
  const built = playableWorld(NO_LEVEL);
  const ask = { along: 0, across: 0 };
  built.world.input = {
    contribute(intent: Intent): void {
      intent.along = ask.along;
      intent.across = ask.across;
    },
    spend(): void {},
    release(): void {},
  };
  return { world: built.world, frame: new GameFrame(built.world), ask };
}

const drawn = (w: World): string => SPRITE_KINDS[w.exhaust.at(0).sprite] ?? '?';

describe('0230 — the ship flies', () => {
  it('THE REPORTED ONE: a flying ship has a flame behind its tail, and a wreck has none', () => {
    const { world: w, frame } = piloted();
    frame.step();
    expect(w.exhaust.size, 'the ship is flying and has no exhaust').toBe(w.shipRow.nozzles.length);
    const flame = w.exhaust.at(0);
    const nozzle = w.shipRow.nozzles[0]!;
    expect(flame.along, 'the flame is not behind the ship').toBeLessThan(w.ship.along);
    expect(w.ship.along - flame.along, 'the flame is not at the tail').toBeCloseTo(-nozzle.along + THRUST.idle.trail, 6);
    // The flame's root has to reach the ship's own nozzles — its row's, since 0441.
    const root = flame.along + SPRITE_EXTENT[SPRITE_KINDS[flame.sprite]!] * 0.42 * 0.9;
    expect(root, 'the flame’s root does not reach the tail, so it floats behind the ship').toBeGreaterThan(w.ship.along + nozzle.along - 0.5);
    // A wreck has no engines.
    w.ship.health = 0;
    frame.step();
    expect(w.shipPool.size, 'the ship did not wreck, so this measured nothing').toBe(0);
    expect(w.exhaust.size, 'the wreck still has a flame').toBe(0);
  });

  it('burns on a hard push forward and eases on a hard pull back, read off the ask', () => {
    const { world: w, frame, ask } = piloted();
    frame.step();
    expect(frames('idle'),'the idle flame is not what a resting ship shows').toContain(w.exhaust.at(0).sprite);
    ask.along = 1;
    frame.step();
    expect(frames('burn'),`a hard push shows ${drawn(w)} rather than a burn`).toContain(w.exhaust.at(0).sprite);
    ask.along = -1;
    frame.step();
    expect(frames('ease'),`a hard pull shows ${drawn(w)} rather than an ease`).toContain(w.exhaust.at(0).sprite);
    // And a nudge is neither: half deflection idles.
    ask.along = BURN_ASK / 2;
    frame.step();
    expect(frames('idle'),'a nudge forward burns').toContain(w.exhaust.at(0).sprite);
    ask.along = EASE_ASK / 2;
    frame.step();
    expect(frames('idle'),'a nudge back eases').toContain(w.exhaust.at(0).sprite);
  });

  it('still burns with the ship pinned against the front of its box, because the ask is the state', () => {
    /*
      ⚠️ **THE VELOCITY WOULD SAY IDLE HERE, AND THE PLAYER IS PUSHING AS HARD AS THEY CAN.** The
      box clamps the velocity to the scroll rate at its front edge; a flame read off the velocity
      would go quiet at the exact moment the player leans on the stick.
    */
    const { world: w, frame, ask } = piloted();
    ask.along = 1;
    for (let i = 0; i < 240; i++) frame.step();
    expect(w.ship.velAlong - w.scrollPerStep, 'the ship is not pinned, so this measured nothing').toBeLessThan(SHIP_SPEED * 0.2);
    expect(frames('burn'),`pinned and pushing, the engines show ${drawn(w)}`).toContain(w.exhaust.at(0).sprite);
  });

  it('pulses: a pulsing state alternates its frames on the step clock', () => {
    const { world: w, frame } = piloted();
    const seen = new Set<number>();
    for (let i = 0; i < PULSE_STEPS * 4; i++) {
      frame.step();
      seen.add(w.exhaust.at(0).sprite);
    }
    expect(seen.size, 'the idle flame never changes, so it is a sticker and not a thruster').toBe(THRUST.idle.frames.level.length);
    // And it holds each frame for PULSE_STEPS rather than flickering every step.
    const run: number[] = [];
    for (let i = 0; i < PULSE_STEPS * 2; i++) {
      frame.step();
      run.push(w.exhaust.at(0).sprite);
    }
    let longest = 1;
    let current = 1;
    for (let i = 1; i < run.length; i++) {
      current = run[i] === run[i - 1] ? current + 1 : 1;
      longest = Math.max(longest, current);
    }
    expect(longest, 'a frame is not held for its pulse').toBeGreaterThanOrEqual(PULSE_STEPS);
  });

  it('leans: the flame stays on the tail and leans against a climb and a dive, and rights itself when the ship stops', () => {
    /*
      ⚠️ **A LEAN AND NOT A SWAY, SINCE 0241.** 0230's guard held the flame's CENTRE off the tail
      against the across velocity, and that played as *"the thrusters when you go up/down don't
      angle, they move up and down on the ship which is a bug."* What is held now is the opposite on
      the first half — the flame is on the tail on every step, however the ship moves — and that
      the bitmap it shows is a leaning one while the ship moves across, and a level one when it does
      not. Which frame leans which way is the row's (`src/content/exhaust.ts`).
    */
    const { world: w, frame, ask } = piloted();
    frame.step();
    // On its nozzle across, since 0448 — the fighter's first is a nacelle off the centreline.
    const off = w.shipRow.nozzles[0]!.across;
    expect(w.exhaust.at(0).across, 'a ship going straight has a flame off its nozzle').toBeCloseTo(w.ship.across + off, 6);
    expect(leanOf(w.exhaust.at(0).sprite), 'a ship going straight has a leaning flame').toBe('level');
    ask.across = -1;
    for (let i = 0; i < 20; i++) frame.step();
    expect(w.ship.velAcross, 'the ship is not climbing, so this measured nothing').toBeLessThan(0);
    expect(w.exhaust.at(0).across, 'the flame slid off the tail in a climb').toBeCloseTo(w.ship.across + off, 6);
    expect(leanOf(w.exhaust.at(0).sprite), 'the flame does not lean in a climb').toBe('climb');
    ask.across = 1;
    for (let i = 0; i < 40; i++) frame.step();
    expect(w.ship.velAcross, 'the ship is not diving, so this measured nothing').toBeGreaterThan(0);
    expect(w.exhaust.at(0).across, 'the flame slid off the tail in a dive').toBeCloseTo(w.ship.across + off, 6);
    expect(leanOf(w.exhaust.at(0).sprite), 'the flame does not lean in a dive').toBe('dive');
    ask.across = 0;
    for (let i = 0; i < 120; i++) frame.step();
    expect(leanOf(w.exhaust.at(0).sprite), 'the flame never rights itself').toBe('level');
  });

  it('0448 — burns one flame on each of its own nozzles, in every ship, and swells on them at full burn', () => {
    /*
      ⚠️ **THE ASK, IN WORLD UNITS ON THE PICTURE'S OWN AXES.** *"One thruster is fine for the station
      wagon and firebird but they need to have one thruster in game as well"*, and *"the engines on the
      two don't fit properly when they do the full blast."* The fighter's two flames were one bitmap laid
      on every ship's centreline, so a car burned two, both into the slope of its boot. Each flame is
      measured against where the row says the nozzle is, so a car with one pipe has one flame on it.
    */
    for (const kind of SHIP_KINDS) {
      const { world: w, frame } = piloted();
      w.shipRow = SHIPS[kind];
      for (const warp of [0, 1]) {
        w.warp = warp;
        frame.step();
        const row = warp > 0 ? THRUST.burn : THRUST.idle;
        expect(w.exhaust.size, `the ${kind} does not burn one flame per nozzle`).toBe(SHIPS[kind].nozzles.length);
        for (let i = 0; i < w.exhaust.size; i++) {
          const flame = w.exhaust.at(i);
          const at = SHIPS[kind].nozzles[i]!;
          expect(flame.across - w.ship.across, `the ${kind}'s flame ${i} is off its nozzle at warp ${warp}`).toBeCloseTo(at.across, 6);
          // The root, the sprite's forward edge at the size drawn, stays on the nozzle as the flame swells.
          if (warp > 0) {
            const root = flame.along + BURN_ROOT * flame.swell;
            expect(root - w.ship.along, `the ${kind}'s full-burn flame ${i} leaves its nozzle`).toBeCloseTo(at.along - row.trail + BURN_ROOT, 6);
          }
        }
      }
    }
    expect(Math.max(...SHIP_KINDS.map((k) => SHIPS[k].nozzles.length)), 'a ship burns more flames than the pool holds').toBeLessThanOrEqual(MAX_NOZZLES);
    expect(SHIPS.firebird.nozzles.length, 'the Firebird burns other than its one pipe').toBe(1);
    expect(SHIPS.estate.nozzles.length, 'the estate burns other than its one pipe').toBe(1);
    expect(SHIPS.caddie.nozzles.length, 'the caddie burns other than its two drives').toBe(2);
    expect(SHIPS.fighter.nozzles.length, 'the fighter burns other than its two nacelles').toBe(2);
  });

  it('is drawn under the shell and the ship and over every shot, and every thrust row has frames and a trail', () => {
    /*
      ⚠️ **UNDER THE SHELL, NOT BETWEEN IT AND THE SHIP.** 0050's guard holds that nothing is drawn
      between a ship and its marks, and the first draft put the flame there. The shell sits over the
      flame; the flame sits over every shot, so a bullet crossing the tail is seen crossing it.
    */
    const source = readFileSync(resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/app/mount.ts'), 'utf8');
    const order = /layers: \[([^\]]+)\]/.exec(source)![1]!.split(',').map((s) => s.trim());
    expect(order.indexOf('exhaust'), 'the exhaust is not drawn directly under the shell').toBe(order.indexOf('shieldOrbs') - 1);
    expect(order.indexOf('shieldOrbs'), 'the shell is not directly under the ship').toBe(order.indexOf('shipPool') - 1);
    expect(order.indexOf('exhaust'), 'the exhaust is drawn under the player’s fire').toBeGreaterThan(order.indexOf('missiles'));
    for (const kind of THRUST_KINDS) {
      const row = THRUST[kind];
      const every: number[] = [];
      for (const lean of LEAN_KINDS) {
        const frames = row.frames[lean];
        expect(frames.length, `${kind} has no ${lean} frames`).toBeGreaterThan(0);
        expect(frames.length, `${kind}'s ${lean} frames pulse at a different rate from its level ones`).toBe(row.frames.level.length);
        every.push(...frames);
      }
      // Every lean is its own bitmap: a lean that reused the level frame would be no lean at all.
      expect(new Set(every).size, `${kind} lists a frame twice across its leans`).toBe(every.length);
      expect(row.trail, `${kind}'s flame is not behind the ship`).toBeGreaterThan(0);
    }
    expect(THRUST.idle.frames.level.length, 'the idle flame cannot pulse').toBeGreaterThan(1);
    expect(THRUST.burn.frames.level.length, 'the burn cannot pulse').toBeGreaterThan(1);
    // A burn is longer than an idle, which is the whole of what a hard push shows.
    const longest = (kind: 'idle' | 'burn'): number => Math.max(...THRUST[kind].frames.level.map((s) => SPRITE_EXTENT[SPRITE_KINDS[s]!]));
    expect(longest('burn'), 'a burn is no longer than an idle').toBeGreaterThan(longest('idle'));
  });
});

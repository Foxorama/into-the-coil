import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { GameFrame } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { BURN_HALF, THRUST, WARP_FLAME, WARP_SCROLL } from '../src/content/exhaust.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { THEMES } from '../src/content/themes.ts';
import {
  DEFAULT_TRAVEL,
  TRAVELS,
  TRAVEL_KINDS,
  TRAVEL_MAX_STEPS,
  TRAVEL_SPOOL_STEPS,
  TRAVEL_TRAIL_STEPS,
  travelArrived,
  travelIsWaiting,
  travelMayLand,
  warpAt,
} from '../src/content/travel.ts';
import { STYLE } from '../src/app/chrome.ts';
import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import {
  CHART_OUTER,
  CHART_RING,
  CHART_STOP,
  chartRadius,
  chartTileX,
  chartTileY,
  drawChart,
  mix,
} from '../src/render/bake.ts';
import { AA_FLOOR, contrast } from './contrast.ts';
import { type Action, type State, initialState, reduce } from '../src/state/root.ts';
import { SCREENS, STEPS_PER_SECOND } from '../src/state/screens.ts';
import { tracingPen } from './paths.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE COIL IS A ROUTE, AND THE SHIP BURNS ALONG IT.
 *
 * `docs/decisions/0340-the-coil-is-a-route.md`. Asked for: *"we'll need loading screens anyway for
 * transitions and to represent moving through the galaxy."* Built first as a full-screen chart with a
 * button on it, and played:
 *
 * > *"It takes the player out of the game. We need a much smoother transition where the player's
 * > engines do a full jet burn and the ship hyper-speeds through galaxy for the loading screen and
 * > then the hyper burn trails off as they arrive at the new level."*
 *
 * ⚠️ **THAT FIRST BUILD PASSED EVERY TEST THIS FILE HAD, AND THAT IS WORTH MORE THAN ANY OF THEM.**
 * Thirteen assertions and ten probes held a screen that was correct and was the wrong thing: nothing
 * here can tell a cut from a continuation, and nothing should pretend to. What this file holds is what
 * a test CAN hold — that the burn waits for the music and no longer than a ceiling, that the one number
 * it is made of has the shape that was asked for, that the frame does with that number what the picture
 * needs, and that a level is never skipped. Whether it FEELS like flying is the play-test's.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/** Every `.ts` under a directory, recursively. An explicit walk, not a glob — `tests/style.test.ts`. */
function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith('.ts')) out.push(path);
  }
  return out;
}

const read = (file: string): string => readFileSync(resolve(root, file), 'utf8');

/**
 * Comments out, so a ban cannot fire on the sentence explaining it — `tests/sound.test.ts`'s helper
 * and its argument. What a ban is about is the import graph, and an import cannot hide in a comment.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/.*$/gm, ' ');
}

/** The row the rest of the file measures against, so *the default* is asserted once and then used. */
const FLOOR = TRAVELS[DEFAULT_TRAVEL].floorSteps;

describe('the burn holds for a floor and for the place, and for nothing else', () => {
  it('holds through its floor even when the place is already loaded', () => {
    /*
      ⚠️ **THE HALF THAT IS ALMOST ALWAYS THE LIVE CASE.** Six of the seven places state little or no
      material of their own, and 0331 bakes the next place from the APPROACH — so by the time the boss
      is dead the place has usually been in the mixer's hands for a minute. If readiness alone let the
      ship land, the engines would start trailing off before they had finished building.
    */
    expect(travelMayLand(DEFAULT_TRAVEL, 1, true), 'the burn ended on its first step').toBe(false);
    expect(travelMayLand(DEFAULT_TRAVEL, FLOOR - 1, true), 'the burn ended a step early').toBe(false);
    expect(travelMayLand(DEFAULT_TRAVEL, FLOOR, true), 'the burn outstayed its floor').toBe(true);
  });

  it('and holds past its floor while the place is still being made', () => {
    // The case 0331 is about: The Black Heart is thirty-five seconds of synthesis, and its first
    // movement is twenty-five seconds long. Arriving without it is arriving without the piece.
    expect(travelMayLand(DEFAULT_TRAVEL, FLOOR, false), 'the ship arrived before its music').toBe(false);
    expect(travelMayLand(DEFAULT_TRAVEL, FLOOR * 3, false), 'the ship arrived before its music').toBe(false);
  });

  it('and the ceiling ends it whatever the music is doing', () => {
    /*
      ⚠️ **THE HONEST FAILURE, AND THE ONE STATE THE GAME IS KNOWN TO SURVIVE.** A bake that never
      lands — a browser or a machine nobody here has — must not be a run that never continues. Past
      the ceiling the music arrives when it arrives, which is what every level did before 0331.
    */
    for (const kind of TRAVEL_KINDS) {
      expect(travelMayLand(kind, TRAVEL_MAX_STEPS, false), `${kind} is held past the ceiling for ever`).toBe(true);
      expect(
        TRAVELS[kind].floorSteps,
        `${kind} has a floor above the ceiling, so the ceiling is what ends every burn`,
      ).toBeLessThan(TRAVEL_MAX_STEPS);
    }
  });

  it('and the wait is only ever SAID while the place is what is holding it up', () => {
    /*
      `docs/game.md` bans restating what the screen already shows, and 0063 makes the same point about
      a countdown over a screen that has not stopped the world: a line about waiting under a burn that
      is simply being a burn is the game apologising for its own art.
    */
    expect(travelIsWaiting(DEFAULT_TRAVEL, FLOOR * 2, true), 'a ready burn said it was waiting').toBe(false);
    expect(travelIsWaiting(DEFAULT_TRAVEL, 1, false), 'the burn apologised inside its own floor').toBe(false);
    expect(travelIsWaiting(DEFAULT_TRAVEL, FLOOR, false), 'the burn was held in silence').toBe(true);
  });

  it('and the knob shortens the default, and neither end of it is shorter than the engines take to build', () => {
    /*
      ⚠️ **0024: there is one game and it is the loud one, and a knob is a knob over that default.**

      ⚠️ **AND THE FLOOR MAY NOT BE INSIDE THE SPOOL**, which is a claim about the PICTURE rather than
      about a number: the place is swapped under the streaks at full burn, because that is where
      forty-four bright lines hide a re-bake of fifty-eight bitmaps. A burn allowed to start trailing
      off before it had finished building would never get there, and the swap would happen — if at all
      — on the step the ship arrived, in plain view, which is the hitch this design exists to bury.
    */
    for (const kind of TRAVEL_KINDS) {
      expect(TRAVELS[kind].floorSteps, `${kind} trails off before it reaches full burn`).toBeGreaterThanOrEqual(
        TRAVEL_SPOOL_STEPS,
      );
      expect(TRAVELS[kind].title.length, `${kind} has no name on the chooser`).toBeGreaterThan(0);
      expect(TRAVELS[kind].hint.length, `${kind} has nothing said about it`).toBeGreaterThan(0);
      if (kind === DEFAULT_TRAVEL) continue;
      expect(
        TRAVELS[kind].floorSteps,
        'the default is not the longest burn — a comfort knob that lengthens the default is 0024 backwards',
      ).toBeLessThan(FLOOR);
    }
  });

  it('and the whole of it is stated in seconds a player would recognise', () => {
    /*
      ⚠️ **IN SECONDS, WHICH IS THE UNIT THE NUMBERS WERE CHOSEN IN** — 0027's rule that at least one
      assertion is written in units the player experiences. What a player sits through is the floor
      AND the tail, so that is what is added up.

      ⚠️ **AND IT HAS BEEN PLAYED ONCE: FOUR SECONDS, AND *"if anything could be slightly longer."***
      0341. Five now, with the whole second spent at full burn. Still the number most likely to be
      wrong — 0063 says the same of its own three, in the same words — but it moved on a report.
    */
    const seconds = (kind: (typeof TRAVEL_KINDS)[number]): number =>
      (TRAVELS[kind].floorSteps + TRAVEL_TRAIL_STEPS) / STEPS_PER_SECOND;
    expect(seconds('scene')).toBe(5);
    expect(seconds('brief')).toBe(3);
    expect(TRAVEL_MAX_STEPS / STEPS_PER_SECOND).toBe(20);
  });
});

describe('the burn is one number, and it has the shape that was asked for', () => {
  it('builds from nothing, holds at full, and trails off to nothing — with no step in it anywhere', () => {
    /*
      *"The player's engines do a full jet burn… and then the hyper burn trails off as they arrive."*
      Builds, holds, trails off. Walked one step at a time through a burn held a second past its floor,
      which is the shape every real one has.

      ⚠️ **THE LARGEST SINGLE STEP IS ASSERTED, AND THAT IS THE WORD *SMOOTHER* AS ARITHMETIC.** Every
      star on the screen moves at this number times a constant, so a jump in it is a jolt in all of
      them at once. A linear ramp over the spool would step by a sixtieth; smoothstep peaks at one and
      a half times that in the middle and is NOUGHT at both ends, which is the property that matters —
      the burn does not start or stop with a corner.
    */
    const landingAt = FLOOR + 60;
    const end = landingAt + TRAVEL_TRAIL_STEPS;
    let biggest = 0;
    let peak = 0;
    for (let step = 1; step <= end; step += 1) {
      const now = warpAt(step, step >= landingAt ? landingAt : -1);
      const before = warpAt(step - 1, step - 1 >= landingAt ? landingAt : -1);
      biggest = Math.max(biggest, Math.abs(now - before));
      peak = Math.max(peak, now);
      if (step < TRAVEL_SPOOL_STEPS) expect(now, `the burn fell back while building, at step ${step}`).toBeGreaterThanOrEqual(before);
      if (step > landingAt) expect(now, `the burn surged while trailing off, at step ${step}`).toBeLessThanOrEqual(before);
      if (step >= TRAVEL_SPOOL_STEPS && step <= landingAt) expect(now, `the burn sagged while held, at step ${step}`).toBe(1);
    }
    expect(warpAt(0, -1), 'the burn starts already burning').toBe(0);
    expect(peak, 'the burn never reaches full').toBe(1);
    expect(warpAt(end, landingAt), 'the ship arrives still burning').toBe(0);
    expect(biggest, 'the burn has a step in it — every star on the screen jolts at once').toBeLessThan(
      1.6 / Math.min(TRAVEL_SPOOL_STEPS, TRAVEL_TRAIL_STEPS),
    );
    // And the tail is the longer half, which is the asked-for emphasis: it TRAILS off.
    expect(TRAVEL_TRAIL_STEPS, 'the burn ends more abruptly than it began').toBeGreaterThan(TRAVEL_SPOOL_STEPS);
  });

  it('and the ship has arrived exactly when the tail is spent, and not while it is held', () => {
    expect(travelArrived(FLOOR * 4, -1), 'a burn still being held reported the ship as arrived').toBe(false);
    expect(travelArrived(FLOOR + TRAVEL_TRAIL_STEPS - 1, FLOOR), 'the ship arrived a step early').toBe(false);
    expect(travelArrived(FLOOR + TRAVEL_TRAIL_STEPS, FLOOR), 'the ship never arrives').toBe(true);
  });
});

describe('the frame burns by that number, and the player keeps the ship', () => {
  /** A world with nothing in it, flown for a few steps at a given burn. */
  function flown(warp: number, steps = 30) {
    const { world } = playableWorld(NO_LEVEL);
    const frame = new GameFrame(world);
    world.warp = warp;
    for (let i = 0; i < steps; i += 1) frame.step();
    return world;
  }

  it('the camera runs at the engine’s own multiple, and the ship goes with it', () => {
    /*
      ⚠️ **THE SECOND HALF IS THE ONE THAT MATTERS, AND IT IS IN SCREEN UNITS.** 0023 and 0034: every
      speed is in the camera's frame, so a camera at twelve times its rate has to carry the ship with
      it. If it did not, the ship would slide off the back of the screen in a quarter of a second — the
      burn would take the player out of the game in the most literal way available. Where the ship is
      ON THE SCREEN is `along − cameraAlong`, and it must not care how fast the camera is going.
    */
    const still = flown(0);
    const burning = flown(1);
    expect(still.scrollPerStep, 'a world that is not burning is not at its own rate').toBeCloseTo(still.scrollRate, 9);
    expect(burning.scrollPerStep / burning.scrollRate, 'full burn is not the engine’s multiple').toBeCloseTo(
      WARP_SCROLL,
      9,
    );
    expect(
      burning.ship.along - burning.cameraAlong,
      'the ship is somewhere else on the screen because the camera sped up',
    ).toBeCloseTo(still.ship.along - still.cameraAlong, 6);
  });

  it('and the flame swells with the burn while its ROOT stays on the tail', () => {
    /*
      ⚠️ **THE ROOT, IN WORLD UNITS BEHIND THE SHIP, AT NOUGHT AND AT FULL.** The flame's sprite is
      scaled about its centre and its root is at its forward edge, so the two naive offsets are both
      wrong: the old one starts a swollen flame inside the hull, and a multiple of it opens a gap
      behind the ship that widens as the engines build. Looked at, either is the flame coming off the
      ship. What is held still is where the flame BEGINS.
    */
    const rootBehind = (warp: number): number => {
      const world = flown(warp);
      const flame = world.exhaust.at(0);
      // The sprite's forward edge: its centre, plus half its extent at the size it is drawn.
      return world.ship.along - (flame.along + BURN_HALF * flame.swell);
    };
    const swellAt = (warp: number): number => flown(warp).exhaust.at(0).swell;
    expect(swellAt(1), 'the flame is not at its full size at full burn').toBeCloseTo(WARP_FLAME, 9);
    expect(swellAt(0.5), 'the flame does not grow WITH the burn, so it cannot trail off').toBeCloseTo(
      1 + (WARP_FLAME - 1) / 2,
      9,
    );
    // Burning at nought is the ordinary hard-forward flame, which a parked fixture is not asking for;
    // a whisker of burn forces the same row at the same size, so the two compare like with like.
    expect(rootBehind(1), 'the flame’s root left the tail as it grew').toBeCloseTo(rootBehind(1e-9), 6);
    expect(rootBehind(1e-9), 'the burn’s root is not where the burn row puts it').toBeCloseTo(
      THRUST.burn.trail - BURN_HALF,
      6,
    );
  });
});

describe('a crossing carries the run forward exactly once', () => {
  /**
   * The shell, minus the canvas: a world, the real reducer, and the real lifecycle over both —
   * `tests/continue.test.ts`'s fixture, for its reasons.
   *
   * ⚠️ **The real `reduce`, never a stub.** Half of what the last crossing does is a cross-slice
   * agreement in `src/state/root.ts` — *a level cleared past the end of the run is the run finished* —
   * and a fixture that dispatched into a fake would be the one thing that could not see a burn being
   * offered to a run that has already ended.
   */
  function shell() {
    const built = playableWorld(LEVELS[LEVEL_KINDS[0]!], DIFFICULTY_KINDS[0]!);
    let current: State = initialState;
    const dispatch = (action: Action): void => {
      current = reduce(current, action);
    };
    dispatch({ slice: 'run', type: 'begin', difficulty: DIFFICULTY_KINDS[0]! });
    return {
      world: built.world,
      state: (): State => current,
      dispatch,
      lifecycle: makeLifecycle(built.world, dispatch, () => current.run),
    };
  }

  /** A boss died: `src/app/mount.ts`'s `onCleared`, as two dispatches. */
  const clearLevel = (s: ReturnType<typeof shell>): void => {
    s.dispatch({ slice: 'run', type: 'levelCleared' });
    s.dispatch({ slice: 'screen', type: 'show', screen: 'cleared' });
  };

  it('Onward starts the burn and touches nothing, and arriving is what enters the level', () => {
    /*
      ⚠️ **THE ORDER IS THE DESIGN.** A level entered at the START of several seconds at twelve times
      the scroll rate has its opening waves — which `src/content/levels.ts` places inside the spawn
      horizon on purpose — flown past before anybody could see them. So the field during a burn is
      empty by construction, and the script changes on the step the ship arrives.
    */
    const s = shell();
    const leaving = s.world.level;
    clearLevel(s);
    s.lifecycle.onward();
    expect(s.state().screen.current, 'Onward went straight to the level and skipped the burn').toBe('travel');
    expect(s.world.level, 'the next level was entered at the start of the burn, and will be flown past').toBe(leaving);
    s.lifecycle.arrive();
    expect(s.state().screen.current, 'the burn did not hand the run back').toBe('playing');
    expect(s.world.level, 'the ship arrived in the level it left').toBe(LEVELS[LEVEL_KINDS[1]!]);
  });

  it('THE BUG NEXT DOOR: crossing a level advances it exactly once', () => {
    /*
      ⚠️ **0339 HAD JUST FINISHED FIXING THIS ONE SCREEN AWAY.** A re-armed countdown fired
      `onCleared` nine times and a run went from The Labyrinth to The Toxic Mire with Rime Shelf never
      played — *"we've somehow lost the ice level."* The burn is a second thing between two levels,
      spending its own clock, with its own way out; it is exactly the shape that bug had, so the
      assertion is written here rather than assumed from there.

      ⚠️ **AND IT IS ASSERTED THROUGH THE REAL VERBS.** A test that dispatched the screens itself would
      be asking whether the test advances the level.
    */
    const s = shell();
    clearLevel(s);
    s.lifecycle.onward();
    expect(s.state().run.level, 'the burn is towards the wrong place').toBe(1);
    s.lifecycle.arrive();
    expect(s.state().run.level, 'arriving advanced the level a second time').toBe(1);
    expect(s.world.levelIndex, 'the field is not on the level the run says').toBe(1);
    // And a second crossing moves it exactly one more, so nothing accumulated on the first.
    clearLevel(s);
    s.lifecycle.onward();
    s.lifecycle.arrive();
    expect(s.state().run.level, 'two crossings did not advance two levels').toBe(2);
    expect(s.world.levelIndex, 'the field is not on the level the run says').toBe(2);
  });

  it('and a run that has finished is never offered a crossing', () => {
    /*
      ⚠️ **THE CROSS-SLICE AGREEMENT IS WHAT MAKES THIS TRUE, AND IT IS NOT IN THE SHELL.**
      `src/state/root.ts` turns a `cleared` past the end of the roster into `victory`, so the control
      the burn hangs off is never pressed — which is why `travel` needs no *is there an eighth place*
      branch of its own. The day somebody moves that agreement into `mount`, this goes red.
    */
    const s = shell();
    for (let i = 0; i < LEVEL_KINDS.length; i += 1) clearLevel(s);
    expect(s.state().run.level, 'the roster did not run out').toBeGreaterThanOrEqual(LEVEL_KINDS.length);
    expect(s.state().screen.current, 'a finished run was offered another place to fly to').toBe('victory');
  });

  it('and the row it is on is the game with words over it, exactly as the level break is', () => {
    /*
      ⚠️ **ALL FOUR, AND EACH ONE IS A SENTENCE OF THE PLAY REPORT.** `steps` and `dims` are *"it takes
      the player out of the game"*: the first build stopped the world and drew over it. No actions is
      *"it felt like a button click was needed, which is the same thing."* `pushed` is what keeps a row
      with no heading and no button from being the second screen in this project to be shown correctly
      and be invisible (0210 was the first).
    */
    expect(SCREENS.travel.steps, 'the burn stops the world — the player is taken out of the game').toBe(true);
    expect(SCREENS.travel.dims, 'the burn paints over the game it is happening in').toBe(false);
    expect(SCREENS.travel.actions, 'the burn has a button on it, which reads as *press me*').toEqual([]);
    expect(SCREENS.travel.pushed, 'the burn has no words and no way to be given any').toBe(true);
    // And the respite in front of it is untouched: 0063's screen is still a banner over a flying run.
    expect(SCREENS.cleared.steps, '0063 lost its respite to the crossing').toBe(true);
    expect(SCREENS.cleared.dims, '0063 lost its respite to the crossing').toBe(false);
  });
});

describe('the chart is the roster, drawn as a descent', () => {
  const STOPS = LEVEL_KINDS.length;
  const LEGS = STOPS - 1;
  const at = (stop: number): readonly [number, number] => {
    const u = stop / LEGS;
    return [chartTileX(u), chartTileY(u)];
  };

  it('reads as a descent toward the centre, which is the one thing the product definition asks of it', () => {
    /*
      `docs/game.md`, under *Open*: *"The chart's shape. It must read as descent toward the centre, and
      must not be a copy of the star map."* The first half is arithmetic and is asserted here; the
      second is a judgement and is not a thing a test can hold.
    */
    for (let stop = 1; stop < STOPS; stop += 1) {
      expect(
        chartRadius(stop / LEGS),
        `stop ${stop} is no closer to the centre than the one before it — the route stopped descending`,
      ).toBeLessThan(chartRadius((stop - 1) / LEGS));
    }
    const [lastX, lastY] = at(STOPS - 1);
    expect(lastX, 'the last place on the roster is not at the centre of the chart').toBeCloseTo(0.5, 6);
    expect(lastY, 'the last place on the roster is not at the centre of the chart').toBeCloseTo(0.5, 6);
    // And it is The Black Heart that is there, which is the fiction the geometry is answering.
    expect(THEMES[LEVELS[LEVEL_KINDS[STOPS - 1]!].theme].title).toBe('The Black Heart');
  });

  it('and every stop is inside the canvas, ring and all', () => {
    // 0277 shipped a serpent whose halo ran off its tile. The destination's ring is the widest mark.
    expect(CHART_OUTER + CHART_STOP * CHART_RING, 'the chart draws outside its own canvas').toBeLessThan(0.5);
    expect(chartRadius(0), 'the route no longer starts at the outside of the chart').toBe(CHART_OUTER);
    expect(chartRadius(1), 'the innermost stop is not the centre').toBe(0);
  });

  it('and no two places land on top of each other, measured in their own discs', () => {
    /*
      ⚠️ **IN STOP DIAMETERS, WHICH IS THE UNIT THE EYE USES ON THIS PICTURE** — 0027. A pair of stops
      closer together than one disc reads as one place with two names, at any size the chart is shown.

      ⚠️ **THE TIGHTEST PAIR IS THE LAST ONE, because the spiral loses radius as it goes**, and a
      straight-line radius put it at EXACTLY one diameter: two tangent discs, with the destination's
      ring cutting through the one before it. That is the defect `CHART_TIGHTEN` exists for.
    */
    let tightest = Infinity;
    for (let stop = 1; stop < STOPS; stop += 1) {
      const [x, y] = at(stop);
      const [px, py] = at(stop - 1);
      tightest = Math.min(tightest, Math.hypot(x - px, y - py) / (CHART_STOP * 2));
    }
    expect(tightest, 'two places on the chart are within a disc and a half of each other').toBeGreaterThan(1.5);
  });

  it('and the drawing is one disc per level where the curve says, with the legs behind it in their places’ colours', () => {
    /*
      ⚠️ **THE PICTURE AND NOT THE MODEL** — 0027. Everything above is arithmetic over the curve; this
      traces what the pen actually did, so a `drawChart` that drew six stops, or drew them somewhere
      else, is caught by the thing the player looks at rather than by the thing it was computed from.
    */
    const size = 512;
    const flownLegs = 3;
    const faint = '#123456';
    const { pen, trace } = tracingPen();
    drawChart(pen, size, 'vivid', flownLegs, faint);
    expect(trace.passes.length, 'the chart drew one disc per place and this is not that many').toBe(STOPS);
    expect(trace.inks.length, 'a leg per pair of places, a rim per place, and one ring on the destination').toBe(
      LEGS + STOPS + 1,
    );
    for (let stop = 0; stop < STOPS; stop += 1) {
      const [fx, fy] = at(stop);
      const points = trace.passes[stop]!.subpaths[0]!;
      // A disc is flattened to a regular polygon by the tracing pen, so its centre is its points' mean.
      const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
      const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
      expect(cx / size, `stop ${stop} is drawn away from where the route puts it`).toBeCloseTo(fx, 3);
      expect(cy / size, `stop ${stop} is drawn away from where the route puts it`).toBeCloseTo(fy, 3);
    }
    /*
      ⚠️ **A LEG BEHIND THE RUN IS ITS DESTINATION'S COLOUR AND A LEG AHEAD IS NOT ANY PLACE'S.** That
      is the whole of how this picture says *these are behind you*, so it is the claim most worth
      holding — and it is per place, read off `THEMES`, which is 0282's *can the thing differ per
      instance* asked of the chart.
    */
    for (let leg = 0; leg < LEGS; leg += 1) {
      const want = leg < flownLegs ? THEMES[LEVELS[LEVEL_KINDS[leg + 1]!].theme].glow.vivid : faint;
      expect(trace.inks[leg]!.colour, `leg ${leg} is drawn in the wrong colour`).toBe(want);
    }
  });
});

describe('the plate is lit in its place’s colour, and every place’s name can still be read on it', () => {
  /*
    `docs/decisions/0341-the-crossing-reads-as-a-nav-plate.md`. The banner was played as *"pretty basic
    at the moment graphically wise"*, and what it became is a plate framed and lit in the colour of the
    place it names — which is a per-instance quantity, and 0282 says a quantity solved from one case is
    checked in every case it runs in. It was designed against Rime Shelf's teal. The Black Heart's
    accent and The Approach's are both dim, and the two HIGH-CONTRAST columns are dimmer still.

    ⚠️ **THE MIX IS READ OUT OF THE STYLESHEET, NOT RETYPED HERE.** A test that carried its own copy
    of *45% towards white* would go on passing the day somebody set the name in the raw accent because
    it looked richer — which is exactly the edit this exists to stop. 0029: cite the line.
  */
  const share = (part: string): number => {
    const rule = new RegExp(`\\.itc-travel-crossing-${part} \\{[^}]*?\\bcolor: color-mix\\(in srgb, var\\(--itc-accent, var\\(--itc-ink\\)\\) (\\d+)%, white\\)`);
    const found = rule.exec(STYLE);
    expect(found, `the ${part} is no longer set in its place’s colour mixed towards white`).not.toBeNull();
    return Number(found![1]) / 100;
  };

  it('for all seven places, in both palettes, against the plate it is actually on', () => {
    const name = share('place');
    const kicker = share('kicker');
    const failures: string[] = [];
    for (const palette of Object.keys(PALETTES) as PaletteName[]) {
      for (const kind of LEVEL_KINDS) {
        const theme = THEMES[LEVELS[kind].theme];
        const accent = theme.glow[palette];
        /*
          ⚠️ **THE WORST THE PLATE CAN BE, WHICH IS ITS LIGHTEST.** The backing is the void at four
          fifths over the place's own backdrop, with a wash of the accent down from the top — so the
          name, which is near the top, is over backing with the full wash in it. Pale type is weakest
          on a light ground, and that is the lightest ground this plate has.
        */
        const plate = mix(mix(theme.space[palette], PALETTES[palette].space, 0.8), accent, 0.16);
        for (const [what, by] of [['name', name], ['kicker', kicker]] as const) {
          const ink = mix('#ffffff', accent, by);
          const ratio = contrast(ink, plate);
          if (ratio < AA_FLOOR) failures.push(`${theme.title} (${palette}) ${what}: ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(
      failures,
      'these cannot be read on their own plate — WCAG AA is 4.5:1, and the accent is a place’s colour, ' +
        'which nothing promises is a legible one',
    ).toEqual([]);
  });
});

describe('a comfort knob over the crossing cannot reach the game', () => {
  /**
   * ⚠️ **`src/app/frame.ts` IS THE INTERESTING ENTRY, AND HERE IT IS MORE THAN USUALLY SO.** The frame
   * is what the burn happens IN: it multiplies the scroll and swells the flame. It does both off a
   * number it is handed (`World.warp`), and must never learn that the number came from a row with a
   * comfort setting on it — a step that could read *Brief* is a step that could branch on it.
   *
   * ⚠️ **AND `src/render/scene.ts` IS ON IT**, which the style and sound bans do not need: the painter
   * draws the streaks, and the frame imports the painter. A transitive route to a setting is a route.
   */
  const FORBIDDEN = [...filesUnder('src/sim'), 'src/app/frame.ts', 'src/app/boss.ts', 'src/render/scene.ts'];

  it('finds the files it is scanning, so it cannot pass by scanning nothing', () => {
    expect(FORBIDDEN.length, 'the scan found no simulation files — the walk is broken').toBeGreaterThan(5);
    for (const file of FORBIDDEN) expect(read(file).length, `${file} is empty or missing`).toBeGreaterThan(0);
  });

  it('THE BAN: nothing that decides an outcome may import the travel table', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`: a player who shortens the crossing
      must not thereby be playing a different game. A comfort setting cannot be made safe by being
      monotone — there is no ordering in which a shorter loading screen is harder — so it is made safe
      by being unreachable from the code that decides anything.
    */
    const offenders = FORBIDDEN.filter((file) => stripComments(read(file)).includes('content/travel.ts'));
    expect(
      offenders,
      `these decide what happens and can see the travel setting: ${offenders.join(', ')}\n` +
        'A step that can read how long a loading screen lasts is a step that can branch on it.',
    ).toEqual([]);
  });
});

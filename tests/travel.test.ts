import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { drawKind } from '../src/render/bake.ts';
import { PALETTES } from '../src/content/palette.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { THEMES } from '../src/content/themes.ts';
import {
  CHART_OUTER,
  CHART_STOP,
  SPRITE_EXTENT,
  chartRadius,
  chartTileX,
  chartTileY,
} from '../src/content/sprites.ts';
import {
  DEFAULT_TRAVEL,
  TRAVELS,
  TRAVEL_KINDS,
  TRAVEL_MAX_STEPS,
  travelDone,
  travelIsWaiting,
} from '../src/content/travel.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { type Action, type State, initialState, reduce } from '../src/state/root.ts';
import { SCREENS, STEPS_PER_SECOND } from '../src/state/screens.ts';
import { tracingPen } from './paths.ts';
import { playableWorld } from './world.ts';

/**
 * THE COIL IS A ROUTE, AND THE SHIP CROSSES IT.
 *
 * `docs/decisions/0340-the-coil-is-a-route.md`. Asked for: *"we'll need loading screens anyway for
 * transitions and to represent moving through the galaxy"*, and explicitly as **a full-screen scene**
 * rather than a banner over the sky.
 *
 * ⚠️ **THE SUBJECT OF THE FIRST HALF IS `src/content/travel.ts`, WHICH EXISTS SO THAT THIS FILE CAN.**
 * *Does the crossing leave before the music is ready?* and *does a press skip the floor?* are the two
 * questions the feature is, and while they were `if`s inside `src/app/mount.ts` the only way to ask
 * either was to boot a canvas — which `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` cannot
 * break on purpose. `src/app/lifecycle.ts` and `tests/continue.test.ts` are the same pair.
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
 * and its argument.
 *
 * ⚠️ **IT CAUGHT THIS FILE'S OWN GUARD BEFORE THIS FILE WAS COMMITTED.** `src/content/sprites.ts` says
 * in prose why the curve is NOT in `src/content/travel.ts`, which is a citation the documentation
 * convention requires and a raw scan reads as an import. What a ban is about is the import graph, and
 * an import cannot hide in a comment.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/.*$/gm, ' ');
}

/** The row the rest of the file measures against, so *the default* is asserted once and then used. */
const FLOOR = TRAVELS[DEFAULT_TRAVEL].floorSteps;

describe('the crossing ends on a floor and on the place being ready, and on nothing else', () => {
  it('holds through its floor even when the place is already loaded', () => {
    /*
      ⚠️ **THE HALF THAT IS ALMOST ALWAYS THE LIVE CASE.** Six of the seven places state little or no
      material of their own, and 0331 bakes the next place from the APPROACH — so by the time the boss
      is dead the place has usually been in the mixer's hands for a minute. If readiness alone ended
      the crossing, the chart would appear and vanish inside one frame for most of a run, which is a
      flicker between two levels rather than a crossing.
    */
    expect(travelDone(DEFAULT_TRAVEL, 0, true, false), 'the crossing ended on its first step').toBe(false);
    expect(travelDone(DEFAULT_TRAVEL, FLOOR - 1, true, false), 'the crossing ended a step early').toBe(false);
    expect(travelDone(DEFAULT_TRAVEL, FLOOR, true, false), 'the crossing outstayed its floor').toBe(true);
  });

  it('and holds past its floor while the place is still being made', () => {
    // The case 0331 is about: The Black Heart is thirty-five seconds of synthesis, and its first
    // movement is twenty-five seconds long. Arriving without it is arriving without the piece.
    expect(travelDone(DEFAULT_TRAVEL, FLOOR, false, false), 'the run arrived before its music').toBe(false);
    expect(travelDone(DEFAULT_TRAVEL, FLOOR * 3, false, false), 'the run arrived before its music').toBe(false);
  });

  it('and a press takes the floor away and NOT the wait', () => {
    /*
      ⚠️ **THE TWO HALVES OF WHY THE CONTROL IS NEITHER DEAD NOR A LIE.** A press cannot make a bake
      land, so a crossing that ended on one would arrive in silence; a press that did nothing at all
      on a place still baking would be a button the player has to be told about. It leaves the moment
      there is nothing left to wait for, which for most places is the next step.
    */
    expect(travelDone(DEFAULT_TRAVEL, 1, true, true), 'a press on a ready place did not end the crossing').toBe(true);
    expect(travelDone(DEFAULT_TRAVEL, 1, false, true), 'a press made the music arrive').toBe(false);
  });

  it('and the ceiling ends it whatever the music is doing', () => {
    /*
      ⚠️ **THE HONEST FAILURE, AND THE ONE STATE THE GAME IS KNOWN TO SURVIVE.** A bake that never
      lands — a browser or a machine nobody here has — must not be a run that never continues. Past
      the ceiling the music arrives when it arrives, which is what every level did before 0331.
    */
    expect(travelDone(DEFAULT_TRAVEL, TRAVEL_MAX_STEPS, false, false), 'the crossing waited forever').toBe(true);
    for (const kind of TRAVEL_KINDS) {
      expect(travelDone(kind, TRAVEL_MAX_STEPS, false, false), `${kind} waited past the ceiling`).toBe(true);
      expect(
        TRAVELS[kind].floorSteps,
        `${kind} has a floor above the ceiling, so the ceiling is what ends every crossing`,
      ).toBeLessThan(TRAVEL_MAX_STEPS);
    }
  });

  it('and the wait is only ever SAID while the place is what is holding it up', () => {
    /*
      `docs/game.md` bans restating what the screen already shows, and 0063 makes the same point about
      a countdown over a screen that has not stopped the world: a progress line under a crossing that
      is simply being a crossing is the game apologising for four seconds of its own art.
    */
    expect(travelIsWaiting(DEFAULT_TRAVEL, 1, true, false), 'a ready crossing said it was waiting').toBe(false);
    expect(travelIsWaiting(DEFAULT_TRAVEL, 1, false, false), 'the crossing apologised inside its own floor').toBe(
      false,
    );
    expect(travelIsWaiting(DEFAULT_TRAVEL, FLOOR, false, false), 'the crossing waited in silence').toBe(true);
    // A press is the player asking now, so the answer is owed from the next step rather than from the
    // floor they have just given up.
    expect(travelIsWaiting(DEFAULT_TRAVEL, 1, false, true), 'a pressed crossing waited in silence').toBe(true);
  });

  it('and neither knob is zero, and the default is the longer one', () => {
    /*
      ⚠️ **0024: there is one game and it is the loud one, and a knob is a knob over that default.** A
      default of *Brief* would make the chart a thing nobody finds — `src/content/styles.ts`'s argument
      for defaulting to the newer look. And neither row may be zero, because a crossing shortened to
      nothing is not a shorter crossing: it is the flicker the first test in this file is about.
    */
    for (const kind of TRAVEL_KINDS) {
      expect(TRAVELS[kind].floorSteps, `${kind} is a flicker rather than a crossing`).toBeGreaterThan(0);
      expect(TRAVELS[kind].title.length, `${kind} has no name on the chooser`).toBeGreaterThan(0);
      expect(TRAVELS[kind].hint.length, `${kind} has nothing said about it`).toBeGreaterThan(0);
    }
    for (const kind of TRAVEL_KINDS) {
      if (kind === DEFAULT_TRAVEL) continue;
      expect(
        TRAVELS[kind].floorSteps,
        'the default is not the longest crossing — a comfort knob that lengthens the default is 0024 backwards',
      ).toBeLessThan(FLOOR);
    }
  });

  it('and the floor is stated in seconds a player would recognise', () => {
    /*
      ⚠️ **IN SECONDS, WHICH IS THE UNIT THE NUMBER WAS CHOSEN IN** — 0027's rule that at least one
      assertion is written in units the player experiences. `STEPS_PER_SECOND` is the one description
      of the conversion, so a change to the step rate cannot silently make this a two-second crossing.

      ⚠️ **AND IT IS THE NUMBER MOST LIKELY TO BE WRONG.** 0063 says the same of its own three seconds,
      in the same words: too short and the crossing is a flicker, too long and it is the hard pause
      between levels the respite exists to have removed. It has not been played.
    */
    expect(FLOOR / STEPS_PER_SECOND).toBe(4);
    expect(TRAVELS.brief.floorSteps / STEPS_PER_SECOND).toBe(1);
    expect(TRAVEL_MAX_STEPS / STEPS_PER_SECOND).toBe(20);
  });
});

describe('a crossing carries the run forward exactly once', () => {
  /**
   * The shell, minus the canvas: a world, the real reducer, and the real lifecycle over both —
   * `tests/continue.test.ts`'s fixture, for its reasons.
   *
   * ⚠️ **The real `reduce`, never a stub.** Half of what the last crossing does is a cross-slice
   * agreement in `src/state/root.ts` — *a level cleared past the end of the run is the run finished* —
   * and a fixture that dispatched into a fake would be the one thing that could not see a crossing
   * being offered to a run that has already ended.
   */
  function shell() {
    const built = playableWorld(LEVELS[LEVEL_KINDS[0]!], DIFFICULTY_KINDS[0]!);
    let current: State = initialState;
    const dispatch = (action: Action): void => {
      current = reduce(current, action);
    };
    return {
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

  it('Onward goes to the chart, and the chart goes to the level', () => {
    const s = shell();
    s.dispatch({ slice: 'run', type: 'begin', difficulty: DIFFICULTY_KINDS[0]! });
    expect(s.state().run.level, 'a run did not begin on the first level').toBe(0);
    clearLevel(s);
    expect(s.state().screen.current).toBe('cleared');
    s.lifecycle.onward();
    expect(s.state().screen.current, 'Onward went straight to the level and skipped the chart').toBe('travel');
    s.lifecycle.arrive();
    expect(s.state().screen.current, 'the crossing did not hand the run back').toBe('playing');
  });

  it('THE BUG NEXT DOOR: crossing a level advances it exactly once', () => {
    /*
      ⚠️ **0339 HAD JUST FINISHED FIXING THIS ONE SCREEN AWAY.** A re-armed countdown fired
      `onCleared` twice and a run went from The Labyrinth to The Toxic Mire with Rime Shelf never
      played — *"we've somehow lost the ice level."* The crossing is a second screen between two
      levels, spending its own clock, with its own way out; it is exactly the shape that bug had, so
      the assertion is written here rather than assumed from there.

      ⚠️ **AND IT IS ASSERTED THROUGH THE REAL VERBS.** `onward` is what enters the level and `arrive`
      is what lifts the curtain; a test that dispatched the screens itself would be asking whether the
      test advances the level.
    */
    const s = shell();
    s.dispatch({ slice: 'run', type: 'begin', difficulty: DIFFICULTY_KINDS[0]! });
    clearLevel(s);
    s.lifecycle.onward();
    expect(s.state().run.level, 'the crossing is on the wrong leg').toBe(1);
    s.lifecycle.arrive();
    expect(s.state().run.level, 'arriving advanced the level a second time').toBe(1);
    // And a second crossing moves it exactly one more, so nothing accumulated on the first.
    clearLevel(s);
    s.lifecycle.onward();
    s.lifecycle.arrive();
    expect(s.state().run.level, 'two crossings did not advance two levels').toBe(2);
  });

  it('and a run that has finished is never offered a crossing', () => {
    /*
      ⚠️ **THE CROSS-SLICE AGREEMENT IS WHAT MAKES THIS TRUE, AND IT IS NOT IN THE SHELL.**
      `src/state/root.ts` turns a `cleared` past the end of the roster into `victory`, so the control
      the crossing hangs off is never pressed — which is why `travel` needs no *is there an eighth
      place* branch of its own. The day somebody moves that agreement into `mount`, this goes red.
    */
    const s = shell();
    s.dispatch({ slice: 'run', type: 'begin', difficulty: DIFFICULTY_KINDS[0]! });
    for (let i = 0; i < LEVEL_KINDS.length; i += 1) clearLevel(s);
    expect(s.state().run.level, 'the roster did not run out').toBeGreaterThanOrEqual(LEVEL_KINDS.length);
    expect(s.state().screen.current, 'a finished run was offered another place to fly to').toBe('victory');
  });

  it('and the row it lands on stops the world and does not paint over it', () => {
    /*
      ⚠️ **BOTH HALVES, AND THE SECOND IS THE UNUSUAL ONE.** `steps: false` is what keeps 0076 true —
      a crossing that flew the world on would be flying the ship through a level nobody can see, and
      0076 exists because *"a background scene reset between levels"* was reported as disjointing.
      `dims: false` is because the canvas underneath is the chart rather than the game, so the dim
      would paint out the picture it was meant to protect.
    */
    expect(SCREENS.travel.steps, 'the crossing flies the level nobody can see').toBe(false);
    expect(SCREENS.travel.dims, 'the crossing paints over its own chart').toBe(false);
    expect(SCREENS.travel.actions.length, 'the crossing cannot be skipped by a hand').toBe(1);
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

  it('and every stop is inside its own bitmap, halo and all', () => {
    // 0277 shipped a serpent whose halo ran off its tile and bled into the next sprite in the atlas.
    // The destination's outer ring is the widest mark here, at 2.1 stop radii — `drawChart` has it.
    const reach = CHART_OUTER + CHART_STOP * 2.1;
    expect(reach, 'the chart draws outside its own tile and will bleed into the next sprite').toBeLessThan(0.5);
    expect(chartRadius(0), 'the route no longer starts at the outside of the chart').toBe(CHART_OUTER);
    expect(chartRadius(1), 'the innermost stop is not the centre').toBe(0);
  });

  it('and no two places land on top of each other, measured in lane units', () => {
    /*
      ⚠️ **IN WORLD UNITS ACROSS THE LANE, WHICH IS A SIZE A PLAYER HAS A FEEL FOR** — 0027. The chart
      is blitted at `SPRITE_EXTENT.chart`, which is `ACROSS_SPAN`, so a tile fraction IS a fraction of
      the lane: the ship is 7 units across and the box it flies in is 100 tall. A pair of stops closer
      together than a stop's own diameter would read as one place with two names.

      ⚠️ **THE TIGHTEST PAIR IS THE LAST ONE, because the spiral loses radius as it goes.** That is the
      pair this is really about, and it is the reason `CHART_TURNS` is barely over one: more turns
      would put the inner legs on top of each other.
    */
    const diameter = CHART_STOP * 2 * ACROSS_SPAN;
    expect(SPRITE_EXTENT.chart, 'the chart is no longer a lane across, so these units are not lane units').toBe(
      ACROSS_SPAN,
    );
    let tightest = Infinity;
    for (let stop = 1; stop < STOPS; stop += 1) {
      const [x, y] = at(stop);
      const [px, py] = at(stop - 1);
      const apart = Math.hypot(x - px, y - py) * ACROSS_SPAN;
      tightest = Math.min(tightest, apart);
    }
    expect(tightest, `two places on the chart are within ${diameter.toFixed(1)} lane units of each other`).
      toBeGreaterThan(diameter);
  });

  it('and the drawing is one disc per level, at the positions the geometry says', () => {
    /*
      ⚠️ **THE PICTURE AND NOT THE MODEL** — 0027. Everything above is arithmetic over the curve; this
      traces what the pen actually did, so a `drawChart` that drew six stops, or drew them somewhere
      else, is caught by the thing the player looks at rather than by the thing it was computed from.

      ⚠️ **THROUGH `drawKind`, WHICH IS THE ATLAS'S OWN ENTRY POINT.** `bakeChart` writes the places'
      real colours over this bitmap at a boundary and needs a `document` to do it; what `drawKind`
      draws is the same geometry in the palette's own ink, which is the half a headless test can see.
    */
    const size = 512;
    const { pen, trace } = tracingPen();
    drawKind(pen, 'chart', PALETTES.vivid, size);
    expect(trace.passes.length, 'the chart drew one disc per place and this is not that many').toBe(STOPS);
    expect(trace.inks.length, 'the chart drew a leg per pair of places, plus one ring on the destination').toBe(
      LEGS + STOPS + 1,
    );
    for (let stop = 0; stop < STOPS; stop += 1) {
      const [fx, fy] = at(stop);
      const points = trace.passes[stop]!.subpaths[0]!;
      /*
        A disc is flattened to a polygon by the tracing pen, so its centre is the mean of its points —
        which is exact for a regular polygon and is what the guard wants to know about.
      */
      const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
      const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
      expect(cx / size, `stop ${stop} is drawn away from where the route puts it`).toBeCloseTo(fx, 3);
      expect(cy / size, `stop ${stop} is drawn away from where the route puts it`).toBeCloseTo(fy, 3);
    }
  });
});

describe('a comfort knob over the crossing cannot reach the game', () => {
  /**
   * ⚠️ **`src/app/frame.ts` IS THE INTERESTING ENTRY, EXACTLY AS IT IS IN THE OTHER TWO.**
   * `tests/style.test.ts` and `tests/sound.test.ts` hold the same ban over their own tables, and the
   * frame is where somebody would reach: it is the file that already knows about screens' worth of
   * sprites, and it is also the file that decides what hits what.
   *
   * ⚠️ **AND `src/render/scene.ts` IS ON IT, WHICH THE OTHER TWO DO NOT NEED.** The painter draws the
   * crossing, so it is one import away from the table that says how long the crossing lasts — and the
   * frame imports the painter. A transitive route to a comfort setting is a route.
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

  it('and the curve is reachable from both sides of the bake, which is why it is not in that table', () => {
    /*
      ⚠️ **THE COMPANION CLAIM, AND IT IS WHAT KEEPS THE BAN ABOVE HONEST.** The route's geometry is
      needed by `src/render/bake.ts`, which strokes it, and by `src/render/scene.ts`, which puts the
      ship on it — and `tests/budget.test.ts` forbids the painter importing the baker (0022). So the
      curve lives in `src/content/sprites.ts`, a file the frame already reads, and NOT beside the
      setting. Two descriptions of one curve would put the ship beside the route rather than on it.
    */
    expect(stripComments(read('src/render/scene.ts')).includes('content/sprites.ts'), 'the painter lost the curve').toBe(
      true,
    );
    expect(stripComments(read('src/render/bake.ts')).includes('content/sprites.ts'), 'the baker lost the curve').toBe(
      true,
    );
    expect(
      stripComments(read('src/content/sprites.ts')).includes('content/travel.ts'),
      'the curve now reaches the comfort setting, so the frame does too',
    ).toBe(false);
  });
});

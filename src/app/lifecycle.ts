/**
 * THE THREE WAYS A RUN MOVES: it begins, it goes onward a level, and it is resumed after it ran out.
 *
 * `docs/decisions/0068-a-run-over-is-a-continue.md`. Each one is a pair of statements — one to the
 * reducer about the run, one to the world about the field — and the whole of what separates them is
 * **which of the two halves gets reset**:
 *
 * | | the run | the field | the shell |
 * |---|---|---|---|
 * | `begin`  | back to level one, a full complement | emptied, camera to zero | dropped |
 * | `onward` | carried forward untouched | **left exactly as it was** — 0076 | kept |
 * | `resume` | back to a full complement, level UNTOUCHED | left exactly as it was | dropped |
 *
 * ⚠️ **`onward`'s middle column changed, and it is the whole of
 * [0076](../../docs/decisions/0076-a-level-has-an-origin.md).** It used to read *emptied, camera to
 * zero*, and that was reported as *"a background scene reset between levels that's disjointing
 * because it moves the player's ship."* A level boundary is now a change of script and nothing else,
 * which also collapses the right-hand column: the shell is kept because the ship never leaves,
 * rather than because a number was read out and added back.
 *
 * ⚠️ **`resume` drops the shell with `begin` rather than keeping it with `onward`**, and it is the one
 * row where the three do not line up by which half they reset.
 * [0058](../../docs/decisions/0058-a-level-boundary-keeps-the-shell.md)'s rule is *the shell crosses a
 * boundary because the ship does* — and at a run over the ship did not cross anything. 0068's ask is
 * explicit about it: *"they start with the starting stats as if they had started a new run — default
 * lives, shields, bombs."*
 *
 * ⚠️ **This is a file rather than four closures inside `mount`, because the middle column and the
 * right-hand one are the bug.** They were three closures over `mount`'s `state`, `world` and
 * `dispatch` — which meant the only way to ask *"does a continue reset the level?"* was to boot a
 * canvas, and `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` cannot break something no test
 * can reach. `tests/continue.test.ts` drives all three against a fixture world and the real reducer.
 *
 * ⚠️ **It reads the run through a getter rather than being handed one.** `mount` owns the state and
 * reassigns it on every dispatch, so a `RunState` captured here would be one dispatch stale — and
 * the one place it is read (`enterLevel`) runs immediately after a `begin` that has just moved it.
 */

import { DIFFICULTIES, type DifficultyKind } from '../content/difficulty.ts';
import { GRIDS } from '../content/grid.ts';
import { LEVELS, LEVEL_KINDS } from '../content/levels.ts';
import { weaponFor } from '../content/pickups.ts';
import { THEMES } from '../content/themes.ts';
import { makeRng } from '../sim/rng.ts';
import type { Action } from '../state/root.ts';
import type { RunState } from '../state/slices/run.ts';
import { advanceLevel, respawn, startLevel, type World } from './frame.ts';

export interface Lifecycle {
  /** A run at a chosen tier, from the top: level one, an empty field, a full complement of lives. */
  begin(difficulty: DifficultyKind): void;
  /** The next level. Everything the run is carrying comes with it — the shell too; the field does not. */
  onward(): void;
  /** The run picked up where it ran out. A new ship, a full complement, and the same field. */
  resume(): void;
}

export function makeLifecycle(world: World, dispatch: (action: Action) => void, runOf: () => RunState): Lifecycle {
  /**
   * Put the run's current level on the field.
   *
   * ⚠️ **`LEVEL_KINDS` IS the order** — `src/content/levels.ts` refuses a second ordering table — so
   * the run's level index reads straight off it. Past the end is a run that has been finished, and
   * the caller is what decides that; this clamps rather than throwing, because a level index that
   * has run off the end is a bug in the shell and a black screen is a worse way to report it.
   */
  const enterLevel = (seamless: boolean): void => {
    /*
      ⚠️ **The clamped index is now handed to the frame as well as used to pick the row** — the
      difficulty dial is `levelIndex + weaponsOffered`
      (`docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`), so this is where a level's place
      in the run reaches the field. The clamp matters twice over: past the roster it keeps the dial at
      the last level's rather than running off the top.
    */
    const index = Math.min(runOf().level, LEVEL_KINDS.length - 1);
    const kind = LEVEL_KINDS[index]!;
    /*
      ⚠️ **TWO FUNCTIONS RATHER THAN A FLAG, and the flag it replaces was `keepShell`** —
      `docs/decisions/0076-a-level-has-an-origin.md`. A run beginning and a level boundary are not one
      operation with a switch on it: one sweeps the scene and puts the camera back to zero, the other
      changes which script is running and touches nothing the player is looking at. Naming them apart
      is what let the shell-carrying arithmetic 0058 needed disappear entirely — the ship no longer
      leaves, so there is nothing to carry.
    */
    if (seamless) advanceLevel(world, LEVELS[kind], index);
    else startLevel(world, LEVELS[kind]);
    /*
      ── THE GUN IS RE-RESOLVED HERE BECAUSE THE BEAT IS THE LEVEL'S ─────────────────────────────

      ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** A cadence is a
      subdivision of a beat and a beat is now a property of the place, so **the same upgrade list
      resolves to a different weapon in a different level.** `src/app/mount.ts` re-resolves on a
      change of the upgrade LIST by identity, which is the correct test for the thing it watches and
      is blind to this one: crossing a boundary with nothing picked up leaves the list identical and
      the tempo different.

      ⚠️ **Here rather than in `mount`, because this is the one description of *a level was
      entered*** — both paths run through it, and the alternative is the shell growing a second
      opinion about when a level changed.

      ⚠️ **The counters are clamped rather than left.** A ship crossing from a slow grid to a fast one
      carries a `fireIn` larger than the whole new cadence, which is one silent gap at the exact
      moment a level opens — and 0043 opens every level on an empty field precisely so the player can
      find the gun.
    */
    world.weapon = weaponFor(world.shipRow, runOf().upgrades, GRIDS[THEMES[LEVELS[kind].theme].grid]);
    if (world.fireIn > world.weapon.fireEvery) world.fireIn = world.weapon.fireEvery;
    if (world.missileIn > world.weapon.missileEvery) world.missileIn = world.weapon.missileEvery;
  };

  return {
    begin(difficulty: DifficultyKind): void {
      /*
        ⚠️ **Resolved to a ROW here, once, and the frame never looks a tier up by name.** Same
        argument `enemyRows` and `pickupRows` make in `mount`: a per-spawn lookup by string key is a
        cost paid forever to avoid one line at the start of a run.
      */
      world.difficulty = DIFFICULTIES[difficulty];
      /*
        ⚠️ **`seedField` is NOT called here, and it used to be.** A random opening field is the right
        answer for a scene proving the page draws and the wrong one for an authored level: it puts
        content the designer did not write in front of the player, at positions no play-test can act
        on. `src/content/levels.ts` opens with waves inside the spawn horizon, so the level fills its
        own first screen — which is what an authored level is FOR.

        It still runs once at boot, because the title screen is over a still field and an empty one
        would look like a broken build. **`enterLevel` below is what sweeps that field away**, and
        for one day it did not — `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md`.
      */
      // A fresh spawn stream, so run two is run one — the reason `seedField` gives.
      world.rng = makeRng('proof-scene').stream('spawns');
      /*
        ⚠️ **There is ONE sweep here and there used to be two.** This called `resetScene` itself and
        then called `enterLevel`, which calls `startLevel`, which calls it again one line later — the
        first of them over a world whose weapon the `begin` dispatch below had not yet re-resolved.

        [0058](../../docs/decisions/0058-a-level-boundary-keeps-the-shell.md) is what makes dropping
        it safe rather than merely tidy: the shell used to cross a run boundary or not depending on
        that redundant-looking call, and its probe *"came back STILL GREEN, because no test could see
        an ordering nothing states."* `keepShell` states it, so the extra sweep is now what it always
        looked like.
      */
      // ⚠️ `begin` FIRST, because it resets the level index to zero and `enterLevel` reads it. The
      // tier travels with it: `src/state/slices/run.ts` is where a run's lives come from now.
      dispatch({ slice: 'run', type: 'begin', difficulty });
      // ⚠️ `false`: not seamless. A run begins on a swept field with the camera at zero, whatever
      // the last one ended as — 0058 and 0067.
      enterLevel(false);
      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    },

    onward(): void {
      // ⚠️ `true`: seamless. The camera, the ship and the field all carry on; only the script
      // changes — 0076. The shell crosses because the ship never leaves, which is 0058 by construction.
      enterLevel(true);
      world.rng = makeRng('proof-scene').stream('spawns');
      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    },

    resume(): void {
      /*
        ⚠️ **THE RUN IS RESTOCKED BEFORE THE SCREEN MOVES, and the other order is an infinite loop.**
        `src/state/root.ts` holds *a run with no lives left on the playing screen is over* as a
        cross-slice agreement, so `show playing` dispatched first would be read at zero lives and
        would raise the run-over screen again on its way through — the button would do nothing, twice
        a second, forever.
      */
      dispatch({ slice: 'run', type: 'continued' });
      /*
        ⚠️ **`respawn` and NOT `enterLevel`, and that one word is the whole feature.** The level is
        mid-flight behind this screen: its wave table, its camera, its enemies, and the scatter the
        last death threw (`docs/decisions/0066-a-death-scatters-what-it-took.md`) are all sitting
        exactly where the player left them. `enterLevel` would sweep every one of them and start the
        level again, which is what the button used to do under a different name.

        ⚠️ **The spawn stream is deliberately not reseeded either.** It is the level's own clock of
        randomness; handing it a fresh one mid-level would deal the rest of the level a different
        hand from the one the player was already flying through.

        What the player gets back is exactly what a death the run survives gives them — a ship at the
        back of the box with nothing on it and two seconds of grace — because 0068's promise is *as
        if they had just died*, and `respawn` is the one description of that.
      */
      respawn(world);
      dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    },
  };
}

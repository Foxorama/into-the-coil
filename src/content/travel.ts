/**
 * The crossing between two places: how long the chart is up, and the one knob over it.
 *
 * `docs/decisions/0340-the-coil-is-a-route.md`. Asked for as *"loading screens anyway for
 * transitions and to represent moving through the galaxy"*, and explicitly as **a full-screen scene**
 * rather than a banner over the sky.
 *
 * ── WHY THE RULE IS CONTENT AND NOT A RUN OF `if`s IN THE SHELL ─────────────────────────────────
 *
 * ⚠️ **Because the two questions this whole feature is have to be answerable without a browser.**
 * *Does the screen leave when the music is not ready?* and *does a press skip the floor?* were `if`s
 * inside `src/app/mount.ts` for one commit, and the only way to ask either was to mount a canvas —
 * which `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` cannot break on purpose.
 * `src/app/lifecycle.ts` makes the same argument for the three ways a run moves, and
 * `tests/continue.test.ts` is what it bought.
 *
 * ── AND WHY IT IS ITS OWN FILE ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ **On `src/content/sound.ts`'s exact terms: the ban has to be checkable.** 0024 closes the door
 * on a comfort setting reaching the model — *"a player who turns the flashing down must not thereby
 * be playing an easier game"* — so `src/app/frame.ts` must never be able to see this table. That is
 * a fact about the import graph rather than a claim about intentions, and `tests/travel.test.ts`
 * scans for it exactly as `tests/sound.test.ts` and `tests/style.test.ts` already do for theirs.
 *
 * ⚠️ **Every duration here is in STEPS, like every other duration in this project** — `src/content/cues.ts`
 * says so in as many words. The rate is 60Hz and is not configurable (`src/app/loop.ts`), and it is
 * stated in `src/state/screens.ts`, which is a layer ABOVE this one —
 * `docs/decisions/0015-the-layer-ladder.md` runs `content` → `state`, so the arithmetic is in the
 * comment beside each number rather than in an import that would point the arrow backwards.
 */

/** Every setting for the crossing, in the order the chooser offers them. Closed. */
export const TRAVEL_KINDS = ['scene', 'brief'] as const;

/** Derived from the list, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type TravelKind = (typeof TRAVEL_KINDS)[number];

export interface TravelRow {
  /** What the chooser calls it. */
  title: string;
  /**
   * One line under it — `docs/game.md`'s voice rule: what it is, never why it is good.
   *
   * ⚠️ On the row rather than in `src/app/chrome.ts`, for the reason `src/content/styles.ts` gives:
   * a second list of explanations goes on saying the old thing the day one of them changes.
   */
  hint: string;
  /**
   * The shortest the chart is up for, in fixed steps, before it is allowed to leave.
   *
   * ⚠️ **THE KNOB IS THIS NUMBER AND NOTHING ELSE, WHICH IS WHAT KEEPS 0024 WHOLE.** A comfort
   * setting that also dropped the wait for the music would decide whether the next place's first
   * movement is heard, which is a content difference wearing a comfort setting's clothes. Both rows
   * wait for the place; one waits for less of its own art.
   *
   * ⚠️ **AND NEITHER IS ZERO.** A crossing shortened to nothing is not a shorter crossing, it is a
   * flicker between two levels — which is a worse thing to look at than either end of this knob.
   * Only a press takes the floor to zero, because a press is a player saying *now*.
   */
  floorSteps: number;
}

export const TRAVELS: Record<TravelKind, TravelRow> = {
  /*
    ⚠️ **FOUR SECONDS, AND IT HAS NOT BEEN PLAYED.** The same thing
    `docs/decisions/0063-a-level-break-is-a-respite.md` says of its own three seconds, in the same
    words and for the same reason: too short and the crossing is a flicker, too long and it is the
    hard pause between levels that the respite exists to have removed. It is the number in this
    change most likely to be wrong and the first one to take to a play-test.
  */
  scene: { title: 'Scene', hint: 'The chart, the crossing, and where you are on it.', floorSteps: 4 * 60 },
  /*
    ⚠️ **ONE SECOND: a beat, not an absence.** This is the row for a player who has seen the chart
    six times and wants the run back; it is not a row for skipping the crossing, because there is no
    such row — the place is still being baked and the ship is still somewhere on the route.
  */
  brief: { title: 'Brief', hint: 'The same crossing, over as soon as the place is ready.', floorSteps: 60 },
};

/**
 * What a player who has chosen nothing gets.
 *
 * ⚠️ **The scene, because 0024 says there is one game and it is the loud one.** A default of *brief*
 * would make the chart a thing nobody finds — `src/content/styles.ts`'s argument for defaulting to
 * the newer look, and `src/content/sound.ts`'s for defaulting to noise.
 */
export const DEFAULT_TRAVEL: TravelKind = 'scene';

/**
 * The longest the chart is EVER up, whatever the music is doing. Twenty seconds.
 *
 * ⚠️ **A CEILING RATHER THAN A PROMISE, AND IT IS THE HONEST FAILURE.** The crossing waits for the
 * next place's material, because a place whose first movement arrives after its first movement is
 * over has no first movement — `docs/decisions/0331-the-heart-beats-under-it.md` is twenty-five
 * seconds of argument about exactly that. But a bake that never lands, on a machine or a browser
 * nobody here has, must not be a run that never continues. Past this the run goes on and the music
 * arrives when it arrives, which is what every level did before 0331 and is therefore a state the
 * game is known to survive.
 *
 * ⚠️ **It is sized ABOVE the worst case rather than around it, which is why it is not a budget.**
 * `docs/decisions/0245-a-budget-is-sized-under-load.md` sizes a budget at three times the worst cost
 * measured under load; 0331 measures the longest single bake at about thirteen seconds on four
 * workers, and the bake this waits on has usually been running since the approach. A number tight
 * enough to fail would make this a guard over the bake, and it is not one: it is the point at which
 * the game stops believing the bake and carries on.
 */
export const TRAVEL_MAX_STEPS = 20 * 60;

/**
 * Whether the crossing is over — the whole rule, as one function over four facts.
 *
 * `steps` is how many fixed steps the chart has been up. **Never wall clock**: the screen does not
 * step the world, and `world.onTick` is the callback that fires on both sides of that branch —
 * `docs/decisions/0063-a-level-break-is-a-respite.md` split it out for exactly this.
 *
 * `ready` is *there is nothing left to wait for*: the next place's material is in the mixer's hands,
 * **or nothing is listening**. The caller owns that second half because it is the one fact here that
 * is not content — `src/app/mount.ts` is what knows whether there is an `AudioContext` and whether
 * the player chose silence, and a crossing that waited for a bake nobody could hear would be a
 * silent player's twenty-second pause.
 *
 * `skipped` is *the player pressed Onward*. It takes the floor away and nothing else: a press cannot
 * make the music arrive, so a press on a place that is not ready leaves the moment it is. That is
 * what stops the control being either a dead button or a lie about what it did.
 */
export function travelDone(travel: TravelKind, steps: number, ready: boolean, skipped: boolean): boolean {
  if (steps >= TRAVEL_MAX_STEPS) return true;
  return steps >= (skipped ? 0 : TRAVELS[travel].floorSteps) && ready;
}

/**
 * Whether the crossing is being held open by the music rather than by its own floor — which is the
 * only condition under which the screen says anything at all about waiting.
 *
 * ⚠️ **`docs/game.md` bans restating what the screen already shows**, and 0063 makes the same point
 * about a countdown over a screen that has not stopped the world: a progress bar under a crossing
 * that is simply *being* a crossing is the game apologising for four seconds of its own art. This is
 * true when the floor has passed and the place still is not ready, and at no other time.
 */
export function travelIsWaiting(travel: TravelKind, steps: number, ready: boolean, skipped: boolean): boolean {
  return !ready && steps >= (skipped ? 0 : TRAVELS[travel].floorSteps);
}

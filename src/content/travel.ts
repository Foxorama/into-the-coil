/**
 * The crossing between two places: the burn, how long it is held, and the one knob over it.
 *
 * `docs/decisions/0340-the-coil-is-a-route.md`. Asked for as *"loading screens anyway for
 * transitions and to represent moving through the galaxy"* — and then, of the first build, which cut
 * to a full-screen chart with a button on it:
 *
 * > *"It takes the player out of the game. We need a much smoother transition where the player's
 * > engines do a full jet burn and the ship hyper-speeds through galaxy for the loading screen and
 * > then the hyper burn trails off as they arrive at the new level."*
 *
 * So the crossing is a thing the SHIP does, in the world it was already flying in. One number carries
 * the whole of it — `warpAt` below, nought to one and back — and everything the player sees is that
 * number read by something that already existed: the camera's scroll rate, the engine's flame, the
 * streaks in the sky.
 *
 * ── WHY THE RULE IS CONTENT AND NOT A RUN OF `if`s IN THE SHELL ─────────────────────────────────
 *
 * ⚠️ **Because the questions this feature is have to be answerable without a browser.** *Does the
 * ship come out of the burn before the music is ready?* and *does the burn ever end if the music never
 * is?* were `if`s inside `src/app/mount.ts` for one commit, and the only way to ask either was to
 * mount a canvas — which `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` cannot break on
 * purpose. `src/app/lifecycle.ts` makes the same argument for the ways a run moves, and
 * `tests/continue.test.ts` is what it bought.
 *
 * ── AND WHY IT IS ITS OWN FILE ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ **On `src/content/sound.ts`'s exact terms: the ban has to be checkable.** 0024 closes the door
 * on a comfort setting reaching the model — *"a player who turns the flashing down must not thereby
 * be playing an easier game"* — so `src/app/frame.ts` must never be able to see this table. The frame
 * is handed a NUMBER (`World.warp`) and never learns where it came from; `tests/travel.test.ts` scans
 * the import graph for it exactly as `tests/sound.test.ts` and `tests/style.test.ts` do for theirs.
 *
 * ⚠️ **Every duration here is in STEPS, like every other duration in this project** —
 * `src/content/cues.ts` says so in as many words. The rate is 60Hz and is stated in
 * `src/state/screens.ts`, which is a layer ABOVE this one (`docs/decisions/0015-the-layer-ladder.md`),
 * so the arithmetic is in the comment beside each number rather than in an import that would point the
 * arrow backwards.
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
   * The soonest the ship may start coming OUT of the burn, in fixed steps from when it began.
   *
   * ⚠️ **THE KNOB IS THIS NUMBER AND NOTHING ELSE, WHICH IS WHAT KEEPS 0024 WHOLE.** A comfort
   * setting that also dropped the wait for the music would decide whether the next place's first
   * movement is heard, which is a content difference wearing a comfort setting's clothes. Both rows
   * wait for the place; one spends less time at full burn first.
   *
   * ⚠️ **AND NEITHER IS SHORTER THAN THE SPOOL.** A burn that began trailing off before it had
   * finished building would never reach full speed — and full speed is where the place is swapped,
   * because the streaks are what hide it. `tests/travel.test.ts` holds that.
   */
  floorSteps: number;
}

/**
 * How long the engines take to build to full burn. One second.
 *
 * ⚠️ **EASED IN, BECAUSE A SHIP THAT IS INSTANTLY AT HYPERSPEED HAS NOT ACCELERATED** — it has been
 * cut to, which is the thing the first build was reported for.
 * `docs/decisions/0037-the-ship-has-mass.md` is the same argument about the thing in the player's
 * hands.
 */
export const TRAVEL_SPOOL_STEPS = 60;

/**
 * How long the burn takes to trail off as the ship arrives. A second and a half.
 *
 * ⚠️ **LONGER THAN THE SPOOL ON PURPOSE.** *"The hyper burn trails off as they arrive"* — an arrival
 * is a thing the player watches settle, and the level's first wave is inside the spawn horizon the
 * moment the level is entered. A slow tail is what gives them the new place to look at before there
 * is anything in it to dodge.
 */
export const TRAVEL_TRAIL_STEPS = 90;

export const TRAVELS: Record<TravelKind, TravelRow> = {
  /*
    ⚠️ **TWO AND A HALF SECONDS BEFORE THE TAIL, SO FOUR IN ALL — AND IT HAS NOT BEEN PLAYED.** The
    same thing `docs/decisions/0063-a-level-break-is-a-respite.md` says of its own three seconds, in
    the same words and for the same reason: too short and the crossing is a flicker, too long and it
    is the pause between levels that the respite exists to have removed. It is the number in this
    change most likely to be wrong and the first one to take to a play-test.
  */
  scene: { title: 'Scene', hint: 'The full burn between places.', floorSteps: 150 },
  /*
    ⚠️ **THE SPOOL AND HALF A SECOND, WHICH IS THE SHORTEST BURN THAT IS STILL ONE.** This is the row
    for a player who has made the crossing six times and wants the run back. It is not a row for
    skipping it, because there is no such row — the place is still being baked either way.
  */
  brief: { title: 'Brief', hint: 'The same burn, over as soon as the place is ready.', floorSteps: 90 },
};

/**
 * What a player who has chosen nothing gets.
 *
 * ⚠️ **The scene, because 0024 says there is one game and it is the loud one.** A default of *brief*
 * would make the full burn a thing nobody finds — `src/content/styles.ts`'s argument for defaulting
 * to the newer look, and `src/content/sound.ts`'s for defaulting to noise.
 */
export const DEFAULT_TRAVEL: TravelKind = 'scene';

/**
 * The longest the ship is EVER held at full burn, whatever the music is doing. Twenty seconds.
 *
 * ⚠️ **A CEILING RATHER THAN A PROMISE, AND IT IS THE HONEST FAILURE.** The burn holds for the next
 * place's material, because a place whose first movement arrives after its first movement is over has
 * no first movement — `docs/decisions/0331-the-heart-beats-under-it.md` is twenty-five seconds of
 * argument about exactly that. But a bake that never lands, on a machine or a browser nobody here
 * has, must not be a run that never continues. Past this the ship arrives and the music does when it
 * does, which is what every level did before 0331 and is therefore a state the game is known to
 * survive.
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
 * Whether the ship may start coming out of the burn — the whole rule, as one function of three facts.
 *
 * `steps` is how many fixed steps the burn has been running. **Never wall clock** — a crossing timed
 * off `performance.now()` would run at a different speed from the music it is waiting for.
 *
 * `ready` is *there is nothing left to wait for*: the next place's material is in the mixer's hands,
 * **or nothing is listening**. The caller owns that second half because it is the one fact here that
 * is not content — `src/app/mount.ts` is what knows whether there is an `AudioContext` and whether
 * the player chose silence, and a burn held for a bake nobody could hear would be a silent player's
 * twenty seconds of nothing.
 *
 * ⚠️ **THERE IS NO PRESS IN THIS RULE, AND THE FIRST BUILD HAD ONE.** It put an *Onward* button on
 * the crossing, and the play-test read it exactly as a button reads: *"it felt like a button click
 * was needed, which is the same thing."* The player is flying the ship through this now, so every
 * control they have already means something — and a loading screen that can be skipped by firing the
 * guns is a loading screen that is skipped by accident.
 */
export function travelMayLand(travel: TravelKind, steps: number, ready: boolean): boolean {
  if (steps >= TRAVEL_MAX_STEPS) return true;
  return steps >= TRAVELS[travel].floorSteps && ready;
}

/**
 * How hard the ship is burning, nought to one, given how long it has been at it and the step it
 * started coming out — `-1` while it has not.
 *
 * ⚠️ **ONE NUMBER, AND EVERYTHING THE PLAYER SEES IS IT BEING READ.** The camera's scroll rate, the
 * size of the engine's flame and the length and brightness of the streaks are all this, so the three
 * cannot disagree about whether the ship is at speed — which is the failure
 * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` is about, prevented by
 * there being nothing to keep in step.
 *
 * ⚠️ **SMOOTHSTEP AT BOTH ENDS**, so neither the build nor the tail has a corner in it: a rate that
 * stopped changing abruptly is visible as a jolt in every star on the screen at once.
 */
export function warpAt(steps: number, landingAt: number): number {
  const through = landingAt < 0 ? steps / TRAVEL_SPOOL_STEPS : 1 - (steps - landingAt) / TRAVEL_TRAIL_STEPS;
  const t = through < 0 ? 0 : through > 1 ? 1 : through;
  return t * t * (3 - 2 * t);
}

/** Whether a burn that started trailing off at `landingAt` has finished doing so: the ship is there. */
export function travelArrived(steps: number, landingAt: number): boolean {
  return landingAt >= 0 && steps - landingAt >= TRAVEL_TRAIL_STEPS;
}

/**
 * Whether the burn is being held open by the music rather than by its own floor — which is the only
 * condition under which the banner says anything at all about waiting.
 *
 * ⚠️ **`docs/game.md` bans restating what the screen already shows**, and 0063 makes the same point
 * about a countdown over a screen that has not stopped the world: a line about waiting under a burn
 * that is simply *being* a burn is the game apologising for its own art. This is true when the floor
 * has passed and the place still is not ready, and at no other time.
 */
export function travelIsWaiting(travel: TravelKind, steps: number, ready: boolean): boolean {
  return !ready && steps >= TRAVELS[travel].floorSteps;
}

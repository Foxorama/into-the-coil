/**
 * Boot: put a canvas on the page, bake the art, and start the loop.
 *
 * Everything expensive happens here, once. `src/app/frame.ts` is what runs afterwards, and the split
 * is deliberate — see `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`. This file is
 * allowed to allocate; the one next door is not.
 *
 * ⚠️ **A resize is not a frame.** Rotation, a window drag and a DPI change all land here, where
 * re-baking an atlas is affordable. The frame never learns that any of it happened — it reads a
 * `World` whose `view` and `surface` were updated between frames.
 */

import { PALETTES, type PaletteName } from '../content/palette.ts';
import { THEMES, type ThemeKind } from '../content/themes.ts';
import { ACROSS_SPAN, MAX_ALONG_SPAN, type View, viewOf } from '../sim/camera.ts';
import { type Entity, makeEntity, reset } from '../sim/entity.ts';
import { Pool } from '../sim/pool.ts';
import { makeCollected, makeDeaths } from '../sim/collide.ts';
import { makeRng } from '../sim/rng.ts';
import { atlasIsStale, bakeAtlas, bakeLandmark, bakeNebula, viewFor } from '../render/bake.ts';
import { CanvasSurface, renderScale } from '../render/canvas.ts';
import { SPECIAL_BINDINGS } from '../content/actions.ts';
import { SPECIALS } from '../content/specials.ts';
import { DEFAULT_ASSISTS, tuningFor } from '../sim/assist.ts';
import { ENEMIES, ENEMY_KINDS, type EnemyKind, type EnemyRow } from '../content/enemies.ts';
import { LEVELS } from '../content/levels.ts';
import { BOSSES } from '../content/bosses.ts';
import {
  PICKUPS,
  PICKUP_KINDS,
  WEAPON_OVERFLOW,
  effectOf,
  isUpgrade,
  type PickupKind,
  weaponFor,
} from '../content/pickups.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../content/difficulty.ts';
import { DEFAULT_SOUND, SOUND_KINDS } from '../content/sound.ts';
import { DEFAULT_STYLE, STYLES, STYLE_KINDS } from '../content/styles.ts';
import { nextOnGrid } from '../content/cadence.ts';
import { auraBuild, auraFor, auraNearnessFor, musicLevelFor, placeFor } from './music.ts';
import { bakePlace, makeAudioOut, makeSpeaker, prewarmAudio } from './sound.ts';
import { SPRITE, SPRITE_EXTENT } from '../content/sprites.ts';
import { holdStation, PLAYER_LEAD, SCROLL_PER_STEP } from '../sim/flight.ts';
import { MAX_SHIELDS, SHIPS, fullHealthFor, shieldsOf } from '../content/ships.ts';
import { makeIntent } from '../sim/intent.ts';
import {
  GameFrame,
  SHIP_START_ALONG,
  detonateArsenal,
  launchSpecial,
  respawn,
  scatterUpgrades,
  wearHull,
  type World,
} from './frame.ts';
import { makeLifecycle } from './lifecycle.ts';
import { SCREENS, STEPS_PER_SECOND, type Screen, type SettingName } from '../state/screens.ts';
import { type Action, type State, initialState, reduce } from '../state/root.ts';
import { makeChrome } from './chrome.ts';
import { combineDevices } from './devices.ts';
import { attachInput } from './input.ts';
import { attachMenuPad, makeMenuAsk } from './menu.ts';
import { attachPad } from './pad.ts';
import { attachTouch, bandCount } from './touch.ts';
import { runLoop } from './loop.ts';

/**
 * The entity ceiling, per pool.
 *
 * ⚠️ **These are 0022's worst-case scene split up rather than a new budget** — it reads *~150 enemy
 * bullets, ~80 player projectiles, ~40 enemies, ~200 particles* and totals 500, which is the number
 * `tests/budget.test.ts` asserts the frame cost against. The particle share is claimed by `debris`
 * and by the one thing below that has been taken out of it.
 *
 * ⚠️ **`playerShots` moved 80 → 100, and the total is now EXACTLY 500.** A fully upgraded weapon is
 * five barrels every four steps against an eighty-step shot life, which is a hundred bullets in
 * flight — `src/content/pickups.ts` has that arithmetic and the reason each of those three numbers is
 * what it is. At 80 the pool stayed full and every volley was truncated from the back.
 *
 * ⚠️ **Exported, so `tests/world.ts` builds fixtures at the real sizes rather than at remembered
 * ones.** A fixture with a smaller pool than the game cannot see a pool-exhaustion bug, which is the
 * bug this number exists to prevent.
 *
 * ⚠️ **`shieldOrbs` is three slots taken from the PARTICLE share, and that is the only share 0022
 * says may move.** Its list of *where a device may legitimately differ* is background parallax,
 * particle counts, debris lifetime and screen-space effects — the cosmetics that shed under load —
 * and the shell is the opposite of that: it is how a player reads what is left between them and the
 * end of a life (0050). So the three come out of `debris`, the total stays at exactly 500, and
 * nothing about the frame budget moves.
 *
 * ⚠️ **`missiles` is 24 slots and they come out of the particle share too**, on the same terms and
 * for the same reason: a second weapon is not a cosmetic. The arithmetic is
 * `launchers × flight ÷ missileEvery` — three tubes, about 130 steps in flight on the widest view,
 * a floor of 20 steps between volleys — which is 20 in the air at once, against 24.
 * `src/content/pickups.ts` has the same sum written out for the pulse, and `tests/pickups.test.ts`
 * drives the strongest loadout there is and fails if either pool fills.
 *
 * ⚠️ **`bombs` and `blasts` are four slots each, out of the same particle share.** Four is more
 * than a player can have in the air — the arsenal starts with two charges and a level cleared adds
 * one — and it is the same headroom argument the other pools make: a pool that refuses a spawn is a
 * weapon that silently does nothing on the frame the player spent it.
 *
 * ⚠️ **`tests/budget.test.ts` now holds that sum, which nothing did before.** The 500 was written in
 * a comment here and asserted nowhere, so the next pool would have been added by arithmetic done in
 * somebody's head — and `docs/state-of-play.md` says the arsenal wants slots for missiles, orbs and a
 * blast. A budget nothing checks is a budget that is already spent.
 *
 * Splitting one pool into four is what makes the collision cost the product of two small pools
 * instead of the square of one big one — `src/sim/collide.ts` has the argument.
 */
export const CAPACITY = {
  ship: 1,
  shieldOrbs: MAX_SHIELDS,
  enemies: 40,
  playerShots: 100,
  missiles: 24,
  bombs: 4,
  blasts: 4,
  enemyShots: 150,
  debris: 200 - MAX_SHIELDS - 24 - 8 - 4,
  boss: 1,
  /*
    ⚠️ **TWELVE, AND IT WAS EIGHT.** A death now throws every upgrade it took back onto the field
    (`docs/decisions/0066-a-death-scatters-what-it-took.md`), on top of whatever the level had already
    placed there — and a scatter one pickup short is a pickup the player watched themselves lose and
    was never offered back. The four come out of the particle share, on the same terms as the shell,
    the missiles and the bomb: a pickup is the opposite of a cosmetic.

    ⚠️ It is not the arsenal's whole size and cannot be. A player carrying twenty upgrades scatters
    twelve; `src/sim/pool.ts` drops rather than grows, and a pool sized for a run nobody has had would
    be spending 0022's budget on a hypothetical.
  */
  pickups: 12,
};

/**
 * The sky, back to front — `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
 *
 * ── THE DEPTHS ARE A THIRD LARGER THAN 0065 SHIPPED ─────────────────────────────────────────────
 *
 * Reported from play: *"the background starfield layers both still need to be scrolling past about
 * 1/3 faster - currently feels like i'm on a casual stroll and not a super fast spaceflight combat
 * battle."* `docs/decisions/0078-the-sky-moves-a-third-faster.md`.
 *
 * ⚠️ **BOTH, by the same factor, which is what keeps the parallax.** 0.12 and 0.3 became 0.16 and
 * 0.4 — `× 4/3` each — so the ratio between the two layers is exactly what it was and the only thing
 * that changed is how fast the whole sky goes past. Scaling one of them would have bought the speed
 * out of the depth cue, which is the one thing a two-layer sky is for.
 *
 * ── AND A THIRD WAS NOT ENOUGH EITHER ───────────────────────────────────────────────────────────
 *
 * Reported from play against the build 0078 landed in: *"the background needs to move faster, still
 * feels really slow."* `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md`.
 *
 * ⚠️ **0.16 and 0.4 become 0.24 and 0.6 — `× 3/2` each, on 0078's own rule.** The ratio is untouched
 * for the third time; what moves is how fast the whole sky goes past. In the units a hand can judge:
 * a near star now crosses the narrowest view in about **8 seconds** where it took twelve, and a far
 * one in about twenty where it took thirty.
 *
 * ⚠️ **THE FASTER LAYER IS ALSO THE ONE 0088 DIMS TO A FIFTH**, and the two halves of that report are
 * only compatible because *distracting* is contrast and *slow* is speed. Sizing, count and alpha all
 * push the near layer back; the depth pushes it past.
 *
 * ⚠️ **Both are still under 1**, which is 0065's rule and the reason there is a ceiling here at all:
 * at 1 the sky moves exactly with the world and reads as a field of objects going past at the rate of
 * the things that can kill the player. At 0.6 the near field is under two thirds, and
 * `tests/budget.test.ts` is where that ceiling is held rather than in this sentence.
 *
 * ⚠️ **Module-level and frozen in place, because a STYLE can turn it off** —
 * `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`. Retro is the game before the sky,
 * and what `retro` means is that `World.sky` is the empty list: nothing in `src/render/scene.ts`
 * or `src/app/frame.ts` learns that a style exists, because the layer list is already the whole of
 * what it reads. Built once here, since this file may allocate and the painter may not.
 *
 * ⚠️ **Exported so the guard reads THIS rather than a copy of it.** `tests/budget.test.ts` used to
 * restate the array under a comment claiming it was *"the real sky, built the way `src/app/mount.ts`
 * builds it rather than restated"* — which it was not, and which is the shape of drift
 * `tests/one-description.test.ts` exists for. It went unnoticed because a depth cannot change a draw
 * count, so the two could disagree for ever and the budget guard would stay green.
 *
 * ── AND THE ANSWER TO THE THIRD REPORT IS NOT A FOURTH MULTIPLICATION ──────────────────────────
 *
 * ⚠️ **`docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`.** Reported from play
 * against the build 0088 landed in: *"background starfield has lost it's multiple layers, there's
 * only one starfield background and the background or the screen moves too slow… it feels like a
 * crawl because of the background visual moving soooo slowly."*
 *
 * ⚠️ **The two depths below are UNTOUCHED, and that is the finding rather than an omission.** 0088's
 * dimming pass left the near layer at a pixel and a half of a fifth-solid dot, so the fastest thing
 * the player could actually see was the FAR layer at 0.24 — about eight world units a second, twenty
 * seconds to cross a 16:9 view. The sky did not slow down; the fast layer went out. Multiplying
 * both again would answer a report about the wrong quantity, which is exactly what
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` says to check first.
 *
 * ⚠️ **`skyRush` is the third layer and it is where the speed now lives.** At 0.85 it crosses a
 * 16:9 view in under six seconds where the far layer takes twenty, and it is drawn as STREAKS —
 * `src/render/bake.ts` has why a line and not a dot is what breaks the trade every previous pass ran
 * into. 0065's *strictly below 1* is untouched and is still the ceiling.
 *
 * ── AND THE FOURTH REPORT MOVES ALL THREE, WHICH THE THIRD DELIBERATELY DID NOT ────────────────
 *
 * ⚠️ **`docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`.** Reported against the
 * build 0097 landed in: *"the sky moves a bit faster, but it still needs to move much more faster."*
 *
 * ⚠️ **0097 answered a report about the fast layer being INVISIBLE and left the two dot layers
 * alone, correctly.** This report is about the ones it left: with the near layer visible again, the
 * dots are most of what the player is watching, and they were still at the rates 0088 set.
 *
 * ⚠️ **× 11/8 on both, so 0078's ratio survives a fourth time.** 0.24 and 0.6 become **0.33** and
 * **0.825**, which is the same 2.5 between them the sky has had since 0065. The streak layer goes to
 * **0.92**, and 0065's *strictly below 1* is still the only absolute.
 *
 * ⚠️ **A DOT LAYER MAY NOW PASS TWO THIRDS, WHICH 0097 FORBADE, AND THE CEILING IS RE-DERIVED RATHER
 * THAN RELAXED.** 0097 bought its speed by saying *only a streak may go that fast*; the honest rule
 * underneath it was never about SHAPE, it is about how much of a bullet a mark looks like — a dot the
 * size of a bullet at speed is 0069's subject, and a dot a third of that size is not.
 * `tests/budget.test.ts` holds it as an arithmetic ceiling per layer instead of as an exception list.
 *
 * ⚠️ **In the units a hand can judge**, on the narrowest view: a far star now crosses in **15
 * seconds** where it took twenty-one, a near one in **6** where it took eight, and a streak in
 * **5.4** — while being nearly twice as long.
 *
 * ── AND THE FIFTH REPORT MOVES ONE LAYER ONLY, BECAUSE THE OTHER TWO HAVE NO ROOM LEFT ──────────
 *
 * ⚠️ **`docs/decisions/0103-the-fast-layer-is-in-front.md`.** Reported against the build 0101 landed
 * in: *"background scroll is too slow, probably needs to be another 75% faster again."* The fifth
 * pass at the same sentence, and the first one where the answer is a rule rather than a number.
 *
 * ⚠️ **THE BACKGROUND SKY IS OUT OF ROOM BY CONSTRUCTION, AND IT IS MEASURED.**
 * `tests/budget.test.ts` derives a per-layer ceiling from how much of a bullet each mark looks like;
 * driven over what `skyField` actually bakes, the near layer's is **0.845** and it sits at 0.825.
 * There is 2% left in it. ×1.75 is not a number this sky can be asked for, and four passes of
 * multiplying have arrived at the wall 0088 predicted in writing.
 *
 * ⚠️ **The two DOT layers therefore do not move at all, and the parallax between them is why.** The
 * far layer has room to 0.671 and the near one has none; moving the far one alone would close the
 * 2.5 between them, which is the depth cue itself — *"the only thing that reads as depth at all"*,
 * and the quantity `tests/budget.test.ts` holds precisely so that a speed ask cannot spend it.
 *
 * ⚠️ **SO THE STREAK LAYER CROSSES INTO THE FOREGROUND AND CARRIES ALL OF IT: 0.92 → 1.61.** Past 1
 * a layer is not a faster background, it is **in front of the game** — it overtakes the ship rather
 * than trailing it, which is the one thing no amount of background speed can imitate. 0065's
 * *strictly below 1* is amended and not merely relaxed: what a depth says is which side of the play
 * plane a layer is on, and the ceiling is on how close to 1 it may come from either side.
 *
 * ⚠️ **In the units a hand can judge**: the streak crosses the narrowest view in **3.1 seconds**
 * where it took 5.4, and it is now the only thing on screen moving faster than the things that can
 * kill the player. The spread of rates the eye has to read went from 0.33–0.92 to **0.33–1.61**,
 * which is nearly three times the range — and the game sits inside it rather than on top of it.
 *
 * ⚠️ **ONE LEVER, ON PURPOSE.** 0101 nearly doubled the streak LENGTH and this moves only the depth,
 * so if it still reads slow the next report is about a quantity nobody has confounded. **And the
 * lever after this one is not in this file**: at 1.61 the sky is already overtaking a world that
 * scrolls at 36 units a second, so *the background is slow* would then be *the game is slow*, and
 * `SCROLL_PER_STEP` is where that lives.
 *
 * ── AND THE SIXTH REPORT SAID *SLOW* AND *INVISIBLE*, WHICH ARE TWO FAULTS AND NOT ONE ──────────
 *
 * ⚠️ **`docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`.** Reported against the
 * build 0103 shipped: *"there are thin lines that are hardly visible… not so much the starfield an
 * issue, but the slow lines, I don't feel like I'm zooming through space."*
 *
 * ⚠️ **THE PARAGRAPH ABOVE PREDICTED THE WRONG NEXT LEVER, AND SAYING SO IS THE POINT OF HAVING
 * WRITTEN IT DOWN.** It said the sky was out of road and the next conversation was `SCROLL_PER_STEP`.
 * The report says otherwise in the player's own words — *"which is a background thing"* — and the
 * measurement agrees: the layer carrying the whole sense of speed was drawing marks **1.57 CSS
 * pixels** across. It was never the world's rate. It was that the fast layer could barely be seen.
 *
 * ⚠️ **1.61 → 2.2, and it moves BECAUSE THE REPORT NAMES TWO FAULTS.** *Hardly visible* is answered
 * in `src/render/bake.ts` — the mark is 2.2× thicker — and *slow* is answered here. Moving one lever
 * per pass is the rule when a report names one quantity; this one names two, and answering half of
 * it would buy a seventh report that could not distinguish them either.
 *
 * ⚠️ **In the units a hand can judge**: the streak crosses the narrowest view in **2.3 seconds**
 * where it took 3.1, at 570 px/s on a 1280-wide screen against the far starfield's 86. The spread of
 * rates on screen is now **0.33 to 2.2**, and the game sits at 1 inside it.
 */
/*
  ── AND THE SEVENTH REPORT ASKS FOR SOMETHING THAT IS NOT A NUMBER AT ALL ────────────────────────

  ⚠️ **`docs/decisions/0112-the-sky-has-weather.md`.** Reported against the build 0106 shipped:
  *"almost there. Needs to be a bit faster. Also needs to be more than streaks and some weird
  colouration per level. Needs an actual space skyscape with nebulous clouds and such like."*

  ⚠️ **THE SPEED HALF IS THE SMALLEST ASK OF THE SEVEN AND ONLY ONE LAYER CAN PAY IT.** 0103 measured
  the near layer at **0.825 against a ceiling of 0.845** — 2% left — and the far layer cannot move
  alone without closing the 2.5 between them, which is the depth cue itself. The streak layer is the
  one with room, and 2.2 → 2.7 is *a bit* rather than the doublings the previous six asked for.

  ⚠️ **THE OTHER HALF IS WHAT ACTUALLY MAKES A SKY LOOK FAST, AND IT IS NOT A DEPTH.** What the eye
  reads as speed is the SPREAD of rates on screen, not the largest of them. A nebula at 0.09 widens
  that spread from 0.33–2.2 to **0.09–2.7 — thirty times, against seven** — and the game sits at 1
  inside it. Six passes moved the top of the range; this is the first to move the bottom.
*/
export const SKY = [
  /*
    ⚠️ **FIRST, so it is drawn behind every mark**, and slowest, so it reads as the furthest thing
    there is. `paintScene` walks this array in order and the order is the only thing that decides what
    is in front of what.
  */
  { sprite: SPRITE.skyNebula, extent: SPRITE_EXTENT.skyNebula, depth: 0.09 },
  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },
  { sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.825 },
  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 2.7 },
];

/**
 * How many bodies the opening field is seeded with, so the first frame is not empty.
 *
 * ⚠️ **Hoisted by `docs/decisions/0098-a-wave-plays-a-figure.md`**, which needed to divide by it: a
 * seeded body's place in its own cadence is its index over this, and a `12` written in two places
 * is the drift `tests/one-description.test.ts` exists for.
 */
const SEEDED_BODIES = 12;

/** What a style with no sky gets. Module-level, so switching styles allocates nothing. */
const NO_SKY: typeof SKY = [];

/**
 * The edge of the player's box, as the painter needs it — `docs/decisions/0074-the-box-is-drawn.md`.
 *
 * ⚠️ **`PLAYER_LEAD` is imported rather than recomputed**, so the mark and the clamp are one number.
 * A `PLAYER_ALONG_SPAN - PLAYER_MARGIN` written here would be a second copy of the subtraction in a
 * file with no way to know when either term moves, and the failure would be a line drawn near but not
 * at the wall — which is worse than no line, because it teaches the player something false.
 *
 * ⚠️ **Module-level and frozen, like `SKY`**: this file may allocate and the painter may not.
 */
export const BOUND = { sprite: SPRITE.bound, extent: SPRITE_EXTENT.bound, inView: PLAYER_LEAD };

export interface Mounted {
  /** Stop the loop and drop the resize listener. */
  stop(): void;
  /** The canvas that was created, so a caller can label or style it. */
  canvas: HTMLCanvasElement;
}

/**
 * The rotate prompt, and the element the orientation guard looks for.
 *
 * A `data-` attribute rather than a class, because a class is a styling hook that a later art pass
 * may reasonably rename, and this is a contract with `tests/orientation.browser.test.ts`.
 */
const GATE_ATTR = 'data-itc-rotate';

/**
 * Build the rotate prompt.
 *
 * ⚠️ **Text, not an icon.** `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts
 * "colour never carries meaning alone" in the unconditional floor, and the same argument disposes of
 * a bare rotation glyph: the one screen whose entire job is to explain why the game is not running
 * cannot be the one that assumes the player reads pictograms.
 *
 * `role="alert"` because it appears in response to something the player just did, and a player who
 * rotated for a reason deserves to be told why nothing happened.
 */
function makeGate(ink: string, space: string): HTMLElement {
  const gate = document.createElement('div');
  gate.setAttribute(GATE_ATTR, '');
  gate.setAttribute('role', 'alert');
  gate.style.position = 'absolute';
  gate.style.inset = '0';
  gate.style.display = 'none';
  gate.style.alignItems = 'center';
  gate.style.justifyContent = 'center';
  gate.style.textAlign = 'center';
  gate.style.padding = '2rem';
  gate.style.background = space;
  gate.style.color = ink;
  gate.style.font = '600 1.25rem/1.4 system-ui, sans-serif';
  // Terse, per docs/game.md's voice rule: say the one thing, do not explain the architecture.
  gate.textContent = 'Turn your device sideways to play.';
  return gate;
}

/** Size the backing store for a viewport, honouring 0022's DPR cap, and draw in CSS pixels. */
function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): number {
  const dpr = renderScale(window.devicePixelRatio);
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  canvas.style.width = String(cssWidth) + 'px';
  canvas.style.height = String(cssHeight) + 'px';
  // Everything above this line is in device pixels; everything after it is in CSS pixels.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return dpr;
}

/**
 * Mount the game into `host` and start it.
 *
 * Returns `null` when the browser will not give a 2D context, which is a real state on a locked-down
 * or ancient engine — and it is reported rather than thrown, because the boot watchdog is the thing
 * that should be telling the player what happened.
 */
/**
 * Tell the browser this element is a game, not a document.
 *
 * ⚠️ **Found by playing, not by reading.** On a phone, a long press on the playfield opened the iOS
 * callout and a second finger zoomed the page — on a build with no touch handling at all, because
 * nothing had ever told the engine to stop. Every line below is a distinct default, and removing any
 * one of them brings back exactly one of the symptoms.
 *
 * ⚠️ **On the CANVAS, never on the document.** Disabling zoom page-wide is an accessibility
 * anti-pattern and `docs/decisions/0024-the-accessibility-floor-is-settings.md` makes that this
 * project's problem specifically. The rotate prompt and everything that is not the playfield stay
 * pinch-zoomable; only the surface where a pinch means "dodge" does not.
 */
function suppressBrowserGestures(canvas: HTMLCanvasElement): void {
  // @setup: runs once, when the canvas is created.
  // Pan, pinch and double-tap zoom, all three of which are gestures a thumb makes while playing.
  canvas.style.touchAction = 'none';
  // The long-press callout on iOS — the one that was actually hit. Set through `setProperty`
  // because it is a vendor property `CSSStyleDeclaration` does not declare, and the alternative is
  // an `any` cast that 0016 bans on sight.
  canvas.style.setProperty('-webkit-touch-callout', 'none');
  // Long-press text selection, and the blue flash that comes with it.
  canvas.style.userSelect = 'none';
  canvas.style.setProperty('-webkit-user-select', 'none');
  // Pull-to-refresh, which a downward drag at the top of the screen is indistinguishable from.
  canvas.style.overscrollBehavior = 'none';
}

export function mount(host: Element, palette: PaletteName = 'vivid'): Mounted | null {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  suppressBrowserGestures(canvas);
  const ctx = canvas.getContext('2d');
  if (ctx === null) return null;
  host.appendChild(canvas);

  const colours = PALETTES[palette];
  const shipPool = new Pool<Entity>(CAPACITY.ship, makeEntity);
  const shieldOrbs = new Pool<Entity>(CAPACITY.shieldOrbs, makeEntity);
  const enemies = new Pool<Entity>(CAPACITY.enemies, makeEntity);
  const playerShots = new Pool<Entity>(CAPACITY.playerShots, makeEntity);
  const missiles = new Pool<Entity>(CAPACITY.missiles, makeEntity);
  const bombs = new Pool<Entity>(CAPACITY.bombs, makeEntity);
  const blasts = new Pool<Entity>(CAPACITY.blasts, makeEntity);
  const enemyShots = new Pool<Entity>(CAPACITY.enemyShots, makeEntity);
  const debris = new Pool<Entity>(CAPACITY.debris, makeEntity);
  const bossPool = new Pool<Entity>(CAPACITY.boss, makeEntity);
  const pickupPool = new Pool<Entity>(CAPACITY.pickups, makeEntity);

  /** Pickup rows in `PICKUP_KINDS` order, and the reverse lookup, built the same way enemies are. */
  const pickupRows = PICKUP_KINDS.map((k) => PICKUPS[k]);
  const pickupKinds = {} as Record<PickupKind, number>;
  PICKUP_KINDS.forEach((k, index) => {
    pickupKinds[k] = index;
  });

  /** Enemy rows by index, so a per-step lookup in the frame is an array index and not a string key. */
  const enemyRows: readonly EnemyRow[] = ENEMY_KINDS.map((k) => ENEMIES[k]);
  /**
   * The reverse lookup, so a level can name its enemies in words and a spawn still costs an index.
   *
   * ⚠️ Built from `ENEMY_KINDS` rather than written out, so it cannot disagree with `enemyRows` — the
   * two are the same list read in opposite directions, and `src/content/sprites.ts` records what a
   * pair of hand-kept lists in that relationship cost the last time.
   */
  const enemyKinds = {} as Record<EnemyKind, number>;
  ENEMY_KINDS.forEach((k, index) => {
    enemyKinds[k] = index;
  });

  const level = LEVELS.approach;
  const bossRow = BOSSES[level.boss];

  const shipRow = SHIPS.proof;
  const ship = shipPool.spawn()!;
  reset(ship, SHIP_START_ALONG, ACROSS_SPAN / 2, shipRow);
  holdStation(ship, SCROLL_PER_STEP);

  /*
    Seed the field, so the first frame is not empty.

    ⚠️ Worth understanding rather than copying. Ongoing spawns arrive at `spawnAlong`, which is
    beyond the widest view ANY device can have (0023) — so at this scroll rate a newly spawned object
    takes about three seconds to become visible. That is exactly right for a real level, which is
    authored with content already in front of the player, and exactly wrong for a scene whose whole
    job is to prove the page draws. The browser test caught it as a nearly-blank canvas.

    Its own named stream, per 0021: seeding the field must not move the ongoing spawns by one draw.

    ⚠️ Seeded well clear of the ship's start, or the player is hit before the first frame is drawn —
    which reads as the game being broken rather than as the game being hard.

    ⚠️ **A FRESH stream every time, which is what makes two runs the same run.** Reusing one
    generator across runs would deal a different opening field to a second attempt at a level that is
    supposed to be authored — and `docs/decisions/0021-one-stream-per-concern.md` exists precisely so
    a draw cannot be moved by something unrelated to it. Run two must be run one.
  */
  const seedField = (): void => {
    const seed = makeRng('proof-scene').stream('seed');
    for (let i = 0; i < SEEDED_BODIES; i++) {
      const e = enemies.spawn();
      if (e === null) break;
      const kind = seed.int(0, enemyRows.length - 1);
      const row = enemyRows[kind]!;
      const margin = row.radius + 2;
      reset(e, seed.range(SHIP_START_ALONG + 60, MAX_ALONG_SPAN), seed.range(margin, ACROSS_SPAN - margin), row, kind);
      e.velAlong = -row.closing;
      /*
        ⚠️ **On the grid and at its own place in it, exactly like a wave** —
        `docs/decisions/0098-a-wave-plays-a-figure.md`. This was `row.fireEvery`, which is the one
        reload site in the game that 0096 did not reach: the seeded field is not a wave, so it kept
        the pre-0094 form and every body of one kind counted down together. It is the field behind
        the title screen and behind the proof scene, so it is the first thing a player ever hears
        anything shoot in.
      */
      e.fireIn = nextOnGrid(0, row.fireEvery, i / SEEDED_BODIES);
    }
  };
  seedField();

  /*
    SOUND — `docs/decisions/0072-a-cue-is-baked-and-played.md`.

    ⚠️ **Built here, before the world, because `onCue` is a field on it.** Neither half costs
    anything at boot: `makeAudioOut` creates no context until a gesture arrives (browsers refuse to
    make a sound before one, and a context built outside a gesture starts suspended), and the speaker
    is three counters.

    ⚠️ **`speaker.play` is handed over directly rather than wrapped in an arrow.** It is a closure
    over `makeSpeaker`'s locals with no `this` in it, so detaching it is safe — and the frame calls it
    several times a step, where a wrapper would be one more call for nothing.
  */
  const audioOut = makeAudioOut();
  const speaker = makeSpeaker(audioOut);
  /*
    ⚠️ **THE SYNTHESIS STARTS NOW, AND IT USED TO START ON THE FIRST PRESS** —
    `docs/decisions/0102-the-music-goes-somewhere.md`. Twelve cues and eleven music layers are about
    seven hundred milliseconds of arithmetic on this machine, and every one of those milliseconds was
    riding the gesture that unlocks the audio — which is why
    `docs/decisions/0095-the-level-has-its-own-music.md` capped the chord progression at four bars:
    *"eight bars would be about 900ms, a freeze at tap to start."* The LENGTH OF THE MUSIC was being
    decided by how long it takes to make.

    ⚠️ **Nothing about it needs a context.** Both bakes are handed a fixed `SAMPLE_RATE` and hand back
    `Float32Array`s; only `createBuffer` needs the `AudioContext`, and that is microseconds. This
    walks the set a voice at a time across frames, so by the time a player has read the three
    difficulty names it is done — and `unlock` still bakes synchronously if they beat it.
  */
  prewarmAudio();

  const measure = (): View => viewOf(viewportWidth(host), viewportHeight(host));
  let view = measure();
  let dpr = fitCanvas(canvas, ctx, viewportWidth(host), viewportHeight(host));
  let atlas = bakeAtlas(colours, viewFor(view.alongAxis), view.scale * dpr);
  const surface = new CanvasSurface(ctx, atlas);
  surface.setSize(viewportWidth(host), viewportHeight(host), colours.space);

  const world: World = {
    /*
      DRAW ORDER, back to front, and it is a decision rather than whichever pool came first.

      Enemies underneath, both sets of shots above them so a volley leaving a body reads as leaving
      it, and the SHIP last — the player must never lose their own ship in a crowd, and at 150 enemy
      bullets a crowd is the normal state. `src/render/scene.ts` walks this array in order.
    */
    // Debris first, so fragments sit UNDER everything still alive. An explosion that draws over a
    // bullet hides the one thing on screen the player cannot afford to lose track of.
    // ⚠️ The boss sits directly above the debris and BELOW everything else. It is four times the
    // size of anything on screen, so drawing it over the enemies and shots would hide exactly the
    // things the player cannot afford to lose track of while fighting it.
    // Pickups sit just above the debris and below every threat: the player must never lose a bullet
    // behind the thing they are flying towards.
    // The shell sits directly under the ship: the marks are the ship's, so nothing may come
    // between them, and a bullet passing over one has visibly passed over it.
    // Missiles sit directly above the pulses: they are the heavier stream and the one the player is
    // meant to be able to pick out of a screen full of the lighter one.
    // The blast sits under everything it is doing damage to, so the player can see what is inside
    // it — including their own ship, which is the one thing they need to be looking at.
    layers: [debris, blasts, pickupPool, bossPool, enemies, enemyShots, playerShots, missiles, bombs, shieldOrbs, shipPool],
    /*
      THE SKY, back to front — `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.

      ⚠️ **Both depths are well under 1**, or the layer stops being a background: at 1 it moves
      exactly with the world and reads as a field of objects going past at the rate of the things
      that can kill the player. 0.12 and 0.3 put the far field almost still and the near one at a
      third of the world's rate, which is the parallax.

      ⚠️ **Built HERE, once**, because this file may allocate and `src/render/scene.ts` may not.
    */
    sky: SKY,
    /*
      ⚠️ **EMPTY AT MOUNT AND FILLED BY `startLevel`** — 0203. The sky is per mount because it is the
      same four tiled layers all run; what landmarks exist is a property of the level script, so the
      only honest value here is none. A title screen has no level and therefore no landmarks.
    */
    landmarks: [],
    // The picture of the wall the ship meets going forward — 0074. Always drawn: it is a property
    // of the playfield rather than of a screen, and a boundary that appeared only while playing
    // would be a thing the player first meets at the moment it is already stopping them.
    bound: BOUND,
    shipPool,
    shieldOrbs,
    enemies,
    playerShots,
    missiles,
    bombs,
    blasts,
    enemyShots,
    debris,
    deaths: makeDeaths(CAPACITY.enemies),
    // Its own stream per 0021: a fragment's direction is the most cosmetic roll in the game and it
    // must not be able to move a wave by one enemy.
    burstRng: makeRng('proof-scene').stream('burst'),
    // Its own stream per 0021, and NOT `burst`'s: what a death costs is which pieces the player can
    // reach, so a fragment's direction must not be able to deal a different scatter — 0077.
    scatterRng: makeRng('proof-scene').stream('scatter'),
    view,
    surface,
    // One named stream, per docs/decisions/0021-one-stream-per-concern.md, so a cosmetic roll added
    // here can never move a draw that matters.
    rng: makeRng('proof-scene').stream('spawns'),
    steps: 0,
    cameraAlong: 0,
    prevCameraAlong: 0,
    scrollPerStep: SCROLL_PER_STEP,
    /*
      ⚠️ **Read off the resolved WEAPON rather than off the row** — 0093 took the two cadence numbers
      off `ShipRow`, because a rung is a note value on a ladder now and a base is just its first
      entry. `weaponFor(shipRow, [])` is the one description of *what an unupgraded ship fires at*,
      which is the same reason `tests/pickups.test.ts` drives an empty list to get the base weapon.
    */
    fireIn: weaponFor(shipRow, []).fireEvery,
    missileIn: weaponFor(shipRow, []).missileEvery,
    ship,
    shipRow,
    enemyRows,
    enemyKinds,
    level,
    // A run begins at the beginning, so the script and the camera share an origin — 0076.
    levelOrigin: 0,
    // ⚠️ The bottom of the difficulty dial — 0084. A run always begins at the first level with
    // nothing offered yet, and `startLevel` restates the first of these for the same reason.
    levelIndex: 0,
    weaponsOffered: 0,
    nextWave: 0,
    bossRow,
    bossPool,
    bossSpawned: false,
    bossBeaten: false,
    clearedIn: 0,
    bossOffset: 0,
    bossAcross: ACROSS_SPAN / 2,
    bossPatrol: 1,
    bossPhaseAt: -1,
    bossUncoilAt: 0,
    // Nothing is dying at boot, and where the last ship died is not a question anybody has asked yet
    // — the middle of the lane is the honest blank, since it is where a ship starts. 0079.
    dyingIn: 0,
    deathOffset: SHIP_START_ALONG,
    deathAcross: ACROSS_SPAN / 2,
    nextPickup: 0,
    pickups: pickupPool,
    pickupRows,
    pickupKinds,
    collected: makeCollected(CAPACITY.pickups),
    // The base weapon, which is what an empty upgrade list resolves to. There is no second
    // description of it anywhere — 0039's "back to the base weapon" is this call with `[]`.
    weapon: weaponFor(shipRow, []),
    // Replaced below, once `dispatch` exists — the same reason `onDeath` is.
    onCleared: (): void => {},
    onPickup: (): void => {},
    onSpecial: (): void => {},
    // The game as designed, per 0024 — every knob at its least-assisted position. There is no
    // settings screen yet to move them, and `tuningFor` is where they will arrive from when there is.
    tuning: tuningFor(DEFAULT_ASSISTS),
    /*
      The tier, replaced by `startRun` the moment a run begins.

      ⚠️ **The easiest one at boot rather than the state's default**, and the difference matters for
      exactly one thing: the still field behind the title screen. It is scenery — nothing on it can
      hurt anybody, because the simulation is not stepping — and scaling scenery by a tier the player
      has not chosen yet would be the game answering a question before it was asked.
    */
    difficulty: DIFFICULTIES[DIFFICULTY_KINDS[0]!],
    bossFullHealth: bossRow.health,
    /*
      ⚠️ The KEYBOARD listens on `window`, not on the canvas. A canvas is not focusable, so a keydown
      never reaches it without a `tabindex` and a click first — which would mean the game silently
      ignores every key until the player happens to click on it, and looks broken rather than
      unfocused.

      ⚠️ TOUCH listens on the canvas, and that difference is not an inconsistency. A finger arrives
      with coordinates, and coordinates are only meaningful against the element they landed on — the
      tap strip is a fraction of the canvas box, not of the window. Pointer capture needs an element
      too.

      The GAMEPAD listens to nothing: the platform gives no move event, so it is polled per step.

      Three devices, composed by `src/app/devices.ts` rather than by call order (0032). All allocated
      here, at boot, because this file is the one allowed to (0025).
    */
    input: combineDevices([
      attachInput(window),
      /*
        ⚠️ **`bands` is what the ship OWNS, not what the binding table budgets for** — 0060. The
        strip used to be `SPECIAL_BINDINGS` bands wide unconditionally, so with one special owned
        the second band was a quarter of the glass bound to a slot `onSpecial` answers with silence.
        Reported as *"how do you fire bombs on mobile? I can do one and then can't fire any more."*
      */
      attachTouch(canvas, {
        alongAxis: () => view.alongAxis,
        scale: () => view.scale,
        bands: () => state.run.arsenal.length,
      }),
      attachPad({ alongAxis: () => view.alongAxis }),
    ]),
    intent: makeIntent(SPECIAL_BINDINGS),
    // The title screen does not step (`src/state/screens.ts`), so the game opens on a still field
    // and waits for the player rather than spending their first life for them.
    stepping: false,
    shownHealth: shipRow.health,
    // Replaced below, once the chrome exists.
    onHealth: (): void => {},
    // Replaced below, once `dispatch` exists. A function property cannot be written before the
    // thing it calls, and the alternative — hoisting the whole reducer wiring above the world it
    // mutates — would put the shell's state machine in the middle of its entity pools.
    onWreck: (): void => {},
    onDeath: (): void => {},
    // The one callback that is NOT replaced below: what a cue is worth does not depend on the
    // reducer, the chrome or the screen — it is `src/app/sound.ts`'s whole answer.
    onCue: speaker.play,
    // Replaced below, once the chrome and `dispatch` exist.
    onIdle: (): void => {},
    onTick: (): void => {},
  };

  /*
    ── THE RUN, AND THE SCREEN IT IS ON ────────────────────────────────────────────────────────────

    `src/state/` is a pure `(State, Action) => State`
    (`docs/decisions/0017-the-state-is-slices.md`), so everything that is an EFFECT of a state change
    happens here: showing chrome, stopping the simulation, putting the ship back. The reducer knows
    none of it, which is what lets the whole run be played in a unit test with no canvas.
  */
  let state: State = initialState;
  /** Whether the viewport is one the game may be played in at all — the orientation gate's answer. */
  let playable = false;
  /** Fixed steps left before the current screen expires by itself. `0` on a screen that waits. */
  let timeoutLeft = 0;
  /** The whole seconds the chrome is currently showing, or `−1` for *no countdown*. */
  let shownSeconds = -1;

  /**
   * Push the current screen at the two things that care: the chrome, and whether the sim steps.
   *
   * ⚠️ **`playable` MUST NOT appear in the `stepping` line, and this cost a CI failure to learn.**
   * It read `playable && SCREENS[screen].steps` at first, which is true and is a SECOND mechanism for
   * a guarantee that already had one: the orientation gate stops the loop outright
   * (`docs/decisions/0031-landscape-is-the-shipped-orientation.md`). With both in place, breaking the
   * gate's stop on purpose left the world frozen anyway — so 0031's probe reported STILL GREEN and
   * the assertion it protects had quietly become unfalsifiable.
   *
   * The rule is the general one and it is worth more than the line: **one guarantee, one mechanism.**
   * A redundant safety net does not make a system safer, it makes the original mechanism untestable —
   * and an untested mechanism is the one that gets refactored away. The chrome below is a different
   * question, because there is no second thing hiding it.
   */
  const applyScreen = (): void => {
    const screen = state.screen.current;
    world.stepping = SCREENS[screen].steps;
    /*
      Arm the screen's own countdown, if it has one.

      ⚠️ **`playable` is allowed to appear HERE, unlike in the `stepping` line above.** The rule
      broken there was *one guarantee, one mechanism* — the orientation gate already stops the loop,
      so a second stop made the first untestable. A countdown is not a guarantee anything else makes:
      the gate stops the loop, so `onIdle` never runs, so the timer simply would not tick — and it
      would then resume mid-count when the player turned the device back. Re-arming is the only
      honest answer to *"how long has the run-over screen been up"* while nobody could see it.
    */
    const timeout = SCREENS[screen].timeout;
    timeoutLeft = playable && timeout !== null ? timeout.steps : 0;
    shownSeconds = -1;
    chrome.show(playable ? screen : null);
    tickTimer();
  };

  /**
   * Push the countdown's whole seconds at the chrome, and only when the digit has actually moved.
   *
   * `−1` is *no countdown*, so the comparison is one number against one number — the same argument
   * `World.shownHealth` makes for remembering what the HUD says rather than rewriting it per step.
   */
  const tickTimer = (): void => {
    const next = timeoutLeft > 0 ? Math.ceil(timeoutLeft / STEPS_PER_SECOND) : -1;
    if (next === shownSeconds) return;
    shownSeconds = next;
    chrome.setTimer(next < 0 ? null : next);
  };

  /**
   * Push the run's numbers at the readout. Cheap, and called only when one of them has moved.
   *
   * ⚠️ **The pips are SHIELDS now, not health**, and the two stopped being the same number when the
   * hull became one hit (0050). The conversion is `shieldsOf`, which is also what the shell around
   * the ship is built from — so the row of pips and the ring of marks cannot disagree.
   */
  const syncHud = (): void => {
    chrome.setHud(state.run.lives, shieldsOf(shipRow, world.ship.health), MAX_SHIELDS, chargesOf(state.run.arsenal));
    chrome.setTriggers(triggers());
  };

  /**
   * Whether this device has a place to press at all.
   *
   * ⚠️ **A CAPABILITY AND NOT A GUESS AT WHAT THE PLAYER IS HOLDING.** Read once, at boot: the strip
   * is a picture of where `src/app/touch.ts` is listening, and that listener is attached on every
   * device — so the honest question is *can a finger land here*, not *is the player using one*. A
   * laptop with a touchscreen gets the strip and the strip is telling it the truth.
   *
   * ⚠️ **The alternative was to reveal it on the first touch, and it is worse in the one case that
   * matters**: the first touch of a run is as likely to be in the strip as anywhere else, so the
   * player would discover where the bomb is by spending one.
   */
  const touchable = navigator.maxTouchPoints > 0;

  /**
   * What the tap strip draws: one band per trigger that has a weapon behind it.
   *
   * ⚠️ **The same count the hit test uses**, through `bandCount`, so the picture cannot claim a band
   * the canvas is not listening on. An arsenal longer than the binding budget is 0030's *owned,
   * saved, and currently unreachable* — the strip does not draw a band nothing can press.
   */
  const triggers = (): { label: string; sprite: number; charges: number }[] => {
    if (!touchable) return [];
    const count = Math.min(state.run.arsenal.length, bandCount(state.run.arsenal.length));
    const out: { label: string; sprite: number; charges: number }[] = [];
    for (let i = 0; i < count; i++) {
      const entry = state.run.arsenal[i]!;
      out.push({ label: SPECIALS[entry.kind].label, sprite: SPECIALS[entry.kind].face, charges: entry.charges });
    }
    return out;
  };

  /**
   * How many uses the arsenal has left, across everything in it.
   *
   * ⚠️ **A total rather than a per-weapon list, because the readout is one number today and the
   * arsenal is one weapon.** When a second special can be owned this becomes a row per entry, which
   * is a chrome change and not a state one — the list is already the right shape (0039).
   */
  const chargesOf = (arsenal: State['run']['arsenal']): number =>
    arsenal.reduce((total, entry) => total + entry.charges, 0);

  /*
    ── A STEP ON A SCREEN THE SIMULATION IS NOT RUNNING ────────────────────────────────────────────

    `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`. Two jobs, and neither of
    them touches the world: move the focus ring where a pad asks, and expire a screen that says it
    expires. `world.onIdle` below is what drives it.

    ⚠️ **The pad is read THERE and the combiner is read in the step**, so exactly one snapshot is
    taken per fixed step either way — `src/app/frame.ts` takes the other branch. Reading both would
    double the one call in the game that genuinely allocates.

    ⚠️ **Declared up here, above `dispatch`, because `dispatch` spends it on a screen change** —
    0055. It reads as out of place beside the chrome it belongs to, and the alternative is a
    block-scoped read before its own declaration.
  */
  const menuPad = attachMenuPad();
  const menuAsk = makeMenuAsk();

  const dispatch = (action: Action): void => {
    const next = reduce(state, action);
    if (next === state) return;
    const moved = next.screen !== state.screen;
    const rearmed = next.run.upgrades !== state.run.upgrades;
    const runChanged = next.run !== state.run;
    /*
      ⚠️ **Per FIELD rather than per slice, and it stopped being the same question at the second
      setting.** `next.settings !== state.settings` was exactly right while there was one field on it;
      with two, changing the sound would re-run `applyStyle`, which touches the DOM and re-marks a
      chooser nobody pressed. The identity check the reducer preserves is still what makes this cheap
      — this only narrows which of the two effects it licenses.
    */
    const styleChanged = next.settings.style !== state.settings.style;
    const soundChanged = next.settings.sound !== state.settings.sound;
    state = next;
    /*
      ⚠️ **Re-resolved on a CHANGE of the list, by identity, not on every dispatch.** `weaponFor`
      walks the whole upgrade list, which is right for a pure function of saved state and wrong to do
      sixty times a second — and `src/app/frame.ts` may not allocate, so it could not do it there
      anyway. The reducer preserves identity when a slice does not move
      (`tests/run.test.ts` holds that), which is what makes `!==` the whole test.
    */
    if (rearmed) {
      world.weapon = weaponFor(shipRow, state.run.upgrades);
      /*
        ⚠️ **THE HULL FOLLOWS THE WEAPON, which is the whole of `docs/game.md`'s *every upgrade
        changes how the ship looks on screen*** — 0081. Reported from play as the fifth defect:
        *"additional autofire and missile upgrades don't change the look of the player's ship."*
        Here rather than in the frame, on the same terms the line above sets: it is a pure function of
        a list that moves a few times a run, and `src/app/frame.ts` may not walk one per step.
      */
      wearHull(world);
    }
    /*
      The run's half of the readout — lives and charges. The shield half arrives from the frame,
      which is the only thing that knows the ship was hit.

      ⚠️ **THE COMPARISON WAS MADE AFTER `state` HAD ALREADY BEEN REASSIGNED, so it was always
      false.** `next.run !== state.run` with `state` already set to `next` compares a thing to itself:
      the readout only ever refreshed when the SCREEN moved. It looked fine because the two things it
      showed both changed at a screen boundary — a death that ended the run raised the game-over
      screen, and the lives count updated on the way past.

      The bomb is what made it visible: a charge is spent mid-run, with no screen change anywhere
      near it, so the player pressed the trigger and watched the count stay where it was.
      `tests/hud.browser.test.ts` now drives exactly that.
    */
    if (runChanged || moved) syncHud();
    /*
      ⚠️ **By identity, like the weapon above.** The reducer preserves it when nothing moved
      (`tests/style.test.ts` holds that), so pressing the option that is already on re-paints
      nothing — and `applyStyle` touches the DOM.
    */
    if (styleChanged) applyStyle();
    /*
      ⚠️ **The chime is HERE and not in `applySound`**, so it sounds on a change the player made and
      never at boot. It is the only cue in the game whose subject is whether sound works, and a game
      that blipped at itself on load would be exactly the autoplay behaviour every browser forbids
      and every player resents — `src/content/cues.ts` has the argument for it existing at all.
    */
    if (soundChanged) {
      applySound();
      if (state.settings.sound === 'on') speaker.play('chime');
    }
    // Only on a real transition: `show` moves focus, and re-focusing a button on every dispatch
    // would fight a player who had tabbed away from it.
    if (moved) applyScreen();
    /*
      ⚠️ **A PRESS BELONGS TO ONE SCREEN, and this is the only place that can know a screen changed.**
      `docs/decisions/0055-a-press-belongs-to-one-screen.md`. Reported from play: starting a run with
      a pad *"automatically fires a bomb"* — the confirm button and `special1` are the same physical
      button, and nothing had spent the press on the way past, so two readers each counted it once.

      ⚠️ **Both readers, and the asymmetry is deliberate.** They swap over exactly here — the menu
      reader runs while the simulation does not and the device combiner runs while it does — so a
      press made under one is read by the other unless the transition spends it. Fixing only the
      device that was reported would leave the same bug facing the other way.

      ⚠️ **After `applyScreen`, because that is what changes which reader is about to run.** Spending
      first would hand the baseline to the reader that is on its way out.
    */
    if (moved) {
      world.input.spend();
      menuPad.spend();
    }
  };

  /*
    The three ways a run moves, and they live in `src/app/lifecycle.ts` rather than here.

    ⚠️ **They were closures over `state`, `world` and `dispatch`, and that is why nothing could test
    them.** *Does a continue reset the level?* is the single most important question 0068 asks, and
    as long as the answer was a line inside `mount` the only way to ask it was to boot a canvas —
    which `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` cannot break on purpose.
    `tests/continue.test.ts` now drives all three against a fixture world and the real reducer.

    ⚠️ **`() => state.run` and not `state.run`**, because `dispatch` reassigns `state` — a run
    captured at construction would be stale by the first `begin`.
  */
  const lifecycle = makeLifecycle(world, dispatch, () => state.run);

  /*
    What a screen's controls do.

    ⚠️ **Three of the four screens now carry something forward, and only `victory` throws a run
    away.** `cleared` keeps the run and changes the level; `gameOver` keeps the LEVEL and restocks
    the run — `docs/decisions/0068-a-run-over-is-a-continue.md`, which is what turned *Again* into
    *Continue*. A run cannot begin without a tier (0047), so the two that do end a run go back to the
    title, where the choice is.

    ⚠️ **The difference between `cleared` and `gameOver` is which half is reset, and the two must not
    drift into each other** — `docs/decisions/0042-a-run-is-a-sequence-of-levels.md` and 0068. The
    table at the top of `src/app/lifecycle.ts` is the one description of it.
  */
  const chrome = makeChrome(colours, (screen: Screen, index: number): void => {
    if (screen === 'cleared') lifecycle.onward();
    else if (screen === 'gameOver') lifecycle.resume();
    // `DIFFICULTY_KINDS` IS the order the title screen's buttons were built in
    // (`src/state/screens.ts` walks it), so the control's index reads straight off it.
    else if (screen === 'title') lifecycle.begin(DIFFICULTY_KINDS[index] ?? DIFFICULTY_KINDS[0]!);
    else dispatch({ slice: 'screen', type: 'show', screen: 'title' });
  },
  /*
    A SETTING WAS PRESSED — `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`.

    ⚠️ **The index is narrowed against the content hub, exactly as a tier is.** `STYLE_KINDS` IS the
    order `src/state/screens.ts` built the options in, so the position the chrome hands back reads
    straight off it — and nothing anywhere has to cast a string into a `StyleKind`, which is what
    `docs/decisions/0016-a-hub-enumerates-kinds.md` bans the escape hatches for.

    ⚠️ **It dispatches and stops.** What a style CHANGES is decided in one place below, off the state,
    so a second way in — a pad, a later settings screen — cannot apply half of it.
  */
  (name: SettingName, index: number): void => {
    if (name === 'style') dispatch({ slice: 'settings', type: 'style', style: STYLE_KINDS[index] ?? DEFAULT_STYLE });
    // The second setting, and it is one more line here because 0070 built the mechanism rather than
    // the style. `SOUND_KINDS` IS the order `src/state/screens.ts` built the options in.
    else if (name === 'sound') dispatch({ slice: 'settings', type: 'sound', sound: SOUND_KINDS[index] ?? DEFAULT_SOUND });
  });
  for (const element of chrome.elements) host.appendChild(element);

  /*
    WHAT A STYLE CHANGES, in one place — `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`.

    ⚠️ **Read off the ROW, never off the kind.** `STYLES[style].sky` and `.face` are the whole of
    it, so a third style is a row in `src/content/styles.ts` and no line here — the same shape
    `enemyRows` and `pickupRows` already have.

    ⚠️ **The sky is a LIST SWAP and not a flag the painter reads.** `src/render/scene.ts` walks
    `World.sky`, so an empty list is a sky that costs nothing and needs no branch: nothing below the
    shell learns that a style exists, which is what keeps 0024's *no cosmetic setting may touch the
    sim* true by construction rather than by discipline.

    ⚠️ **Called at boot as well as on a change**, or the chooser opens with nothing marked and the
    default is a thing the player can only discover by pressing something.
  */
  const applyStyle = (): void => {
    const row = STYLES[state.settings.style];
    world.sky = row.sky ? SKY : NO_SKY;
    chrome.setFace(row.face);
    chrome.setChoice('style', STYLE_KINDS.indexOf(state.settings.style));
  };
  // Once at boot, so the chooser opens with the default marked and the sky matches it.
  applyStyle();

  /*
    WHAT THE SOUND SETTING CHANGES, in one place — and it is one thing.

    ⚠️ **The speaker is told, and the WORLD is not.** That is the whole ban:
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` forbids a comfort setting from
    reaching anything that decides an outcome, and `src/app/frame.ts` goes on emitting exactly the
    same cues on exactly the same steps whether this is `on` or `off`. Silence is something that
    happens on the way out, not something the game plays differently.
  */
  const applySound = (): void => {
    speaker.setOn(state.settings.sound === 'on');
    audioOut.music()?.setOn(state.settings.sound === 'on');
    chrome.setChoice('sound', SOUND_KINDS.indexOf(state.settings.sound));
  };
  applySound();

  /*
    HOW FAR UP THE MUSIC'S LADDER THE RUN IS — `docs/decisions/0090-the-music-is-four-loops.md`.

    ⚠️ **The world is READ and never told, which is the same ban the paragraph above is about.** The
    music asks the level script how far the boss is; nothing about the music reaches a step, so a
    player with the sound off flies exactly the same game. `src/app/frame.ts` has no idea any of this
    exists.

    ⚠️ **Everything that is not a level is `calm`**, and that is one line rather than a list of
    screens: the title, the level break and the run-over screen all leave the drone playing underneath
    at a little over half. The music is one continuous piece and the levels happen inside it, which is
    why nothing here ever stops a source.

    ⚠️ **Called from `onTick` rather than per FRAME**, so it runs on the fixed clock like everything
    else that is counted, and on the screens the simulation is not running as well as the one it is.
    A `setTargetAtTime` that is re-issued at the same target is free.
  */
  /**
   * How much the aura has to move before it is worth re-issuing the ramp.
   *
   * A twentieth of the range is under half a decibel at the gains involved — below what a person can
   * hear as a step, and far enough above zero that the ramp is left alone to actually travel.
   */
  const AURA_STEP = 0.05;
  let shownNearness = 0;
  /** Which place the mixer was last told about — 0107. */
  let shownTheme: ThemeKind = 'approach';
  /**
   * Which place's MATERIAL has been asked for, and how to stop asking.
   *
   * ── THE BOUNDARY BAKE, LEFT OPEN BY TWO DECISIONS AND CLOSED BY A THIRD ─────────────────────────
   *
   * ⚠️ **`docs/decisions/0133-the-place-is-baked-at-the-boundary.md`.** 0128 built `setLoops` and
   * never called it; 0132 wrote a whole composition behind it. **Nothing in a real run has ever
   * played a place's own notes**, and this is the two lines that were missing.
   *
   * ⚠️ **KEYED TO THE RUN'S NEXT LEVEL RATHER THAN TO THE FIELD'S CURRENT ONE, WHICH BUYS THE WHOLE
   * BREAK SCREEN.** `run.level` increments when a boss dies
   * (`src/state/slices/run.ts`), so the incoming place is known before
   * `docs/decisions/0063-a-level-break-is-a-respite.md`'s screen is even drawn — and the bake gets
   * however long the player spends on it instead of racing the level it belongs to. Reading
   * `world.level.theme` here would start it at `advanceLevel`, which is three or four seconds too
   * late.
   *
   * ⚠️ **The MIX still follows the field and not the run**, which is `shownTheme` above and is a
   * different question: what is playing is a fact about where the ship is, and what is baking is a
   * fact about where it is going.
   */
  let bakingTheme: ThemeKind | null = null;
  let stopBaking: (() => void) | null = null;

  /** The backdrop the surface was last given, so a place is applied once rather than every step. */
  let shownSpace = colours.space;

  /**
   * Put the run in its PLACE — the backdrop half of a level's theme.
   *
   * ⚠️ **`docs/decisions/0107-a-level-is-a-place.md`.** Reported: *"the same music and boss music
   * repeats level after level after level."* A theme's colour is the cheapest half of the answer: one
   * property write on the canvas, no re-bake, and nothing that can hitch at a boundary.
   *
   * ⚠️ **Separate from `applyMusicLevel` because the music can be OFF and the place cannot.** That
   * function returns early when there is no `AudioContext` — a player who has never pressed anything,
   * or who chose silence on the title screen — and a backdrop folded into it would leave those
   * players in level one's void for the whole run.
   *
   * ⚠️ **Everything not in a level gets the palette's own `space`**, which is what the title, the
   * level break and the run-over screen have always been drawn on. A place belongs to a level.
   */
  const applyPlace = (): void => {
    const want =
      state.screen.current === 'playing' ? THEMES[world.level.theme].space[palette] : PALETTES[palette].space;
    /*
      ⚠️ **THE WEATHER IS RE-BAKED HERE AND THE BACKDROP IS A PROPERTY WRITE, WHICH IS THE WHOLE
      DIFFERENCE IN COST** — `docs/decisions/0112-the-sky-has-weather.md`. One canvas the size of two
      lanes, drawn when the place changes and never inside a frame; `src/render/bake.ts` has why it is
      one bitmap rather than a seventh atlas.

      ⚠️ **Gated on the same memo as the backdrop, so it happens ONCE per place.** This runs every
      frame and does nothing almost every time, exactly as `applyMusicLevel` does — and the two are
      separate for the reason stated below: the music can be off and the place cannot.
    */
    if (want === shownSpace) return;
    shownSpace = want;
    surface.setSpace(want);
    /*
      ── AND THE SKY ITSELF BELONGS TO THE PLACE NOW — 0195 ────────────────────────────────────────

      ⚠️ **THIS IS WHERE THE BACKDROP WAS ALREADY A PLACE'S, AND IT WAS ONLY EVER TWO COLOURS.**
      Reported: *"a level specific backdrop instead of the same starry canvas and a slight hue change
      on each level."* `skyField` took no theme, so all seven levels drew **the same stars in the same
      places** and this function tinted them. The atlas is re-baked when the place changes, so what
      moves is the field rather than the hue.

      ⚠️ **IT RIDES THE FUNCTION THAT ALREADY RUNS ON A BACKDROP CHANGE**, rather than a second watcher:
      one comparison a step, and `atlasIsStale` answers it. A re-bake is 58 bitmaps and it happens at a
      level boundary, which is exactly what
      `docs/decisions/0133-the-place-is-baked-at-the-boundary.md` established for the other channel.
    */
    const place: ThemeKind = state.screen.current === 'playing' ? world.level.theme : 'approach';
    if (atlasIsStale(atlas, atlas.view, view.scale * dpr, place)) {
      atlas = bakeAtlas(colours, atlas.view, view.scale * dpr, place);
      surface.setAtlas(atlas);
    }
    const clouds =
      state.screen.current === 'playing' ? THEMES[world.level.theme].nebula[palette] : PALETTES[palette].sky;
    bakeNebula(atlas, clouds, view.scale * dpr, place);
    // The landmark takes the same gas colour as the weather — 0203. One place, one colour, so the
    // pillars are lit by the nebula they stand in rather than by a palette that never heard of it.
    bakeLandmark(atlas, clouds, colours.space, view.scale * dpr, place);
  };

  /**
   * Start synthesising the place the run is heading for, if it is not the one already asked for.
   *
   * ⚠️ **0133.** One comparison a step and a no-op almost every time, on exactly the terms
   * `applyMusicLevel` states for itself. What it costs when it is NOT a no-op is a walk scheduled off
   * the frame — `bakePlace` owns that and `src/app/sound.ts` has the argument.
   *
   * ⚠️ **A place that states no material of its own is free end to end**: `revoicedBy` is empty, the
   * job list is empty, `ready` fires on the first tick with the base arrays and `setLoops` finds every
   * one identical and does nothing. Six of the seven places are in that state today, and the title
   * screen is too.
   */
  const bakeIncomingPlace = (): void => {
    const theme = placeFor(state.run.level);
    if (theme === bakingTheme) return;
    /*
      ⚠️ **The one in flight is stopped rather than left to finish.** A run that clears two levels
      while a bake is walking would otherwise hand the mixer the material for a place it has already
      left — and 0128's swap lands at the next PHRASE, so the wrong piece would arrive up to
      twenty-five seconds after the level it belongs to ended.
    */
    stopBaking?.();
    bakingTheme = theme;
    stopBaking = bakePlace(theme, ({ loops, cues }) => {
      /*
        ⚠️ **Asked for again at the moment it is handed over, not captured.** The context can be built
        or torn down while a bake walks, and a `MusicOut` closed over here would be one the player is
        no longer listening to.
      */
      audioOut.music()?.setLoops(loops);
      /*
        ⚠️ **AND THE CUES ARRIVE ON THE SAME BAKE** — 0190. They are handed over together because they
        were baked together: a boundary that swapped the music and left the enemy deaths behind would
        be a place half arriving, and the two lists come out of one job walk in `bakePlace`.

        ⚠️ **ON `audioOut` RATHER THAN THROUGH `music()`**, because a cue is not the music — the same
        line `duck` is drawn on, one direction over.
      */
      audioOut.setCues(cues);
    });
  };

  const applyMusicLevel = (): void => {
    const music = audioOut.music();
    if (music === null) return;
    music.start();
    bakeIncomingPlace();
    /*
      ⚠️ **`music.phaseTo(world.steps)` WAS THE LINE ABOVE THIS AND 0160 REMOVED IT.** It ran every
      frame and did nothing almost every time: it kept the loops in phase with the sim's step clock
      after `src/app/loop.ts` dropped steps past `MAX_STEPS`, which is 0022 working as designed.

      ⚠️ **IT WAS THE LAST PLACE THE SIM REACHED THE MUSIC.** 0094 put it here so the gun and the
      loops would keep one clock; `docs/decisions/0159-the-two-clocks-come-apart.md` ended that, and
      `docs/decisions/0160-the-music-free-runs.md` is why correcting towards a clock you no longer
      share is worse than not correcting at all. **The music now free-runs on the audio clock**,
      which is the one it is played against and the one that does not drop steps.
    */
    const level =
      state.screen.current === 'playing'
        ? musicLevelFor(
            world.cameraAlong - world.levelOrigin,
            world.bossPool.size > 0,
            /*
              ⚠️ **THE LEVEL'S OWN SCRIPT, AND IT IS THE ONLY THING `src/` MAY PASS HERE** — 0158.
              Where a section opens stopped being three shared constants and became a thing a level
              says, so this argument is required and `tests/dash.test.ts` checks that every call site
              under `src/` passes exactly this expression: a shipped caller that built its own list
              would make the shape of a level decided in two places.

              ⚠️ **It pairs with the level-local camera above.** `world.cameraAlong` is the run's and
              a script's `at` is the level's, which is why the origin comes off on the first argument
              — `docs/decisions/0100-a-level-places-its-pickups-too.md` is the decision written
              because that subtraction was missing somewhere else.
            */
            world.level.sections,
            /*
              ⚠️ **How much of the boss is left, as a share of what it started with** — 0113. The
              fight's second rung is keyed to this rather than to a clock, so the wall of sound lands
              when the fight is half won rather than at a fixed moment however it is going.

              ⚠️ **Read off the POOL rather than remembered**, on the same terms the aura reads the
              hulls: a boss that has just died leaves an empty pool and the branch above is what
              catches that, so there is no stale health to go wrong.
            */
            world.bossPool.size > 0 && world.bossFullHealth > 0
              ? world.bossPool.at(0).health / world.bossFullHealth
              : 1,
          )
        : 'calm';
    /*
      THE AURA — `docs/decisions/0091-the-boss-has-an-aura.md`, and it is the one thing here that
      changes every step rather than at a boundary.

      ⚠️ **The gap between the HULLS**, so a bigger boss is nearer at the same centre distance and the
      number means the same thing for all seven of them.

      ⚠️ **`world.ship` is read even while the ship is wrecked**, and that is correct rather than
      overlooked: the entity keeps its position through the death beat
      (`docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md` releases it
      from the POOL, not from the world), so the aura holds where the player died instead of jumping
      to nothing for eight tenths of a second.
    */
    const boss = world.bossPool.size > 0 ? world.bossPool.at(0) : null;
    /*
      ⚠️ **AND THE LEVEL RAISES IT TOO, WHICH IS THE HALF THAT MAKES A LEVEL A SHAPE** — 0107. Asked
      for in play: *"the aura music for the boss needs to start about 15-30secs into the start of a
      level and then amp up until you beat the boss."* The build climbs from twenty seconds in to the
      boss's own place; the proximity above is what the fight then modulates, and `auraFor` takes the
      LOUDER of the two rather than adding them — see its own note for why a sum cannot be right.

      ⚠️ **Only while PLAYING**, so a level break and the title do not sit under a rising dread that
      belongs to a level nobody is in. Everything not in a level is `calm`, which is 0090's rule and
      the same branch `level` above takes.
    */
    const build =
      state.screen.current === 'playing'
        ? auraBuild(world.cameraAlong - world.levelOrigin, world.level.bossAt, world.level.theme)
        : 0;
    const nearness = auraFor(
      build,
      boss === null ? 0 : auraNearnessFor(boss.along, boss.radius, world.ship.along, world.ship.radius),
    );
    /*
      ⚠️ **Re-issued whenever the LEVEL changes or the aura has moved enough to hear**, rather than
      every step. `setTargetAtTime` is cheap and re-issuing it at the same target is free, but
      cancelling and rescheduling sixty times a second is a ramp that never gets anywhere — the
      envelope would restart from wherever it had reached, which flattens the curve it is meant to be
      following.
    */
    /*
      ⚠️ **THE PLACE IS PART OF THE CONDITION, AND LEAVING IT OUT WOULD BE A SILENT BUG** — 0107. A
      level boundary that changed the theme without changing the rung or moving the aura would leave
      the whole run playing the previous place's mix, and it is exactly the case a boundary produces:
      `advanceLevel` keeps the camera (0076), so `musicLevelFor` can answer the same rung on both
      sides of it.
    */
    const theme = state.screen.current === 'playing' ? world.level.theme : 'approach';
    if (level !== music.level() || theme !== shownTheme || Math.abs(nearness - shownNearness) > AURA_STEP) {
      shownNearness = nearness;
      shownTheme = theme;
      music.setLevel(level, nearness, theme);
    }
  };

  /*
    THE UNLOCK — `src/app/sound.ts` has the platform rule and its one gap.

    ⚠️ **On `window` in the CAPTURE phase, so it runs before whatever the player actually pressed.**
    The gesture that starts a run is the gesture that turns the sound on, and a listener that ran
    after the button's own handler would leave the first cue of the first run playing into a context
    that had not resumed yet.

    ⚠️ **Never removed until `stop`, and that is not a leak.** A mobile browser suspends the context
    when the tab goes to the background, so the gesture that brings the player back is the one that
    has to revive it — `unlock` is idempotent and re-resumes rather than rebuilding.
  */
  const unlock = (): void => audioOut.unlock();
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });

  /*
    ⚠️ **The frame reports a death; this decides what it cost.** `dispatch` may flip the screen to
    `gameOver` on its own — `src/state/root.ts` holds that as the one cross-slice agreement — so the
    check below reads the state AFTER the reducer has run rather than predicting what it will say.
  */
  world.onHealth = syncHud;

  /*
    ── A STEP ON A SCREEN THE SIMULATION IS NOT RUNNING ────────────────────────────────────────────

    `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`. Two jobs, and neither of
    them touches the world: move the focus ring where a pad asks, and expire a screen that says it
    expires.

    ⚠️ **The pad is read HERE and the combiner is read in the step**, so exactly one snapshot is
    taken per fixed step either way — `src/app/frame.ts` takes the other branch. Reading both would
    double the one call in the game that genuinely allocates.
  */
  world.onIdle = (): void => {
    menuPad.read(menuAsk);
    /*
      ⚠️ **THE PAD ASKS FOR THE UNLOCK TOO, AND IT IS NOT POINTLESS EVEN THOUGH IT USUALLY FAILS.**
      Reported, as an objection to this decision's own wording: *"if the gamepad can move between
      menus and select a menu option to start a game, how can that not be counted as input to start
      sounds?"* — and the answer is that the browser never saw anything. The Gamepad API produces no
      DOM events at all; it is polled, and user activation is granted by input EVENTS. There is
      nothing for the platform to attribute a press to.

      **But refusing to try was this file's mistake rather than the platform's.** Activation is
      sticky per page: a player who clicked anything at all earlier — itch's own play button, the
      canvas, a tab — has it, and a `resume()` from here then succeeds. Attempting costs a branch on
      the frames a pad is actually asking for something, and it converts *silent for pad users* into
      *silent only where the browser genuinely forbids it*.
    */
    if (menuAsk.move !== 0 || menuAsk.confirm) audioOut.unlock();
    if (menuAsk.move !== 0) chrome.move(menuAsk.move);
    /*
      ⚠️ **No `return` needed any more, and the countdown is no longer here.** `activate` changes the
      screen underneath, and counting the new screen's first step down would have spent a step of a
      timer armed a microsecond ago — decision 0063 moved the countdown to `onTick`, which runs
      BEFORE this, so the two can no longer race in that order.
    */
    if (menuAsk.confirm) chrome.activate();
  };

  /**
   * A fixed step happened, whether or not the simulation took it. Spend the screen's countdown.
   *
   * ⚠️ **This ran inside `onIdle` until a screen wanted both** — decision 0063. The level break steps
   * the world AND counts down, and `onIdle` fires only on the steps the simulation does not take, so
   * its timer would simply never have ticked there.
   *
   * ⚠️ **Where expiring GOES is the row's answer, not this function's** — `src/state/screens.ts`
   * carries `then`, and the two cases are there because they are genuinely two: a level break expires
   * into `continueRun`, which is not a screen and could never be named by one, and the run-over
   * screen expires to the title *past* a *Continue* button that would have resumed the run.
   *
   * ⚠️ **This read `chrome.activate()` unconditionally for one commit and it was a live bug**, caught
   * by `tests/menu.browser.test.ts` rather than by reading: pressing the control was the same thing as
   * the destination only while the only button on a dead run was a way of giving up.
   */
  world.onTick = (): void => {
    /*
      ⚠️ **The speaker's clock, and it is here rather than in `onIdle` for decision 0063's reason.**
      A cue's hold is counted in fixed steps (`src/content/cues.ts`), and holds have to expire on the
      screens the simulation is not running as well as the one it is — otherwise a cue heard on the
      last step of a level is still held when the next one starts. This is the callback that fires on
      every step either way, which is exactly what it was split out of `onIdle` to be.
    */
    /*
      ⚠️ **The world's step goes in, and it is a DIFFERENT clock from the hold's** — 0104. A hold is
      counted in the speaker's own steps so that it expires on the screens the simulation is stopped
      on (0063, and the reason this call is here rather than in `onIdle`); a cue's `figure` is counted
      against the MUSIC, which is in phase with `world.steps` and with nothing else (0094). Handing
      the world's number over is what makes an accent land where the bar says.
    */
    speaker.step(world.steps);
    applyPlace();
    applyMusicLevel();
    if (timeoutLeft <= 0) return;
    timeoutLeft--;
    tickTimer();
    if (timeoutLeft > 0) return;
    const then = SCREENS[state.screen.current].timeout?.then;
    if (then == null) chrome.activate();
    else dispatch({ slice: 'screen', type: 'show', screen: then });
  };

  /*
    THE SHIP CAME APART — 0079, and this fires `DEATH_STEPS` before `onDeath` below.

    ⚠️ **The charges are read at the WRECK because that is the event the pyre is a picture of**, and
    it is no longer also the last moment they exist. `lifeLost` used to take the arsenal back to the
    ship's starting kit; `docs/decisions/0085-a-death-does-not-cost-the-bombs.md` leaves it alone, so
    both ends of the beat now give the same answer. Reading it here is still the right line — the ring
    is sized by what the ship was carrying **when it came apart** — and 0085 keeps the pyre exactly as
    it was: the ordnance goes up with the hull and the next ship is issued the same kit, which is what
    *"reset on a continue, but not on player death"* asks for.

    ⚠️ **Every charge in the arsenal, not every bomb.** `chargesOf` already totals the list for the
    readout, and using it says *what the ship was carrying goes up with it* — a rule a second special
    inherits without anybody remembering to, on the same terms `levelCleared` grants each of them one.
  */
  world.onWreck = (): void => {
    detonateArsenal(world, chargesOf(state.run.arsenal));
  };

  world.onDeath = (): void => {
    /*
      ⚠️ **BEFORE the reducer, because the reducer is what empties the list.** `lifeLost` clears the
      upgrades (0039), so a scatter dispatched after it would throw nothing —
      `docs/decisions/0066-a-death-scatters-what-it-took.md`. The ordering is real and unstatable in
      `src/app/frame.ts`, so `tests/pickups.test.ts` drives the shell rather than the frame.

      ⚠️ **On EVERY death, including the last one**, on the same terms `src/state/slices/run.ts` gives
      for clearing the arsenal at zero lives: a rule with a hidden condition is a rule nobody can
      read, and the condition would be *did the caller intend to keep playing*. Nothing collects them
      on a run that is over, and the wreck is on screen under the overlay either way (0036).
    */
    scatterUpgrades(world, state.run.upgrades);
    dispatch({ slice: 'run', type: 'lifeLost' });
    if (state.run.lives > 0) respawn(world);
  };

  /*
    The boss is dead. The run survives it — 0039's *carry forward* is exactly this boundary — so the
    only things that change are the level count and the screen.
  */
  world.onCleared = (): void => {
    dispatch({ slice: 'run', type: 'levelCleared' });
    /*
      ⚠️ **`cleared` unconditionally, and the reducer decides whether that is the truth.**
      `src/state/root.ts` holds *a level cleared past the end of the run is the run finished* as a
      cross-slice agreement, so the shell does not get to have an opinion about which screen this is —
      which is what makes the rule testable without mounting a canvas.
    */
    dispatch({ slice: 'screen', type: 'show', screen: 'cleared' });
  };

  /*
    A pickup landed. The two effects go to different fields and are cleared by different events —
    `src/content/pickups.ts` has the split, and 0039 has the reason for it.
  */
  /*
    THE FIRST TRIGGERED SPECIAL — 0053, and the first consumer of the input half 0030 landed.

    ⚠️ **The frame reports the ask and this decides**, exactly as it does for a death. Whether there
    is a charge is the run's business; whether anything happens on screen is the frame's; and the two
    halves meet here rather than either one growing an opinion about the other.

    ⚠️ **A slot nobody owns is silence, not a throw.** `src/content/actions.ts` says a binding is a
    POSITION in the arsenal, and a player pressing the second trigger with one special owned is
    asking for something that does not exist yet.
  */
  world.onSpecial = (slot: number): void => {
    const entry = state.run.arsenal[slot];
    if (entry === undefined || entry.charges <= 0) return;
    dispatch({ slice: 'run', type: 'spent', slot });
    launchSpecial(world, entry.kind);
  };

  world.onPickup = (kind: PickupKind): void => {
    /*
      ⚠️ **`effectOf` and not `PICKUPS[kind].effect`, and the difference is the max-speed nerf.** A
      weapon pickup taken by a ship whose weapon can no longer grow reports itself as a `special`, so
      it lands in the arsenal instead of in a list where it would change nothing —
      `src/content/pickups.ts` has the reasoning and `docs/game.md`'s *"an upgrade that cannot change
      the outcome is worse than none"* is the rule it keeps.

      ⚠️ **The shell's own business is only WHICH ACTION an effect dispatches.** Deciding what a
      pickup does to this ship is content's, and it lived here until 0082 moved it — where no unit
      test could reach it without a DOM.
    */
    /*
      ⚠️ **The upgrade LIST rather than `world.weapon`, since 0083.** Two ladders cap at different
      times, so *is this pickup still worth taking* is a question about the kind in the player's hand
      — a resolved weapon cannot tell a maxed pulse from an empty missile rack.
    */
    const effect = effectOf(kind, state.run.upgrades);
    /*
      A SPECIAL — charges into the arsenal, and it is the `took` action finally cashing.
      `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`.

      ⚠️ **`took` has existed since 0039 with nothing that dispatches it**, which
      `src/content/specials.ts` says out loud about its own table: a rule about what a death costs
      needs a list that can be non-empty before it is testable at all. This is the line that makes it
      a mechanism rather than a shape.

      ⚠️ **The reducer decides what a charge is worth, not this.** `took` reads
      `SPECIALS[kind].charges`, and a special already owned gains charges rather than a second
      trigger — `src/state/slices/run.ts` has that rule and it is not restated here.

      ⚠️ **`WEAPON_OVERFLOW` COVERS BOTH WAYS OF GETTING HERE, AND THAT IS TRUE RATHER THAN GENERAL.**
      Two things report `special`: the bomb pickup, and a weapon pickup taken by a ship whose weapon
      is full — and both grant a bomb, so one constant answers both. **A SECOND special pickup breaks
      that**, because this line would hand out a bomb for it. Left as one constant rather than a
      lookup because `src/content/pickups.ts`'s table is what would force the question: a new kind
      cannot be added without answering `effect`, and the row that answers `special` is the row that
      has to say which one. Writing the branch now would be inventing a shape for content that does
      not exist, which is what `src/content/ships.ts` refuses for the character roster.
    */
    if (effect === 'special') dispatch({ slice: 'run', type: 'took', special: WEAPON_OVERFLOW });
    /*
      ⚠️ **A shield goes on the SHIP and not through the reducer**, and it is the one pickup that
      does. `docs/decisions/0017-the-state-is-slices.md` puts the run's own numbers in state — lives,
      upgrades, the tier — because they survive a life and have to be saved; a shield is armour on the
      life being flown, spent by the collision, and gone with the ship that wore it. Its home is the
      ship's `health`, which is the field the collision already moves. A copy in the reducer would be
      a second answer that only the pickup ever updated.

      ⚠️ **Capped here.** `MAX_SHIELDS` is the shell the player can read at a glance, and a fourth
      mark would have nowhere to be drawn — `src/content/ships.ts`.
    */ else if (effect === 'shield') world.ship.health = Math.min(world.ship.health + 1, fullHealthFor(shipRow));
    // `isUpgrade` rather than a ternary on one name: the ternary was correct for exactly as long as
    // there were two upgrades, and the pickup above is not one — `src/content/pickups.ts`.
    else if (isUpgrade(kind)) dispatch({ slice: 'run', type: 'upgraded', upgrade: kind });
  };

  /** Re-measure, re-fit and — only if the orientation or resolution actually moved — re-bake. */
  const onResize = (): void => {
    const next = measure();
    // Gate FIRST and return: a view that is not drawn needs no fit and no atlas, and baking the
    // top-down sprites for a rotation nobody will see is the one expensive thing a resize can do.
    if (next.alongAxis !== 'x') {
      setPlayable(false);
      return;
    }
    const width = viewportWidth(host);
    const height = viewportHeight(host);
    const nextDpr = fitCanvas(canvas, ctx, width, height);
    const wantView = viewFor(next.alongAxis);
    const wantResolution = next.scale * nextDpr;
    if (atlasIsStale(atlas, wantView, wantResolution, atlas.theme)) {
      atlas = bakeAtlas(colours, wantView, wantResolution, atlas.theme);
      surface.setAtlas(atlas);
    }
    view = next;
    dpr = nextDpr;
    world.view = next;
    surface.setSize(width, height, colours.space);
    // Last, so a resumed loop's first frame draws at the size that was just fitted.
    setPlayable(true);
  };

  /*
    THE ORIENTATION GATE — docs/decisions/0031-landscape-is-the-shipped-orientation.md.

    ⚠️ It stops the SIMULATION, it does not cover it. An overlay above a running game loses the run
    to something the player cannot see, and would have to be dismissible to be honest about that —
    at which point it permits the exact view the decision exists to prevent.

    The condition is `view.alongAxis`, which is already computed from the viewport's shape. There is
    no second description of "is this portrait" to drift: a square viewport reads as landscape by
    `viewOf`'s own tie-break, and a square window is merely gutter-heavy rather than the failure this
    guards — art moving the wrong way.

    ⚠️ The manifest's `orientation: landscape` is a HINT and is not this. It binds an installed PWA
    and does nothing in a mobile browser tab or the itch iframe, which is where most players arrive.
  */
  const gate = makeGate(colours.player, colours.space);
  host.appendChild(gate);
  let stopLoop: (() => void) | null = null;

  const setPlayable = (next: boolean): void => {
    playable = next;
    gate.style.display = playable ? 'none' : 'flex';
    canvas.style.visibility = playable ? 'visible' : 'hidden';
    // The chrome follows the gate, so a hidden game never leaves a focusable button behind it.
    applyScreen();
    if (playable && stopLoop === null) {
      // A resize is not a frame, so building a frame here is affordable — the rule this file opens
      // with. Restarting also drops the accumulated step debt, which is right: time spent looking at
      // a rotate prompt is not time the world should catch up on.
      stopLoop = runLoop(new GameFrame(world));
    } else if (!playable && stopLoop !== null) {
      stopLoop();
      stopLoop = null;
    }
  };

  window.addEventListener('resize', onResize);
  setPlayable(view.alongAxis === 'x');

  return {
    canvas,
    stop(): void {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      chrome.release();
      world.input.release();
      // Closes the context and drops the buffers. A page that mounts twice must not leave the first
      // mount's audio graph alive behind the second's — `tests/boot.browser.test.ts` mounts and stops.
      audioOut.release();
      menuPad.release();
      stopLoop?.();
      stopLoop = null;
    },
  };
}

/** The host's width, falling back to the viewport when it has not been laid out yet. */
function viewportWidth(host: Element): number {
  return host.clientWidth || window.innerWidth;
}

function viewportHeight(host: Element): number {
  return host.clientHeight || window.innerHeight;
}

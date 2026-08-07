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
import { ACROSS_SPAN, MAX_ALONG_SPAN, type View, viewOf } from '../sim/camera.ts';
import { type Entity, makeEntity, reset } from '../sim/entity.ts';
import { Pool } from '../sim/pool.ts';
import { makeCollected, makeDeaths } from '../sim/collide.ts';
import { makeRng } from '../sim/rng.ts';
import { atlasIsStale, bakeAtlas, viewFor } from '../render/bake.ts';
import { CanvasSurface, renderScale } from '../render/canvas.ts';
import { SPECIAL_BINDINGS } from '../content/actions.ts';
import { SPECIALS } from '../content/specials.ts';
import { DEFAULT_ASSISTS, tuningFor } from '../sim/assist.ts';
import { ENEMIES, ENEMY_KINDS, type EnemyKind, type EnemyRow } from '../content/enemies.ts';
import { LEVELS, LEVEL_KINDS } from '../content/levels.ts';
import { BOSSES } from '../content/bosses.ts';
import { CYCLE, PICKUPS, PICKUP_KINDS, isUpgrade, type PickupKind, weaponFor } from '../content/pickups.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS, type DifficultyKind } from '../content/difficulty.ts';
import { SPRITE, SPRITE_EXTENT } from '../content/sprites.ts';
import { holdStation, SCROLL_PER_STEP } from '../sim/flight.ts';
import { MAX_SHIELDS, SHIPS, fullHealthFor, shieldsOf } from '../content/ships.ts';
import { makeIntent } from '../sim/intent.ts';
import {
  GameFrame,
  SHIP_START_ALONG,
  launchSpecial,
  resetScene,
  respawn,
  scatterUpgrades,
  startLevel,
  type World,
} from './frame.ts';
import { SCREENS, STEPS_PER_SECOND, type Screen } from '../state/screens.ts';
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
  /**
   * The other face of each pickup, by index — `CYCLE` resolved once so the frame never looks a kind
   * up by name. Built from the table rather than written out, so a pair added there arrives here.
   */
  const pickupCycle = PICKUP_KINDS.map((k) => pickupKinds[CYCLE[k]]);

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
    for (let i = 0; i < 12; i++) {
      const e = enemies.spawn();
      if (e === null) break;
      const kind = seed.int(0, enemyRows.length - 1);
      const row = enemyRows[kind]!;
      const margin = row.radius + 2;
      reset(e, seed.range(SHIP_START_ALONG + 60, MAX_ALONG_SPAN), seed.range(margin, ACROSS_SPAN - margin), row, kind);
      e.velAlong = -row.closing;
      e.fireIn = row.fireEvery;
    }
  };
  seedField();

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
    sky: [
      { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.12 },
      { sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.3 },
    ],
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
    view,
    surface,
    // One named stream, per docs/decisions/0021-one-stream-per-concern.md, so a cosmetic roll added
    // here can never move a draw that matters.
    rng: makeRng('proof-scene').stream('spawns'),
    cameraAlong: 0,
    prevCameraAlong: 0,
    scrollPerStep: SCROLL_PER_STEP,
    fireIn: shipRow.fireEvery,
    missileIn: shipRow.missileEvery,
    ship,
    shipRow,
    enemyRows,
    enemyKinds,
    level,
    nextWave: 0,
    bossRow,
    bossPool,
    bossSpawned: false,
    bossBeaten: false,
    clearedIn: 0,
    bossOffset: 0,
    bossAcross: ACROSS_SPAN / 2,
    bossPatrol: 1,
    nextPickup: 0,
    pickups: pickupPool,
    pickupRows,
    pickupKinds,
    pickupCycle,
    pickupFlipped: false,
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
    onDeath: (): void => {},
    // Replaced below, once the chrome and `dispatch` exist.
    onIdle: (): void => {},
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
    state = next;
    /*
      ⚠️ **Re-resolved on a CHANGE of the list, by identity, not on every dispatch.** `weaponFor`
      walks the whole upgrade list, which is right for a pure function of saved state and wrong to do
      sixty times a second — and `src/app/frame.ts` may not allocate, so it could not do it there
      anyway. The reducer preserves identity when a slice does not move
      (`tests/run.test.ts` holds that), which is what makes `!==` the whole test.
    */
    if (rearmed) world.weapon = weaponFor(shipRow, state.run.upgrades);
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

  /**
   * Start a run. The same answer for both controls, because both mean the same thing — 0039 says a
   * game over ends the run outright, so *Again* is a new run and not a continue.
   */
  /**
   * Put the run's current level on the field.
   *
   * ⚠️ **`LEVEL_KINDS` IS the order** — `src/content/levels.ts` refuses a second ordering table — so
   * the run's level index reads straight off it. Past the end is a run that has been finished, and
   * the caller is what decides that; this clamps rather than throwing, because a level index that
   * has run off the end is a bug in the shell and a black screen is a worse way to report it.
   */
  /**
   * `keepShell` is the difference between the two callers, and it is stated rather than ordered.
   *
   * ⚠️ **A level boundary keeps the shell; a run beginning does not** —
   * [0058](../../docs/decisions/0058-a-level-boundary-keeps-the-shell.md). It was briefly implicit in
   * the order `startRun` does things, and a probe over that ordering came back STILL GREEN: nothing
   * could see a rule that no line stated. `src/app/frame.ts` has the whole of it.
   */
  const enterLevel = (keepShell: boolean): void => {
    const kind = LEVEL_KINDS[Math.min(state.run.level, LEVEL_KINDS.length - 1)]!;
    startLevel(world, LEVELS[kind], keepShell);
  };

  /** Carry on into the next level. Everything the run is carrying comes with it — the shell too. */
  const continueRun = (): void => {
    enterLevel(true);
    world.rng = makeRng('proof-scene').stream('spawns');
    dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
  };

  const startRun = (difficulty: DifficultyKind): void => {
    /*
      ⚠️ **Resolved to a ROW here, once, and the frame never looks a tier up by name.** Same argument
      `enemyRows` and `pickupRows` make next door: a per-spawn lookup by string key is a cost paid
      forever to avoid one line at the start of a run.
    */
    world.difficulty = DIFFICULTIES[difficulty];
    resetScene(world);
    /*
      ⚠️ **`seedField` is NOT called here, and it used to be.** A random opening field is the right
      answer for a scene proving the page draws and the wrong one for an authored level: it puts
      content the designer did not write in front of the player, at positions no play-test can act
      on. `src/content/levels.ts` opens with waves inside the spawn horizon, so the level fills its
      own first screen — which is what an authored level is FOR.

      It still runs once at boot, because the title screen is over a still field and an empty one
      would look like a broken build.
    */
    // A fresh spawn stream, so run two is run one — the reason `seedField` gives.
    world.rng = makeRng('proof-scene').stream('spawns');
    // ⚠️ `begin` FIRST, because it resets the level index to zero and `enterLevel` reads it. The
    // tier travels with it: `src/state/slices/run.ts` is where a run's lives come from now.
    dispatch({ slice: 'run', type: 'begin', difficulty });
    // ⚠️ `false`: a run begins with the ship's hull and nothing on it, whatever the last run ended
    // wearing — 0058.
    enterLevel(false);
    dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
  };

  /*
    What a screen's one control does. Three of the four start a fresh run; `cleared` is the only one
    that carries anything forward, which is the whole difference between a level ending and a run
    ending — `docs/decisions/0042-a-run-is-a-sequence-of-levels.md`.
  */
  /*
    What a screen's controls do.

    ⚠️ **Only two of the four screens start anything, and that is 0047's doing.** A run cannot begin
    without a tier, so *Again* on the run-over and victory screens goes back to the TITLE rather than
    restarting — the title is where the choice is, and a button that silently reused the last tier
    would be the game deciding for a player who has just watched a run end.

    ⚠️ `cleared` is the only screen that carries anything forward, which is the whole difference
    between a level ending and a run ending —
    `docs/decisions/0042-a-run-is-a-sequence-of-levels.md`.
  */
  const chrome = makeChrome(colours, (screen: Screen, index: number): void => {
    if (screen === 'cleared') continueRun();
    // `DIFFICULTY_KINDS` IS the order the title screen's buttons were built in
    // (`src/state/screens.ts` walks it), so the control's index reads straight off it.
    else if (screen === 'title') startRun(DIFFICULTY_KINDS[index] ?? DIFFICULTY_KINDS[0]!);
    else dispatch({ slice: 'screen', type: 'show', screen: 'title' });
  });
  for (const element of chrome.elements) host.appendChild(element);

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
    if (menuAsk.move !== 0) chrome.move(menuAsk.move);
    if (menuAsk.confirm) {
      /*
        ⚠️ **Return, because activating changed the screen underneath us.** `activate` clicks the
        control, which runs `startRun`, which dispatches, which re-arms the countdown — and counting
        the new screen's first step down here would spend a step of a timer that was armed a
        microsecond ago on a screen the player has already left.
      */
      chrome.activate();
      return;
    }

    if (timeoutLeft <= 0) return;
    timeoutLeft--;
    tickTimer();
    if (timeoutLeft > 0) return;
    const timeout = SCREENS[state.screen.current].timeout;
    // Read off the row rather than remembered, so *where it goes* has exactly one description.
    if (timeout !== null) dispatch({ slice: 'screen', type: 'show', screen: timeout.then });
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
    const effect = PICKUPS[kind].effect;
    if (effect === 'life') dispatch({ slice: 'run', type: 'gainedLife' });
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
    if (atlasIsStale(atlas, wantView, wantResolution)) {
      atlas = bakeAtlas(colours, wantView, wantResolution);
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
      chrome.release();
      world.input.release();
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

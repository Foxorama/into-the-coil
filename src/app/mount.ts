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
import { makeDeaths } from '../sim/collide.ts';
import { makeRng } from '../sim/rng.ts';
import { atlasIsStale, bakeAtlas, viewFor } from '../render/bake.ts';
import { CanvasSurface, renderScale } from '../render/canvas.ts';
import { SPECIAL_BINDINGS } from '../content/actions.ts';
import { DEFAULT_ASSISTS, tuningFor } from '../sim/assist.ts';
import { ENEMIES, ENEMY_KINDS, type EnemyRow } from '../content/enemies.ts';
import { holdStation, SCROLL_PER_STEP } from '../sim/flight.ts';
import { SHIPS } from '../content/ships.ts';
import { makeIntent } from '../sim/intent.ts';
import { GameFrame, SHIP_START_ALONG, resetScene, respawn, type World } from './frame.ts';
import { SCREENS } from '../state/screens.ts';
import { type Action, type State, initialState, reduce } from '../state/root.ts';
import { makeChrome } from './chrome.ts';
import { combineDevices } from './devices.ts';
import { attachInput } from './input.ts';
import { attachPad } from './pad.ts';
import { attachTouch } from './touch.ts';
import { runLoop } from './loop.ts';

/**
 * The entity ceiling, per pool.
 *
 * ⚠️ **These are 0022's worst-case scene split up rather than a new budget** — it reads *~150 enemy
 * bullets, ~80 player projectiles, ~40 enemies, ~200 particles* and totals 500, which is the number
 * `tests/budget.test.ts` asserts the frame cost against. The particle share is now claimed by
 * `debris`, at exactly the 200 it was written for; the total is 471 and the ceiling has not moved.
 *
 * Splitting one pool into four is what makes the collision cost the product of two small pools
 * instead of the square of one big one — `src/sim/collide.ts` has the argument.
 */
const CAPACITY = { ship: 1, enemies: 40, playerShots: 80, enemyShots: 150, debris: 200 };

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
  const enemies = new Pool<Entity>(CAPACITY.enemies, makeEntity);
  const playerShots = new Pool<Entity>(CAPACITY.playerShots, makeEntity);
  const enemyShots = new Pool<Entity>(CAPACITY.enemyShots, makeEntity);
  const debris = new Pool<Entity>(CAPACITY.debris, makeEntity);

  /** Enemy rows by index, so a per-step lookup in the frame is an array index and not a string key. */
  const enemyRows: readonly EnemyRow[] = ENEMY_KINDS.map((k) => ENEMIES[k]);

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
    layers: [debris, enemies, enemyShots, playerShots, shipPool],
    shipPool,
    enemies,
    playerShots,
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
    spawnIn: 1,
    fireIn: shipRow.fireEvery,
    ship,
    shipRow,
    enemyRows,
    // The game as designed, per 0024 — every knob at its least-assisted position. There is no
    // settings screen yet to move them, and `tuningFor` is where they will arrive from when there is.
    tuning: tuningFor(DEFAULT_ASSISTS),
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
      attachTouch(canvas, { alongAxis: () => view.alongAxis, scale: () => view.scale }),
      attachPad({ alongAxis: () => view.alongAxis }),
    ]),
    intent: makeIntent(SPECIAL_BINDINGS),
    // The title screen does not step (`src/state/screens.ts`), so the game opens on a still field
    // and waits for the player rather than spending their first life for them.
    stepping: false,
    // Replaced below, once `dispatch` exists. A function property cannot be written before the
    // thing it calls, and the alternative — hoisting the whole reducer wiring above the world it
    // mutates — would put the shell's state machine in the middle of its entity pools.
    onDeath: (): void => {},
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

  /** Push the current screen at the two things that care: the chrome, and whether the sim steps. */
  const applyScreen = (): void => {
    const screen = state.screen.current;
    world.stepping = playable && SCREENS[screen].steps;
    chrome.show(playable ? screen : null);
  };

  const dispatch = (action: Action): void => {
    const next = reduce(state, action);
    if (next === state) return;
    const moved = next.screen !== state.screen;
    state = next;
    // Only on a real transition: `show` moves focus, and re-focusing a button on every dispatch
    // would fight a player who had tabbed away from it.
    if (moved) applyScreen();
  };

  /**
   * Start a run. The same answer for both controls, because both mean the same thing — 0039 says a
   * game over ends the run outright, so *Again* is a new run and not a continue.
   */
  const startRun = (): void => {
    resetScene(world);
    seedField();
    // A fresh spawn stream too, for the reason `seedField` gives: run two must be run one.
    world.rng = makeRng('proof-scene').stream('spawns');
    dispatch({ slice: 'run', type: 'begin' });
    dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
  };

  const chrome = makeChrome(colours, startRun);
  for (const element of chrome.elements) host.appendChild(element);

  /*
    ⚠️ **The frame reports a death; this decides what it cost.** `dispatch` may flip the screen to
    `gameOver` on its own — `src/state/root.ts` holds that as the one cross-slice agreement — so the
    check below reads the state AFTER the reducer has run rather than predicting what it will say.
  */
  world.onDeath = (): void => {
    dispatch({ slice: 'run', type: 'lifeLost' });
    if (state.run.lives > 0) respawn(world);
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

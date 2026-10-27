/**
 * The intro, drawn — `docs/decisions/0411-the-chase-begins-at-the-port.md`.
 *
 * ⚠️ **EVERY POSITION HERE IS A PURE FUNCTION OF ONE CLOCK, AND NOTHING ACCUMULATES** — the move
 * `src/app/attract.ts` makes for the music room, for the same reason: the picture can be asked for at
 * any moment without having travelled there, so a headless test can check it frame by frame and the
 * renderer interpolates for free by asking at `step + alpha`.
 *
 * ⚠️ **ON `tests/budget.test.ts`'s HOT LIST.** It runs every frame the intro is up, so it holds the
 * frame loop's rules: no allocation, blits only. Every loop below is an index over a constant table.
 *
 * Two shots. **The hangar** is held still, as a stage: the Viper, with Venoma already aboard, lifts and
 * goes, the alarm turns, the bar's door slides back, the pilot runs to their own ship and leaps in, and
 * it goes after her. **The dark outside** flies with the two ships, so the first level's sky runs past
 * and the chase holds still — the pilot's ship tilting over from the hangar's view into the fight's as
 * it clears the station (0444) — until she opens her throttle and leaves the frame, and it follows.
 */

import {
  ALARM_PERIOD,
  BEATS,
  BLUE_LAUNCH_ACCEL,
  CHASE,
  FADE,
  FLICKER_STEPS,
  HANGAR_SCALE,
  JINKS,
  JINK_STEPS,
  LAUNCH_ACCEL,
  LEAP_FROM,
  LIFT,
  OUTSIDE,
  OUTSIDE_ZOOM,
  PILOT_STANDS,
  PORT_EXTENT,
  PORT_KINDS,
  PORT_SPRITE,
  RUN_FRAME_STEPS,
  RUN_SPEED,
  STAGE,
  DOCK,
  STAND_SKY,
  SURGE_CURVE,
  SURGE_STEPS,
  TILT,
  type StandCamera,
  type StandKeep,
  TRACK_DELAY,
  TRAIL_EVERY,
  TRAIL_SAMPLES,
} from '../content/port.ts';
import { DOCK_PLACES, KEEPERS, KEEPER_KINDS, type KeeperKind } from '../content/keepers.ts';
import { SHIPS, SHIP_KINDS, UFO_BULBS, UFO_RING, lampFrame, lampTurn, type ShipRow } from '../content/ships.ts';
import { RIMS, wheelFrame, wheelTurn } from '../content/rims.ts';
import { SHIP_BOX, SPRITE, SPRITE_EXTENT } from '../content/sprites.ts';
import { STEPS_PER_SECOND } from '../state/screens.ts';
import { ACROSS_SPAN, type View } from '../sim/camera.ts';
import { SCROLL_PER_STEP } from '../sim/flight.ts';
import { makeRng } from '../sim/rng.ts';
import { paintSky, type Sky } from './scene.ts';
import { screenX, screenY, type Surface } from './surface.ts';

/** The pad's wheel pictures, in the order a rim shows its own — 0557. */
// @setup: three indices for the lifetime of the module.
const BLUE_WHEELS: readonly number[] = [PORT_SPRITE.blueWheel0, PORT_SPRITE.blueWheel1, PORT_SPRITE.blueWheel2];

/** The saucer's bulbs in the game's atlas, in the inks its ring runs through — 0586. */
// @setup: four indices for the lifetime of the module.
const UFO_BULB: readonly number[] = [SPRITE.ufoBulb0, SPRITE.ufoBulb1, SPRITE.ufoBulb2, SPRITE.ufoBulb3];

/** How far out the ring's bulbs run on the saucer's edge, in world units: its rim, in the box's radius. */
const UFO_RIM = UFO_RING * SHIP_BOX * 0.42;

/** The pad's shell pictures, one per shimmer frame — 0584. */
// @setup: three indices for the lifetime of the module.
const BLUE_SHELLS: readonly number[] = [PORT_SPRITE.blueShell0, PORT_SPRITE.blueShell1, PORT_SPRITE.blueShell2];

/**
 * How many shimmer frames the shell shows a bob on the pad — nine, so it ripples about every fifth of a second
 * and comes back to where it was each bob, as everything on the stand does (`BLUE_BOB_RATE`).
 */
const SHELL_SHIMMERS = 9;

/** How much bigger than its box a tile is blitted, so the seam between two can never show the space behind. */
const TILE_OVERLAP = 1.03;

/** How long a launch's flash takes to go out, in steps, and how big it is against its box. */
const FLASH_STEPS = 20;
const FLASH_GROW = 0.55;

/*
  `COCKPIT` stood here, the fighter's canopy three units ahead of its centre, until 0444 put where a
  pilot boards on each ship's row (`cockpit` in `src/content/ships.ts`) — the saucer is boarded at its
  dome, above its rim. Venoma's canopy beside it went with her run.
*/

/** How many pictures the pilot's ship tilts through outside, from the hangar's view to the fight's. */
const TILT_FRAMES = PORT_SPRITE.blue - PORT_SPRITE.blueSide + 1;

/**
 * ⚠️ **THE SKY GOES PAST AT THE FIRST LEVEL'S OWN RATE — 0416**, *"it should kinda lead straight into
 * level 1"*: outside, the camera behind it flies at the level's scroll, so every layer moves exactly as
 * it does in play, at its own depth. Read here and not in `src/content/port.ts`, because it is the
 * sim's number — and `tests/combat.test.ts` keeps it out of content, where a table naming it would be a
 * threat written relative to the ship.
 */
export const SKY_SPEED = SCROLL_PER_STEP;

/** And through the bay while the room is held still, a tenth of that: the same sky, moving. */
const HANGAR_DRIFT = SKY_SPEED / 10;

/**
 * Where the game's sprites start in the atlas the intro draws from — `withTheGame` in `port-bake.ts`:
 * the port's own kinds, then every one of the game's.
 */
const GAME_BASE = PORT_KINDS.length;

/**
 * Draw the intro at `t` steps since its first frame — a fractional step between two, so the motion is
 * interpolated like everything else the renderer draws. `sky` is the first level's (0416), whose
 * sprites are the game's, at `GAME_BASE` on in this atlas; empty in a style with no sky. `ship` is the
 * pilot's: its `wingtip` is where its contrails trail from (0441), and its `cockpit` where the pilot
 * drops in (0444), both in the fight's units.
 */
export function paintPort(surface: Surface, base: View, t: number, sky: Sky, ship: ShipRow): void {
  surface.clear();
  // 0679: the whole screen, the strip's band too, and the room pushed in on as it empties.
  introViewInto(base, t, INTRO_VIEW);
  const view = INTRO_VIEW;
  // Each ship at its own size in the shot, against the shared scale — 0450; its cockpit and its wingtips with it.
  const inside = ship.intro.hangar;
  const outside = ship.intro.outside;
  // 0612: a ship that shows its pilot shows them once they are aboard, and only then.
  const seated = ship.seat !== null;
  if (t < BEATS.cut) paintHangar(surface, view, t, sky, ship.cockpit.along * HANGAR_SCALE * inside, ship.cockpit.across * HANGAR_SCALE * inside, inside, seated);
  else paintOutside(surface, view, t - BEATS.outside, sky, ship.wingtip * HANGAR_SCALE * outside, outside, seated);
  // The fades: up out of the backdrop at the start, down and up again across the cut, and down at the end.
  let veil = 0;
  if (t < BEATS.fadeIn) veil = 1 - t / BEATS.fadeIn;
  else if (t >= BEATS.cut - FADE && t < BEATS.outside) veil = Math.min(1, (t - (BEATS.cut - FADE)) / FADE);
  else if (t >= BEATS.outside && t < BEATS.outside + FADE) veil = 1 - (t - BEATS.outside) / FADE;
  else if (t >= BEATS.fadeOut) veil = Math.min(1, (t - BEATS.fadeOut) / (BEATS.end - BEATS.fadeOut));
  if (veil > 0) veilOver(surface, view, veil);
}

/**
 * ── THE STAND — 0540 ──────────────────────────────────────────────────────────────────────────────
 *
 * The hangar's tabs, standing in the intro's room: the Viper gone and her pad empty, the beacons dark,
 * the bar's door shut, and the pilot's ship on its own pad, at idle on its beam and bobbing, wearing the
 * fit — the port's ship sprites are baked under it, as the intro's are. `t` is how long the stand has
 * been up, and drives only what idles: the bob, the flame, the sky past the bay. Nothing here has a
 * beat, because nothing here happens; the room is a place the pilot hangs out in.
 *
 * ⚠️ **ON THE HOT LIST WITH THE REST OF THIS FILE**: blits over constant tables, and nothing allocated.
 */
export function paintStand(
  surface: Surface,
  view: View,
  t: number,
  sky: Sky,
  ship: ShipRow,
  keeper: KeeperKind | null,
  hop = NO_HOP,
  spots: Readonly<Record<KeeperKind, number>> | null = null,
  shell = false,
  rail = true,
): void {
  surface.clear();
  /*
    ── THE DOCK — 0571 ─────────────────────────────────────────────────────────────────────────────
    *"a fun spaceship hangar set against a space backdrop, space for the tradie/merchant stalls to show, the
    spaceship to show the changes"*. Space first, with a planet in the bay; a back wall that ends at the bay
    under a truss that reaches out over it; a mezzanine along the wall with every keeper's shopfront on it in
    the tabs' order, the open tab's lit and the others dimmed; the deck, and the ship on its cradle under it.
  */
  paintSky(surface, view, t * HANGAR_DRIFT, sky, 0, 0, GAME_BASE);
  /*
    0572: the planet and its moon held back in the sky's haze, so they sit behind the room and not in it —
    and moving with the sky: *"they're very static, they don't feel like part of the background starfield"*.
    The planet drifts the way the stars do, slower, out of the haze past the bay's far side and on behind
    its edge, a loop of `PLANET_LOOP` steps; the moon goes round it in the ring's plane, behind it and in front.
  */
  // Half way through its pass when the stand is first drawn, so it is in the bay and not still in the haze.
  const loop = ((t + PLANET_LOOP / 2) % PLANET_LOOP) / PLANET_LOOP;
  const planetAlong = DOCK.planet.along + PLANET_REACH * (0.5 - loop);
  // Into the haze at the end of its pass as it came out of it at the start, so the loop is never seen to jump.
  const planetLit = PLANET_HAZE * Math.min(1, (loop * PLANET_LOOP) / PLANET_FADE, ((1 - loop) * PLANET_LOOP) / PLANET_FADE);
  const orbit = (t / MOON_ORBIT) * Math.PI * 2;
  const moonAlong = planetAlong + Math.cos(orbit) * DOCK.moon.reach;
  const moonAcross = DOCK.planet.across + Math.sin(orbit) * DOCK.moon.reach * 0.22 - Math.cos(orbit) * DOCK.moon.reach * 0.08;
  const behind = Math.sin(orbit) < 0;
  if (behind) put(surface, view, PORT_SPRITE.moon, moonAlong, moonAcross, planetLit * 0.8, 0, DOCK.moon.grow);
  // 0695: its air round it here too, so the bay's planet and the chase's are the one planet.
  put(surface, view, PORT_SPRITE.halo, planetAlong, DOCK.planet.across, planetLit * 0.7, 0, DOCK.planetGrow);
  put(surface, view, PORT_SPRITE.planet, planetAlong, DOCK.planet.across, planetLit, 0, DOCK.planetGrow);
  if (!behind) put(surface, view, PORT_SPRITE.moon, moonAlong, moonAcross, planetLit, 0, DOCK.moon.grow);
  // 0680: a far shuttle crossing the bay once a minute, and the station's own structure past it, nearer than the sky.
  paintShuttle(surface, view, DOCK.bay, (t + SHUTTLE.every - SHUTTLE.at) % SHUTTLE.every);
  put(surface, view, PORT_SPRITE.spar, planeAlong(view, DOCK.bay + SPAR.past, SPAR.depth), SPAR.across);
  // 0681: and on a wide screen's right, the dock's arm reaching out, further off than the spar.
  put(surface, view, PORT_SPRITE.dockArm, planeAlong(view, DOCK.bay + ARM.past, ARM.depth), ARM.across);
  const wall = PORT_EXTENT.wall;
  for (let along = wall / 2; along < DOCK.bay; along += wall) {
    // 0676: lit by the lamp over it, half lit beside one, dark between. 0677: and its vent, patch or conduit.
    for (let across = wall / 2; across < STAGE.deck + wall; across += wall) wallTile(surface, view, along, across, DOCK.lamps);
  }
  // 0681: one panel dented, and grime along the wall's foot.
  put(surface, view, PORT_SPRITE.wallDent, DENT.dock.along, DENT.dock.across);
  paintGrime(surface, view, DOCK.bay);
  // 0680: the steam off a vent, and a fan turning in the wall.
  if (DOCK_VENT.along > 0) paintSteam(surface, view, t, DOCK_VENT.along, DOCK_VENT.across);
  paintFan(surface, view, t, FAN.dock.along, FAN.dock.across);
  // 0681: the dock's neon over the mezzanine, a picture and not a word.
  put(surface, view, PORT_SPRITE.neonMark, NEON_MARK.along, NEON_MARK.across);
  // 0676: the shade under the truss, under the catwalk, and along the wall's foot.
  shadeAt(surface, view, DOCK.bay / 2, STAGE.ceiling, DOCK.bay, true);
  shadeAt(surface, view, (DOCK.catwalkFrom + DOCK.catwalkTo) / 2, DOCK.catwalk + CATWALK_UNDER, DOCK.catwalkTo - DOCK.catwalkFrom, true);
  shadeAt(surface, view, DOCK.bay / 2, STAGE.deck, DOCK.bay, false);
  const ceiling = PORT_EXTENT.ceiling;
  for (let along = ceiling / 2; along < DOCK.bay + ceiling; along += ceiling) put(surface, view, PORT_SPRITE.ceiling, along, STAGE.ceiling - ceiling / 2, 1, 0, TILE_OVERLAP);
  // 0677: the truss's braces between its spans.
  paintBraces(surface, view, DOCK.bay);
  // 0680: and a drone working along it once a minute.
  paintDrone(surface, view, DOCK.bay, (t + DRONE.every - DRONE.at) % DRONE.every);
  const lamp = PORT_EXTENT.lamp;
  // 0680: the first lamp with a fault in it, flickering.
  const flicker = flickerAt(t);
  for (let i = 0; i < DOCK.lamps.length; i++) put(surface, view, PORT_SPRITE.lamp, DOCK.lamps[i]!, STAGE.ceiling - 2 + lamp / 2, i === 0 ? flicker : 1);
  const deck = PORT_EXTENT.deck;
  for (let along = deck / 2; along < DOCK.bay + deck; along += deck) {
    for (let across = STAGE.deck + deck / 2; across < ACROSS_SPAN + deck / 2; across += deck) put(surface, view, PORT_SPRITE.deck, along, across, 1, 0, TILE_OVERLAP);
  }
  // 0677: the deck's front edge, and the grating set in it under the cradle.
  paintLip(surface, view, DOCK.bay);
  put(surface, view, PORT_SPRITE.grating, DOCK.ship, STAGE.deck + GRATING_DOWN);
  // 0676: each lamp's light on the deck under it, and the cradle's field round its foot.
  for (let i = 0; i < DOCK.lamps.length; i++) put(surface, view, PORT_SPRITE.lampPool, DOCK.lamps[i]!, STAGE.deck + POOL_DOWN, i === 0 ? flicker : 1);
  put(surface, view, PORT_SPRITE.padPool, DOCK.ship, STAGE.deck + POOL_DOWN);
  // The mezzanine's catwalk along the back wall, and each keeper's shopfront standing on it.
  const walk = PORT_EXTENT.catwalk;
  for (let along = DOCK.catwalkFrom + walk / 2; along < DOCK.catwalkTo; along += walk) put(surface, view, PORT_SPRITE.catwalk, along, DOCK.catwalk, 1, 0, TILE_OVERLAP);
  // 0572: the hover-lift at the catwalk's near end, its platform riding between the deck and the walk.
  put(surface, view, PORT_SPRITE.lift, DOCK.lift, STAGE.deck + 2.5 - PORT_EXTENT.lift / 2);
  put(surface, view, PORT_SPRITE.liftCar, DOCK.lift, liftAt(t));
  // 0611: and whoever is riding it, their soles on its platform.
  paintOnLift(surface, view, spots, liftAt(t));
  /*
    0569: every keeper wherever they are this visit — at their counter, at the ship, or out — and since 0571
    all three are in the room at once. The open tab's shop is lit; the others stand back in the dim.
  */
  // 0681: farthest first, so a nearer shop's frame stands over the one behind it.
  for (let k = 0; k < SHOP_ORDER.length; k++) {
    const kind = SHOP_ORDER[k]!;
    const row = KEEPERS[kind];
    const place = row.spots[spots === null ? 0 : spots[kind]] ?? row.spots[0];
    const shop = DOCK.shops[kind];
    // 0681: each shop at its own size and its own foot on the catwalk.
    const s = DOCK.shopGrow[kind];
    const front = DOCK.shopAcross[kind];
    put(surface, view, PORT_SPRITE.alcove, shop, front, 1, 0, s);
    // 0681: and its own shopfront over the alcove.
    put(surface, view, PORT_SPRITE[row.front], shop, front, 1, 0, s);
    // 0554: at the counter, where they stand is theirs — behind it, or on it, as Unity stands on their bench.
    const offset = place.at === 'counter' ? place.offset : AWAY_FROM_IT;
    const along = shop + offset.along * s;
    const across = front + offset.across * s;
    if (place.at === 'counter' && place.drawn === 'behind') put(surface, view, PORT_SPRITE[row.figure], along, across, 1, 0, s);
    put(surface, view, PORT_SPRITE[row.counter], shop, front, 1, 0, s);
    if (place.at === 'counter' && place.drawn === 'over') put(surface, view, PORT_SPRITE[row.figure], along, across, 1, 0, s);
    // 0680: and what their work throws off while they are at it — Unity's sparks — flaring on the bob's clock. 0681: off the row.
    if (row.works !== null && place.at === 'counter') {
      const n = Math.floor(t) % Math.round(BOB_STEPS);
      if (n < SPARKS_FOR && hash(n + 77) > 0.3) put(surface, view, PORT_SPRITE[row.works.kind], shop + row.works.along * s, front + row.works.across * s, 0.55 + 0.45 * hash(n + 31), 0, s);
    }
    // The shops of the other tabs are there, in the dim: a shutter of the night over them, not a fade to the wall.
    if (keeper !== null && kind !== keeper) put(surface, view, PORT_SPRITE.veil, shop, front - 0.5, SHOP_DIM, 0, PORT_EXTENT.alcove * s);
  }
  /*
    0628: the workshop wall between the lift and the cradle, in front of the catwalk's girder, that the cockpit
    monitor hangs from — and the tool benches at its foot, nearer the player than it.
  */
  const shop = DOCK.workshop;
  put(surface, view, PORT_SPRITE.workWall, shop.along, shop.foot - PORT_EXTENT.workWall / 2);
  put(surface, view, PORT_SPRITE.workBenches, shop.along, shop.benchFoot - PORT_EXTENT.workBenches / 2);
  // The pilot's ship on its cradle on the deck, under the shops.
  const pad = DOCK.ship;
  // 0611: whoever stands behind the ship, before the cradle, so the cradle and the ship stand in front of them.
  paintOnDeck(surface, view, spots, 'behind');
  put(surface, view, PORT_SPRITE.cradle, pad, STAGE.deck - 1.5);
  // Lit from the first frame and never going: its idle flame for as long as the stand is up. A size up
  // from the intro's (`DOCK.shipGrow`): it is the picture of every change, and baked as much sharper.
  const size = ship.intro.hangar * DOCK.shipGrow;
  // 0567: and up off it for a moment when something is fitted. 0572: bobbing deeper than the intro's.
  const across = DOCK.ride + blueBobAt(t) * (DOCK.bob / BLUE_BOB) - hopAt(t - hop);
  // 0572: the field's rings rising off the cradle up under the ship, each fading in and out on its way.
  const plate = STAGE.deck - 1.5;
  const under = across + HOVER_UNDER;
  for (let i = 0; i < HOVER_RINGS; i++) {
    const u = (t / HOVER_RISE + i / HOVER_RINGS) % 1;
    put(surface, view, PORT_SPRITE.hoverRing, pad, plate + (under - plate) * u, Math.sin(u * Math.PI) * 0.8, 0, 1 - u * 0.15);
  }
  /*
    0569 stood a keeper at the ship here, riding its bob — a bust over its roof from behind, or Unity on it.
    0611: *"kinda floating in mid air"*. They stand on the deck round it, before the cradle and after the ship.
  */
  // 0676: lit from the cradle's field under it, for as long as it stands on it.
  paintBlue(surface, view, t, pad, across, 0, Number.POSITIVE_INFINITY, size, 0, false, 1);
  /*
    A car on a rim that moves moves it on the pad, as it does in the fight (0527, `stepWheels`): the rim's
    picture over each tyre its row names, swelled to that tyre — the spinners rolling front and back at
    their own rates, the lightning striking a new crack each flash (0557). Its pictures are baked off the
    fitted rim into `BLUE_WHEELS` (`bakePortShip`).
  */
  const wheels = ship.wheels;
  const wheel = wheels === null ? null : RIMS[wheels.rim].wheel;
  if (wheels !== null && wheel !== null) {
    const unit = HANGAR_SCALE * size;
    const swell = (wheels.radius / (SPRITE_EXTENT.spinnerWheel * 0.42)) * size;
    const seconds = t / STEPS_PER_SECOND;
    for (let i = 0; i < wheels.at.length; i++) {
      const at = wheels.at[i]!;
      const sprite = BLUE_WHEELS[wheelFrame(wheel, i, seconds)]!;
      put(surface, view, sprite, pad + at.along * unit, across + at.across * unit, 1, wheelTurn(wheel, i, seconds), swell);
    }
  }
  /*
    0584: and the shell its shields wear, round it as three shields stand in the fight, while one is being
    chosen — on the pad it would otherwise sit over every other look. Its pictures are baked off the fitted
    shell, or the one tried on, into `BLUE_SHELLS` (`bakePortShip`), shimmering as the fight's do.
  */
  if (shell) put(surface, view, BLUE_SHELLS[Math.floor(((t % BOB_STEPS) / BOB_STEPS) * SHELL_SHIMMERS) % BLUE_SHELLS.length]!, pad, across, 1, 0, size);
  /*
    0586: and its lights, on the stand's clock — the fighter's strobes laid as the fight lays them, from the
    game's own pictures at the pad's size; the saucer's ring, which the pad sees edge-on, as its bulbs
    running along the rim's near edge, each brighter as it comes round to the front.
  */
  /*
    ⚠️ **ON THE BOB'S CLOCK, SO A BOB APART IS THE SAME PICTURE** — what the pad's guards read a fitting
    against (`tests/stand.ts`). Each light runs a whole number of its own cycles a bob, the nearest to its
    row's pace: the strobe's two thirds of a second three times, the ring's two-second turn once.
  */
  const bob = (t % BOB_STEPS) / BOB_STEPS;
  const unit = HANGAR_SCALE * size;
  for (let k = 0; k < ship.lamps.length; k++) {
    const lamp = ship.lamps[k]!;
    const cycle = lamp.turn ?? lamp.hold * lamp.frames.length;
    const lit = bob * Math.max(1, Math.round(BOB_STEPS / STEPS_PER_SECOND / cycle)) * cycle;
    const at = pad + lamp.at.along * unit;
    const down = across + lamp.at.across * unit;
    if (lamp.pad === 'laid') {
      put(surface, view, GAME_BASE + SPRITE[lamp.frames[lampFrame(lamp, lit)]!], at, down, 1, lampTurn(lamp, lit), unit);
      continue;
    }
    const turn = lampTurn(lamp, lit);
    const chase = lampFrame(lamp, lit);
    for (let b = 0; b < UFO_BULBS; b++) {
      const a = (b * Math.PI * 2) / UFO_BULBS + turn;
      const near = Math.sin(a);
      if (near <= 0) continue;
      put(surface, view, GAME_BASE + UFO_BULB[(b + chase) % UFO_BULB.length]!, at + Math.cos(a) * UFO_RIM * unit, down, 0.35 + 0.65 * near, 0, unit);
    }
  }
  /*
    0621: and the side-on tubes over the lights — *"sideview of the Lil Caddie has the spinning lights playing
    in front of missiles"*. The ring runs round the rim's near edge, and a missile on the rim is nearer still.
  */
  put(surface, view, PORT_SPRITE.blueTubes, pad, across, 1, 0, size);
  // 0611: and whoever stands on the deck nearer the player than the ship, after it.
  paintOnDeck(surface, view, spots, 'over');
  // The bay's edge at the dock's end of the room.
  put(surface, view, PORT_SPRITE.field, DOCK.bay + 1, (STAGE.ceiling + STAGE.deck) / 2, 0.8);
  put(surface, view, PORT_SPRITE.bayTop, DOCK.bay + 2, PORT_EXTENT.bayTop / 2 - 4);
  put(surface, view, PORT_SPRITE.bayBottom, DOCK.bay + 2, ACROSS_SPAN - PORT_EXTENT.bayBottom / 2 + 4);
  // 0677: and the bay door's warning lamp, turning.
  paintDoorLamp(surface, view, t, DOCK.bay);
  // 0680: and nearest of all, the rail along the dock's foot, at its own depth — where it clears the cockpit readout.
  if (!rail) return;
  const span = PORT_EXTENT.rail * RAIL.depth;
  for (let along = span / 2; along < DOCK.bay; along += span) put(surface, view, PORT_SPRITE.rail, planeAlong(view, along, RAIL.depth), RAIL.across, 1, 0, RAIL.depth);
}

/** 0680: the top of the rail along the dock's foot on the screen through `view`, in CSS pixels — what the readout must clear. */
export function railTop(view: View): number {
  return screenY(view, 0, RAIL.across - RAIL_RISE * RAIL.depth);
}

/**
 * Where on the screen the stand's two marks are, in CSS pixels — 0572, for the chrome to hang its words on
 * the picture: the ship's foot (the cockpit monitor stands centred under it), and the head of `keeper`
 * wherever they are this visit (their speech bubble points at it) — or, when they are out, the top of
 * their shopfront. Written into `out`, by the same arithmetic `paintStand` places them with.
 */
export function standMarksInto(
  view: View,
  keeper: KeeperKind | null,
  spots: Readonly<Record<KeeperKind, number>> | null,
  out: {
    shipX: number;
    shipY: number;
    keeperX: number;
    keeperY: number;
    shops: Record<KeeperKind, { left: number; top: number; right: number; bottom: number }>;
    hang: { left: number; top: number; width: number };
  },
  /**
   * 0687: the pixels a world unit is for the monitor's WIDTH — the hangar tab's, on every tab — or the view's own
   * when `null`. A tab's camera closer than the hangar's (0678) made the monitor a size bigger and re-wrapped its
   * readout; played as *"completely changes the cockpit sizing display"*. It still hangs centred on the wall.
   */
  hangScale: number | null = null,
): void {
  out.shipX = screenX(view, DOCK.ship, STAGE.deck);
  out.shipY = screenY(view, DOCK.ship, STAGE.deck + 1);
  // 0628: where the cockpit monitor hangs on the workshop wall — the line under its hangers, a unit in from its posts.
  const wall = DOCK.workshop;
  const hangWide = (wall.half - HANG_INSET) * 2 * (hangScale ?? view.scale);
  out.hang.left = screenX(view, wall.along, wall.hang) - hangWide / 2;
  out.hang.width = hangWide;
  out.hang.top = screenY(view, wall.along, wall.hang);
  // 0572: and each shopfront's box, its alcove's — what a click or a tap on the shop lands on.
  // 0681: each at its own size and across.
  for (let k = 0; k < KEEPER_KINDS.length; k++) {
    const kind = KEEPER_KINDS[k]!;
    const front = out.shops[kind];
    const shop = DOCK.shops[kind];
    const half = (PORT_EXTENT.alcove * DOCK.shopGrow[kind]) / 2;
    const across = DOCK.shopAcross[kind];
    front.left = screenX(view, shop - half, across);
    front.right = screenX(view, shop + half, across);
    front.top = screenY(view, shop, across - half);
    front.bottom = screenY(view, shop, across + half);
  }
  if (keeper === null) {
    out.keeperX = Number.NaN;
    out.keeperY = Number.NaN;
    return;
  }
  const row = KEEPERS[keeper];
  const place = row.spots[spots === null ? 0 : spots[keeper]] ?? row.spots[0];
  const shop = DOCK.shops[keeper];
  const s = DOCK.shopGrow[keeper];
  let along = shop;
  let across = DOCK.shopAcross[keeper] - (PORT_EXTENT.alcove * s) / 2;
  if (place.at === 'counter') {
    along = shop + place.offset.along * s;
    across = DOCK.shopAcross[keeper] + (place.offset.across - KEEPER_HEAD) * s;
  } else if (place.at !== 'away') {
    // 0611: over their head where they stand — on the lift, half way up its ride, which it is always passing.
    const where = DOCK_PLACES[place.at];
    along = (where.floor === 'lift' ? DOCK.lift : DOCK.ship) + where.along;
    across = (where.floor === 'lift' ? (STAGE.deck + DOCK.catwalk) / 2 : STAGE.deck + where.across) - row.about.tall;
  }
  out.keeperX = screenX(view, along, across);
  out.keeperY = screenY(view, along, across);
}
/** How far over a keeper's centre the top of their head is, in the units they are baked in. */
const KEEPER_HEAD = 6;

/**
 * How far in from the outside of the workshop wall's posts the cockpit monitor's frame stands, either side, in
 * world units — 0628: over the posts' inner halves, so it hangs in front of the wall and not past it.
 */
const HANG_INSET = 1;

/** How lit a shop is while another tab is open — 0571: there, and plainly not the one being spoken to. */
const SHOP_DIM = 0.5;

/** Where a keeper not at their counter is from it — nowhere; read only to place a figure that is not drawn. */
// @setup: one constant offset for the lifetime of the module.
const AWAY_FROM_IT = { along: 0, across: 0 } as const;

/**
 * The keepers whose place this visit is on the deck, drawn `drawn` the ship — 0611: whole, their soles on
 * the deck at the place's own spot round the ship's cradle.
 */
function paintOnDeck(surface: Surface, view: View, spots: Readonly<Record<KeeperKind, number>> | null, drawn: 'behind' | 'over'): void {
  for (let k = 0; k < KEEPER_KINDS.length; k++) {
    const kind = KEEPER_KINDS[k]!;
    const row = KEEPERS[kind];
    const place = row.spots[spots === null ? 0 : spots[kind]] ?? row.spots[0];
    if (place.at === 'counter' || place.at === 'away') continue;
    const where = DOCK_PLACES[place.at];
    if (where.floor !== 'deck' || where.drawn !== drawn) continue;
    put(surface, view, PORT_SPRITE[row.about.figure], DOCK.ship + where.along, STAGE.deck + where.across - row.about.feet);
  }
}

/** The keeper whose place this visit is the lift, riding it — 0611: their soles on its platform's top, `floor`. */
function paintOnLift(surface: Surface, view: View, spots: Readonly<Record<KeeperKind, number>> | null, floor: number): void {
  for (let k = 0; k < KEEPER_KINDS.length; k++) {
    const kind = KEEPER_KINDS[k]!;
    const row = KEEPERS[kind];
    const place = row.spots[spots === null ? 0 : spots[kind]] ?? row.spots[0];
    if (place.at === 'counter' || place.at === 'away') continue;
    const where = DOCK_PLACES[place.at];
    if (where.floor !== 'lift') continue;
    put(surface, view, PORT_SPRITE[row.about.figure], DOCK.lift + where.along, floor - row.about.feet);
  }
}

/**
 * The view the stand is seen through — 0540: the screen's own `base`, closer by the camera's `zoom`, with
 * the camera's point of the room at its share of the screen (`x`, `y` of `width` × `height`), and held
 * inside the room, so no edge of it shows the void the room is painted on. Written into `out`, so a
 * resize or a change of tab costs no allocation; and in a portrait view, which is never played, the
 * base itself.
 */
export function standViewInto(base: View, camera: StandCamera, width: number, height: number, out: View, below = 0): void {
  // 0568: the sky is painted out past the bay as far as the stand may look, so the open bay shows stars and never the void.
  out.alongSpan = Math.max(base.alongSpan, STAGE.bay + STAND_SKY);
  out.acrossSpan = base.acrossSpan;
  out.alongAxis = base.alongAxis;
  // No bar: it is the play readout's (0500), and on the stand the readout is down in the dash (0539).
  out.barAcross = 0;
  if (base.alongAxis !== 'x' || base.scale <= 0) {
    out.scale = base.scale;
    out.gutterAlong = base.gutterAlong;
    out.gutterAcross = base.gutterAcross;
    return;
  }
  const scale = base.scale * camera.zoom;
  out.scale = scale;
  // The room's left wall no further in than the screen's left edge, and the sky past the bay, which is
  // painted across the view's own span, no further in than the right; the truss above the top and the
  // deck below the bottom.
  const along = camera.x * width - camera.along * scale;
  out.gutterAlong = Math.min(0, Math.max(width - out.alongSpan * scale, along));
  const across = camera.y * height - camera.across * scale;
  // 0566: `below` is how much of the screen's foot is under the plate, where the deck may end short of the edge.
  out.gutterAcross = Math.min(0, Math.max(height - below - ACROSS_SPAN * scale, across));
}

/**
 * ── DEPTH AND LIFE — 0680 ─────────────────────────────────────────────────────────────────────────────
 *
 * Each a function of the clock, and on the stand each either a whole number of its own cycles a bob
 * (`BOB_STEPS`), or drawn where the stand's guards never read (`tests/stand.ts`: from behind the ship to short of
 * the bay, from a third of the way down the stand): what the guards read a bob apart is then the same picture.
 *
 * - The spar past the bay and the rail across the dock's foot are planes at their own depth: `depth` of the
 *   camera's travel, so the dolly (0678) slides the far one less than the room and the near one more. Nought
 *   travel is the camera's left edge at `PLANE_REST`.
 * - The shuttle crosses the bay once a minute, past the bay; the drone works along the truss once a minute,
 *   over the guards' band.
 * - The flicker is the room's first lamp, left of the band; its pattern repeats every bob.
 * - The steam is a vent's on the wall, puffing once in three bobs; the sparks are at Unity's bench, left of the
 *   band, flaring on the bob's clock; the fan turns three frames in fifteen steps, seven times a bob.
 */
const SPAR = { past: 50, across: 62, depth: 0.5 } as const;
const RAIL = { across: ACROSS_SPAN - 4, depth: 1.1 } as const;
// How far above its box's middle the rail's top stands, in its own units (`rail` in port-bake.ts: its posts from -2.6).
const RAIL_RISE = 2.6;
const PLANE_REST = 60;
const SHUTTLE = { every: 60 * 60, takes: 60 * 6, from: 4, to: 150, across: 40, at: 60 * 10 } as const;
const DRONE = { every: 60 * 60, takes: 60 * 6, across: STAGE.ceiling + 7, at: 60 * 25 } as const;
// The intro's shuttle and drone, once each in the held shot — from 4.5 s and from 5 s.
const INTRO_SHUTTLE_AT = 270;
const INTRO_DRONE_AT = 300;
const FAN_STEP = 5;
// A puff once in three bobs, rising for most of one.
const STEAM_BOBS = 3;
const STEAM_RISE = 90;
/*
  Up on the wall and clear of the steaming vent. In the dock, 0681 moved it from over the mezzanine, where its neon now
  hangs, to the wall under the catwalk by the bay — in the stand's guarded band, where its frames turn seven times a bob.
  In the intro, over her pad's left.
*/
const FAN = { dock: { along: 155, across: 70 }, intro: { along: 150, across: 30 } } as const;
/**
 * 0681: the dock's neon, over the mezzanine between Unity's shop and MMXXVI's; the dented panel in each room; the
 * arm reaching out past the bay, beyond the spar and further off than it.
 */
const NEON_MARK = { along: 100.5, across: 24 } as const;
const DENT = { dock: { along: 110, across: 70 }, intro: { along: 70, across: 50 } } as const;
const ARM = { past: 135, across: 80, depth: 0.35 } as const;
// The wall's two upper rows, where a vent may steam.
const VENT_ABOVE = 40;
/** Where the neon sign's plate stands, from the bar's centre — `paintBar`'s units, and `neonDark`'s box. */
const NEON_AT = { along: 1.5, across: -5.5 } as const;
/** The step of every sixty the neon buzzes dark on. */
const NEON_BUZZ = 37;
/** The bar's string of lights — `paintBar`'s fifteen bulbs, four units apart from 28 left of its centre — and how long a bulb's flare lasts. */
const BAR_BULBS = 15;
const TWINKLE_STEPS = 8;
/** For how many steps of a bob a keeper's work throws off what it throws off (`KeeperRow.works`). */
const SPARKS_FOR = 45;
/** 0681: the shops in the order they are drawn — the farthest, the smallest (`DOCK.shopGrow`), first. */
// @setup: sorted once at module load.
const SHOP_ORDER: readonly KeeperKind[] = [...KEEPER_KINDS].sort((a, b) => DOCK.shopGrow[a] - DOCK.shopGrow[b]);

/** A number from nought to under one for the integer `n`, the same every time — a frame's flicker, with no allocation. */
function hash(n: number): number {
  return (Math.imul(n ^ 0x5bd1e995, 0x27d4eb2d) >>> 0) / 4294967296;
}

/** How lit the room's first lamp is at step `t` — a fault in it, on a pattern that repeats every bob. */
function flickerAt(t: number): number {
  const n = Math.floor(t) % Math.round(BOB_STEPS);
  return hash(n) < 0.08 ? 0.45 + 0.3 * hash(n + 999) : 1;
}

/** The plane at `depth` slid by the camera's travel: its along at `along` when the camera's left edge is at `PLANE_REST`. */
function planeAlong(view: View, along: number, depth: number): number {
  const left = view.scale > 0 ? -view.gutterAlong / view.scale : 0;
  return along + (left - PLANE_REST) * (1 - depth);
}

/** A far shuttle crossing past the bay from `bay`, `since` steps into its crossing, if it is crossing. */
function paintShuttle(surface: Surface, view: View, bay: number, since: number): void {
  if (since < 0 || since >= SHUTTLE.takes) return;
  const u = since / SHUTTLE.takes;
  const fade = Math.min(1, u * 6, (1 - u) * 6);
  put(surface, view, PORT_SPRITE.shuttle, bay + SHUTTLE.from + (SHUTTLE.to - SHUTTLE.from) * u, SHUTTLE.across, 0.75 * fade);
}

/** A drone working along the truss from the room's left to `end`, `since` steps into its pass, if it is passing. */
function paintDrone(surface: Surface, view: View, end: number, since: number): void {
  if (since < 0 || since >= DRONE.takes) return;
  const u = since / DRONE.takes;
  put(surface, view, PORT_SPRITE.drone, -6 + (end + 12) * u, DRONE.across + Math.sin(since * 0.21) * 0.6);
}

/** 0681: grime along the wall's foot to `end`, a tile of it at a time, rising off the deck. */
function paintGrime(surface: Surface, view: View, end: number): void {
  const tile = PORT_EXTENT.grime;
  // Edge to edge and not overlapped as the wall's tiles are: a band laid twice over a seam would darken it.
  for (let along = tile / 2; along < end; along += tile) put(surface, view, PORT_SPRITE.grime, along, STAGE.deck - tile / 2);
}

/** A wall fan at `along`, `across`, three frames in `FAN_STEP`s each. */
function paintFan(surface: Surface, view: View, t: number, along: number, across: number): void {
  put(surface, view, PORT_SPRITE.fan0 + (Math.floor(t / FAN_STEP) % 3), along, across);
}

/** Steam off the vent at `along`, `across`: a puff rising and thinning, once in `STEAM_BOBS` bobs. */
function paintSteam(surface: Surface, view: View, t: number, along: number, across: number): void {
  const since = Math.floor(t) % (Math.round(BOB_STEPS) * STEAM_BOBS);
  if (since >= STEAM_RISE) return;
  const u = since / STEAM_RISE;
  put(surface, view, PORT_SPRITE.steam, along + u * 2, across - 2 - u * 9, 0.85 * Math.sin(u * Math.PI), 0, 0.6 + u * 0.9);
}

/**
 * 0679: how much closer the intro's camera is on the room by the cut than at the fade-in — *"the intro camera
 * pushes in slowly"*, the player's answer. About the room's middle, so the bay and the bar stay in.
 */
export const INTRO_PUSH = 1.08;

// @setup: 0679's view the intro is drawn through, written in place every frame by `introViewInto`.
const INTRO_VIEW: View = { alongSpan: 0, acrossSpan: 0, alongAxis: 'x', scale: 0, gutterAlong: 0, gutterAcross: 0, barAcross: 0 };

/**
 * The view the intro is seen through at `t` — 0679, written into `out`. The screen's own `base` with no bar: the
 * strip at the top of a desktop is the play readout's (0500), and while the intro is up it was an empty black band
 * over the room. So the lane is grown to fill the whole height, and from the fade-in to the cut it is pushed in on by
 * `INTRO_PUSH` about the room's middle; the dark outside is the filled view, held. Held inside the lane either way,
 * so no edge shows past what is painted. A portrait view, which is never played, is the base.
 */
export function introViewInto(base: View, t: number, out: View): void {
  out.alongSpan = base.alongSpan;
  out.acrossSpan = base.acrossSpan;
  out.alongAxis = base.alongAxis;
  out.barAcross = 0;
  if (base.alongAxis !== 'x' || base.scale <= 0) {
    out.scale = base.scale;
    out.gutterAlong = base.gutterAlong;
    out.gutterAcross = base.gutterAcross;
    out.barAcross = base.barAcross;
    return;
  }
  const width = 2 * base.gutterAlong + base.alongSpan * base.scale;
  const height = base.barAcross + 2 * base.gutterAcross + ACROSS_SPAN * base.scale;
  const inside = t < BEATS.cut;
  const push = inside ? 1 + (INTRO_PUSH - 1) * ease(t, BEATS.fadeIn, BEATS.cut) : 1;
  const scale = Math.max(base.scale, height / ACROSS_SPAN) * push;
  out.scale = scale;
  // The point pushed in on: the room's middle inside, the screen's outside — where it stood in the base.
  const along = inside ? STAGE.bay / 2 : base.alongSpan / 2;
  const across = inside ? (STAGE.ceiling + STAGE.deck) / 2 : ACROSS_SPAN / 2;
  const x = base.gutterAlong + along * base.scale;
  const y = height / 2;
  out.gutterAlong = Math.min(0, Math.max(width - base.alongSpan * scale, x - along * scale));
  out.gutterAcross = Math.min(0, Math.max(height - ACROSS_SPAN * scale, y - across * scale));
}

/** 0679: the pixels per world unit the intro is drawn at when pushed in furthest, which its atlas is baked for. */
export function introSharpness(base: View): number {
  if (base.alongAxis !== 'x' || base.scale <= 0) return base.scale;
  const height = base.barAcross + 2 * base.gutterAcross + ACROSS_SPAN * base.scale;
  return Math.max(base.scale, height / ACROSS_SPAN) * INTRO_PUSH;
}

/**
 * The stand's camera fitted to the column the plate leaves it — 0563, written into `out`.
 *
 * The row's camera says where it stands and how close it would like to be. Fitted, the pad stands at
 * the row's `x` of the column (0678; it was `STAND_PAD_AT` for every tab), and the camera is drawn back from the row's zoom wherever it would put the
 * ship's box past a share of the column (gone in 0571), or the keeper, their counter or the viewport in the
 * back wall more than a quarter of their width off the screen's left — the keeper and the stars are each
 * the player's own ask (0550), and a camera close enough to lose them is too close.
 */
export function fitStand(
  camera: StandCamera,
  base: View,
  width: number,
  box: { left: number; width: number; top?: number; height?: number },
  keeper: KeeperKind | null,
  out: StandCamera,
  screenHeight = 0,
): void {
  out.along = camera.along;
  out.across = camera.across;
  // 0566: the camera's share down the column, where the column is not the whole height — portrait's.
  out.y = box.top !== undefined && box.height !== undefined && screenHeight > 0 ? (box.top + box.height * camera.y) / screenHeight : camera.y;
  // 0678: the row's own share of the column, where every tab's was `STAND_PAD_AT`.
  out.x = (box.left + box.width * camera.x) / width;
  out.zoom = camera.zoom;
  out.keep = camera.keep;
  if (base.scale <= 0 || box.width <= 0) return;
  // The furthest left the camera must keep on the screen, in the room's units: the viewport's pane, and the keeper's two pieces less a quarter of each.
  /*
    0568: not the back wall's viewport any more — it was kept for its stars (0550), and the open bay shows
    them now, past the ship. Holding it in view held the camera back a third.
  */
  /*
    0571: and the mezzanine's first shopfront, whole — every keeper's shop is in the room on every tab, the
    first of them furthest from the ship. `keeper` is the tab's; the camera keeps them all, so it is unread.
    0678: the `room` camera does; a closer one keeps the workshop wall.
  */
  void keeper;
  // 0572: and the lift up to them, whole — it is the way to the shops, and a way up cut off goes nowhere.
  // 0678: that is the `room` camera's; a camera closer in keeps what its own tab stands on (`STAND_KEEPS`).
  const keep = keptFrom(camera);
  // Half a unit to spare, so what is kept is on the screen and not on its edge by a rounding.
  const reach = camera.along - keep + 0.5;
  /*
    0571: 0563's cap on the ship's share of the column is gone. In the dock the camera is held to the room's
    whole height (`fills`, below), and with that floor the cap never once decided the zoom: its probe stayed
    green on CI (0019). The ship's size is the dock's own, `DOCK.shipGrow`.
  */
  // 0568: kept in the column, not the screen — the plate stands on its left, over the room.
  const keepsLeft = reach > 0 ? (out.x * width - box.left) / (reach * base.scale) : Number.POSITIVE_INFINITY;
  /*
    0568: the bay open on the right with the stars past it — *"I want to see the end of the hangar and the
    open starfield on the right hand side"* — is the camera's place, on the pad by the bay, and its row's
    zoom, the room's whole height: no rule here, since with those none was ever the one that held.
  */
  // Never so far back that the room stops short of the column's foot — or the screen's, where the column
  // ends only a panel's padding above it: the deck stands on its floor.
  const foot = (box.top ?? 0) + (box.height ?? 0);
  const fills = (screenHeight > 0 && screenHeight - foot < screenHeight * 0.05 ? screenHeight : foot) / (ACROSS_SPAN * base.scale);
  /*
    0678: and what is kept and the ship's nose in the column together. The nose is held in below by sliding the room
    left, which slid what is kept off the column's left wherever the two were wider than it: no camera that kept the
    whole dock was ever close enough for that, and a camera close on the cradle is.
  */
  const spans = box.width / ((DOCK.ship + SHIP_REACH - keep + 0.5) * base.scale);
  out.zoom = Math.max(fills, Math.min(camera.zoom, keepsLeft, spans));
  /*
    0628: and the ship's hull whole in the column on the right, as the lift is kept on the left. The ship stands in
    the middle of the open deck past the workshop wall, and a phone's column — a third of the screen — is narrower
    than a desktop's: at 480x320 its nose ran past the column's edge. The room is slid left until it is in; on a
    desktop's column it already is, and this asks nothing.
  */
  /*
    0678: and slid right to keep the workshop wall, where the room's height held the camera closer than the keep
    would — a 4:3's. A camera on the cradle or Cosmo's stands its point well right of the wall, and at 1024x768 the
    wall and the monitor on it went under the plate. The nose's slide below is the later, so the hull wins where
    both cannot be in. Not the `room` camera's lift: slid for it, the hangar's bay left a 4:3's column (0568).
  */
  if (reach > 0 && slidesFor(camera.keep)) out.x = Math.max(out.x, (box.left + reach * base.scale * out.zoom) / width);
  const nose = (DOCK.ship + SHIP_REACH - out.along) * base.scale * out.zoom;
  out.x = Math.min(out.x, (box.left + box.width - nose) / width);
}

/**
 * 0678: the furthest left, along, a stand's camera keeps on its column — by what the row says it keeps. `room`
 * is 0571's and 0572's: the lift and every keeper's shopfront. `workshop` is the wall the cockpit monitor hangs
 * from, to the outside of its posts (0628), which every tab shows.
 */
function keptFrom(camera: StandCamera): number {
  switch (camera.keep) {
    case 'room': {
      let keep: number = DOCK.lift - LIFT_HALF;
      for (let k = 0; k < KEEPER_KINDS.length; k++) keep = Math.min(keep, DOCK.shops[KEEPER_KINDS[k]!] - PORT_EXTENT.alcove / 2);
      return keep;
    }
    case 'workshop':
      return DOCK.workshop.along - DOCK.workshop.half;
    default: {
      const never: never = camera.keep;
      return never;
    }
  }
}

/** 0678: whether the room is slid right to keep what a camera keeps, where the room's height holds it too close. */
function slidesFor(keep: StandKeep): boolean {
  switch (keep) {
    // 0568's bay is kept before the lift on a 4:3, as it was before there was a second kind.
    case 'room':
      return false;
    // The cockpit monitor hangs on it, and a monitor under the plate is a readout the player cannot read.
    case 'workshop':
      return true;
    default: {
      const never: never = keep;
      return never;
    }
  }
}

/**
 * How far ahead of its centre the widest ship's hull reaches on the pad, in world units — 0628: its hull's radius,
 * 0.42 of its box, at the pad's size (`intro.hangar` grown by `DOCK.shipGrow`).
 */
// @setup: read once off the ship table when the module loads, never in a frame.
const SHIP_REACH = Math.max(...SHIP_KINDS.map((kind) => PORT_EXTENT.blueSide * 0.42 * SHIPS[kind].intro.hangar * DOCK.shipGrow));

/**
 * Cover the whole canvas in the palette's space at `alpha` — one blit of a one-unit square, scaled past
 * every edge. The backdrop the screens either side of the intro are drawn on, so a fade to it is a fade
 * into the next screen (0416).
 */
function veilOver(surface: Surface, view: View, alpha: number): void {
  const px = view.alongSpan * view.scale + ACROSS_SPAN * view.scale + (view.gutterAlong + view.gutterAcross) * 2;
  surface.blit(PORT_SPRITE.veil, screenX(view, view.alongSpan / 2, ACROSS_SPAN / 2), screenY(view, view.alongSpan / 2, ACROSS_SPAN / 2), px, 0, alpha);
}

/** One blit at a world position, at the view's own scale. */
function put(surface: Surface, view: View, sprite: number, along: number, across: number, alpha = 1, turn = 0, grow = 1): void {
  surface.blit(sprite, screenX(view, along, across), screenY(view, along, across), view.scale * grow, turn, alpha);
}

/*
  ── THE LIGHT CAST — 0676 ────────────────────────────────────────────────────────────────────────
*/

/** The wall's tile by how lit it is — `tileLit`'s nought, one and two. */
// @setup: a table of three indices, built once at module load.
const WALL_TILE = [PORT_SPRITE.wall, PORT_SPRITE.wallHalf, PORT_SPRITE.wallLit] as const;
/** How far onto the deck, from its top edge, a pool of light lies. */
const POOL_DOWN = 2;
/**
 * Where the bar's light climbs the wall, from the bar's centre — past its right-hand end, where the wall is open —
 * and how much of it shows through the bar's window before the door opens.
 */
const SPILL_WALL = { along: 38, across: 4, shut: 0.45 } as const;
/** How far under the catwalk's walking surface its underside is, where the shade under it begins. */
const CATWALK_UNDER = 4;
/** How near a lamp, along, a tile stands in its light, and beside it; and how high on the wall is near the truss. */
const LAMP_UNDER = 14;
const LAMP_BESIDE = 30;
const LAMP_HIGH = 50;

/**
 * How lit the wall tile centred at `along`, `across` is by `lamps`: whole under a lamp and high on the wall, half
 * under one but low or beside one but high, and not at all between them. A pure function of where the tile is,
 * so the frame pays for an index and nothing else.
 */
export function tileLit(along: number, across: number, lamps: readonly number[]): 0 | 1 | 2 {
  let near = Number.POSITIVE_INFINITY;
  for (let i = 0; i < lamps.length; i++) {
    const d = Math.abs(along - lamps[i]!);
    if (d < near) near = d;
  }
  const high = across < LAMP_HIGH;
  if (near < LAMP_UNDER) return high ? 2 : 1;
  return near < LAMP_BESIDE && high ? 1 : 0;
}

/*
  ── BIG FORMS — 0677 ────────────────────────────────────────────────────────────────────────────
*/

/** The wall's overlays — a vent, a patch, a conduit — laid over whichever lit tile a place has. */
// @setup: a table of three indices, built once at module load.
const OVERLAY = [PORT_SPRITE.wallVent, PORT_SPRITE.wallPatch, PORT_SPRITE.wallConduit] as const;
/** How many columns and rows of the wall's grid the overlay picks are drawn for; the room repeats past them. */
const OVERLAY_COLUMNS = 10;
const OVERLAY_ROWS = 6;
/** The share of tiles that carry an overlay. */
const OVERLAY_SHARE = 0.4;
/**
 * Each tile's overlay, or -1 — drawn once from the port's own stream for its tiles (0021), so the room is the
 * same room every visit and a pick costs the frame an index.
 */
// @setup: one pick a tile, drawn from the seeded stream once at module load.
const WALL_OVERLAY: readonly number[] = (() => {
  const rng = makeRng('port').stream('tiles');
  const picks: number[] = [];
  // @setup: sixty picks pushed once, at module load, never in a frame.
  for (let i = 0; i < OVERLAY_COLUMNS * OVERLAY_ROWS; i++) picks.push(rng.float() < OVERLAY_SHARE ? OVERLAY[Math.floor(rng.float() * OVERLAY.length)]! : -1);
  return picks;
})();

/** The overlay on the wall tile centred at `along`, `across`, or -1 for none. */
export function overlayAt(along: number, across: number): number {
  const column = Math.floor(along / PORT_EXTENT.wall) % OVERLAY_COLUMNS;
  const row = Math.floor(across / PORT_EXTENT.wall) % OVERLAY_ROWS;
  return WALL_OVERLAY[column * OVERLAY_ROWS + row] ?? -1;
}

/**
 * 0680: the first vent on a wall from `after` to `before` and over `above`, in its tile's middle — the one the steam
 * comes off. Read off the wall's overlays (`overlayAt`), so the steam is always at a vent; an along of nought is none.
 */
function ventOn(after: number, before: number, above: number): { along: number; across: number } {
  const wall = PORT_EXTENT.wall;
  for (let along = wall / 2; along < before; along += wall) {
    for (let across = wall / 2; across < above; across += wall) {
      // @setup: run twice at module load, for the dock and the intro's room.
      // Below the truss: a vent behind it is not seen.
      if (along > after && across > STAGE.ceiling && overlayAt(along, across) === PORT_SPRITE.wallVent) return { along, across };
    }
  }
  // @setup: as above.
  return { along: 0, across: 0 };
}
/*
  The vents the steam comes off: in the wall's upper two rows, over the stand's guarded band (`tests/stand.ts`) and
  clear of the plate on a desktop — past the lift in the dock, past the bar in the intro's room.
*/
// @setup: the dock's vent, and the intro's.
const DOCK_VENT = ventOn(DOCK.lift, DOCK.bay, VENT_ABOVE);
// @setup: as above.
const INTRO_VENT = ventOn(STAGE.bar.along + 30, STAGE.bay, VENT_ABOVE);

/** A wall tile and its overlay, if it has one. */
function wallTile(surface: Surface, view: View, along: number, across: number, lamps: readonly number[]): void {
  put(surface, view, WALL_TILE[tileLit(along, across, lamps)], along, across, 1, 0, TILE_OVERLAP);
  const overlay = overlayAt(along, across);
  if (overlay >= 0) put(surface, view, overlay, along, across, 1, 0, TILE_OVERLAP);
}

/** The truss's braces, at every other seam of its tiles to `end`. */
function paintBraces(surface: Surface, view: View, end: number): void {
  const ceiling = PORT_EXTENT.ceiling;
  for (let along = 2 * ceiling; along < end; along += 2 * ceiling) put(surface, view, PORT_SPRITE.trussBrace, along, STAGE.ceiling - ceiling / 2);
}

/** The deck's front edge, across the whole of it to `end`. */
function paintLip(surface: Surface, view: View, end: number): void {
  const lip = PORT_EXTENT.deckLip;
  for (let along = lip / 2; along < end; along += lip) put(surface, view, PORT_SPRITE.deckLip, along, ACROSS_SPAN - LIP_UP, 1, 0, TILE_OVERLAP);
}

/** The bay door's warning lamp on its frame, turning on the alarm's period — bright once a turn. */
function paintDoorLamp(surface: Surface, view: View, t: number, bay: number): void {
  const turn = (t / ALARM_PERIOD) * Math.PI * 2;
  const sweep = Math.max(0, Math.cos(turn));
  put(surface, view, PORT_SPRITE.doorLamp, bay - 1, DOOR_LAMP_ACROSS, 0.3 + 0.7 * sweep * sweep);
}
/** How far up from the screen's foot the deck's lip lies, and where across the bay's frame its lamp is. */
const LIP_UP = 2.5;
const DOOR_LAMP_ACROSS = 22;
/** How far onto the deck a pad's grating lies, under the pad's own strip. */
const GRATING_DOWN = 3;
/** How far onto the deck its marks lie; how far back from the crates the oil is. */
const TYRES_DOWN = 5;
const OIL_BACK = 16;
/** The Viper's scorch: how long after her burn it starts to show, and how long it takes to come up. */
const SCORCH_FROM = 30;
const SCORCH_IN = 60;
/** How bright a beam's reflection in the deck is, against the beam. */
const REFLECTION = 0.22;
/**
 * 0679: the alarm's wash — how far either side of its beacon a turn throws it along the room, and where on the wall
 * it falls, across. The Coil's crest on the wall over her pad, across; and how far her clamps sink as she lights.
 */
const ALARM_SWEEP = 44;
const ALARM_WALL = 56;
const CREST_ACROSS = 54;
const CLAMPS_SINK = 8;
/**
 * 0679: the field across the bay ripples as each ship goes through it — drawn a second time a unit off, for
 * `RIPPLE_STEPS` from the step its centre crosses the bay. The steps are solved from each launch's own curve
 * (`launched`), so they are constants and the ripple is a function of the clock.
 */
const RIPPLE_STEPS = 12;
const VIPER_THROUGH = BEATS.viperGo + Math.sqrt((2 * (STAGE.bay - STAGE.viperPad)) / LAUNCH_ACCEL);
const BLUE_THROUGH = BEATS.blueGo + Math.sqrt((2 * (STAGE.bay - STAGE.bluePad)) / BLUE_LAUNCH_ACCEL);
/** The crane over the pilot's pad: how far under the truss its rail is, and how far its hook swings, in radians. */
const CRANE_UNDER = 1;
const HOOK_SWING = 0.05;
/** The hook's swing, in steps a period — slow, as a hook on a long cable swings. */
const HOOK_PERIOD = 300;

/**
 * A band of shade `width` world units wide whose dark edge lies along `edge`, across — under a thing (`below`,
 * the band falling away down the wall) or at a wall's foot (the band rising from it). Each sprite is a band across
 * one edge of its box, so it is laid at the box's centre stretched to the width — and never turned, because a
 * turned blit rotates the canvas every frame, which `tests/run-ends.browser.test.ts` counts on the stand.
 */
function shadeAt(surface: Surface, view: View, along: number, edge: number, width: number, below: boolean): void {
  const grow = width / PORT_EXTENT.shade;
  const half = width / 2;
  put(surface, view, below ? PORT_SPRITE.shade : PORT_SPRITE.shadeFoot, along, below ? edge + half : edge - half, 1, 0, grow);
}

/** Smooth from 0 at `from` to 1 at `to`, and flat either side. */
function ease(t: number, from: number, to: number): number {
  const u = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return u * u * (3 - 2 * u);
}

/** How far a ship launched at `go` has travelled by `t`, from a standing start, at `accel`. */
function launched(t: number, go: number, accel = LAUNCH_ACCEL): number {
  if (t <= go) return 0;
  const s = t - go;
  return 0.5 * accel * s * s;
}

/**
 * The ship's engine, at the frame its beat has reached: nothing until it is lit, idle until it goes,
 * a flare for the first half-second of a launch and a flickering burn after that.
 */
function flameOf(t: number, lit: number, go: number, idle: number, burn: number, flare: number): number {
  if (t < lit) return -1;
  if (t < go) return idle;
  if (t < go + 30) return flare;
  return Math.floor(t / FLICKER_STEPS) % 2 === 0 ? burn : flare;
}

/**
 * How much of the surge is left `t` steps into a launch heard at `go` — 0416: full on the step the
 * `launch` cue sounds, dying back into the burn over `SURGE_STEPS`, and nothing either side.
 */
function surgeAt(t: number, go: number): number {
  if (t < go || t >= go + SURGE_STEPS) return 0;
  return Math.pow(1 - (t - go) / SURGE_STEPS, SURGE_CURVE);
}

/*
  ── THE HANGAR ───────────────────────────────────────────────────────────────────────────────────
*/

/*
  ⚠️ **THE ROOM IS DRAWN BY THESE, FOR THE INTRO AND FOR THE STAND ALIKE — 0540.** The hangar's tabs
  stand in this room, held still, and a second copy of how the room is drawn would be a room that drifts
  from the intro's the first time either is touched. What the two pictures share is here; what happens
  in the room — the Viper, the alarm, the pilot — stays in `paintHangar`.
*/

/** The first level's sky past the bay, drifting, and the back wall and the truss over it. */
function paintRoom(surface: Surface, view: View, t: number, sky: Sky): void {
  // The first level's sky past the bay, drifting — the room covers the rest of it (0416).
  paintSky(surface, view, t * HANGAR_DRIFT, sky, 0, 0, GAME_BASE);
  // 0680: a far shuttle crossing the bay once in the held shot, and the station's own structure past the bay.
  paintShuttle(surface, view, STAGE.bay, t - INTRO_SHUTTLE_AT);
  put(surface, view, PORT_SPRITE.spar, planeAlong(view, STAGE.bay + SPAR.past, SPAR.depth), SPAR.across);
  // The back wall, the truss and the lamps.
  const wall = PORT_EXTENT.wall;
  const hole = STAGE.viewport;
  for (let along = wall / 2; along < STAGE.bay; along += wall) {
    for (let across = wall / 2; across < STAGE.deck + wall; across += wall) {
      // 0550: no tile where the viewport is, so the sky under the room is what is seen through it.
      if (along > hole.along && along < hole.along + 2 * wall && across > hole.across && across < hole.across + wall) continue;
      // 0676: lit by the lamp over it, half lit beside one, dark between. 0677: and its vent, patch or conduit.
      wallTile(surface, view, along, across, STAGE.lamps);
    }
  }
  put(surface, view, PORT_SPRITE.viewport, hole.along + wall, hole.across + wall / 2);
  // 0681: one panel dented, and grime along the wall's foot.
  put(surface, view, PORT_SPRITE.wallDent, DENT.intro.along, DENT.intro.across);
  paintGrime(surface, view, STAGE.bay);
  // 0680: the steam off a vent, and a fan turning in the wall.
  if (INTRO_VENT.along > 0) paintSteam(surface, view, t, INTRO_VENT.along, INTRO_VENT.across);
  paintFan(surface, view, t, FAN.intro.along, FAN.intro.across);
  // 0676: and the shade under the truss and along the wall's foot, where the lamps do not reach.
  shadeAt(surface, view, STAGE.bay / 2, STAGE.ceiling, STAGE.bay, true);
  shadeAt(surface, view, STAGE.bay / 2, STAGE.deck, STAGE.bay, false);
  // 0677: the bulkhead door between the pads, and the bay's number over it.
  put(surface, view, PORT_SPRITE.bulkhead, STAGE.bulkhead.along, STAGE.bulkhead.across);
  put(surface, view, PORT_SPRITE.sign02, STAGE.sign.along, STAGE.sign.across);
  const ceiling = PORT_EXTENT.ceiling;
  for (let along = ceiling / 2; along < STAGE.bay; along += ceiling) {
    put(surface, view, PORT_SPRITE.ceiling, along, STAGE.ceiling - ceiling / 2, 1, 0, TILE_OVERLAP);
  }
  // 0677: the truss's braces, and the crane's rail under it over the pilot's pad with its hook swinging on the clock.
  paintBraces(surface, view, STAGE.bay);
  // 0680: a drone working along the truss, once in the held shot.
  paintDrone(surface, view, STAGE.bay, t - INTRO_DRONE_AT);
  const rail = PORT_EXTENT.craneRail;
  put(surface, view, PORT_SPRITE.craneRail, STAGE.bluePad, STAGE.ceiling + CRANE_UNDER + rail / 2 - 1);
  const hook = PORT_EXTENT.craneHook;
  const swing = HOOK_SWING * Math.sin((t / HOOK_PERIOD) * Math.PI * 2);
  put(surface, view, PORT_SPRITE.craneHook, STAGE.bluePad, STAGE.ceiling + CRANE_UNDER + 5.8 + hook / 2, 1, swing);
}

/** The lamps hung from the truss — 0680: the first with a fault in it, flickering. */
function paintLamps(surface: Surface, view: View, t: number): void {
  const lamp = PORT_EXTENT.lamp;
  for (let i = 0; i < STAGE.lamps.length; i++) {
    put(surface, view, PORT_SPRITE.lamp, STAGE.lamps[i]!, STAGE.ceiling - 2 + lamp / 2, i === 0 ? flickerAt(t) : 1);
  }
}

/** The deck, every plank of it to the bay. */
function paintDeck(surface: Surface, view: View): void {
  const deck = PORT_EXTENT.deck;
  for (let along = deck / 2; along < STAGE.bay; along += deck) {
    for (let across = STAGE.deck + deck / 2; across < ACROSS_SPAN + deck / 2; across += deck) {
      put(surface, view, PORT_SPRITE.deck, along, across, 1, 0, TILE_OVERLAP);
    }
  }
}

/** The edge of the room, over everything that flies out through it. */
function paintEdge(surface: Surface, view: View, t: number): void {
  put(surface, view, PORT_SPRITE.field, STAGE.bay + 1, (STAGE.ceiling + STAGE.deck) / 2, 0.8);
  // 0679: and rippling as each ship goes through it — a second sheet a unit off, flicking side to side and fading.
  const through = t >= BLUE_THROUGH ? t - BLUE_THROUGH : t - VIPER_THROUGH;
  if (through >= 0 && through < RIPPLE_STEPS) {
    const side = Math.floor(through / 3) % 2 === 0 ? 1 : -1;
    put(surface, view, PORT_SPRITE.field, STAGE.bay + 1 + side, (STAGE.ceiling + STAGE.deck) / 2, 0.8 * (1 - through / RIPPLE_STEPS));
  }
  put(surface, view, PORT_SPRITE.bayTop, STAGE.bay + 2, PORT_EXTENT.bayTop / 2 - 4);
  put(surface, view, PORT_SPRITE.bayBottom, STAGE.bay + 2, ACROSS_SPAN - PORT_EXTENT.bayBottom / 2 + 4);
  // 0677: and the bay door's warning lamp, turning.
  paintDoorLamp(surface, view, t, STAGE.bay);
}

/**
 * How fast the pilot's ship bobs on its pad's beam, in radians a step — a period of exactly 105 steps.
 * 0572: whole, and it was 0.06 (104.7 steps). The stand's guards read the picture a bob apart (`samePhase`),
 * and a bob that was not a whole number of steps was 104 steps one time and 105 the next: with the dock's
 * deeper bob and its rising rings, that one step moved enough of the stand to pass for a fitting on CI.
 */
export const BLUE_BOB_RATE = (Math.PI * 2) / 105;

/** How far the pilot's ship bobs on its pad's beam at `t`, before it goes — `BLUE_BOB` either way. */
function blueBobAt(t: number): number {
  return Math.sin(t * BLUE_BOB_RATE + 1.7) * BLUE_BOB;
}
const BLUE_BOB = 0.6;

/** How lit the planet and its moon are, behind the sky's haze — 0572: far off, and not the brightest thing in the bay. */
const PLANET_HAZE = 0.7;
/**
 * 0572: the planet's drift — one pass of `PLANET_REACH` world units in `PLANET_LOOP` steps, eight minutes,
 * centred on `DOCK.planet.along`, slow enough to be seen moving only over a while, as the far stars are. It
 * comes out of the haze over its first `PLANET_FADE` steps and goes back into it over its last, so it is never
 * seen to appear or to jump. The moon's orbit, in steps: a minute and a half.
 */
const PLANET_LOOP = 60 * 60 * 8;
const PLANET_REACH = 36;
const PLANET_FADE = 60 * 30;
const MOON_ORBIT = 60 * 90;

/**
 * 0572: the cradle's field — how many rings are rising at once, how many steps one takes from the cradle
 * to the ship, and where under the ship's centre they meet it, in world units.
 */
const HOVER_RINGS = 3;
/*
  A whole number of bobs, so the rings stand where they stood one bob later — the stand's own guards read
  the picture a bob apart to tell what a fitting changed from what moves by itself (`samePhase`, 0540).
*/
const BOB_STEPS = (Math.PI * 2) / BLUE_BOB_RATE;
const HOVER_RISE = BOB_STEPS * HOVER_RINGS;
const HOVER_UNDER = 4.5;

/**
 * 0572: the lift's platform at `t` — a round trip of `LIFT_TRIP` steps, waiting at the deck and at the
 * catwalk a third of it each, and easing between. The platform's top, across.
 */
function liftAt(t: number): number {
  const u = (t % LIFT_TRIP) / LIFT_TRIP;
  const up = u < 1 / 3 ? 0 : u < 1 / 2 ? ease(u, 1 / 3, 1 / 2) : u < 5 / 6 ? 1 : 1 - ease(u, 5 / 6, 1);
  return STAGE.deck - (STAGE.deck - DOCK.catwalk) * up;
}
// Seven bobs, about twelve seconds: a whole number of them, on `HOVER_RISE`'s terms.
const LIFT_TRIP = BOB_STEPS * 7;
/** The lift's half-width along, rails and landing — `paintLift`'s widest. */
const LIFT_HALF = 6;

/** A stand's `hopAt` before anything has been fitted: long enough ago that no hop is under way. */
export const NO_HOP = -1e9;
/** How long the ship's hop on a fitting lasts, in steps, and how high it goes, in world units — 0567. */
const HOP_STEPS = 26;
const HOP_HEIGHT = 2.4;

/**
 * How far the ship stands up off its beam `since` steps after it was fitted — 0567: up and settling, a
 * hop with one small bounce, so a fitting lands as something done to the ship and not a pill changing colour.
 */
function hopAt(since: number): number {
  if (since < 0 || since >= HOP_STEPS) return 0;
  const u = since / HOP_STEPS;
  return HOP_HEIGHT * Math.abs(Math.sin(u * Math.PI * 1.5)) * (1 - u);
}

/** How far through the leap the pilot starts to fade into the ship — and, since 0612, onto the seat of one that shows them. */
const LANDS = 0.6;

function paintHangar(surface: Surface, view: View, t: number, sky: Sky, cockpitAlong: number, cockpitAcross: number, size: number, seated: boolean): void {
  paintRoom(surface, view, t, sky);
  /*
    The alarm, turning once she has gone. 0679: the beacons are its source, lit and steady, and what turns is their
    light — a red wash thrown along the wall and the deck, swept across the room once a turn while it faces it. It
    was the two dots brightening and growing, which read as two lamps blinking and not as a light going round.
  */
  if (t >= BEATS.alarm) {
    const up = Math.min(1, (t - BEATS.alarm) / 12);
    for (let i = 0; i < STAGE.beacons.length; i++) {
      const at = STAGE.beacons[i]!;
      // Each beacon half a turn from the other, so one is always throwing its light somewhere.
      const turn = ((t - BEATS.alarm) / ALARM_PERIOD) * Math.PI * 2 + i * Math.PI;
      const facing = Math.cos(turn);
      if (facing > 0) {
        const along = at[0] + Math.sin(turn) * ALARM_SWEEP;
        put(surface, view, PORT_SPRITE.alarmWash, along, ALARM_WALL, up * facing);
        put(surface, view, PORT_SPRITE.alarmWash, along, STAGE.deck + POOL_DOWN, up * facing * 0.7);
        // 0680: and its beam, a cone off the lamp turned to where the wash falls.
        put(surface, view, PORT_SPRITE.beaconCone, at[0], at[1], up * facing * 0.8, Math.atan2(ALARM_WALL - at[1], along - at[0]));
      }
      put(surface, view, PORT_SPRITE.beacon, at[0], at[1], up * (0.6 + 0.4 * Math.max(0, facing)));
    }
  }
  paintLamps(surface, view, t);
  /*
    The bar: the light inside it and the door that slides back across it, then the front of it. It
    opens once, for the pilot, and stays open — it opened for Venoma too from 0416 until 0444.
  */
  const open = ease(t, BEATS.door, BEATS.pilotOut);
  // 0676: its light up the wall past its end, the room's warm side — there through its window, and more once it is open.
  put(surface, view, PORT_SPRITE.spillWall, STAGE.bar.along + SPILL_WALL.along, STAGE.bar.across + SPILL_WALL.across, SPILL_WALL.shut + (1 - SPILL_WALL.shut) * open);
  if (open > 0) put(surface, view, PORT_SPRITE.spill, STAGE.doorway.along, STAGE.doorway.across, open);
  put(surface, view, PORT_SPRITE.door, STAGE.doorway.along - 13 * open, STAGE.doorway.across);
  put(surface, view, PORT_SPRITE.bar, STAGE.bar.along, STAGE.bar.across);
  // 0680: its neon buzzing dark for a step in sixty, and a bulb of its string flaring, a different one each eighth of a step-block.
  if (Math.floor(t) % 60 === NEON_BUZZ) put(surface, view, PORT_SPRITE.neonDark, STAGE.bar.along + NEON_AT.along, STAGE.bar.across + NEON_AT.across, 0.5);
  const block = Math.floor(t / TWINKLE_STEPS);
  const bulb = Math.floor(hash(block) * BAR_BULBS);
  const flare = Math.sin(((t % TWINKLE_STEPS) / TWINKLE_STEPS) * Math.PI);
  put(surface, view, PORT_SPRITE.twinkle, STAGE.bar.along - 28 + bulb * 4, STAGE.bar.across - 19.2 + Math.sin(bulb * 1.3) * 0.4, 0.8 * flare);
  // The deck.
  paintDeck(surface, view);
  if (open > 0) put(surface, view, PORT_SPRITE.pool, STAGE.doorway.along + 6, STAGE.deck + 1, open * 0.7);
  // 0677: the deck as a floor — its front edge, the grating under each pad, the car's tyre marks on its pad, the
  // Viper's scorch where she stood (coming up once her burn has had the deck a moment), and an oil stain.
  paintLip(surface, view, STAGE.bay);
  put(surface, view, PORT_SPRITE.grating, STAGE.viperPad, STAGE.deck + GRATING_DOWN);
  put(surface, view, PORT_SPRITE.grating, STAGE.bluePad, STAGE.deck + GRATING_DOWN);
  put(surface, view, PORT_SPRITE.tyres, STAGE.bluePad, STAGE.deck + TYRES_DOWN);
  const scorch = ease(t, BEATS.viperGo + SCORCH_FROM, BEATS.viperGo + SCORCH_FROM + SCORCH_IN);
  if (scorch > 0) put(surface, view, PORT_SPRITE.scorch, STAGE.viperPad, STAGE.deck + TYRES_DOWN, scorch);
  put(surface, view, PORT_SPRITE.oil, STAGE.crates.along - OIL_BACK, STAGE.deck + TYRES_DOWN);
  // 0676: each lamp's light on the deck under it.
  for (let i = 0; i < STAGE.lamps.length; i++) put(surface, view, PORT_SPRITE.lampPool, STAGE.lamps[i]!, STAGE.deck + POOL_DOWN, i === 0 ? flickerAt(t) : 1);
  // The pads, and the beams each ship rides until it goes — 0676: each pad's field lit on the deck as long as its beam.
  const beam = PORT_EXTENT.beam;
  const viperField = 1 - ease(t, BEATS.viperGo, BEATS.viperGo + 30);
  const blueField = 1 - ease(t, BEATS.blueGo, BEATS.blueGo + 30);
  // 0677: each beam's rings in the polished deck under its pad — the beam turned over and faint.
  // 0679: hers in her violet, beam and pool and pad.
  put(surface, view, PORT_SPRITE.beamViper, STAGE.viperPad, STAGE.deck + beam / 2 - 2, viperField * REFLECTION, Math.PI);
  put(surface, view, PORT_SPRITE.beam, STAGE.bluePad, STAGE.deck + beam / 2 - 2, blueField * REFLECTION, Math.PI);
  // 0677: and the crates and the hose standing on the deck past the Viper's pad.
  put(surface, view, PORT_SPRITE.hose, STAGE.hose.along, STAGE.hose.across);
  put(surface, view, PORT_SPRITE.crates, STAGE.crates.along, STAGE.crates.across);
  put(surface, view, PORT_SPRITE.padPoolViper, STAGE.viperPad, STAGE.deck + POOL_DOWN, viperField);
  put(surface, view, PORT_SPRITE.padPool, STAGE.bluePad, STAGE.deck + POOL_DOWN, blueField);
  put(surface, view, PORT_SPRITE.beamViper, STAGE.viperPad, STAGE.deck - beam / 2 + 2, viperField);
  put(surface, view, PORT_SPRITE.beam, STAGE.bluePad, STAGE.deck - beam / 2 + 2, blueField);
  // 0679: the Coil's crest on the wall over her pad, and the clamps holding her to it, dropping into it as she lights.
  put(surface, view, PORT_SPRITE.crest, STAGE.viperPad, CREST_ACROSS);
  const freed = ease(t, BEATS.viperLit, BEATS.viperLift);
  if (freed < 1) put(surface, view, PORT_SPRITE.clamps, STAGE.viperPad, STAGE.deck - PORT_EXTENT.clamps / 2 + 4 + CLAMPS_SINK * freed, 1 - freed);
  put(surface, view, PORT_SPRITE.padViper, STAGE.viperPad, STAGE.deck);
  put(surface, view, PORT_SPRITE.pad, STAGE.bluePad, STAGE.deck);
  // The Viper: a bob on the beam, the lift, and the burn out through the bay.
  const viperBob = t < BEATS.viperGo ? Math.sin(t * 0.07) * 0.6 : 0;
  const viperAlong = STAGE.viperPad + launched(t, BEATS.viperGo);
  const viperAcross = STAGE.viperRide - LIFT * ease(t, BEATS.viperLift, BEATS.viperGo) + viperBob;
  paintViper(surface, view, t, viperAlong, viperAcross, BEATS.viperLit, BEATS.viperGo);
  const blueBob = t < BEATS.blueGo ? blueBobAt(t) : 0;
  const blueAlong = STAGE.bluePad + launched(t, BEATS.blueGo, BLUE_LAUNCH_ACCEL);
  const blueAcross = STAGE.blueRide - LIFT * ease(t, BEATS.blueLift, BEATS.blueGo) + blueBob;
  /*
    0612: a ship that shows its pilot is empty until they board, and they come up on it as the leaping
    figure fades into it — the same last two fifths of the leap, so one becomes the other.
  */
  const aboard = seated ? ease(t, BEATS.pilotLeap + LANDS * (BEATS.pilotIn - BEATS.pilotLeap), BEATS.pilotIn) : 0;
  // 0676: lit from its pad until it lifts off it.
  paintBlue(surface, view, t, blueAlong, blueAcross, BEATS.blueLit, BEATS.blueGo, size, aboard, true, 1 - ease(t, BEATS.blueLift, BEATS.blueGo));
  /*
    ⚠️ **VENOMA RAN HERE — 0416 — OUT OF THE DOOR AND UP INTO THE VIPER, UNTIL 0444.** *"it doesn't add
    anything and makes the ending worse when you see the villain running with no captive."* She is
    aboard before the picture starts.
  */
  /*
    The pilot: out of the door, across the deck, and up into the cockpit — in FRONT of the fighter,
    because the deck they run along is nearer the viewer than the pad's beam, and a pilot that ran
    under the wing vanished into it in the first photographs. The leap shrinks and fades as it drops
    into the canopy, which is what puts them inside.
  */
  if (t >= BEATS.pilotOut && t < BEATS.pilotIn) {
    if (t < BEATS.pilotLeap) {
      const run = t - BEATS.pilotOut;
      const frame = Math.floor(run / RUN_FRAME_STEPS) % 4;
      const bob = Math.abs(Math.sin((run / RUN_FRAME_STEPS) * (Math.PI / 2))) * 0.5;
      put(surface, view, PORT_SPRITE.pilotRun0 + frame, STAGE.doorway.along + RUN_SPEED * run, STAGE.deck - PILOT_STANDS - bob);
    } else {
      const u = (t - BEATS.pilotLeap) / (BEATS.pilotIn - BEATS.pilotLeap);
      const fromAcross = STAGE.deck - PILOT_STANDS;
      const toAlong = blueAlong + cockpitAlong;
      const toAcross = blueAcross + cockpitAcross;
      const along = LEAP_FROM + (toAlong - LEAP_FROM) * u;
      const across = fromAcross + (toAcross - fromAcross) * u - 14 * u * (1 - u);
      put(surface, view, PORT_SPRITE.pilotLeap, along, across, 1 - ease(u, LANDS, 1), 0, 1 - 0.45 * u);
    }
  }
  // The canopy catching the light as the pilot drops in.
  if (t >= BEATS.pilotIn - 6 && t < BEATS.pilotIn + 18) {
    const blink = 1 - Math.abs(t - (BEATS.pilotIn + 4)) / 14;
    if (blink > 0) put(surface, view, PORT_SPRITE.flash, blueAlong + cockpitAlong, blueAcross + cockpitAcross, blink * 0.5, 0, 0.25);
  }
  // The edge of the room, over everything that flies out through it.
  paintEdge(surface, view, t);
}

/** The Viper and her engine — the surge its launch is heard in — and the flash she leaves the pad in. */
function paintViper(surface: Surface, view: View, t: number, along: number, across: number, lit: number, go: number): void {
  const flame = flameOf(t, lit, go, PORT_SPRITE.viperIdle, PORT_SPRITE.viperBurn, PORT_SPRITE.viperFlare);
  if (flame >= 0) put(surface, view, flame, along, across);
  const surge = surgeAt(t, go);
  if (surge > 0) put(surface, view, PORT_SPRITE.viperSurge, along, across, surge);
  put(surface, view, PORT_SPRITE.viper, along, across);
  if (t >= go && t < go + FLASH_STEPS) {
    put(surface, view, PORT_SPRITE.flash, along - 16, across, 0.8 * (1 - (t - go) / FLASH_STEPS), 0, FLASH_GROW);
  }
}

/**
 * The pilot's ship as the hangar sees it — side-on, for a ship whose fight picture is from above (0444)
 * — its engine, the surge its launch is heard in, and the flash it leaves the pad in. 0612: and whoever
 * rides it, laid over it at `rider`'s share of the way aboard — nought on the pad, and in the intro until
 * the pilot's leap lands.
 */
function paintBlue(surface: Surface, view: View, t: number, along: number, across: number, lit: number, go: number, size: number, rider = 0, tubes = true, uplight = 0): void {
  const flame = flameOf(t, lit, go, PORT_SPRITE.blueIdle, PORT_SPRITE.blueBurn, PORT_SPRITE.blueFlare);
  if (flame >= 0) put(surface, view, flame, along, across, 1, 0, size);
  const surge = surgeAt(t, go);
  if (surge > 0) put(surface, view, PORT_SPRITE.blueSurge, along, across, surge, 0, size);
  put(surface, view, PORT_SPRITE.blueSide, along, across, 1, 0, size);
  // 0676: the pad's field lighting its underside, after the hull and before its tubes, at `uplight`'s share.
  if (uplight > 0) put(surface, view, PORT_SPRITE.padLight, along, across, uplight, 0, size);
  // 0621: its side-on tubes on it — unless the caller lays its lights first, as the pad does.
  if (tubes) put(surface, view, PORT_SPRITE.blueTubes, along, across, 1, 0, size);
  if (rider > 0) put(surface, view, PORT_SPRITE.blueRider, along, across, rider, 0, size);
  if (t >= go && t < go + FLASH_STEPS) {
    put(surface, view, PORT_SPRITE.flash, along - 12, across, 0.8 * (1 - (t - go) / FLASH_STEPS), 0, FLASH_GROW);
  }
}

/*
  ── THE DARK OUTSIDE ─────────────────────────────────────────────────────────────────────────────
*/

/**
 * How far something that falls behind at `speed` at cruise has fallen `s` steps into the shot: the
 * ships have only just left the bay, so they gather speed over `OUTSIDE.ramp` steps and hold it.
 */
function fallen(s: number, speed: number): number {
  const ramp = OUTSIDE.ramp;
  return s < ramp ? (speed * s * s) / (2 * ramp) : speed * (s - ramp / 2);
}

/** Where the station's centre is `s` steps into the shot: falling behind as the ships fly on. */
function stationAlong(s: number): number {
  return -18 - fallen(s, OUTSIDE.station);
}

/** The station's bay mouth, relative to its centre — `paintStation` in `port-bake.ts`. */
const BAY_MOUTH_ALONG = 42;
const BAY_MOUTH_ACROSS = 2;
const STATION_ACROSS = 58;

/**
 * 0675: the dock's planet, far behind the station in the chase — where it hangs, how much of the station's
 * rate it falls behind at, how lit, and how big beside the dock's own (`DOCK.planetGrow`). A tenth of the
 * rate, so it is the furthest thing in the shot after the stars; small, so it is far.
 */
const FAR_PLANET = { along: 180, across: 22, rate: 0.1, lit: 0.9, grow: 0.85 } as const;
/*
  0695: *"that whole scene could use a bit more pizazz."* The chase's sky, past the planet: a sun far off the
  station's side, falling behind slower than the planet; the planet's air lit round it, and the planet itself a
  size up and lit; rocks drifting past between the planet and the ships at half the station's rate, each turning
  its own way; and the nearest stars drawn out into streaks as the camera gathers speed, which is what speed
  looks like with nothing beside you to measure it by.
*/
const FAR_SUN = { along: 236, across: 6, rate: 0.03, grow: 1.1 } as const;
const ROCK_RATE = 0.45;
// @setup: where each rock starts and how far across it drifts, read every frame and never written.
const ROCK_ALONG: readonly number[] = [150, 205, 262, 331, 398];
// @setup: as above.
const ROCK_ACROSS: readonly number[] = [96, 14, 72, 40, 108];
const STREAKS = 22;
const STREAK_SPAN = 320;
const STREAK_SPEED = 2.2;

/**
 * One blit in the dark outside, framed `OUTSIDE_ZOOM` about the middle of the view — 0414. The shot is
 * authored in the same world units as the hangar; only where they land and how big is scaled.
 */
function putOut(surface: Surface, view: View, sprite: number, along: number, across: number, alpha = 1, turn = 0, grow = 1): void {
  const midAlong = view.alongSpan / 2;
  const midAcross = ACROSS_SPAN / 2;
  put(surface, view, sprite, midAlong + (along - midAlong) * OUTSIDE_ZOOM, midAcross + (across - midAcross) * OUTSIDE_ZOOM, alpha, turn, OUTSIDE_ZOOM * grow);
}

/** Steps into the shot at which each ship opens her throttle. */
const VIPER_RUNS = BEATS.viperRuns - BEATS.outside;
const BLUE_RUNS = BEATS.blueRuns - BEATS.outside;
/** When the fighter comes out of the bay, and when it has settled onto her line. */
const BLUE_OUT = 6;
const BLUE_SETTLED = 72;

/** Her line across the lane, `s` steps into the shot: held, and broken by each of `JINKS` in turn. */
function viperLine(s: number): number {
  let across = CHASE.viper.across;
  for (let i = 0; i < JINKS.length; i++) {
    const jink = JINKS[i]!;
    across += (jink.to - across) * ease(s, jink.at, jink.at + JINK_STEPS);
  }
  return across;
}

function viperAlongAt(s: number): number {
  return CHASE.viper.along + launched(s, VIPER_RUNS);
}

/** The fighter's share of the way from the bay mouth to its place in the chase. */
function blueArrived(s: number): number {
  return ease(s, BLUE_OUT, BLUE_SETTLED);
}

function blueAlongAt(s: number): number {
  const mouth = stationAlong(s) + BAY_MOUTH_ALONG;
  return mouth + (CHASE.blue.along - mouth) * blueArrived(s) + launched(s, BLUE_RUNS);
}

/** Her line, `TRACK_DELAY` steps late, and a little below it — the fighter flying where she flew. */
function blueAcrossAt(s: number): number {
  const mouth = STATION_ACROSS + BAY_MOUTH_ACROSS;
  const track = viperLine(s - TRACK_DELAY) + (CHASE.blue.across - CHASE.viper.across);
  return mouth + (track - mouth) * blueArrived(s);
}

/**
 * How far a ship banks into a move across the lane: nose down going down the screen, up going up, in
 * proportion to how fast, and level on a held line. The move is what tilts it — nothing sways.
 */
function bank(from: number, to: number): number {
  return Math.max(-0.16, Math.min(0.16, (to - from) * 0.09));
}

/**
 * A ship's trails, from the moment it opened its throttle: `TRAIL_SAMPLES` of where it was, each a
 * length of vapour off its wingtip, fading with age — and faint where the ship was barely moving, so a
 * standing start does not pile a blot on the tip. `tipAlong`/`tipAcross` are the wingtip, relative to
 * the ship's centre, and `blue` says whose position to ask for.
 */
function paintTrail(surface: Surface, view: View, s: number, runs: number, blue: boolean, tipAlong: number, tipAcross: number): void {
  for (let k = 1; k <= TRAIL_SAMPLES; k++) {
    const at = s - k * TRAIL_EVERY;
    if (at < runs) return;
    const along = blue ? blueAlongAt(at) : viperAlongAt(at);
    const across = blue ? blueAcrossAt(at) : viperLine(at);
    const before = blue ? blueAlongAt(at - TRAIL_EVERY) : viperAlongAt(at - TRAIL_EVERY);
    const spread = Math.min(1, (along - before) / 6);
    const alpha = 0.75 * (1 - k / (TRAIL_SAMPLES + 1)) * spread;
    if (alpha > 0.01) putOut(surface, view, PORT_SPRITE.contrail, along + tipAlong, across + tipAcross, alpha);
  }
}

function paintOutside(surface: Surface, view: View, s: number, sky: Sky, wingtip: number, size: number, seated: boolean): void {
  if (s < 0) return;
  /*
    ⚠️ **THE FIRST LEVEL'S SKY, AT THE FIRST LEVEL'S SPEED, AND AT ITS OWN SIZE — 0416.** The camera
    behind it flies at `SKY_SPEED`, gathering speed out of the bay on the ships' own ramp; the sky is
    not framed by `OUTSIDE_ZOOM`, because it is the sky the level is drawn in and the level is not zoomed.
  */
  paintSky(surface, view, fallen(s, SKY_SPEED), sky, 0, 0, GAME_BASE);
  // 0695: the sun, furthest off, and the stars nearest the camera drawn out as it gathers speed.
  putOut(surface, view, PORT_SPRITE.sun, FAR_SUN.along - fallen(s, OUTSIDE.station * FAR_SUN.rate), FAR_SUN.across, 0.85, 0, FAR_SUN.grow);
  const speed = Math.min(1, s / OUTSIDE.ramp);
  if (speed > 0.25) {
    const streaked = fallen(s, SKY_SPEED * STREAK_SPEED) % STREAK_SPAN;
    for (let k = 0; k < STREAKS; k++) {
      const along = ((hash(k + 300) * STREAK_SPAN - streaked + STREAK_SPAN) % STREAK_SPAN) - 40;
      putOut(surface, view, PORT_SPRITE.streak, along, hash(k + 500) * ACROSS_SPAN, 0.5 * speed * speed * (0.4 + 0.6 * hash(k + 700)), 0, 0.3 + 1.2 * speed);
    }
  }
  // 0675: the planet Hangin' Out's bay looks out on, far behind, so the chase and the dock are one sky. 0695: its air round it.
  const planetAlong = FAR_PLANET.along - fallen(s, OUTSIDE.station * FAR_PLANET.rate);
  putOut(surface, view, PORT_SPRITE.halo, planetAlong, FAR_PLANET.across, 0.7, 0, DOCK.planetGrow * FAR_PLANET.grow);
  putOut(surface, view, PORT_SPRITE.planet, planetAlong, FAR_PLANET.across, FAR_PLANET.lit, 0, DOCK.planetGrow * FAR_PLANET.grow);
  // 0695: rocks between the planet and the ships, each turning its own way.
  for (let k = 0; k < ROCK_ALONG.length; k++) {
    putOut(surface, view, PORT_SPRITE.rock, ROCK_ALONG[k]! - fallen(s, OUTSIDE.station * ROCK_RATE), ROCK_ACROSS[k]!, 0.95, s * 0.012 * (k % 2 === 0 ? 1 : -1) * (1 + k * 0.3), 0.8 + 0.7 * hash(k + 900));
  }
  const station = stationAlong(s);
  if (station > -PORT_EXTENT.station) {
    putOut(surface, view, PORT_SPRITE.station, station, STATION_ACROSS);
    // 0675: and the Viper's burn still hanging in the bay's mouth, gone over the shot's first second.
    const sill = 1 - s / STEPS_PER_SECOND;
    if (sill > 0) putOut(surface, view, PORT_SPRITE.sill, station + BAY_MOUTH_ALONG + 2, STATION_ACROSS + BAY_MOUTH_ACROSS, sill);
  }
  // The Viper, ahead, holding her line and breaking from it — until she opens her throttle and is gone.
  const viperAlong = viperAlongAt(s);
  const viperAcross = viperLine(s);
  const viperTurn = bank(viperAcross, viperLine(s + 1));
  // Her trails, off both wingtips — the near one low and aft, the far one high and forward.
  paintTrail(surface, view, s, VIPER_RUNS, false, -8.7, 7.7);
  paintTrail(surface, view, s, VIPER_RUNS, false, -5.7, -6.4);
  const viperFlame = s < VIPER_RUNS ? PORT_SPRITE.viperBurn : PORT_SPRITE.viperFlare;
  putOut(surface, view, Math.floor(s / FLICKER_STEPS) % 2 === 0 ? viperFlame : PORT_SPRITE.viperFlare, viperAlong, viperAcross, 1, viperTurn);
  // The surge her throttle is heard in — 0416.
  const viperSurge = surgeAt(s, VIPER_RUNS);
  if (viperSurge > 0) putOut(surface, view, PORT_SPRITE.viperSurge, viperAlong, viperAcross, viperSurge, viperTurn);
  putOut(surface, view, PORT_SPRITE.viper, viperAlong, viperAcross, 1, viperTurn);
  // The fighter: out of the station's bay, onto her line behind her — and then after her.
  if (s < BLUE_OUT) return;
  const blueAlong = blueAlongAt(s);
  const blueAcross = blueAcrossAt(s);
  const blueTurn = bank(blueAcross, blueAcrossAt(s + 1));
  // Off the pilot's ship's own wingtips — 0441: a saucer's rim is not a car's wheels.
  paintTrail(surface, view, s, BLUE_RUNS, true, -7.5 * size, -wingtip);
  paintTrail(surface, view, s, BLUE_RUNS, true, -7.5 * size, wingtip);
  /*
    ⚠️ **THE TILT — 0444: out of the bay as the hangar saw it, and over onto the fight's view.** The
    frames are consecutive in the atlas, side-on to from above; each is laid over the one before it at
    the share of the way between them, so six pictures turn without a step between any two.
  */
  const tilt = ease(s, TILT.from, TILT.from + TILT.steps) * (TILT_FRAMES - 1);
  const frame = Math.min(TILT_FRAMES - 1, Math.floor(tilt));
  /*
    ⚠️ **AND THE FLAMES TURN WITH IT — 0450.** The hangar's set burns where the ship's engines are seen
    side-on and the fight's where they are seen from above — one drive on a saucer's rim, then two — so
    each is laid at its share of the tilt, and only one is drawn once the turn is over.
  */
  const over = tilt / (TILT_FRAMES - 1);
  const flare = s < BLUE_OUT + 24 || s >= BLUE_RUNS || Math.floor(s / FLICKER_STEPS) % 2 === 1;
  const blueSurge = surgeAt(s, BLUE_RUNS);
  if (over < 1) {
    putOut(surface, view, flare ? PORT_SPRITE.blueFlare : PORT_SPRITE.blueBurn, blueAlong, blueAcross, 1 - over, blueTurn, size);
    if (blueSurge > 0) putOut(surface, view, PORT_SPRITE.blueSurge, blueAlong, blueAcross, blueSurge * (1 - over), blueTurn, size);
  }
  if (over > 0) {
    putOut(surface, view, flare ? PORT_SPRITE.blueTopFlare : PORT_SPRITE.blueTopBurn, blueAlong, blueAcross, over, blueTurn, size);
    if (blueSurge > 0) putOut(surface, view, PORT_SPRITE.blueTopSurge, blueAlong, blueAcross, blueSurge * over, blueTurn, size);
  }
  putOut(surface, view, PORT_SPRITE.blueSide + frame, blueAlong, blueAcross, 1, blueTurn, size);
  // 0621: side-on, the tubes are their own picture; every frame of the tilt after it carries its own.
  if (frame === 0) putOut(surface, view, PORT_SPRITE.blueTubes, blueAlong, blueAcross, 1, blueTurn, size);
  if (tilt > frame) putOut(surface, view, PORT_SPRITE.blueSide + frame + 1, blueAlong, blueAcross, tilt - frame, blueTurn, size);
  /*
    0612: and its pilot aboard it, on a ship that shows them. Every such ship is drawn the same in every frame
    of the tilt — the fight's drawing, which is side-on or round already (`HANGAR_ART` is null for both) —
    so the one rider sits on every frame.
  */
  if (seated) putOut(surface, view, PORT_SPRITE.blueRider, blueAlong, blueAcross, 1, blueTurn, size);
}

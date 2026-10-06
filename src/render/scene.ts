/**
 * The frame: one clear, then one blit per live entity, interpolated.
 *
 * This is the whole of the per-frame render cost, and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts what it does rather than how
 * long it takes. It allocates nothing, branches on nothing that varies by device, and holds no state.
 *
 * ⚠️ **A painter is never a decision.** Nothing here reads input, advances anything, or chooses what
 * exists — it draws what it is handed. That is what makes a frame reproducible from a screenshot and
 * a scrub bar, and it is the rule `docs/decisions/0015-the-layer-ladder.md` gives the layer.
 */

import { BEAM_BOLT_KIND, BODY_BOLT_FIELDS, BODY_BOLT_SLOTS, BODY_BOLT_SPAN, RAIN_BOLT_KIND, type RoomPiece } from '../content/bosses.ts';
import { ARTERY_HALF_LENGTH, ARTERY_HALF_WIDTH, SPRITE, SPRITE_EXTENT } from '../content/sprites.ts';
import type { Eruption } from '../content/volcano.ts';
import type { Pools } from '../content/pools.ts';
import { arteryAt, trunkAt, type Veins } from '../content/veins.ts';
import { knotOf, opened, type Corridor } from '../sim/corridor.ts';
import { ACROSS_SPAN, type View } from '../sim/camera.ts';
// The edge of the box the ship flies in — 0335: the room's walls stand exactly there, which is what
// makes them a picture of a rule rather than a second one. `sim/` is below `render/` on the ladder.
import { PLAYER_MARGIN, boxPastFor } from '../sim/flight.ts';
import type { Entity } from '../sim/entity.ts';
import { BEAM_MAX_POINTS, beamPoints, beamShift, beamT, jag } from '../sim/jag.ts';
import type { Pool } from '../sim/pool.ts';
import { BOLT_BEAM, BOLT_FLAME, BOLT_HOSTILE, BOLT_PLAYER, BOLT_ROPE, screenX, screenY, type BoltTone, type Surface } from './surface.ts';
import { TETHER_BOLT_KIND } from '../content/weapons.ts';

/**
 * Draw one frame.
 *
 * `alpha` is the clock's leftover fraction of a step: the entity is drawn `alpha` of the way from
 * where it was at the end of the previous step to where it is now. At `alpha` 0 that is exactly the
 * last simulated position, which is what makes a paused frame and a stepped frame agree.
 *
 * ⚠️ **`layers` is drawn in order, back to front, and the order is the caller's decision rather than
 * an accident of which pool happens to be first.** It used to be one pool, and draw order was
 * whatever the pool's packing produced — which is fine when everything on screen is debris and is
 * wrong the moment the player has to find their own ship in a crowd. `src/sim/pool.ts` already warns
 * that releasing REORDERS, so within a layer nothing may depend on order; between layers, this
 * argument is the whole statement of it.
 *
 * ⚠️ **The array is built once, at mount, and never here.** A `[shots, enemies, ship]` literal at the
 * call site would allocate sixty times a second, which is the one thing
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` scans this file for.
 */
/**
 * One layer of sky: a tile, and how fast it moves against the camera.
 *
 * ── WHY THE SKY IS NOT ENTITIES ─────────────────────────────────────────────────────────────────
 *
 * Asked for in play: *"needs a starry background or a background of some kind."*
 * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
 *
 * ⚠️ **`CAPACITY` in `src/app/mount.ts` already totals 0022's 500-entity worst case exactly**, so a
 * starfield made of bodies would either overrun the frame budget or come out of the pools that hold
 * bullets. A tile is one baked bitmap blitted a handful of times — the pipeline 0022 already
 * describes, applied to something the size of the screen.
 *
 * ⚠️ **Built once, at mount, and never here.** A literal at the call site would allocate sixty times
 * a second, which is what `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` scans this
 * file for.
 */
export interface SkyLayer {
  /** The baked tile, as an index into the atlas. */
  sprite: number;
  /** How many world units of tile there are — the tiling period along the scroll axis. */
  extent: number;
  /**
   * How far the layer moves per unit of camera travel. `0` is painted on the glass; `1` is the world.
   *
   * ⚠️ **Strictly below 1, always.** A layer at 1 moves exactly with the world and stops being a
   * background: the player would read it as a field of objects going past at the same rate as the
   * things that can kill them.
   */
  depth: number;
  /**
   * Whether nothing shows through it — land. Absent is a translucent layer — 0347. An opaque tile
   * overlaps its neighbour by a pixel so the join cannot show what is behind it; a translucent one
   * must not, or the overlap draws a column of itself twice.
   */
  opaque?: boolean;
  /*
    ⚠️ **`pools` STOOD HERE — 0353 — AND 0383 MOVED THEM TO THE BED.** The Mire's pools were in its
    ground tile at 0.45 of the camera; the ground they lie in bites now, and a wall has to move with
    the world. Their bubbles are painted with the bank (`paintFront`), and no sky layer holds any.
  */
  /**
   * The veins this layer's tile carries and the pulse along them — 0354. Absent is a layer with none,
   * which is every layer but The Black Heart's weather. The trunks are the ones the baker drew
   * (`VEINS_OF`).
   */
  veins?: Veins;
}

/** The sky, back to front. Empty for a scene with none, which is what a fixture has. */
export type Sky = readonly SkyLayer[];

/**
 * One placed landmark — `docs/decisions/0203-the-rule-was-never-about-size.md`.
 *
 * ⚠️ **A `SkyLayer` HAS NO POSITION AND THIS IS THE WHOLE DIFFERENCE.** `extent` up there is a repeat
 * period, so a field is everywhere and nowhere. *"When the massive pipe organ kicks in music wise we
 * see the pillars of god going past"* is a statement about a position, and needs a type that has one.
 */
export interface Landmark {
  /** The baked bitmap, as an index into the atlas. */
  sprite: number;
  /**
   * The camera position at which it first comes into view, in world units.
   *
   * ⚠️ **WHERE IT APPEARS, NOT WHERE IT IS CENTRED**, and the difference is the entire ask. A
   * landmark is the slowest thing on screen, so at `depth` 0.08 it takes about a minute to cross —
   * centring it on the organ's bar would have it already on screen from before the level started,
   * and *"when the organ kicks in we SEE the pillars"* would be false. Authored as the moment it
   * arrives, it is true by construction.
   */
  at: number;
  /** Where across the lane its centre sits, 0 to 100. */
  lane: number;
  /** How far it moves per unit of camera travel. Below every field's, so it is furthest away. */
  depth: number;
  /** Its own width in world units, so the painter knows when it has fully arrived and fully gone. */
  extent: number;
  /**
   * How far the camera travels for one beat of it, in world units. `0` for a landmark that is still.
   *
   * ⚠️ **A LANDMARK IS THE ONLY BAKED THING IN THE GAME THAT MOVES, AND IT MOVES BY ITS SCALE.** The
   * atlas is bitmaps and nothing in `src/render/` animates one; *"a beating black heart"* needs the
   * object to change between frames, and the two ways to get that are a second baked frame — a whole
   * sprite slot, a whole second drawing to keep in step with the first — or the one number `blit`
   * already takes. It swells and settles; that IS a beat.
   *
   * ⚠️ **DRIVEN BY THE CAMERA, WHICH IS 0034's *every speed is in the camera's frame*.** There is no
   * clock in this file and adding one would give the renderer state; `cameraAlong` is already an
   * argument, already monotonic, and already what every other number on this type is measured
   * against.
   */
  beat: number;
  /**
   * How much bigger than its bitmap this entry is drawn — 0346. `1` for every landmark but the Pillars.
   *
   * ⚠️ **THE SAME ONE NUMBER `blit` ALREADY TAKES, which is `beat`'s own argument one field up**: no
   * second bitmap, no slot, no allocation. `extent` is already the drawn width, so the painter's
   * arrival and cull arithmetic needs no change to be right about a scaled mark.
   */
  scale: number;
  /**
   * Where it throws rock from, in world units from its own centre at its drawn size — and what it
   * throws. Absent for a landmark that is still, which is every one but Saurian Belt's — 0347.
   */
  vent?: { along: number; lane: number; erupts: Eruption };
}

/**
 * How small a rock has got by the end of its flight, against its size leaving the crater — it cools
 * as it climbs, and a shrinking mark is the one fade `blit` can do without a state change (0025).
 */
const EMBER_COOL = 0.5;


/** How much bigger a landmark gets at the top of its beat. */
const BEAT_SWELL = 0.055;

/**
 * The shape of one beat, over a phase from 0 to 1.
 *
 * ⚠️ **TWO THUMPS AND THEN NOTHING, BECAUSE ONE THUMP IS A PULSING LIGHT AND NOT A HEART.** The
 * *lub-dub* is the whole recognisable signature — a strong contraction, a weaker one close behind it,
 * and then a long rest that is most of the cycle. A single sine would read as breathing.
 *
 * ⚠️ **IT REACHES ZERO AT BOTH ENDS OF THE PHASE, WHICH IS WHAT MAKES IT LOOP WITHOUT A STEP.** Both
 * triangles are clear of the wrap, so the value at phase 1 is the value at phase 0 — a discontinuity
 * here would be the object jumping a size every cycle, forever, which is the kind of thing that gets
 * reported as a rendering bug rather than as a tuning one.
 */
function beatAt(phase: number): number {
  const lub = Math.max(0, 1 - Math.abs(phase - 0.07) / 0.07);
  const dub = Math.max(0, 1 - Math.abs(phase - 0.27) / 0.06);
  return lub + dub * 0.55;
}

/** Every landmark this level places. Empty for a place whose landmark is not authored yet. */
export type Landmarks = readonly Landmark[];

const NO_LANDMARKS: Landmarks = [];

/**
 * The edge of the player's box, as a mark to tile down the lane and where to put it.
 *
 * ⚠️ **`inView` is a distance from the camera's trailing edge, not a world position, and that is the
 * whole of why the painter can be handed it.** The box is defined relative to the camera
 * (`src/sim/flight.ts`), so its edge does not move in the world — a world `along` would have to be
 * recomputed here from a camera this function is already given, which is a second description of the
 * same subtraction.
 *
 * `null` for a scene that has no box to draw, which is every fixture and every menu.
 */
/**
 * The room a fight happens in, as a place to draw — `docs/decisions/0335-the-fight-happens-in-a-room.md`.
 *
 * ⚠️ **WORLD POSITIONS, NOT SCREEN ONES, WHICH IS WHY THERE IS NOTHING TO FADE.** The walls stand
 * where the level put them and arrive by scrolling in, exactly as a landmark does — so there is no
 * moment at which a wall appears on a screen that was not already approaching it, and none at which
 * one is taken away. When the camera comes to rest they stop with it, and when it starts again they
 * leave.
 *
 * `null` for a fight with no room, which is every fight but one.
 */
export interface Room {
  /** The bitmap the walls are tiled from, or −1 for a room framed only by its roots (0488). */
  sprite: number;
  /** Its tiling period, in world units — the same number in both axes. */
  extent: number;
  /** Where the room's open side is, in world units along. */
  from: number;
  /** Where its far wall is, in world units along. */
  to: number;
  /**
   * How far the far wall has parted, `0` shut and `1` open — 0337.
   *
   * ⚠️ **IT PARTS FROM THE MIDDLE OUTWARD**, which is what makes it a way THROUGH rather than a wall
   * that got shorter: the gap opens where the ship is already flying and grows past it.
   */
  open: number;
  /** The pieces the room is framed by, placed rather than tiled — 0488 — or `null`. */
  pieces: readonly RoomPiece[] | null;
  /** Where the camera rests, in world units along: the pieces are placed from it. */
  rest: number;
}

/*
  The corridor a level is flown down — 0348 — is `src/sim/corridor.ts`'s since 0349, because the stone
  is a rule the simulation asks questions of and the painter only draws it.
*/

export interface Bound {
  /** The baked dash, as an index into the atlas. */
  sprite: number;
  /** The tiling period down the lane, in world units. */
  extent: number;
  /** How far ahead of the camera the edge sits on the narrowest view, in world units; a wider one adds `boxPastFor` (0552). */
  inView: number;
}

export function paintScene(
  surface: Surface,
  view: View,
  layers: readonly Pool<Entity>[],
  cameraAlong: number,
  alpha: number,
  sky: Sky = NO_SKY,
  bound: Bound | null = null,
  landmarks: Landmarks = NO_LANDMARKS,
  levelOrigin = 0,
  room: Room | null = null,
  warp = 0,
  time = 0,
  corridor: Corridor | null = null,
  pools: Pools | null = null,
  frontAfter = -1,
  beat = 0,
  heart: Float64Array | null = null,
  beamsBefore = -1,
  bolts: Pool<Entity> | null = null,
): void {
  /*
    ⚠️ **`beat` IS HOW HARD THE HEART THE PLAYER HEARS IS BEATING THIS FRAME — 0401**, from nothing to
    one; the caller reads it off the music's clock, and this file only draws it. **`heart` IS WHERE THE
    HEART IS**, `[along, across]` in the world, or `null` with no heart on the field — the vessels into
    it are laid to it (0400).
  */
  surface.clear();
  /*
    ⚠️ **BEFORE THE SKY, BECAUSE IT IS SLOWER THAN THE SKY.** A landmark's `depth` is below every
    field's — 0203 kept 0112's *slower* clause and struck only *no edge* — so drawing it after the
    star fields would put the slowest-moving thing on screen in front of faster ones, which is
    parallax inversion and reads as the object being stuck to the glass. Behind everything, moving
    least, is the one arrangement that says *far away* twice.
  */
  paintLandmarks(surface, view, cameraAlong, landmarks, levelOrigin, time);
  paintSky(surface, view, cameraAlong, sky, time, beat);
  // The vessels into the heart, over the sky whose trunks they leave and under everything — 0400.
  paintArteries(surface, view, cameraAlong, sky, heart, beat);
  /*
    ⚠️ **OVER THE SKY AND UNDER EVERY BODY — 0340**, on the room's own terms one paragraph down: the
    streaks are what the sky does at speed, so they belong to it, and the one absolute in this file is
    that the player never loses their own ship behind something. A no-op on every frame of every
    level, because `warp` is nought outside a crossing.
  */
  paintWarp(surface, view, cameraAlong, warp);
  /*
    ⚠️ **AFTER THE SKY AND BEFORE EVERY BODY — 0335.** A room is architecture: it stands in FRONT of
    the starfield, because a wall you can see stars through is not one, and BEHIND everything that
    can kill the player, because this file's one absolute is that nothing is ever lost behind
    scenery.
  */
  // The corridor that arrives at it, in the same stone and on the room's own terms — 0348. Stone only:
  // a wall drawn in front of what is in it waits for the bodies (0383, below).
  if (corridor !== null && !corridor.front) paintCorridor(surface, view, corridor, cameraAlong);
  paintRoom(surface, view, room, cameraAlong);
  /*
    ⚠️ **BEHIND EVERY BODY AND IN FRONT OF THE SKY.** It is a piece of information about the rules
    rather than a thing in the world, and the one absolute in this file's draw order is that the
    player must never lose a bullet — or their own ship — behind something. Drawn last it would be a
    row of marks over the top of the lane at the exact distance the player is most likely to be
    dodging at.
  */
  paintBound(surface, view, bound);
  for (let layer = 0; layer < layers.length; layer++) {
    /*
      ⚠️ **A BOSS'S BEAM LEAVES FROM UNDER ITS GUN — 0459.** *"The lazers are firing above the graphic
      sprites instead of below it."* 0452 put every root on its barrel and the picture still read as a
      line laid over the bird, because the stroke and its glow were drawn after the hull. Stroked
      before the boss's body layers, the barrel, the beak and the head stand over the root.
    */
    if (layer === beamsBefore && bolts !== null) paintBolts(surface, view, bolts, cameraAlong, alpha, true);
    const entities = layers[layer]!;
    const count = entities.size;
    /*
      ⚠️ **`swell` IS 1 FOR MOST THINGS** — a floating pickup breathes on it since 0431 and a blade's
      whirl scales it. **FOR A CHAIN'S BODY — 0283** it is a SIZE rather than an
      animation: a node is drawn at the animal's cross-section where it stands, and that number never
      moves once the node is placed. The landmark's own note above weighs scale-swell against a second
      baked frame and picks scale for one mark; this is the second, on the same terms and for the same
      reason — a serpent tapers from fifteen units to two, and a sprite slot per thickness would band
      visibly at every change.

      ⚠️ **The comment is out here rather than beside the blit, and that is not tidiness.**
      `scripts/probes/0025-frame.mjs` and `scripts/probes/0027-picture.mjs` anchor on the two lines
      below being adjacent; a paragraph between them strands both, and a stranded probe is a guard
      nobody is proving — 0019.

      ⚠️ **AND `turn` IS 0 FOR EVERYTHING BUT A CREATURE FLYING A CURVE — 0306**, interpolated like the
      position it rides with and the SHORT way round: a head turning through π between two steps goes
      the way it went, not back the long way. At 0 the backend draws exactly the blit it always did.
    */
    for (let i = 0; i < count; i++) {
      const e = entities.at(i);
      const along = e.prevAlong + (e.along - e.prevAlong) * alpha;
      const across = e.prevAcross + (e.across - e.prevAcross) * alpha;
      let swing = e.turn - e.prevTurn;
      if (swing > Math.PI) swing -= Math.PI * 2;
      else if (swing < -Math.PI) swing += Math.PI * 2;
      const turn = e.prevTurn + swing * alpha;
      const inView = along - cameraAlong;
      surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale * e.swell * (1 + e.throb * beat), turn);
    }
    if (layer === frontAfter) paintFront(surface, view, corridor, pools, cameraAlong, time);
  }
  // A caller that names no layer — a fixture, a bench of scenery — gets the front wall over everything.
  if (frontAfter < 0 || frontAfter >= layers.length) paintFront(surface, view, corridor, pools, cameraAlong, time);
}

/**
 * A wall drawn IN FRONT of the bodies in it — 0383: the Mire's bank, the bed of pools it lies in, and
 * the bubbles rising off them.
 *
 * ⚠️ **AFTER THE BODIES AND BEFORE WHAT FLIES — `frontAfter`, which is the enemies' layer.** A thing in
 * acid is under its surface: a flanker rising out of it (*"rise through unbroken acid"*) and the end
 * boss's lower body standing in it. And this file's one absolute still holds — *nothing is ever lost
 * behind scenery* — because what the acid covers is only ever what is in it: a body that touches the
 * shore bursts on the step it does (0349), and a shot breaks at the face. The bursts, every shot, the
 * player's weapons and the ship are all later layers, and are drawn over it.
 */
function paintFront(surface: Surface, view: View, corridor: Corridor | null, pools: Pools | null, cameraAlong: number, time: number): void {
  if (corridor === null || !corridor.front) return;
  paintCorridor(surface, view, corridor, cameraAlong);
  const beds = corridor.beds;
  const extent = corridor.bedExtent;
  if (beds.length === 0 || extent <= 0) return;
  /*
    The bed, on the world's grid from the corridor's own start, one half of the drawing after another
    (`mireBedA`, `mireBedB` — `src/content/sprites.ts` has why it is two). Blitted centred on the lane,
    which a tile the lane's width covers exactly. Nothing allocates.
  */
  const period = extent * beds.length;
  const first = Math.floor((cameraAlong - extent - corridor.from) / extent);
  const stop = cameraAlong + view.alongSpan + extent;
  for (let n = first; corridor.from + n * extent < stop; n++) {
    const inView = corridor.from + n * extent + extent / 2 - cameraAlong;
    const across = view.acrossSpan / 2;
    surface.blit(beds[((n % beds.length) + beds.length) % beds.length]!, screenX(view, inView, across), screenY(view, inView, across), view.scale);
  }
  if (pools === null) return;
  // The bubbles over the bed's pools, a whole drawing at a time — `paintBubbles`, 0353's own arithmetic.
  const firstPeriod = Math.floor((cameraAlong - period - corridor.from) / period);
  for (let p = firstPeriod; corridor.from + p * period < stop; p++) {
    paintBubbles(surface, view, corridor.from + p * period - cameraAlong, period, pools, time);
  }
}

/**
 * A scene with no sky. Module-level so the default argument allocates nothing per frame.
 *
 * ⚠️ `[]` written as a default parameter is a fresh array on every call that omits it — sixty times a
 * second, from the one file 0025 scans hardest.
 */
// @setup: one empty array for the lifetime of the module.
const NO_SKY: Sky = [];

/*
  ── THE BOLT: THE ONE THING IN THE GAME THAT IS STROKED RATHER THAN BLITTED ─────────────────────

  `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`. A link of chain lightning is an
  entity at its landing point carrying where it started (`fromAlong`, `fromAcross` on `Entity`), and
  what the player sees is a jagged line between the two, re-jagged every couple of frames so it
  flickers, with a short twig off its side. None of that can be a bitmap: the two ends are wherever
  the model put them, and `blit` cannot rotate.

  ⚠️ **EVERY NUMBER HERE IS IN WORLD UNITS AND IS SCALED AT THE SURFACE** — 0023, nothing is authored
  in screen space. The width is a fraction of a lane unit; the jag and the twig are fractions of the
  link's own length **up to a ceiling in lane units** (0302), so a bolt keeps its figure however far
  the gun reaches; and every one of them is multiplied by `view.scale` on the way out.

  ⚠️ **THE JAG IS A HASH, NOT A STREAM.** A `Rng` here would be a cosmetic roll consuming a stream
  every frame (0021), and a painter that draws twice per step — interpolation — would advance it
  twice. A hash of the link's seed, the vertex and the page is the same picture however many times
  it is asked for, which is what a painter has to be.
*/

/** Steps a link stays on screen after it has landed. Short: lightning is a flash, not a beam. */
export const BOLT_STEPS = 8;
/**
 * Vertices on a link, both ends included. Thirteen since 0470, from nine: at nine a link was a wire
 * with four kinks in it, and lightning is a channel that turns every few units. The jag's amplitude
 * is unchanged; what changed is how often it is sampled.
 */
const BOLT_VERTICES = 13;
/** Vertices on the twig that branches off a link. */
const TWIG_VERTICES = 3;
/** Stroke width of the core, in world units. The glow under it is four times this, the flash fourteen — 0238. */
const BOLT_WIDTH = 0.5;
/**
 * The Catherine wheel's tether's ripple — 0545: at most a unit off the line, three waves along it,
 * running along it a little each step. Its width is its link's `radius`, which the frame sets to how
 * far either side of the line it lands, and is drawn as a beam's is, so it is as wide as it hits.
 */
const TETHER_RIPPLE = 0.9;
const TETHER_WAVES = 3 * Math.PI * 2;
const TETHER_RUN = 0.35;
/*
  ── THE TETHER CRACKLES — 0549 ───────────────────────────────────────────────────────────────────

  *"The tether also needs some more depth to it and should be slightly thinner, it needs to look more
  crackling and dynamic."* Three things over 0545's one rippling cord. The cord itself is a rope of
  fire (`ROPE_LAYERS`), its ripple two waves running opposite ways so it writhes rather than slides. Over
  it, two filaments of the same fire jag about it on the bolt's own hash, re-rolled every
  `BOLT_PAGE_STEPS` as lightning is — the crackle — pinned at both ends and widest at its middle. And
  two sparks jump along the first filament from page to page. Five strokes a tether, all counted.

  The tether lets go when its wheel starts to burn down (0549: at 3.4 s; 0551: at 2.27 s); it fades over its last
  `TETHER_FADE_STEPS`, read off the steps it has left (`holdFor`).
*/
/** The second wave on the cord, running the other way: amplitude, waves along it, and speed. */
const TETHER_RIPPLE_BACK = 0.4;
const TETHER_WAVES_BACK = 5 * Math.PI * 2;
const TETHER_RUN_BACK = 0.6;
/**
 * How far a crackling filament strays off the cord, in world units. 1.1 at first, on the bolt's thirteen
 * vertices: photographed, a 160-unit tether had legs of twelve units and the filaments read as a kinked
 * double line. Finer and wider is what crackles.
 */
const TETHER_CRACKLE = 1.8;
/** Vertices on a tether, both ends included — a leg of five units on a 160-unit throw. */
const TETHER_VERTICES = 33;
/**
 * How far short of the wheel's centre the tether is drawn, in world units: the wheel's face (0.62 of its
 * 8-unit sprite's half). A bolt is stroked over everything, so a cord to the centre laid its round cap
 * and its dark rim over the white-hot heart — photographed, 0549.
 */
const TETHER_HUB = 2.5;
/** The filaments' core widths, in world units — a flash's figure at a fraction of the arc's. */
const TETHER_FILAMENT = 0.16;
const TETHER_FILAMENT_SECOND = 0.11;
/** A spark on the filament, in world units across its core. */
const TETHER_SPARK = 0.3;
/**
 * Steps the tether fades over before it lets go — two fifteenths of a second since 0551, a fifth before:
 * two thirds, with the rest of the wheel's clock, so the shape of the let-go is the one the player kept.
 */
const TETHER_FADE_STEPS = 8;
/** How many `bolt` calls one tether costs: its cord, two filaments and two sparks. */
export const STROKES_PER_TETHER = 5;
/** How far a vertex may sit off the straight line, as a fraction of the link's length. */
const BOLT_JAG = 0.16;
/** And an absolute ceiling on that, in world units, so a long link is not a wide one. */
export const BOLT_JAG_MAX = 3;
/** And a ceiling per leg, as a share of the leg's length, so a short link is not a knot — 0470. */
const BOLT_JAG_LEG = 0.5;
/** The twig's length as a fraction of its link's. */
const TWIG_SHARE = 0.3;
/**
 * And an absolute ceiling on THAT, in world units — 0302, for `BOLT_JAG_MAX`'s reason and it was
 * the half that had none.
 *
 * ⚠️ **Asked for as a look, not as a number:** *"keep the thinner size when extending it again,
 * because it looks more like lightning with the thinner graphics."* The reach ladder roughly halved
 * in 0297 and is long again in 0302, and the two things here that scale with a link's length are
 * the jag and the twig. The jag was already ceilinged and needed nothing; the twig was a bare
 * fraction, so a 55-unit bolt would have grown a 16-unit fork — a branch, where the thing the
 * player liked is a filament.
 *
 * ⚠️ **THE NUMBER IS THE LONGEST TWIG THE SHORT LADDER COULD DRAW**: 0.3 × 39, the reach at its cap
 * before this change, is 11.7. At 12 nothing the player is looking at today moves by a pixel and
 * nothing gets wider than it as the bolts get longer, which is exactly what was asked.
 */
const TWIG_MAX = 12;
/** Frames a jag pattern is held for before the next one — a flicker at half the frame rate. */
const BOLT_PAGE_STEPS = 2;
/**
 * Bright points along a link: every `BOLT_DOT_EVERY`th vertex, as a dot wider than the core — 0236.
 * *"It needs some bright points"*: a stroke of one width reads as a wire, and lightning is not a wire.
 */
const BOLT_DOT_EVERY = 2;
/**
 * The dot's width, as a multiple of the core's.
 *
 * ⚠️ **A dot at every other join, and wider — 0239.** *"It also needs some bright white dots at the
 * centre points of the joins to really lift it."* 0236 put one on every third vertex at under twice
 * the core; they read as slight thickenings. Every other join, at nearly three cores, reads as
 * points of light on the bolt. `STROKES_PER_LINK` counts the cost.
 */
const BOLT_DOT_WIDTH = 2.8;
/**
 * How many `bolt` calls one link costs: its stroke, its two twigs, and its dots. `tests/weapons.test.ts`
 * counts them against this, so the picture's cost is a stated number and not an accident.
 */
export const STROKES_PER_LINK = 3 + Math.floor((BOLT_VERTICES - 2) / BOLT_DOT_EVERY);
/**
 * ── A FLASH SNAPS AND DIES; A BEAM IGNITES AND HUMS — 0470 ─────────────────────────────────────
 *
 * *"Lightning needs to be brighter and flashier."* A link faded in a straight line over its eight
 * steps, at one width: a wire dimming. A flash is a channel that is widest and brightest the instant
 * it lands and collapses — so the fade is the life raised to `BOLT_FADE_POWER`, which keeps the first
 * steps near full and drops the last ones fast, and the core's width rides the fade between
 * `BOLT_CORE_DYING` and `BOLT_CORE_STRUCK` of `BOLT_WIDTH`. Both are the picture's and neither is
 * guarded as a number; `tests/bolt.test.ts` holds the shape — brightest and widest on the step it lands.
 */
const BOLT_FADE_POWER = 1.5;
const BOLT_CORE_STRUCK = 1.2;
const BOLT_CORE_DYING = 0.6;
/** The second twig's reach as a share of the first's — a fork, smaller than the branch it leaves. */
const TWIG_SECOND = 0.6;
/**
 * A beam switching on blooms to `BEAM_IGNITE` of its width and settles to the width it hurts over its
 * first `BOLT_STEPS` of burn — the picture of power being put through it. Wider than the hurt for an
 * eighth of a second and never narrower, which is the half of 0250's *as wide as it hurts* that
 * matters: nothing hurts where nothing is drawn.
 */
const BEAM_IGNITE = 1.25;
/**
 * And while it is held, the whole column breathes between `BEAM_HUM_FLOOR` and full over
 * `BEAM_HUM_PERIOD` steps — half a second, under two cycles a second, well short of the three that
 * a flashing area the size of a beam must stay under. Shallow and slow on purpose: a hum, not a strobe.
 */
const BEAM_HUM_FLOOR = 0.88;
const BEAM_HUM_PERIOD = 30;

// @setup: one dot's worth of buffer for the module's lifetime.
const DOT = new Float32Array(2);

// @setup: one buffer each for the module's lifetime, refilled per link and read before the call returns.
const LINK = new Float32Array(BOLT_VERTICES * 2);
// @setup: the twig's own, for the same reason and lifetime.
const TWIG = new Float32Array(TWIG_VERTICES * 2);

// @setup: a tether's own, finer than a link — 0549.
const TETHER = new Float32Array(TETHER_VERTICES * 2);

// @setup: a jagged beam's knots, both ends included, refilled per beam — 0388.
const BEAM_PATH = new Float32Array(BEAM_MAX_POINTS * 2);

/**
 * Every live link, stroked. Called after `paintScene`, so a bolt is over everything it struck.
 *
 * ⚠️ **One `bolt` call per link and one per twig, and `tests/budget.test.ts` counts them** — a bolt
 * is not hidden inside a blit's count and cannot be, which is the whole of why `Surface` grew a verb
 * rather than a polygon.
 *
 * ⚠️ **`beams` SAYS WHICH HALF — 0459.** A boss's laser is drawn UNDER the animal that fires it,
 * from inside `paintScene`, and every other link over everything afterwards: `true` strokes the beams
 * alone, `false` everything but, and `null` the lot, which is what a caller with no boss in it wants.
 */
export function paintBolts(
  surface: Surface,
  view: View,
  bolts: Pool<Entity>,
  cameraAlong: number,
  alpha: number,
  beams: boolean | null = null,
): void {
  const count = bolts.size;
  for (let i = 0; i < count; i++) {
    const e = bolts.at(i);
    if (beams !== null && (e.kind === BEAM_BOLT_KIND) !== beams) continue;
    const endAlong = e.prevAlong + (e.along - e.prevAlong) * alpha;
    const endAcross = e.prevAcross + (e.across - e.prevAcross) * alpha;
    const length = Math.sqrt(e.fromAlong * e.fromAlong + e.fromAcross * e.fromAcross);
    if (length <= 0) continue;
    // The unit normal to the link, in world units — what a vertex is pushed along.
    const nAlong = -e.fromAcross / length;
    const nAcross = e.fromAlong / length;
    /*
      ⚠️ **THE SERPENT'S LIGHTNING IS A WARNING LINE FIRST — 0248.** A bolt with `RAIN_BOLT_KIND`
      whose life is still past the strike's own steps is drawn as the line it will strike along:
      straight, thin, dim, in the enemy's ink, and with none of the bolt's points or twig. Once its
      life is inside `BOLT_STEPS` it is the arc's bolt exactly, hostile. The player is given the
      line for as long as the row's `warning` says, which is what makes the strike learnable.
    */
    /*
      ⚠️ **AND A LASER IS A STRAIGHT ONE THAT STAYS ON — 0250.** A bolt with `BEAM_BOLT_KIND` warns
      the same way while its life is past its own `holdFor`, and is then a straight hostile stroke
      as wide as it hurts — its `radius` is the half-width the frame reads — with no flicker, no points
      and no twig, full until its last `BOLT_STEPS`, on which it fades. A beam drawn thinner than it
      hurts would be a lie about where the player may be. One that jags does so on a path it keeps
      from its warning to its fade, which is the difference from lightning (0388, above).
    */
    /*
      ⚠️ **THE CATHERINE WHEEL'S TETHER IS A ROPE OF FIRE, NOT A FLASH — 0545.** Laid every step from the
      muzzle to the wheel and drawn as a held line (its own stack since 0549, `ROPE_LAYERS`, so it is
      fire that stays on rather than a strike that collapses), in the flame's inks, writhing along its
      length as the wheel pulls it. No twig: that says *lightning*, and this is a burning cord — but
      since 0549 it crackles, two thin filaments of fire jagging about it with sparks along them.
    */
    if (e.kind === TETHER_BOLT_KIND) {
      const held = e.holdFor >= TETHER_FADE_STEPS ? 1 : e.holdFor <= 0 ? 0 : e.holdFor / TETHER_FADE_STEPS;
      const page = Math.floor(e.spin / BOLT_PAGE_STEPS);
      const last = TETHER_VERTICES - 1;
      /*
        ⚠️ **ITS START IS WHERE THE MUZZLE IS DRAWN, NOT WHERE THE WHEEL IS DRAWN PLUS THIS STEP'S GAP —
        0551.** Played: *"the end of the tether also starts on the hood of the car and then moves forward
        so the end attaches to the weapon nozzle."* The wheel's end is interpolated as every body is; an
        offset from it that is not interpolated too puts the muzzle's end a fraction of the wheel's last
        step behind the muzzle — five units, on the hood, while the wheel flies out at full speed, and
        nothing once it hangs. So the offset is drawn between the step before's and this one's.
      */
      const fromAlong = e.prevFromAlong + (e.fromAlong - e.prevFromAlong) * alpha;
      const fromAcross = e.prevFromAcross + (e.fromAcross - e.prevFromAcross) * alpha;
      const span = Math.sqrt(fromAlong * fromAlong + fromAcross * fromAcross);
      if (span <= 0) continue;
      const tAlong = -fromAcross / span;
      const tAcross = fromAlong / span;
      // It stops at the wheel's face, not its heart; `t` runs from the muzzle (0) to there (1).
      const reach = span > TETHER_HUB ? 1 - TETHER_HUB / span : 0;
      // The cord, then each filament over it: pass -1 is the cord, 0 and 1 the filaments.
      for (let pass = -1; pass < 2; pass++) {
        for (let v = 0; v <= last; v++) {
          const t = (v / last) * reach;
          // Pinned at both ends; two waves running opposite ways, a unit or so at most in the middle.
          const swell = Math.sin((v / last) * Math.PI);
          let off = swell * (TETHER_RIPPLE * Math.sin(t * TETHER_WAVES + e.spin * TETHER_RUN) + TETHER_RIPPLE_BACK * Math.sin(t * TETHER_WAVES_BACK - e.spin * TETHER_RUN_BACK));
          // The crackle rises off the cord within a few joins of each end rather than over the whole length.
          const lift = v < 4 ? v / 4 : v > last - 4 ? (last - v) / 4 : 1;
          if (pass >= 0) off += lift * TETHER_CRACKLE * jag(pass * 7919 + 1, v, page);
          const along = endAlong + fromAlong * (1 - t) + tAlong * off;
          const across = endAcross + fromAcross * (1 - t) + tAcross * off;
          const inView = along - cameraAlong;
          TETHER[v * 2] = screenX(view, inView, across);
          TETHER[v * 2 + 1] = screenY(view, inView, across);
        }
        if (pass === -1) {
          surface.bolt(TETHER, TETHER_VERTICES, e.radius * BEAM_STROKE * view.scale, held, BOLT_FLAME, BOLT_ROPE);
          continue;
        }
        surface.bolt(TETHER, TETHER_VERTICES, (pass === 0 ? TETHER_FILAMENT : TETHER_FILAMENT_SECOND) * view.scale, held * (pass === 0 ? 0.9 : 0.6), BOLT_FLAME);
        if (pass !== 0) continue;
        // Two sparks on the first filament, jumping from join to join with its page.
        for (let s = 0; s < 2; s++) {
          const at = 1 + (Math.floor(((jag(31 + s, 0, page) + 1) / 2) * (last - 1)) % (last - 1));
          DOT[0] = TETHER[at * 2]!;
          DOT[1] = TETHER[at * 2 + 1]!;
          surface.bolt(DOT, 1, TETHER_SPARK * view.scale, held, BOLT_FLAME);
        }
      }
      continue;
    }
    const beam = e.kind === BEAM_BOLT_KIND;
    const hostile = e.kind === RAIN_BOLT_KIND || beam;
    const tone = hostile ? BOLT_HOSTILE : BOLT_PLAYER;
    const warning = hostile && e.lifeFor > (beam ? e.holdFor : BOLT_STEPS);
    /*
      ⚠️ **AND A JAGGED BEAM IS A ZIGZAG, WARNED ALONG THE SAME ZIGZAG — 0388.** *"A random jagged
      laser"*, asked with its warning on the exact path it will fire along. The knots are
      `src/sim/jag.ts`'s, the ones the frame hurts along, from the far end (knot 0) to the mouth; the
      width and the fade are a straight beam's exactly, so only where it runs has changed.
    */
    if (beam && e.knots > 0) {
      // The row's own count since 0453; `tests/quetzal.test.ts` holds every row under the buffer's.
      const points = beamPoints(e.knots);
      for (let i = 0; i < points; i++) {
        const inView = endAlong + e.fromAlong * beamT(e.spin, e.knots, i) - cameraAlong;
        // Its zigzag and its lean — 0453's fan — from the one function the frame hurts along.
        const across = endAcross + beamShift(e, i);
        BEAM_PATH[i * 2] = screenX(view, inView, across);
        BEAM_PATH[i * 2 + 1] = screenY(view, inView, across);
      }
      if (warning) {
        surface.bolt(BEAM_PATH, points, BOLT_WIDTH * WARNING_WIDTH * view.scale, WARNING_ALPHA, BOLT_HOSTILE);
      } else {
        const held = beamHum(e);
        surface.bolt(BEAM_PATH, points, e.radius * BEAM_STROKE * beamBloom(e) * view.scale, held, BOLT_HOSTILE, BOLT_BEAM);
      }
      continue;
    }
    /*
      The jag: a share of the link's length, under an absolute ceiling (0302), and under a share of
      one LEG — 0470. At thirteen vertices a short link's legs are a unit or two long, and a swing of
      a sixth of the whole link on every one of them is a knot, not a bolt; a leg may swing half its
      own length and no further, which only a link shorter than about forty units ever feels.
    */
    const legCap = (BOLT_JAG_LEG * length) / (BOLT_VERTICES - 1);
    const jagAmp = BOLT_JAG * length > BOLT_JAG_MAX ? BOLT_JAG_MAX : BOLT_JAG * length;
    const amp = warning || beam ? 0 : jagAmp > legCap ? legCap : jagAmp;
    const page = Math.floor(e.lifeFor / BOLT_PAGE_STEPS);
    const seed = e.spin;
    const last = BOLT_VERTICES - 1;
    for (let v = 0; v <= last; v++) {
      const t = v / last;
      // Pinned at both ends, so the bolt leaves the nose and arrives on the body exactly.
      const off = v === 0 || v === last ? 0 : jag(seed, v, page) * amp;
      const along = endAlong + e.fromAlong * (1 - t) + nAlong * off;
      const across = endAcross + e.fromAcross * (1 - t) + nAcross * off;
      const inView = along - cameraAlong;
      LINK[v * 2] = screenX(view, inView, across);
      LINK[v * 2 + 1] = screenY(view, inView, across);
    }
    if (warning) {
      surface.bolt(LINK, BOLT_VERTICES, BOLT_WIDTH * WARNING_WIDTH * view.scale, WARNING_ALPHA, BOLT_HOSTILE);
      continue;
    }
    if (beam) {
      // The stroke's own width is a quarter of the visible body (`src/render/canvas.ts`), so a
      // quarter of the hurt width draws the body exactly as wide as the beam hurts.
      const held = beamHum(e);
      surface.bolt(LINK, BOLT_VERTICES, e.radius * BEAM_STROKE * beamBloom(e) * view.scale, held, BOLT_HOSTILE, BOLT_BEAM);
      continue;
    }
    // Fades over its life: a flash, brightest and widest the step it lands, collapsing after — 0470.
    const fade = Math.pow(e.lifeFor / BOLT_STEPS, BOLT_FADE_POWER);
    const core = BOLT_WIDTH * (BOLT_CORE_DYING + (BOLT_CORE_STRUCK - BOLT_CORE_DYING) * fade);
    surface.bolt(LINK, BOLT_VERTICES, core * view.scale, fade, tone);
    // The bright points: a dot on every third inner vertex, over the stroke — 0236.
    for (let v = BOLT_DOT_EVERY; v < last; v += BOLT_DOT_EVERY) {
      DOT[0] = LINK[v * 2]!;
      DOT[1] = LINK[v * 2 + 1]!;
      surface.bolt(DOT, 1, BOLT_WIDTH * BOLT_DOT_WIDTH * view.scale, fade, tone);
    }
    /*
      The twigs: one from a vertex a third to two thirds along, out to the side the hash says, and
      on again at half the length — two segments, so it forks rather than spikes. And a second, smaller,
      off the other side from a vertex nearer the far end — 0470: one branch is a wire with a kink in
      it, two is a thing that forked.
    */
    const reach = TWIG_SHARE * length > TWIG_MAX ? TWIG_MAX : TWIG_SHARE * length;
    const from = 4 + ((seed + page) & 3);
    const side = jag(seed, from + 17, page) < 0 ? -1 : 1;
    paintTwig(surface, view, e, cameraAlong, endAlong, endAcross, nAlong, nAcross, length, amp, page, from, side, reach, core * 0.6 * view.scale, fade * 0.8, tone);
    const fork = 2 + (((seed >> 3) + page) & 3);
    paintTwig(surface, view, e, cameraAlong, endAlong, endAcross, nAlong, nAcross, length, amp, page, fork, -side, reach * TWIG_SECOND, core * 0.5 * view.scale, fade * 0.7, tone);
  }
}

/**
 * One twig off a link: from vertex `from`, out to `side` for `reach`, bending back towards the far
 * end as it goes and jagged on the way. A module function and not a closure, so the frame allocates
 * nothing for it (0022); its arguments are the link's own numbers, already in hand.
 */
function paintTwig(
  surface: Surface,
  view: View,
  e: Entity,
  cameraAlong: number,
  endAlong: number,
  endAcross: number,
  nAlong: number,
  nAcross: number,
  length: number,
  amp: number,
  page: number,
  from: number,
  side: number,
  reach: number,
  width: number,
  alpha: number,
  tone: BoltTone,
): void {
  const seed = e.spin;
  const last = BOLT_VERTICES - 1;
  const t0 = from / last;
  const rootAlong = endAlong + e.fromAlong * (1 - t0) + nAlong * jag(seed, from, page) * amp;
  const rootAcross = endAcross + e.fromAcross * (1 - t0) + nAcross * jag(seed, from, page) * amp;
  const back = -e.fromAlong / length;
  const backAcross = -e.fromAcross / length;
  for (let v = 0; v < TWIG_VERTICES; v++) {
    const s = v / (TWIG_VERTICES - 1);
    const out = side * reach * s;
    const along = rootAlong + nAlong * out + back * reach * s * 0.5 + nAlong * jag(seed, v + 40 + from, page) * amp * s;
    const across = rootAcross + nAcross * out + backAcross * reach * s * 0.5 + nAcross * jag(seed, v + 40 + from, page) * amp * s;
    const inView = along - cameraAlong;
    TWIG[v * 2] = screenX(view, inView, across);
    TWIG[v * 2 + 1] = screenY(view, inView, across);
  }
  surface.bolt(TWIG, TWIG_VERTICES, width, alpha, tone);
}

/*
  ── THE STORM ON THE BODY — `docs/decisions/0487-the-storm-is-lightning.md` ───────────────────────────

  ⚠️ **STROKED NODE TO NODE THROUGH THE BODY AS IT IS DRAWN THIS FRAME**, each node where the renderer
  puts it — between its last place and this one — so the lightning is on the flesh it crawls over and
  never a step behind it. Two jagged vertices a link, swung off the line by at most `BODY_BOLT_JAG` of the
  node's own girth, so a bolt never leaves the body: the warned columns are what comes for the ship.
  The same verb as every bolt (0233), additive like every light (0470), in the enemy's ink.
*/

/** How far a body bolt's vertex swings off the line between two nodes, as a share of the node's radius. */
const BODY_BOLT_JAG = 0.45;
/** Steps a body bolt holds one shape before it re-jags, so it crackles rather than shimmers. */
const BODY_BOLT_PAGE = 2;
/** The core's width, as a share of a link's. A body bolt is a thread on the animal, not a strike. */
const BODY_BOLT_WIDTH = 0.7;
// @setup: one buffer for the module's lifetime: three vertices a link over the longest span, and the end.
const BODY_PATH = new Float32Array((3 * (BODY_BOLT_SPAN - 1) + 1) * 2);

/**
 * Stroke a boss's body bolts — 0487: every lit slot of `table`, through `body`'s nodes from its first
 * to its last. Nothing allocates.
 */
export function paintBodyBolts(surface: Surface, view: View, table: Int32Array, body: Pool<Entity>, cameraAlong: number, alpha: number, steps: number): void {
  const page = Math.floor(steps / BODY_BOLT_PAGE);
  for (let s = 0; s < BODY_BOLT_SLOTS; s++) {
    const at = s * BODY_BOLT_FIELDS;
    const from = table[at]!;
    const to = table[at + 1]!;
    if (from < 0 || table[at + 4] !== 1 || to >= body.size || to <= from) continue;
    const seed = table[at + 2]!;
    let count = 0;
    for (let n = from; n <= to; n++) {
      const node = body.at(n);
      const along = node.prevAlong + (node.along - node.prevAlong) * alpha;
      const across = node.prevAcross + (node.across - node.prevAcross) * alpha;
      BODY_PATH[count * 2] = screenX(view, along - cameraAlong, across);
      BODY_PATH[count * 2 + 1] = screenY(view, along - cameraAlong, across);
      count++;
      if (n === to) break;
      // Two vertices a third and two thirds of the way to the next node, swung off the line.
      const next = body.at(n + 1);
      const nextAlong = next.prevAlong + (next.along - next.prevAlong) * alpha;
      const nextAcross = next.prevAcross + (next.across - next.prevAcross) * alpha;
      const dAlong = nextAlong - along;
      const dAcross = nextAcross - across;
      const length = Math.sqrt(dAlong * dAlong + dAcross * dAcross);
      const nAlong = length > 0 ? -dAcross / length : 0;
      const nAcross = length > 0 ? dAlong / length : 0;
      const swing = node.radius * BODY_BOLT_JAG;
      for (let k = 1; k <= 2; k++) {
        const off = jag(seed, (n - from) * 2 + k, page) * swing;
        const pAlong = along + (dAlong * k) / 3 + nAlong * off;
        const pAcross = across + (dAcross * k) / 3 + nAcross * off;
        BODY_PATH[count * 2] = screenX(view, pAlong - cameraAlong, pAcross);
        BODY_PATH[count * 2 + 1] = screenY(view, pAlong - cameraAlong, pAcross);
        count++;
      }
    }
    surface.bolt(BODY_PATH, count, BOLT_WIDTH * BODY_BOLT_WIDTH * view.scale, 1, BOLT_HOSTILE);
  }
}

/**
 * How loud a held beam is this step — 0470: full for its ignition and its hum's peaks, breathing down
 * to `BEAM_HUM_FLOOR` between them, and fading over its last `BOLT_STEPS` as it always did. Read off
 * `lifeFor` and nothing else, so the painter draws the same frame however often it is asked.
 */
function beamHum(e: Entity): number {
  const out = e.lifeFor > BOLT_STEPS ? 1 : e.lifeFor / BOLT_STEPS;
  const burnt = e.holdFor - e.lifeFor;
  if (burnt < BOLT_STEPS) return out;
  const hum = BEAM_HUM_FLOOR + (1 - BEAM_HUM_FLOOR) * (0.5 + 0.5 * Math.cos(((burnt - BOLT_STEPS) * 2 * Math.PI) / BEAM_HUM_PERIOD));
  return out * hum;
}

/** How much wider than it hurts a beam is drawn this step — `BEAM_IGNITE` as it lights, one once it has settled. */
function beamBloom(e: Entity): number {
  const burnt = e.holdFor - e.lifeFor;
  if (burnt >= BOLT_STEPS) return 1;
  return 1 + (BEAM_IGNITE - 1) * (1 - burnt / BOLT_STEPS);
}

/**
 * A warning line's width, as a share of a bolt's, and its alpha — 0248. Thin and dim: a line the
 * player reads as *here*, not a thing that is already hurting them. Sized once the picture had
 * been looked at, which is what 0027 asks of anything the player watches.
 */
const WARNING_WIDTH = 0.6;
const WARNING_ALPHA = 0.45;

/**
 * A beam's stroke width as a share of its half-width — 0250. The canvas draws a bolt's visible
 * glow at four times the stroke (`src/render/canvas.ts`), so half the half-width — a quarter of the
 * full width — is what puts the glow's edge exactly where the beam stops hurting.
 */
const BEAM_STROKE = 0.5;

/** How far a far root withdraws along the lane as the room opens, in world units — 0488: off the screen. */
const ROOT_WITHDRAW = 60;

/**
 * The edge of the player's box: one dash per tiling period, straight down the lane.
 *
 * ⚠️ **A FIXED number of blits and it does not vary with anything** — `acrossSpan / extent`, which is
 * ten on every device, because the lane is a fixed hundred units (0023) whatever the screen is doing.
 * That is the same property `paintSky` has and the same one `tests/budget.test.ts` holds it to: a
 * count that moved with the camera would be a seam the player can see travelling.
 *
 * ⚠️ **Nothing allocates.** A divide, a ceiling, and a loop over numbers.
 */
/**
 * The room's three walls: the two lane edges and the far one — 0335.
 *
 * ⚠️ **ONLY WHAT IS ON THE SCREEN, AND THAT IS WHAT MAKES THE COUNT FIXED.** The side walls are
 * clipped to the view before they are tiled, so a room a thousand units long costs the same as one
 * exactly a screen wide — the same property `paintSky` has and the one `tests/budget.test.ts` holds
 * every background to. What it costs at rest is about thirty blits.
 *
 * ⚠️ **THE WALLS STAND JUST OUTSIDE THE LANE AND JUST BEYOND THE BOX**, so nothing the player must
 * see is ever behind one: the ship is clamped inside `PLAYER_MARGIN` of the lane and inside
 * `PLAYER_LEAD` along it, which is exactly why it cannot reach them. They are the picture of a bound
 * that already existed — 0074 — rather than a new rule.
 *
 * ⚠️ **Nothing allocates.** Two divides, two ceilings and a loop over numbers.
 */
function paintRoom(surface: Surface, view: View, room: Room | null, cameraAlong: number): void {
  if (room === null) return;
  /*
    ⚠️ **AND THE WORLD TREE'S ROOTS, PLACED — 0488.** Each piece where its row put it, from the resting
    camera, turned as it said. The far ones withdraw off the screen as the far wall would part. Under
    every body, as the wall is. Nothing allocates: the row's list is read, never built.
  */
  const pieces = room.pieces;
  if (pieces !== null) {
    /*
      ⚠️ **THE FRAME HANGS FROM THE SCREEN'S FAR EDGE, NOT ITS NEAR ONE — 0498.** The pieces are
      authored on the 16:9 screen, the narrowest any device gets. A phone shows up to 47 units more
      along, and placed from the near edge the far roots stood at four fifths of it with open sky past
      them and the serpent's body running across that sky. Moved on by however much more this screen
      shows, the frame is the same picture on every device: the far side framed, the near side open.
      Every piece moves AWAY from the ship, so the picture of the bound is still outside the bound.
    */
    const past = boxPastFor(view.alongSpan);
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i]!;
      const along = room.rest + piece.along + past + (piece.far ? room.open * ROOT_WITHDRAW : 0) - cameraAlong;
      surface.blit(piece.sprite, screenX(view, along, piece.across), screenY(view, along, piece.across), view.scale, piece.turn);
    }
  }
  if (room.sprite < 0 || room.extent <= 0) return;
  const half = room.extent / 2;
  /*
    ⚠️ **THE WALL'S FACE IS THE EDGE OF THE PLAYER'S BOX, AND THE REST OF IT IS OFF THE SCREEN.** A
    first pass centred the sides a half-tile OUTSIDE the lane — which is outside the viewport, because
    the view shows `across` 0 to 100 exactly and the gutters are not world. They were drawn every
    frame and no pixel of them ever landed; the bench photograph is the only thing that said so
    (`docs/decisions/0027-measure-the-picture-not-the-model.md`).

    ⚠️ **AND THE BOX'S EDGE IS THE RIGHT PLACE RATHER THAN THE LANE'S.** `src/sim/flight.ts` clamps
    the ship `PLAYER_MARGIN` inside the lane, so the boundary the player can actually feel is there —
    0074's own rule that a line drawn NEAR the wall rather than AT it teaches something false. What
    shows is the six units between the two, which is the room the game has to give.
  */
  const near = PLAYER_MARGIN - half;
  const far = ACROSS_SPAN - PLAYER_MARGIN + half;
  // ⚠️ `room.to` is the narrowest view's wall, and this view's box reaches `boxPastFor` further — 0552.
  const to = room.to + boxPastFor(view.alongSpan);
  paintWalls(surface, view, room.sprite, room.extent, room.from, to, near, far, cameraAlong, NO_PASSAGES);
  // And the far wall across the lane, its own face at the forward edge of the box, corner to corner.
  const endInView = to - cameraAlong + half;
  if (endInView > view.alongSpan + room.extent || endInView < -room.extent) return;
  const down = Math.ceil((ACROSS_SPAN + room.extent) / room.extent);
  /*
    ⚠️ **AND IT PARTS FROM THE MIDDLE OUTWARD — 0337.** The gap is centred on the lane and grows to
    the whole of it, so what the player sees is a way through opening where they are already flying.
    A tile is dropped once the gap has reached it, which is the cheapest possible retraction and the
    only one that costs no extra blits: an opening wall draws FEWER of them, not more.
  */
  const gap = (room.open * (ACROSS_SPAN + room.extent)) / 2;
  const middle = ACROSS_SPAN / 2;
  for (let i = 0; i <= down; i++) {
    const across = near + i * room.extent;
    if (gap > 0 && Math.abs(across - middle) < gap) continue;
    surface.blit(room.sprite, screenX(view, endInView, across), screenY(view, endInView, across), view.scale);
  }
}

/** A corridor with no openings. Module-level, so a room allocates nothing to say so. */
// @setup: one empty array for the lifetime of the module.
const NO_PASSAGES = new Float64Array(0);

/**
 * Two runs of wall tiles along the lane, from `from` to `to`, on the WORLD's grid — 0348.
 *
 * ⚠️ **ON THE WORLD'S GRID, AND THE ROOM'S WERE NOT.** 0335 started the run at `camera − extent` once
 * the camera was past the room's open side, which put every tile a fixed distance from the CAMERA: a
 * band that did not scroll. At rest nobody could tell; a corridor arriving at the room in the same
 * stone would have slid against it at the joint. The first tile is now the first whole period of the
 * run that reaches the view, counted from `from`.
 *
 * ⚠️ **AN OPENING DROPS A TILE, AND ONLY ON ITS OWN SIDE** — so a passage costs fewer blits, never
 * more, and the count on a frame is bounded by the view exactly as it was. Nothing allocates.
 */
function paintWalls(
  surface: Surface,
  view: View,
  sprite: number,
  extent: number,
  from: number,
  to: number,
  near: number,
  far: number,
  cameraAlong: number,
  passages: Float64Array,
): void {
  const skip = Math.max(0, Math.floor((cameraAlong - extent - from) / extent));
  const stop = Math.min(to, cameraAlong + view.alongSpan + extent);
  for (let start = from + skip * extent; start < stop; start += extent) {
    const along = start + extent / 2;
    const inView = along - cameraAlong;
    if (!opened(passages, start, start + extent, -1)) {
      surface.blit(sprite, screenX(view, inView, near), screenY(view, inView, near), view.scale);
    }
    if (!opened(passages, start, start + extent, 1)) {
      surface.blit(sprite, screenX(view, inView, far), screenY(view, inView, far), view.scale);
    }
  }
}


/**
 * The corridor's two walls — 0348. `null` for a level flown in the open, which is six of the seven.
 */
/*
  ⚠️ **A CAP AT THE FACE AND MASONRY BEHIND IT, A COLUMN AT A TIME — 0350.** The corridor turns, so a
  wall is no longer a row of tiles at one height: across each twelve-unit column its face runs from
  one knot to the next, a whole number of lane units up or down (`layFaces`). The cap baked for that
  rise is placed with its face on the knots, and the room's own masonry stacks behind it out past the
  lane's edge. Straight, the cap is `wallRise6` and the picture is 0348's.

  ⚠️ **THE COUNT IS BOUNDED BY THE VIEW, AS EVERY BACKGROUND'S IS.** A column is one cap and as many
  tiles as there is stone between the face and the lane's edge — at the narrowest tier's tightest
  squeeze, about three a side. An opening skips the whole column on its side. Nothing allocates.
*/
function paintCorridor(surface: Surface, view: View, corridor: Corridor | null, cameraAlong: number): void {
  if (corridor === null || corridor.extent <= 0) return;
  const extent = corridor.extent;
  // A repeating corridor has as many knots as the world is long — 0383; its faces are read round.
  const knots = corridor.period > 0 ? Number.POSITIVE_INFINITY : corridor.faces.length / 2;
  const steepest = (corridor.caps.length - 1) / 2;
  const first = Math.max(0, Math.floor((cameraAlong - extent - corridor.from) / extent));
  const stop = Math.min(corridor.to, cameraAlong + view.alongSpan + extent);
  for (let k = first; k + 1 < knots; k++) {
    const start = corridor.from + k * extent;
    if (start >= stop) break;
    const inView = start + extent / 2 - cameraAlong;
    for (let side = -1; side <= 1; side += 2) {
      if (opened(corridor.passages, start, start + extent, side)) continue;
      const slot = side < 0 ? 0 : 1;
      const a = corridor.faces[knotOf(corridor, k) * 2 + slot]!;
      const b = corridor.faces[knotOf(corridor, k + 1) * 2 + slot]!;
      // A face a whole tile beyond the lane is a wall nobody can see — a floor's near side (0383).
      if (side < 0 ? Math.max(a, b) < -extent : Math.min(a, b) > ACROSS_SPAN + extent) continue;
      const rise = Math.max(-steepest, Math.min(steepest, b - a));
      const middle = (a + b) / 2;
      // The cap's stone is below its face; the near wall's is above, so it is the same cap turned over.
      // Where a boss stands in the wall, its acid caps instead — 0384: the same face, drawn as acid.
      const standing = start < corridor.poolTo && start + extent > corridor.poolFrom;
      const caps = standing && corridor.poolCaps.length > 0 ? corridor.poolCaps : corridor.caps;
      surface.blit(caps[rise + steepest]!, screenX(view, inView, middle), screenY(view, inView, middle), view.scale, side < 0 ? Math.PI : 0);
      for (let across = middle + side * extent; side < 0 ? across + extent / 2 > 0 : across - extent / 2 < ACROSS_SPAN; across += side * extent) {
        surface.blit(corridor.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);
      }
    }
  }
}

function paintBound(surface: Surface, view: View, bound: Bound | null): void {
  if (bound === null || bound.extent <= 0) return;
  const count = Math.ceil(view.acrossSpan / bound.extent);
  // The narrowest view's wall, moved on to this view's — 0552, the same sum the clamp makes.
  const inView = bound.inView + boxPastFor(view.alongSpan);
  for (let i = 0; i < count; i++) {
    // Centred, because `blit` centres — half a period on from the mark's own edge.
    const across = i * bound.extent + bound.extent / 2;
    surface.blit(bound.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);
  }
}

/**
 * The sky: each layer's tile, repeated along the scroll axis, offset by the camera and slowed.
 *
 * ⚠️ **A FIXED number of blits, and that is what makes it affordable.** The count is the view's span
 * divided by the tile's, plus one for the tile straddling the trailing edge — three or four per layer
 * on every device the clamp allows. `tests/budget.test.ts` holds that it does not vary with the
 * camera, which is the failure mode a wrapping background actually has: an off-by-one in the modulo
 * draws one extra tile on some frames and none on others, and the seam moves.
 *
 * ⚠️ **The tile is `ACROSS_SPAN` units square**, so it exactly covers the short axis and tiles on the
 * long one only. There is no seam across the lane, on any device — the gutters
 * (`src/sim/camera.ts`) are outside the world and get the space colour.
 *
 * ⚠️ **Nothing allocates.** A modulo, a divide, a ceiling and a loop over numbers.
 */
/**
 * Every landmark that is currently in view, at its own parallax rate.
 *
 * ⚠️ **NO ALLOCATION AND NO SORT.** `docs/decisions/0022-frame-rate-is-a-feature.md` and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` — this runs every frame, and
 * `tests/budget.test.ts` scans this file. A level places one or two of these, so the loop is over a
 * list shorter than the sky's.
 */
function paintLandmarks(
  surface: Surface,
  view: View,
  cameraAlong: number,
  landmarks: Landmarks,
  levelOrigin: number,
  time: number,
): void {
  for (let i = 0; i < landmarks.length; i++) {
    const mark = landmarks[i]!;
    const half = mark.extent / 2;
    /*
      `at` is where the camera is when the landmark's leading edge touches the far side of the view,
      so at `cameraAlong === mark.at` it sits exactly one view-span ahead and enters. From there it
      drifts back at `depth` times the camera's rate, taking `view.alongSpan / depth` units of camera
      travel to cross — about a minute at 0.08, which is what makes it read as distance rather than
      as something going past.
    */
    /*
      ⚠️ **`levelOrigin` IS SUBTRACTED, AND LEAVING IT OUT SHIPPED IN 0203.** `at` is level-LOCAL, the
      same axis `waves` and `bossAt` use, while `cameraAlong` runs across the whole run — so comparing
      them directly puts Ember Nebula's Pillars at absolute 1299, which is somewhere in the middle of
      LEVEL ONE.

      ⚠️ **AND EVERY TEST OF IT PASSED, BECAUSE LEVEL ONE'S ORIGIN IS ZERO.** Every shot in 0203 and
      0204 was taken by temporarily moving the landmark onto level one, where local and absolute are
      the same number. The bench found it in two minutes by standing on level two —
      `docs/decisions/0205-the-bench-jumps-to-where-the-thing-is.md`.
    */
    const local = cameraAlong - levelOrigin;
    const inView = view.alongSpan + half - (local - mark.at) * mark.depth;
    // Not yet arrived, or fully gone. Both are the common case for most of a level.
    if (inView > view.alongSpan + half || inView < -half) continue;
    /*
      ⚠️ **THE DOUBLE MODULO IS DEFENCE, NOT A FIX, AND SAYING SO IS THE POINT.** `%` keeps the sign of
      its left operand, so a negative `local - mark.at` would run the beat backwards and then jump —
      the hazard `paintSky` carries the same guard for. **It cannot happen today**: `at` is where the
      landmark ARRIVES, and the `continue` above skips anything that has not, so by the time this line
      runs the difference is never negative. That was measured rather than assumed —
      `tests/places.test.ts` tried to assert the sign across the arrival and found nothing was drawn
      there at all.

      It stays because the alternative is a beat whose correctness depends on a CULLING condition four
      lines up agreeing with it, which is the kind of coupling that survives every test and breaks the
      day someone widens the view or gives a landmark a negative `at`.
    */
    const swell =
      mark.beat > 0 ? 1 + BEAT_SWELL * beatAt(((((local - mark.at) / mark.beat) % 1) + 1) % 1) : 1;
    surface.blit(mark.sprite, screenX(view, inView, mark.lane), screenY(view, inView, mark.lane), view.scale * swell * mark.scale);
    if (mark.vent !== undefined) paintEruption(surface, view, inView, mark, mark.vent, i, time);
  }
}

/**
 * The rock a landmark is throwing, this frame — 0347.
 *
 * ⚠️ **A PURE FUNCTION OF THE SIM'S CLOCK AND AN INDEX, AND THAT IS THE WHOLE MECHANISM.** Rock `k`
 * is `k / count` of a flight behind rock 0, so `count` are always in the air at even spacing; which
 * throw it is on is the whole number of flights it has made, and that is hashed into its side, its
 * reach, its height and where it peaks. Nothing is pooled, nothing is remembered, no stream is drawn
 * (0021), and a paused game is a frozen volcano because the sim's step count is what stopped.
 *
 * ⚠️ **THE SIM'S STEPS, NOT THE CAMERA — the one clock in this file that is not `cameraAlong`.** A
 * landmark's arrival and its old swell ride the camera (0034), which is right for position; a rock
 * rides TIME, because the camera stops for a fight and a volcano does not.
 *
 * ⚠️ **ONE BLIT PER ROCK AND NO STATE CHANGE** — 0025. The comet is turned to its own heading by the
 * angle `blit` already takes (0306), and it cools by shrinking, which is the only fade a blit has.
 *
 * ⚠️ **EVERY ROCK GOES UP AND OFF THE TOP OF THE SCREEN, AND NONE COMES DOWN — 0363.** Asked for:
 * rock that *"fire[s] up into the air and off the screen, but [doesn't] fall down as it's
 * distracting"* — and the symbolism is that the rock starts falling when the player reaches the
 * boss, which the quetzal's `fall` already is. So a flight is the RISING part of a throw only: it
 * leaves the crater, slows as it climbs, and is wholly past lane 0 by the end of it, still
 * climbing towards an apex that is never on the screen. That apex is solved per rock from its own
 * crater, so no row can state a throw that turns over in sight.
 */
function paintEruption(
  surface: Surface,
  view: View,
  inView: number,
  mark: Landmark,
  vent: { along: number; lane: number; erupts: Eruption },
  index: number,
  time: number,
): void {
  const { count, period, overshoot, reach } = vent.erupts;
  const crater = vent.lane + mark.lane;
  const gone = (period - 1) / period;
  /*
    How far a rock climbs by `gone`: from the crater to wholly off the top of the screen, which is lane
    0 on every device because the view shows `across` 0 to 100 exactly — past it by half the comet at
    the size it has cooled to by then.
  */
  const climb = crater + (SPRITE_EXTENT.ember / 2) * (1 - EMBER_COOL * gone);
  for (let k = 0; k < count; k++) {
    const flights = time / period + k / count;
    const throwN = Math.floor(flights);
    const t = flights - throwN;
    // Every number about this throw, from its landmark, its rock and which throw it is.
    const seed = index * 977 + k * 131 + throwN * 17;
    const side = streakHash(seed + 0.5) < 0.5 ? -1 : 1;
    const out = reach * (0.25 + 0.75 * streakHash(seed + 1.5)) * mark.scale;
    const over = overshoot * (0.35 + 0.65 * streakHash(seed + 2.5)) * mark.scale;
    /*
      Up is DOWN the lane. A parabola through the crater at t = 0 whose apex is `climb + over` above
      it, at t = 1 / u — past the end of the flight, because u is solved so that the rock has climbed
      exactly `climb` by `gone`: `(climb + over)(2s − s²) = climb` at `s = u · gone` gives
      `s = 1 − √(over / (climb + over))`. A harder throw overshoots further and so is still moving
      faster when it leaves.

      ⚠️ **GONE BY THE LAST WHOLE STEP OF THE FLIGHT, NOT BY ITS END.** The clock is steps, so the last
      place a rock is drawn before it is thrown again is one step short of t = 1 — and solved to clear
      at t = 1, the first cut sat 3px on the screen there and then jumped back to the crater, which
      `tests/jungle.test.ts` caught on its first run. Past `gone` it only climbs further out.
    */
    const high = climb + over;
    const u = (1 - Math.sqrt(over / high)) / gone;
    const along = inView + vent.along + side * out * t;
    const lane = crater - high * (2 * u * t - u * u * t * t);
    // Its heading, taken in SCREEN space so a view that turns the axes turns the comet with them.
    const aheadAlong = along + side * out * 0.01;
    const aheadLane = lane - high * (2 * u - 2 * u * u * t) * 0.01;
    const x = screenX(view, along, lane);
    const y = screenY(view, along, lane);
    surface.blit(
      SPRITE.ember,
      x,
      y,
      view.scale * (1 - EMBER_COOL * t),
      Math.atan2(screenY(view, aheadAlong, aheadLane) - y, screenX(view, aheadAlong, aheadLane) - x),
    );
  }
}

/** How many screen pixels a sky tile overlaps its neighbour by, in total across its width — 0347. */
const SEAM_BLEED_PX = 2;

/**
 * The sky's layers at a camera position. Exported for the intro since 0416, which flies the first
 * level's sky from an atlas holding the game's sprites after its own: `base` is where they start in
 * it, and every sprite this draws is offset by it. Nought for the game's own atlas.
 */
export function paintSky(surface: Surface, view: View, cameraAlong: number, sky: Sky, time = 0, beat = 0, base = 0): void {
  for (let i = 0; i < sky.length; i++) {
    const layer = sky[i]!;
    const span = layer.extent;
    if (span <= 0) continue;
    /*
      Where the first tile's leading edge sits, in world units in view. The double modulo is not
      belt-and-braces: `%` in JavaScript keeps the sign of the left operand, so a camera that has ever
      been negative — which it is not today and which `resetScene` could make true tomorrow — would
      put the tiling off the front of the screen and leave a bar of empty space behind it.
    */
    const offset = (((cameraAlong * layer.depth) % span) + span) % span;
    const count = Math.ceil(view.alongSpan / span) + 1;
    /*
      ⚠️ **EACH TILE A PIXEL WIDER ON EVERY SIDE, SO TWO NEIGHBOURS OVERLAP RATHER THAN MEET — 0347.**
      A tile lands on a fractional pixel, and a canvas covers the pixel it shares with its neighbour
      partly from each side: two partial coverages composite to less than one, and an OPAQUE layer
      shows a hairline of whatever is behind it at every join. The 1080p photograph of Saurian Belt had
      two of them standing up through the ridges.

      ⚠️ **AND ONLY AN OPAQUE ONE, WHICH THE FIRST DRAFT GOT WRONG.** Applied to every layer, the
      weather's deepened sky drew its overlap twice and the photograph had a dark line from the top of
      the screen to the horizon instead. A translucent join's shortfall is a fraction of a faint layer.
    */
    const bleed = layer.opaque === true ? 1 + SEAM_BLEED_PX / (span * view.scale) : 1;
    for (let t = 0; t < count; t++) {
      // Centred, because `blit` centres — `src/render/surface.ts`. Half a tile on from its edge.
      const inView = t * span - offset + span / 2;
      const across = view.acrossSpan / 2;
      surface.blit(base + layer.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale * bleed);
    }
    if (layer.veins !== undefined) {
      /*
        ⚠️ **THE VESSELS THEMSELVES SWELL WITH THE BEAT — 0401**, not only a bead on them: the lit tile is
        the same vessels as light and nothing else, laid over the tile at the heart's strength this frame,
        so on a lub the whole of every vein flares and falls away with it. One blit a tile, a faded one.
      */
      if (beat > VEIN_FLARE_FLOOR) {
        for (let t = 0; t < count; t++) {
          const inView = t * span - offset + span / 2;
          const across = view.acrossSpan / 2;
          surface.blit(base + SPRITE.skyVeins, screenX(view, inView, across), screenY(view, inView, across), view.scale, 0, Math.min(1, beat));
        }
      }
      for (let t = 0; t < count; t++) paintPulse(surface, view, t * span - offset, span, layer.veins, time, beat, base);
    }
  }
}

/** Below this the heart's light is not drawn at all: a blit of nothing is still a blit. */
const VEIN_FLARE_FLOOR = 0.02;

/** Points each artery's curve is walked at to lay its lengths end to end — 0400. Arithmetic, not blits. */
const ARTERY_SAMPLES = 64;
/** How much of a length's own run the next one starts inside, so no gap opens where the curve bends. */
const ARTERY_OVERLAP = 0.7;
/** How much wider an artery is drawn on a beat at full strength. */
const ARTERY_THROB = 0.3;
// @setup: one point, written and read inside `paintArteries` and never kept — 0400.
const ARTERY_AT = new Float64Array(2);
// @setup: the point after it, for the heading.
const ARTERY_NEXT = new Float64Array(2);

/**
 * The vessels from the place's trunks into the heart — 0400: each a run of blitted lengths down a curve
 * that leaves its trunk where the trunk is drawn THIS frame, so however the parallax has carried the sky
 * the vessel leaves it and never floats beside it. Thin where it leaves, the artery's `width` at the
 * heart, and a little wider on a beat. Nothing with no heart on the field, which is every fight but one.
 */
function paintArteries(surface: Surface, view: View, cameraAlong: number, sky: Sky, heart: Float64Array | null, beat: number): void {
  if (heart === null) return;
  for (let i = 0; i < sky.length; i++) {
    const veins = sky[i]!.veins;
    if (veins === undefined) continue;
    const span = sky[i]!.extent;
    // A length's thickness and run at a scale of one, in world units.
    const thick = 2 * ARTERY_HALF_WIDTH * 0.42 * SPRITE_EXTENT.artery;
    const run = 2 * ARTERY_HALF_LENGTH * 0.42 * SPRITE_EXTENT.artery;
    for (let a = 0; a < veins.arteries.length; a++) {
      const artery = veins.arteries[a]!;
      const thin = veins.trunks[artery.trunk]!.width * span;
      arteryAt(artery, veins, 0, heart[0]!, heart[1]!, cameraAlong, span, view.acrossSpan, ARTERY_AT);
      // Walked from the trunk to the heart; a length is laid whenever the walk has gone most of one.
      let owed = 0;
      for (let k = 1; k <= ARTERY_SAMPLES; k++) {
        const t = k / ARTERY_SAMPLES;
        arteryAt(artery, veins, t, heart[0]!, heart[1]!, cameraAlong, span, view.acrossSpan, ARTERY_NEXT);
        const dx = ARTERY_NEXT[0]! - ARTERY_AT[0]!;
        const dy = ARTERY_NEXT[1]! - ARTERY_AT[1]!;
        owed += Math.hypot(dx, dy);
        const width = (thin + (artery.width - thin) * t * t) * (1 + ARTERY_THROB * beat * t);
        const scale = width / thick;
        if (owed >= run * scale * ARTERY_OVERLAP || k === ARTERY_SAMPLES) {
          owed = 0;
          const inView = ARTERY_NEXT[0]! - cameraAlong;
          const x = screenX(view, inView, ARTERY_NEXT[1]!);
          const y = screenY(view, inView, ARTERY_NEXT[1]!);
          const heading = Math.atan2(screenY(view, inView, ARTERY_NEXT[1]!) - screenY(view, ARTERY_AT[0]! - cameraAlong, ARTERY_AT[1]!), screenX(view, inView, ARTERY_NEXT[1]!) - screenX(view, ARTERY_AT[0]! - cameraAlong, ARTERY_AT[1]!));
          surface.blit(SPRITE.artery, x, y, view.scale * scale, heading);
        }
        ARTERY_AT[0] = ARTERY_NEXT[0]!;
        ARTERY_AT[1] = ARTERY_NEXT[1]!;
      }
    }
    /*
      ⚠️ **AND THE CHAMBER THE HEART IS SET IN, AT THE HEART — 0489**, after the vessels so they run in under
      its flesh, and before every body so the heart beats in its bore and the bell lies over its mouth. At
      the heart wherever the heart is, which is what keeps it with her into the finale (0426): a piece fixed
      in the world would be left behind when the camera moves on with the heart.
    */
    const inView = heart[0]! - cameraAlong;
    surface.blit(veins.chamber, screenX(view, inView, heart[1]!), screenY(view, inView, heart[1]!), view.scale);
  }
}

/** The share of a bubble's life it spends as a pop, at the end — 0353. */
const POP_SHARE = 0.14;

/**
 * The bubbles on one tile's pools, this frame — 0353. `left` is where the tile starts, in world
 * units in view, and a tile is `span` units along and across, centred on the lane.
 *
 * ⚠️ **A PURE FUNCTION OF THE SIM'S CLOCK AND AN INDEX**, exactly as the ember is (`paintEruption`):
 * bubble `k` of a pool is `k / count` of a life behind bubble 0, which life it is on is hashed into
 * where on the surface it forms, and nothing is pooled, remembered or drawn from a stream. **It
 * rides the steps and not the camera**, so a pool keeps bubbling while the camera stops for a fight.
 *
 * ⚠️ **ONE BLIT A BUBBLE.** It forms on the surface, swells as it rises `rise` lane units, and ends as
 * a pop for the last `POP_SHARE` of its life.
 */
function paintBubbles(surface: Surface, view: View, left: number, span: number, pools: Pools, time: number): void {
  const { count, period, rise } = pools.bubbles;
  for (let p = 0; p < pools.spots.length; p++) {
    const spot = pools.spots[p]!;
    const start = left + spot.at * span;
    // Off the screen along: nothing of this pool is drawn.
    if (start > view.alongSpan || start + spot.wide * span < 0) continue;
    const surfaceAcross = view.acrossSpan / 2 + (spot.top - 0.5) * span;
    for (let k = 0; k < count; k++) {
      const lives = time / period + k / count + streakHash(p * 7.3 + 0.5);
      const life = Math.floor(lives);
      const t = lives - life;
      const u = 0.2 + 0.6 * streakHash(p * 131 + k * 17 + life * 0.37);
      const along = start + spot.wide * span * u;
      const popping = t > 1 - POP_SHARE;
      const up = rise * Math.min(1, t / (1 - POP_SHARE));
      const across = surfaceAcross - up;
      const swell = popping ? 1 : 0.45 + 0.55 * (t / (1 - POP_SHARE));
      surface.blit(popping ? SPRITE.bubblePop : SPRITE.bubble, screenX(view, along, across), screenY(view, along, across), view.scale * swell);
    }
  }
}

/** How much of a bead's size is the beat: at rest it is the rest of it. */
const PULSE_SWELL = 0.35;

/**
 * The light running along one tile's veins, this frame — 0354. `left` is where the tile starts, in
 * world units in view, and a tile is `span` units along and across, centred on the lane.
 *
 * ⚠️ **A PURE FUNCTION OF THE SIM'S CLOCK AND AN INDEX**, as the ember is: bead `k` of a trunk is
 * `k / beads` of a crossing ahead of bead 0, and nothing is pooled or remembered. It rides the steps
 * and not the camera, so the heart goes on beating while the camera stops for a fight.
 *
 * ⚠️ **THE BEAT IS THE ONE THE PLAYER HEARS SINCE 0401.** It was the landmark's shape on a clock of its
 * own — 66 steps, a heart the music never played — and travelled down the vein; *"pulse in time with the
 * heartbeat to the music"* is the ask that replaced it, and a bead now swells with the vessel it runs in,
 * on `beat`. Where it is still rides the steps. One blit a bead.
 */
function paintPulse(surface: Surface, view: View, left: number, span: number, veins: Veins, time: number, beat: number, base: number): void {
  const { beads, period } = veins.pulse;
  for (let i = 0; i < veins.trunks.length; i++) {
    const trunk = veins.trunks[i]!;
    for (let k = 0; k < beads; k++) {
      const travelled = time / period + k / beads + streakHash(i * 5.7 + 0.5);
      const x = travelled - Math.floor(travelled);
      const along = left + x * span;
      if (along < -2 || along > view.alongSpan + 2) continue;
      const across = view.acrossSpan / 2 + (trunkAt(trunk, x) - 0.5) * span;
      // The heart the player hears, since 0401 — the bead swells with the vessel it runs in.
      const swell = 1 - PULSE_SWELL + PULSE_SWELL * Math.min(1, beat);
      // Its heading, taken in SCREEN space as the ember's is, so the tail trails down the vessel.
      const aheadAlong = along + span * 0.002;
      const aheadAcross = view.acrossSpan / 2 + (trunkAt(trunk, x + 0.002) - 0.5) * span;
      const sx = screenX(view, along, across);
      const sy = screenY(view, along, across);
      surface.blit(
        base + SPRITE.veinBead,
        sx,
        sy,
        view.scale * swell,
        Math.atan2(screenY(view, aheadAlong, aheadAcross) - sy, screenX(view, aheadAlong, aheadAcross) - sx),
      );
    }
  }
}

/*
  ── THE SKY AT SPEED — `docs/decisions/0340-the-coil-is-a-route.md` ─────────────────────────────

  Asked for: *"the ship hyper-speeds through galaxy for the loading screen and then the hyper burn
  trails off as they arrive at the new level."*

  ⚠️ **A STREAK IS A BOLT, AND THAT IS THE SECOND THING THE VERB HAS EVER BEEN FOR.** 0233 put `bolt`
  on the surface for *"a shape not known until the frame it is drawn on, which is the one thing a bake
  cannot hold"* — and a streak's length IS the ship's speed on this frame. Baked, it would be a tile of
  lines at one length, arriving and leaving as a swap; stroked, it grows out of a point as the engines
  build and shrinks back into one as they trail off, which is the whole of what *trails off* means.
  It is counted as a bolt (0025) and hides nothing behind a blit's count.

  ⚠️ **AND IT COSTS NOTHING ON ANY FRAME OF ANY LEVEL.** `warp` is nought outside a crossing and the
  function returns on its first line; inside one the field is empty by construction — the boss is dead
  and the next level is not entered until the burn is over — so the streaks are spending a budget
  nothing else is using.
*/

/** How many streaks cross the screen at once. Few enough to be lines rather than a hatch. */
const WARP_STREAKS = 44;

/**
 * A streak's length at full burn, in world units, for one at the front of the sky. The lane is 100
 * tall, so the longest is a little over half a lane — long enough to read as a line from the moment
 * the eye lands on it, short enough that two in a row still have a gap between them.
 */
const WARP_STREAK_UNITS = 56;

/** The two ends of the one streak being drawn. Read by `bolt` before it returns, never kept. */
// @setup: four floats for the module's lifetime, written in place forty-four times a frame.
const STREAK = new Float32Array(4);

/**
 * A number in [0, 1) that is always the same for the same `n` — the streaks' places.
 *
 * ⚠️ **A HASH AND NOT AN `Rng`, BECAUSE NOTHING HERE MAY BE REMEMBERED.** A seeded stream would be a
 * field to hold and a draw order to keep; this is arithmetic on the streak's own index, so the sky at
 * speed is the same sky on every crossing, allocates nothing, and is not on any stream a level's
 * spawns could be coupled to — `docs/decisions/0021-one-stream-per-concern.md`.
 */
function streakHash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function paintWarp(surface: Surface, view: View, cameraAlong: number, warp: number): void {
  if (warp <= 0) return;
  for (let i = 0; i < WARP_STREAKS; i++) {
    /*
      ⚠️ **EACH STREAK HAS A DEPTH, AND LENGTH, SPEED, WIDTH AND BRIGHTNESS ALL RIDE IT.** That is
      what makes forty-four lines read as a volume the ship is going through rather than as a pattern
      on the glass: the near ones are long, fast, thick and bright, and the far ones are none of those.
      Strictly below one, for `SkyLayer.depth`'s reason — at one a streak moves with the world and
      becomes a thing in the lane.
    */
    const depth = 0.3 + 0.65 * streakHash(i + 0.5);
    const length = WARP_STREAK_UNITS * depth * warp;
    // It wraps over the view plus its own longest self, so one never pops in or out at full length.
    const period = view.alongSpan + WARP_STREAK_UNITS;
    const travelled = (cameraAlong * depth + streakHash(i + 17.25) * period) % period;
    const head = view.alongSpan - travelled;
    const across = streakHash(i + 101.75) * ACROSS_SPAN;
    STREAK[0] = screenX(view, head, across);
    STREAK[1] = screenY(view, head, across);
    STREAK[2] = screenX(view, head + length, across);
    STREAK[3] = screenY(view, head + length, across);
    /*
      ⚠️ **THIN, AND THE FIRST WIDTH WAS LOOKED AT AND WAS WRONG.** A bolt is four strokes of one line
      and its widest — the flash, 0238 — is fourteen times the core. At a core of two pixels that is a
      capsule twenty-eight pixels fat with round ends, and the sky at speed was a screen of pills. A
      streak is a line; under a pixel of core, the flash is a soft edge to it rather than a shape.
    */
    surface.bolt(STREAK, 2, 0.3 + 0.7 * depth, warp * (0.3 + 0.6 * depth), BOLT_PLAYER);
  }
}

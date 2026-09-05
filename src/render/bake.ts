/**
 * Baking — every sprite drawn once, at load, into an offscreen bitmap.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md`: art is a pure function of
 * `(kind, variant, palette, view)`, drawn once and blitted thereafter. Per-frame path filling is
 * banned. This is both halves of the procedural-versus-sprites argument at once — no asset files, so
 * `docs/decisions/0003-single-file-build.md` survives; a blit per entity, so the frame cost is a
 * sprite's; and the art is still a function of the palette, which is what makes 0024's high-contrast
 * and colour-blind palettes a re-bake rather than a second art pass.
 *
 * ⚠️ **A sprite is PAINTED here, since `docs/decisions/0227-a-sprite-is-painted-not-filled.md`.**
 * The hull is a path sealed in its ink, and the arm then paints on it in any shade of any palette
 * ink — the helpers under THE PAINT below are the whole vocabulary. `view` is still a real argument
 * and the seam it opens is still real: a real top-down is a different drawing, and the day it
 * arrives nothing outside this file changes.
 *
 * ⚠️ **This file is NOT on the hot list, and must never be called from a frame.** It allocates
 * freely, because it runs at load and on rotation. `src/app/frame.ts` is the file that runs every
 * frame, and it cannot reach this.
 */

import type { Palette } from '../content/palette.ts';
import { foeOf, type FoeSkin, type ThemeKind } from '../content/themes.ts';
import { LANDMARK_SLOTS, SPRITE, SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../content/sprites.ts';
import { makeRng, type Rng } from '../sim/rng.ts';
import type { WeaponKind } from '../content/weapons.ts';
import type { ThrustKind } from '../content/exhaust.ts';

/** Side profile for a horizontally scrolling screen, top-down for a vertical one. */
export type SpriteView = 'side' | 'top';

/**
 * The only canvas verbs the art itself uses.
 *
 * ⚠️ **A NARROWER TYPE SO THE DRAWING CAN BE TRACED WITHOUT A BROWSER**, which is the same move
 * `skyField` and `bakeSize` already make one section down: the quantity a guard needs is stated as
 * something node can hold. `drawKind` used to take a whole `CanvasRenderingContext2D`, and the only
 * way to read back what it drew was to bake a real atlas — which needs a `document`, which means a
 * browser, which means `dist/`. A `Pen` is fifteen members, so `tests/paths.ts` can implement one and
 * `tests/accents.test.ts` can ask where the ink actually went.
 *
 * A real 2D context satisfies it structurally, so `bakeOne` hands one over unchanged and nothing
 * about what ships moves. What the narrowing buys is that the two claims
 * `docs/decisions/0149-a-hull-has-an-interior.md` makes about the picture — the accent is inside the
 * hull, and no two hulls are one drawing — are arithmetic over real path data rather than prose.
 */
export type Pen = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'lineCap'
  | 'globalAlpha'
  // For a pickup's bubble, which is painted BEHIND a glyph already sealed — 0236.
  | 'globalCompositeOperation'
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'arc'
  | 'rect'
  | 'closePath'
  | 'fill'
  | 'stroke'
  | 'fillRect'
  | 'createRadialGradient'
>;

export interface Atlas {
  readonly view: SpriteView;
  /**
   * The place its sky was baked for — 0195.
   *
   * ⚠️ **HERE FOR THE REASON `pixelsPerUnit` IS HERE: so staleness is a question with an answer.** A
   * level boundary changes the place, and an atlas that could not say which place it belongs to would
   * go on showing the last one's sky until a rotation happened to re-bake it.
   */
  readonly theme: ThemeKind;
  /** Baked bitmaps, indexed by `SPRITE`. */
  readonly bitmaps: readonly CanvasImageSource[];
  /** World extent per bitmap, in the same order. */
  readonly extents: readonly number[];
  /** The resolution it was baked at, so staleness is a question with an answer. */
  readonly pixelsPerUnit: number;
}

/** Which view a viewport wants: side profile when it scrolls across `x`, top-down when down `y`. */
export function viewFor(alongAxis: 'x' | 'y'): SpriteView {
  return alongAxis === 'x' ? 'side' : 'top';
}

/**
 * Whether an atlas has to be thrown away and re-baked.
 *
 * Pure, and separated from the baking so it can be proved without a browser — the two cases it has
 * to get right are a rotation (always re-bake, the art faces the wrong way) and a resize (re-bake
 * only when the resolution has moved enough to see, or every window drag re-bakes the whole atlas).
 *
 * The threshold is a quarter. Below that the difference is a bitmap scaled by up to 25%, which on
 * these shapes is invisible; above it, edges start to look soft.
 */
export function atlasIsStale(
  atlas: Atlas,
  view: SpriteView,
  pixelsPerUnit: number,
  theme: ThemeKind = 'approach',
): boolean {
  if (atlas.view !== view) return true;
  /*
    ⚠️ **A PLACE CHANGE IS ALWAYS STALE, WITH NO TOLERANCE BAND** — 0195. The resolution test below
    forgives a quarter, because a re-bake for a 3% DPI wobble is memory churn for a picture nobody can
    see. A place is not a quantity: the sky either belongs to this level or it belongs to the last one.
  */
  if (atlas.theme !== theme) return true;
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) return false;
  return Math.abs(pixelsPerUnit - atlas.pixelsPerUnit) > atlas.pixelsPerUnit * 0.25;
}

/**
 * The most detail any bitmap is ever baked at, in pixels per world unit.
 *
 * ⚠️ **It replaces a flat 256-pixel ceiling that meant this all along.** Ten pixels per unit is a
 * 26-unit boss at 260px, which is where the old number came from; the difference only becomes visible
 * when something is baked that is much bigger than a boss, which the sky tiles are.
 *
 * Baking below the blit resolution is a blurry game; baking far above it is memory spent on detail
 * nobody sees — and the sky is the one bitmap where *far above* would be measured in megabytes.
 */
const MAX_PIXELS_PER_UNIT = 10;

/**
 * How many pixels square a bitmap of `extent` world units is baked at.
 *
 * ⚠️ **Exported and pure so the CEILING can be proved without a canvas**, which is the only way the
 * property that matters can be stated: the cap is a **resolution**, so it is the same pixels-per-unit
 * for every kind. A flat pixel ceiling is not — it silently bakes anything bigger than a boss at a
 * fraction of the detail, and the picture is only wrong on the biggest thing on the screen.
 * `tests/budget.test.ts` holds it; `docs/decisions/0065-the-sky-is-baked-and-blitted.md` has the why.
 */
export function bakeSize(extent: number, pixelsPerUnit: number): number {
  return Math.max(8, Math.min(extent * MAX_PIXELS_PER_UNIT, Math.ceil(extent * pixelsPerUnit)));
}

/**
 * How many stars a sky tile carries, per layer.
 *
 * ⚠️ **The near layer is SPARSER than the far one**, which is the wrong way round for depth and the
 * right way round for a shooter: the near layer moves fastest, and fast-moving dots near the player's
 * eye are the ones that compete with a bullet. `docs/decisions/0024-the-accessibility-floor-is-settings.md`
 * puts a flash-intensity cap in the unconditional tier for the same reason a background does not get
 * to be busy.
 *
 * ⚠️ **THE TWO ARE NOW EQUAL, AND THE PARAGRAPH ABOVE IS WHY THAT IS SAFE** —
 * `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md`. A near star is 0.2
 * world units against the far layer's 0.6, so ninety of them put a NINTH of the far layer's ink on
 * the screen per dot before the alpha is counted. What made a sparse near layer necessary was dots
 * that could compete with a bullet; at a third of the radius they cannot, and count is the half of
 * *further away* that dimming alone does not buy.
 */
/*
  ── AND THERE IS A THIRD LAYER NOW, WHICH IS THE ONE THE PLAYER SEES MOVE ─────────────────────────

  `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`. Reported from play against the
  build 0088 landed in: *"background starfield has lost it's multiple layers, there's only one
  starfield background and the background or the screen moves too slow… it feels like a crawl because
  of the background visual moving soooo slowly."*

  ⚠️ **Both halves of that are ONE cause and it is 0088's own success.** 0088 dimmed the near layer to
  a fifth and shrank it to a third; what it dimmed away was the only FAST layer on the screen, so the
  sky lost a layer and lost its speed in the same edit. What is left visible moves at 0.24 — about
  eight world units a second, twenty seconds to cross a 16:9 view — and that is the crawl, measured.

  ⚠️ **`skyRush` is few and it is meant to be.** A streak covers about twenty times a dot's area,
  and what reads as speed is a handful of things moving quickly rather than a field of them. Two and
  a half tiles are in view at once, so it is about thirty streaks on the screen.

  ⚠️ **FIFTEEN → TWELVE, AND IT IS THE LENGTH THAT BOUGHT IT** —
  `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`. The streaks are now nearly
  twice as long, so the same count would have put two thirds again as much ink on the screen. Fewer
  and longer is what *faster* looks like; more and longer is a curtain.
*/
const SKY_STARS = { skyFar: 90, skyNear: 90, skyRush: 10 };

/**
 * The biggest a star may be drawn, as a radius in WORLD UNITS. One ceiling for the whole sky.
 *
 * ⚠️ **A world quantity and not a fraction of the tile, because the thing it has to be smaller than
 * is a BULLET.** `docs/decisions/0069-the-sky-is-behind-the-game.md`. It used to be a per-layer
 * fraction — `size * 0.012` for the near layer, which on a tile `ACROSS_SPAN` units across is a
 * radius of **1.2 units against a pulse's 0.9**. The background's dots were drawn larger than the
 * smallest thing in the game that can kill the player, and nothing else about a shape that size
 * matters.
 *
 * ⚠️ **The far layer's value is unchanged and the near layer's is halved**, which is the whole of
 * the size change: 0.6 was already what the far one used, nobody reported it, and it is two thirds
 * of `SHOTS.pulse.radius`.
 *
 * ⚠️ **Not exported, and the guard does not read it.** `tests/budget.test.ts` measures the radii
 * `skyField` actually produces, against `SHOTS` — `docs/decisions/0027-measure-the-picture-not-the-model.md`,
 * because a ceiling checked against the constant it is derived from proves only that the code agrees
 * with itself, and 0019 says no probe can see that.
 *
 * ── AND IT IS NOW PER LAYER AGAIN, WHICH IS THE PERSPECTIVE THE PLAY-TEST ASKED FOR ─────────────
 *
 * Reported from play: *"on desktop, the closer starfield layer is still too close to play view,
 * needs to be a bit more background. I think it's actually the perspective zoom level is wrong."*
 * `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md`.
 *
 * ⚠️ **Smaller AND more numerous, which is what *further away* looks like.** Distance in a starfield
 * is carried by exactly two things a flat layer has: how big a dot is and how many of them there are.
 * The near layer went 0.6 → 0.35 with `SKY_STARS` 34 → 55, so the ink it puts on the screen is
 * `(0.35/0.6)² × (55/34)` — about **55% of what it was** — spread over 60% more points. Less loud and
 * more distant at once, which is the only combination that answers the report without taking back
 * the speed [0078](../../docs/decisions/0078-the-sky-moves-a-third-faster.md) just gave it.
 *
 * ⚠️ **AND IT WAS NOT ENOUGH, SO THE SAME LEVER GOES AGAIN** —
 * `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md`. Reported from play
 * against the build 0069 landed in: *"the closer starfield needs to be much further backgrounded,
 * still distracting."* 0.35 → **0.2**, with `SKY_STARS` 55 → 90, which is the far layer's own count.
 *
 * ⚠️ **The choice between dimming it and SLOWING it was put to the hand that reported it**, in the
 * same breath as *"the background needs to move faster"*, and dimming won: distraction is contrast
 * and size, and speed is the thing the other half of the report is asking for more of.
 *
 * ⚠️ **The far layer is untouched, because nothing has ever been reported about it.**
 *
 * ── AND 0088 WENT TOO FAR, WHICH IS THE FIRST TIME THIS LEVER HAS BEEN PULLED BACK ─────────────
 *
 * ⚠️ **`docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`.** Reported: *"there's
 * only one starfield background."* 0.2 units at 0.18 alpha is about a pixel and a half at a fifth
 * of solid on an ordinary screen, which is not a layer the eye can find — three passes of *push it
 * back* ended one push past the point where the layer existed.
 *
 * ⚠️ **0.2 → 0.28, and it is still under a THIRD of a pulse.** What made this layer distracting was
 * that it was the nearest thing on the screen with nothing in front of it. There is something in
 * front of it now, so it is a middle distance rather than the foreground, and the ladder of
 * thicknesses — 0.6, 0.28, 0.11 — is what `tests/budget.test.ts` holds instead of a single ceiling.
 *
 * ⚠️ **`skyRush` is a HALF-THICKNESS rather than a radius**, because the mark is a capped line and
 * not a dot. It is the narrowest thing the sky draws by a factor of two and a half, which is the
 * whole of why a layer moving at 0.85 is still a background: `tests/budget.test.ts` holds both that
 * ladder and the aspect ratio that stops a streak degenerating into a dot.
 */
/*
  ⚠️ **EXPORTED BY 0195, so the clamp on a place's `size` can be stated as the claim it actually is.**
  The comment above already argues that this number's whole point is being readable against
  `SHOTS.pulse.radius` by a person and by a test. What `tests/sky.test.ts` asserts is not this
  constant — it is that no place's field draws past it, whatever `SKY_STYLE_OF` says, which is a claim
  about the clamp and reddens when the clamp goes.
*/
export const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.24 };

/**
 * How long a `skyRush` streak is, in world units — the range one is drawn between.
 *
 * ── WHY THE FAST LAYER IS A LINE AND NOT A DOT ──────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`.** Every previous answer
 * to *the sky is too slow* moved a depth, and every one of them ran into the same ceiling: a dot that
 * moves fast is a dot that competes with a bullet, so the speed had to be bought back with alpha and
 * with size until the layer was gone. **A streak breaks that trade** — it says *fast* by its shape
 * rather than by its rate, it cannot be mistaken for a round thing that kills you, and it is what
 * every game that has ever wanted to look quick draws.
 *
 * ⚠️ **Drawn along the tile's own `+x`, which is the scroll axis on BOTH orientations.**
 * `bakeOne` turns the whole atlas a quarter turn for the portrait view, so a streak authored down the
 * tile's x arrives pointing along `along` either way. Getting this wrong would draw the streaks
 * across the lane in portrait only — on a device the developer is not holding, which is the failure
 * mode `src/render/surface.ts` records for the same axis.
 *
 * ⚠️ **The shortest one is fifty times its own width**, which is the aspect ratio
 * `tests/budget.test.ts` holds: a streak that shortened towards its thickness would be back to being
 * a dot at the fastest depth in the game, and nothing else in this file would notice.
 *
 * ── 6–13 → 11–24, AND LENGTH IS THE LEVER DEPTH RAN OUT OF ──────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`.** Reported from play
 * against the build 0097 landed in: *"the sky moves a bit faster, but it still needs to move much
 * more faster."*
 *
 * ⚠️ **A LONGER STREAK READS AS FASTER AT THE SAME RATE, and depth cannot do that.** Every previous
 * pass at this report moved a depth, and depth has a hard ceiling — at 1 the sky moves with the world
 * and stops being a background (0065). Length has no such ceiling: it is the smear a fast thing
 * leaves, so more of it is more speed, and it is why every game that wants to look quick draws them
 * long rather than merely draws them fast.
 *
 * ⚠️ **It is paid for in COUNT, and `SKY_STARS` above is where.** Nearly twice the length is nearly
 * twice the ink per mark; fifteen marks became twelve, and the streak layer's ink bound moved with an
 * argument of its own — `tests/budget.test.ts`.
 */
const SKY_STREAK_UNITS = { from: 11, to: 24 };

/**
 * How solid each layer is drawn, against the void behind it.
 *
 * ⚠️ **The near layer is the dim one, and it is the ONLY thing that now says which layer is which**
 * besides parallax and count — size no longer does. That reads backwards for depth and is the right
 * way round here, for the reason `SKY_STARS` already gives about count: the near layer is the one
 * that MOVES, and motion is what buys attention. Reported from play as *"the closer to screen layer
 * is too prominent, needs to be backgrounded a bit."*
 * `docs/decisions/0069-the-sky-is-behind-the-game.md`.
 *
 * ⚠️ **Baked in, never applied per blit** — 0025 counts state changes in the frame loop, and a tile
 * is drawn once at load and once per rotation.
 *
 * ⚠️ **0.4 → 0.18, and it is the third time this layer has been pushed back** —
 * `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md`: *"the closer
 * starfield needs to be much further backgrounded, still distracting."* Alpha is the one lever that
 * costs nothing anywhere — not a draw call, not a pool slot, not a world unit — and it is the one
 * that acts directly on the thing being complained about, which is how much of the eye the layer
 * takes. Under a fifth is faint enough to read as depth rather than as content, and 0088 goes
 * further on it than on either of the other two because it is the cheapest to take back.
 *
 * ⚠️ **0.18 → 0.34, and it is the first time this lever has come back** —
 * `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`: *"there's only one starfield
 * background."* The paragraph above is still the rule and this is still well under half of solid;
 * what changed is that the near layer is no longer the nearest thing on the screen, so *the layer
 * that moves* is `skyRush`'s description rather than this one's.
 *
 * ⚠️ **The back layer is the only one drawn solid, and everything in front of it is under half.**
 * That is what `tests/budget.test.ts` holds rather than either number: a veil over a bed, whatever
 * the values a later play-test settles on.
 */
const SKY_ALPHA = { skyFar: 1, skyNear: 0.34, skyRush: 0.46 };

/**
 * How much of the boundary's tile is mark rather than gap.
 *
 * ⚠️ **Under a half, so the line reads as dashed at a glance.** At more than half the gaps are what
 * look like the marks, and the thing stops saying *a limit* and starts saying *a broken wall*.
 */
const BOUND_DASH = 0.45;

/**
 * Half the boundary mark's thickness, as a fraction of its tile.
 *
 * At a ten-unit tile this is a mark a third of a world unit across — thinner than the smallest thing
 * in the game that can kill the player (`SHOTS.pulse.radius` is 0.9), which is the same ceiling
 * `docs/decisions/0069-the-sky-is-behind-the-game.md` puts on a star and for the same reason.
 */
const BOUND_WIDTH = 0.017;

/**
 * How solid the boundary is drawn.
 *
 * ⚠️ **A play-test number and the one most likely to be wrong in this change.** It has to be visible
 * on a bright phone in daylight and ignorable while a screen full of bullets is being read, and those
 * two pull opposite ways. Nothing asserts it; what `tests/layout.browser.test.ts`'s sibling asserts is
 * that it is drawn at all and in the right place.
 */
const BOUND_ALPHA = 0.35;

/**
 * Which ink each kind is drawn in. A role, never a colour — see `content/palette.ts`.
 *
 * ⚠️ **Exported so a guard can read the ROLE rather than a hex string** — 0081. What the legibility
 * report is about is which things share a channel, and *are these two drawn in the same ink* is a
 * question about this table; asking it of `PALETTES` would compare colours and answer it once per
 * palette, which is the same fact twice.
 */
export const INK_OF: Record<SpriteKind, keyof Palette> = {
  ship: 'player',
  drifter: 'enemy',
  lancer: 'enemy',
  weaver: 'enemy',
  turret: 'enemy',
  charger: 'enemy',
  warden: 'enemy',
  spinner: 'enemy',
  sower: 'enemy',
  boss: 'enemy',
  boss2: 'enemy',
  /*
    ⚠️ **THE FIVE LATER BOSSES' HURT SILHOUETTES ARE NOT HERE, AND THEY USED TO BE** — see the HURT
    SILHOUETTES block below. Each was authored on the line under its own hull, in its own hull's ink,
    which reads as *the boss and its variant* and bakes as **the same bitmap twice**: `drawKind` shares
    one `case` arm between a boss and its hit sprite, so the ink is the only thing that differs, and
    with the ink the same there is nothing left. Five of the seven bosses had no hit interaction at
    all. A hurt silhouette belongs with the other hurt silhouettes.
  */
  boss3: 'enemy',
  boss4: 'enemy',
  boss5: 'enemy',
  boss6: 'enemy',
  boss7: 'enemy',
  boss8: 'enemy',
  boss9: 'enemy',
  boss10: 'enemy',
  boss11: 'enemy',
  boss12: 'enemy',
  boss13: 'enemy',
  boss14: 'enemy',
  bullet: 'bullet',
  /*
    ⚠️ **THE ENEMY INK, and this is the one ink assignment in the table that changed a rule** — 0081.
    `bullet` used to mean *a shot*, whoever fired it, so the player's own fire and the fire they had
    to dodge were the same colour as well as the same shape. It now means *the player's fire*, and
    what shoots back wears the same ink as what shot it.

    ⚠️ **That is colour carrying the SIDE and shape carrying the rest**, which is exactly the division
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` asks for: nothing here is told apart
    by hue alone — a spit is a square at 2.6 units and an enemy is a five-to-nine-unit silhouette, so
    sharing an ink costs nothing and buys the player one rule instead of two. *Pink will hurt you.*
  */
  spit: 'enemy',
  // ⚠️ **The same ink as the spit, and that is the rule rather than a saving** — 0081 read the other
  // way round. One colour means *this will hurt you*; what says which enemy sent it is shape and
  // size, so a player learns one thing about ink and three things about silhouettes. 0098.
  lance: 'enemy',
  flak: 'enemy',
  // The serpent's two shots in their own inks — 0248, on 0098's argument that a boss with three
  // kinds of shot in one colour is one bullet wearing three shapes.
  acid: 'acid',
  void: 'void',
  // The eagle's flame in its own ink — 0249, on the same argument.
  flame: 'fire',
  // The HUD's lives counter rather than a pickup, since 0082 — it keeps the pickup ink because the
  // number beside it is drawn in the player's own colour and the icon has to sit with it.
  lifeIcon: 'pickup',
  /*
    ⚠️ **EACH FACE OF A CYCLING PICKUP IN THE INK OF WHAT IT OFFERS — 0239, finished by 0240.** 0233
    gave every face the pickup ink (*the same pickup, so the same ink*) and the third play-test
    refused it: *"the missile pickups need to be different colours… weapon pickups need different
    colouration for each weapon as well, visually distinct atm but the same colour makes it hard."*
    The BUBBLE is what says *this is a pickup* (0236, always in the pickup ink); the glyph inside it
    wears the ink of the thing it offers — the pulse and the straight missile in the pulse's orange,
    the arc in the ship's colour its bolt is stroked in, the shuriken in steel, the seeker in the
    ally ink. 0239 had kept the first two in the pickup ink so a fresh pickup read as one, and the
    fourth play-test asked for the orange: *"autofire gun colour symbol needs to be more orangey and
    the regular fire missiles icon needs to be more orangey to match the projectiles."* The bubble
    carries the role on its own. `tests/weapons.test.ts` holds that no two faces of one pickup share
    an ink.
  */
  pickupWeapon: 'bullet',
  pickupMissile: 'bullet',
  pickupSeeker: 'ally',
  pickupArc: 'player',
  pickupShuriken: 'blade',
  pickupShield: 'pickup',
  /*
    ⚠️ **THE PICKUP INK OVER THE BOMB'S OWN SILHOUETTE, and the ink is doing the whole job here.**
    `pickupBomb` and `bomb` share a drawing (see the case below), so this line is the only thing that
    says *this one is lying in the lane waiting to be collected* rather than *this one just left the
    ship*. That is colour carrying the ROLE while shape carries identity, which is the division
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` asks for — and the two are never in
    the same place, because a thrown bomb is travelling and this is holding station.
  */
  pickupBomb: 'pickup',
  // A scattered piece's badge is a pickup's, in the pickup ink — 0243.
  stackTwo: 'pickup',
  stackThree: 'pickup',
  stackFour: 'pickup',
  // The bullet ink, because it is a bullet. What separates it from the pulse is shape and size.
  missile: 'bullet',
  /*
    ⚠️ **THE SHIP'S OWN INK AND NOT THE PULSE'S — 0238.** Played: *"need more visual distinction
    between actual missile types."* At four units a swept fin against a notched tail is not a cue;
    an ink is. The seeker is the one shot that behaves like the ship — it turns — so it wears the
    ship's colour, and the straight missile keeps the pulse's.
  */
  /*
    ⚠️ **AND NOT THE SHIP'S EITHER, SINCE 0241.** Played: *"blue homing missiles, blue lightning,
    blue ship, it all looks the same."* The seeker wears the ally ink — the one its own pickup face
    wears (0239), and the one nothing else in the lane wears — so a seeker matches the face that
    offered it and is off the bolt and off the hull.
  */
  seeker: 'ally',
  bomb: 'bullet',
  /*
    ⚠️ **THE HAZARD INK, WHICH THE PLAYER'S OWN WEAPONS DO NOT USE — and that is the point.** A bomb's
    blast hurts the player as well as everything else in it, so it is the one thing the ship fires
    that the ship has to get away from. `src/content/palette.ts` calls hazard the warning role, and
    the ship's own recovery blink borrows it too — which is a note rather than a defect, because the
    two never share a silhouette: one is a wedge and this is a ring the width of a third of the lane.
  */
  blast: 'hazard',
  /*
    The pyre's other three rungs — 0079. The hazard ink for the same reason the blast has it: the
    player has already learned that a wide ring is a thing to be outside of, and this is the same
    event with a different cause.

    ⚠️ **It cannot actually hurt the ship, and the ink is still right.** The pyre lands on the step
    after it appears, and on that step there is no ship in `shipPool` for the pairing to find — the
    beat has not finished. Drawing it in a harmless ink would be teaching the player that a ring is
    sometimes safe, which is worth more to get wrong than the one case where it is.
  */
  blastHalf: 'hazard',
  blastWide: 'hazard',
  blastWidest: 'hazard',
  // The player's own ink, because a shield IS the player — it is the last thing between a hit and
  // the hull, and a shell drawn in the pickup ink would read as something to fly into.
  shieldOrb: 'player',
  // Where a bolt lands: the impact ink, because a landing IS an impact and it is the brightest ink
  // there is — the bolt's core is stroked in the same one. 0233.
  arcNode: 'impact',
  // A blade is a thing the player fired, in the bullet ink like the pulse and the missile — 0234.
  // Steel, since 0238 — *"steel coloured"* — an ink of its own, because a blade is not a bullet.
  shuriken: 'blade',
  shurikenTurn: 'blade',
  /*
    THE HURT SILHOUETTES: the SAME shape in a different ink.

    Same shape is what makes it read as *that thing being hurt* rather than as a second object
    appearing where the first one was. And the ink is the only channel doing colour work here, which
    is allowed precisely because the silhouette is unchanged — 0024's rule is that colour may not
    carry meaning ALONE, and here the shape carries identity while the colour carries the event.

    ⚠️ **THE SHIP IS YELLOW AND AN ENEMY IS WHITE, and they are different on purpose.** The ship
    briefly went white too, when the flash was generalised from the ship to everything, and a
    play-test asked for the yellow back. It is the better answer for a reason worth writing down: the
    ship's blink means *you cannot be hurt right now* and an enemy's flash means *this just was*, and
    those are opposite meanings. One ink for both is one channel carrying two things, which is the
    failure `docs/decisions/0024-the-accessibility-floor-is-settings.md` exists to prevent.

    ⚠️ `hazard` is borrowed rather than owned, and it will want revisiting when environmental hazards
    land — an asteroid and a recovering ship would then share a colour. They would not share a
    silhouette, so it is a note rather than a defect, and inventing a `warn` role for content that
    does not exist yet is the shape of mistake this project has already made once with the ship
    roster. `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`.
  */
  shipHit: 'hazard',
  // The upgraded hulls are the same ship — 0081 — so they carry the same two inks as the first one.
  shipMk2: 'player',
  shipMk2Hit: 'hazard',
  shipMk3: 'player',
  shipMk3Hit: 'hazard',
  // The arc's hulls are the same ship carrying a different gun — 0233 — so the same two inks again.
  shipArc: 'player',
  shipArcHit: 'hazard',
  shipArcMk2: 'player',
  shipArcMk2Hit: 'hazard',
  shipArcMk3: 'player',
  shipArcMk3Hit: 'hazard',
  // And the shuriken's — 0234.
  shipStar: 'player',
  shipStarHit: 'hazard',
  shipStarMk2: 'player',
  shipStarMk2Hit: 'hazard',
  shipStarMk3: 'player',
  shipStarMk3Hit: 'hazard',
  drifterHit: 'impact',
  lancerHit: 'impact',
  weaverHit: 'impact',
  turretHit: 'impact',
  chargerHit: 'impact',
  wardenHit: 'impact',
  spinnerHit: 'impact',
  sowerHit: 'impact',
  // The signatures, on the same terms as the eight — 0232.
  picket: 'enemy',
  picketHit: 'impact',
  moth: 'enemy',
  mothHit: 'impact',
  raptor: 'enemy',
  raptorHit: 'impact',
  kite: 'enemy',
  kiteHit: 'impact',
  sentry: 'enemy',
  sentryHit: 'impact',
  shard: 'enemy',
  shardHit: 'impact',
  spore: 'enemy',
  sporeHit: 'impact',
  gaze: 'enemy',
  gazeHit: 'impact',
  bossHit: 'impact',
  boss2Hit: 'impact',
  /*
    ⚠️ **THESE FIVE WERE `enemy` AND THAT WAS THE WHOLE OF *"BOSSES 3+ DON'T SHOW ANY HIT INTERACTION
    AT ALL"*** — reported from play, 2026-08-10. They were authored beside their own hulls at the top
    of this table rather than here, so each inherited its hull's ink; `drawKind` gives a boss and its
    hit sprite ONE `case` arm, so the two bitmaps were identical and the flash was a four-step swap to
    the same picture. Nothing about `IMPACT_FLASH_STEPS` or the collision was wrong.

    ⚠️ **The rule this breaks is 0035's, and it is the only rule in the project a table can break by
    saying nothing** — a missing entry is a type error, and a WRONG entry that happens to be a valid
    ink is not. `tests/legibility.test.ts` now asks the question the compiler cannot: every hurt
    silhouette is drawn in a different ink from the body it is the hurt version of.
  */
  boss3Hit: 'impact',
  boss4Hit: 'impact',
  boss5Hit: 'impact',
  boss6Hit: 'impact',
  boss7Hit: 'impact',
  boss8Hit: 'impact',
  boss9Hit: 'impact',
  boss10Hit: 'impact',
  boss11Hit: 'impact',
  boss12Hit: 'impact',
  boss13Hit: 'impact',
  boss14Hit: 'impact',
  // Fragments are the impact itself, so they are the impact ink; they carry no identity of their own.
  debris: 'impact',
  /*
    ⚠️ **A BURST'S INK IS WHAT IT IS MOSTLY MADE OF, AND NONE OF IT MEANS ANYTHING** — 0227. The
    frames paint themselves from four palette inks (see their arms), so the entry here is the one the
    sheet reports and nothing reads to draw. The flash is the impact ink because it IS one; the fire
    is the bullet ink because that is the palette's orange; the smoke is the exhaust ink taken most of
    the way to black.
  */
  burst0: 'impact',
  burst1: 'bullet',
  burst2: 'bullet',
  burst3: 'flame',
  spark0: 'impact',
  spark1: 'bullet',
  // The exhaust is the palette's fire on the same terms as a burst — 0230: the flame is the
  // exhaust ink, its heart the hazard ink, its core the flash. None of it means anything.
  thrustIdle0: 'flame',
  thrustIdle1: 'flame',
  thrustBurn0: 'flame',
  thrustBurn1: 'flame',
  thrustEase: 'flame',
  thrustIdle0Climb: 'flame',
  thrustIdle0Dive: 'flame',
  thrustIdle1Climb: 'flame',
  thrustIdle1Dive: 'flame',
  thrustBurn0Climb: 'flame',
  thrustBurn0Dive: 'flame',
  thrustBurn1Climb: 'flame',
  thrustBurn1Dive: 'flame',
  thrustEaseClimb: 'flame',
  thrustEaseDive: 'flame',
  /*
    ⚠️ **The one ink that is not meant to be found.** `src/content/palette.ts` records it: every other
    role is something the player has to be able to pick out, and the sky is the thing they are all
    picked out against. A starfield in `pickup` or `ally` would be a screen full of things that look
    collectable. `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
  */
  skyFar: 'sky',
  skyNear: 'sky',
  // ⚠️ **The streaks are the SAME ink**, so what separates the three layers is depth, thickness and
  // shape and never colour — 0097, which is 0081's rule arriving in the one place it had not.
  skyRush: 'sky',
  /*
    ⚠️ **The sky ink is what it is BAKED at and not what it is drawn in** — 0112. A nebula takes its
    colour from the level's theme, which no palette knows about, and `bakeNebula` replaces this one
    bitmap at a level boundary with the theme's own value. The entry here is what a cloud looks like
    before a level has said otherwise, and this is the only sprite in the atlas whose ink is not
    final.
  */
  skyNebula: 'sky',
  /*
    ⚠️ **`space`, AND IT IS THE ONLY SPRITE IN THE ATLAS DRAWN IN THE BACKDROP'S OWN COLOUR** — 0221.
    Every other sky sprite is a mark ON the backdrop; a planet's ground is a mass that REPLACES it,
    and the placeholder for a place that has not said otherwise is *the same colour as the void*,
    which draws as nothing at all. `bakeGround` overwrites it at a level boundary with the theme's
    own `ground`, exactly as `bakeNebula` does for the weather — so, like `skyNebula`, the entry here
    is what it looks like before a level has spoken.
  */
  skyGround: 'space',
  // A landmark is sky ink like every other backdrop mark — 0069's *the sky is behind the game* is
  // untouched by 0203, which moved only what may be drawn, never what it is drawn in.
  landmark: 'sky',
  landmarkB: 'sky',
  landmarkC: 'sky',
  /*
    ⚠️ **The PLAYER's ink, because the thing it marks is the player's box and nothing else's.**
    Enemies, bullets and pickups all cross this line freely — `src/sim/flight.ts` clamps the ship and
    only the ship — so drawing it in the enemy ink or a neutral one would say *a wall* when what is
    true is *your limit*. `docs/decisions/0074-the-box-is-drawn.md`.
  */
  bound: 'player',
};

/*
  ══ THE PAINT ════════════════════════════════════════════════════════════════════════════════════

  ⚠️ **ONE INK PER SPRITE WAS THE ART CEILING, AND THE CEILING WAS THE FUNCTION** —
  `reports/where-the-art-ceiling-is-2026-08-14.md`. `drawKind` set ONE `fillStyle`, ended every arm at
  a single fill, and `docs/decisions/0149-a-hull-has-an-interior.md` and
  `docs/decisions/0194-a-hull-has-a-livery.md` each opened it one notch: a table of marks in `space`,
  then the same table in three more inks. Two decisions, two tables, and a sprite was still a
  silhouette with a stencil over it.

  ⚠️ **`docs/decisions/0227-a-sprite-is-painted-not-filled.md` TAKES THE TABLE AWAY.** A sprite is a
  DRAWING: the hull is a path filled in the kind's ink and sealed with the outline, and then the arm
  paints whatever it likes on top of it — panels, a canopy, an engine and its plume, a core, a halo —
  in whatever colour it likes, through the helpers below. The colours are still the palette's, mixed
  (`shade`), so a re-bake on the high-contrast palette is still the same drawing in that palette's
  terms; nothing here names a hex.

  ⚠️ **WHAT IS HELD DID NOT MOVE, AND IT IS HELD OVER THE DRAWING RATHER THAN OVER A TABLE.**
  `tests/accents.test.ts` traces every fill through `tests/paths.ts` and asks the same three questions
  0149 asked of its table: an opaque mark stays inside the hull, so collision, the extents and 0101's
  screen share are still claims about the silhouette; a mark is at least 2.5 CSS pixels on the screen
  the play-tests are given on (0106); and a translucent mark — a plume, a halo — may leave the hull but
  never the sprite's own box. **A guard over a table proves the table; a guard over the trace proves
  the picture** — 0027, on the art channel.

  ⚠️ **THE HIGH-CONTRAST PALETTE IS STILL THE FLAT ONE.** Every decorative colour below is a shade of a
  palette ink, and on that palette `glass`, `flame` and `trim` are the void
  (`src/content/palette.ts`), so a canopy is a hole and an exhaust is nothing — which is 0024's *knobs
  over the loud default* doing exactly what the player turned it for.
*/

/** The frame a sprite is drawn in: its centre, and the radius every coordinate is a fraction of. */
interface Frame {
  readonly half: number;
  readonly r: number;
}

/** A point in a sprite's own frame — fractions of `r`, +x forward, +y down the screen. */
type Pt = readonly [number, number];

/** A hex colour with an alpha, for the transparent end of a glow. */
function rgba(hex: string, alpha: number): string {
  const read = (i: number): number => parseInt(hex.slice(i, i + 2), 16);
  return `rgba(${read(1)}, ${read(3)}, ${read(5)}, ${alpha})`;
}

/**
 * A palette ink pushed towards white (`by` > 0) or black (`by` < 0).
 *
 * ⚠️ **THIS IS THE ONLY WAY A DRAWING GETS A COLOUR THE PALETTE DOES NOT NAME.** A shade of a role is
 * still that role — a darker `player` is the ship's own underside, and a lighter `bullet` is the hot
 * heart of the ship's own shot. A hex typed into an arm would be a colour the high-contrast palette
 * could not answer, which is the failure `src/content/palette.ts` opens with.
 */
export function shade(hex: string, by: number): string {
  return mix(hex, by < 0 ? '#000000' : '#ffffff', Math.abs(by));
}

/** The same points, reflected across the sprite's centreline. */
function mirrored(points: readonly Pt[]): Pt[] {
  return points.map(([x, y]) => [x, -y] as const);
}

/** Add one closed sub-path to the current path, in frame coordinates. Fills nothing. */
function trace(ctx: Pen, f: Frame, points: readonly Pt[]): void {
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(f.half + x * f.r, f.half + y * f.r);
    else ctx.lineTo(f.half + x * f.r, f.half + y * f.r);
  });
  ctx.closePath();
}

/** Add a circle to the current path, opened at its own start so no stray line joins it. */
function ring(ctx: Pen, f: Frame, x: number, y: number, radius: number): void {
  ctx.moveTo(f.half + (x + radius) * f.r, f.half + y * f.r);
  ctx.arc(f.half + x * f.r, f.half + y * f.r, radius * f.r, 0, Math.PI * 2);
}

/**
 * Fill and outline whatever path the arm has built: the hull, sealed.
 *
 * ⚠️ **THE HULL IS FINISHED BEFORE ANY MARK GOES ON IT, AND THAT ORDER IS THE WHOLE MECHANISM.** The
 * fill and the stroke are the silhouette; everything painted afterwards sits on top and can move
 * neither the outline nor the collision box. `tests/paths.ts` records this as the first pass of the
 * trace, and every containment claim in `tests/accents.test.ts` is measured against it.
 */
function seal(ctx: Pen): void {
  ctx.fill('evenodd');
  ctx.stroke();
}

/** A filled polygon on the sprite, in one colour. `evenodd`, so a hole is one more sub-path. */
function poly(ctx: Pen, f: Frame, colour: string, points: readonly Pt[], alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.beginPath();
  trace(ctx, f, points);
  ctx.fill('evenodd');
  ctx.globalAlpha = 1;
}

/** A filled circle on the sprite. */
function disc(ctx: Pen, f: Frame, colour: string, x: number, y: number, radius: number, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ring(ctx, f, x, y, radius);
  ctx.fill('evenodd');
  ctx.globalAlpha = 1;
}

/** A band between two radii — a halo, a shockwave's inner rim, a smoke ring. */
function band(ctx: Pen, f: Frame, colour: string, x: number, y: number, outer: number, inner: number, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ring(ctx, f, x, y, outer);
  ring(ctx, f, x, y, inner);
  ctx.fill('evenodd');
  ctx.globalAlpha = 1;
}

/**
 * A soft light: solid at its centre, gone at its edge.
 *
 * ⚠️ **ALWAYS TRANSLUCENT, AND THE ALPHA IS WHAT THE GUARD READS.** A gradient's own fade is invisible
 * to `tests/paths.ts`, which records a fill as its path and the `globalAlpha` it was laid down at.
 * A glow filled at full alpha would be measured as an opaque disc and refused for leaving the hull,
 * so it is drawn under one — which is also what a glow IS. The ceiling is 0.85; `tests/accents.test.ts`
 * treats anything at or above 0.9 as solid.
 */
function glow(ctx: Pen, f: Frame, colour: string, x: number, y: number, radius: number, alpha = 0.7): void {
  const cx = f.half + x * f.r;
  const cy = f.half + y * f.r;
  const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * f.r);
  light.addColorStop(0, colour);
  light.addColorStop(0.45, rgba(colour, 0.6));
  light.addColorStop(1, rgba(colour, 0));
  ctx.globalAlpha = Math.min(alpha, 0.85);
  ctx.fillStyle = light;
  ctx.beginPath();
  ring(ctx, f, x, y, radius);
  ctx.fill('evenodd');
  ctx.globalAlpha = 1;
}

/**
 * A ragged circle: `count` points around `(x, y)` at a radius jittered between `from` and `to`.
 *
 * ⚠️ **SEEDED, PER `docs/decisions/0021-one-stream-per-concern.md`**, so a fireball is the same
 * fireball on every machine and after every re-bake, and adding one can never move a wave.
 */
/**
 * What share of a pickup's box its glyph takes; the rest is the bubble — 0236.
 *
 * ⚠️ **The extents in `src/content/sprites.ts` are the glyphs' old sizes divided by this**, so the
 * glyph on the screen is exactly the size it was and the bubble is added around it rather than
 * taken out of it. The painter scales the arm's own drawing about the centre, which is what lets
 * five arms that draw in `half` and `r` keep drawing in `half` and `r`.
 */
const PICKUP_GLYPH = 0.75;

/** The bubble's outer edge, in the frame's `r`. Inside the box: `1.14 × 0.42` of the size. */
const PICKUP_HALO = 1.14;

/**
 * How much of its box a glowing shot's body takes — the blade and the seeker, 0238. The rest of the
 * box is a soft glow in the body's own ink behind it, on the pickups' terms (`bubble`). The sprite
 * extents in `src/content/sprites.ts` are sized with this in mind, and `tests/combat.test.ts` holds
 * every hurtbox inside what is drawn.
 */
const BLADE_GLYPH = 0.8;

/**
 * A pickup's bubble: a soft glow and a thin ring in the pickup ink, painted BEHIND the glyph the arm
 * has already sealed, in the box's own full frame.
 *
 * ── A PICKUP HAS TO BE TOLD FROM AN ENEMY AT A GLANCE, AND INK ALONE WAS NOT DOING IT — 0236 ────
 *
 * Reported: *"all the power ups need a glow or bubble/circle or something around them, they're hard
 * to distinguish from enemies now."* Since 0222 the background carries hulks and cover in the same
 * lightness band as the pickup ink, and since 0233 a pickup's silhouette CHANGES while it waits;
 * what does not change, and what no enemy has, is a bubble. The ring is a shape and not an ink, so
 * 0024's rule that colour never carries meaning alone still holds.
 *
 * ⚠️ **AFTER THE SEAL AND UNDERNEATH IT, which `destination-over` is for.** The first thing an arm
 * seals is the hull — `tests/accents.test.ts` reads the first pass as the silhouette every mark is
 * measured against — so the bubble cannot be painted first without becoming the hull. It is painted
 * second, behind, and the pen is put back to `source-over` before the livery.
 *
 * ⚠️ **Translucent, both of them, so they are not solid marks outside the hull** — the rule the
 * same guard holds over every body, and the one the missile's plume already lives under at 0.6.
 * The glow peaks at 0.42 and the ring is 0.5.
 */
function bubble(ctx: Pen, f: Frame, palette: Palette): void {
  ctx.globalCompositeOperation = 'destination-over';
  band(ctx, f, palette.pickup, 0, 0, PICKUP_HALO, PICKUP_HALO - 0.07, 0.5);
  glow(ctx, f, palette.pickup, 0, 0, PICKUP_HALO, 0.42);
  ctx.globalCompositeOperation = 'source-over';
}

function ragged(rng: Rng, x: number, y: number, from: number, to: number, count: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const rad = rng.range(from, to);
    out.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
  }
  return out;
}

/*
  ── THE INTERIORS THE BOSSES ALREADY HAD — 0149 ────────────────────────────────────────────────

  ⚠️ **CARRIED ACROSS AS DRAWINGS RATHER THAN AS A TABLE, AND THEY ARE THE SAME MARKS.** 0149 put a
  cockpit, a spine, four nodes, three streaks, two bands, three eyes and a pupil on the seven bosses,
  in `space`, and measured every one of them in CSS pixels. Each is now painted by its own arm through
  `carve`, from the same numbers; what went is only the table that stood between the arm and the
  mark. The bosses' own redrawing is `docs/decisions/0228-an-enemy-wears-its-place.md`'s.
*/

/** One piece of an interior, in fractions of the hull radius `r`, measured from the sprite's centre. */
type Mark =
  | { readonly kind: 'poly'; readonly points: readonly Pt[] }
  | { readonly kind: 'disc'; readonly x: number; readonly y: number; readonly r: number };

/** A rectangular mark: a keel, a spine, a streak, an armour band. Corners in `r` from the centre. */
const box = (x0: number, y0: number, x1: number, y1: number): Mark => ({
  kind: 'poly',
  points: [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ],
});

/** A round mark: a cockpit, a node, an eye, a pupil. */
const dot = (x: number, y: number, r: number): Mark => ({ kind: 'disc', x, y, r });

/** Paint a set of marks in one colour, as one `evenodd` fill, so two that overlap cancel. */
function carve(ctx: Pen, f: Frame, colour: string, marks: readonly Mark[]): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (const mark of marks) {
    switch (mark.kind) {
      case 'poly':
        trace(ctx, f, mark.points);
        break;
      case 'disc':
        ring(ctx, f, mark.x, mark.y, mark.r);
        break;
      default: {
        const never: never = mark;
        throw new Error(`unbaked mark: ${JSON.stringify(never)}`);
      }
    }
  }
  ctx.fill('evenodd');
}

/** A cockpit behind the notched prow, then a keel back to the stern. The hull's own solidity. */
const BOSS_KEEL: readonly Mark[] = [dot(-0.3, 0, 0.14), box(-0.1, -0.1, 0.78, 0.1)];

/** The spine, and the roots of the two outer prongs sitting on it. The hull's own openness. */
const BOSS2_SPINE: readonly Mark[] = [box(-0.15, -0.09, 0.85, 0.09), dot(-0.05, -0.45, 0.11), dot(-0.05, 0.45, 0.11)];

/** A node in each of the four struts, off the hole rather than over it. The hull as a frame. */
const BOSS3_NODES: readonly Mark[] = [
  dot(0.38, -0.32, 0.09),
  dot(0.38, 0.32, 0.09),
  dot(-0.38, -0.32, 0.09),
  dot(-0.38, 0.32, 0.09),
];

/** Three streaks along the body, which is the one hull that reads as moving while it stands still. */
const BOSS4_STREAKS: readonly Mark[] = [
  box(-0.35, -0.36, 0.45, -0.24),
  box(-0.35, -0.06, 0.45, 0.06),
  box(-0.35, 0.24, 0.45, 0.36),
];

/** Two bands across the slab, forward of the ports rather than through them. The hull as a wall. */
const BOSS5_BANDS: readonly Mark[] = [box(-0.62, -0.78, -0.46, 0.78), box(-0.3, -0.78, -0.14, 0.78)];

/** An eye in each lobe, all three on the player's side. Three things that turned out to be one. */
const BOSS6_EYES: readonly Mark[] = [dot(-0.46, -0.62, 0.095), dot(-0.46, 0, 0.095), dot(-0.46, 0.62, 0.095)];

/** A pupil in the core, and four marks around the outer ring. The one round hull, looking back. */
const BOSS7_EYE: readonly Mark[] = [
  dot(0, 0, 0.16),
  dot(0.83, 0, 0.095),
  dot(-0.83, 0, 0.095),
  dot(0, -0.83, 0.095),
  dot(0, 0.83, 0.095),
];

/*
  ── THE SHIP — 0227 ────────────────────────────────────────────────────────────────────────────

  ⚠️ **ASKED FOR:** *"I want fun quirky graphics like we have in The Far Carry for the spaceships and
  weapons."* The predecessor's `src/render/shipArt.ts` — opened for that named reason and that one
  file — builds every craft from a body, a windscreen, an exhaust and a trim stripe, with a dark
  outline round the lot. That recipe is what this hull is painted with.

  ⚠️ **THE SILHOUETTE IS STILL A WEDGE WITH A CONCAVE TAIL**, which is what tells it from the lancer's
  triangle at twenty pixels (`reports/enemy-silhouettes-2026-08-05.md`), and the nose is still the one
  point the player aims with. What changed is that it has WINGS now — swept, with a trailing edge —
  and an engine housing either side of the notch, so the wedge reads as a fighter rather than as an
  arrowhead.

  ⚠️ **A TIER ADDS A PART, AND THE PART TOUCHES THE HULL WITHOUT OVERLAPPING IT.** 0081's fins were
  drawn as sub-paths outside the wedge and filled `evenodd` with it; anywhere they crossed the hull
  cancelled to a hole, which is the trap 0194 measured at **−1.34 px**. A pod sits on the wingtip and
  a canard on the leading edge, each sharing an edge with the hull and no area, so the fill rule has
  nothing to cancel and the outline runs round both — which also draws the panel line between them.
*/

/** The upper half of the fighter, nose first. The lower half is its mirror. */
const SHIP_UPPER: readonly Pt[] = [
  [1, 0],
  [0.72, -0.14],
  [0.34, -0.26],
  [0, -0.34],
  [-0.15, -0.48],
  [-0.42, -0.95],
  [-0.72, -0.95],
  [-0.55, -0.42],
  [-0.78, -0.3],
  [-0.78, -0.12],
  [-0.42, 0],
];

/** The whole hull: the upper half forward, the lower half back, one closed path. */
const SHIP_HULL: readonly Pt[] = [...SHIP_UPPER, ...mirrored(SHIP_UPPER).slice(1, -1).reverse()];

/*
  ── THE TIERS, AND THEY ARE BIG NOW — 0229 ──────────────────────────────────────────────────────

  *"We lost the ship upgrade graphics in the graphics upgrade."* 0227 fitted the pods and canards into
  the bare hull's own box, so a pod was 3.8 pixels tall on the screen the play-tests are given on. A
  tier's sprite is a wider box now (`src/content/sprites.ts`), the HULL is drawn at the bare ship's
  own size inside it, and the parts fill the room the box gained — every coordinate below is still in
  the hull's radius, and a pod reaches a third of a hull past the wingtip.
*/

/** A wingtip pod, the second tier's addition. Its base lies exactly on the wingtip edge. */
const SHIP_POD: readonly Pt[] = [
  [-0.4, -0.95],
  [-0.26, -1.32],
  [-0.9, -1.32],
  [-0.74, -0.95],
];

/** The third tier's pod: longer, and it carries a lit muzzle. */
const SHIP_POD_MK3: readonly Pt[] = [
  [-0.36, -0.95],
  [-0.14, -1.48],
  [-0.96, -1.48],
  [-0.76, -0.95],
];

/** A canard on the leading edge, the third tier's. Both base points sit on one hull edge. */
const SHIP_CANARD: readonly Pt[] = [
  [0.6, -0.178],
  [0.52, -0.72],
  [0.22, -0.72],
  [0.38, -0.247],
];

/*
  ⚠️ **NO MARK BELOW 0.12 OF `r`.** The ship is 7 units, which at the 1280×720 the play-tests are given
  on is a hull radius of about 21 CSS pixels; 0106's floor of 2.5 pixels is therefore an eighth of the
  radius, and `tests/accents.test.ts` measures every opaque mark below against it. The engine core is
  0.13 wide for exactly that reason.
*/

/** The wing's inboard panel, in the hull's own shadow. */
const SHIP_WING_PANEL: readonly Pt[] = [
  [-0.2, -0.5],
  [-0.44, -0.88],
  [-0.66, -0.88],
  [-0.52, -0.46],
];

const SHIP_CANOPY: readonly Pt[] = [
  [0.42, -0.05],
  [0.3, -0.2],
  [0.02, -0.26],
  [-0.12, -0.16],
  [-0.12, 0.16],
  [0.02, 0.26],
  [0.3, 0.2],
  [0.42, 0.05],
];

const SHIP_CANOPY_LIGHT: readonly Pt[] = [
  [0.36, -0.06],
  [0.26, -0.16],
  [0.06, -0.2],
  [0, -0.12],
];

/** The engine housing either side of the notch, in the exhaust's own colour. */
const SHIP_NACELLE: readonly Pt[] = [
  [-0.74, -0.28],
  [-0.52, -0.28],
  [-0.52, -0.14],
  [-0.74, -0.14],
];

/** The hot core in the housing. */
const SHIP_CORE: readonly Pt[] = [
  [-0.77, -0.27],
  [-0.64, -0.27],
  [-0.64, -0.15],
  [-0.77, -0.15],
];

/**
 * The fighter's paint, over a sealed hull: panels, keel, canopy and engines. The plume is an
 * entity of its own since 0230 — `src/content/exhaust.ts`.
 *
 * `tier` adds the pods' and canards' own marks, so an upgrade is a louder ship and not only a wider
 * one — `docs/game.md`: *"every upgrade changes how the ship looks on screen."*
 */
/*
  ── THE ARC'S NOSE — 0233 ─────────────────────────────────────────────────────────────────────────

  Asked for: *"each new weapon needs thematically change the style of the ship so you have a visual
  indicator of the weapon equipped."* A ship carrying the arc wears a two-pronged coil at the nose,
  with a spark across the gap; its pods carry coil bands where the pulse's carry a muzzle. The prongs
  are SILHOUETTE — 0081's rule that what the player must tell apart is told apart by more than ink —
  and each shares the hull's own nose edge and no area, on the pods' `evenodd` terms.

  ⚠️ **The tip stays inside the box.** The hull is drawn at the bare ship's size in a wider box
  (`src/content/sprites.ts`), and at 7/7.8 of the box a prong reaching 1.06 of the hull's radius
  lands at 0.95 of the box, stroke included. `tests/accents.test.ts` measures every mark's size on
  the play-test screen; a prong is well above its floor.
*/
const SHIP_PRONG: readonly Pt[] = [
  [1, 0],
  [0.72, -0.14],
  [0.86, -0.3],
  [1.06, -0.2],
];

/** The spark between the prongs: a zigzag strip in the impact ink, the width of a coil's gap. */
const SHIP_SPARK: readonly Pt[] = [
  [0.96, -0.2],
  [1.0, -0.08],
  [0.94, 0.02],
  [1.02, 0.11],
  [0.96, 0.2],
  [0.91, 0.19],
  [0.97, 0.11],
  [0.89, 0.02],
  [0.95, -0.08],
  [0.91, -0.19],
];

/*
  ── THE SHURIKEN'S BLADES — 0234 ──────────────────────────────────────────────────────────────────

  A ship carrying the shuriken launcher wears a blade on each wingtip — and, once it has pods, on
  each pod's outer edge instead, because a fin on the wing and a pod on the same edge would overlap
  and cancel under `evenodd` (0194's trap). Each shares its host's outer edge and no area.
*/
const SHIP_FIN: readonly Pt[] = [
  [-0.42, -0.95],
  [-0.72, -0.95],
  [-0.64, -1.2],
  [-0.3, -1.1],
];

const SHIP_FIN_MK2: readonly Pt[] = [
  [-0.26, -1.32],
  [-0.9, -1.32],
  [-0.74, -1.44],
  [-0.2, -1.42],
];

const SHIP_FIN_MK3: readonly Pt[] = [
  [-0.14, -1.48],
  [-0.96, -1.48],
  [-0.78, -1.6],
  [-0.08, -1.58],
];

/** A four-bladed star, hooked — the shuriken's own silhouette, traced at `scale` of the frame. */
function traceStar(ctx: Pen, f: Frame, scale: number, phase: number): void {
  for (let k = 0; k < 4; k++) {
    const a = phase + (k * Math.PI) / 2;
    const tipX = Math.cos(a) * scale;
    const tipY = Math.sin(a) * scale;
    // The trailing root sits further round than the leading one, which is the hook.
    const leadX = Math.cos(a - 0.2) * scale * 0.34;
    const leadY = Math.sin(a - 0.2) * scale * 0.34;
    const trailX = Math.cos(a + 0.7) * scale * 0.38;
    const trailY = Math.sin(a + 0.7) * scale * 0.38;
    if (k === 0) ctx.moveTo(f.half + leadX * f.r, f.half + leadY * f.r);
    else ctx.lineTo(f.half + leadX * f.r, f.half + leadY * f.r);
    ctx.lineTo(f.half + tipX * f.r, f.half + tipY * f.r);
    ctx.lineTo(f.half + trailX * f.r, f.half + trailY * f.r);
  }
  ctx.closePath();
}

function paintShip(ctx: Pen, f: Frame, palette: Palette, tier: number, weapon: WeaponKind): void {
  const body = palette.player;
  const dark = shade(body, -0.32);
  const light = shade(body, 0.5);
  // ⚠️ No plume on the hull since 0230: the exhaust is an entity that follows the ship, and a flame
  // baked here would be a second, still one under the one that moves.
  for (const side of [SHIP_WING_PANEL, mirrored(SHIP_WING_PANEL)]) poly(ctx, f, dark, side);
  /*
    ── THE LIVERY — 0241 ──────────────────────────────────────────────────────────────────────────

    Played: *"blue homing missiles, blue lightning, blue ship, it all looks the same… our ship needs
    to look a lot cooler with more colour variance."* 0194's livery was three inks all darker than
    the hull, by design, so the hull read as one blue thing with details in it. These are the
    player's OWN other colours laid on it: a stripe of the pulse's orange down each wing's leading
    edge, a light of the core's yellow at each wingtip, and the canopy's light in the impact ink.
    Every mark is inside the hull and above `tests/accents.test.ts`'s floor; none is a decoration
    ink, and the decision says why that is allowed here.
  */
  for (const side of [1, -1] as const) {
    poly(ctx, f, palette.bullet, [
      [-0.17, -0.47 * side],
      [-0.43, -0.93 * side],
      [-0.57, -0.93 * side],
      [-0.31, -0.47 * side],
    ]);
    // Tall enough to be drawn at the shipped camera — `tests/accents.test.ts` holds the floor.
    poly(ctx, f, palette.hazard, [
      [-0.45, -0.93 * side],
      [-0.69, -0.93 * side],
      [-0.65, -0.79 * side],
      [-0.47, -0.79 * side],
    ]);
  }
  // The keel, behind the canopy, in the trim ink — the seam down the hull.
  poly(ctx, f, palette.trim, [
    [-0.34, -0.07],
    [-0.1, -0.07],
    [-0.1, 0.07],
    [-0.34, 0.07],
  ]);
  if (weapon === 'arc') {
    // The coil: a glass core at the nose where the light was, a dark band down each prong so it
    // reads as a fitted part, and the spark across the gap in the one ink brighter than the hull.
    disc(ctx, f, palette.glass, 0.8, 0, 0.11);
    for (const side of [1, -1] as const) {
      poly(ctx, f, dark, [
        [0.8, -0.13 * side],
        [0.88, -0.27 * side],
        [1.0, -0.21 * side],
        [0.9, -0.1 * side],
      ]);
    }
    poly(ctx, f, palette.impact, SHIP_SPARK, 0.9);
    // Two coil bands across each wing panel, lit — the arc's livery where the pulse has none.
    for (const side of [1, -1] as const) {
      poly(ctx, f, palette.impact, [
        [-0.34, -0.56 * side],
        [-0.28, -0.56 * side],
        [-0.4, -0.84 * side],
        [-0.46, -0.84 * side],
      ], 0.7);
      poly(ctx, f, palette.impact, [
        [-0.5, -0.5 * side],
        [-0.44, -0.5 * side],
        [-0.56, -0.78 * side],
        [-0.62, -0.78 * side],
      ], 0.7);
    }
  } else {
    poly(ctx, f, light, [
      [0.94, 0],
      [0.72, -0.09],
      [0.72, 0.09],
    ]);
  }
  if (weapon === 'shuriken') {
    // A star on the keel behind the canopy, in the trim ink with a lit centre, and a dark edge along
    // each blade so the fin reads as ground steel rather than as more wing.
    ctx.fillStyle = palette.trim;
    ctx.beginPath();
    traceStar(ctx, { half: f.half - 0.26 * f.r, r: f.r }, 0.2, Math.PI / 4);
    ctx.fill('evenodd');
    disc(ctx, f, shade(palette.glass, 0.5), -0.26, 0, 0.07);
    const fin = tier >= 2 ? SHIP_FIN_MK3 : tier >= 1 ? SHIP_FIN_MK2 : SHIP_FIN;
    for (const side of [1, -1] as const) {
      poly(ctx, f, dark, [
        [fin[1]![0], fin[1]![1] * side],
        [fin[2]![0], fin[2]![1] * side],
        [fin[3]![0], fin[3]![1] * side],
        [fin[3]![0] - 0.1, (fin[3]![1] + 0.08) * side],
        [fin[2]![0] + 0.06, (fin[2]![1] + 0.08) * side],
      ]);
    }
  }
  poly(ctx, f, palette.glass, SHIP_CANOPY);
  // The canopy's light in the impact ink since 0241: a glint, not a paler pane.
  poly(ctx, f, palette.impact, SHIP_CANOPY_LIGHT, 0.85);
  for (const side of [SHIP_NACELLE, mirrored(SHIP_NACELLE)]) poly(ctx, f, palette.flame, side);
  for (const side of [SHIP_CORE, mirrored(SHIP_CORE)]) poly(ctx, f, palette.hazard, side);
  if (tier >= 1) {
    const pod = tier >= 2 ? SHIP_POD_MK3 : SHIP_POD;
    const tip = pod[1]![1];
    for (const side of [1, -1] as const) {
      // A dark band down each pod, so the pod reads as a fitted part rather than a second wing.
      poly(ctx, f, dark, [
        [-0.44, (tip + 0.06) * side],
        [-0.76, (tip + 0.06) * side],
        [-0.72, -1.02 * side],
        [-0.46, -1.02 * side],
      ]);
      if (weapon === 'arc') {
        // A coil band across the pod rather than a muzzle: the pod is a capacitor, not a gun.
        poly(ctx, f, palette.impact, [
          [-0.36, (tip + 0.06) * side],
          [-0.3, (tip + 0.06) * side],
          [-0.34, (tip + 0.3) * side],
          [-0.4, (tip + 0.3) * side],
        ], 0.8);
        poly(ctx, f, palette.impact, [
          [-0.6, (tip + 0.06) * side],
          [-0.54, (tip + 0.06) * side],
          [-0.58, (tip + 0.3) * side],
          [-0.64, (tip + 0.3) * side],
        ], 0.8);
      } else {
        // And a lit muzzle at its front: the pod is a gun, and a gun shows where it fires from.
        poly(ctx, f, palette.hazard, [
          [-0.3, (tip + 0.04) * side],
          [-0.46, (tip + 0.04) * side],
          [-0.48, (tip + 0.2) * side],
          [-0.34, (tip + 0.2) * side],
        ]);
      }
    }
  }
  if (tier >= 2) {
    // The canards' leading edges lit, in the hull's own light, and a trim seam down each.
    for (const side of [1, -1] as const) {
      poly(ctx, f, light, [
        [0.57, -0.24 * side],
        [0.5, -0.66 * side],
        [0.4, -0.66 * side],
        [0.45, -0.26 * side],
      ]);
      poly(ctx, f, palette.trim, [
        [0.4, -0.3 * side],
        [0.34, -0.62 * side],
        [0.27, -0.62 * side],
        [0.36, -0.3 * side],
      ]);
    }
  }
}

/** Which way a thrust frame leans, read off its name: +1 for a climb (the tip below), −1 for a dive. */
function leanOf(kind: SpriteKind): number {
  return kind.endsWith('Climb') ? 1 : kind.endsWith('Dive') ? -1 : 0;
}

/**
 * How far the flame's tip swings across the lane per unit of its length behind the root, in the
 * frame's `r` — the lean, 0241. A third: the burn's tip, a full radius behind the root, sits a
 * third of a radius off the line, which reads as an angle and stays inside the box.
 */
const THRUST_LEAN = 0.35;

/** Where the flame's root sits in the frame — the sprite's forward edge — and the shear's pivot. */
const THRUST_ROOT = 0.92;

/**
 * The exhaust, one state at a time — 0230's three flames, each baked level and leaning both ways
 * since 0241.
 *
 * ⚠️ **THE LEAN IS A SHEAR ABOUT THE ROOT, NOT A ROTATION.** Every point behind the root slides
 * across by `THRUST_LEAN` per unit it sits behind it, so the root stays on the nozzle, the tip
 * swings, and the two nozzles' flames stay the same length. A rotation would swing the root too and
 * shorten the flame in the box; a shear is what a flame bent by the airflow looks like.
 *
 * ⚠️ **THE NACELLES ARE 0.62 UNITS OFF THE CENTRELINE ON THE HULL**, and each kind's box is a
 * different size, so the offset is stated in units and divided by the kind's own radius here.
 */
function paintThrust(ctx: Pen, f: Frame, palette: Palette, state: ThrustKind, flick: boolean, lean: number, extent: number): void {
  const y = 0.62 / (extent * 0.42);
  const at = (x: number, off: number, side: 1 | -1): Pt => [x, off * side + lean * THRUST_LEAN * (THRUST_ROOT - x)];
  const shift = (x: number): number => lean * THRUST_LEAN * (THRUST_ROOT - x);
  for (const side of [1, -1] as const) {
    switch (state) {
      case 'idle':
        glow(ctx, f, palette.hazard, 0.55, y * side + shift(0.55), 0.5, 0.6);
        poly(ctx, f, palette.bullet, [
          at(0.92, y - 0.19, side),
          at(0.3, y - 0.16, side),
          at(flick ? -0.35 : -0.55, y, side),
          at(0.3, y + 0.16, side),
          at(0.92, y + 0.19, side),
        ], 0.8);
        poly(ctx, f, palette.hazard, [
          at(0.92, y - 0.11, side),
          at(0.4, y - 0.09, side),
          at(flick ? 0.05 : -0.1, y, side),
          at(0.4, y + 0.09, side),
          at(0.92, y + 0.11, side),
        ], 0.85);
        disc(ctx, f, palette.impact, 0.76, y * side + shift(0.76), 0.11, 0.85);
        break;
      case 'burn':
        glow(ctx, f, palette.hazard, 0.4, y * side + shift(0.4), 0.6, 0.7);
        poly(ctx, f, palette.bullet, [
          at(0.94, y - 0.17, side),
          at(0.3, y - 0.15, side),
          at(-0.3, y - 0.1, side),
          at(flick ? -1.0 : -0.85, y + (flick ? 0.02 : -0.03), side),
          at(-0.3, y + 0.1, side),
          at(0.3, y + 0.15, side),
          at(0.94, y + 0.17, side),
        ], 0.85);
        poly(ctx, f, palette.hazard, [
          at(0.94, y - 0.1, side),
          at(0.2, y - 0.08, side),
          at(flick ? -0.55 : -0.42, y, side),
          at(0.2, y + 0.08, side),
          at(0.94, y + 0.1, side),
        ], 0.9);
        poly(ctx, f, palette.impact, [
          at(0.94, y - 0.05, side),
          at(0.5, y - 0.04, side),
          at(flick ? -0.05 : 0.1, y, side),
          at(0.5, y + 0.04, side),
          at(0.94, y + 0.05, side),
        ], 0.9);
        break;
      case 'ease':
        glow(ctx, f, palette.flame, 0.7, y * side + shift(0.7), 0.4, 0.5);
        poly(ctx, f, palette.flame, [
          at(0.92, y - 0.14, side),
          at(0.5, y - 0.1, side),
          at(0.2, y, side),
          at(0.5, y + 0.1, side),
          at(0.92, y + 0.14, side),
        ], 0.6);
        break;
      default: {
        const never: never = state;
        throw new Error(`unpainted thrust ${String(never)}`);
      }
    }
  }
}

/** One bar of a numeral, as a rectangle subpath in the frame's `r` from the centre. */
function bar(ctx: Pen, f: Frame, x0: number, y0: number, x1: number, y1: number): void {
  ctx.rect(f.half + x0 * f.r, f.half + y0 * f.r, (x1 - x0) * f.r, (y1 - y0) * f.r);
}

/**
 * The badge a scattered piece wears: a disc in the pickup ink with `×N` cut out of it — 0243.
 *
 * ⚠️ **CUT OUT, NOT PAINTED ON.** The numeral is holes in the disc under `evenodd`, so what shows
 * through it is the void, and the badge is legible against anything by the rule that makes the
 * shuriken's hole legible. Seven bars make the digits, spaced so no two overlap (an overlap under
 * `evenodd` would fill again), and the cross is four arms that meet at nothing.
 */
function paintStack(ctx: Pen, f: Frame, stack: number): void {
  ring(ctx, f, 0, 0, 1);
  // The cross, left of the numeral: four arms from just off the centre outward.
  const cx = -0.5;
  for (const [dx, dy] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const ax = cx + dx * 0.07;
    const ay = dy * 0.07;
    const bx = cx + dx * 0.26;
    const by = dy * 0.26;
    // A thin quad along the arm, a bar's width across it.
    const nx = -dy * 0.05;
    const ny = dx * 0.05;
    ctx.moveTo(f.half + (ax + nx) * f.r, f.half + (ay + ny) * f.r);
    ctx.lineTo(f.half + (bx + nx) * f.r, f.half + (by + ny) * f.r);
    ctx.lineTo(f.half + (bx - nx) * f.r, f.half + (by - ny) * f.r);
    ctx.lineTo(f.half + (ax - nx) * f.r, f.half + (ay - ny) * f.r);
    ctx.closePath();
  }
  // The numeral, seven-bar, in a box from x −0.05 to 0.55 and y −0.45 to 0.45.
  const left = -0.05;
  const right = 0.55;
  const top = -0.45;
  const bottom = 0.45;
  const w = 0.11;
  const gap = 0.02;
  const segments = {
    top: () => bar(ctx, f, left, top, right, top + w),
    middle: () => bar(ctx, f, left, -w / 2, right, w / 2),
    bottom: () => bar(ctx, f, left, bottom - w, right, bottom),
    upperLeft: () => bar(ctx, f, left, top + w + gap, left + w, -w / 2 - gap),
    upperRight: () => bar(ctx, f, right - w, top + w + gap, right, -w / 2 - gap),
    lowerLeft: () => bar(ctx, f, left, w / 2 + gap, left + w, bottom - w - gap),
    lowerRight: () => bar(ctx, f, right - w, w / 2 + gap, right, bottom - w - gap),
  };
  // Two, three, or four — the ladder's height. Not a switch, on purpose: a badge is one of three
  // pictures, not one of a closed union that could grow, and the fourth bake would be a fourth arm.
  if (stack === 2) {
    segments.top();
    segments.upperRight();
    segments.middle();
    segments.lowerLeft();
    segments.bottom();
  } else if (stack === 3) {
    segments.top();
    segments.upperRight();
    segments.middle();
    segments.lowerRight();
    segments.bottom();
  } else {
    segments.upperLeft();
    segments.upperRight();
    segments.middle();
    segments.lowerRight();
  }
  seal(ctx);
}

/**
 * Draw one kind into a square canvas, pointing along +x, filling most of it.
 *
 * Everything is expressed as a fraction of `size` so a bake at any resolution is the same picture —
 * which is what lets the atlas be re-baked larger on a high-DPI screen without a second set of art.
 */
/**
 * A place's landmark — the one object in its sky that is a THING rather than a texture.
 *
 * `docs/decisions/0203-the-rule-was-never-about-size.md`. One sprite slot, and the theme decides what
 * is drawn in it: *"none of those elements are transposable to a different level"*. A theme with no
 * landmark authored yet draws nothing and its levels place none, so the slot is never a hole and
 * never a placeholder shape that would read as *the same object tinted* — which is
 * `docs/decisions/0196-the-backdrop-is-rounded-out.md`'s exact failure.
 *
 * ⚠️ **ONE INK, AT VARYING ALPHA, AND THE SILHOUETTE CARRIES THE IDENTITY.**
 * `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md` and
 * `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` both say a
 * thing is told apart by shape and never by colour. The Pillars are one of the most recognisable
 * silhouettes there is, which is why they survive being drawn in a single sky ink.
 *
 * ⚠️ **THE COLUMNS RISE ALONG -y, ACROSS THE LANE, AND THE FIRST DRAFT HAD THEM ALONG +x.** The game
 * is a horizontal scroller: +x is the direction of travel, so pillars grown towards +x lay flat and
 * came out of the shot rig as three grey banners sliding in edge-on. A column has to stand
 * perpendicular to the way the player is going or it is not reading as a column at all — which is
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` in one image, since every number about
 * it was already correct.
 */
/**
 * ⚠️ **`seed` IS WHICH CASTING THIS IS, AND IT IS AN INDEX RATHER THAN A FREE NUMBER** — 0225. A
 * landmark is a baked bitmap, so a level that places three places the same one three times; the fix is
 * three slots baked from three seeds, and this is which of them is being drawn. Every drawing keys its
 * RNG stream on it, so the three castings differ in every hand-rolled detail without differing in what
 * they ARE.
 */
function drawLandmark(
  ctx: Pen,
  ink: string,
  glow: string,
  space: string,
  size: number,
  theme: ThemeKind,
  seed: number,
): void {
  LANDMARK_OF[theme]?.(ctx, ink, glow, space, size, seed);
}


/**
 * What each place's landmark is, or `null` where none is authored.
 *
 * ⚠️ **A TABLE AT TWO, WHERE `if (theme !== 'nebula') return` WAS HONEST AT ONE.** 0203 landed the
 * Pillars behind an early return and said so — *"0203 lands one at a time"* — which is the right shape
 * for a slot with one occupant and the wrong one for a slot with two, because the second entry is
 * where a place starts being able to get the wrong drawing by not being mentioned.
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`: a `Record` over the closed union, so a new place is
 * a compile error rather than a silently empty sky, and `null` is a decision that has been taken
 * rather than a case nobody wrote.
 */
// ⚠️ **EXPORTED FOR THE GUARD THAT HOLDS THE HOLE THIS TABLE OPENS** — 0220. A `null` row is a
// decision; a LEVEL that places a landmark into a `null` row is a silent empty blit, every frame, in
// exactly the right place. `tests/places.test.ts` compares the two lists, which it cannot do from
// outside the module.
/**
 * ⚠️ **THREE COLOURS, AND THE THIRD ONE IS WHY A PLANET COULD NOT HAVE HAD A LANDMARK BEFORE** —
 * `docs/decisions/0224-the-mountain-is-awake.md`. `ink` is the place's gas and `space` is its
 * backdrop, which is exactly what the two objects authored so far are made of: the Pillars and the
 * heart are both **gas**, punched out of light. **A volcano is rock**, and it is on a planet whose
 * backdrop is a blue sky — so drawn in those two colours it is a maroon smudge in daylight.
 *
 * `glow` is the place's accent (0223), which is what everything lit in it is already drawn in — and a
 * volcano is the one object in the game whose subject IS the light coming out of it.
 */
export const LANDMARK_OF: Record<
  ThemeKind,
  ((ctx: Pen, ink: string, glow: string, space: string, size: number, seed: number) => void) | null
> = {
  approach: null,
  nebula: (ctx, ink, _glow, space, size, seed) => drawPillars(ctx, ink, space, size, seed),
  saurian: (ctx, _ink, glow, space, size, seed) => drawVolcano(ctx, glow, space, size, seed),
  labyrinth: null,
  rime: null,
  mire: null,
  core: (ctx, ink, _glow, space, size, seed) => drawHeart(ctx, ink, space, size, seed),
};

function drawPillars(ctx: Pen, ink: string, space: string, size: number, seed: number): void {
  /*
    ── THE PILLARS OF CREATION ─────────────────────────────────────────────────────────────────────

    Asked for by name: *"when the massive pipe organ kicks in music wise we see the pillars of god
    going past."* Three columns of dust, tallest on the left, each tapering upward and ending in the
    blunt fingers the real object is known for.

    The coordinates are hand-authored rather than drawn from the sky's RNG, because this is a
    specific object and not a field of marks — `fieldOf`'s streams exist so that two starfields differ,
    and there is only ever one of these.
  */
  /*
    ⚠️ **FOUR COLUMNS NOW, AND THE FOURTH IS THE DEPTH.** *"the pillars of god need a lot more
    character and depth to them."* The three 0203 authored are unchanged — they are the silhouette the
    place is already recognised by. What is added is one standing BEHIND them: `far`, which is drawn
    first and at 0.6 alpha, so the gas shows through it.

    ⚠️ **AND PARTIAL ALPHA IS THE ONLY DEPTH CUE AVAILABLE HERE.** A landmark is two colours — the
    place's gas and the place's space (0204) — so there is no third tone to put a distant object in,
    and 0081 forbids telling two things apart by colour anyway. A hole punched at 0.6 through the
    light IS a hole further back in the light, which is what atmospheric depth is in the real object.
  */
  /*
    ⚠️ **`foot` IS PER COLUMN, AND WITHOUT IT A SHORT COLUMN IS AN INVISIBLE ONE.** The landmark is 75
    units square and sits at lane 72, so its bottom eleventh is off the lane entirely — which is
    correct for the tall three, whose feet should be lost in the bank they grow out of, and fatal for
    anything short. The first pair of far columns were `height: 0.28` standing on the shared `0.97`,
    which put them entirely below the screen; the bench showed three columns where five were drawn.

    **And it is also the depth cue**, which is why it is not simply a fix. A thing further away stands
    HIGHER in a view with a horizon, so the two behind stand higher AND smaller AND fainter — three
    agreeing signals rather than one, which is 0081's rule applied to distance instead of to identity.
  */
  const columns: readonly {
    base: number;
    width: number;
    height: number;
    lean: number;
    foot: number;
    far: boolean;
  }[] = [
    { base: 0.84, width: 0.05, height: 0.3, lean: -0.02, foot: 0.74, far: true },
    { base: 0.19, width: 0.042, height: 0.24, lean: 0.03, foot: 0.71, far: true },
    { base: 0.34, width: 0.15, height: 0.92, lean: 0.04, foot: 0.97, far: false },
    { base: 0.56, width: 0.11, height: 0.68, lean: -0.03, foot: 0.94, far: false },
    { base: 0.73, width: 0.08, height: 0.46, lean: 0.02, foot: 0.88, far: false },
  ];

  /*
    ── THE GAS FIRST, AND THE COLUMNS ARE PUNCHED OUT OF IT ────────────────────────────────────────

    ⚠️ **THE FIRST VERSION HAD THIS BACKWARDS AND THE SHOT RIG SHOWED IT.** The columns were drawn in
    sky ink over Ember Nebula's deep maroon, so they came out LIGHTER than the field behind them —
    cold grey rock floating on a smooth wash. The Eagle Nebula's entire signature is the opposite:
    dark dust silhouetted against bright gas, and the pillars are holes in the light rather than
    objects in front of it.

    So the gas is drawn in the sky ink and the columns are filled in `space` — the background colour
    — which makes them read as cut out of the glow. Against bare space they vanish, which is correct:
    a pillar with no gas behind it is not visible in the real object either.

    Three lobes rather than one wash, because a single radial gradient is a smudge and reads as a
    lens flare. Overlapping lobes give the mass an edge in places and none in others, which is what
    makes it gas.
  */
  const lobes: readonly { x: number; y: number; r: number; a: number }[] = [
    /*
      ⚠️ **EVERY RADIUS FITS INSIDE THE SPRITE, AND THE FIRST SET DID NOT.** A radial gradient fades
      to transparent at `r`, but `fillRect` clips it at the tile's edge — so a lobe wider than its
      own distance from the edge ends on a straight vertical line, and the shot rig showed exactly
      that: a faint rectangle around the gas, in open space, at the sprite's boundary. The rule is
      `r <= min(x, 1 - x)`, and it is the kind of defect no number in this file would ever have
      reported.
    */
    /*
      ⚠️ **THE RULE IS `r <= min(x, 1 - x, y, 1 - y)` AND IT WAS WRITTEN AS THE x HALF ONLY.**
      `fillRect` clips at all four edges, not two — and the first lobe was `y: 0.62, r: 0.44`, which is
      0.06 of a tile past the bottom. It ended on a straight horizontal line at about 13% alpha,
      underneath the columns' feet, which is why five months of shots did not report it. The `r` values
      below are the largest each centre can carry; nothing else about the gas moved.
    */
    { x: 0.46, y: 0.6, r: 0.4, a: 0.95 },
    { x: 0.68, y: 0.42, r: 0.3, a: 0.75 },
    { x: 0.28, y: 0.38, r: 0.26, a: 0.6 },
    // Added with the columns: a hot core high between the two tallest, and two soft flanks that give
    // the mass an edge in places and none in others — 0203's own reason for there being more than one.
    { x: 0.44, y: 0.28, r: 0.2, a: 0.85 },
    { x: 0.8, y: 0.68, r: 0.17, a: 0.5 },
    { x: 0.15, y: 0.7, r: 0.14, a: 0.45 },
  ];
  for (const lobe of lobes) {
    const glow = ctx.createRadialGradient(
      size * lobe.x,
      size * lobe.y,
      size * lobe.r * 0.12,
      size * lobe.x,
      size * lobe.y,
      size * lobe.r,
    );
    glow.addColorStop(0, ink);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = lobe.a;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }

  /*
    ── AND THE COLUMNS ─────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE EDGE IS SAMPLED AND KNOBBED RATHER THAN NAMED IN FOUR POINTS.** 0203's version was a
    four-point windward edge and a three-point lee, which is a smooth wedge — the report was that it
    wants *character*, and character in this object is the lumpiness: the knots of denser dust that
    survive being eaten away while the gas around them does not. So the edge is walked in eight steps
    with a bump at each, from a seeded stream so the bake is the same picture every time.

    ⚠️ **THE BUMPS ARE ONE-SIDED.** `-0.12` to `+0.34` of a half-width — a knot sticks OUT into the
    light much further than a hollow eats in, because the hollow is what the light is doing. A
    symmetric jitter came out as a wobbly line rather than a knotted one.
  */
  const rng = makeRng('sky').stream(`nebula/pillars${seed}`);
  const EDGE_STEPS = 8;

  for (const column of columns) {
    // The feet sit low and the tips reach up: -y is up, across the lane.
    const foot = size * column.foot;
    const tip = foot - size * column.height;
    const mid = size * column.base;
    const halfWidth = (size * column.width) / 2;
    // Narrower at the top than the bottom — the taper is what makes a column read as a column.
    const tipHalf = halfWidth * 0.42;
    const drift = size * column.lean;
    const rise = foot - tip;

    /*
      The half-width at height `t`, tapering to the tip and flaring back out over the bottom quarter.
      **The flare is the plinth**: a pillar of this kind does not stand on the ground, it grows out of
      the bank it is the last of, and a column that meets its own foot at a constant width reads as a
      post that was put there.
    */
    const spanAt = (t: number): number =>
      (halfWidth + (tipHalf - halfWidth) * t) * (1 + 0.4 * Math.max(0, 1 - t * 4));

    // The windward edge, kept as its own list so the body, the lit face and the rim cannot disagree.
    const windward: [number, number][] = [];
    for (let s = 0; s <= EDGE_STEPS; s += 1) {
      const t = s / EDGE_STEPS;
      // The ends are left clean: a knob on the foot is a rock, and a knob on the tip fights the fingers.
      const knob = s === 0 || s === EDGE_STEPS ? 0 : rng.range(-0.16, 0.5) * halfWidth;
      windward.push([mid - spanAt(t) - knob + drift * t, foot - rise * t]);
    }

    const trace = (): void => {
      ctx.beginPath();
      ctx.moveTo(windward[0]![0], windward[0]![1]);
      for (let i = 1; i < windward.length; i++) ctx.lineTo(windward[i]![0], windward[i]![1]);
    };

    // A hole in the gas, not a shape on top of it — and a PARTIAL hole for the two standing behind.
    ctx.globalAlpha = column.far ? 0.6 : 1;
    ctx.fillStyle = space;
    trace();
    /*
      The blunt fingers at the top, which are the thing that makes it THESE pillars. **Two fingers and
      a notch between them**, drawn tall enough to survive the object being three hundred pixels of
      screen: 0203's version reached up a flat `size * 0.035` and read as a point once the column was
      tapered, which is the one part of the silhouette a viewer already has a picture of.
    */
    const reach = tipHalf * 1.4;
    ctx.lineTo(mid - tipHalf * 0.75 + drift, tip - reach);
    ctx.lineTo(mid - tipHalf * 0.15 + drift, tip - reach * 0.85);
    ctx.lineTo(mid + tipHalf * 0.05 + drift, tip + reach * 0.35);
    ctx.lineTo(mid + tipHalf * 0.6 + drift, tip - reach * 0.7);
    ctx.lineTo(mid + tipHalf + drift, tip + reach * 0.1);
    // And back down the lee side, which is smoother — the columns are lit from one side.
    for (let s = EDGE_STEPS; s >= 0; s -= 1) {
      const t = s / EDGE_STEPS;
      ctx.lineTo(mid + spanAt(t) * 0.88 + drift * t * 0.6, foot - rise * t);
    }
    ctx.closePath();
    ctx.fill();

    /*
      ⚠️ **THE LIT FACE, WHICH IS WHAT MAKES THE COLUMN A SOLID RATHER THAN A CUT-OUT.** Gas ink at a
      tenth, stroked along a line offset a little way INSIDE the windward edge — so the column runs
      light where it turns towards the star and dark through its core. A rim alone draws the outline
      of a hole; this is the only mark in the object that says there is something between its two
      edges.

      It is drawn at a fraction of a half-width and therefore stays inside the body it is shading,
      which is why it needs no clip — a clip here would be a third state for `Pen` to carry.
    */
    ctx.globalAlpha = column.far ? 0.07 : 0.18;
    ctx.strokeStyle = ink;
    ctx.lineWidth = halfWidth * 0.55;
    ctx.beginPath();
    for (let s = 0; s <= EDGE_STEPS; s += 1) {
      const t = s / EDGE_STEPS;
      const x = windward[s]![0]! + spanAt(t) * 0.45;
      if (s === 0) ctx.moveTo(x, windward[s]![1]!);
      else ctx.lineTo(x, windward[s]![1]!);
    }
    ctx.stroke();

    // A rim on the windward edge — the gas lit up where it meets the dust. It is the brightest thing
    // on the column and is what stops the silhouette reading as a flat cut-out.
    ctx.globalAlpha = column.far ? 0.4 : 0.85;
    ctx.lineWidth = Math.max(1, size * (column.far ? 0.005 : 0.01));
    trace();
    ctx.stroke();

    /*
      ── THE STREAMERS ────────────────────────────────────────────────────────────────────────────

      Gas boiling off the tips and being carried away leeward. **It is the one part of this object
      that is in motion**, and it is what the columns are FOR: the whole shape is the leftover of
      something being blown apart from above.

      Drawn in gas ink and fading out, so they read as light rather than as more dust — the opposite
      of everything else here, which is why they are the last thing drawn.

      ⚠️ **THE ARC IS SAMPLED INTO `lineTo` RATHER THAN DRAWN WITH A CURVE VERB.** `Pen` is fifteen
      members on purpose — it is what lets `tests/paths.ts` implement one and read back where the ink
      actually went — and `quadraticCurveTo` is not among them. Widening a type that exists to be
      narrow, so that three wisps can be one call each instead of six, is the wrong trade.
    */
    if (!column.far) {
      ctx.lineWidth = Math.max(1, size * 0.004);
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 3; i += 1) {
        const from = mid + rng.range(-0.6, 0.9) * tipHalf + drift;
        const reach = rng.range(0.06, 0.15) * size;
        ctx.beginPath();
        ctx.moveTo(from, tip);
        for (let s = 1; s <= 6; s += 1) {
          const t = s / 6;
          // One quadratic, evaluated: the control point is leeward and low, so the wisp leaves the
          // tip going up and is bent away — which is the direction the light is coming from.
          const cx = from + reach * 0.4;
          const cy = tip - reach * 0.7;
          const x = (1 - t) * (1 - t) * from + 2 * (1 - t) * t * cx + t * t * (from + reach * 1.4);
          const y = (1 - t) * (1 - t) * tip + 2 * (1 - t) * t * cy + t * t * (tip - reach);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * Saurian Belt's landmark — a mountain that is doing something.
 *
 * Asked for: *"saurian needs blue skies, but exploding volcanoes adding volcanic effects at some
 * points in the level."* `docs/decisions/0224-the-mountain-is-awake.md`.
 *
 * ⚠️ **THE FIRST LANDMARK THAT IS NOT MADE OF GAS, AND THE FIRST ON A PLANET.** The Pillars and the
 * heart are both holes punched in light, drawn in the backdrop colour with the place's gas behind
 * them — which works because both stand in gas. A volcano stands on **rock**, under a **blue sky**,
 * and the thing worth looking at is the light coming OUT of it. So it inverts the construction the
 * other two share: a solid dark body, and the glow on top of it rather than behind.
 *
 * ⚠️ **AND *"AT SOME POINTS IN THE LEVEL"* IS A POSITION, WHICH IS WHAT THE SLOT WAS BUILT FOR.**
 * `docs/decisions/0203-the-rule-was-never-about-size.md` made a landmark the one thing in the sky that
 * can be somewhere; Saurian Belt places **three**, which is the first level to place more than one.
 */
function drawVolcano(ctx: Pen, glow: string, dark: string, size: number, seed: number): void {
  /*
    ⚠️ **THE BASE SITS LOW IN THE SPRITE AND THE PLUME FILLS THE TOP TWO THIRDS.** A mountain is
    mostly the thing above it: a cone drawn to fill the tile is a triangle, and a cone in the bottom
    third with a column of ash over it is an eruption. `at: 0.78` of the sprite, which at `lane: 68`
    puts the feet on the near ridge and the plume across the sky above it.
  */
  /*
    ⚠️ **THE FOOT IS BELOW THE TILE'S LANE ON PURPOSE, BECAUSE THE GROUND IS DRAWN OVER IT.** On a
    planet the ground layer is painted LAST (0221), so a volcano whose base stops short of the
    ridgelines is a mountain hanging in the air — the bench showed exactly that. At `0.92` the cone
    runs off the bottom of its own sprite and the near ridge closes over it, which is what *standing
    on something* looks like when the something is drawn in front.
  */
  /*
    ⚠️ **THE SEED SHAPES THE MOUNTAIN AND NOT ONLY ITS SMOKE, WHICH IS THE DIFFERENCE BETWEEN THREE
    CASTINGS AND ONE** — 0225. The first version keyed only the RNG-driven details on it: the plume's
    jitter, where the lava wandered, where the bombs went. Two of them on screen together read as **the
    same mountain venting differently**, which is the report with an extra step in it. Height, width,
    crater and flank all move now, so the three are three mountains.

    ⚠️ **AND THE FLANK EXPONENT IS THE ONE THAT MATTERS MOST.** It is what makes a cone a cone rather
    than a pyramid or a funnel — 1.05 is nearly straight-sided and 1.3 is a steep-shouldered stratocone,
    and the eye reads the difference as two mountains long before it reads a change in height.
  */
  const rng = makeRng('sky').stream(`saurian/volcano${seed}`);
  const foot = size * 0.92;
  const peak = size * rng.range(0.26, 0.36);
  const mid = size * 0.5;
  const half = size * rng.range(0.28, 0.38);
  const crater = size * rng.range(0.038, 0.062);
  const flank = rng.range(1.05, 1.3);

  /*
    ── THE ASH, FIRST AND FURTHEST BACK ────────────────────────────────────────────────────────────

    ⚠️ **PUFFS AND NOT A POLYGON, AND THE POLYGON WAS THE FIRST DRAFT.** A column that widens as it
    rises is what a plume DOES, and drawn as one filled shape it came out of the bench as an **anvil
    with a flat top** — because a path up one side and down the other joins its two ends with a
    straight line, and the one edge nobody authored is the one at the top where the eye goes. Ash
    billows; nine overlapping discs of falling opacity billow and a trapezoid cannot.

    Drawn in the dark before the cone, so the cone closes over their roots and the two are one object.
  */
  ctx.fillStyle = dark;
  for (let s = 0; s < 9; s += 1) {
    const t = s / 8;
    // Squared, so the column is still tight just above the crater and wide by the top of the tile.
    const spread = t * t;
    ctx.globalAlpha = 0.62 * (1 - t * 0.55);
    ctx.beginPath();
    ctx.arc(
      mid + rng.range(-0.05, 0.05) * size * (0.3 + spread),
      peak - t * size * 0.27,
      size * (0.045 + spread * 0.15),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  /*
    ── THE CONE ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **CONCAVE FLANKS, WHICH IS THE ONE THING THAT MAKES IT A VOLCANO AND NOT A HILL.** A straight
    line from foot to crater is a pyramid; a real cone is steep at the top and flares out at the
    bottom, and the eye knows the difference without being able to say why. `t ** 1.6` is that flare.
  */
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(mid - half, foot);
  for (let s = 1; s <= 8; s += 1) {
    const t = s / 8;
    ctx.lineTo(mid - crater - (half - crater) * (1 - t) ** flank, foot - t * (foot - peak));
  }
  ctx.lineTo(mid + crater, peak);
  for (let s = 8; s >= 1; s -= 1) {
    const t = s / 8;
    ctx.lineTo(mid + crater + (half - crater) * (1 - t) ** flank, foot - t * (foot - peak));
  }
  ctx.lineTo(mid + half, foot);
  ctx.closePath();
  ctx.fill();

  /*
    ── AND THE LIGHT, WHICH IS THE WHOLE SUBJECT ───────────────────────────────────────────────────

    The crater first, then what is running down the flanks from it. **Lava is drawn thin and tapering
    and never as a wash**: a glowing area on a mountainside reads as a lit slope, and a glowing LINE
    reads as something moving.
  */
  ctx.strokeStyle = glow;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.moveTo(mid - crater, peak);
  ctx.lineTo(mid + crater, peak);
  ctx.lineTo(mid + crater * 0.55, peak + size * 0.035);
  ctx.lineTo(mid - crater * 0.55, peak + size * 0.035);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 4; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const wander = rng.range(0.2, 0.9);
    ctx.globalAlpha = 0.75;
    for (let s = 1; s <= 5; s += 1) {
      const a = (s - 1) / 5;
      const b = s / 5;
      const at = (u: number): number[] => [
        mid + side * (crater + (half - crater) * u ** flank * wander),
        peak + u * (foot - peak),
      ];
      ctx.lineWidth = Math.max(1, size * 0.012 * (1 - a * 0.7));
      ctx.beginPath();
      ctx.moveTo(at(a)[0]!, at(a)[1]!);
      ctx.lineTo(at(b)[0]!, at(b)[1]!);
      ctx.stroke();
    }
  }

  /*
    ⚠️ **AND SOMETHING THROWN CLEAR, BECAUSE *EXPLODING* IS A WORD IN THE REPORT.** A plume and a lit
    crater are a mountain venting; bombs arcing away from it are a mountain going off. They are drawn
    in the glow and small — well under a bullet, which is the band 0203 puts on anything the sky
    draws and which this object is otherwise far above.
  */
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 7; i += 1) {
    const side = rng.range(0, 1) < 0.5 ? -1 : 1;
    const out = rng.range(0.12, 0.4);
    const x = mid + side * out * size;
    const y = peak - rng.range(0.02, 0.3) * size + out * out * size * 0.6;
    const r = rng.range(0.004, 0.008) * size;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * The Black Heart's landmark — the thing the place is named after, finally on screen.
 *
 * Asked for by name: *"black heart needs to be a beating black heart."* And then, of the first one:
 * *"the heart on level 7 is a very adorable love heart, but we need a pulsing black 'heart' not a
 * love heart."* — 0229.
 *
 * ⚠️ **IT IS THE PILLARS' OWN CONSTRUCTION AND NOT A SECOND STYLE.** Lobes of gas, a silhouette
 * punched out of them in the space colour, and a lit rim on the side the light is on
 * ([0204](docs/decisions/0204-a-landmark-is-lit-by-the-place-it-stands-in.md)). What makes it a
 * different object is the shape and the fact that it MOVES; a second visual language for the second
 * landmark would be `docs/decisions/0196-the-backdrop-is-rounded-out.md`'s failure with the axes
 * pointing the other way.
 *
 * ⚠️ **AN ORGAN, NOT A VALENTINE.** 0220 chose the card curve on 0203's argument that a recognisable
 * silhouette survives being flat, and the report is that it was recognised — as a greetings card.
 * The outline is a hand-drawn mass now: a big left ventricle coming to an apex low and to one side,
 * a smaller right one beside it, two atria bulging on top, and an aorta arching up and over with the
 * great vessels beside it. Asymmetric in every axis, which is the whole difference; the lean the
 * curve used to need is in the shape itself. What stops it being a lump at a fifth of a screen is
 * the same three things as before: it is a hole in light, it has a lit rim and a sheen, and it beats.
 */
function drawHeart(ctx: Pen, ink: string, space: string, size: number, seed: number): void {
  /*
    ⚠️ **THE GAS IS BEHIND IT AND IT IS A RING, NOT A DISC.** The Black Heart is the last place and its
    character is absence — `SKY_STYLE_OF.core` is the sparsest sky in the game. A filled glow here
    would make it the brightest thing in the level; three lobes arranged AROUND the silhouette leave
    the middle dark, so what the player sees is a hole with light escaping past its edges.

    Every radius obeys `r <= min(x, 1 - x, y, 1 - y)`, which is the rule the Pillars' gas learned the
    hard way: `fillRect` clips a radial gradient at all four edges, and a lobe wider than its own
    distance from one of them ends on a straight line.
  */
  const lobes: readonly { x: number; y: number; r: number; a: number }[] = [
    { x: 0.5, y: 0.26, r: 0.25, a: 0.85 },
    { x: 0.25, y: 0.6, r: 0.25, a: 0.65 },
    { x: 0.76, y: 0.62, r: 0.24, a: 0.55 },
  ];
  for (const lobe of lobes) {
    const glow = ctx.createRadialGradient(
      size * lobe.x,
      size * lobe.y,
      size * lobe.r * 0.12,
      size * lobe.x,
      size * lobe.y,
      size * lobe.r,
    );
    glow.addColorStop(0, ink);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = lobe.a;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }

  /*
    ⚠️ **THE SEED MOVES THE MUSCLE, NOT ONLY THE TILT — 0225.** Every landmark drawing takes the
    casting index and has to use it; here it sets how far the apex hangs and how full the right side
    is, so the three castings are three hearts rather than one heart leaning three ways.
  */
  const rng = makeRng('sky').stream(`core/heart${seed}`);
  const droop = rng.range(0.0, 0.08);
  const fullness = rng.range(-0.04, 0.05);
  const cx = size * 0.5;
  const cy = size * 0.5;
  const k = size * 0.3;
  /*
    The outline, clockwise from the apex, in a frame where +y is DOWN — a chest seen from the front
    with the apex at the lower left. Every point is a hand's guess at a muscle and none is a curve.
  */
  const body: readonly Pt[] = [
    [-0.34, 0.98 + droop],
    [-0.62, 0.72],
    [-0.84, 0.36],
    [-0.9, -0.04],
    [-0.8, -0.34],
    [-0.6, -0.52],
    [-0.38, -0.5],
    [-0.22, -0.6],
    [-0.02, -0.5],
    [0.14, -0.62],
    [0.4, -0.64],
    [0.66, -0.5],
    [0.82 + fullness, -0.22],
    [0.86 + fullness, 0.14],
    [0.74, 0.48],
    [0.5, 0.74],
    [0.16, 0.9],
  ];
  const at = ([x, y]: Pt): [number, number] => [cx + x * k, cy + y * k];

  const traceBody = (): void => {
    ctx.beginPath();
    body.forEach((p, i) => {
      const [x, y] = at(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };

  /*
    ── THE GREAT VESSELS ───────────────────────────────────────────────────────────────────────────

    An aorta rising from the middle and arching over to the right, a pulmonary trunk beside it and a
    vena cava on the left, each thinning as it goes. **Drawn BEFORE the body so the body closes over
    their roots** — a tube that meets the heart on a visible seam reads as a pipe bolted to it, and
    this thing has to look grown. The reaches stop short of the sprite's top edge: a vessel cut off by
    the tile boundary is a straight line across the sky.
  */
  ctx.globalAlpha = 1;
  ctx.strokeStyle = space;
  ctx.lineCap = 'round';
  const vessels: readonly { path: readonly Pt[]; width: number }[] = [
    // The aorta: up, over, and down the far side.
    { path: [[-0.02, -0.45], [0.02, -0.85], [0.22, -1.08], [0.5, -1.06], [0.66, -0.9]], width: 0.17 },
    // The pulmonary trunk, crossing behind the aorta's root.
    { path: [[0.2, -0.5], [0.3, -0.8], [0.52, -0.9]], width: 0.11 },
    // The vena cava, straight up off the right atrium — the player's left.
    { path: [[-0.5, -0.4], [-0.56, -0.8], [-0.52, -1.05]], width: 0.12 },
  ];
  for (const vessel of vessels) {
    const segments = vessel.path.length - 1;
    for (let s = 0; s < segments; s++) {
      // Segment by segment, because a vessel narrows and `Pen` has no variable-width stroke.
      ctx.lineWidth = Math.max(1, k * vessel.width * (1 - (s / segments) * 0.45));
      ctx.beginPath();
      const [x0, y0] = at(vessel.path[s]!);
      const [x1, y1] = at(vessel.path[s + 1]!);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  // The body: a hole in the light, opaque, exactly as a Pillar is.
  ctx.fillStyle = space;
  traceBody();
  ctx.fill();

  /*
    ── THE SURFACE ─────────────────────────────────────────────────────────────────────────────────

    The furrow between the two ventricles, and the coronary vessels branching off it — thin lines of
    the gas colour at a low alpha, which is muscle catching the light from behind. Without them the
    silhouette is a flat shape; with them it has an inside.
  */
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = Math.max(1, k * 0.045);
  const furrows: readonly (readonly Pt[])[] = [
    [[0.02, -0.4], [-0.06, 0.1], [-0.2, 0.5], [-0.3, 0.86]],
    [[-0.06, 0.1], [-0.38, 0.06], [-0.6, 0.22]],
    [[-0.2, 0.5], [0.1, 0.42], [0.36, 0.5]],
    [[0.34, -0.3], [0.5, 0.0], [0.56, 0.36]],
  ];
  for (const furrow of furrows) {
    ctx.beginPath();
    furrow.forEach((p, i) => {
      const [x, y] = at(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // The sheen: the left ventricle's flank, where the light behind it grazes the muscle.
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = ink;
  const sheen: readonly Pt[] = [
    [-0.7, 0.2],
    [-0.8, -0.1],
    [-0.66, -0.36],
    [-0.5, -0.3],
    [-0.56, 0.1],
    [-0.5, 0.46],
  ];
  ctx.beginPath();
  sheen.forEach((p, i) => {
    const [x, y] = at(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();

  // And the rim, on the side the gas is thickest — the light getting past the edge of the hole.
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = Math.max(1, size * 0.009);
  traceBody();
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * The land a place stands on, or `null` for a place in space.
 *
 * `docs/decisions/0221-a-planet-is-not-a-space.md`. Reported: *"the planets still have the starry
 * space backdrop visible, ground features need be properly have nothing behind them and the sky in
 * the background needs to match the sky."*
 *
 * ⚠️ **OPAQUE, AND THAT IS THE WHOLE DIFFERENCE FROM `STRUCTURE_OF`.** 0220 put a planet's ridges in
 * the structure table, which paints marks at an alpha onto the WEATHER tile — and the weather tile is
 * drawn first, so the star fields came down through the mountains. *Nothing behind it* is not a
 * heavier alpha; it is a different layer, drawn last, filled solid.
 *
 * ⚠️ **AND IT MUST AGREE WITH `THEMES[theme].ground` EXACTLY.** A place with a row here and no colour
 * draws its land in whatever the last place left behind; a place with a colour and no row draws
 * nothing and loses its star fields as well, so it is simply empty. `tests/places.test.ts` holds the
 * two lists equal — 0220's `LANDMARK_OF` hole, which is now a shape this file has twice.
 *
 * ⚠️ **TILE y 0.25 TO 0.75 IS THE LANE**, exactly as it is for the weather: `SPRITE_EXTENT.skyGround`
 * is twice `ACROSS_SPAN` and blitted centred, so half of what is drawn here is off the screen. It has
 * caught this repository three times and every horizon below is written against it.
 */
/**
 * ⚠️ **THREE COLOURS, AND THE THIRD ONE IS A LIGHT SOURCE.** `land` and `sky` are the two a horizon
 * needs — a silhouette and what it is a silhouette against. The Toxic Mire needs a third: *"the toxic
 * pools below"* have to GLOW, and its sky is a murk deliberately darker than anything, so drawing
 * water in it gives a black pool in a black bank. `glow` is the place's own gas — the brightest colour
 * it has, and the one its haze is already made of, so the pools and the air over them are lit by one
 * thing rather than by two.
 */
export type GroundArt = (ctx: Pen, land: string, sky: string, glow: string, size: number) => void;

export const GROUND_OF: Record<ThemeKind, GroundArt | null> = {
  approach: null,
  nebula: null,
  /*
    ⚠️ **THE CRESTS TAKE THE PLACE'S ACCENT AND NOT ITS SKY — 0223.** A skyline lit in the colour of
    the sky behind it is the sky showing over the edge of the rock, which is true and is also **one
    colour touching itself**: the bench showed a blue range under a blue sky with a blue rim, and
    *"they're still a solo colour"* is exactly that. Lit in the accent, a ridge is the sun on it and the
    place has three colours on screen at once — sky, rock, and the light.
  */
  saurian: (ctx, land, sky, glow, size) => drawRidges(ctx, land, sky, glow, size),
  labyrinth: null,
  rime: (ctx, land, sky, glow, size) => drawShelf(ctx, land, sky, glow, size),
  mire: (ctx, land, sky, glow, size) => drawEnclosure(ctx, land, sky, glow, size),
  core: null,
};

function drawGround(ctx: Pen, land: string, sky: string, glow: string, size: number, theme: ThemeKind): void {
  GROUND_OF[theme]?.(ctx, land, sky, glow, size);
}

/**
 * Where the lane starts and ends inside a tile that is twice as tall as it — the visible band.
 *
 * ⚠️ **EXPORTED, BECAUSE THE NUMBER HAD ALREADY BEEN WRITTEN DOWN TWICE.** `tests/places.test.ts`
 * carried its own `0.25` to convert a tile fraction into a lane position, which is the second copy
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` is about — and this particular number has
 * caught the repository three times (The Approach's horizon at 0.86, the Pillars' feet at 0.97, and
 * Saurian Belt's first ridges). A constant that two files disagree about would be the fourth.
 */
export const LANE_TOP = 0.25;
export const LANE_BOTTOM = 0.75;
/**
 * A tile fraction as a position across the lane, 0 to `ACROSS_SPAN`.
 *
 * Derived from the tile's own extent rather than from `ACROSS_SPAN`, because the band above is only
 * the middle half BECAUSE the tile is twice the lane — so a tile that changed width would move this
 * without anybody having to remember to.
 */
export function laneAt(fraction: number): number {
  return (fraction - LANE_TOP) * SPRITE_EXTENT.skyGround;
}

/**
 * Fill a skyline, opaquely, from a run of heights down to the bottom of the tile.
 *
 * ⚠️ **DOWN TO 1, NOT TO A NUMBER THAT LOOKED FAR ENOUGH.** 0220's ridges closed at tile 0.84 because
 * that was comfortably past the lane — and it is, until the tile is blitted a fraction of a pixel
 * out or a device widens the lane, at which point there is a hairline of sky under a mountain. A
 * ground that ends anywhere is a ground with an edge.
 */
function fillTo(ctx: Pen, colour: string, crest: readonly number[][], size: number, downward: boolean): void {
  ctx.globalAlpha = 1;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(crest[0]![0]!, crest[0]![1]!);
  for (let i = 1; i < crest.length; i += 1) ctx.lineTo(crest[i]![0]!, crest[i]![1]!);
  const edge = downward ? size : 0;
  ctx.lineTo(crest[crest.length - 1]![0]!, edge);
  ctx.lineTo(crest[0]![0]!, edge);
  ctx.closePath();
  ctx.fill();
}

/**
 * A run of heights across the whole tile, ending where it began so the tile joins.
 *
 * @param jag How far a point may sit from the base, as a fraction of the tile.
 */
function skyline(
  size: number,
  stream: string,
  base: number,
  jag: number,
  steps: number,
  bias: 'even' | 'down' = 'even',
): number[][] {
  const rng = makeRng('sky').stream(stream);
  const out: number[][] = [];
  for (let s = 0; s <= steps; s += 1) {
    // ⚠️ Sampled around `base` rather than walked from the last point: a walk drifts, and a drifting
    // horizon is a hill. Rock against a sky is peaks that all return to the same level. 0207's rule
    // is met by forcing the ends, which is why they are drawn from `base` exactly.
    let off = rng.range(-jag, jag);
    /*
      ⚠️ **SQUARED AND ONE-SIDED, WHICH IS WHAT MAKES SOMETHING HANG RATHER THAN UNDULATE.** A uniform
      draw puts most samples in the middle of its range, so an evenly-sampled edge is busy everywhere
      and extreme nowhere. Squaring pushes the mass towards zero and leaves the occasional long reach,
      which is the difference between *a bumpy ceiling* and *things hanging off one*.
    */
    if (bias === 'down') off = ((off / jag) ** 2) * jag;
    const y = s === 0 || s === steps ? base : base + off;
    out.push([(s / steps) * size, y * size]);
  }
  return out;
}

/**
 * ── SAURIAN BELT: A RANGE UNDER A BLUE SKY ────────────────────────────────────────────────────────
 *
 * Three ridgelines, opaque, each nearer and lower and lighter-edged than the one behind it. 0220 drew
 * these as structure marks and this is the same silhouette with the light taken out from behind it.
 *
 * ⚠️ **THE FAR RANGE IS DRAWN IN A COLOUR MIXED TOWARDS THE SKY, WHICH IS THE ONLY REAL DEPTH CUE
 * THERE IS HERE.** Air between you and a mountain is what makes a distant one pale — and it is the
 * one cue that survives everything being opaque, since alpha is no longer available to say *far*.
 * Three flat silhouettes in one colour is a stencil; three in three tones is a landscape.
 */
function drawRidges(ctx: Pen, land: string, sky: string, glow: string, size: number): void {
  const RANGES = [
    { base: 0.6, jag: 0.026, haze: 0.55, steps: 26, lit: 0.3 },
    { base: 0.655, jag: 0.04, haze: 0.28, steps: 19, lit: 0.45 },
    { base: 0.715, jag: 0.055, haze: 0, steps: 14, lit: 0.6 },
  ];
  for (const range of RANGES) {
    const crest = skyline(size, `saurian/range${range.steps}`, range.base, range.jag, range.steps);
    fillTo(ctx, mix(land, sky, range.haze), crest, size, true);
    // The sun catching the tops. Drawn in the sky's own colour, which is where the light is coming
    // from — the crest is literally the sky showing over the edge of the rock.
    ctx.globalAlpha = range.lit;
    ctx.strokeStyle = glow;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, size * 0.0035);
    ctx.beginPath();
    ctx.moveTo(crest[0]![0]!, crest[0]![1]!);
    for (let i = 1; i < crest.length; i += 1) ctx.lineTo(crest[i]![0]!, crest[i]![1]!);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * ── RIME SHELF: AUSTERE ───────────────────────────────────────────────────────────────────────────
 *
 * Asked for: *"rime shelf needs to be icy and austere."*
 *
 * ⚠️ **AUSTERE IS A COUNT BEFORE IT IS A SHAPE, AND THE COUNT GOES DOWN.** 0220 gave this place three
 * terraces of stepped tables and it came out BUSY — a skyline with a corner every twentieth of a tile
 * reads as a city. An ice shelf is one long flat line with almost nothing happening on it, and what
 * makes it cold is the emptiness rather than a feature that says *ice*.
 *
 * So: **two** terraces, not three; long runs, not short ones; and the only relief is the occasional
 * pressure ridge where the sheet has buckled.
 */
function drawShelf(ctx: Pen, land: string, sky: string, glow: string, size: number): void {
  const TERRACES = [
    { base: 0.62, run: 0.34, drop: 0.014, haze: 0.42, lit: 0.4 },
    { base: 0.7, run: 0.26, drop: 0.02, haze: 0, lit: 0.62 },
  ];
  for (const terrace of TERRACES) {
    const rng = makeRng('sky').stream(`rime/shelf${Math.round(terrace.run * 100)}`);
    const edges: number[] = [0];
    while (edges[edges.length - 1]! < 1) {
      edges.push(Math.min(1, edges[edges.length - 1]! + rng.range(terrace.run * 0.7, terrace.run * 1.5)));
    }
    const heights = edges.slice(0, -1).map(() => terrace.base + rng.range(-terrace.drop, terrace.drop));
    const last = heights.length - 1;
    // The first table starts level with the seam and the last ends there — 0207, in a stepped profile.
    heights[0] = terrace.base;
    heights[last] = terrace.base;
    const crest: number[][] = [];
    for (let i = 0; i < heights.length; i += 1) {
      // Two points per table and none between: the vertical between them is the cliff face.
      crest.push([edges[i]! * size, heights[i]! * size], [edges[i + 1]! * size, heights[i]! * size]);
    }
    fillTo(ctx, mix(land, sky, terrace.haze), crest, size, true);
    ctx.globalAlpha = terrace.lit;
    ctx.strokeStyle = glow;
    ctx.lineCap = 'butt';
    ctx.lineWidth = Math.max(1, size * 0.004);
    ctx.beginPath();
    ctx.moveTo(crest[0]![0]!, crest[0]![1]!);
    for (let i = 1; i < crest.length; i += 1) ctx.lineTo(crest[i]![0]!, crest[i]![1]!);
    ctx.stroke();
    /*
      The one thing that happens on an ice sheet: a pressure ridge, where two plates have met and
      buckled. **Two of them per terrace**, because three would be a feature and one would be a
      mistake.
    */
    ctx.globalAlpha = 1;
    ctx.fillStyle = mix(land, sky, terrace.haze);
    for (let i = 0; i < 2; i += 1) {
      const at = rng.range(0.1, 0.85) * size;
      const wide = rng.range(0.05, 0.1) * size;
      const tall = rng.range(0.02, 0.038) * size;
      const foot = terrace.base * size;
      ctx.beginPath();
      ctx.moveTo(at - wide, foot);
      ctx.lineTo(at - wide * 0.25, foot - tall);
      ctx.lineTo(at + wide * 0.2, foot - tall * 0.72);
      ctx.lineTo(at + wide, foot);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * ── THE TOXIC MIRE: A CORRIDOR BETWEEN A CANOPY AND THE POOLS ─────────────────────────────────────
 *
 * Asked for: *"toxic mire is also a planet, but needs an overhanging canopy so that it feels like
 * you're flying through a tight narrow corridor above the toxic pools below and beneath the
 * overhanging canopy above."*
 *
 * ⚠️ **THE ONLY GROUND IN THE GAME WITH TWO SURFACES, AND THE SUBJECT IS THE GAP.** Both are drawn
 * from the same table with the fill going opposite ways — a canopy is a floor upside down, and
 * writing it as one is what keeps the two agreeing about how wide the corridor between them is.
 *
 * ⚠️ **AND THE GAP IS MEASURED AGAINST THE SHIP, NOT AGAINST ITSELF.** `tests/places.test.ts` holds
 * it. *"Tight"* is a feeling and *"a passage the ship cannot fly down"* is a bug, and only one of
 * those two has a number.
 */
function drawEnclosure(ctx: Pen, land: string, sky: string, glow: string, size: number): void {
  /*
    ⚠️ **BOTH EDGES SIT WELL INSIDE THE LANE**, which is what makes this place feel enclosed at all.
    The canopy hangs to tile 0.4 — lane 30 — and the pools rise to 0.66, lane 82. Everything the game
    does happens in the 52 lane units between them, against a ship 7 across.
  */
  /*
    ⚠️ **THE CANOPY HANGS, WHICH IS NOT THE SAME AS BEING JAGGED.** A skyline sampled evenly around a
    base is a mountain range upside down — the bench showed a smooth hill, and *"overhanging"* was
    nowhere in it. `hang` biases every sample downward and squares it, so the edge sits near its base
    most of the way across and drops a long way in a few places: a roof with things coming off it.
  */
  const canopy = skyline(size, 'mire/canopy', 0.4, 0.075, 24, 'down');
  const pools = skyline(size, 'mire/pools', 0.66, 0.022, 14);

  fillTo(ctx, land, canopy, size, false);
  fillTo(ctx, land, pools, size, true);

  /*
    ── THE SHADOW UNDER THE ROOF ───────────────────────────────────────────────────────────────────

    ⚠️ **WITHOUT IT THE CORRIDOR IS A FLAT GREEN BAND AND READS AS A WALL, NOT AS AIR.** The bench
    showed exactly that: a solid slab of murk between two dark edges, with nothing saying which way is
    up. Four bands of the land colour fading downward from the canopy put the darkness where a roof
    puts it, and the pools below then read as the only light in the place.

    ⚠️ **BANDS AND NOT A GRADIENT, BECAUSE `Pen` IS FIFTEEN MEMBERS AND `createLinearGradient` IS NOT
    ONE.** Four rectangles at falling alpha is a gradient anybody can see the seams of at close range
    and nobody can at a tile's scale; widening a type that exists to be narrow, so that a shadow can be
    one call instead of four, is the trade `drawPillars`' streamers already declined.
  */
  ctx.fillStyle = land;
  for (let i = 0; i < 6; i += 1) {
    ctx.globalAlpha = 0.42 * (1 - i / 6);
    const from = (0.4 + i * 0.04) * size;
    ctx.fillRect(0, from, size, 0.041 * size);
  }

  /*
    ── AND THE POOLS ARE LIT AND THE CANOPY IS NOT ─────────────────────────────────────────────────

    Which is the whole reading of the place: the light is coming from BELOW, off something that should
    not be glowing, and the roof over it is a silhouette. It is also the only way two surfaces of one
    colour tell each other apart at a glance.
  */
  const rng = makeRng('sky').stream('mire/slicks');
  /*
    The pools themselves, and they are the light source. **Drawn before the shoreline**, so the
    shoreline closes over their far edge and they sit IN the ground rather than on it.
  */
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = glow;
  for (let i = 0; i < 6; i += 1) {
    const at = rng.range(0.02, 0.84) * size;
    const wide = rng.range(0.07, 0.15) * size;
    const deep = rng.range(0.018, 0.042) * size;
    const top = (0.665 + rng.range(0.005, 0.045)) * size;
    ctx.beginPath();
    ctx.moveTo(at, top);
    ctx.lineTo(at + wide, top);
    ctx.lineTo(at + wide * 0.8, top + deep);
    ctx.lineTo(at + wide * 0.15, top + deep);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = glow;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, size * 0.007);
  ctx.beginPath();
  ctx.moveTo(pools[0]![0]!, pools[0]![1]!);
  for (let i = 1; i < pools.length; i += 1) ctx.lineTo(pools[i]![0]!, pools[i]![1]!);
  ctx.stroke();

  /*
    ⚠️ **AND THE UNDERSIDE OF THE CANOPY CATCHES IT, WHICH IS WHAT PUTS THE TWO IN ONE ROOM.** Light
    from below on the roof above is the single mark that says these are two faces of one enclosure
    rather than a floor and an unrelated ceiling. It is fainter than the water it is coming from,
    because it is a reflection of it.
  */
  ctx.globalAlpha = 0.26;
  ctx.lineWidth = Math.max(1, size * 0.005);
  ctx.beginPath();
  ctx.moveTo(canopy[0]![0]!, canopy[0]![1]!);
  for (let i = 1; i < canopy.length; i += 1) ctx.lineTo(canopy[i]![0]!, canopy[i]![1]!);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Unused here, and named rather than dropped: the mire's murk is the AIR, not a thing to draw with.
  void sky;
}

/**
 * One colour moved `by` of the way towards another, as a hex string.
 *
 * ⚠️ **NEEDED BECAUSE THE GROUND IS OPAQUE AND THEREFORE HAS NO ALPHA TO SAY *FAR* WITH.** Every
 * other depth cue in this file is a `globalAlpha`; a solid silhouette in front of a star field cannot
 * use one without stars coming through it, which is the entire defect 0221 is about. Aerial haze is
 * what distance actually looks like, and it is a colour rather than a transparency.
 */
export function mix(from: string, to: string, by: number): string {
  if (by <= 0) return from;
  const read = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [a, b] = [read(from), read(to)];
  return `#${a.map((v, i) => Math.round(v + (b[i]! - v) * by).toString(16).padStart(2, '0')).join('')}`;
}

/*
  ── THE ENEMIES, PAINTED IN THEIR PLACE — 0228 ──────────────────────────────────────────────────

  `docs/decisions/0228-an-enemy-wears-its-place.md`. Asked for: *"detailed sprites for each level…
  enemies."* Every silhouette below is exactly the one 0081 and 0098 chose against the others, and
  every extent is where it was; what changes is that a body is sealed in its PLACE's hull colour and
  then painted — an underside in shadow, a lit strip, an eye that looks back down the lane, and a motif
  the place puts on everything it sends: rivets, embers, scales, circuitry, facets, spots, veins.

  ⚠️ **THE MOTIF IS THE HALF THAT SAYS *WHERE*, AND IT IS CLIPPED BY ARITHMETIC RATHER THAN BY
  `clip()`.** Each kind names a BELLY — a polygon well inside its own hull — and a motif's marks are
  scattered on a seeded grid and kept only where every corner is inside it. `ctx.clip()` cannot be
  broken on purpose, so a guard over it could never be seen to fail (0005); a mark kept by a test is
  a mark `tests/accents.test.ts` can measure. Every motif mark is at least 0.16 of the radius across,
  which is 0106's floor on the smallest enemy.
*/

/** A polygon well inside a hull, that a motif may be scattered over. In fractions of `r`. */
type Belly = readonly Pt[];

/** Whether a point is inside a simple polygon, by ray casting. Cold code, for the motif's clip. */
function within(belly: Belly, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = belly.length - 1; i < belly.length; j = i++) {
    const [ax, ay] = belly[i]!;
    const [bx, by] = belly[j]!;
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

/** Whether every corner of a mark is inside the belly. */
function fits(belly: Belly, points: readonly Pt[]): boolean {
  return points.every(([x, y]) => within(belly, x, y));
}

/** The belly's bounding box, so a grid can be laid over it. */
function boundsOfBelly(belly: Belly): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Number.POSITIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  for (const [x, y] of belly) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** A square mark of half-width `h` at `(x, y)`, as a polygon. */
const square = (x: number, y: number, h: number): Pt[] => [
  [x - h, y - h],
  [x + h, y - h],
  [x + h, y + h],
  [x - h, y + h],
];

/** A diamond of half-width `h` at `(x, y)`. */
const diamond = (x: number, y: number, h: number): Pt[] => [
  [x - h, y],
  [x, y - h],
  [x + h, y],
  [x, y + h],
];

/**
 * A place's motif, scattered over a belly on a seeded grid and kept only where it fits.
 *
 * ⚠️ **SEVEN ARMS OVER A CLOSED UNION, WITH A `never` ARM**, so an eighth place has to say what it
 * puts on its enemies before it can bake — `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 */
function motif(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind, belly: Belly, seed: string): void {
  const rng = makeRng('art').stream(`${theme}/${seed}`);
  const { x0, y0, x1, y1 } = boundsOfBelly(belly);
  // Close enough that a five-unit belly carries a few marks, far enough that two never touch.
  const pitch = 0.24;
  for (let gy = y0; gy <= y1; gy += pitch) {
    for (let gx = x0; gx <= x1; gx += pitch) {
      const x = gx + rng.range(-0.06, 0.06);
      const y = gy + rng.range(-0.06, 0.06);
      switch (theme) {
        case 'approach': {
          // Rivets: a dark stud on every panel.
          if (!fits(belly, square(x, y, 0.09))) break;
          disc(ctx, f, skin.plate, x, y, 0.09);
          break;
        }
        case 'nebula': {
          // Embers: lit specks, as if the hull were still cooling.
          if (rng.range(0, 1) < 0.35) break;
          if (!fits(belly, square(x, y, 0.09))) break;
          disc(ctx, f, skin.lit, x, y, 0.09);
          break;
        }
        case 'saurian': {
          // Scales: a chevron per cell, pointing down the lane.
          const scale: Pt[] = [
            [x - 0.12, y - 0.1],
            [x + 0.02, y],
            [x - 0.12, y + 0.1],
            [x, y + 0.1],
            [x + 0.14, y],
            [x, y - 0.1],
          ];
          if (!fits(belly, scale)) break;
          poly(ctx, f, skin.plate, scale);
          break;
        }
        case 'labyrinth': {
          // Circuitry: a lit trace and a pad, on alternate cells.
          const trace: Pt[] = rng.range(0, 1) < 0.5 ? square(x, y, 0.09) : [
            [x - 0.16, y - 0.08],
            [x + 0.16, y - 0.08],
            [x + 0.16, y + 0.08],
            [x - 0.16, y + 0.08],
          ];
          if (!fits(belly, trace)) break;
          poly(ctx, f, skin.lit, trace);
          break;
        }
        case 'rime': {
          // Facets: a lighter triangle per cell, so the hull reads as cut ice.
          const facet: Pt[] = [
            [x - 0.14, y + 0.1],
            [x + 0.02, y - 0.12],
            [x + 0.14, y + 0.08],
          ];
          if (!fits(belly, facet)) break;
          poly(ctx, f, shade(skin.hull, 0.35), facet);
          break;
        }
        case 'mire': {
          // Spots: a dark ring with a lit centre, which is what a spore sac looks like.
          if (rng.range(0, 1) < 0.3) break;
          if (!fits(belly, square(x, y, 0.14))) break;
          disc(ctx, f, skin.plate, x, y, 0.14);
          disc(ctx, f, skin.lit, x, y, 0.085);
          break;
        }
        case 'core': {
          // Veins: lit diamonds joined down the grid, so the body reads as something with a pulse.
          if (!fits(belly, diamond(x, y, 0.12))) break;
          poly(ctx, f, skin.lit, diamond(x, y, 0.12));
          break;
        }
        default: {
          const never: never = theme;
          throw new Error(`no motif for ${String(never)}`);
        }
      }
    }
  }
}

/** The underside in shadow: a polygon in the plate colour. */
const plate = (ctx: Pen, f: Frame, skin: FoeSkin, points: readonly Pt[]): void => poly(ctx, f, skin.plate, points);

/** A lit strip. */
const lit = (ctx: Pen, f: Frame, skin: FoeSkin, points: readonly Pt[]): void => poly(ctx, f, skin.lit, points);

/** An eye: a dark socket and the eye colour inside it, looking down the lane. */
function eye(ctx: Pen, f: Frame, skin: FoeSkin, x: number, y: number, radius: number): void {
  disc(ctx, f, shade(skin.plate, -0.5), x, y, radius);
  disc(ctx, f, skin.eye, x - radius * 0.15, y, radius * 0.62);
}

/*
  ── THE BELLIES AND THE PAINT, PER KIND ─────────────────────────────────────────────────────────

  Every number is a fraction of `r`, inside the hull the same arm draws, and `tests/accents.test.ts`
  measures each one against the trace on a 1280×720 screen. The smallest enemy is the weaver at 5
  units, whose radius is 15 CSS pixels there; 0106's 2.5 px is therefore 0.17 of its radius, and
  nothing painted on it is thinner.
*/

const DRIFTER_BELLY: Belly = [
  [-0.55, 0.05],
  [-0.05, -0.45],
  [0.55, 0.05],
  [0.05, 0.55],
];

function paintDrifter(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.9, 0.06],
    [0.9, 0.06],
    [0, 0.94],
  ]);
  lit(ctx, f, skin, [
    [-0.86, -0.04],
    [-0.06, -0.84],
    [0.06, -0.72],
    [-0.66, -0.02],
  ]);
  motif(ctx, f, skin, theme, DRIFTER_BELLY, 'drifter');
  eye(ctx, f, skin, -0.28, 0, 0.17);
}

const LANCER_BELLY: Belly = [
  [-0.3, 0.06],
  [0.58, -0.4],
  [0.58, 0.72],
];

function paintLancer(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.86, 0.06],
    [0.62, 0.06],
    [0.62, 0.88],
  ]);
  lit(ctx, f, skin, [
    [-0.9, -0.03],
    [0.6, -0.86],
    [0.62, -0.7],
    [-0.66, -0.03],
  ]);
  motif(ctx, f, skin, theme, LANCER_BELLY, 'lancer');
  eye(ctx, f, skin, -0.4, 0, 0.16);
}

function paintWeaver(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [0.02, -0.92],
    [0.19, -0.92],
    [0.19, 0.92],
    [0.02, 0.92],
  ]);
  lit(ctx, f, skin, [
    [-0.19, -0.9],
    [-0.02, -0.9],
    [-0.02, -0.4],
    [-0.19, -0.4],
  ]);
  lit(ctx, f, skin, [
    [-0.19, 0.4],
    [-0.02, 0.4],
    [-0.02, 0.9],
    [-0.19, 0.9],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.14, -0.7],
    [0.14, -0.7],
    [0.14, 0.7],
    [-0.14, 0.7],
  ], 'weaver');
  eye(ctx, f, skin, 0, 0, 0.16);
}

const TURRET_BELLY: Belly = [
  [-0.4, -0.5],
  [0.15, -0.42],
  [0.34, 0],
  [0.15, 0.42],
  [-0.4, 0.5],
];

function paintTurret(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.5, 0.06],
    [0.4, 0.06],
    [0.28, 0.5],
    [0, 0.8],
    [-0.5, 0.92],
  ]);
  lit(ctx, f, skin, [
    [-0.5, -0.9],
    [-0.33, -0.9],
    [-0.33, 0.9],
    [-0.5, 0.9],
  ]);
  motif(ctx, f, skin, theme, TURRET_BELLY, 'turret');
  eye(ctx, f, skin, -0.18, 0, 0.2);
}

function paintCharger(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.8, 0.02],
    [0.84, 0.02],
    [0.84, 0.19],
  ]);
  lit(ctx, f, skin, [
    [-0.8, -0.02],
    [0.84, -0.19],
    [0.84, -0.04],
  ]);
  motif(ctx, f, skin, theme, [
    [0.1, -0.1],
    [0.7, -0.15],
    [0.7, 0.15],
    [0.1, 0.1],
  ], 'charger');
  // A lamp rather than an eye: the needle is too thin at its nose for a socket and a pupil both.
  disc(ctx, f, skin.eye, -0.1, 0, 0.09);
}

/** Points along an arc of a ring between two radii, as a closed polygon — a sector of a band. */
function sector(r0: number, r1: number, a0: number, a1: number, steps = 12): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([Math.cos(a) * r1, Math.sin(a) * r1]);
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([Math.cos(a) * r0, Math.sin(a) * r0]);
  }
  return out;
}

function paintWarden(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The lower half of the ring in shadow, the upper-front quarter lit.
  plate(ctx, f, skin, sector(0.5, 0.94, 0.05, Math.PI - 0.05));
  lit(ctx, f, skin, sector(0.5, 0.66, Math.PI + 0.15, Math.PI * 1.5 - 0.1));
  motif(ctx, f, skin, theme, sector(0.56, 0.9, Math.PI * 1.05, Math.PI * 1.95, 16), 'warden');
  // Three eyes on the front of the ring, so the aperture looks back.
  eye(ctx, f, skin, -0.72, 0, 0.13);
  eye(ctx, f, skin, -0.36, -0.62, 0.11);
  eye(ctx, f, skin, -0.36, 0.62, 0.11);
}

function paintSpinner(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.26, 0.32],
    [0.26, 0.32],
    [0.26, 0.94],
    [-0.26, 0.94],
  ]);
  plate(ctx, f, skin, [
    [0.32, -0.26],
    [0.94, -0.26],
    [0.94, 0.26],
    [0.32, 0.26],
  ]);
  for (const [x0, y0, x1, y1] of [
    [-0.94, -0.24, -0.76, 0.24],
    [-0.24, -0.94, 0.24, -0.76],
  ] as const) {
    lit(ctx, f, skin, [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ]);
  }
  motif(ctx, f, skin, theme, square(0, 0, 0.27), 'spinner');
  eye(ctx, f, skin, 0, 0, 0.2);
}

function paintSower(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.72, 0.1],
    [0.52, 0.82],
    [0.8, 0.54],
    [-0.02, 0.09],
  ]);
  lit(ctx, f, skin, [
    [-0.9, -0.02],
    [0.5, -0.84],
    [0.6, -0.72],
    [-0.62, -0.02],
  ]);
  eye(ctx, f, skin, -0.58, 0, 0.14);
  motif(ctx, f, skin, theme, [
    [0.2, -0.68],
    [0.62, -0.62],
    [0.58, -0.36],
    [0.1, -0.44],
  ], 'sower');
}
/*
  ── THE BOSSES, PAINTED IN THEIR PLACE — 0228 ───────────────────────────────────────────────────

  A boss is fought in exactly one place (`src/content/levels.ts` names one per level), so its arm
  paints in whatever skin the atlas was baked for: the same plate, lit and eye the place's enemies
  wear, at four to six times the size. 0149's carved interiors stay as the holes they were; where one
  of them is an EYE it is painted in the eye colour inside the hole, so the boss looks back in the
  place's own light.
*/

function paintBoss(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The hexagonal hull: its lower half in shadow, its prow lit, rivets or scales across the back.
  plate(ctx, f, skin, [
    [-0.4, 0.08],
    [0.94, 0.42],
    [0.48, 0.9],
    [-0.52, 0.76],
    [-0.42, 0.44],
  ]);
  lit(ctx, f, skin, [
    [-0.94, 0],
    [-0.44, -0.42],
    [-0.5, -0.74],
    [-0.36, -0.66],
    [-0.34, -0.4],
    [-0.8, 0],
  ]);
  // Either side of the keel, which is a carved hole and stays one — 0149's mark is not painted over.
  motif(ctx, f, skin, theme, [
    [0.05, -0.85],
    [0.5, -0.85],
    [0.9, -0.42],
    [0.9, -0.2],
    [0.05, -0.2],
  ], 'boss');
  motif(ctx, f, skin, theme, [
    [0.05, 0.2],
    [0.9, 0.2],
    [0.9, 0.42],
    [0.5, 0.85],
    [0.05, 0.85],
  ], 'boss-low');
  disc(ctx, f, skin.eye, -0.32, 0, 0.09);
}

function paintBoss2(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The three prongs: the lower prong and the body's underside in shadow, the tips lit.
  plate(ctx, f, skin, [
    [-0.24, 0.34],
    [0.12, 0.72],
    [0.88, 0.32],
    [0.88, 0.12],
    [-0.1, 0.12],
  ]);
  plate(ctx, f, skin, [
    [-0.5, 0.86],
    [0.1, 0.72],
    [-0.28, 0.4],
  ]);
  lit(ctx, f, skin, [
    [-0.94, -0.12],
    [-0.94, 0.12],
    [-0.78, 0.1],
    [-0.78, -0.1],
  ]);
  lit(ctx, f, skin, [
    [-0.52, -0.9],
    [-0.36, -0.86],
    [-0.2, -0.5],
    [-0.29, -0.46],
  ]);
  motif(ctx, f, skin, theme, [
    [0, -0.7],
    [0.85, -0.3],
    [0.85, -0.12],
    [0, -0.12],
  ], 'boss2');
  disc(ctx, f, skin.eye, -0.05, -0.45, 0.07);
  disc(ctx, f, skin.eye, -0.05, 0.45, 0.07);
}

function paintBoss3(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The lattice: the two lower struts in shadow, the two forward struts lit at their outer edges.
  plate(ctx, f, skin, [
    [-0.88, 0.06],
    [-0.44, 0.06],
    [-0.02, 0.4],
    [-0.02, 0.76],
  ]);
  plate(ctx, f, skin, [
    [0.02, 0.4],
    [0.44, 0.06],
    [0.88, 0.06],
    [0.02, 0.76],
  ]);
  lit(ctx, f, skin, [
    [-0.92, -0.02],
    [-0.04, -0.78],
    [-0.04, -0.62],
    [-0.76, -0.02],
  ]);
  motif(ctx, f, skin, theme, [
    [0.08, -0.72],
    [0.86, -0.06],
    [0.62, -0.06],
    [0.08, -0.5],
  ], 'boss3');
  for (const y of [-0.32, 0.32]) {
    disc(ctx, f, skin.eye, 0.38, y, 0.055);
    disc(ctx, f, skin.eye, -0.38, y, 0.055);
  }
}

function paintBoss4(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The shoal mother: the lower flank in shadow, the nose lit, scales across the back.
  // Under the lowest streak and above the highest, so the three carved streaks stay the holes
  // 0149 cut; the motif rides the fins, which is the one part of this hull with no hole in it.
  plate(ctx, f, skin, [
    [-0.45, 0.42],
    [0.5, 0.42],
    [0.45, 0.49],
    [-0.25, 0.58],
  ]);
  lit(ctx, f, skin, [
    [-0.94, 0],
    [-0.32, -0.56],
    [-0.2, -0.46],
    [-0.76, 0],
  ]);
  motif(ctx, f, skin, theme, [
    [0.6, -0.5],
    [0.9, -0.8],
    [0.8, -0.3],
  ], 'boss4');
  motif(ctx, f, skin, theme, [
    [0.6, 0.5],
    [0.9, 0.8],
    [0.8, 0.3],
  ], 'boss4-low');
  disc(ctx, f, skin.eye, -0.6, -0.16, 0.08);
  disc(ctx, f, skin.eye, -0.6, 0.16, 0.08);
}

function paintBoss5(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The redoubt: the lower slab in shadow, the face lit between the ports, plating across the back.
  plate(ctx, f, skin, [
    [-0.68, 0.62],
    [0.3, 0.62],
    [0.3, 0.9],
    [-0.68, 0.9],
  ]);
  plate(ctx, f, skin, [
    [-0.9, 0.06],
    [-0.4, 0.06],
    [-0.4, 0.5],
    [-0.9, 0.36],
  ]);
  // Two lit seams across the stepped face, between the ports — the face is only the middle of
  // the slab, from ±0.55 at its root to ±0.4 at its front.
  for (const y of [-0.25, 0.25]) {
    lit(ctx, f, skin, [
      [0.72, y - 0.07],
      [0.94, y - 0.05],
      [0.94, y + 0.05],
      [0.72, y + 0.07],
    ]);
  }
  motif(ctx, f, skin, theme, [
    [-0.68, -0.9],
    [0.3, -0.9],
    [0.3, -0.62],
    [-0.68, -0.62],
  ], 'boss5');
  // A lamp beside each port, on the slab: the ports themselves are holes and stay holes.
  for (const y of [-0.5, 0, 0.5]) disc(ctx, f, skin.eye, 0.14, y, 0.08);
}

function paintBoss6(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The chorus: the spine is a hole where it crosses the lobes, so the paint stays on the lobes'
  // outer halves — the lower lobe's far side in shadow, the upper's in light.
  plate(ctx, f, skin, [
    [0.24, 0.72],
    [0.5, 0.84],
    [0.56, 0.66],
    [0.36, 0.64],
  ]);
  lit(ctx, f, skin, [
    [-0.24, -0.72],
    [-0.5, -0.84],
    [-0.56, -0.66],
    [-0.36, -0.64],
  ]);
  motif(ctx, f, skin, theme, [
    [0.3, -0.72],
    [0.5, -0.86],
    [0.58, -0.64],
    [0.4, -0.62],
  ], 'boss6');
  for (const y of [-0.62, 0, 0.62]) disc(ctx, f, skin.eye, -0.46, y, 0.06);
}

/*
  The real bosses' paint — 0247. One shadowed plate low on the hull, one lit edge on the prow, one
  eye; every mark well inside the silhouette, which `tests/accents.test.ts` holds for every body.
*/
function paintBoss8(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The serpent: scales down its back, its belly in shadow, the head lit.
  plate(ctx, f, skin, [
    [0.1, 0.18],
    [0.36, 0.14],
    [0.7, 0.4],
    [0.92, 0.24],
    [0.92, 0.44],
    [0.66, 0.66],
    [0.34, 0.48],
  ]);
  lit(ctx, f, skin, [
    [-0.92, 0.02],
    [-0.7, -0.44],
    [-0.36, -0.6],
    [-0.4, -0.46],
    [-0.66, -0.3],
    [-0.84, 0.08],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.28, -0.44],
    [0, -0.24],
    [0.3, 0.06],
    [0.14, 0.14],
    [-0.16, -0.12],
    [-0.44, -0.3],
  ], 'boss8');
  disc(ctx, f, skin.eye, -0.76, -0.22, 0.07);
}
function paintBoss9(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The eagle: the underside of both wings in shadow, the head lit, feathers as a motif.
  plate(ctx, f, skin, [
    [-0.1, 0.36],
    [0.32, 0.9],
    [0.2, 0.92],
    [-0.3, 0.6],
  ]);
  plate(ctx, f, skin, [
    [0.3, 0.14],
    [0.9, 0.16],
    [0.6, 0.44],
  ]);
  lit(ctx, f, skin, [
    [-0.94, 0],
    [-0.62, -0.2],
    [-0.5, -0.14],
    [-0.7, 0],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.24, -0.84],
    [0.22, -0.88],
    [0.42, -0.5],
    [0, -0.36],
  ], 'boss9');
  disc(ctx, f, skin.eye, -0.74, -0.06, 0.06);
}
function paintBoss10(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The pterodactyl: the lower wing in shadow, the beak lit, membrane as a motif.
  plate(ctx, f, skin, [
    [0, 0.3],
    [0.82, 0.86],
    [0.6, 0.72],
    [0.3, 0.46],
  ]);
  lit(ctx, f, skin, [
    [-0.94, -0.02],
    [-0.58, -0.16],
    [-0.5, -0.08],
    [-0.8, 0],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.1, -0.34],
    [0.76, -0.88],
    [0.5, -0.36],
    [0.3, -0.24],
  ], 'boss10');
  disc(ctx, f, skin.eye, -0.6, -0.06, 0.06);
}
function paintBoss11(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The gyre: the lower half of the rim in shadow, the upper lit, teeth as a motif.
  plate(ctx, f, skin, sector(0.4, 0.66, 0.5, 2.6, 10));
  lit(ctx, f, skin, sector(0.4, 0.66, -2.6, -0.5, 10));
  motif(ctx, f, skin, theme, sector(0.4, 0.66, -0.4, 0.4, 6), 'boss11');
  disc(ctx, f, skin.eye, -0.52, 0, 0.06);
}
function paintBoss12(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The frost ship: its lower facet in shadow, its point lit, a frost motif across the flank.
  plate(ctx, f, skin, [
    [-0.4, 0.2],
    [0.3, 0.7],
    [0.9, 0.3],
    [0.9, 0.1],
  ]);
  lit(ctx, f, skin, [
    [-0.92, 0],
    [-0.5, -0.5],
    [-0.4, -0.4],
    [-0.76, 0],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.3, -0.5],
    [0.3, -0.7],
    [0.8, -0.3],
    [0.2, -0.16],
  ], 'boss12');
  disc(ctx, f, skin.eye, -0.6, 0, 0.06);
}
function paintBoss13(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The hydra: the body's underside in shadow, the centre head lit, scales as a motif.
  plate(ctx, f, skin, [
    [-0.3, 0.4],
    [0.5, 0.76],
    [0.86, 0.26],
    [0.5, 0.2],
  ]);
  lit(ctx, f, skin, [
    [-0.92, 0.02],
    [-0.6, -0.1],
    [-0.5, 0],
    [-0.6, 0.1],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.2, -0.7],
    [0.5, -0.76],
    [0.86, -0.26],
    [0.3, -0.3],
  ], 'boss13');
  disc(ctx, f, skin.eye, -0.7, 0, 0.05);
}
function paintBoss14(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The jellyfish: the lower bell in shadow, the front lit, and the heart in it — the eye, big.
  plate(ctx, f, skin, [
    [-0.2, 0.3],
    [0.2, 0.7],
    [0.4, 0.5],
    [0.2, 0.2],
  ]);
  lit(ctx, f, skin, [
    [-0.7, -0.14],
    [-0.5, -0.5],
    [-0.36, -0.46],
    [-0.56, -0.14],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.3, -0.6],
    [0.1, -0.7],
    [0.36, -0.36],
    [-0.1, -0.3],
  ], 'boss14');
  disc(ctx, f, skin.eye, -0.1, 0.04, 0.16);
}
function paintBoss7(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The axis: the outer ring's lower half in shadow, its front lit, the motif round the back.
  plate(ctx, f, skin, sector(0.7, 0.96, 0.15, Math.PI - 0.15));
  lit(ctx, f, skin, sector(0.7, 0.82, Math.PI + 0.3, Math.PI * 1.5 + 0.2));
  motif(ctx, f, skin, theme, sector(0.72, 0.94, -0.6, 0.6, 10), 'boss7');
  disc(ctx, f, skin.eye, 0, 0, 0.1);
}
/*
  ── THE SIGNATURE ENEMIES' HULLS AND PAINT — 0232 ───────────────────────────────────────────────

  One per place. Every hull below is a closed polygon in the sprite's frame, facing −x; every paint
  is the place's skin on the same terms as the eight shared kinds — a plate, a lit strip, an eye, and
  the place's motif in a belly — so a signature enemy is unmistakably the place's own and is still
  painted by the same hand.
*/

/** The Approach's picket: a Y, one blade down the lane and two swept back. */
const PICKET_HULL: readonly Pt[] = [
  [-1, -0.16],
  [-0.3, -0.12],
  [0.45, -0.98],
  [0.72, -0.82],
  [0.18, 0],
  [0.72, 0.82],
  [0.45, 0.98],
  [-0.3, 0.12],
  [-1, 0.16],
];

function paintPicket(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.3, 0.02],
    [0.16, 0.02],
    [0.62, 0.8],
    [0.48, 0.88],
  ]);
  lit(ctx, f, skin, [
    [-0.94, -0.1],
    [-0.3, -0.06],
    [-0.3, 0.06],
    [-0.94, 0.1],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.2, -0.08],
    [0.14, -0.02],
    [0.14, 0.02],
    [-0.2, 0.08],
  ], 'picket');
  eye(ctx, f, skin, -0.1, 0, 0.14);
}

/** Ember Nebula's moth: a thin body with two wide wings. */
const MOTH_HULL: readonly Pt[] = [
  [-1, 0],
  [-0.4, -0.18],
  [-0.1, -0.5],
  [0.3, -1],
  [0.8, -0.86],
  [0.4, -0.3],
  [0.9, -0.08],
  [0.9, 0.08],
  [0.4, 0.3],
  [0.8, 0.86],
  [0.3, 1],
  [-0.1, 0.5],
  [-0.4, 0.18],
];

function paintMoth(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The lower wing in shadow, an eyespot on each wing, and the body lit down its spine.
  plate(ctx, f, skin, [
    [-0.06, 0.5],
    [0.32, 0.92],
    [0.72, 0.82],
    [0.4, 0.34],
  ]);
  lit(ctx, f, skin, [
    [-0.92, -0.02],
    [-0.36, -0.1],
    [0.6, -0.06],
    [0.6, 0.06],
    [-0.36, 0.1],
    [-0.92, 0.02],
  ]);
  motif(ctx, f, skin, theme, [
    [0.02, -0.5],
    [0.36, -0.86],
    [0.66, -0.78],
    [0.42, -0.36],
  ], 'moth');
  eye(ctx, f, skin, 0.44, -0.66, 0.12);
  eye(ctx, f, skin, 0.44, 0.66, 0.12);
}

/** Saurian Belt's raptor: a crescent, horns down the lane. */
/** The kite — 0249: a diamond ahead, two streamers behind. */
const KITE_HULL: readonly Pt[] = [
  [-1, 0],
  [-0.3, -0.56],
  [0.3, -0.22],
  [0.56, -0.5],
  [1, -0.14],
  [0.68, 0],
  [1, 0.14],
  [0.56, 0.5],
  [0.3, 0.22],
  [-0.3, 0.56],
];

function paintKite(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The lower half of the diamond in shadow, its leading edge lit, an eye at the point.
  plate(ctx, f, skin, [
    [-0.7, 0.06],
    [0.1, 0.06],
    [0.24, 0.2],
    [-0.28, 0.44],
  ]);
  lit(ctx, f, skin, [
    [-0.88, -0.02],
    [-0.34, -0.44],
    [-0.26, -0.34],
    [-0.7, -0.04],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.2, -0.3],
    [0.2, -0.16],
    [0.2, 0.16],
    [-0.2, 0.3],
  ], 'kite');
  disc(ctx, f, skin.eye, -0.6, 0, 0.09);
}

const RAPTOR_HULL: readonly Pt[] = [
  [-1, -0.62],
  [-0.62, -0.92],
  [0.2, -1],
  [0.8, -0.7],
  [1, -0.1],
  [0.86, 0.5],
  [0.4, 0.9],
  [-0.2, 0.96],
  [-0.9, 0.7],
  [-0.4, 0.5],
  [0.2, 0.3],
  [0.42, -0.1],
  [0.2, -0.46],
  [-0.4, -0.5],
];

function paintRaptor(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [0.44, 0.02],
    [0.9, 0.02],
    [0.78, 0.5],
    [0.36, 0.84],
    [-0.14, 0.88],
    [-0.28, 0.6],
    [0.2, 0.36],
  ]);
  lit(ctx, f, skin, [
    [-0.92, -0.64],
    [-0.6, -0.84],
    [0.16, -0.9],
    [0.14, -0.74],
    [-0.5, -0.66],
    [-0.8, -0.61],
  ]);
  motif(ctx, f, skin, theme, [
    [0.5, -0.5],
    [0.9, -0.5],
    [0.9, 0.3],
    [0.5, 0.3],
  ], 'raptor');
  eye(ctx, f, skin, 0.0, -0.72, 0.14);
}

/** The Labyrinth's sentry: a block with a slot in its face. */
const SENTRY_HULL: readonly Pt[] = [
  [-0.95, -0.95],
  [0.95, -0.95],
  [0.95, 0.95],
  [-0.95, 0.95],
  [-0.95, 0.24],
  [-0.5, 0.24],
  [-0.5, -0.24],
  [-0.95, -0.24],
];

function paintSentry(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.88, 0.32],
    [0.88, 0.32],
    [0.88, 0.88],
    [-0.88, 0.88],
  ]);
  lit(ctx, f, skin, [
    [-0.44, -0.2],
    [-0.2, -0.2],
    [-0.2, 0.2],
    [-0.44, 0.2],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.1, -0.86],
    [0.86, -0.86],
    [0.86, 0.24],
    [-0.1, 0.24],
  ], 'sentry');
  eye(ctx, f, skin, -0.62, -0.6, 0.14);
}

/** Rime Shelf's shard: a long hexagon, pointed both ways. */
const SHARD_HULL: readonly Pt[] = [
  [-1, 0],
  [-0.4, -0.5],
  [0.4, -0.5],
  [1, 0],
  [0.4, 0.5],
  [-0.4, 0.5],
];

function paintShard(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.9, 0.04],
    [0.9, 0.04],
    [0.36, 0.44],
    [-0.36, 0.44],
  ]);
  lit(ctx, f, skin, [
    [-0.92, -0.02],
    [-0.4, -0.44],
    [-0.2, -0.44],
    [-0.7, -0.02],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.3, -0.4],
    [0.3, -0.4],
    [0.3, -0.06],
    [-0.3, -0.06],
  ], 'shard');
  eye(ctx, f, skin, -0.42, 0, 0.13);
}

/** The Toxic Mire's spore: a lumpy sac. */
const SPORE_HULL: readonly Pt[] = [
  [-1, -0.1],
  [-0.86, -0.56],
  [-0.5, -0.86],
  [-0.06, -1],
  [0.4, -0.9],
  [0.82, -0.56],
  [1, -0.06],
  [0.9, 0.44],
  [0.56, 0.84],
  [0.1, 1],
  [-0.4, 0.9],
  [-0.8, 0.6],
  [-0.96, 0.24],
];

function paintSpore(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [-0.86, 0.3],
    [0.84, 0.3],
    [0.5, 0.76],
    [0.1, 0.9],
    [-0.4, 0.8],
    [-0.74, 0.56],
  ]);
  lit(ctx, f, skin, [
    [-0.84, -0.5],
    [-0.5, -0.76],
    [-0.1, -0.88],
    [-0.14, -0.7],
    [-0.46, -0.6],
    [-0.7, -0.36],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.6, -0.4],
    [0.6, -0.4],
    [0.6, 0.2],
    [-0.6, 0.2],
  ], 'spore');
  eye(ctx, f, skin, -0.5, 0, 0.16);
}

/** The Black Heart's gaze: a lens, pointed across the lane, with a pupil. */
const GAZE_HULL: readonly Pt[] = [
  [0, -1],
  [-0.5, -0.66],
  [-0.78, -0.24],
  [-0.78, 0.24],
  [-0.5, 0.66],
  [0, 1],
  [0.5, 0.66],
  [0.78, 0.24],
  [0.78, -0.24],
  [0.5, -0.66],
];

function paintGaze(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  plate(ctx, f, skin, [
    [0.06, 0.06],
    [0.7, 0.24],
    [0.46, 0.62],
    [0.02, 0.9],
  ]);
  lit(ctx, f, skin, [
    [-0.7, -0.24],
    [-0.46, -0.6],
    [-0.02, -0.9],
    [-0.06, -0.66],
    [-0.36, -0.44],
    [-0.56, -0.16],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.4, 0.3],
    [0.4, 0.3],
    [0.3, 0.6],
    [-0.3, 0.6],
  ], 'gaze');
  // The pupil: a big socket and the eye colour in it, dead centre, looking down the lane.
  disc(ctx, f, shade(skin.plate, -0.5), 0, 0, 0.34);
  disc(ctx, f, skin.eye, -0.08, 0, 0.2);
}
export function drawKind(
  ctx: Pen,
  kind: SpriteKind,
  palette: Palette,
  size: number,
  theme: ThemeKind = 'approach',
): void {
  const half = size / 2;
  const r = size * 0.42;
  const f: Frame = { half, r };
  /*
    ⚠️ **A HURT TWIN IS THE HULL, FLAT, IN THE FLASH INK — AND NOTHING PAINTED ON IT.** 0035's rule is
    *the SAME shape in a different ink*: a flash has to read as *that thing being hurt* rather than as a
    second object, and a white silhouette with every panel still on it is a paler ship, not a hit. The
    suffix is the convention `rig/sheet.ts` already derives the twin from, and `tests/sheet.test.ts`
    holds it.
  */
  const hurt = kind.endsWith('Hit');
  /*
    ⚠️ **THE PLACE'S SKIN, FOR THE BODIES THE PLACE SENDS** — 0228. An enemy or a boss is sealed in
    `skin.hull` rather than in `INK_OF`'s `enemy`, unless it is hurt: a flash is the flash ink whatever
    the place, so a hit reads the same in every level. `INK_OF` still says what the kind IS, which is
    what `tests/legibility.test.ts` reads; `tests/foes.test.ts` holds the hull to the same floors.
  */
  const skin = hurt ? null : foeOf(theme, palette);
  ctx.fillStyle = palette[INK_OF[kind]];
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.globalAlpha = 1;
  ctx.beginPath();
  switch (kind) {
    case 'ship':
    case 'shipHit':
      trace(ctx, f, SHIP_HULL);
      seal(ctx);
      if (!hurt) paintShip(ctx, f, palette, 0, 'pulse');
      return;
    /*
      ── THE SAME FIGHTER, WITH MORE OF IT — 0081 ────────────────────────────────────────────────

      Each tier keeps the hull above and adds a part outside it, so what the player reads is *the
      same ship, further along* rather than *a different ship*. A pod on each wingtip, then a canard
      on each leading edge. Each shares an edge with the hull and no area, so `evenodd` unites them
      and the outline runs round the lot — see the SHIP block above.

      ⚠️ **The nose is untouched at every tier.** It is the one part of this silhouette the player
      aims with, and it is what makes the three read as one object.
    */
    case 'shipMk2':
    case 'shipMk2Hit': {
      // The hull at the bare ship's own size, in a wider box; the pods take the room — 0229.
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipMk2) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_POD);
      trace(ctx, fh, mirrored(SHIP_POD));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 1, 'pulse');
      return;
    }
    case 'shipMk3':
    case 'shipMk3Hit': {
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipMk3) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_POD_MK3);
      trace(ctx, fh, mirrored(SHIP_POD_MK3));
      trace(ctx, fh, SHIP_CANARD);
      trace(ctx, fh, mirrored(SHIP_CANARD));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 2, 'pulse');
      return;
    }
    /*
      ── THE SAME THREE HULLS, CARRYING THE ARC — 0233 ───────────────────────────────────────────

      Each tier is the pulse's tier with the nose forked: two prongs sharing the hull's own nose
      edges, on the pods' `evenodd` terms, and `paintShip` painting the coil where the pulse's
      light was. The box is wider than the pulse's at the same tier (`src/content/sprites.ts`) and
      the hull is drawn at the bare ship's size inside it, so the hurtbox is exactly the pulse's.
    */
    case 'shipArc':
    case 'shipArcHit': {
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipArc) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_PRONG);
      trace(ctx, fh, mirrored(SHIP_PRONG));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 0, 'arc');
      return;
    }
    case 'shipArcMk2':
    case 'shipArcMk2Hit': {
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipArcMk2) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_PRONG);
      trace(ctx, fh, mirrored(SHIP_PRONG));
      trace(ctx, fh, SHIP_POD);
      trace(ctx, fh, mirrored(SHIP_POD));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 1, 'arc');
      return;
    }
    case 'shipArcMk3':
    case 'shipArcMk3Hit': {
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipArcMk3) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_PRONG);
      trace(ctx, fh, mirrored(SHIP_PRONG));
      trace(ctx, fh, SHIP_POD_MK3);
      trace(ctx, fh, mirrored(SHIP_POD_MK3));
      trace(ctx, fh, SHIP_CANARD);
      trace(ctx, fh, mirrored(SHIP_CANARD));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 2, 'arc');
      return;
    }
    // ── AND CARRYING THE SHURIKEN LAUNCHER — 0234: a blade on each wingtip, then on each pod. ──
    case 'shipStar':
    case 'shipStarHit': {
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipStar) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_FIN);
      trace(ctx, fh, mirrored(SHIP_FIN));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 0, 'shuriken');
      return;
    }
    case 'shipStarMk2':
    case 'shipStarMk2Hit': {
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipStarMk2) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_POD);
      trace(ctx, fh, mirrored(SHIP_POD));
      trace(ctx, fh, SHIP_FIN_MK2);
      trace(ctx, fh, mirrored(SHIP_FIN_MK2));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 1, 'shuriken');
      return;
    }
    case 'shipStarMk3':
    case 'shipStarMk3Hit': {
      const fh: Frame = { half, r: r * (SPRITE_EXTENT.ship / SPRITE_EXTENT.shipStarMk3) };
      trace(ctx, fh, SHIP_HULL);
      trace(ctx, fh, SHIP_POD_MK3);
      trace(ctx, fh, mirrored(SHIP_POD_MK3));
      trace(ctx, fh, SHIP_FIN_MK3);
      trace(ctx, fh, mirrored(SHIP_FIN_MK3));
      trace(ctx, fh, SHIP_CANARD);
      trace(ctx, fh, mirrored(SHIP_CANARD));
      seal(ctx);
      if (!hurt) paintShip(ctx, fh, palette, 2, 'shuriken');
      return;
    }
    case 'drifter':
    case 'drifterHit':
      // A diamond: symmetrical, pointing nowhere, which is exactly what a drifter does. It holds its
      // line and never fires, and the silhouette says so by having no front.
      ctx.moveTo(half - r, half);
      ctx.lineTo(half, half - r);
      ctx.lineTo(half + r, half);
      ctx.lineTo(half, half + r);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintDrifter(ctx, f, skin, theme);
      return;
    case 'lancer':
    case 'lancerHit':
      /*
        A plain triangle, nose towards −x: pointing back down the lane, at the player.

        ⚠️ **THE SECOND ATTEMPT, and the first one is why this comment is long.** It was a
        five-sided arrowhead — a point at −x, swept wings, a blunt back — reasoned to be obviously an
        arrow and obviously not a diamond. Screenshotted at the size it actually ships, it was a
        small mushy lump that read as *a slightly smaller diamond*, so the player saw diamonds
        everywhere, some of which died to one shot and some to two, and reported the game as buggy.

        Three points against four is a silhouette difference that survives twenty pixels; five points
        with a 0.25r notch in them is not. `reports/enemy-silhouettes-2026-08-05.md`, and
        `docs/decisions/0027-measure-the-picture-not-the-model.md` for the reason a shape has to be
        LOOKED at rather than argued about.

        It cannot be confused with the player's wedge: that one is cyan, points the other way, and
        has a concave tail this deliberately does not.
      */
      ctx.moveTo(half - r, half);
      ctx.lineTo(half + r * 0.7, half - r * 0.95);
      ctx.lineTo(half + r * 0.7, half + r * 0.95);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintLancer(ctx, f, skin, theme);
      return;
    case 'weaver':
    case 'weaverHit':
      /*
        A BAR, long across the lane and thin along it — a line lying perpendicular to the way it
        travels. Nothing else in the game is a rectangle, and orientation is the cue that tells it
        from the charger's needle, which is the same primitive lying the other way.
      */
      ctx.rect(half - r * 0.22, half - r, r * 0.44, r * 2);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintWeaver(ctx, f, skin, theme);
      return;
    case 'turret':
    case 'turretHit': {
      /*
        A HALF-DISC with its flat face towards −x: round back, straight front pointed at the player.
        The only curved silhouette among the enemies, so it is told apart by having no corners at all
        rather than by counting them — which is the property `reports/enemy-silhouettes-2026-08-05.md`
        found survives twenty pixels.
      */
      ctx.moveTo(half - r * 0.55, half - r);
      ctx.lineTo(half - r * 0.55, half + r);
      ctx.arc(half - r * 0.55, half, r, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintTurret(ctx, f, skin, theme);
      return;
    }
    case 'charger':
    case 'chargerHit':
      /*
        A NEEDLE: a long narrow triangle, nose at −x, lying along the way it travels. Same primitive
        as the lancer and told apart by proportion — the lancer is as wide as it is long and this is
        a fifth of that. Size and shape carrying one message together, which is the pairing
        `src/content/sprites.ts` already uses to say how much killing a thing takes.
      */
      ctx.moveTo(half - r, half);
      ctx.lineTo(half + r * 0.9, half - r * 0.22);
      ctx.lineTo(half + r * 0.9, half + r * 0.22);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintCharger(ctx, f, skin, theme);
      return;
    case 'boss':
    case 'bossHit': {
      /*
        A blunt hexagonal hull with a notched prow at −x. It is the only sprite allowed to be
        complicated, for the one reason the others are not: at 26 world units it is four times the
        size of anything else on screen, so detail survives that would be mush on an enemy.

        The notch is what makes it read as facing the player rather than as a lump.
      */
      ctx.moveTo(half - r, half);
      ctx.lineTo(half - r * 0.45, half - r * 0.45);
      ctx.lineTo(half - r * 0.55, half - r * 0.8);
      ctx.lineTo(half + r * 0.5, half - r * 0.95);
      ctx.lineTo(half + r, half - r * 0.4);
      ctx.lineTo(half + r, half + r * 0.4);
      ctx.lineTo(half + r * 0.5, half + r * 0.95);
      ctx.lineTo(half - r * 0.55, half + r * 0.8);
      ctx.lineTo(half - r * 0.45, half + r * 0.45);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      carve(ctx, f, palette.space, BOSS_KEEL);
      if (skin !== null) paintBoss(ctx, f, skin, theme);
      return;
    }
    case 'spinner':
    case 'spinnerHit':
      /*
        A CROSS: four arms, and the only concave outline in the game. Every other enemy is a convex
        blob of some kind — a diamond, a triangle, a bar, a needle, a half-disc, a ring — so what tells
        this one apart at twenty pixels is that its edge goes in and out again four times, which is a
        property no amount of shrinking removes.

        ⚠️ **The arms are drawn along and across the lane rather than diagonally**, so the shape reads
        as pointing at nothing — which is what a body that fires in every direction should look like.
        A diagonal cross is an ✕, which reads as a marker.
      */
      ctx.moveTo(half - r * 0.3, half - r);
      ctx.lineTo(half + r * 0.3, half - r);
      ctx.lineTo(half + r * 0.3, half - r * 0.3);
      ctx.lineTo(half + r, half - r * 0.3);
      ctx.lineTo(half + r, half + r * 0.3);
      ctx.lineTo(half + r * 0.3, half + r * 0.3);
      ctx.lineTo(half + r * 0.3, half + r);
      ctx.lineTo(half - r * 0.3, half + r);
      ctx.lineTo(half - r * 0.3, half + r * 0.3);
      ctx.lineTo(half - r, half + r * 0.3);
      ctx.lineTo(half - r, half - r * 0.3);
      ctx.lineTo(half - r * 0.3, half - r * 0.3);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintSpinner(ctx, f, skin, theme);
      return;
    case 'sower':
    case 'sowerHit':
      /*
        A CHEVRON: a wedge pointing −x with the back open, so the silhouette is a band of ink with a
        notch cut out of it rather than a filled shape.

        ⚠️ **THE PAIR TO WATCH IS THIS AGAINST THE LANCER**, and it is written down rather than assumed
        away — both are wedges pointing at the player, and what separates them is that this one has a
        bite taken out of its back. `reports/enemy-silhouettes-2026-08-05.md` records the lancer's own
        first draft failing exactly this test, so the notch is deliberately deep: it reaches 0.45 of
        the radius, against the 0.25 that was found to be invisible.
      */
      ctx.moveTo(half - r, half);
      ctx.lineTo(half + r * 0.55, half - r * 0.9);
      ctx.lineTo(half + r, half - r * 0.55);
      ctx.lineTo(half - r * 0.15, half);
      ctx.lineTo(half + r, half + r * 0.55);
      ctx.lineTo(half + r * 0.55, half + r * 0.9);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintSower(ctx, f, skin, theme);
      return;
    case 'warden':
    case 'wardenHit':
      /*
        A RING. Filled with `evenodd` below, so the inner circle is a hole rather than a second disc —
        which is what makes it read as an aperture rather than as a fat bullet. It is the only
        silhouette in the game with a hole in it, and holes survive being small better than corners
        do.
      */
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.45, half);
      ctx.arc(half, half, r * 0.45, 0, Math.PI * 2);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintWarden(ctx, f, skin, theme);
      return;
    case 'boss2':
    case 'boss2Hit': {
      /*
        THREE PRONGS facing the player, on a narrow spine. The first boss is a solid hexagonal hull;
        this is the opposite reading — open, reaching, with gaps a player can fly into and regret.

        Same licence as the first: at 30 world units it is five times the size of anything else on
        screen, so detail survives that would be mush on an enemy.
      */
      ctx.moveTo(half - r, half - r * 0.16);
      ctx.lineTo(half - r * 0.25, half - r * 0.3);
      ctx.lineTo(half - r * 0.55, half - r * 0.95);
      ctx.lineTo(half + r * 0.15, half - r * 0.8);
      ctx.lineTo(half + r * 0.95, half - r * 0.35);
      ctx.lineTo(half + r * 0.95, half + r * 0.35);
      ctx.lineTo(half + r * 0.15, half + r * 0.8);
      ctx.lineTo(half - r * 0.55, half + r * 0.95);
      ctx.lineTo(half - r * 0.25, half + r * 0.3);
      ctx.lineTo(half - r, half + r * 0.16);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      carve(ctx, f, palette.space, BOSS2_SPINE);
      if (skin !== null) paintBoss2(ctx, f, skin, theme);
      return;
    }
    /*
      ── THE FIVE LATER HULLS ────────────────────────────────────────────────────────────────────

      `docs/game.md`: every boss is unique. These are five silhouettes rather than five sets of
      numbers, and each one is built around ONE readable idea, because at 28 to 38 world units the
      shape is the first thing a player learns and the last thing they forget.

      ⚠️ **Still placeholders, and the pipeline is still not.** The file's own opening paragraph says
      so; what these buy is that no two bosses in the run are the same object in a different colour.
    */
    case 'boss3':
    case 'boss3Hit':
      // A LATTICE: a wide diamond with a hollow centre, so the player can see through it and cannot
      // fly through it. The gap is the idea — it reads as a frame rather than as a body.
      ctx.moveTo(half - r, half);
      ctx.lineTo(half, half - r * 0.85);
      ctx.lineTo(half + r, half);
      ctx.lineTo(half, half + r * 0.85);
      ctx.closePath();
      ctx.moveTo(half - r * 0.42, half);
      ctx.lineTo(half, half - r * 0.36);
      ctx.lineTo(half + r * 0.42, half);
      ctx.lineTo(half, half + r * 0.36);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      carve(ctx, f, palette.space, BOSS3_NODES);
      if (skin !== null) paintBoss3(ctx, f, skin, theme);
      return;
    case 'boss4':
    case 'boss4Hit':
      // A SHOAL MOTHER: a blunt teardrop trailing four fins. Level four is about speed, and this is
      // the only hull in the game that reads as moving while it is standing still.
      ctx.moveTo(half - r, half);
      ctx.lineTo(half - r * 0.3, half - r * 0.62);
      ctx.lineTo(half + r * 0.55, half - r * 0.5);
      ctx.lineTo(half + r * 0.95, half - r * 0.86);
      ctx.lineTo(half + r * 0.8, half - r * 0.22);
      ctx.lineTo(half + r, half);
      ctx.lineTo(half + r * 0.8, half + r * 0.22);
      ctx.lineTo(half + r * 0.95, half + r * 0.86);
      ctx.lineTo(half + r * 0.55, half + r * 0.5);
      ctx.lineTo(half - r * 0.3, half + r * 0.62);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      carve(ctx, f, palette.space, BOSS4_STREAKS);
      if (skin !== null) paintBoss4(ctx, f, skin, theme);
      return;
    case 'boss5':
    case 'boss5Hit':
      // A REDOUBT: a squat slab with a stepped face, and the widest hull so far. Level five is about
      // things that must be killed, and this is what that looks like — a wall with gun ports.
      ctx.moveTo(half - r * 0.72, half - r * 0.95);
      ctx.lineTo(half + r * 0.35, half - r * 0.95);
      ctx.lineTo(half + r * 0.35, half - r * 0.55);
      ctx.lineTo(half + r, half - r * 0.4);
      ctx.lineTo(half + r, half + r * 0.4);
      ctx.lineTo(half + r * 0.35, half + r * 0.55);
      ctx.lineTo(half + r * 0.35, half + r * 0.95);
      ctx.lineTo(half - r * 0.72, half + r * 0.95);
      ctx.lineTo(half - r * 0.95, half + r * 0.4);
      ctx.lineTo(half - r * 0.95, half - r * 0.4);
      ctx.closePath();
      // Three ports along the face, hollow, so the thing that shoots has somewhere it shoots from.
      for (let i = -1; i <= 1; i++) {
        const y = half + i * r * 0.5;
        ctx.moveTo(half + r * 0.62, y);
        ctx.arc(half + r * 0.45, y, r * 0.17, 0, Math.PI * 2);
      }
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      carve(ctx, f, palette.space, BOSS5_BANDS);
      if (skin !== null) paintBoss5(ctx, f, skin, theme);
      return;
    case 'boss6':
    case 'boss6Hit':
      // A CHORUS: three stacked lobes on one spine, so it reads as several things that turned out to
      // be one. Level six is about there being no gaps, and this is the hull that has none.
      for (let i = -1; i <= 1; i++) {
        const y = half + i * r * 0.62;
        ctx.moveTo(half + r * 0.62, y);
        ctx.arc(half, y, r * 0.62, 0, Math.PI * 2);
      }
      ctx.moveTo(half - r * 0.18, half - r);
      ctx.lineTo(half + r * 0.18, half - r);
      ctx.lineTo(half + r * 0.18, half + r);
      ctx.lineTo(half - r * 0.18, half + r);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      carve(ctx, f, palette.space, BOSS6_EYES);
      if (skin !== null) paintBoss6(ctx, f, skin, theme);
      return;
    case 'boss7':
    case 'boss7Hit':
      // AN AXIS: a ringed eye. The biggest hull in the game and the only round one, because the last
      // boss of the authored run should be the one shape nothing else in it shares.
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.66, half);
      ctx.arc(half, half, r * 0.66, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.3, half);
      ctx.arc(half, half, r * 0.3, 0, Math.PI * 2);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      carve(ctx, f, palette.space, BOSS7_EYE);
      if (skin !== null) paintBoss7(ctx, f, skin, theme);
      return;
    /*
      ── THE REAL BOSSES — 0247 ────────────────────────────────────────────────────────────────────

      Seven more hulls, each the one shape nothing else in the game shares, each facing −x. First
      iterations, like the fights they belong to: a silhouette that reads as the thing the ask named,
      one shadowed plate, one lit edge and an eye, and no more until each boss's own decision says
      what its picture is for.
    */
    case 'boss8':
    case 'boss8Hit':
      // THE SERPENT: a thick sinuous band, head to the front, the whole hull one S across the box.
      trace(ctx, f, [
        [-1, -0.1],
        [-0.72, -0.55],
        [-0.3, -0.72],
        [0.02, -0.38],
        [0.36, 0],
        [0.7, 0.28],
        [1, 0.08],
        [1, 0.5],
        [0.68, 0.76],
        [0.3, 0.55],
        [0, 0.14],
        [-0.3, -0.16],
        [-0.66, -0.06],
        [-1, 0.34],
      ]);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss8(ctx, f, skin, theme);
      return;
    case 'boss9':
    case 'boss9Hit':
      // THE EAGLE: a head, two wings thrown wide, a tail — the widest span in the game.
      trace(ctx, f, [
        [-1, 0],
        [-0.6, -0.26],
        [-0.2, -0.95],
        [0.3, -1],
        [0.55, -0.5],
        [1, -0.15],
        [1, 0.15],
        [0.55, 0.5],
        [0.3, 1],
        [-0.2, 0.95],
        [-0.6, 0.26],
      ]);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss9(ctx, f, skin, theme);
      return;
    case 'boss10':
    case 'boss10Hit':
      // THE PTERODACTYL: a long beak, a crest, and wings swept back to the corners.
      trace(ctx, f, [
        [-1, -0.05],
        [-0.55, -0.22],
        [-0.42, -0.55],
        [-0.2, -0.3],
        [0.9, -1],
        [1, -0.7],
        [0.42, -0.2],
        [0.42, 0.2],
        [1, 0.7],
        [0.9, 1],
        [-0.2, 0.3],
        [-0.55, 0.22],
        [-1, 0.05],
      ]);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss10(ctx, f, skin, theme);
      return;
    case 'boss11':
    case 'boss11Hit': {
      // THE GYRE: a cog — sixteen teeth about a hub with a hole in it. Round like the axis and not the
      // axis: its edge goes in and out sixteen times.
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const reach = i % 2 === 0 ? 1 : 0.76;
        const x = half + Math.cos(a) * reach * r;
        const y = half + Math.sin(a) * reach * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.moveTo(half + r * 0.28, half);
      ctx.arc(half, half, r * 0.28, 0, Math.PI * 2);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss11(ctx, f, skin, theme);
      return;
    }
    case 'boss12':
    case 'boss12Hit':
      // THE FROST SHIP: a long crystal, six-sided, its point to the front.
      trace(ctx, f, [
        [-1, 0],
        [-0.5, -0.62],
        [0.3, -0.86],
        [1, -0.36],
        [1, 0.36],
        [0.3, 0.86],
        [-0.5, 0.62],
      ]);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss12(ctx, f, skin, theme);
      return;
    case 'boss13':
    case 'boss13Hit':
      // THE HYDRA: a broad body with five necks reaching forward, one at the centre and two either
      // side. Its edge goes in and out five times at the front and nowhere else.
      trace(ctx, f, [
        [-0.4, -1],
        [-0.95, -0.8],
        [-0.5, -0.5],
        [-1, -0.36],
        [-0.55, -0.16],
        [-1, 0],
        [-0.55, 0.16],
        [-1, 0.36],
        [-0.5, 0.5],
        [-0.95, 0.8],
        [-0.4, 1],
        [0.6, 0.9],
        [1, 0.3],
        [1, -0.3],
        [0.6, -0.9],
      ]);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss13(ctx, f, skin, theme);
      return;
    case 'boss14':
    case 'boss14Hit':
      // THE JELLYFISH: a bell to the front and tendrils trailing behind it — the biggest hull there
      // is, and the only one whose back edge is a fringe.
      ctx.arc(half + r * 0.1, half, r * 0.86, Math.PI / 2, (Math.PI * 3) / 2);
      ctx.lineTo(half + r * 0.5, half - r * 0.76);
      ctx.lineTo(half + r * 0.95, half - r * 0.95);
      ctx.lineTo(half + r * 0.6, half - r * 0.55);
      ctx.lineTo(half + r, half - r * 0.3);
      ctx.lineTo(half + r * 0.55, half - r * 0.1);
      ctx.lineTo(half + r, half + r * 0.1);
      ctx.lineTo(half + r * 0.55, half + r * 0.35);
      ctx.lineTo(half + r * 0.95, half + r * 0.6);
      ctx.lineTo(half + r * 0.5, half + r * 0.8);
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss14(ctx, f, skin, theme);
      return;
    case 'bullet':
      /*
        The pulse: a disc, and now a BOLT — a halo round it and a white-hot heart in it. The
        silhouette is untouched, because a disc against a square, a dash and a slab is the whole of
        how the player tells their own fire from what shoots back (0081, 0098); what changed is that
        it is lit.
      */
      ctx.arc(half, half, r * 0.8, 0, Math.PI * 2);
      seal(ctx);
      glow(ctx, f, palette.bullet, 0, 0, 1.15, 0.55);
      disc(ctx, f, shade(palette.bullet, 0.65), 0, 0, 0.4);
      return;
    case 'spit':
      /*
        A SQUARE — corners against the pulse's disc, and the last primitive left that survives fifteen
        pixels (0081). Axis-aligned rather than turned, because a square turned 45° is the drifter's
        diamond and the two would read alike the moment either was small.
      */
      ctx.rect(half - r * 0.72, half - r * 0.72, r * 1.44, r * 1.44);
      seal(ctx);
      /*
        ⚠️ **PAINTED NOW, ON THE PULSE'S OWN TERMS** — 0229: *"enemy bullets need to be tailored
        graphically."* A halo in the enemy ink and a white-hot heart, so the square is a plasma cube
        rather than a pink tile; the silhouette, the size and the ink are exactly where 0081 and 0098
        put them, because those are the whole of how the three are told apart from the pulse and from
        each other.
      */
      glow(ctx, f, palette.enemy, 0, 0, 1.15, 0.5);
      disc(ctx, f, shade(palette.enemy, 0.7), 0, 0, 0.36);
      return;
    case 'lance':
      /*
        A DASH: a bar lying ALONG the way it travels, twice as long as it is deep — 0098. The lancer's
        shot is the quick one, and a mark stretched along its own path is what motion looks like
        standing still, which is the same reasoning `skyRush` rests on one file-section down.

        It is not the weaver's bar: that one lies across the lane and is an enemy hull five times the
        size. It is not the charger's needle either, which is a triangle with a nose.
      */
      ctx.rect(half - r, half - r * 0.34, r * 2, r * 0.68);
      seal(ctx);
      // A hot core down the dash and a halo trailing off its back: the fast one, lit along its path.
      glow(ctx, f, palette.enemy, 0, 0, 1.1, 0.5);
      // At 1.9 units the dash is six pixels deep on a 1280×720 screen, so its core is most of it.
      poly(ctx, f, shade(palette.enemy, 0.7), [
        [-0.5, -0.23],
        [0.85, -0.23],
        [0.85, 0.23],
        [-0.5, 0.23],
      ]);
      return;
    case 'flak':
      /*
        A SLAB: the widest bullet in the game and the only one with a bevel — a square with its
        corners taken off, which is a shape a square cannot be mistaken for once both are on screen.
        The turret's shot is the slow one, so it is the one that occupies the lane while the player
        walks around it, and it is drawn as the thing filling the lane.
      */
      ctx.moveTo(half - r * 0.5, half - r * 0.8);
      ctx.lineTo(half + r * 0.5, half - r * 0.8);
      ctx.lineTo(half + r * 0.8, half);
      ctx.lineTo(half + r * 0.5, half + r * 0.8);
      ctx.lineTo(half - r * 0.5, half + r * 0.8);
      ctx.lineTo(half - r * 0.8, half);
      ctx.closePath();
      seal(ctx);
      // The slow, fat one: a dark bevel on its lower half and a hot core, so it reads as a mass.
      poly(ctx, f, shade(palette.enemy, -0.35), [
        [-0.72, 0.06],
        [0.72, 0.06],
        [0.46, 0.72],
        [-0.46, 0.72],
      ]);
      glow(ctx, f, palette.enemy, 0, 0, 1.12, 0.45);
      disc(ctx, f, shade(palette.enemy, 0.7), 0, -0.04, 0.3);
      return;
    case 'acid':
      /*
        A DROP — 0248: round below and pointed above, the one shot in the game with one point. Not
        the charger's needle (a triangle with a nose, and a hull) and not the pulse's disc: a drop
        is a disc with a tail, and the tail survives fifteen pixels. In the `acid` ink with its own
        glow, and a pale heart low in the drop where the light would sit.
      */
      trace(ctx, f, [
        [0, -0.92],
        [0.34, -0.36],
        [0.62, 0.04],
        [0.72, 0.4],
        [0.56, 0.78],
        [0.22, 0.95],
        [-0.22, 0.95],
        [-0.56, 0.78],
        [-0.72, 0.4],
        [-0.62, 0.04],
        [-0.34, -0.36],
      ]);
      seal(ctx);
      glow(ctx, f, palette.acid, 0, 0, 1.1, 0.45);
      disc(ctx, f, shade(palette.acid, 0.6), -0.16, 0.32, 0.22);
      return;
    case 'void':
      /*
        A RING — 0248: a disc with a hole through it, `evenodd`. The warden is a ring too and it is a
        hull four times the size; among SHOTS this is the only one with a hole, and a hole survives
        being small better than a corner does (the warden's own argument). In the `void` ink, lit
        from within: the glow sits in the hole rather than around the rim, so the thing reads as
        an absence with an edge.
      */
      ctx.arc(half, half, r * 0.82, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.38, half);
      ctx.arc(half, half, r * 0.38, 0, Math.PI * 2);
      seal(ctx);
      glow(ctx, f, palette.void, 0, 0, 1.1, 0.5);
      // The light on the rim, not in the hole: a mark over a hole is a mark off the hull (0149).
      disc(ctx, f, shade(palette.void, 0.7), 0, -0.6, 0.17);
      return;
    case 'flame':
      /*
        A TONGUE — 0249: a flame's own outline, pointed at the front and notched at the back where
        it licks, leaning the way it flies. Not the acid's drop (round at the back, pointed at the
        front along the other axis) and the smallest bullet there is. In the `fire` ink, with a hot
        heart low in it.
      */
      trace(ctx, f, [
        [-1, 0],
        [-0.3, -0.5],
        [0.2, -0.9],
        [0.3, -0.35],
        [0.9, -0.55],
        [0.5, 0],
        [0.9, 0.55],
        [0.3, 0.35],
        [0.2, 0.9],
        [-0.3, 0.5],
      ]);
      seal(ctx);
      // The glow is the whole of its light: a bullet this small cannot carry a mark that is drawn
      // at all (0106), so the tongue is one ink and its halo.
      glow(ctx, f, palette.fire, 0, 0, 1.1, 0.5);
      return;
    case 'kite':
    case 'kiteHit':
      // A diamond with a FORKED TAIL — 0249. The drifter is a diamond too, and what tells the two
      // apart at twenty pixels is the tail: two streamers off the back, which the drifter has not.
      trace(ctx, f, KITE_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintKite(ctx, f, skin, theme);
      return;
    case 'debris':
      // A shard: small, angular, and deliberately NOT a disc, so a fragment is never mistaken for a
      // bullet at the one moment the screen is busiest.
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.4, half - r * 0.8);
      ctx.lineTo(half - r, half + r * 0.2);
      ctx.closePath();
      break;
    /*
      ── THE BANG — 0227 ─────────────────────────────────────────────────────────────────────────

      Four frames of a body coming apart, walked by `src/app/frame.ts` off a debris entity's own
      clock. No hull and no outline: fire has no edge, and a dark rim round a fireball is a sticker.
      Everything here is the palette's own fire — `bullet` is the flame, `hazard` its heart, `impact`
      the flash, and smoke is the exhaust ink taken most of the way to black — so the high-contrast
      palette gets an explosion in its own terms.

      ⚠️ **THE FLASH IS SMALLER THAN THE BODY AND THE SMOKE IS BARELY BIGGER**, and both are drawn
      under everything (`src/app/mount.ts` puts debris first). A burst may never hide a bullet.
    */
    case 'burst0':
      glow(ctx, f, palette.hazard, 0, 0, 1.1, 0.75);
      disc(ctx, f, palette.impact, 0, 0, 0.55);
      return;
    case 'burst1': {
      const rng = makeRng('art').stream('burst1');
      glow(ctx, f, palette.bullet, 0, 0, 1.15, 0.6);
      poly(ctx, f, palette.bullet, ragged(rng, 0, 0, 0.72, 1, 14));
      poly(ctx, f, palette.hazard, ragged(rng, 0.04, 0.02, 0.42, 0.62, 11));
      disc(ctx, f, palette.impact, 0.03, 0, 0.28);
      for (let i = 0; i < 6; i++) {
        const a = rng.range(0, Math.PI * 2);
        const d = rng.range(0.85, 1.1);
        disc(ctx, f, palette.hazard, Math.cos(a) * d, Math.sin(a) * d, 0.09);
      }
      return;
    }
    case 'burst2': {
      const rng = makeRng('art').stream('burst2');
      const smoke = shade(palette.flame, -0.55);
      // The ring: a ragged outer edge with a ragged hole, so the sky shows through the middle.
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = palette.bullet;
      ctx.beginPath();
      trace(ctx, f, ragged(rng, 0, 0, 0.9, 1.06, 16));
      trace(ctx, f, ragged(rng, 0, 0, 0.5, 0.62, 12));
      ctx.fill('evenodd');
      ctx.globalAlpha = 1;
      band(ctx, f, palette.hazard, 0, 0, 0.72, 0.56, 0.7);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + rng.range(-0.3, 0.3);
        const d = rng.range(0.72, 0.9);
        disc(ctx, f, smoke, Math.cos(a) * d, Math.sin(a) * d, rng.range(0.2, 0.3), 0.5);
      }
      for (let i = 0; i < 7; i++) {
        const a = rng.range(0, Math.PI * 2);
        const d = rng.range(1.02, 1.14);
        disc(ctx, f, palette.hazard, Math.cos(a) * d, Math.sin(a) * d, 0.07, 0.85);
      }
      return;
    }
    case 'burst3': {
      const rng = makeRng('art').stream('burst3');
      const smoke = shade(palette.flame, -0.6);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + rng.range(-0.25, 0.25);
        const d = rng.range(0.6, 0.86);
        disc(ctx, f, smoke, Math.cos(a) * d, Math.sin(a) * d, rng.range(0.3, 0.4), 0.42);
      }
      for (let i = 0; i < 5; i++) {
        const a = rng.range(0, Math.PI * 2);
        const d = rng.range(0.5, 0.95);
        disc(ctx, f, palette.flame, Math.cos(a) * d, Math.sin(a) * d, 0.08, 0.6);
      }
      return;
    }
    // A missile landing: the flash, then the flash going. Under a missile's own size at the first.
    case 'spark0':
      glow(ctx, f, palette.hazard, 0, 0, 1.1, 0.75);
      disc(ctx, f, palette.impact, 0, 0, 0.5);
      return;
    case 'spark1': {
      const rng = makeRng('art').stream('spark1');
      band(ctx, f, palette.bullet, 0, 0, 0.9, 0.62, 0.8);
      for (let i = 0; i < 5; i++) {
        const a = rng.range(0, Math.PI * 2);
        disc(ctx, f, palette.hazard, Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.1, 0.85);
      }
      return;
    }
    /*
      ── THE EXHAUST — 0230 ──────────────────────────────────────────────────────────────────────

      Two flames, one per nacelle, with their roots at the sprite's forward edge and their tips at
      its back. No hull and no outline, on the burst's own terms: fire has no edge. The two idle
      frames and the two burning frames differ in length and in where the flicker is, so alternating
      them on the step clock reads as a flame that is alive; the ease frame is a wisp.

      ⚠️ **THE NACELLES ARE 0.62 UNITS OFF THE CENTRELINE ON THE HULL**, and each kind's box is a
      different size, so the offset is stated in units and divided by the kind's own radius here.
    */
    case 'thrustIdle0':
    case 'thrustIdle1':
    case 'thrustIdle0Climb':
    case 'thrustIdle0Dive':
    case 'thrustIdle1Climb':
    case 'thrustIdle1Dive':
      paintThrust(ctx, f, palette, 'idle', kind.startsWith('thrustIdle1'), leanOf(kind), SPRITE_EXTENT[kind]);
      return;
    case 'thrustBurn0':
    case 'thrustBurn1':
    case 'thrustBurn0Climb':
    case 'thrustBurn0Dive':
    case 'thrustBurn1Climb':
    case 'thrustBurn1Dive':
      paintThrust(ctx, f, palette, 'burn', kind.startsWith('thrustBurn1'), leanOf(kind), SPRITE_EXTENT[kind]);
      return;
    case 'thrustEase':
    case 'thrustEaseClimb':
    case 'thrustEaseDive':
      paintThrust(ctx, f, palette, 'ease', false, leanOf(kind), SPRITE_EXTENT[kind]);
      return;
    /*
      ── THE SIGNATURE ENEMIES, ONE PER PLACE — 0232 ────────────────────────────────────────────

      Seven silhouettes against the eight that exist, each a primitive and an axis that survive
      twenty pixels (`reports/enemy-silhouettes-2026-08-05.md`), and each painted in its own place's
      skin like everything else the place sends. What tells each from its neighbours is written on
      its arm, because a pair that reads alike costs a play-test.
    */
    case 'picket':
    case 'picketHit':
      // A Y: three blades at 120°, one pointing down the lane. The only three-armed thing in the
      // game — the spinner has four, and a drifter's diamond has none.
      trace(ctx, f, PICKET_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintPicket(ctx, f, skin, theme);
      return;
    case 'moth':
    case 'mothHit':
      // Two wings on a body: the widest thing across the lane that is not a bar, and the only
      // silhouette with two lobes side by side.
      trace(ctx, f, MOTH_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintMoth(ctx, f, skin, theme);
      return;
    case 'raptor':
    case 'raptorHit':
      // A crescent with its horns down the lane: the only concave FRONT in the game. The sower's
      // chevron is open at the back; this is open at the front, where the jaws are.
      trace(ctx, f, RAPTOR_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintRaptor(ctx, f, skin, theme);
      return;
    case 'sentry':
    case 'sentryHit':
      // A block with a slot in its face: square, three times a spit's size, and notched where it
      // fires from. The turret is round-backed; this has corners everywhere.
      trace(ctx, f, SENTRY_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintSentry(ctx, f, skin, theme);
      return;
    case 'shard':
    case 'shardHit':
      // A crystal: a long hexagon pointed both ways. Told from the charger's needle by having a
      // waist, and from the drifter's diamond by being twice as long as it is deep.
      trace(ctx, f, SHARD_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintShard(ctx, f, skin, theme);
      return;
    case 'spore':
    case 'sporeHit':
      // A sac: a lumpy round mass with no hole and no corners. The warden is a ring and the turret a
      // half-disc; this is the only full round body, and it is a mine.
      trace(ctx, f, SPORE_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintSpore(ctx, f, skin, theme);
      return;
    case 'gaze':
    case 'gazeHit':
      // A lens: pointed at both ends across the lane, with a pupil. The one body that is wider
      // across than along and comes to a point — a weaver's bar has no points.
      trace(ctx, f, GAZE_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintGaze(ctx, f, skin, theme);
      return;
    case 'lifeIcon': {
      /*
        A PLUS. The one glyph that means *more of something* without any game having to teach it,
        and four arms make a silhouette no enemy in the game shares — the diamond has four points
        and no waist.

        ⚠️ **It is only ever drawn in the HUD now** — 0082 took the extra life off the field — so the
        thing it has to be legible against is a numeral rather than a lane full of bodies.
      */
      const arm = r * 0.34;
      ctx.rect(half - arm, half - r, arm * 2, r * 2);
      ctx.rect(half - r, half - arm, r * 2, arm * 2);
      break;
    }
    case 'pickupWeapon': {
      /*
        A CHEVRON, pointing the way the ship flies.

        ⚠️ **A new shape rather than one of the four it replaces**, and that is worth the drawing.
        0082 merged `rapid`, `spread`, `missileRate` and `missileSpread` into one kind, and every one
        of those four silhouettes belonged to a scheme — a family with an inverted fill for its
        partner — that no longer has a partner to invert. Keeping the holed square would have kept a
        shape whose whole meaning was *the other one is the solid version*.

        ⚠️ **It points, which none of the other pickups does.** A chevron aimed along the scroll axis
        reads as *forward, more, faster* without teaching, and it is the only pickup that is
        asymmetric along `along` — so it is told apart from the shield and the bomb by orientation as
        well as by outline, at the size where outlines start to fail.

        ⚠️ **ONE simple polygon, and the first draft was two overlapping ones.** Two nested chevrons
        wound so `evenodd` left a gap between them is the obvious way to draw a `»`, and it is a
        silhouette that self-intersects: wherever the two overlap the fill rule cancels them, so the
        shape depends on arithmetic nobody checked rather than on the drawing. This is the same
        chevron with the gap cut out of its TAIL, which needs no fill rule at all — the notch is also
        what keeps it off the lancer, the one enemy silhouette that also comes to a forward point.
      */
      const fg: Frame = { half, r: r * PICKUP_GLYPH };
      const g = fg.r;
      ctx.moveTo(half + g, half);
      ctx.lineTo(half - g * 0.2, half - g * 0.85);
      ctx.lineTo(half - g, half - g * 0.85);
      ctx.lineTo(half - g * 0.25, half);
      ctx.lineTo(half - g, half + g * 0.85);
      ctx.lineTo(half - g * 0.2, half + g * 0.85);
      ctx.closePath();
      seal(ctx);
      bubble(ctx, f, palette);
      // The lower arm in shadow, so the chevron has a top and an underside — in the pulse's own
      // orange since 0240, like the fill `INK_OF` gave the seal.
      poly(ctx, fg, shade(palette.bullet, -0.28), [
        [0.72, 0.1],
        [-0.16, 0.7],
        [-0.72, 0.7],
        [-0.14, 0.1],
      ]);
      // A shaft down the middle and a lit head — 0194's livery, painted rather than tabled.
      poly(ctx, fg, palette.trim, [
        [-0.08, -0.085],
        [0.35, -0.085],
        [0.35, 0.085],
        [-0.08, 0.085],
      ]);
      disc(ctx, fg, palette.glass, 0.14, 0, 0.18);
      disc(ctx, fg, shade(palette.glass, 0.5), 0.18, -0.04, 0.08);
      return;
    }
    case 'pickupShuriken': {
      /*
        A HOOKED FOUR-BLADED STAR WITH A HOLE — the weapon pickup's third face, 0234. The hook is
        what keeps it off the arc's landing spark (a straight four-pointed star, a third the size),
        and the hole is what keeps it off every other pickup at pickup size.

        Glyph at three quarters of the box and a bubble round it, on the arc face's terms — 0236.
      */
      const fg: Frame = { half, r: r * PICKUP_GLYPH };
      traceStar(ctx, fg, 1, 0);
      ring(ctx, fg, 0, 0, 0.16);
      seal(ctx);
      bubble(ctx, f, palette);
      // The trailing edge of each blade in shadow, so it has a lit face and a ground one — in
      // steel, the face's own ink since 0239.
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        poly(ctx, fg, shade(palette.blade, -0.28), [
          [Math.cos(a) * 0.96, Math.sin(a) * 0.96],
          [Math.cos(a + 0.7) * 0.36, Math.sin(a + 0.7) * 0.36],
          [Math.cos(a + 0.45) * 0.34, Math.sin(a + 0.45) * 0.34],
        ]);
      }
      return;
    }
    case 'shuriken':
    case 'shurikenTurn': {
      /*
        The blade itself, in flight: the same hooked star, an eighth of a turn apart between the two.

        ⚠️ **STEEL, BIG, AND LIT — 0238.** Played twice: *"shuriken stars need to be a lot bigger"*,
        then *"bigger and steel coloured, also with a bit of a glow to them."* The star wears the
        `blade` ink rather than the pulse's orange, is drawn at `BLADE_GLYPH` of a box that is now
        bigger than the ship, and the rest of the box is a soft glow in the same ink behind it
        (`destination-over`, on the pickups' terms — 0236). Each blade's trailing edge is in shadow
        and its leading edge catches the light, which is what makes a flat star read as metal.
      */
      const fg: Frame = { half, r: r * BLADE_GLYPH };
      const phase = kind === 'shuriken' ? 0 : Math.PI / 4;
      traceStar(ctx, fg, 1, phase);
      seal(ctx);
      ctx.globalCompositeOperation = 'destination-over';
      glow(ctx, f, palette.blade, 0, 0, 1, 0.55);
      ctx.globalCompositeOperation = 'source-over';
      for (let k = 0; k < 4; k++) {
        const a = phase + (k * Math.PI) / 2;
        poly(ctx, fg, shade(palette.blade, -0.38), [
          [Math.cos(a) * 0.96, Math.sin(a) * 0.96],
          [Math.cos(a + 0.7) * 0.36, Math.sin(a + 0.7) * 0.36],
          [Math.cos(a + 0.45) * 0.34, Math.sin(a + 0.45) * 0.34],
        ]);
        // Wide enough to be drawn at the shipped camera — `tests/accents.test.ts` holds the floor.
        // Widened a third when the box went to a twelfth of the lane (0244): at eight units the
        // sliver it was came out at 2.1 px on a 1280×720 screen, under 0106's floor of 2.5. It
        // widens on the trailing side, up to the shadow's edge: the leading point is already on
        // the star's own edge, and a mark over the hull is the other guard in the same file.
        poly(ctx, fg, shade(palette.blade, 0.45), [
          [Math.cos(a) * 0.86, Math.sin(a) * 0.86],
          [Math.cos(a - 0.16) * 0.36, Math.sin(a - 0.16) * 0.36],
          [Math.cos(a + 0.17) * 0.52, Math.sin(a + 0.17) * 0.52],
        ]);
      }
      disc(ctx, fg, shade(palette.blade, -0.55), 0, 0, 0.16);
      return;
    }
    case 'pickupArc': {
      /*
        A BOLT — the weapon pickup's other face, 0233.

        ⚠️ **The one glyph for lightning that needs no teaching**, and the one shape in the atlas with
        two opposed points and a waist, so it is off the chevron (one point, notched tail) and off
        the shield (flat top) at pickup size. One simple polygon: the classic seven-point bolt has
        no self-intersection, so `evenodd` has nothing to cancel.

        ⚠️ **Drawn along the lane like the chevron**, top-left to bottom-right, so the two faces of
        one pickup share an axis and read as the same object turning rather than as two objects.
      */
      const fg: Frame = { half, r: r * PICKUP_GLYPH };
      const g = fg.r;
      ctx.moveTo(half - g * 0.15, half - g);
      ctx.lineTo(half + g * 0.55, half - g);
      ctx.lineTo(half + g * 0.12, half - g * 0.2);
      ctx.lineTo(half + g * 0.62, half - g * 0.2);
      ctx.lineTo(half - g * 0.55, half + g);
      ctx.lineTo(half - g * 0.15, half + g * 0.15);
      ctx.lineTo(half - g * 0.62, half + g * 0.15);
      ctx.closePath();
      seal(ctx);
      bubble(ctx, f, palette);
      // The lower half in shadow, so the bolt has a lit edge and an underside like the chevron.
      // In the face's own ink — the ship's, since 0239 — like the fill `INK_OF` gave the seal.
      poly(ctx, fg, shade(palette.player, -0.28), [
        [0.5, -0.2],
        [-0.55, 1],
        [-0.15, 0.15],
        [-0.05, 0.15],
      ]);
      // A glass core at the waist and a light on it — 0194's livery, painted rather than tabled.
      // Inside the band between the two zags, which `tests/accents.test.ts` measures in pixels.
      disc(ctx, fg, palette.glass, -0.06, -0.05, 0.16);
      disc(ctx, fg, shade(palette.glass, 0.5), -0.1, -0.09, 0.1);
      return;
    }
    case 'stackTwo':
      paintStack(ctx, f, 2);
      return;
    case 'stackThree':
      paintStack(ctx, f, 3);
      return;
    case 'stackFour':
      paintStack(ctx, f, 4);
      return;
    case 'arcNode': {
      /*
        WHERE A BOLT LANDS — a bright dot in the impact ink with a glow round it. The bolt itself is
        stroked between two of these by `src/render/scene.ts`; this is the bitmap at each end, so a
        chain reads as *hits* rather than as a line.

        ⚠️ **A DOT, NOT A SPARK, SINCE 0239.** 0233 drew a four-pointed star here; played, the ask
        was *"bright white dots at the centre points of the joins to really lift it"*, and the joins
        are exactly where this is blitted. A round point of light with its glow is what a join in
        lightning looks like; the points came from the star, not the light.
      */
      ring(ctx, f, 0, 0, 0.5);
      seal(ctx);
      glow(ctx, f, palette.impact, 0, 0, 1, 0.85);
      return;
    }
    case 'pickupSeeker': {
      /*
        THE MISSILE PICKUP'S OTHER FACE — a reticle, since 0239. 0235 drew it as the missile's
        chevron with a hole through its heart, and the third play-test refused it: *"the missile
        pickups need to be different colours and have a much different appearance, they look
        incredibly similar at the moment."* A round target — a disc with a dark ring in it, four
        ticks across the ring and a dot at the centre — shares nothing with a chevron at pickup
        size, and a reticle is what *homing* looks like before anybody is taught it. In the ally
        ink (`INK_OF`), which nothing else in the lane wears.

        Glyph at three quarters of the box and a bubble round it, on the missile face's terms — 0236.
      */
      const fg: Frame = { half, r: r * PICKUP_GLYPH };
      ring(ctx, fg, 0, 0, 1);
      seal(ctx);
      bubble(ctx, f, palette);
      const dark = shade(palette.ally, -0.45);
      band(ctx, fg, dark, 0, 0, 0.72, 0.5);
      disc(ctx, fg, dark, 0, 0, 0.17);
      // The four ticks, across the ring, in the lit shade — wide enough to be drawn at the shipped
      // camera (`tests/accents.test.ts`).
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        poly(ctx, fg, shade(palette.ally, 0.35), [
          [c * 0.4 - s * 0.09, s * 0.4 + c * 0.09],
          [c * 0.9 - s * 0.09, s * 0.9 + c * 0.09],
          [c * 0.9 + s * 0.09, s * 0.9 - c * 0.09],
          [c * 0.4 + s * 0.09, s * 0.4 - c * 0.09],
        ]);
      }
      return;
    }
    case 'seeker':
      /*
        THE HOMING MISSILE — 0235: a dart with swept-back fins and an eye at the nose. Off the
        straight missile by the fins (swept where the missile's tail is notched) and by the eye,
        which is a mark the missile does not carry.

        ⚠️ **AND IN THE SHIP'S INK, WITH A GLOW, A SIZE UP — 0238.** Played: *"need more visual
        distinction between actual missile types."* The fins and the eye were the whole difference
        at 3.4 units and they did not read. Now the dart is the ship's colour (`INK_OF`), drawn at
        `BLADE_GLYPH` of a box a size up, with a soft glow in the same ink filling the rest of the
        box behind it — three channels the straight missile has none of.
      */
      const fg: Frame = { half, r: r * BLADE_GLYPH };
      const g = fg.r;
      ctx.moveTo(half + g, half);
      ctx.lineTo(half - g * 0.2, half - g * 0.42);
      ctx.lineTo(half - g * 0.62, half - g * 0.3);
      ctx.lineTo(half - g, half - g * 0.72);
      ctx.lineTo(half - g * 0.7, half);
      ctx.lineTo(half - g, half + g * 0.72);
      ctx.lineTo(half - g * 0.62, half + g * 0.3);
      ctx.lineTo(half - g * 0.2, half + g * 0.42);
      ctx.closePath();
      seal(ctx);
      ctx.globalCompositeOperation = 'destination-over';
      glow(ctx, f, palette.ally, 0, 0, 1, 0.5);
      ctx.globalCompositeOperation = 'source-over';
      poly(ctx, fg, shade(palette.ally, -0.32), [
        [0.8, 0.04],
        [-0.22, 0.4],
        [-0.62, 0.28],
        [-0.66, 0.04],
      ]);
      // Back from the nose, where the dart is deep enough to hold an eye this size.
      disc(ctx, fg, palette.glass, 0.3, 0, 0.2);
      disc(ctx, fg, shade(palette.glass, 0.6), 0.34, -0.03, 0.12);
      return;
    case 'pickupMissile': {
      /*
        THE WEAPON'S CHEVRON, TURNED A QUARTER TURN TO POINT UP THE SCREEN.

        ⚠️ **A family rather than a second glyph to learn** — 0083. The two upgrade pickups are the
        same kind of object (a four-tier ladder over one of the ship's two auto-weapons), so they read
        as one thing in two orientations. The chevron points along the lane and this points across it,
        which is also the direction a wing tube sits.

        ⚠️ **Rotation is a weak cue for an ENEMY and a strong one here**, which is worth stating
        because `reports/enemy-silhouettes-2026-08-05.md` cost this project an art pass for ignoring
        it. That finding was about concavity and point count failing at fifteen pixels; a chevron is
        the most strongly asymmetric shape in the atlas and 40px of it is unambiguous. And it is not
        rotation alone: 5.5 units against the weapon's 6.
      */
      const fg: Frame = { half, r: r * PICKUP_GLYPH };
      const g = fg.r;
      ctx.moveTo(half, half - g);
      ctx.lineTo(half + g * 0.85, half + g * 0.2);
      ctx.lineTo(half + g * 0.85, half + g);
      ctx.lineTo(half, half + g * 0.25);
      ctx.lineTo(half - g * 0.85, half + g);
      ctx.lineTo(half - g * 0.85, half + g * 0.2);
      ctx.closePath();
      seal(ctx);
      bubble(ctx, f, palette);
      // The trailing arm in shadow — the same underside the weapon chevron has, turned with it, and
      // in the missile's own orange since 0240.
      poly(ctx, fg, shade(palette.bullet, -0.28), [
        [-0.1, -0.72],
        [-0.7, 0.16],
        [-0.7, 0.72],
        [-0.1, 0.14],
      ]);
      poly(ctx, fg, palette.trim, [
        [-0.09, -0.5],
        [0.09, -0.5],
        [0.09, 0.05],
        [-0.09, 0.05],
      ]);
      disc(ctx, fg, palette.glass, 0, -0.28, 0.17);
      disc(ctx, fg, shade(palette.glass, 0.5), -0.04, -0.32, 0.1);
      return;
    }
    case 'missile':
      /*
        A dart: a long point forward, a notched tail. The notch is what keeps it from reading as a
        triangle at twenty pixels — the same lesson the lancer's silhouette cost.

        Painted as a missile now: a lit warhead, an underside in shadow, and a plume out of the notch.
        At 3.4 units it is the smallest thing in the game to carry a mark, so the marks are three, and
        each is a quarter of the hull wide.
      */
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.4, half - r * 0.55);
      ctx.lineTo(half - r, half - r * 0.2);
      ctx.lineTo(half - r * 0.75, half);
      ctx.lineTo(half - r, half + r * 0.2);
      ctx.lineTo(half - r * 0.4, half + r * 0.55);
      ctx.closePath();
      seal(ctx);
      poly(ctx, f, palette.hazard, [
        [-0.78, -0.02],
        [-1.16, -0.16],
        [-1.16, 0.16],
        [-0.78, 0.02],
      ], 0.6);
      poly(ctx, f, shade(palette.bullet, -0.32), [
        [0.82, 0.03],
        [-0.38, 0.48],
        [-0.9, 0.17],
        [-0.72, 0.03],
      ]);
      poly(ctx, f, shade(palette.bullet, 0.6), [
        [0.94, 0],
        [0.45, -0.2],
        [0.45, 0.2],
      ]);
      return;
    /*
      ⚠️ **ONE DRAWING, TWO KINDS, AND IT IS THE ONLY SHARED SILHOUETTE OUTSIDE THE PYRE'S RUNGS.**
      `bomb` is what leaves the ship; `pickupBomb` is what is lying in the lane waiting to be
      collected (0082). They are baked at different extents and in different inks — the family map
      above is what separates them — and sharing the path is the point rather than a saving: a player
      learns the notched disc from the trigger strip long before they find one, so *the thing on the
      ground is the thing on the button* costs no teaching at all.
    */
    case 'pickupBomb':
    case 'bomb': {
      /*
        A disc with a spike at the TOP — a bomb with a fuse. The spike is what stops it reading as a
        large pulse at twenty pixels: the lesson the lancer's silhouette cost, applied to the player's
        own side of the screen.

        ⚠️ **A quarter turn from where it was, and it moves the THROWN bomb as well as the pickup.**
        The spike used to trail at -x, which is a fin on a projectile and reads as nothing at all on
        an object holding station in a lane. Turning only the pickup would have split the one drawing
        these two kinds share, and that sharing is deliberate — a player learns the shape from the
        trigger strip before they ever find one, so *the thing on the ground is the thing on the
        button* costs no teaching. A fuse reads on both; a fin read on neither.

        ⚠️ **THE FUSE IS THREE TIMES THE STUB IT WAS, AND A SCREENSHOT IS WHY.** The rotation alone put
        a 0.22r nub on top of a 0.78r disc, which at the title key's sixteen pixels is under two pixels
        and simply is not there — the icon read as a plain green dot beside three shapes that read
        fine. Turning the shape achieved nothing a player could see, which is
        `docs/decisions/0027-measure-the-picture-not-the-model.md` exactly: the model had rotated and
        the picture had not. The disc is now 0.6r and the spike reaches r over a narrower base, so it
        is a fuse rather than a bump.
      */
      // The bubble on the one lying in the lane, and not on the one just thrown — 0236. The thrown
      // bomb keeps the whole frame; the pickup draws the same bomb in the smaller one.
      const fg: Frame = kind === 'pickupBomb' ? { half, r: r * PICKUP_GLYPH } : f;
      const g = fg.r;
      ctx.arc(half, half, g * 0.6, Math.PI * 1.35, Math.PI * 1.65, true);
      ctx.lineTo(half, half - g);
      ctx.closePath();
      seal(ctx);
      if (kind === 'pickupBomb') bubble(ctx, f, palette);
      const casing = palette[INK_OF[kind]];
      // The casing's underside in shadow, then the lit core 0194 gave it, then the fuse burning.
      disc(ctx, fg, shade(casing, -0.3), 0.08, 0.16, 0.42);
      disc(ctx, fg, palette.glass, 0, 0.06, 0.3);
      disc(ctx, fg, palette.flame, 0, 0.06, 0.14);
      glow(ctx, fg, palette.hazard, 0, -0.9, 0.24, 0.8);
      return;
    }
    // The pyre's rungs are the SAME drawing at a different extent — 0079. Four bitmaps, one shape.
    case 'blastHalf':
    case 'blastWide':
    case 'blastWidest':
    case 'blast': {
      /*
        A ring: a wide circle with most of its middle taken out, so it reads as a shockwave rather
        than as a solid disc the player cannot see through. The hole is what keeps the ship and the
        enemies inside it visible while it is on screen — a filled blast at this size would hide the
        thing the player is trying to fly away from.

        ⚠️ **THE ONLY SPRITE DRAWN TO THE EDGE OF ITS OWN BOX, and the picture caught it.** Everything
        else here is drawn at `r`, which is 42% of the extent — a margin that keeps a silhouette off
        its neighbours. A blast's extent IS its damage diameter (`src/content/shots.ts`), so that
        margin made the ring a fifth smaller than the thing it was drawing: the player watched a
        shockwave miss something it had already killed. `scripts/shot.mjs` is what said so, and no
        assertion in the suite could have — both numbers were correct.
      */
      // Half the stroke, because a stroke is centred on its path: the INK then ends exactly on the
      // extent, which is the radius the damage uses.
      const edge = half - ctx.lineWidth / 2;
      ctx.arc(half, half, edge, 0, Math.PI * 2);
      ctx.moveTo(half + edge * 0.74, half);
      ctx.arc(half, half, edge * 0.74, 0, Math.PI * 2);
      seal(ctx);
      // A hot inner rim, translucent, inside the hole — the shockwave has a front and a wake.
      const inner = edge / r;
      band(ctx, f, shade(palette.hazard, 0.45), 0, 0, inner * 0.74, inner * 0.64, 0.4);
      return;
    }
    case 'pickupShield': {
      /*
        A heraldic shield: flat across the top, straight down the sides, tapering to a point at the
        BOTTOM.

        ⚠️ **A quarter turn from where it was, and the old orientation was the mistake.** It used to
        point +x *"like everything else, so the taper is the nose — which also means it reads the same
        way up in both orientations without a second bake."* Both halves of that were wrong for this
        one shape: a pickup is not a body that flies, so it has no nose; and
        `docs/decisions/0031-landscape-is-the-shipped-orientation.md` dropped portrait, so the second
        bake it was avoiding does not exist. What it cost was the one pickup whose meaning a player
        already owns — a shield lying on its side is a pennant, which is what the picture showed.

        ⚠️ **This is the only sprite in the atlas deliberately NOT drawn along +x.** Everything else
        here is a body with a heading; if portrait ever returns, `bakeOne`'s `top` rotation will turn
        this one the wrong way and it will need its own arm.
      */
      const fg: Frame = { half, r: r * PICKUP_GLYPH };
      const g = fg.r;
      ctx.moveTo(half + g * 0.85, half - g);
      ctx.lineTo(half + g * 0.85, half + g * 0.25);
      ctx.lineTo(half, half + g);
      ctx.lineTo(half - g * 0.85, half + g * 0.25);
      ctx.lineTo(half - g * 0.85, half - g);
      ctx.closePath();
      seal(ctx);
      bubble(ctx, f, palette);
      // The right half in shadow, so the face is curved; a band across it and a boss at its centre.
      poly(ctx, fg, shade(palette.pickup, -0.28), [
        [0.04, -0.9],
        [0.75, -0.9],
        [0.75, 0.2],
        [0.04, 0.88],
      ]);
      poly(ctx, fg, palette.trim, [
        [-0.5, -0.34],
        [0.5, -0.34],
        [0.5, -0.155],
        [-0.5, -0.155],
      ]);
      disc(ctx, fg, palette.glass, 0, 0.1, 0.22);
      disc(ctx, fg, shade(palette.glass, 0.5), -0.06, 0.04, 0.11);
      return;
    }
    case 'shieldOrb':
      /*
        A ring. Two circles wound the same way and filled `evenodd`, which is how the hole survives
        being two pixels across. Lit from inside now, so the shell reads as three beads rather than
        three hoops.
      */
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.45, half);
      ctx.arc(half, half, r * 0.45, 0, Math.PI * 2);
      seal(ctx);
      glow(ctx, f, palette.player, 0, 0, 0.5, 0.7);
      return;
    /*
      ── THE SKY, AND IT IS THE ONE DRAWING THAT RETURNS EARLY ───────────────────────────────────────

      Every other kind here is one path, filled and stroked once, by the two lines at the bottom of
      this function. A field of stars is dozens of separate discs with no outline at all — a stroke in
      the space colour around each one is what a `1px` dot would be made ENTIRELY of — so it draws
      itself and leaves.

      ⚠️ **The placement is a SEEDED draw**, per `docs/decisions/0021-one-stream-per-concern.md`: its
      own named stream, so a star's position can never move a wave by one enemy, and the same sky is
      baked on every machine and after every rotation.

      ⚠️ **Stars stay clear of the tile's edges**, because the tile repeats along the scroll axis and
      a disc crossing a seam would be sliced in half at the join. A margin is the cheap answer; the
      expensive one is wrapping every dot, and nothing about a starfield is worth that.
    */
    case 'skyFar':
    case 'skyNear':
    case 'skyRush':
      drawSky(ctx, kind, size, theme);
      return;
    case 'landmark':
      /*
        ⚠️ **Baked in the palette's own sky ink, and a level replaces it** — exactly as `skyNebula`
        is, and for the same reason. A palette is per STYLE and knows nothing about a place, so this
        is what a landmark looks like before any level has said otherwise; `bakeLandmark` writes the
        place's own gas colour over it at the boundary. Ember Nebula's ember against the generic
        blue-grey is the whole difference between dust in light and cold rock, and the shot rig is
        what showed it.
      */
      drawLandmark(ctx, palette.sky, palette.sky, palette.space, size, theme, 0);
      return;
    // The other two castings — 0225. Same drawing, different seed, and the seed is the slot's index.
    case 'landmarkB':
      drawLandmark(ctx, palette.sky, palette.sky, palette.space, size, theme, 1);
      return;
    case 'landmarkC':
      drawLandmark(ctx, palette.sky, palette.sky, palette.space, size, theme, 2);
      return;
    case 'skyNebula':
      /*
        ⚠️ **Baked in the palette's own sky ink, and a level replaces it** — 0112. `bakeNebula` writes
        the theme's colour over this bitmap at a level boundary; what is here is what the weather looks
        like on the title screen and on any level that has not said otherwise, so the layer is never
        missing and never a hole in the atlas.
      */
      drawNebula(ctx, palette.sky, palette.sky, palette.space, size, theme);
      return;
    case 'skyGround':
      /*
        ⚠️ **The title screen has no ground, and neither does any place in space** — 0221. A place
        with land replaces this bitmap at the level boundary through `bakeGround`, in the theme's own
        `ground` and `space`; a place without land never blits it at all, because `SKY` is chosen per
        place. Drawn here in the palette's own space colour so that the placeholder is invisible
        rather than a grey slab, on `skyNebula`'s own terms one case up.
      */
      drawGround(ctx, palette.space, palette.space, palette.sky, size, theme);
      return;
    /*
      ── THE EDGE OF THE PLAYER'S BOX ────────────────────────────────────────────────────────────

      One dash of a dashed line, tiled down the lane by `src/render/scene.ts` —
      `docs/decisions/0074-the-box-is-drawn.md`. It returns early for the same reason the sky does:
      it is a filled rectangle with no outline, and the stroke at the bottom of this function would
      put a ring of the space colour around a mark one pixel wide.

      ⚠️ **The alpha is BAKED, never applied per blit.** 0025 counts state changes in the frame loop,
      and 0036 refused to grow the painter a verb that hides work — so *faint* is a property of the
      bitmap, exactly as `SKY_ALPHA` makes the near starfield dim.

      ⚠️ **Faint enough to be scenery and solid enough to be seen, which is the whole tuning.** It
      marks a rule the player meets a few times a run; a bright line across the playfield would
      compete with the bullets it exists to help them dodge, and `docs/game.md`'s voice rule about not
      over-explaining applies to pictures too.
    */
    case 'bound': {
      const dash = size * BOUND_DASH;
      ctx.globalAlpha = BOUND_ALPHA;
      // Centred in the tile on both axes, so the tiling period is the gap plus the mark.
      ctx.fillRect(half - size * BOUND_WIDTH, half - dash / 2, size * BOUND_WIDTH * 2, dash);
      return;
    }
    default: {
      const never: never = kind;
      throw new Error(`unbaked sprite kind: ${String(never)}`);
    }
  }
  /*
    ⚠️ **THE ARMS THAT `break` ARE THE ONES STILL WAITING TO BE PAINTED** — the eight enemies and the
    three enemy bullets, which `docs/decisions/0228-an-enemy-wears-its-place.md` redraws per place.
    They are a silhouette in one ink with the outline round it, exactly as every sprite was before
    0227, and they arrive here to be sealed.
  */
  seal(ctx);
}

/** One star, in tile pixels: where it goes, how big it is, and how far it is smeared. */
export interface SkyStar {
  x: number;
  y: number;
  /** Radius, in pixels of a tile `size` across. For a streak this is the half-thickness. */
  r: number;
  /**
   * How far the mark is drawn along the tile's `+x`, in the same pixels. `0` is a dot.
   *
   * ⚠️ **One field rather than two shapes, so the guard can measure both kinds in one loop** —
   * `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`. A separate streak type
   * would mean `tests/budget.test.ts` walking two lists and, on the day a third form arrives, three.
   */
  len: number;
  /**
   * Which way the mark lies, in radians, where `0` is along the tile's `+x`.
   *
   * ⚠️ **THE THIRD FORM 0097 SAID WOULD COST A THIRD LIST, AND IT DOES NOT** —
   * `docs/decisions/0195-a-place-has-its-own-sky.md`. A dot is `len: 0` and ignores this; a streak
   * lies along `+x` at `0` exactly as it always has; a **shard** is the same streak turned. So the
   * one loop `tests/budget.test.ts` walks still measures every mark in the sky, and the property it
   * measures — how big a mark is — is unchanged by which way the mark points.
   */
  angle: number;
  /**
   * How much of its layer's alpha this mark gets, 0 to 1 — 0196.
   *
   * ⚠️ **A REDUCTION AND NEVER A LIFT**, so the layer alpha stays the ceiling every guard is written
   * against. What it buys is depth: a field where every mark is the same brightness is a texture.
   */
  dim: number;
}

/** Every layer the sky is made of, and the only kinds `skyField` will answer for. */
export type SkyKind = 'skyFar' | 'skyNear' | 'skyRush';

/**
 * The field a sky tile is made of — WHAT will be drawn, before anything draws it.
 *
 * ⚠️ **Split out from the drawing so the picture can be measured without a canvas**, which is the
 * only way `tests/budget.test.ts` can hold what a star actually IS rather than what a constant says.
 * `docs/decisions/0069-the-sky-is-behind-the-game.md`: a ceiling asserted against the constant it
 * was derived from proves that the code agrees with itself, and 0027 says a probe cannot see that.
 * A test that reads the radii off the field is looking at the drawing.
 *
 * ⚠️ **`bake.ts` is on `tests/budget.test.ts`'s DELIBERATELY COLD list** — it runs at load and on
 * rotation and may allocate freely. This is the only place in the project where a per-star loop, and
 * an array of them, is affordable; it is exactly why the sky is baked rather than drawn.
 */
/**
 * What one place's sky is made of.
 *
 * `docs/decisions/0195-a-place-has-its-own-sky.md`.
 *
 * ⚠️ **ASKED FOR:** *"a level specific backdrop instead of the same starry canvas and a slight hue
 * change on each level."* The complaint was exactly right and it was a description of the code:
 * `makeRng('sky')` took **no theme**, so every level in the game had **the same stars in the same
 * places**, and `THEMES` changed two hex values over the top of them.
 *
 * ⚠️ **A MULTIPLIER ON THE SHARED FIELD RATHER THAN A SECOND ONE**, which is
 * `docs/decisions/0128-a-place-plays-its-own-material.md`'s shape one channel over: the ceilings that
 * make a sky safe to look at — `docs/decisions/0069-the-sky-is-behind-the-game.md`'s bullet bound and
 * `docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`'s floor — are properties of the
 * BASE numbers, so a place that scales them is still measured against both. **Every guard over the
 * sky now runs seven times.**
 */
export interface SkyStyle {
  /** How many marks, against the shared count. */
  readonly density: number;
  /**
   * How big the biggest mark is, against the shared ceiling — **at most 1**, and clamped rather than
   * trusted.
   *
   * ⚠️ **A PLACE MAY THIN ITS SKY AND MAY NEVER THICKEN IT, AND A GUARD FOUND THAT OUT.**
   * `docs/decisions/0069-the-sky-is-behind-the-game.md` bounds a sky mark against the smallest thing
   * that can kill the player, and the bound is on `SKY_MAX_STAR_UNITS`. A first draft let a place
   * scale it past 1 for tumbling rock; `tests/budget.test.ts` measured `skyNear` at **0.36 units — 40%
   * of a bullet** — and reddened. **So the ceiling stays a property of the shared numbers**, which is
   * what makes *every guard over the sky now runs seven times* a true sentence rather than a hope.
   *
   * ⚠️ **AND THE AXES A PLACE ACTUALLY DIFFERS ON ARE THE OTHER FOUR.** Density, tilt, length and
   * cloud are all free of that bound, because none of them makes a mark more like a bullet.
   */
  readonly size: number;
  /** How far a mark lies over, in radians. `0` is the shared horizontal streak. */
  readonly tilt: number;
  /** How much of the mark's length survives — `0` turns every streak into a dot. */
  readonly length: number;
  /**
   * How much the marks CLUMP, 0 (evenly scattered) to 1 (in knots).
   *
   * ⚠️ **THE ONE AXIS WITH REAL CHARACTER AND NO PRICE** — 0196. A field of evenly-scattered dots and
   * a field of the same dots in drifts read as two different places, and clustering is a statement
   * about POSITION: it adds no ink, touches no alpha, and cannot move a single contrast ratio. Every
   * other way of making a backdrop richer spends the budget `tests/themes.test.ts` guards.
   */
  readonly clump: number;
  /**
   * How much a mark may be dimmed against its layer's own alpha, 0 (all equal) to 1 (down to nothing).
   *
   * ⚠️ **DOWNWARD ONLY, WHICH IS WHAT MAKES IT FREE.** A field where every mark is the same brightness
   * is a texture; one where they vary has depth. Varying UP would push a star toward the ink
   * `src/content/palette.ts` holds below every meaningful colour, so the range is a reduction and the
   * layer alpha stays the ceiling.
   */
  readonly dim: number;
  /**
   * How far a cloud's soft focus sits from its centre, as a fraction of its radius.
   *
   * ⚠️ **AN OFFSET GRADIENT FOCUS, WHICH IS THE ONLY ASYMMETRIC EDGELESS SHAPE `Pen` CAN DRAW.**
   * `createRadialGradient` takes two circles; moving the inner one off-centre gives a cloud that piles
   * up on one side and trails off the other — weather with a direction — while every pixel of it is
   * still a gradient to transparent, which is the whole of what
   * `docs/decisions/0112-the-sky-has-weather.md` permits something bigger than a bullet to be.
   *
   * ⚠️ **AND IT COSTS NO ALPHA.** The peak is unchanged; where the peak SITS moves.
   */
  readonly drift: number;
  /** How many nebula clouds, against the shared seven. */
  readonly clouds: number;
  /** How big they are, and how strongly they read. */
  readonly cloudSize: number;
  readonly cloudAlpha: number;
}

/**
 * The seven, and every row is an idea about what the place is made of rather than a tint.
 *
 * ⚠️ **NAMED FOR WHAT THE PLAYER IS FLYING THROUGH**, because that is the only thing that makes this
 * different from a hue: The Approach is open space and keeps the shared field exactly; Ember Nebula is
 * cloud and little else; Saurian Belt is tumbling rock; The Coil Labyrinth is long structure streaking
 * past; Rime Shelf is a field of tilted ice shards; The Toxic Mire is dense fine motes; The Black
 * Heart is nearly empty, because nothing survives near it.
 */
export const SKY_STYLE_OF: Record<ThemeKind, SkyStyle> = {
  // Open space, evenly scattered, weather with no direction to it. The one every other place deviates from.
  approach: { density: 1, size: 1, tilt: 0, length: 1, clump: 0, dim: 0.15, drift: 0, clouds: 1, cloudSize: 1, cloudAlpha: 1 },
  // Cloud and little else, piled up and lit from one side.
  nebula: { density: 0.5, size: 0.95, tilt: 0, length: 0.65, clump: 0.35, dim: 0.5, drift: 0.55, clouds: 2, cloudSize: 1.4, cloudAlpha: 1.7 },
  // Tumbling rock: knots of debris with clear lanes between them.
  saurian: { density: 0.75, size: 1, tilt: 0.45, length: 0.3, clump: 0.8, dim: 0.55, drift: 0.35, clouds: 0.7, cloudSize: 0.95, cloudAlpha: 0.9 },
  // Long structure going past. Almost nothing clumps in a corridor.
  labyrinth: { density: 0.55, size: 0.8, tilt: 0, length: 2.1, clump: 0.1, dim: 0.65, drift: 0.2, clouds: 0.35, cloudSize: 0.65, cloudAlpha: 0.6 },
  // A shelf of ice: shards in drifts, all lying the same way, and very little variation in them.
  rime: { density: 1.2, size: 1, tilt: -0.85, length: 0.55, clump: 0.6, dim: 0.2, drift: 0.15, clouds: 0.6, cloudSize: 1.1, cloudAlpha: 0.75 },
  // Dense fine motes, evenly suspended, in thick banks of haze.
  mire: { density: 1.7, size: 0.55, tilt: 0.2, length: 0.2, clump: 0.25, dim: 0.7, drift: 0.7, clouds: 1.5, cloudSize: 0.8, cloudAlpha: 1.35 },
  // Nearly empty, and what is left is being drawn one way.
  core: { density: 0.3, size: 0.85, tilt: 0, length: 1.5, clump: 0.45, dim: 0.4, drift: 0.85, clouds: 0.5, cloudSize: 1.6, cloudAlpha: 1.15 },
};

export function skyField(
  kind: SkyKind,
  size: number,
  theme: ThemeKind = 'approach',
): { alpha: number; stars: SkyStar[] } {
  return fieldOf(kind, size, theme, SKY_STYLE_OF[theme]);
}

/**
 * The field a place would draw IF it had the given style — the same arithmetic, with the row handed in.
 *
 * ⚠️ **IT EXISTS SO A GUARD CAN HOLD THE STYLE EQUAL AND ASK WHETHER THE PLACE STILL MATTERS**, which
 * is the only way to test that the stream is keyed by the place. `npm run prove` found that out:
 * 0195's own probe — *the stream keyed by the layer alone* — went **STILL GREEN** the moment
 * `docs/decisions/0196-the-backdrop-is-rounded-out.md` added `clump`, because two places with
 * different clumping put their marks in different spots whether or not they share a generator. **A
 * guard that compares output can always be satisfied by a style difference.** With the style pinned,
 * the only thing left that can move a mark is the seed.
 *
 * ⚠️ **NOT A SECOND IMPLEMENTATION** — `skyField` is one line on top of it, which is what keeps this
 * from being `docs/decisions/0029-the-tracked-record-is-the-record.md` happening in arithmetic.
 */
export function fieldOf(
  kind: SkyKind,
  size: number,
  theme: ThemeKind,
  style: SkyStyle,
): { alpha: number; stars: SkyStar[] } {
  /*
    ⚠️ **THE STREAM IS KEYED BY THE PLACE, AND THAT ONE STRING IS MOST OF THIS DECISION.** Without it
    every level in the game drew the same stars in the same places —
    `docs/decisions/0021-one-stream-per-concern.md` gives each concern its own generator, and *the
    sky* was one concern where it is seven. Everything else here is a number; this is the part that
    makes the field a different field.
  */
  // @setup: one generator per bake, and its own stream so a star cannot move a spawn.
  const rng = makeRng('sky').stream(`${theme}/${kind}`);
  const margin = size * 0.06;
  const span = size - margin * 2;
  /*
    ⚠️ **World units converted to tile pixels HERE, and the constant stays a world quantity.** The
    tile is `SPRITE_EXTENT[kind]` units across, so `size / extent` is its pixels per unit — and
    `SKY_MAX_STAR_UNITS` can then be read against `SHOTS.pulse.radius` by a person and by a test.
  */
  const perUnit = size / SPRITE_EXTENT[kind];
  const biggest = perUnit * SKY_MAX_STAR_UNITS[kind] * Math.min(1, style.size);
  /*
    ⚠️ **Only the fastest layer is smeared, and the length is a WORLD quantity like the thickness
    is** — 0097. A streak measured as a fraction of the tile would mean something different the day
    `ACROSS_SPAN` moved, and what it has to stay in proportion to is the lane the player flies in.
  */
  const streak = kind === 'skyRush';
  const stars: SkyStar[] = [];
  const count = Math.max(1, Math.round(SKY_STARS[kind] * style.density));
  /*
    ── THE KNOTS A CLUMPED FIELD IS DRAWN AROUND — 0196 ──────────────────────────────────────────

    ⚠️ **DRAWN FIRST, FROM THE SAME STREAM, SO A PLACE'S FIELD IS STILL ONE DETERMINISTIC ANSWER.** A
    mark lands somewhere between where it would have gone and its knot; `clump` is how far along that
    line, and at `0` the knot is ignored and the field is an even scatter.

    ⚠️ **AND THAT IS NOT THE SAME AS *UNCHANGED*, WHICH A FIRST DRAFT OF THIS PARAGRAPH CLAIMED.**
    Drawing the knots consumes fourteen values before the first mark, and each mark now draws its own
    `dim` — so **every place's positions moved**, The Approach included. Nothing guards position
    stability across versions and nothing should; what would have been wrong is the comment, which is
    the failure `reports/two-weeks-on-one-channel-2026-08-25.md` names about reasoning that migrates
    into source headers and drifts there.

    ⚠️ **SEVEN KNOTS RATHER THAN A NUMBER PER PLACE**, because a count is a second axis nobody asked
    for: what a player reads is *clumped or not*, and the pattern of the knots is the seed's business.
  */
  const KNOTS = 7;
  const knots: { x: number; y: number }[] = [];
  for (let k = 0; k < KNOTS; k++) knots.push({ x: rng.range(0, span), y: rng.range(0, span) });
  for (let i = 0; i < count; i++) {
    const len = streak ? perUnit * rng.range(SKY_STREAK_UNITS.from, SKY_STREAK_UNITS.to) * style.length : 0;
    /*
      ⚠️ **A streak's whole LENGTH is inside the margin, not just its start.** The margin exists so
      nothing is cut by a tile seam (0065); a mark with extent has to fit, and one that ran off the
      right edge would be a hard-cut line arriving at the same place every three seconds at the
      fastest depth in the game. It costs at most thirteen units of the eighty-eight a start may
      land in.
    */
    /*
      ⚠️ **THE MARGIN IS TAKEN AGAINST THE MARK'S OWN REACH, WHICH A TILT CHANGES.** A horizontal
      streak reaches `len` along `+x` and nothing in `y`; a tilted one reaches `len·cos` and
      `len·sin`. Fitting it inside the seam margin is the same claim 0065 has always made here, asked
      of both axes instead of one — and a tilt that pushed a mark over a tile edge would put a hard-cut
      line at the same place every few seconds, which is the thing the margin exists to prevent.
    */
    const reachX = Math.abs(Math.cos(style.tilt)) * len;
    const reachY = Math.abs(Math.sin(style.tilt)) * len;
    const spanX = Math.max(0, span - reachX);
    const spanY = Math.max(0, span - reachY);
    let x = rng.range(0, spanX);
    let y = rng.range(0, spanY);
    if (style.clump > 0) {
      const knot = knots[Math.floor(rng.range(0, KNOTS)) % KNOTS];
      if (knot !== undefined) {
        /*
          ⚠️ **PULLED TOWARDS THE KNOT AND THEN CLAMPED BACK INSIDE THE MARGIN**, because a knot near an
          edge would otherwise drag marks over the tile seam — the hard-cut line 0065's margin exists
          to prevent, arriving on a schedule at the fastest depth in the game.
        */
        x = Math.max(0, Math.min(spanX, x + (knot.x - x) * style.clump));
        y = Math.max(0, Math.min(spanY, y + (knot.y - y) * style.clump));
      }
    }
    stars.push({
      x: margin + x,
      y: margin + y,
      r: biggest * rng.range(0.5, 1),
      len,
      angle: style.tilt,
      dim: 1 - rng.range(0, Math.max(0, Math.min(1, style.dim))),
    });
  }
  return { alpha: SKY_ALPHA[kind], stars };
}

/**
 * How many clouds a nebula tile carries.
 *
 * ── THE SKY MAY DRAW SOMETHING BIGGER THAN A BULLET ONLY IF IT HAS NO EDGE ──────────────────────
 *
 * ⚠️ **`docs/decisions/0112-the-sky-has-weather.md`, and it AMENDS
 * `docs/decisions/0069-the-sky-is-behind-the-game.md` rather than stepping around it.** That rule —
 * *nothing the sky draws is as big as a bullet* — is enforced as a clearance from the world's own
 * rate, scaled by how much of a bullet a mark looks like. A cloud is enormous, so under the rule as
 * written it can never exist.
 *
 * ⚠️ **What makes a mark confusable with a threat is a HARD EDGE AT A BULLET'S SCALE, not area.** A
 * disc two units across with a boundary is a bullet; a gradient forty units across that never
 * resolves to a boundary is a place. 0069's measure was thickness because everything the sky drew was
 * a dot or a line, and thickness was the whole of what those could be wrong about.
 *
 * ⚠️ **SO A CLOUD IS BOUNDED FROM THE OTHER SIDE, WHICH IS WHAT KEEPS THIS A RULE AND NOT A HOLE.**
 * It must be **far larger** than any bullet and **fainter** than the faintest field of marks, and it
 * is drawn as a radial gradient to zero so there is no edge anywhere in it. `tests/budget.test.ts`
 * holds all three, so a cloud that shrank towards a bullet's size fails its own guard rather than
 * inheriting the mark layers' exemption.
 *
 * ⚠️ **Seven, and they overlap on purpose.** A field of separated discs is a pattern; overlapping
 * gradients at different sizes is what weather looks like.
 */
const NEBULA_CLOUDS = 7;

/**
 * The smallest and largest a cloud may be, as a radius in WORLD UNITS.
 *
 * ⚠️ **A world quantity for the same reason `SKY_MAX_STAR_UNITS` is one**: what it has to be measured
 * against is a BULLET, and `tests/budget.test.ts` reads it against `SHOTS` rather than against this.
 *
 * ⚠️ **The floor is what makes the amendment above safe.** Eighteen units is twenty times a pulse's
 * radius, which is not a size anything in this game is.
 */
const NEBULA_UNITS = { from: 18, to: 40 };

/**
 * How solid the centre of a cloud is drawn.
 *
 * ⚠️ **Under the faintest FIELD in the sky, which is `SKY_ALPHA.skyNear`**, so the layer nearest to
 * being invisible is still more present than the weather behind it. That ordering is what
 * `tests/budget.test.ts` holds, rather than either number.
 */
const NEBULA_ALPHA = { from: 0.1, to: 0.22 };

/** One cloud: where its centre is, how far it reaches, and how solid it is there. */
export interface NebulaCloud {
  x: number;
  y: number;
  r: number;
  alpha: number;
  /**
   * Where the cloud's soft focus sits, in the same pixels — 0196.
   *
   * ⚠️ **THE INNER CIRCLE OF THE GRADIENT, AND THE ONLY ASYMMETRY `Pen` CAN EXPRESS.** Offsetting it
   * gives weather that piles up on one side and trails off the other, with no edge anywhere in it,
   * which is the condition `docs/decisions/0112-the-sky-has-weather.md` puts on anything this size.
   * **The peak alpha does not move** — only where the peak is.
   */
  fx: number;
  fy: number;
  /**
   * Which of the place's two gas colours it is drawn in — `false` for the body, `true` for the glow.
   *
   * ⚠️ **A PLACE HAD EXACTLY ONE COLOUR UNTIL NOW, AND THAT IS WHY IT READ AS ONE** —
   * `docs/decisions/0223-a-place-has-a-palette.md`. Reported: *"the backgrounds are looking good, but
   * they're still a solo colour. saurian is green, nebula is purple. give me vibrant living levels,
   * not static basic backdrops."* Every cloud, every lit crest, every rim in a place came out of
   * `THEMES[theme].nebula` — a single hex — so a place could be denser or thinner but never
   * **varied**, and no amount of structure fixes that.
   *
   * ⚠️ **PER CLOUD RATHER THAN PER PLACE OR PER LAYER, WHICH IS THE ONLY VERSION THAT MIXES.** Two
   * colours split by layer gives two flat sheets; split by cloud they overlap, and where a warm cloud
   * crosses a cold one the gradient between them is a third colour neither table contains. That is
   * what a real nebula is, and it costs one boolean.
   */
  glow: boolean;
}

/**
 * The field a nebula tile is made of — WHAT will be drawn, before anything draws it.
 *
 * ⚠️ **Split out from the drawing for the reason `skyField`'s own comment gives**: it is the only way
 * a guard can hold what a cloud actually IS without a canvas, and a ceiling checked against the
 * constant it came from proves only that the code agrees with itself
 * (`docs/decisions/0027-measure-the-picture-not-the-model.md`).
 */
export function nebulaField(size: number, theme: ThemeKind = 'approach'): NebulaCloud[] {
  const style = SKY_STYLE_OF[theme];
  // @setup: one generator per bake, and its own stream so a cloud cannot move a star.
  const rng = makeRng('sky').stream(`${theme}/nebula`);
  const perUnit = size / SPRITE_EXTENT.skyNebula;
  const clouds: NebulaCloud[] = [];
  const clouds_ = Math.max(1, Math.round(NEBULA_CLOUDS * style.clouds));
  for (let i = 0; i < clouds_; i++) {
    /*
      ⚠️ **A cloud may hang off the tile's edge, and `drawNebula` WRAPS IT ROUND — 0206.**

      This used to say the cut was harmless: *"a gradient cut by [a seam] is already down at a
      fraction of its own alpha out there, and the tile repeats — so what the player sees is the same
      cloud continuing."* **The second half of that is false, and it is the seam the player reported.**
      Tiling repeats the SAME BITMAP: the part of a cloud hanging off the right edge is discarded, and
      what appears at the left edge of the next tile is that same tile's left edge, not the rest of
      the cloud. So a cloud whose centre is near an edge ends on a straight vertical cut, at whatever
      alpha it happened to have there — which for a centre just inside the edge is most of it.

      Positions stay marginless on purpose, because a margin would push every cloud towards the middle
      and band the sky. The fix is at the drawing end, where the cloud is also drawn at ±`size` so the
      half that leaves one edge arrives at the other.
    */
    const cx = rng.range(0, size);
    const cy = rng.range(0, size);
    const lean = rng.range(0, Math.PI * 2);
    const reach = Math.max(0, Math.min(0.9, style.drift));
    clouds.push({
      x: cx,
      y: cy,
      fx: cx + Math.cos(lean) * reach * perUnit * NEBULA_UNITS.from,
      fy: cy + Math.sin(lean) * reach * perUnit * NEBULA_UNITS.from,
      r: perUnit * rng.range(NEBULA_UNITS.from, NEBULA_UNITS.to) * style.cloudSize,
      /*
        ⚠️ **CLAMPED TO THE SHARED CEILING, for `size`'s own reason one section up.** 0112 lets the sky
        draw something bigger than a bullet ONLY because it has no edge and is faint; a place that
        scaled the alpha past that would be a wall of colour the game is played on, which
        `tests/themes.test.ts`'s *a backdrop is a dark* refuses one layer down.
      */
      alpha: Math.min(NEBULA_ALPHA.to, rng.range(NEBULA_ALPHA.from, NEBULA_ALPHA.to) * style.cloudAlpha),
      /*
        ⚠️ **A THIRD, AND NOT A HALF.** An even split makes two colours of equal weight, which reads as
        *this place cannot decide* rather than as a place with an accent — the body colour has to stay
        the one the place is recognised by.

        ⚠️ **AND WALKED RATHER THAN ROLLED, BECAUSE A ROLL CAN COME UP EMPTY.** `rng.range(0, 1) < 0.34`
        gave **Saurian Belt none at all** — it carries five clouds, and a third of five is a coin that
        can miss five times. A place whose accent never appears is a place with one colour, which is
        the report. Every third cloud takes it, so a field of two has one and a field of twenty has
        seven, and no place can be unlucky. `makeMotes` walks its index for the same reason.
      */
      glow: i % 3 === 1,
    });
  }
  return clouds;
}

/**
 * One tile of weather: overlapping radial gradients in the theme's own colour.
 *
 * ⚠️ **`createRadialGradient` and not a blurred disc**, because a gradient to transparent is the one
 * shape with no boundary anywhere in it — which is the property the amendment rests on. A
 * `filter: blur()` would be a boundary softened by an amount that varies with the bake resolution.
 */
/**
 * One dark mark in a place's weather — 0211.
 *
 * ⚠️ **THE THREE SEAM RULES ARE A FIELD NOW, NOT THREE ARGUMENTS IN THREE COMMENTS.** 0206 wraps a
 * cloud at ±size; 0207 additionally forces a dust lane to ARRIVE where it LEFT, because a lane spans
 * the tile; 0208 says a frond takes a cloud's rule *and only while it stays local*. Three places, three
 * prose arguments, and the fourth author would have had to rediscover which applied.
 *
 * `crosses` states it once. `paintStructure` obeys it, and `tests/sky.test.ts` holds it for every
 * place at once — so a new structure cannot get the wrong rule by not knowing there were two.
 */
export interface StructureMark {
  /** Points in tile pixels, in order. */
  points: number[][];
  /** Stroke width in pixels, or 0 to fill the closed shape instead. */
  width: number;
  /** How dark it sits over the gas. */
  alpha: number;
  /**
   * Whether it spans the tile and must therefore be PERIODIC — its last point's `y` equal to its
   * first's. A mark that crosses and is not periodic steps at every join, which is 0206's seam
   * wearing a new costume; a local mark that pretends to cross costs nothing but is a lie.
   */
  crosses: boolean;
  /** Narrow the stroke from the first point to the last, for anything that grows. */
  taper: boolean;
  /**
   * Draw in the place's GAS colour rather than in `space` — a lit thing rather than a silhouette.
   *
   * ⚠️ **DARK-OVER-LIGHT IS A CONTRAST RULE AND NOT A HOUSE STYLE, WHICH THIS IS THE PROOF OF.**
   * 0207 and 0208 both drew in `space` because `docs/decisions/0196-the-backdrop-is-rounded-out.md`
   * measured Ember Nebula and The Toxic Mire at about a third of the headroom the others have, and a
   * bright structure there would argue with the gameplay floor. The Approach has the most room of the
   * seven and the thinnest gas — so a silhouette has nothing to be a silhouette against, and its
   * horizon came out invisible in the bench before this field existed.
   *
   * A place may be lit only where the contrast guard says it can afford to be, which is the same
   * measurement making the opposite call rather than an exception to it.
   */
  lit: boolean;
}


/**
 * What a run of crossing lines is: how many, how much they wander, and how heavy they sit.
 *
 * ⚠️ **AN OBJECT RATHER THAN SEVEN POSITIONAL ARGUMENTS, WHICH IS WHAT ASKING FOR MORE DETAIL COST.**
 * The first version took `(size, stream, count, wander, from, to)` and every call site read as six
 * bare numbers. Ember Nebula now draws two runs — heavy lanes and fine filaments — that differ in
 * `alpha` and `steps` as well, and `crossing(size, 'nebula/filaments', 9, 0.08, 0.006, 0.02, 0.4, 14)`
 * is a line nobody can check by reading.
 */
interface Crossing {
  /** The RNG stream. Two runs that share one draw the same lines, which 0211's guard calls a defect. */
  stream: string;
  count: number;
  /** How far a step may wander from the last, as a fraction of the tile. */
  wander: number;
  /** The narrowest and the widest stroke, as fractions of the tile. */
  from: number;
  to: number;
  /** How dark it sits over the gas. Defaults to the weight the heavy lanes were written at. */
  alpha?: number;
  /** How many segments the line is drawn in — more segments is a finer, more restless wander. */
  steps?: number;
}

/**
 * A run of large tumbling bodies, well above the size anything in the game can be.
 *
 * `docs/decisions/0222-the-background-is-not-black.md`. Reported: *"all the space levels need more
 * 'depth' to them, like the music setting screen how we added the debris… a plain black background is
 * a plain boring game."*
 *
 * ⚠️ **THE BAND SAYS DEBRIS IS EITHER A SPECK OR A HULK, AND NOTHING IN BETWEEN.** 0203 forbids the
 * sky anything between a bullet (1.8 units) and twice the largest body (16) — a compact shape in there
 * is confusable with a threat. The music room's motes sit squarely in that gap, which is free there
 * because no game is running and is not available in one. So the mid-sized chunk that would be the
 * obvious answer is the one thing that cannot be drawn, and the depth has to come from the two ends:
 * **specks under 1.8, and hulks over 16.**
 *
 * ⚠️ **AND THE HULKS ARE WHAT MAKE THE FAR END OF THE BAND MEAN ANYTHING.** Until this, every place
 * satisfied 0203 by drawing nothing large at all — which is 0069's old one-sided ceiling wearing a
 * band's clothes, and *"a plain black background"* is the report that produces.
 *
 * ⚠️ **DARK, ALWAYS, WHICH IS WHY THEY ARE FREE.** A hulk is a hole in the light: it darkens the
 * ground the bright inks are read against, so it costs nothing against the accessibility floor and
 * `skyCover` does not count it. Twenty of these are cheaper than one lit crest.
 */
function hulks(
  size: number,
  spec: { stream: string; count: number; from: number; to: number; sides: number; rough: number; alpha: number },
): StructureMark[] {
  const rng = makeRng('sky').stream(spec.stream);
  const out: StructureMark[] = [];
  /*
    ⚠️ **THE SMALLEST ONE HAS TO CLEAR THE BAND, AND A RADIUS IS NOT A WIDTH.** The first set were
    authored as radii and the guard caught The Approach's at **15.6 units against a floor of 16** —
    because a hulk is squashed to 0.72 on one axis and every vertex is pulled in by up to `rough`, so
    its box is `2r(1 − rough)(0.72)` at worst rather than `2r`. That is three multiplications between
    the number in the table and the number a player sees, which is `docs/decisions/0027`'s subject in
    miniature. **`from` is raised until the worst case clears**, per place, because `rough` differs.
  */
  for (let i = 0; i < spec.count; i += 1) {
    const r = rng.range(spec.from, spec.to) * size;
    // Kept a radius clear of the tile edge: a hulk is a LOCAL mark, and 0208's wrap can only carry it
    // if it fits — a shape wider than half its own tile is a crossing structure in a local one's coat.
    const x = rng.range(r / size, 1 - r / size) * size;
    const y = rng.range(0.12, 0.88) * size;
    const lean = rng.range(0, Math.PI);
    const points: number[][] = [];
    for (let s = 0; s < spec.sides; s += 1) {
      const a = (s / spec.sides) * Math.PI * 2 + rng.range(-spec.rough, spec.rough);
      const rr = r * rng.range(1 - spec.rough, 1);
      // Leaned, so a place's hulks are not all the same object at the same angle.
      const dx = Math.cos(a) * rr;
      const dy = Math.sin(a) * rr * 0.72;
      points.push([x + dx * Math.cos(lean) - dy * Math.sin(lean), y + dx * Math.sin(lean) + dy * Math.cos(lean)]);
    }
    out.push({ points, width: 0, alpha: spec.alpha, crosses: false, taper: false, lit: false });
    /*
      ⚠️ **AND A LIT RIM, WITHOUT WHICH A HULK IS NOTHING AT ALL.** A dark mark is a hole in the gas,
      and The Approach's gas is thin — so the first set of these were drawn perfectly, in the right
      places, at the right sizes, and were **invisible** against a near-black backdrop. That is
      0220's finding about The Labyrinth's corridor walls arriving in a second place, and the answer
      is the same one the Pillars use: a dark body with one bright edge.

      ⚠️ **A HAIRLINE, BECAUSE THIS IS THE HALF THAT COSTS CONTRAST.** The body is free — it darkens
      the ground the bright inks are read against — and the rim is gas, which is the only thing
      `skyCover` counts. A closed outline four thousandths of a tile wide spends almost nothing and is
      the whole difference between an object and an absence.
    */
    out.push({
      points: [...points, points[0]!],
      width: Math.max(1, size * 0.004),
      alpha: spec.alpha * 0.55,
      crosses: false,
      taper: false,
      lit: true,
    });
  }
  return out;
}

/**
 * A wandering line across the whole tile, ending where it began.
 *
 * The shared shape behind Ember Nebula's dust and The Labyrinth's corridor walls — one crosses in
 * dark dust and the other in long structure, and both are *a line that must arrive where it left*.
 */
function crossing(size: number, spec: Crossing): StructureMark[] {
  const rng = makeRng('sky').stream(spec.stream);
  const steps = spec.steps ?? 8;
  const out: StructureMark[] = [];
  for (let i = 0; i < spec.count; i += 1) {
    const start = rng.range(0.12, 0.88) * size;
    const points: number[][] = [];
    let y = start;
    for (let s = 0; s <= steps; s += 1) {
      // ⚠️ The last point is forced back to `start`, which is the whole of 0207.
      points.push([(s / steps) * size, s === steps ? start : y]);
      y += rng.range(-spec.wander, spec.wander) * size;
    }
    out.push({
      points,
      width: rng.range(spec.from, spec.to) * size,
      alpha: spec.alpha ?? 0.55,
      crosses: true,
      taper: false,
      lit: false,
    });
  }
  return out;
}

/**
 * Every place's own structure, and what makes it that place rather than gas.
 *
 * ⚠️ **A `Record` OVER THE CLOSED UNION, WHICH IS WHAT 0208 SAID THE THIRD PLACE WOULD OWE.** Two
 * theme-gated functions, each returning `[]` for every place but its own, was honest at two and a
 * guess about the other five. At seven it is `docs/decisions/0016-a-hub-enumerates-kinds.md`'s shape:
 * a place is a row, behaviour rides the row, and nothing switches on a name.
 *
 * ⚠️ **DARK OVER LIGHT GAS, EVERY ONE OF THEM, AND THAT IS A MEASUREMENT RATHER THAN A HOUSE STYLE.**
 * `docs/decisions/0196-the-backdrop-is-rounded-out.md` measured Ember Nebula and The Toxic Mire at
 * about a third of the contrast headroom the other five have. A bright structure in either would have
 * had to argue with the gameplay floor
 * `docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md` did not defer; dust in the
 * space colour spends none of it. Doing the two thin places first is what surfaced the rule for the
 * five that followed.
 *
 * ⚠️ **AND SEVEN DIFFERENT SHAPES, NOT ONE SHAPE SEVEN TIMES.** *"None of those elements are
 * transposable to a different level."* Each row below is read from that place's own character in
 * `SKY_STYLE_OF` and `THEMES` before any geometry was written, which is what stopped this becoming
 * 0196's *nine axes over two primitives* again.
 */
export const STRUCTURE_OF: Record<ThemeKind, (size: number) => StructureMark[]> = {
  /*
    ── THE APPROACH: THE WORLD BEING LEFT ──────────────────────────────────────────────────────────

    *"Open space, evenly scattered, weather with no direction to it. The one every other place
    deviates from."* It is the way IN, so its structure is the one thing a departure has: **a limb of
    the world behind you**, low and enormous and going nowhere.

    ⚠️ **ONE MARK, AND THAT IS THE POINT.** The first level is the baseline the other six deviate
    from, so a busy sky here would spend the contrast between *ordinary space* and everywhere after
    it. A single arc says *somewhere* without saying *strange*.
  */
  approach: (size) => {
    const points: number[][] = [];
    // A shallow arc across the bottom of the tile: a horizon far enough away to be nearly flat.
    /*
      ⚠️ **TILE y 0.25 TO 0.75 IS THE LANE, AND THE FIRST DRAFT PUT THIS AT 0.86.** The weather tile is
      twice the lane across and blitted centred, so its y runs from lane −50 to lane 150 — and 0.86 of
      it is lane 122, well below anything the player can see. The horizon was drawn correctly, every
      guard passed, and the screen was unchanged. Found in the bench, which is the third time in this
      arc a number that was right in the model was off the picture.
    */
    for (let i = 0; i <= 24; i += 1) {
      const t = i / 24;
      points.push([t * size, size * (0.68 + 0.05 * Math.cos((t - 0.5) * Math.PI))]);
    }
    // Closed just past the lane's far edge so it fills as a body rather than stroking as a wire.
    points.push([size, size * 0.8], [0, size * 0.8]);
    // ⚠️ LIT, not dark — The Approach's gas is the thinnest of the seven, so a silhouette here has
    // nothing to be a silhouette against. Its headroom is what pays for that.
    /*
      ⚠️ **TWO HULKS, AND THE PLACE IS STILL THE SPARSEST OF THE SEVEN** — 0222. 0211 gave this one
      mark on purpose: *"a busy sky here would spend the contrast between ordinary space and everywhere
      after it."* That argument is about BUSYNESS and it survives — two dark bodies is not busy, and
      *"a plain black background is a plain boring game"* was reported about all four places in space
      including this one. It keeps the fewest of anything and it is no longer empty.
    */
    return [
      { points, width: 0, alpha: 0.34, crosses: true, taper: false, lit: true },
      ...hulks(size, { stream: 'approach/hulks', count: 2, from: 0.072, to: 0.105, sides: 9, rough: 0.2, alpha: 0.4 }),
    ];
  },

  /*
    ── EMBER NEBULA: DUST IN FRONT OF LIGHT — 0207 ────────────────────────────────────────────────
    The Pillars' own sentence at the scale of the sky, which is what makes the near view and the wide
    view read as one object.

    ⚠️ **THREE RUNS AT THREE WEIGHTS, BECAUSE THE REPORT WAS ABOUT DENSITY AND NOT ABOUT SHAPE.**
    *"ember nebula is looking good, but it needs a lot more detail throughout the level."* The three
    heavy lanes are kept exactly as 0207 wrote them — they are what the place already reads as — and
    what is added underneath them is finer and fainter, so the picture gains texture without gaining a
    second silhouette to compete with the Pillars.

    ⚠️ **AND ALL OF IT IS DARK, WHICH IS WHY THERE CAN BE THIS MUCH OF IT.** 0196 measured Ember
    Nebula at about a third of the contrast headroom the other five places have, and 0211 concluded
    from that measurement that nothing here may be lit. **A dark mark spends none of it** — it darkens
    the ground the bright inks are read against, which moves every ratio the right way. So the budget
    that forbids one lit filament permits nineteen dark ones, and the depth has to come from WEIGHT
    (0.55 → 0.40 → 0.70) rather than from light.
  */
  nebula: (size) => {
    // The lanes 0207 authored, untouched: the same stream, the same numbers, the same three lines.
    const lanes = crossing(size, { stream: 'nebula/lanes', count: 3, wander: 0.05, from: 0.05, to: 0.11 });
    /*
      Fine dust threaded between them — thinner, fainter, and far more restless (14 segments against
      the lanes' 8), so it reads as the same material at a smaller scale rather than as more lanes.
    */
    const filaments = crossing(size, {
      stream: 'nebula/filaments',
      count: 9,
      wander: 0.028,
      from: 0.002,
      to: 0.007,
      alpha: 0.32,
      steps: 14,
    });
    /*
      ── THE GLOBULES ────────────────────────────────────────────────────────────────────────────

      The dark knots that sit in a nebula's lanes — the same material the Pillars are, at the size
      the sky can carry. **The heaviest marks in the place at 0.7**, which is what puts them in front
      of everything else here.

      ⚠️ **STRETCHED ALONG x, AND THAT IS NOT A ROUNDING OF SAURIAN BELT'S ROCKS.** A rock there is an
      angular polygon at even radii; this is a soft ellipse drawn out 2.4× the way the gas is flowing,
      so the two read as *debris* and *dust* rather than as one generator in two colours — 0211's
      second claim, which is the one 0196 failed.
    */
    const rng = makeRng('sky').stream('nebula/globules');
    const knots: StructureMark[] = [];
    for (let knot = 0; knot < 5; knot += 1) {
      const cx = rng.range(0.1, 0.9) * size;
      const cy = rng.range(0.14, 0.86) * size;
      for (let i = 0; i < 4; i += 1) {
        const x = cx + rng.range(-0.05, 0.05) * size;
        const y = cy + rng.range(-0.035, 0.035) * size;
        /*
          ⚠️ **A FRACTION OF A TILE IS NOT A SIZE UNTIL THE TILE IS A NUMBER, AND THE FIRST DRAFT
          MISSED BY 4×.** `SPRITE_EXTENT.skyNebula` is `ACROSS_SPAN * 2` — 200 world units, about a
          screen wide — so `0.03` of it is 6 units, and stretched 2.4× along the flow that is a 92-pixel
          slab. The bench showed exactly that: angular masses across half the screen, and the warm glow
          the place is recognised by eaten by them. At `0.011` a globule is about 20 pixels, which is a
          knot in the dust.
        */
        const r = rng.range(0.004, 0.011) * size;
        /*
          ⚠️ **THE LEAN HAD TO COME DOWN WHEN THE STRETCH WENT UP, AND THAT IS NOT OBVIOUS.** A
          globule is drawn long and then rotated, and a rotated long shape has a **squarer bounding
          box** — at ±0.25 the 3.6× stretch came back out of the box as an aspect near two, which is
          compact, which puts it in 0203's band. The guard caught it after the stretch was already
          fixed, which is the whole reason a guard measures the drawing and not the intention.
        */
        const lean = rng.range(-0.1, 0.1);
        const points: number[][] = [];
        // Nine sides at gently uneven radii: soft, not faceted. A globule has no edges.
        for (let s = 0; s < 9; s += 1) {
          const a = (s / 9) * Math.PI * 2;
          const rr = r * rng.range(0.82, 1.18);
          /*
            ⚠️ **DRAWN OUT TO 3.6× FROM 2.4×, AND IT IS THE FORBIDDEN BAND RATHER THAN A TASTE** —
            0222. At 2.4 a globule's box is barely two and a half times as long as it is deep, which
            makes it a **compact** shape about six units across — inside 0203's band, where a piece of
            the backdrop can be read as a body. Nothing had ever checked `STRUCTURE_OF` against that
            band; the guard that does is new in the same pass that needed to know how big debris is
            allowed to be.

            **Longer is also the better drawing.** These are knots in a flow, and a flow draws things
            out — a rounder one reads as a pebble, which is the thing the band is objecting to.
          */
          const dx = Math.cos(a) * rr * 3.6;
          const dy = Math.sin(a) * rr;
          points.push([x + dx - dy * lean, y + dy + dx * lean]);
        }
        knots.push({ points, width: 0, alpha: 0.55, crosses: false, taper: false, lit: false });
      }
    }
    /*
      ⚠️ **AND THREE HULKS, WHICH IS THE ONLY LARGE THING THE RULES ALLOW** — 0222. Dark bodies in the
      gas, twenty-odd units across, at the slowest rate in the place: what reads as depth is having
      something at a scale nothing else on the screen is at. Ember Nebula can carry the most of them
      because it has the most gas for them to be silhouettes against.
    */
    return [...filaments, ...knots, ...lanes, ...hulks(size, {
      stream: 'nebula/hulks',
      count: 3,
      from: 0.074,
      to: 0.11,
      sides: 11,
      rough: 0.22,
      alpha: 0.55,
    })];
  },

  /*
    ── SAURIAN BELT: A WORLD BELOW, AND THE BELT IS WHAT IS ABOVE IT ──────────────────────────────

    *"saurian and rime shelf need to be planetary backdrops where the level is based on a planet, not
    that the planet is in the background."*

    ⚠️ **SO THE HORIZON IS THE SUBJECT AND THE ROCKS BECOME THE WEATHER.** 0211 read this place as
    *"tumbling rock: knots of debris with clear lanes between them"* and drew the debris, which is a
    belt seen from inside it — the report is that the player should be flying OVER something. Three
    ridgelines fill the bottom of the lane; the rocks stay, halved in number and lifted well above the
    skyline, so what they now mean is *this world has a belt* rather than *this place is one*.

    ⚠️ **TILE y 0.25 TO 0.75 IS THE LANE — the same trap The Approach's horizon fell into.** The
    weather tile is twice the lane across and blitted centred, so anything below 0.75 is below the
    screen. The three crests sit at 0.60, 0.655 and 0.715: lane 70, 81 and 93, which is the bottom
    quarter of what the player can see.
  */
  saurian: (size) => {
    const out: StructureMark[] = [];
    /*
      ⚠️ **THE RIDGES USED TO BE HERE AND THEY ARE `GROUND_OF.saurian` NOW — 0221.** They were three
      filled structure marks at 0.45, 0.64 and 0.88 alpha, painted onto the weather tile, which is
      drawn FIRST — so both star fields came down through the mountains and the ridges read as
      translucent bands rather than as land. *"Ground features need be properly have nothing behind
      them"* is not an alpha this table can reach: it is a different layer, drawn last, opaque.

      What is left here is the belt itself, overhead, which is the only thing in this place that was
      ever really weather. Local objects — 0208's rule, not 0207's — because a rock carries its whole
      shape to the copy one tile over.
    */
    /*
      ⚠️ **THE BELT IS FOUR HULKS AND A DRIFT OF SPECKS NOW, AND IT USED TO BE THE THING 0203 FORBIDS**
      — 0222. These were five-to-seven-sided rocks at `0.012` to `0.04` of a 200-unit tile: **2.4 to 8
      world units across, against a bullet at 1.8 and a body at up to 8.** Their own comment claimed
      the polygon was *"deliberately not a disc — a disc at this size is a bullet's silhouette, which
      0203's band is about"*, and the band is about SIZE. Nothing had ever checked `STRUCTURE_OF`
      against it, so a place has been drawing body-sized debris in the sky since 0211.

      A belt is better for the fix, too. Real ones are a few big bodies and a great deal of dust, and
      the two ends of the band are exactly those.
    */
    for (const hulk of hulks(size, {
      stream: 'saurian/belt',
      count: 4,
      from: 0.087,
      to: 0.128,
      sides: 7,
      rough: 0.34,
      alpha: 0.62,
    })) {
      out.push(hulk);
    }
    const rng = makeRng('sky').stream('saurian/dust');
    for (let knot = 0; knot < 3; knot += 1) {
      const cx = rng.range(0.1, 0.9) * size;
      // Above the skyline, and by enough that a speck never reads as sitting on the ground.
      const cy = rng.range(0.28, 0.5) * size;
      for (let i = 0; i < 7; i += 1) {
        const x = cx + rng.range(-0.09, 0.09) * size;
        const y = cy + rng.range(-0.07, 0.07) * size;
        // Under a bullet at 1.8 units — `0.004` of a 200-unit tile is 0.8, and the widest is 1.6.
        const r = rng.range(0.002, 0.004) * size;
        const points: number[][] = [];
        const sides = 5 + Math.floor(rng.range(0, 3));
        for (let s = 0; s < sides; s += 1) {
          const a = (s / sides) * Math.PI * 2 + rng.range(-0.3, 0.3);
          const rr = r * rng.range(0.6, 1);
          points.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
        }
        out.push({ points, width: 0, alpha: 0.62, crosses: false, taper: false, lit: false });
      }
    }
    return out;
  },

  /*
    ── THE LABYRINTH: LONG STRUCTURE GOING PAST ───────────────────────────────────────────────────

    *"Long structure going past. Almost nothing clumps in a corridor."* Walls, then — running the way
    the player is running, which is the one direction a corridor has. They cross the tile, so they
    take 0207's rule: heavy, straight-ish, and periodic.
  */
  labyrinth: (size) => {
    /*
      ⚠️ **A DARK BODY WITH A LIT EDGE, WHICH IS THE PILLARS' OWN LANGUAGE — 0204.** 0211's first
      version was dark alone and came out INVISIBLE in the bench: The Labyrinth has the thinnest gas of
      the seven (`SKY_STYLE_OF.labyrinth` is `clouds: 0.35, cloudAlpha: 0.6`), so a silhouette had
      nothing to be a silhouette against. A rim rather than a lit body, because a lit body would spend
      headroom across its whole area where a one-line edge spends almost none — and because that is
      what a corridor wall looks like with a light on it.

      ── A CHANNEL, NOT FOUR LOOSE LINES ─────────────────────────────────────────────────────────

      *"the labyrinth needs to be a branching twisting path the player is flying through."*

      ⚠️ **THE WORD THAT CHANGED THE GEOMETRY IS *THROUGH*.** 0211 read this place as *"long structure
      going past"* and drew four independent walls, which is scenery beside the player. A path you fly
      THROUGH has two sides, and the two have to agree — so a channel is authored as a **centreline
      and a gap**, and the walls are what that pair implies. Their lit rims then face inward, because
      the light in a corridor is in the corridor.

      ⚠️ **AND THE CENTRELINE IS A SUM OF SINES RATHER THAN A RANDOM WALK, WHICH IS WHAT MAKES IT
      TWIST AT ALL.** `crossing` walks and then forces its last point back to the first, so every unit
      of drift is repaid in one final segment: the wander that reads as a twist is exactly the wander
      that reads as a diagonal at the tile join. Raising it to 0.032 was tried and the bench showed
      zigzag ridgelines with a kink at the seam. Sines whose periods divide the tile are periodic **by
      construction** — 0207 discharged by arithmetic instead of by a correction — so the amplitude can
      be whatever the picture wants.
    */
    const rng = makeRng('sky').stream('labyrinth/paths');
    const out: StructureMark[] = [];
    const SAMPLES = 32;
    const WALL = 0.055;
    const rim = (points: number[][], toward: number, alpha: number, crosses: boolean): StructureMark => ({
      points: points.map((p) => [p[0]!, p[1]! + toward * WALL * size * 0.5]),
      width: Math.max(1, size * 0.004),
      alpha,
      crosses,
      taper: false,
      lit: true,
    });

    /*
      ⚠️ **ONE CHANNEL, CENTRED ON THE LANE, AND TWO OF THEM WAS THE FIRST DRAFT'S MISTAKE.** Tile y
      0.25 to 0.75 is the lane, so a pair of narrow channels at 0.36 and 0.63 put their walls at lanes
      22 and 76 — and the ship, which flies in the middle, was **between** them rather than in either.
      The bench showed four wavy lines and a player in open space, which is *going past* again.

      Centred at 0.5 with a gap of about a quarter of the tile, the walls sit at roughly lane 24 and
      76 and the player is inside. That is what *through* means.
    */
    const swing = rng.range(0.03, 0.05);
    const ripple = rng.range(0.012, 0.024);
    const phase = rng.range(0, Math.PI * 2);
    const turns = 1 + Math.floor(rng.range(0, 2));
    const gap = 0.26;
    const channel = {
      gap,
      at: (t: number): number =>
        0.5 + swing * Math.sin(Math.PI * 2 * turns * t + phase) + ripple * Math.sin(Math.PI * 2 * (turns + 2) * t),
      // The channel breathes: it pinches and opens out, which is what stops it reading as a pipe.
      widthAt: (t: number): number => gap * (1 + 0.22 * Math.sin(Math.PI * 2 * t + phase)),
    };

    for (const side of [-1, 1]) {
      const wall: number[][] = [];
      for (let s = 0; s <= SAMPLES; s += 1) {
        const t = s / SAMPLES;
        wall.push([t * size, (channel.at(t) + (side * channel.widthAt(t)) / 2) * size]);
      }
      /*
        ⚠️ **THE WALL IS DRAWN TWICE, DARK AND THEN FAINTLY LIT, BECAUSE HERE THE DARK ONE IS
        INVISIBLE.** A structure mark's body is the SPACE colour — a hole in the gas — and The
        Labyrinth's gas is the thinnest of the seven, so there is nothing for that hole to be a hole
        in: every version of this place from 0211 onward has been read entirely off its rims. That is
        why 0211's walls looked like wires, and it is why a wall's THICKNESS has never once been on
        screen.

        A tenth of the gas colour over the body puts it there. It is the same headroom argument the
        rim already won — this place has room where Ember Nebula does not — spent on the face of the
        wall instead of only on its edge.
      */
      out.push({ points: wall, width: WALL * size, alpha: 0.62, crosses: true, taper: false, lit: false });
      out.push({
        points: wall.map((p) => [p[0]!, p[1]! + side * WALL * size * 0.28]),
        width: WALL * size * 0.9,
        alpha: 0.1,
        crosses: true,
        taper: false,
        lit: true,
      });
      // ⚠️ `-side` — the rim is on the face that looks INTO the channel. Both rims on the same side
      // reads as two pipes lying next to each other, which is what the first draft of this drew.
      out.push(rim(wall, -side, 0.55, true));
    }

    /*
      ── THE BRANCHES ────────────────────────────────────────────────────────────────────────────

      Two kinds, because *branching* means two different things in a corridor and only one of them is
      a fork:

        · an **island** — a spine down the middle that the channel parts around and closes over
        · a **side passage** — a way out through a wall, running off past the top or the bottom

      ⚠️ **LOCAL MARKS, AND THEY HAVE TO BE.** A branch that spanned the tile would be another wall;
      one spanning more than half of it cannot be covered by the wrap `paintStructure` draws local
      marks with, which is 0208's rule and the thing its guard measures. Both below are about a fifth
      of a tile, which on this screen is already a long way to fly.
    */
    const from = rng.range(0.08, 0.5);
    const run = rng.range(0.15, 0.22);
    const lift = rng.range(0.3, 0.45) * gap * (rng.range(0, 1) < 0.5 ? -1 : 1);
    const island: number[][] = [];
    for (let s = 0; s <= 10; s += 1) {
      const t = from + (s / 10) * run;
      // A lens rather than a half-sine: it comes to a point at both ends, which is what a splitter is.
      island.push([t * size, (channel.at(t) + Math.sin((s / 10) * Math.PI) * lift) * size]);
    }
    out.push({ points: island, width: WALL * size * 0.55, alpha: 0.55, crosses: false, taper: true, lit: false });
    out.push(rim(island, lift > 0 ? -0.55 : 0.55, 0.42, false));

    /*
      And two ways out of it, one through each wall, leaning off towards wherever else this place goes.
      **They leave and do not come back**, which is the half of *branching* an island cannot say.
    */
    for (const side of [-1, 1]) {
      const mouth = rng.range(0.15, 0.7);
      const pass: number[][] = [];
      for (let s = 0; s <= 8; s += 1) {
        const t = mouth + (s / 8) * 0.13;
        const wall = channel.at(t) + (side * channel.widthAt(t)) / 2;
        // Away from the channel, steepening — a passage seen edge-on from inside the one you are in.
        pass.push([t * size, (wall + side * 0.13 * (s / 8) * (s / 8)) * size]);
      }
      out.push({ points: pass, width: WALL * size * 0.5, alpha: 0.5, crosses: false, taper: false, lit: false });
      out.push(rim(pass, -side * 0.5, 0.34, false));
    }
    /*
      ⚠️ **AND WHAT THE CORRIDOR IS BUILT OUT OF, WHICH IS THE PLACE'S OWN VERSION OF A HULK** — 0222.
      Not tumbling rock: blocks, squarer and more regular than anywhere else's, because a labyrinth is
      a made thing. Seven sides at low roughness against Saurian Belt's five at high is the difference
      between masonry and a boulder, and 0211's guard compares coordinates rather than intentions —
      two places with the same generator and different streams still draw different marks, and these
      draw a different SHAPE as well.
    */
    for (const block of hulks(size, {
      stream: 'labyrinth/blocks',
      count: 3,
      from: 0.063,
      to: 0.095,
      sides: 7,
      rough: 0.08,
      alpha: 0.6,
    })) {
      out.push(block);
    }
    return out;
  },

  /*
    ── RIME SHELF: SHARDS ALL LYING ONE WAY ───────────────────────────────────────────────────────

    *"A shelf of ice: shards in drifts, all lying the same way, and very little variation in them."*
    The lean is SHARED, which is the whole character — a drift is a hundred things agreeing. Local
    marks, so 0208's rule.
  */
  rime: (size) => {
    const out: StructureMark[] = [];
    /*
      ⚠️ **THE SHELF USED TO BE HERE AND IT IS `GROUND_OF.rime` NOW — 0221**, on Saurian Belt's own
      terms one row up: three terraces painted onto the weather tile had both star fields shining
      through them. It also came back with the report *"icy and austere"*, and austere is a COUNT
      before it is a shape — three terraces of stepped tables at a corner every twentieth of a tile
      read as a city skyline. There are two now, with long runs and almost nothing on them.

      What is left here is what actually blows through the air over an ice sheet.
    */

    const rng = makeRng('sky').stream('rime/shards');
    // ⚠️ ONE lean for every shard in the place, drawn once outside the loop. Drawing it per shard
    // would be a field of splinters, which is what a shelf of ice is not.
    const lean = -0.72;
    for (let drift = 0; drift < 5; drift += 1) {
      const cx = rng.range(0.05, 0.95) * size;
      // Blowing above the shelf rather than scattered through the whole tile — the shelf is the ground
      // now, and a shard drawn below its skyline is buried in it.
      const cy = rng.range(0.28, 0.53) * size;
      for (let i = 0; i < 6; i += 1) {
        const x = cx + rng.range(-0.11, 0.11) * size;
        const y = cy + rng.range(-0.06, 0.06) * size;
        const len = rng.range(0.05, 0.12) * size;
        out.push({
          points: [
            [x, y],
            [x + Math.cos(lean) * len, y + Math.sin(lean) * len],
          ],
          /*
            ⚠️ **THINNER AND FAINTER THAN 0221 SHIPPED THEM, AND IT IS A MEASUREMENT RATHER THAN A
            TASTE — 0222.** At `0.006–0.016` of a 200-unit tile these were **1.2 to 3.2 world units
            wide**, over a bullet's 1.8, and at 0.5 alpha in the gas colour over the palest sky in the
            game. `scripts/weigh-sky.mjs` read Rime Shelf at **0.516 cover and `enemy` at 2.67:1
            against a floor of 3** — the one place in the game that was under it, shipped the day
            before by the decision that made these lit.

            `cloudCover` could not see it: it counts clouds, and 0220 and 0221 both wrote down that
            structure goes uncounted. **This is the pass that spends that headroom, so it is the pass
            that had to measure it.**
          */
          width: rng.range(0.004, 0.008) * size,
          alpha: 0.28,
          crosses: false,
          taper: true,
          /*
            ⚠️ **LIT, AND IT IS THE ONLY FIELD OF MARKS IN THE GAME THAT IS** — 0221. Every structure
            mark everywhere else is a hole in the light; blowing ice over a pale sky is the opposite,
            and drawn dark it came out of the bench as a field of black scratches across the one place
            whose backdrop is bright. `lit` already exists for exactly this and 0211 said in as many
            words that it is a contrast measurement rather than a house style — Rime Shelf has more
            headroom than any other place now, and this is what it is for.
          */
          lit: true,
        });
      }
    }
    return out;
  },

  /*
    ── THE TOXIC MIRE: GROWTH THAT REACHES DOWN — 0208 ────────────────────────────────────────────
    *"The mire SEEPS — the one place whose whole character is that it reaches you before you reach
    it."* It hangs where the Pillars rise, so the two cannot be mistaken for each other's art.
  */
  mire: (size) => {
    const rng = makeRng('sky').stream('mire/fronds');
    const out: StructureMark[] = [];
    for (let i = 0; i < 12; i += 1) {
      const x = rng.range(0, 1) * size;
      const reach = rng.range(0.1, 0.26) * size;
      const points: number[][] = [];
      let sway = 0;
      for (let s = 0; s <= 6; s += 1) {
        // A random WALK rather than a per-step offset: a frond leans and keeps leaning, which is what
        // hangs in a current instead of zigzagging.
        sway += rng.range(-0.04, 0.04) * size;
        /*
          ⚠️ **HUNG FROM THE CANOPY, WHICH DID NOT EXIST WHEN THIS WAS WRITTEN — 0221.** They started
          at tile 0.12 and reached down to 0.67, which is a curtain across most of the lane hanging
          from nothing. `GROUND_OF.mire` now puts a solid canopy at 0.4, so a frond that begins above
          it is inside a roof and one that begins below it is floating. They start AT the canopy and
          reach a little way past it into the corridor — which is the same *"reaches you before you
          reach it"* the place has always been about, with something to reach from.
        */
        points.push([x + sway, 0.4 * size + (s / 6) * reach]);
      }
      out.push({ points, width: rng.range(0.01, 0.026) * size, alpha: 0.6, crosses: false, taper: true, lit: false });
    }
    return out;
  },

  /*
    ── THE BLACK HEART: EVERYTHING DRAWN ONE WAY ──────────────────────────────────────────────────

    *"Nearly empty, and what is left is being drawn one way."* So the structure is not an object at
    all — it is the DIRECTION. Streaks of what is left, tapering as they are pulled towards a point
    off the lane, and nearly nothing of them.

    ⚠️ **THE SPARSEST OF THE SEVEN ON PURPOSE.** It is the last place and its character is absence;
    a busy sky here would say *another nebula*. What tells the player where they are is that the few
    marks left all agree about where they are going.
  */
  core: (size) => {
    const rng = makeRng('sky').stream('core/infall');
    const out: StructureMark[] = [];
    // The point everything is drawn towards, off the tile so the convergence never resolves on screen.
    const toX = size * 1.35;
    const toY = size * 0.5;
    for (let i = 0; i < 9; i += 1) {
      const x = rng.range(0, 0.8) * size;
      const y = rng.range(0.05, 0.95) * size;
      const pull = rng.range(0.1, 0.26);
      out.push({
        points: [
          [x, y],
          [x + (toX - x) * pull, y + (toY - y) * pull],
        ],
        width: rng.range(0.008, 0.022) * size,
        alpha: 0.55,
        crosses: false,
        taper: true,
        lit: false,
      });
    }
    /*
      ⚠️ **AND TWO THINGS BIG ENOUGH TO BE GOING IN, WHICH IS THE PLACE'S WHOLE SUBJECT** — 0222.
      *"Everything drawn one way"* is a direction and nothing was ever being drawn — the streaks are
      the motion of an absence. Two hulks give the infall something to be happening TO, and they are
      the faintest in the game because this place's character is that there is nearly nothing left.
    */
    for (const falling of hulks(size, {
      stream: 'core/falling',
      count: 2,
      from: 0.082,
      to: 0.115,
      sides: 8,
      rough: 0.3,
      alpha: 0.42,
    })) {
      out.push(falling);
    }
    return out;
  },
};

/**
 * Paint a place's structure over its gas, obeying each mark's own seam rule.
 *
 * ⚠️ **ONE PAINTER FOR SEVEN PLACES, AND IT IS WHERE THE SEAM RULES ACTUALLY LIVE.** Every mark is
 * drawn again at ±`size` on the tiling axis so what leaves one edge arrives at the other (0206); a
 * mark that `crosses` was built periodic so those copies join end to end (0207); a mark that does not
 * cross carries its whole shape with it, which is why the wrap alone is enough for it (0208).
 *
 * ⚠️ **IN THE SPACE COLOUR, ALWAYS.** Dust is a hole in the light rather than a shape in front of it
 * — 0204 — and drawing all seven places the same way is what makes the near view and the wide view of
 * any of them read as one object.
 */
// ⚠️ **EXPORTED SO A `Pen` CAN COUNT WHAT IT DRAWS** — 0220. The claim below about a non-tapered mark
// being ONE path is about this function and not about `STRUCTURE_OF`, and `tests/paths.ts` is the
// instrument that can read it: it is the same narrowing `drawKind` already made for 0149.
// ⚠️ **IT NO LONGER TAKES THE PLACE'S BODY COLOUR AT ALL, AND THAT IS THE CHANGE RATHER THAN AN
// OVERSIGHT** — 0223. A mark here is either a hole in the gas (`space`) or an edge lit by the place
// (`glow`); the body colour is what the CLOUDS are, and no mark in this function was ever drawn in it
// once the accent existed. A parameter kept for symmetry would be a colour nobody uses.
export function paintStructure(ctx: Pen, glow: string, space: string, size: number, theme: ThemeKind): void {
  const marks = STRUCTURE_OF[theme](size);
  ctx.lineCap = 'round';
  for (const mark of marks) {
    /*
      0211: a lit mark is drawn in the place's own gas, a dark one is a hole punched in it.

      ⚠️ **AND IT IS THE GLOW RATHER THAN THE BODY SINCE 0223, WHICH IS WHERE MOST OF THE COLOUR
      LANDS.** Every lit thing in a place is an EDGE — a crest on a skyline, a rim on a hulk, the face
      of a corridor wall — so this one line puts the second colour on the outline of everything the
      place is made of. A cloud in the accent colour is a patch of hue somewhere; an edge in it is hue
      wherever the eye is already looking, which is what *"vibrant"* actually asks for.
    */
    const ink = mark.lit ? glow : space;
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.globalAlpha = mark.alpha;
    for (const dx of [-size, 0, size]) {
      if (mark.width === 0) {
        ctx.beginPath();
        ctx.moveTo(mark.points[0]![0]! + dx, mark.points[0]![1]!);
        for (let i = 1; i < mark.points.length; i += 1) ctx.lineTo(mark.points[i]![0]! + dx, mark.points[i]![1]!);
        ctx.closePath();
        ctx.fill();
        continue;
      }
      /*
        ⚠️ **A MARK THAT DOES NOT TAPER IS ONE PATH, AND DRAWING IT AS N WAS A REAL DEFECT.** Every
        stroked mark used to be laid down segment by segment — the loop below, unconditionally — which
        at a round `lineCap` means each join is covered TWICE and composites its alpha against itself.
        On a thin rim that is invisible, which is why it has survived from 0211; on anything wide it is
        a string of beads down the middle of the mark, and the bench showed exactly that the moment
        The Labyrinth's wall faces were drawn at a tenth of the gas.

        It is also three fewer canvas calls per join. The per-segment loop stays for the thing it was
        written for and says so: `Pen` has no variable-width stroke, so a taper has to be one.
      */
      if (!mark.taper) {
        ctx.lineWidth = mark.width;
        ctx.beginPath();
        ctx.moveTo(mark.points[0]![0]! + dx, mark.points[0]![1]!);
        for (let i = 1; i < mark.points.length; i += 1) ctx.lineTo(mark.points[i]![0]! + dx, mark.points[i]![1]!);
        ctx.stroke();
        continue;
      }
      for (let i = 1; i < mark.points.length; i += 1) {
        // A mark that keeps its thickness to the tip reads as a wire rather than as something growing.
        ctx.lineWidth = Math.max(0.5, mark.width * (1 - (i / mark.points.length) * 0.9));
        ctx.beginPath();
        ctx.moveTo(mark.points[i - 1]![0]! + dx, mark.points[i - 1]![1]!);
        ctx.lineTo(mark.points[i]![0]! + dx, mark.points[i]![1]!);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawNebula(ctx: Pen, colour: string, glow: string, space: string, size: number, theme: ThemeKind): void {
  for (const cloud of nebulaField(size, theme)) {
    /*
      ⚠️ **THE INNER CIRCLE IS OFFSET AND ITS RADIUS IS STILL ZERO** — 0196. A zero-radius inner circle
      is what makes the falloff start at full strength from a point; moving that point off centre leans
      the whole cloud without putting a boundary anywhere in it.

      ⚠️ **TWO STOPS, AT 0 AND 1, AND `tests/sky.test.ts` HOLDS THAT.** The cover arithmetic the
      contrast guard rests on models this falloff as linear in distance, which is exactly what a canvas
      interpolates between two stops. A third stop, or a stop moved off 0 or 1, would make that model
      wrong in the direction that lets a backdrop eat an ink — so the shape of this gradient is guarded
      rather than assumed.
    */
    /*
      ⚠️ **NINE PLACES, AND EIGHT OF THEM ARE ALMOST ALWAYS SKIPPED — 0206.** A tile is only seamless
      if what leaves one edge arrives at the opposite one, so every cloud is offered at its own
      position and at ±`size` on each axis. The `continue` drops any copy whose disc does not reach
      the tile at all, which is every copy of every cloud that is not near an edge.

      **Both axes, not just the tiling one.** `paintSky` repeats along the scroll axis only, but the
      atlas is rotated as a whole for the top view (`bakeOne`), so which sprite axis is the scrolling
      one depends on a setting this function cannot see. Wrapping both costs bake time — this file is
      on `tests/budget.test.ts`'s DELIBERATELY_COLD list — and cannot be got wrong later.
    */
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const x = cloud.x + dx;
        const y = cloud.y + dy;
        if (x + cloud.r < 0 || x - cloud.r > size) continue;
        if (y + cloud.r < 0 || y - cloud.r > size) continue;
        const fill = ctx.createRadialGradient(cloud.fx + dx, cloud.fy + dy, 0, x, y, cloud.r);
        // ⚠️ **STILL EXACTLY TWO STOPS, AT 0 AND 1** — 0196's cover arithmetic models the falloff as
        // linear between them and `tests/sky.test.ts` scans this function for it. What 0223 changed is
        // WHICH colour sits at stop 0, never how many there are.
        fill.addColorStop(0, cloud.glow ? glow : colour);
        fill.addColorStop(1, 'transparent');
        ctx.globalAlpha = cloud.alpha;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x, y, cloud.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /*
    ── AND THE PLACE'S OWN STRUCTURE, OVER THE GAS — 0211 ──────────────────────────────────────────

    Two hand-rolled blocks lived here, one for Ember Nebula's dust and one for The Toxic Mire's
    growth, each with its own copy of the wrap and its own argument about which seam rule applied.
     is the one painter for all seven, and the rule each mark takes is a field on the
    mark rather than a paragraph above the loop.
  */
  paintStructure(ctx, glow, space, size, theme);
  ctx.globalAlpha = 1;
}

/**
 * Re-bake the nebula tile in `colour`, and write it into the atlas in place.
 *
 * ── WHY ONE BITMAP RATHER THAN A SECOND ATLAS, OR A TINT PER BLIT ───────────────────────────────
 *
 * ⚠️ **`docs/decisions/0112-the-sky-has-weather.md`.** Seven themes each with their own baked atlas is
 * seven copies of every sprite in the game for one tile's worth of difference — the same shape 0107
 * refused for the music. A tint applied at blit time is a canvas state change inside the frame loop,
 * which `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts.
 *
 * ⚠️ **A level boundary is a screen** (`docs/decisions/0063-a-level-break-is-a-respite.md`), and this
 * is one canvas the size of two lanes — the same cost class as the rotation re-bake `onResize`
 * already does, spent where the game is already not running.
 *
 * ⚠️ **`bitmaps` is mutated in place and that is deliberate.** An `Atlas` is read by index every
 * frame; building a new one to change a single entry would allocate the whole array and force a
 * `setAtlas`, which is the path that exists for a rotation. This is the narrow case, and it is the
 * only sprite in the atlas whose ink is not final — `INK_OF` says so.
 */
/**
 * The most cloud that lands on any one point of a place's nebula tile, 0 to 1.
 *
 * `docs/decisions/0196-the-backdrop-is-rounded-out.md`.
 *
 * ⚠️ **THE HOLE THIS EXISTS TO CLOSE.** `tests/themes.test.ts` holds every ink to WCAG AA against a
 * place's backdrop — against `THEMES[theme].space`, the BARE colour. **The clouds are drawn on top of
 * that and nothing had ever counted them.** Measured when this was written: clouds OVERLAP, so the
 * accumulated alpha reaches **0.41 at Ember Nebula** where the per-cloud ceiling is 0.22, and the
 * worst ink loses **0.96 of its ratio** — leaving 0.54 over a floor
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` says a level may never spend.
 *
 * ⚠️ **THE FALLOFF IS MODELLED AS LINEAR IN DISTANCE, WHICH IS WHAT A TWO-STOP GRADIENT IS.** That is
 * an assumption about `drawNebula` rather than about the canvas, and it is the one thing here that
 * could silently stop being true — so `tests/sky.test.ts` asserts that gradient still has exactly two
 * stops, at 0 and 1. **Naming what would invalidate a measurement is the whole of
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`.**
 *
 * ⚠️ **AND THE ALTERNATIVE WAS MEASURED AND REFUSED.** A bound that gave every overlapping cloud its
 * FULL alpha at the sample point needs no model at all — and reads **0.63** at Ember Nebula, which
 * puts the worst ink at 4.43 and fails a floor the shipped game does not actually breach. It is
 * unreachable by construction: it asks five cloud centres to coincide. A guard that cannot be
 * satisfied by correct content is a guard that gets switched off.
 */
/**
 * How much cloud lands on one point, accumulated the way a canvas accumulates it.
 *
 * ⚠️ **ONE DESCRIPTION, AND IT WAS BRIEFLY TWO.** `skyCover` needs exactly this arithmetic and 0222
 * first copied it — which `npm run prove` reported immediately, because 0196's probe anchors on the
 * accumulation line and there were suddenly two of them. A second copy of a measurement is the drift
 * `tests/one-description.test.ts` exists for, and a duplicated anchor is that drift arriving where it
 * can be seen.
 */
function cloudsAt(clouds: readonly { x: number; y: number; r: number; alpha: number }[], x: number, y: number): number {
  let cover = 0;
  for (const cloud of clouds) {
    const d = Math.hypot(x - cloud.x, y - cloud.y);
    if (d < cloud.r) cover = 1 - (1 - cover) * (1 - cloud.alpha * (1 - d / cloud.r));
  }
  return cover;
}

export function cloudCover(size: number, theme: ThemeKind, step = 4): number {
  const clouds = nebulaField(size, theme);
  const at = (x: number, y: number): number => cloudsAt(clouds, x, y);
  let worst = 0;
  /*
    ⚠️ **EVERY CLOUD CENTRE IS SAMPLED AS WELL AS THE GRID, AND A GUARD FOUND OUT WHY.** A cloud's peak
    is exactly at its own centre, and a grid at any step can miss it — the first version read The
    Approach at **0.203** where its loudest single cloud is **0.205**, which is a cover that understates
    the sky by less than a percent and in the one direction that matters. The centres are where the
    peaks are, so they are read directly and the grid is what catches a PILE between them.
  */
  for (const cloud of clouds) {
    const cover = at(cloud.x, cloud.y);
    if (cover > worst) worst = cover;
  }
  for (let x = 0; x < size; x += step) {
    for (let y = 0; y < size; y += step) {
      const cover = at(x, y);
      if (cover > worst) worst = cover;
    }
  }
  return worst;
}

/**
 * The most GAS that lands on any one point of a place's sky — clouds and lit structure together.
 *
 * `docs/decisions/0222-the-background-is-not-black.md`.
 *
 * ⚠️ **`cloudCover` COUNTS CLOUDS, AND THE SKY STOPPED BEING ONLY CLOUDS IN 0211.** Structure marks
 * arrived that year and a lit one is drawn in the same gas colour a cloud is, on top of it; 0220 added
 * lit crests and wall faces, and 0221 added a whole ground layer. **Both of those decisions recorded
 * the gap and neither closed it** — *"what would actually check it is `cloudCover` accumulating
 * `STRUCTURE_OF`'s lit marks by their covered area alongside the clouds"* — and this is the change
 * that finally spends the headroom that measurement was protecting, so it is also the change that has
 * to know how much there is.
 *
 * ⚠️ **ONLY THE LIT MARKS, AND THE DARK ONES ARE FREE — THAT IS AN ARGUMENT, NOT AN OMISSION.** Every
 * ink this is measured for is bright (`player` `#7ae7ff`, `enemy` `#ff4d6d`, and so on through
 * `PALETTES`; the one dim ink, `sky`, is excluded from the floor by name). A mark drawn in the SPACE
 * colour makes the backdrop darker, which moves every one of those ratios **up**. Counting them would
 * be modelling a cost that does not exist, and the guard would then refuse detail that is free.
 *
 * ⚠️ **AND THE GROUND IS NOT COUNTED EITHER, FOR A DIFFERENT REASON.** It does not tint the backdrop —
 * it REPLACES it, opaquely — so where there is ground the contrast is against `THEMES[].ground`
 * outright, and 0221 already holds that darker than the sky in every palette. Two separate backdrops,
 * each held where it applies, rather than one blend that is true of neither.
 */
export function skyCover(size: number, theme: ThemeKind, share = 0.005, step = 4): number {
  const clouds = nebulaField(size, theme);
  const marks = STRUCTURE_OF[theme](size).filter((mark) => mark.lit);

  /** How much gas one lit mark lays on a point: its own alpha inside it, nothing outside. */
  const markAt = (mark: StructureMark, x: number, y: number): number => {
    if (mark.width === 0) return insidePolygon(mark.points, x, y) ? mark.alpha : 0;
    const reach = mark.width / 2;
    for (let i = 1; i < mark.points.length; i += 1) {
      if (nearSegment(mark.points[i - 1]!, mark.points[i]!, x, y) <= reach) return mark.alpha;
    }
    return 0;
  };

  const at = (x: number, y: number): number => {
    let cover = cloudsAt(clouds, x, y);
    for (const mark of marks) {
      const a = markAt(mark, x, y);
      if (a > 0) cover = 1 - (1 - cover) * (1 - a);
    }
    return cover;
  };

  /*
    ⚠️ **A SHARE OF THE AREA, AND NOT THE LOUDEST POINT — WHICH IS THE OPPOSITE OF `cloudCover` AND
    THE MEASUREMENT IS WHY.** A cloud is forty units across, so its peak is a REGION and a worst-point
    is honest about it; that is 0196's model and it is untouched. A lit structure mark is a few pixels
    wide, and four of them crossing composite to **0.94 over an area the size of a full stop.**
    Measured on Rime Shelf: peak 0.938, **0.32% of the tile above 0.7 and 0.00% above 0.9.** Taking
    that peak as *how bright the sky is* condemns a place for a coincidence, which is word for word
    what 0196 refused when it rejected a full-alpha bound — *"a guard that cannot be satisfied by
    correct content is a guard that gets switched off."*

    So this reports **the brightest level at least `share` of the tile reaches**. At half a percent a
    cloud's plateau still counts in full and four crossing hairlines do not.
  */
  const samples: number[] = [];
  for (let x = 0; x < size; x += step) for (let y = 0; y < size; y += step) samples.push(at(x, y));
  samples.sort((a, b) => b - a);
  return samples[Math.min(samples.length - 1, Math.floor(samples.length * share))] ?? 0;
}

/** Distance from a point to a segment. Squared internally; the root is taken once at the end. */
function nearSegment(a: number[], b: number[], x: number, y: number): number {
  const dx = b[0]! - a[0]!;
  const dy = b[1]! - a[1]!;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]!) * dx + (y - a[1]!) * dy) / len));
  return Math.hypot(x - (a[0]! + t * dx), y - (a[1]! + t * dy));
}

/** Even-odd containment, which is the rule `paintStructure` fills a closed mark under. */
function insidePolygon(points: readonly number[][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = [points[i]![0]!, points[i]![1]!];
    const [xj, yj] = [points[j]![0]!, points[j]![1]!];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function bakeNebula(
  atlas: Atlas,
  colour: string,
  glow: string,
  space: string,
  pixelsPerUnit: number,
  theme: ThemeKind = 'approach',
): void {
  const size = bakeSize(SPRITE_EXTENT.skyNebula, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  drawNebula(ctx, colour, glow, space, size, theme);
  (atlas.bitmaps as CanvasImageSource[])[SPRITE.skyNebula] = canvas;
}

/**
 * Re-bake the ground in the place's own land colour — 0221, on `bakeNebula`'s exact terms.
 *
 * ⚠️ **A NO-OP FOR A PLACE IN SPACE, AND THAT COSTS NOTHING BECAUSE THE LAYER IS NEVER BLITTED.**
 * `skyFor` leaves `skyGround` out of the sky of a place whose `ground` is `null`, so the stale bitmap
 * from the last planet sits in the atlas unread until the next planet overwrites it. The alternative
 * — clearing it at every boundary — is a full-tile canvas operation to make an invisible thing
 * invisible.
 */
export function bakeGround(
  atlas: Atlas,
  land: string,
  sky: string,
  glow: string,
  pixelsPerUnit: number,
  theme: ThemeKind = 'approach',
): void {
  if (GROUND_OF[theme] === null) return;
  const size = bakeSize(SPRITE_EXTENT.skyGround, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  drawGround(ctx, land, sky, glow, size, theme);
  (atlas.bitmaps as CanvasImageSource[])[SPRITE.skyGround] = canvas;
}

/**
 * Re-bake the landmark in the place's own gas colour — 0203, on `bakeNebula`'s exact terms.
 *
 * ⚠️ **A PALETTE IS PER STYLE AND KNOWS NOTHING ABOUT A PLACE**, so the atlas bake gives every
 * landmark the generic `sky` ink — `#2a2c44`, a cold blue-grey. Against Ember Nebula's deep maroon
 * that read as grey rock rather than as dust in glowing gas, which is
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` again: the geometry was right and the
 * relationship between the object and its background was wrong, and only the rig showed it.
 *
 * `space` is passed rather than taken from a palette because the columns are punched out of the gas
 * in the background colour — they are holes in the light, not shapes on top of it.
 */
export function bakeLandmark(
  atlas: Atlas,
  gas: string,
  glow: string,
  space: string,
  pixelsPerUnit: number,
  theme: ThemeKind = 'approach',
): void {
  const size = bakeSize(SPRITE_EXTENT.landmark, pixelsPerUnit);
  /*
    ⚠️ **ALL THREE CASTINGS, AT A LEVEL BOUNDARY** — 0225. One canvas each, drawn from one seed each,
    and it is the same 2.25MB bitmap three times over rather than a different object three times: what
    a level places is the same landmark, cast differently.

    ⚠️ **AND A PLACE THAT DRAWS NONE PAYS NOTHING**, because `drawLandmark` returns immediately on a
    `null` row — the canvases are still allocated, which is three empty bitmaps at a boundary that
    already re-bakes fifty-eight, and the alternative is a branch that has to stay in step with
    `LANDMARK_OF` from the outside.
  */
  for (let seed = 0; seed < LANDMARK_SLOTS.length; seed += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    drawLandmark(ctx, gas, glow, space, size, theme, seed);
    (atlas.bitmaps as CanvasImageSource[])[LANDMARK_SLOTS[seed]!] = canvas;
  }
}

/**
 * One tile of sky: a fixed field of dots, in the sky ink, clear of the seams.
 *
 * ⚠️ **The near layer is DIMMED, and it is dimmed at BAKE time.** Alpha per blit would be a canvas
 * state change inside the frame loop, which
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts; baked into the tile it costs
 * nothing and cannot be forgotten. Size alone put the stars below a bullet; the alpha is what puts
 * them behind the game.
 */
function drawSky(ctx: Pen, kind: SkyKind, size: number, theme: ThemeKind): void {
  const field = skyField(kind, size, theme);
  ctx.globalAlpha = field.alpha;
  /*
    ⚠️ **A capped line and a filled disc are the same mark at two lengths** — 0097. `lineCap: 'round'`
    means a streak's ends are the dot it would have been, so the two forms cannot look like two
    different pieces of art, and a `len` of zero degenerates to exactly the arc this used to draw.

    ⚠️ **`strokeStyle` is taken from the fill**, which `drawKind` has already set to the sky's ink —
    a second colour lookup here would be a second description of `src/content/palette.ts`'s answer.
  */
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineCap = 'round';
  for (const star of field.stars) {
    // 0196 — the layer's alpha is the ceiling and a mark may only sit under it.
    ctx.globalAlpha = field.alpha * star.dim;
    if (star.len <= 0) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.lineWidth = star.r * 2;
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(star.x + Math.cos(star.angle) * star.len, star.y + Math.sin(star.angle) * star.len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** One sprite, drawn into its own offscreen canvas at the resolution it will be blitted at. */
function bakeOne(
  kind: SpriteKind,
  palette: Palette,
  view: SpriteView,
  pixelsPerUnit: number,
  theme: ThemeKind,
): HTMLCanvasElement {
  /*
    Clamped so a zero-sized viewport or an absurd DPI cannot ask for a 0px or a 4096px sprite.

    ⚠️ **THE CEILING IS A RESOLUTION AND IT USED TO BE A PIXEL COUNT.** It was a flat 256px, which is
    what a 26-unit boss comes to at ten pixels per unit — so the number was always a resolution cap
    wearing a size cap's clothes, and it only looked like a size because nothing was bigger than a
    boss. A sky tile is `ACROSS_SPAN` units across (`src/content/sprites.ts`), four times the boss, and
    at a flat 256 it would have baked at 2.5 pixels per world unit and blitted at three times that:
    stars as blurry blobs. Stated as what it always meant.
    `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
  */
  const size = bakeSize(SPRITE_EXTENT[kind], pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('bakeAtlas: no 2D context — this browser cannot run the game');
  if (view === 'top') {
    // Point the shape at -y instead of +x. Placeholder-only: real top-down art is its own drawing.
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-size / 2, -size / 2);
  }
  drawKind(ctx, kind, palette, size, theme);
  return canvas;
}

/**
 * Bake every sprite for one palette and one view.
 *
 * `pixelsPerUnit` is CSS pixels per world unit times the device pixel ratio — the resolution the
 * bitmaps will actually be blitted at. Baking below it is a blurry game; baking far above it is
 * memory spent on detail nobody will see.
 *
 * ⚠️ **`map` rather than a loop that pushes, and it is the last link in a chain.**
 * `src/content/sprites.ts` is now the one description of what exists, what order it is in, and what
 * index it blits at. This is where that order becomes actual bitmaps, and a `for` loop with a
 * `push` in it can skip one — a `continue`, an early return, a conditional bake — which would slide
 * every sprite after it down by one and mis-draw the whole screen. `map` emits exactly one output
 * per input, in order, and a filter would have to be written down where a reader can see it.
 *
 * This file is on `tests/budget.test.ts`'s DELIBERATELY_COLD list: it allocates freely because it
 * runs at load and on rotation, never in a frame. Two `map`s here cost nothing.
 */
export function bakeAtlas(
  palette: Palette,
  view: SpriteView,
  pixelsPerUnit: number,
  theme: ThemeKind = 'approach',
): Atlas {
  return {
    view,
    theme,
    bitmaps: SPRITE_KINDS.map((kind) => bakeOne(kind, palette, view, pixelsPerUnit, theme)),
    extents: SPRITE_KINDS.map((kind) => SPRITE_EXTENT[kind]),
    pixelsPerUnit,
  };
}

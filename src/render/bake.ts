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

import type { Palette, PaletteName } from '../content/palette.ts';
import { THEMES, foeOf, lordOf, type FoeSkin, type LandLight, type ThemeKind } from '../content/themes.ts';
import { BOSSES } from '../content/bosses.ts';
import { SHOTS, SHOT_KINDS } from '../content/shots.ts';
import { LEVELS, LEVEL_KINDS } from '../content/levels.ts';
import { LANDMARK_SLOTS, SERPENT_BODY_DIAMETER, SPRITE, SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../content/sprites.ts';
import { BEAD_HEAD, EMBER_HEAD, WALL_RISE_MAX } from '../content/sprites.ts';
import { makeRng, type Rng } from '../sim/rng.ts';
import { coneOf } from '../content/volcano.ts';
import { POOLS_OF } from '../content/pools.ts';
import { VEINS_OF, trunkAt } from '../content/veins.ts';
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
  /*
    ── THE THREE THAT LET A HULL BE A CREATURE — 0276 ────────────────────────────────────────────

    ⚠️ **A body is a CURVE, and until these were here every boss edge was a straight line between
    authored points.** The serpent's spine is nine samples, so its body was eight straight quads with
    a visible corner at each join — `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` measures it,
    and measures that `bezierCurveTo` appeared ONCE in this whole file and not once in the boss
    painting at all.

    ⚠️ **THEY COST NOTHING AT RUNTIME.** This file is not in `HOT_FILES` (`tests/budget.test.ts`) —
    baking is cold, once, at boot and resize — and what the frame loop does afterwards is the same
    single blit. 0022 and 0025 count draw calls and allocations in the frame, and this touches neither.
  */
  | 'quadraticCurveTo'
  | 'bezierCurveTo'
  | 'rect'
  | 'closePath'
  | 'fill'
  | 'stroke'
  | 'fillRect'
  | 'createRadialGradient'
  | 'createLinearGradient'
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
 *
 * ⚠️ **0.24 → 0.27 when the view zoomed out (0364)**, because a streak 0.24 thick was 2.31 CSS pixels
 * across on 1280×720 and 0106's floor there is 2.5; 0.27 is about 2.6.
 */
/*
  ⚠️ **EXPORTED BY 0195, so the clamp on a place's `size` can be stated as the claim it actually is.**
  The comment above already argues that this number's whole point is being readable against
  `SHOTS.pulse.radius` by a person and by a test. What `tests/sky.test.ts` asserts is not this
  constant — it is that no place's field draws past it, whatever `SKY_STYLE_OF` says, which is a claim
  about the clamp and reddens when the clamp goes.
*/
export const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.27 };

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
  boss8Up: 'enemy',
  boss8Down: 'enemy',
  boss8Gape: 'enemy',
  boss8Shut: 'enemy',
  serpentBody: 'enemy',
  // The same skull with its horns grown — 0305. What it IS has not changed.
  boss8Horn2: 'enemy',
  boss8Horn2Up: 'enemy',
  boss8Horn2Down: 'enemy',
  boss8Horn2Gape: 'enemy',
  boss8Horn2Shut: 'enemy',
  boss8Horn3: 'enemy',
  boss8Horn3Up: 'enemy',
  boss8Horn3Down: 'enemy',
  boss8Horn3Gape: 'enemy',
  boss8Horn3Shut: 'enemy',
  /*
    ⚠️ **THE AURA MEANS NOTHING, SO IT WEARS AN INK THAT MEANS NOTHING — 0305.** It is in no pairing
    and has no reach, exactly as the exhaust is, and the exhaust is `flame` for the same reason: a
    decoration ink (0194) is the promise that nothing the player must find is drawn in it. `glass` is
    the deep cold blue, which is what the aura is at its roots; the paint itself is the lord's own,
    in `paintSerpentAura`.
  */
  serpentAura0: 'glass',
  serpentAura1: 'glass',
  serpentAura2: 'glass',
  serpentAura3: 'glass',
  serpentAura4: 'glass',
  serpentAura5: 'glass',
  serpentStorm0: 'glass',
  serpentStorm1: 'glass',
  serpentStorm2: 'glass',
  serpentStorm3: 'glass',
  serpentStorm4: 'glass',
  serpentStorm5: 'glass',
  // The crown's discharge — 0310, on the aura's own terms: it means nothing the player reads elsewhere.
  serpentFlare0: 'glass',
  serpentFlare1: 'glass',
  serpentFlare2: 'glass',
  boss9: 'enemy',
  boss9Up: 'enemy',
  boss9Down: 'enemy',
  boss9Gape: 'enemy',
  boss9Shut: 'enemy',
  boss9Barbed: 'enemy',
  boss9BarbedUp: 'enemy',
  boss9BarbedDown: 'enemy',
  boss9BarbedGape: 'enemy',
  boss9BarbedShut: 'enemy',
  // The ember is energy in the place's own fire, on the serpent's aura's terms — `glass`, which means
  // nothing the player reads anywhere else.
  volansEmber0: 'glass',
  volansEmber1: 'glass',
  volansEmber2: 'glass',
  volansEmber3: 'glass',
  volansEmber4: 'glass',
  volansEmber5: 'glass',
  boss10: 'enemy',
  boss11: 'enemy',
  boss11Chipped: 'enemy',
  boss11Broken: 'enemy',
  boss11Burnt: 'enemy',
  // Dead metal is still the creature it was — 0337.
  boss11Wreck: 'enemy',
  /*
    ⚠️ **THE FLAMES MEAN NOTHING, SO THEY WEAR AN INK THAT MEANS NOTHING — 0305's ARGUMENT, REUSED.**
    A decoration ink (0194) is the promise that nothing the player must find is drawn in it, and a
    fire round a hull is exactly that: it is in no pairing, it has no reach, and the thing that can
    kill you is the hull it is burning on. `flame` is the one of the three that is already a fire.
  */
  gyreFire0: 'flame',
  gyreFire1: 'flame',
  gyreFire2: 'flame',
  gyreFire3: 'flame',
  /*
    ⚠️ **THE HOUSING IS BACKGROUND, SO IT IS IN THE BACKGROUND'S INK — 0332.** `sky` is the one ink
    that must not stand out, and a landmark already takes it for the same reason: the seat is the
    wall the cog is set into, not a thing the player has to find. Drawing the mounting in `enemy`
    would put a ring of *this can kill you* round a hull the player is trying to read, which is
    0081's whole subject.
  */
  boss11Seat: 'sky',
  // The room's wall is the place, on the seat's own terms — 0335. `sky` is the ink nothing the
  // player must find is drawn in, and a wall is the thing they are found against.
  roomWall: 'sky',
  // The wall's caps are the wall — 0350.
  wallRise0: 'sky',
  wallRise1: 'sky',
  wallRise2: 'sky',
  wallRise3: 'sky',
  wallRise4: 'sky',
  wallRise5: 'sky',
  wallRise6: 'sky',
  wallRise7: 'sky',
  wallRise8: 'sky',
  wallRise9: 'sky',
  wallRise10: 'sky',
  wallRise11: 'sky',
  wallRise12: 'sky',
  boss12: 'enemy',
  boss13: 'enemy',
  boss14: 'enemy',
  bullet: 'bullet',
  /*
    ⚠️ **THE ENEMY INK, and this is the one ink assignment in the table that changed a rule** — 0081.
    `bullet` used to mean *a shot*, whoever fired it, so the player's own fire and the fire they had
    to dodge were the same colour as well as the same shape. It now means *the player's fire*, and
    what shoots back wears the same ink as what shot it.

    ⚠️ **That is colour carrying the SIDE**, which is the division
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` asks for: the player's own fire is
    never in the ink of what is trying to kill it, and `tests/legibility.test.ts` holds exactly that
    much. *Pink will hurt you.*

    ── AND *EVERY THREAT WEARS ONE INK* WAS A RULE HERE UNTIL 0295 ─────────────────────────────────

    `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md`. It was argued from a premise that
    stopped being true: *a spit is a square at 2.6 units and an enemy is a five-to-nine-unit
    silhouette, so sharing an ink costs nothing*. The bullet ladder then grew — the rock reached 7.4
    against the weaver's 5.0 — and the cost stopped being nothing. Hulls and the three commonest
    bullets are the same colour AND overlapping sizes, which is the reported defect in full: *"it's
    not just the size, it's the speed, vector, shape AND colour of those ships look very similar to a
    lot of enemy fire."*

    ⚠️ **NOTHING IS REPAINTED BY THAT REMOVAL AND THAT IS DELIBERATE.** What is gone is the
    REQUIREMENT. An ink is a per-kind authoring choice again — as the serpent's acid and void and the
    hydra's flame and frost already were — and which kinds move is a considered pass over the content,
    not a consequence of deleting a rule.
  */
  spit: 'enemy',
  lance: 'enemy',
  flak: 'enemy',
  // The serpent's two shots in their own inks — 0248, on 0098's argument that a boss with three
  // kinds of shot in one colour is one bullet wearing three shapes.
  acid: 'acid',
  void: 'void',
  /*
    ⚠️ **THE BALL IS IN THE VOID'S INK AND ITS DROPS IN THE ACID'S — 0311.** It carries both, and the two
    have to be tellable apart the instant it bursts: one object becomes sixteen, half of them the ink it
    was drawn in and half the other. So the hull is the void's ring and the acid is what churns inside it.
  */
  maw: 'void',
  mawHit: 'impact',
  droplet: 'acid',
  // The fish's flame in its own ink — 0249, on the same argument.
  flame: 'fire',
  // The volcanoes' rock in the fire ink — 0251: hot, and told from the flame by five times the
  // size and a shape with corners. A rock in a grey of its own would fail the floor every meaning
  // ink is held to on the dark places.
  rock: 'fire',
  // The frost ship's shard in its own ink — 0253: the one cold thing that hurts.
  frost: 'frost',
  // The fish's spine in the enemy's ink — 0262: a spine is told from a slab by its shape.
  spine: 'enemy',
  // The ripple and the curl in their place's ink — 0327, on 0296's rule that a raider's bullet takes
  // its place's colour. What tells them from the spit and the slab is the shape and the path.
  ripple: 'enemy',
  curl: 'enemy',
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
  // The arc's ink, which is the ship's (0241): the storm is the arc's special — 0374.
  stormBall: 'player',
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
  // The explosion's later frames are the blast's, so its ink — 0375.
  blastFire: 'hazard',
  blastSmoke: 'hazard',
  // The player's own ink, because a shield IS the player — it is the last thing between a hit and
  // the hull, and a shell drawn in the pickup ink would read as something to fly into.
  shieldOrb: 'player',
  // The seeker surge in the seeker's own ink, which is the purple asked for; the gun's in the gold
  // the hazard ink already is — 0373. Both are the player's, behind the ship and never a threat.
  auraHunt: 'ally',
  auraOverdrive: 'hazard',
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
  // The shoal — 0314. In the enemy's ink like every other body: what tells a minnow from a kite is
  // that it is going somewhere else, and a colour of its own would say *this one is not hostile*.
  minnow: 'enemy',
  minnowHit: 'impact',
  moonJelly: 'enemy',
  moonJellyHit: 'impact',
  kiteHit: 'impact',
  // The swift — 0328. A shared body, in the place's ink like the other eight.
  swift: 'enemy',
  swiftHit: 'impact',
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
  boss8GapeHit: 'impact',
  boss8ShutHit: 'impact',
  serpentBodyHit: 'impact',
  boss8Horn2Hit: 'impact',
  boss8Horn2GapeHit: 'impact',
  boss8Horn2ShutHit: 'impact',
  boss8Horn3Hit: 'impact',
  boss8Horn3GapeHit: 'impact',
  boss8Horn3ShutHit: 'impact',
  boss9Hit: 'impact',
  boss9GapeHit: 'impact',
  boss9ShutHit: 'impact',
  boss9BarbedHit: 'impact',
  boss9BarbedGapeHit: 'impact',
  boss9BarbedShutHit: 'impact',
  boss10Hit: 'impact',
  boss11Hit: 'impact',
  boss11ChippedHit: 'impact',
  boss11BrokenHit: 'impact',
  boss11BurntHit: 'impact',
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
  /*
    ⚠️ **THE FIRE INK, WHICH IS THE FIREBALL'S OWN AND NOT THE EXHAUST'S** — 0301. A trail behind a
    thing that will kill you has to read as part of that thing, so it wears what the ball wears; the
    ship's own plume is `glass`-dark `flame` on purpose and the two must never be confused.
    0295's test, asked of it: fire is fire, so this does NOT take the place's colour (0296).
  */
  ember0: 'fire',
  ember1: 'fire',
  ember2: 'fire',
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
  // The far land is the ground's own placeholder colour, for the ground's own reason — 0347.
  skyRange: 'space',
  // A landmark is sky ink like every other backdrop mark — 0069's *the sky is behind the game* is
  // untouched by 0203, which moved only what may be drawn, never what it is drawn in.
  landmark: 'sky',
  landmarkB: 'sky',
  landmarkC: 'sky',
  // A rock thrown from a landmark is part of it — 0347. `drawEmber` paints lava's own inks over this.
  ember: 'sky',
  bubble: 'sky',
  bubblePop: 'sky',
  veinBead: 'sky',
  /*
    ⚠️ **The PLAYER's ink, because the thing it marks is the player's box and nothing else's.**
    Enemies, bullets and pickups all cross this line freely — `src/sim/flight.ts` clamps the ship and
    only the ship — so drawing it in the enemy ink or a neutral one would say *a wall* when what is
    true is *your limit*. `docs/decisions/0074-the-box-is-drawn.md`.
  */
  bound: 'player',
};

/**
 * The bullets a PLACE colours — `docs/decisions/0296-a-bullet-belongs-to-its-place.md`.
 *
 * ⚠️ **DERIVED, NEVER LISTED.** It is *every shot whose ink is `enemy`*, read off `SHOTS`, so a
 * fifth raider bullet is covered on the day its row exists and a hand-kept list cannot go stale
 * beside it — `src/content/sprites.ts` records what that second description already cost once.
 *
 * ⚠️ **AND IT IS *WHOSE INK IS `enemy`* RATHER THAN *IS A SHOT*, WHICH IS THE WHOLE DISTINCTION.**
 * The serpent's `acid` and `void`, the fish's `flame`, the volcanoes' `rock` and the frost ship's
 * shard are shots too and are deliberately NOT here: those inks are what the thing IS, and a flame
 * that changed hue by level would teach the player something untrue about the world. 0295's test,
 * asked of each: *does it make sense for THIS THING to be hard?* Fire, yes. A raider's bullet, no.
 *
 * ⚠️ **Module scope, so the `Set` is built once at import.** `src/render/bake.ts` is not on
 * `tests/budget.test.ts`'s hot list — a bake happens when a place does, never in the frame loop.
 */
const PLACE_SHOTS: ReadonlySet<SpriteKind> = new Set(
  SHOT_KINDS.map((k) => SPRITE_KINDS[SHOTS[k].sprite]!).filter((sprite) => INK_OF[sprite] === 'enemy'),
);

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

/**
 * How much of the flash ink a hurt twin wears — 0278.
 *
 * ⚠️ **STRONG ENOUGH TO READ AS A HIT AT A GLANCE, WEAK ENOUGH TO LEAVE THE ANIMAL UNDER IT.** At 1
 * this is 0035's cutout, which is what play rejected; at a quarter a hit stops registering. 0.55 is
 * where the body's own colour still comes through and the whole shape still jumps.
 */
const FLASH_WASH = 0.55;

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
 * A filled billow about the sprite's centre, in PIXELS: a circle whose edge rolls in and out by
 * `wobble` of its radius over `lobes` lumps, never past `outer` — 0375's explosion. A sum of two sines
 * rather than a jitter, so it needs no stream and is the same billow on every bake. Translucent,
 * because fire is light and not body (0227).
 */
function billow(ctx: Pen, centre: number, outer: number, wobble: number, lobes: number, phase: number, colour: string, alpha: number): void {
  const base = outer / (1 + wobble);
  ctx.globalAlpha = Math.min(alpha, 0.85);
  ctx.fillStyle = colour;
  ctx.beginPath();
  const points = 72;
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const roll = 0.6 * Math.sin(lobes * a + phase) + 0.4 * Math.sin((lobes * 2 + 1) * a + phase * 1.7);
    const reach = base * (1 + wobble * roll);
    const x = centre + Math.cos(a) * reach;
    const y = centre + Math.sin(a) * reach;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
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
/*
  ── THE KIT THAT DRAWS A CREATURE — 0276 ─────────────────────────────────────────────────────────

  ⚠️ **THREE PRIMITIVES, AND THEY ARE WHAT `reports/the-vocabulary-is-the-ceiling-2026-09-08.md`
  MEASURED THE ABSENCE OF.** Every boss edge was a straight line between authored points, every boss
  fill was one of four flat tones, and the only stroke in a body was the outline round the whole of
  it. A serpent drawn in that vocabulary is a faceted green ribbon whatever its spine says, and no
  number of passes over the spine changes that — which is the question these answer.

  ⚠️ **THEY COST NOTHING IN THE FRAME.** `bake.ts` is not in `HOT_FILES`; the blit afterwards is the
  same blit. 0022 and 0025 are untouched, and that is measured rather than assumed —
  `tests/budget.test.ts` counts the draw calls.
*/

/**
 * Continue the current path along a SMOOTH curve through `points` — Catmull-Rom as cubic Béziers.
 *
 * ⚠️ **OPEN AND COMPOSABLE, so a hull can be curved WHERE IT IS A CREATURE and straight where it is
 * not.** A serpent's back is a curve and its fangs are corners; one call that smoothed a whole hull
 * would round the fins into lumps and the skull into a bean. An arm walks its own outline — a
 * `moveTo`, a curve down the back, lines round the jaw, a curve up the belly — exactly as it would
 * with `lineTo`, and `tests/paths.ts` flattens the result conservatively.
 *
 * ⚠️ **A sixth is the Catmull-Rom tangent and not a tuning knob.** It is the value that makes the
 * curve pass through every point with a continuous tangent; changing it would make the curve miss
 * the samples the hull is authored from, which is the one thing an outline may not do.
 */
function curveThrough(ctx: Pen, f: Frame, points: readonly Pt[]): void {
  const at = (i: number): Pt => points[Math.max(0, Math.min(points.length - 1, i))]!;
  const px = (x: number): number => f.half + x * f.r;
  const py = (y: number): number => f.half + y * f.r;
  // `lineTo` with no current point opens the sub-path, which is the canvas rule and what the pen does.
  ctx.lineTo(px(at(0)[0]), py(at(0)[1]));
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = at(i - 1);
    const [bx, by] = at(i);
    const [cx, cy] = at(i + 1);
    const [dx, dy] = at(i + 2);
    ctx.bezierCurveTo(
      px(bx + (cx - ax) / 6),
      py(by + (cy - ay) / 6),
      px(cx - (dx - bx) / 6),
      py(cy - (dy - by) / 6),
      px(cx),
      py(cy),
    );
  }
}

/**
 * One CLOSED smooth sub-path through `points` — `trace`, for a hull that is an animal.
 *
 * ⚠️ **THE WRAP IS THE POINT.** `curveThrough` clamps at its ends, which is right for an open contour
 * and wrong for a body: a closed curve whose ends clamp has a corner where it joins, and on a serpent
 * that corner lands under the jaw where the belly meets the skull. Indices wrap here instead, so the
 * tangent is continuous all the way round and there is no seam to find.
 */
function curveLoop(ctx: Pen, f: Frame, points: readonly Pt[]): void {
  const n = points.length;
  const at = (i: number): Pt => points[((i % n) + n) % n]!;
  const px = (x: number): number => f.half + x * f.r;
  const py = (y: number): number => f.half + y * f.r;
  ctx.moveTo(px(at(0)[0]), py(at(0)[1]));
  for (let i = 0; i < n; i++) {
    const [ax, ay] = at(i - 1);
    const [bx, by] = at(i);
    const [cx, cy] = at(i + 1);
    const [dx, dy] = at(i + 2);
    ctx.bezierCurveTo(
      px(bx + (cx - ax) / 6),
      py(by + (cy - ay) / 6),
      px(cx - (dx - bx) / 6),
      py(cy - (dy - by) / 6),
      px(cx),
      py(cy),
    );
  }
  ctx.closePath();
}

/**
 * A polygon filled with a LINEAR gradient from `from` to `to` — a form-shade across a body.
 *
 * ⚠️ **THIS IS WHAT GIVES A HULL VOLUME, and the boss painting had none of it.** Four flat tones
 * make every shape a paper cutout however good its outline is; one light direction across a body is
 * most of the difference between a green ribbon and a thing with a back and a belly.
 *
 * ⚠️ **`tests/paths.ts` RECORDS IT AS `'gradient'`, which is a colour and not a shape.** Every claim
 * the containment guards make is about geometry and alpha, so a gradient fill is measured exactly as
 * the flat fill it replaces — 0227's *paint on the hull* rather than *a hole cut in the void's ink*.
 */
function shaded(
  ctx: Pen,
  f: Frame,
  from: Pt,
  to: Pt,
  near: string,
  far: string,
  points: readonly Pt[],
  alpha = 1,
  smooth = false,
): void {
  const wash = ctx.createLinearGradient(
    f.half + from[0] * f.r,
    f.half + from[1] * f.r,
    f.half + to[0] * f.r,
    f.half + to[1] * f.r,
  );
  wash.addColorStop(0, near);
  wash.addColorStop(1, far);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = wash;
  ctx.beginPath();
  if (smooth) curveLoop(ctx, f, points);
  else trace(ctx, f, points);
  ctx.fill('evenodd');
  ctx.globalAlpha = 1;
}

/**
 * An OPEN stroked line ON the hull: a contour at an interior seam, a rim light, a scale.
 *
 * ⚠️ **[0264](../../docs/decisions/0264-the-real-bosses-are-drawn.md) REFUSED THIS, AND THE REASON
 * WAS A LIMIT OF THE HARNESS RATHER THAN OF THE PICTURE** — *"a stroked spine would be a mark the
 * containment guard cannot see."* `tests/paths.ts` now records a stroke's geometry and `strokeOutside`
 * holds it to the same silhouette every fill is held to, so the technique that makes the
 * predecessor's serpent work is measurable and therefore allowed.
 *
 * ⚠️ **AND IT IS NOT A SECOND OUTLINE.** `tests/accents.test.ts` holds exactly one stroke per body in
 * `palette.space` at the hull's own width on the hull's own path; every other stroke is paint, and is
 * held INSIDE the hull rather than counted. The invariant was always *one outline*, and it still is.
 *
 * ⚠️ **Round caps, always.** A butt cap ends a contour in a flat chisel edge, which reads as a cut
 * rather than as a line running out — and a round cap is also the shape `strokeOutside` measures.
 */
function seam(
  ctx: Pen,
  f: Frame,
  colour: string,
  width: number,
  points: readonly Pt[],
  alpha = 1,
  smooth = false,
): void {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = colour;
  ctx.lineWidth = width * f.r;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (smooth) curveThrough(ctx, f, points);
  else
    points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(f.half + x * f.r, f.half + y * f.r);
      else ctx.lineTo(f.half + x * f.r, f.half + y * f.r);
    });
  ctx.stroke();
  ctx.globalAlpha = 1;
}

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
  ⚠️ **NO MARK BELOW 0.145 OF `r`.** The ship is 7 units, which at the 1280×720 the play-tests are
  given on is a hull radius of about 17.6 CSS pixels since the view zoomed out (0364); 0106's floor of
  2.5 pixels is therefore a seventh of the radius, and `tests/accents.test.ts` measures every opaque
  mark below against it. The engine core is 0.15 wide for exactly that reason.
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
  [-0.74, -0.29],
  [-0.52, -0.29],
  [-0.52, -0.13],
  [-0.74, -0.13],
];

/** The hot core in the housing. */
const SHIP_CORE: readonly Pt[] = [
  [-0.77, -0.285],
  [-0.62, -0.285],
  [-0.62, -0.135],
  [-0.77, -0.135],
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
  [0.87, 0.02],
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
      [-0.65, -0.78 * side],
      [-0.47, -0.78 * side],
    ]);
  }
  // The keel, behind the canopy, in the trim ink — the seam down the hull.
  poly(ctx, f, palette.trim, [
    [-0.34, -0.075],
    [-0.1, -0.075],
    [-0.1, 0.075],
    [-0.34, 0.075],
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
    disc(ctx, f, shade(palette.glass, 0.5), -0.26, 0, 0.075);
    const fin = tier >= 2 ? SHIP_FIN_MK3 : tier >= 1 ? SHIP_FIN_MK2 : SHIP_FIN;
    for (const side of [1, -1] as const) {
      // The edge's root steps 0.03 into the host, because a pod's fin is only 0.12 tall and 0106's
      // floor is 0.145 of this radius since the view zoomed out (0364).
      poly(ctx, f, dark, [
        [fin[1]![0] + 0.03, (fin[1]![1] + 0.03) * side],
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
        [0.42, -0.3 * side],
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
  plain = false,
): void {
  LANDMARK_OF[theme]?.(ctx, ink, glow, space, size, seed, plain);
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
  ((ctx: Pen, ink: string, glow: string, space: string, size: number, seed: number, plain?: boolean) => void) | null
> = {
  approach: null,
  nebula: (ctx, ink, glow, space, size, seed) => drawPillars(ctx, ink, glow, space, size, seed),
  saurian: (ctx, _ink, glow, space, size, seed, plain = false) => drawVolcano(ctx, glow, space, size, seed, plain),
  labyrinth: null,
  rime: null,
  mire: null,
  core: (ctx, ink, _glow, space, size, seed) => drawHeart(ctx, ink, space, size, seed),
};

function drawPillars(ctx: Pen, ink: string, glow: string, space: string, size: number, seed: number): void {
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

    /*
      ⚠️ **A CURVE THROUGH THE KNOBS, AND IT WAS A STRAIGHT LINE BETWEEN THEM UNTIL 0345.** Eight
      segments a side is a column cut out with scissors once it is three hundred pixels of a desktop:
      the rim, which is the brightest line on it, zigzagged. Each knob is now the control point of a
      quadratic that runs from the midpoint before it to the midpoint after — so the edge still goes
      where the seed put it and has no corner anywhere. `Pen` has had the verb since 0276.
    */
    const through = (points: readonly (readonly [number, number])[]): void => {
      for (let i = 1; i < points.length - 1; i++) {
        const [x, y] = points[i]!;
        const [nx, ny] = points[i + 1]!;
        ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
      }
      const last = points[points.length - 1]!;
      ctx.lineTo(last[0], last[1]);
    };
    const trace = (): void => {
      ctx.beginPath();
      ctx.moveTo(windward[0]![0], windward[0]![1]);
      through(windward);
    };

    /*
      ⚠️ **A CROWN OF EMBER LIGHT BEHIND EACH COLUMN'S HEAD, DRAWN FIRST SO THE COLUMN CUTS INTO IT —
      0346.** Played: *"pillars could be more vibrant."* They were lit in the gas's BODY colour only —
      `LANDMARK_OF.nebula` threw the accent away — so the brightest thing on them was a dull mauve
      line. The place's own ember, as light with no edge (two stops, to nothing), is what the real
      ones are: dust with a star being born behind its tip.
    */
    /*
      ⚠️ **FITTED INSIDE THE BITMAP, BECAUSE THE FIRST ONE WAS NOT AND THE PHOTOGRAPH SHOWED A RULED
      LINE ACROSS THE SKY.** The tallest column's tip is a twentieth of the tile from its top edge, so
      a crown centred on it was cut off flat — 0204's *rectangle clipped around the gas*, again. It
      sits a little below the tip, behind the head, and is no bigger than its own distance to any edge.
    */
    const wanted = halfWidth * (column.far ? 2.6 : 3.4);
    const crownX = mid + drift;
    const crownY = tip + wanted * 0.45;
    const reachOf = Math.min(wanted, crownY, crownX, size - crownX);
    const crown = ctx.createRadialGradient(crownX, crownY, 0, crownX, crownY, reachOf);
    crown.addColorStop(0, rgba(glow, column.far ? 0.3 : 0.55));
    crown.addColorStop(1, rgba(glow, 0));
    ctx.globalAlpha = 1;
    ctx.fillStyle = crown;
    ctx.beginPath();
    ctx.arc(crownX, crownY, reachOf, 0, Math.PI * 2);
    ctx.fill();

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
    // Blunt, which is the word above: the same five points, rounded over rather than joined up.
    through([
      windward[windward.length - 1]!,
      [mid - tipHalf * 0.75 + drift, tip - reach],
      [mid - tipHalf * 0.15 + drift, tip - reach * 0.85],
      [mid + tipHalf * 0.05 + drift, tip + reach * 0.35],
      [mid + tipHalf * 0.6 + drift, tip - reach * 0.7],
      [mid + tipHalf + drift, tip + reach * 0.1],
    ]);
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
    const face: [number, number][] = windward.map(([x, y], s) => [x + spanAt(s / EDGE_STEPS) * 0.45, y]);
    ctx.beginPath();
    ctx.moveTo(face[0]![0], face[0]![1]);
    through(face);
    ctx.stroke();

    // A rim on the windward edge — the gas lit up where it meets the dust. It is the brightest thing
    // on the column and is what stops the silhouette reading as a flat cut-out.
    ctx.globalAlpha = column.far ? 0.4 : 0.85;
    ctx.lineWidth = Math.max(1, size * (column.far ? 0.005 : 0.01));
    // The rim is the ember and the face behind it is the gas — 0346, and 0223's rule that every lit
    // EDGE in a place takes its accent, which this one edge had been missing since it was written.
    ctx.strokeStyle = glow;
    trace();
    ctx.stroke();
    ctx.strokeStyle = ink;

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
function drawVolcano(ctx: Pen, glow: string, dark: string, size: number, seed: number, plain: boolean): void {
  /*
    ⚠️ **THE CONE RUNS TO THE BOTTOM OF THE BITMAP, BECAUSE THE LAND IS DRAWN OVER IT.** On a planet
    the land is painted after every landmark (0221), so a foot that stopped short of the far range
    would be a mountain hanging in the air — 0224's bench showed exactly that. The range closes over
    the lower half; what shows is the upper cone standing behind it.
  */
  /*
    ⚠️ **THE SEED SHAPES THE MOUNTAIN AND NOT ONLY ITS SMOKE, WHICH IS THE DIFFERENCE BETWEEN THREE
    CASTINGS AND ONE** — 0225. Height, width, crater and flank all move, so the three are three
    mountains. The cone is `coneOf`'s since 0347, because the frame has to throw rock out of the same
    crater this draws.
  */
  /*
    ⚠️ **`plain` IS A PALETTE WHOSE DECORATION IS THE VOID** — high contrast. There the fire is the
    place's own dim accent rather than lava, on `drawSky`'s terms for the stars.
  */
  const rng = makeRng('sky').stream(`saurian/volcano${seed}`);
  const cone = coneOf(seed);
  const foot = size;
  const peak = size * cone.peak;
  const mid = size * 0.5;
  const half = size * cone.half;
  const crater = size * cone.crater;
  const lava = plain ? glow : mix(glow, EMBER_INKS.ember, 0.7);
  const hot = plain ? glow : EMBER_INKS.core;
  // The sun is up and to the left, which is the side the smoke and the flanks are lit on.
  const sun = plain ? dark : mix(dark, glow, 0.32);
  const ash = mix(dark, '#000000', 0.25);

  /** A point on one flank, `u` of the way from the crater's lip (0) to the foot (1). */
  const flankAt = (side: number, u: number, spread = 1): [number, number] => [
    mid + side * (crater + (half - crater) * u ** cone.flank * spread),
    peak + u * (foot - peak),
  ];

  /*
    ── THE SMOKE, FIRST AND FURTHEST BACK, AND IT LEAVES THE PICTURE — 0347 ────────────────────────

    ⚠️ **TO THE TOP OF THE BITMAP AND PAST IT, BECAUSE A PLUME THAT ENDS IS A PLUME THAT WAS DRAWN.**
    Played: *"doesn't touch the sky."* The old column stopped a quarter of a tile over the crater, and
    since the bitmap's edge was on the screen it stopped on a ruled line. It now climbs until it is
    wider than it is tall and runs off the top of the bitmap, and the entry's `scale` and `lane` put
    that edge above the lane (`tests/places.test.ts`).

    ⚠️ **PUFFS AND NOT A POLYGON** — 0224's finding, kept: a path up one side and down the other joins
    its ends with a straight line at the top. Each puff is a soft body (drawn three times about its
    centre, 0345's edge technique), a sunlit cap up and to the left, and — low down — the underside
    lit orange by the crater it came out of.
  */
  const PUFFS = 30;
  const lean = rng.range(-0.08, 0.08);
  const puffs: { x: number; y: number; r: number; s: number }[] = [];
  for (let i = 0; i < PUFFS; i += 1) {
    const s = i / (PUFFS - 1);
    const y = peak - s * (peak + size * 0.06);
    // Tight over the crater and billowing by the top of the tile — squared, as it was.
    const r = size * (0.028 + 0.15 * s ** 1.4) * rng.range(0.8, 1.15);
    const x = mid + lean * s * size + rng.range(-0.5, 0.5) * r;
    puffs.push({ x, y, r, s });
  }
  for (const p of puffs) {
    for (const [grow, alpha] of [
      [1.25, 0.25],
      [1.1, 0.45],
      [1, 0.95],
    ] as const) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ash;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * grow, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const p of puffs) {
    // The sunlit cap: light with no edge, off-centre towards the sun.
    const cx = p.x - p.r * 0.35;
    const cy = p.y - p.r * 0.35;
    const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, p.r * 0.9);
    light.addColorStop(0, rgba(sun, 0.55));
    light.addColorStop(1, rgba(sun, 0));
    ctx.globalAlpha = 1;
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(cx, cy, p.r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    if (p.s > 0.3) continue;
    // And the crater's light on the underside of the lowest billows, dying out as they climb.
    const bx = p.x;
    const by = p.y + p.r * 0.45;
    const under = ctx.createRadialGradient(bx, by, 0, bx, by, p.r);
    under.addColorStop(0, rgba(lava, 0.6 * (1 - p.s / 0.3)));
    under.addColorStop(1, rgba(lava, 0));
    ctx.fillStyle = under;
    ctx.beginPath();
    ctx.arc(bx, by, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  /*
    ── THE CONE ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **CONCAVE FLANKS, WHICH IS THE ONE THING THAT MAKES IT A VOLCANO AND NOT A HILL.** Steep at the
    top, flaring at the foot — `u ** flank`. Traced through twenty points a side now rather than eight,
    because at the size 0347 draws it the eight showed as corners.

    ⚠️ **LIT FROM THE SUN'S SIDE, AND IN SHADOW ON THE OTHER**, across its width: one flat fill was the
    *"one graphic"* half of the report as much as the swell was.
  */
  const FLANK_STEPS = 20;
  const shade = ctx.createLinearGradient(mid - half * 0.6, 0, mid + half * 0.6, 0);
  shade.addColorStop(0, sun);
  shade.addColorStop(1, dark);
  ctx.globalAlpha = 1;
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(...flankAt(-1, 1));
  for (let s = FLANK_STEPS - 1; s >= 0; s -= 1) ctx.lineTo(...flankAt(-1, s / FLANK_STEPS));
  for (let s = 0; s <= FLANK_STEPS; s += 1) ctx.lineTo(...flankAt(1, s / FLANK_STEPS));
  ctx.closePath();
  ctx.fill();

  // Gullies: dark creases down the sunlit flank and pale ridges between them, each following the cone.
  ctx.lineCap = 'round';
  for (let g = 0; g < 7; g += 1) {
    const side = g % 2 === 0 ? -1 : 1;
    const spread = rng.range(0.15, 0.95);
    const from = rng.range(0.04, 0.2);
    ctx.globalAlpha = side < 0 ? 0.45 : 0.3;
    ctx.strokeStyle = side < 0 ? ash : sun;
    ctx.lineWidth = Math.max(1, size * 0.004);
    ctx.beginPath();
    ctx.moveTo(...flankAt(side, from, spread));
    for (let s = 1; s <= 10; s += 1) ctx.lineTo(...flankAt(side, from + (1 - from) * (s / 10), spread));
    ctx.stroke();
  }

  /*
    ── AND THE LIGHT, WHICH IS THE WHOLE SUBJECT ───────────────────────────────────────────────────

    ⚠️ **LAVA IS A LINE THAT GLOWS, DRAWN THREE TIMES** — a wide faint bloom, a body, and a hot core —
    so it lights the rock beside it rather than sitting on it as a stroke. Thin and tapering, never a
    wash: a glowing area on a mountainside reads as a lit slope, a glowing line as something moving.
  */
  const glowAt = ctx.createRadialGradient(mid, peak, 0, mid, peak, crater * 4);
  glowAt.addColorStop(0, rgba(hot, 0.95));
  glowAt.addColorStop(1, rgba(lava, 0));
  ctx.fillStyle = glowAt;
  ctx.beginPath();
  ctx.arc(mid, peak, crater * 4, 0, Math.PI * 2);
  ctx.fill();

  const FLOWS = 5;
  for (let i = 0; i < FLOWS; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const spread = rng.range(0.1, 0.75);
    const reach = rng.range(0.35, 0.75);
    const kink = rng.range(-0.04, 0.04) * size;
    for (const [width, alpha, colour] of [
      [0.022, 0.16, lava],
      [0.009, 0.7, lava],
      [0.0035, 0.95, hot],
    ] as const) {
      const SEGMENTS = 12;
      for (let s = 1; s <= SEGMENTS; s += 1) {
        const a = ((s - 1) / SEGMENTS) * reach;
        const b = (s / SEGMENTS) * reach;
        const [ax, ay] = flankAt(side, a, spread);
        const [bx, by] = flankAt(side, b, spread);
        // A sideways wander that is nothing at the lip and most of `kink` halfway down.
        const wa = Math.sin((a / reach) * Math.PI) * kink;
        const wb = Math.sin((b / reach) * Math.PI) * kink;
        ctx.globalAlpha = alpha * (1 - (a / reach) * 0.6);
        ctx.strokeStyle = colour;
        ctx.lineWidth = Math.max(1, size * width * (1 - (a / reach) * 0.75));
        ctx.beginPath();
        ctx.moveTo(ax + wa, ay);
        ctx.lineTo(bx + wb, by);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * A wall's cap where its face rises `rise` lane units across one twelve-unit tile — 0350.
 *
 * The stone below the face (larger `across`), which is the far wall's side; the near wall draws the
 * same cap turned half a circle, which keeps the slope and puts the stone on the other side of it.
 * Courses run parallel to the face — a sloped wall is laid along its slope — with mortar between them
 * and the coping lit along the face itself, as `roomWall`'s is.
 *
 * ⚠️ **THE FACE PASSES THROUGH THE TILE'S CENTRE**, so the painter places a cap at the midpoint of the
 * face across its tile and the two ends land on the knots either side. Every rise the tiers allow is
 * inside the tile: six units over twelve, against a half-tile of six.
 *
 * @param edge the tile's half-width in frame units — the tile runs from −edge to +edge.
 */
function paintWallCap(ctx: Pen, f: Frame, stone: string, edge: number, rise: number): void {
  const lift = (rise / 12) * edge;
  // The face at `x`, in frame units: through the centre, rising `rise` units across the tile.
  const faceY = (x: number): number => (x / edge) * lift;
  const under = (offset: number, depth: number, colour: string, alpha = 1): void =>
    poly(
      ctx,
      f,
      colour,
      [
        [-edge, faceY(-edge) + offset],
        [edge, faceY(edge) + offset],
        [edge, Math.min(edge, faceY(edge) + offset + depth)],
        [-edge, Math.min(edge, faceY(-edge) + offset + depth)],
      ],
      alpha,
    );
  const mortar = shade(stone, -0.55);
  // The stone, from the face to the bottom of the tile.
  under(0, edge * 2, stone);
  // Courses parallel to the face, each lit along its top and shaded along its bottom.
  const course = (edge * 2) / 3;
  for (let c = 0; c < 3; c++) {
    const top = c * course;
    under(top + 0.06, 0.1, shade(stone, 0.2), 0.8);
    under(top + course - 0.14, 0.14, shade(stone, -0.28), 0.7);
    if (c > 0) under(top, 0.06, mortar);
    // Head joints, staggered course by course, standing square to the lane.
    for (const x of c % 2 === 0 ? [-edge / 2, edge / 2] : [0]) {
      const y0 = faceY(x) + top;
      poly(ctx, f, mortar, [
        [x - 0.035, y0],
        [x + 0.035, y0],
        [x + 0.035, Math.min(edge, y0 + course)],
        [x - 0.035, Math.min(edge, y0 + course)],
      ]);
    }
  }
  // The coping: the face itself, lit.
  under(0, 0.07, shade(stone, 0.5));
}

/**
 * The acid a bubble is made of — 0353. Fixed, on the ember's terms: only the Mire's pools bubble.
 */
const ACID = { rim: '#8ff08a', skin: '#4ad85a' } as const;

/**
 * A bubble on the acid — 0353: a thin bright rim round a faint skin, and a glint. Or the pop it ends
 * in: the rim broken into droplets flying off, and nothing in the middle.
 *
 * ⚠️ **HOLLOW, BECAUSE A SHOT IS SOLID.** It sits low in the lane where shots are read and it is
 * under a shot's size (`SPRITE_EXTENT`); a filled disc that size would be a bullet with no owner. A
 * ring with light through it is the one round thing a shot never looks like.
 *
 * @param plain the palette's sky ink where decoration is the void — high contrast — else `null`.
 */
function drawBubble(ctx: Pen, size: number, popped: boolean, plain: string | null): void {
  const c = size / 2;
  const r = size * 0.36;
  const rim = plain ?? ACID.rim;
  ctx.globalAlpha = 1;
  if (!popped) {
    ctx.fillStyle = rgba(plain ?? ACID.skin, 0.18);
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(rim, 0.85);
    ctx.lineWidth = Math.max(1, size * 0.09);
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
    // The glint, up and to the left, where the light over the swamp catches it.
    ctx.fillStyle = rgba(rim, 0.9);
    ctx.beginPath();
    ctx.arc(c - r * 0.4, c - r * 0.4, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Six droplets thrown out round where the rim was.
  ctx.fillStyle = rgba(rim, 0.8);
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * r * 1.05, c + Math.sin(a) * r * 1.05, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A bead of the heart's pulse — 0354: a bright head leading along the vessel, a tail of red light
 * behind it falling to nothing.
 *
 * ⚠️ **POINTING ALONG +x, BECAUSE `blit`'S TURN IS MEASURED FROM THERE** (0306): `paintPulse` turns
 * it to the vein's own heading, so the light flows down the vessel.
 *
 * ⚠️ **THE HEAD IS `BEAD_HEAD` OF THE BITMAP ACROSS AND NO MORE** — under a shot's size — and the
 * rest is light. A round glow alone read as one more star; a head with a tail reads as something
 * moving through the vein.
 *
 * @param plain the palette's sky ink where decoration is the void — high contrast — else `null`.
 */
function drawBead(ctx: Pen, size: number, plain: string | null): void {
  const r = (BEAD_HEAD * size) / 2;
  const hx = size - r * 2.2;
  const hy = size / 2;
  const red = plain ?? '#ff5c7a';
  const tail = ctx.createLinearGradient(hx, hy, size * 0.02, hy);
  tail.addColorStop(0, rgba(red, 0.6));
  tail.addColorStop(1, rgba(red, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(hx, hy - r * 0.9);
  ctx.quadraticCurveTo(size * 0.4, hy - r * 0.3, size * 0.02, hy);
  ctx.quadraticCurveTo(size * 0.4, hy + r * 0.3, hx, hy + r * 0.9);
  ctx.closePath();
  ctx.fill();
  const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 2.2);
  halo.addColorStop(0, rgba(red, 0.65));
  halo.addColorStop(1, rgba(red, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(hx, hy, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plain ?? '#ffd6e2';
  ctx.beginPath();
  ctx.arc(hx, hy, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A rock thrown out of a crater: a hot head leading, a tail of light behind it — 0347.
 *
 * ⚠️ **POINTING ALONG +x, BECAUSE `blit`'S TURN IS MEASURED FROM THERE** (0306): the painter turns it
 * to its own heading, so the tail always trails the way it came.
 *
 * ⚠️ **THE HEAD IS `EMBER_HEAD` OF THE BITMAP ACROSS AND NO MORE**; the tail and the halo are light
 * falling to nothing, which is what keeps a moving mark in the sky from reading as a shot.
 *
 * @param plain the palette's sky ink where decoration is the void — high contrast — else `null`.
 */
function drawEmber(ctx: Pen, size: number, plain: string | null): void {
  const r = (EMBER_HEAD * size) / 2;
  const hx = size - r * 2.2;
  const hy = size / 2;
  /*
    ⚠️ **A COOLING ROCK AND NOT A SHOT, WHICH IS WHY IT IS DULLER THAN LAVA.** It shares the lane with
    the player's orange shots and the foes' red ones; what separates it is a tail, an arc, a slow
    drift and a size under both — and a body a third of the way to coal, so the brightest thing about
    it is a small core rather than the whole mark. The boss-fight photograph is what asked for this.
  */
  const body = plain ?? mix(EMBER_INKS.ember, EMBER_INKS.coal, 0.35);
  const core = plain ?? EMBER_INKS.gold;
  // The tail: a thin wedge from the head back towards the far edge, fading to nothing.
  const tail = ctx.createLinearGradient(hx, hy, size * 0.04, hy);
  tail.addColorStop(0, rgba(plain ?? EMBER_INKS.gold, 0.45));
  tail.addColorStop(1, rgba(body, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(hx, hy - r * 0.8);
  ctx.quadraticCurveTo(size * 0.4, hy - r * 0.25, size * 0.04, hy);
  ctx.quadraticCurveTo(size * 0.4, hy + r * 0.25, hx, hy + r * 0.8);
  ctx.closePath();
  ctx.fill();
  // A halo around the head, then the head, then its white-hot heart.
  const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 2.1);
  halo.addColorStop(0, rgba(body, 0.55));
  halo.addColorStop(1, rgba(body, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(hx, hy, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(hx, hy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(hx + r * 0.2, hy, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
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
export type GroundArt = (ctx: Pen, land: string, sky: string, glow: string, size: number, light?: LandLight) => void;

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
  saurian: (ctx, land, sky, glow, size, light) => drawJungle(ctx, land, sky, glow, size, light),
  labyrinth: null,
  rime: (ctx, land, sky, glow, size, light) => drawIce(ctx, land, sky, glow, size, light),
  mire: (ctx, land, sky, glow, size, light) => drawEnclosure(ctx, land, sky, glow, size, light),
  core: null,
};

/**
 * A planet's far land, in its own layer behind the ground and moving slower — or `null` for a planet
 * whose land is one distance — `docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md`.
 *
 * ⚠️ **OPAQUE ON `GROUND_OF`'s TERMS AND HELD BY THE SAME GUARDS**: a mass that crosses the tile and
 * runs off the bottom of the world, with an edge on the lane. What is behind it is the weather and
 * the landmark, which is exactly what should show over a range — and a volcano standing behind it
 * has its foot hidden by it, which is what `tests/places.test.ts` checks the landmark against now.
 */
export const RANGE_OF: Record<ThemeKind, GroundArt | null> = {
  approach: null,
  nebula: null,
  saurian: (ctx, land, sky, glow, size, light) => drawRange(ctx, land, sky, glow, size, light),
  labyrinth: null,
  rime: (ctx, land, sky, glow, size, light) => drawBergs(ctx, land, sky, glow, size, light),
  mire: (ctx, land, sky, glow, size, light) => drawSwamp(ctx, land, sky, glow, size, light),
  core: null,
};

function drawGround(ctx: Pen, land: string, sky: string, glow: string, size: number, theme: ThemeKind, light?: LandLight): void {
  GROUND_OF[theme]?.(ctx, land, sky, glow, size, light);
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

/*
  ── SAURIAN BELT: A JUNGLE UNDER A RANGE — 0347 ────────────────────────────────────────────────────

  Played: *"the closer layers and sky layers are a monotone blue with no detail to them, it doesn't
  scream jungle world at all."* What shipped was three ridgelines as random walks in three tones of
  one blue-black — straight segments, one hex each, and at 1080p the photograph showed the tile seam.

  ⚠️ **TWO LAYERS NOW, AT TWO RATES, BECAUSE A JUNGLE UNDER MOUNTAINS IS THREE DISTANCES.** The range
  is `RANGE_OF.saurian`, drawn after the weather and moving at its own slower rate; the canopy and the
  leaves going past are `GROUND_OF.saurian`, drawn last and fastest.

  ⚠️ **EVERY EDGE IS A SUM OF SINES WHOSE PERIODS DIVIDE THE TILE** — the handover's technique table,
  and the reason there is no seam: periodic in height and in slope, so the tile joins without a kink.
  Every crown and frond near an edge is drawn again one tile over, on 0206's terms.

  ⚠️ **NOTHING HERE IS LIGHTER THAN THE PLACE'S STATED `land` COLOURS**, which `tests/places.test.ts`
  holds to the gameplay floor. A gradient runs between a stated colour and something darker; mist is
  the far colour laid over something darker. The one exception is a hairline rim in the place's
  accent, which is `skyCover`'s own argument about lines a few pixels wide.
*/

/** A sum of sines over the tile: `[cycles, amplitude, phase]`, every `cycles` a whole number. */
function waves(x: number, size: number, terms: readonly (readonly [number, number, number])[]): number {
  let y = 0;
  for (const [cycles, amp, phase] of terms) y += amp * Math.sin((2 * Math.PI * cycles * x) / size + phase);
  return y;
}

/**
 * Sharp peaks over broad valleys: `1 − |sin|` has a cusp where the sine crosses zero, and a power
 * well over 1 narrows it, which is what a summit is. At 1.6 the first photograph read as scallops —
 * round valleys between cusps, a row of clouds rather than a range.
 */
function summits(x: number, size: number, terms: readonly (readonly [number, number, number])[]): number {
  let y = 0;
  for (const [cycles, amp, phase] of terms) y += amp * (1 - Math.abs(Math.sin((Math.PI * cycles * x) / size + phase))) ** 3;
  return y;
}

/** A crest as points across the tile, from a height function in tile fractions. */
function crestOf(size: number, height: (x: number) => number, samples = 160): number[][] {
  const out: number[][] = [];
  for (let i = 0; i <= samples; i += 1) {
    const x = (i / samples) * size;
    out.push([x, height(x) * size]);
  }
  return out;
}

/** Fill under a crest to the bottom of the tile in `fill` — a colour or a gradient — at full alpha. */
function fillUnder(ctx: Pen, fill: string | CanvasGradient, crest: readonly number[][], size: number): void {
  ctx.globalAlpha = 1;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(crest[0]![0]!, crest[0]![1]!);
  for (let i = 1; i < crest.length; i += 1) ctx.lineTo(crest[i]![0]!, crest[i]![1]!);
  ctx.lineTo(size, size);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fill();
}

/** A vertical two-stop gradient between tile heights `from` and `to`. */
function vertical(ctx: Pen, size: number, from: number, top: string, to: number, bottom: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, from * size, 0, to * size);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

/**
 * The far range: two ridges of peaks, the back one hazier, with mist lying in the valley between.
 *
 * ⚠️ **AIR IS WHAT MAKES A MOUNTAIN FAR, AND AIR IS LIGHTEST LOW DOWN.** So each ridge is darkest at
 * its summits and pales towards its foot, and the back ridge is paler than the front one — the two
 * cues that survive everything being opaque.
 */
function drawRange(ctx: Pen, land: string, _sky: string, glow: string, size: number, light?: LandLight): void {
  const far = light?.far ?? land;
  const back = (x: number): number =>
    0.578 -
    summits(x, size, [[2, 0.05, 0.4], [5, 0.035, 1.3], [11, 0.014, 2.2], [23, 0.005, 0.7]]) +
    waves(x, size, [[1, 0.008, 0.9], [3, 0.006, 2.3]]);
  const front = (x: number): number =>
    0.612 -
    summits(x, size, [[3, 0.032, 2.6], [7, 0.02, 0.2], [17, 0.007, 1.1]]) +
    waves(x, size, [[2, 0.006, 2.9], [5, 0.004, 0.6]]);

  const backCrest = crestOf(size, back);
  fillUnder(ctx, vertical(ctx, size, 0.5, mix(far, land, 0.3), 0.6, far), backCrest, size);
  // The sun on the summits, as a line — the place's accent, faint, on the far rock.
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = glow;
  ctx.lineWidth = Math.max(1, size * 0.0016);
  ctx.beginPath();
  ctx.moveTo(backCrest[0]![0]!, backCrest[0]![1]!);
  for (let i = 1; i < backCrest.length; i += 1) ctx.lineTo(backCrest[i]![0]!, backCrest[i]![1]!);
  ctx.stroke();
  // Mist lying in the valley behind the near ridge: the far colour, thickening downwards.
  ctx.globalAlpha = 1;
  ctx.fillStyle = vertical(ctx, size, 0.545, rgba(far, 0), 0.59, rgba(far, 0.9));
  ctx.fillRect(0, 0.545 * size, size, 0.045 * size);
  ctx.fillStyle = rgba(far, 0.9);
  ctx.fillRect(0, 0.59 * size, size, size - 0.59 * size);

  const frontCrest = crestOf(size, front);
  const near = mix(far, land, 0.55);
  fillUnder(ctx, vertical(ctx, size, 0.56, near, 0.7, mix(near, far, 0.5)), frontCrest, size);
  /*
    Forest on the near ridge: small crowns riding its crest, so it is a wooded ridge and not a cut-out.
    ⚠️ Under 0.9 of a world unit across at their largest (`0.0045` of a 200-unit tile), which is 0069's
    band for anything the sky draws — a speck on a ridge is never read as a shot.
  */
  const rng = makeRng('sky').stream('saurian/rangeTrees');
  ctx.globalAlpha = 1;
  ctx.fillStyle = near;
  for (let x = 0; x < size; x += size * rng.range(0.004, 0.008)) {
    const r = size * rng.range(0.0022, 0.0045);
    for (const dx of [-size, 0, size]) {
      const cx = x + dx;
      if (cx + r < 0 || cx - r > size) continue;
      ctx.beginPath();
      ctx.arc(cx, front(x) * size + r * 0.4, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Mist in the valley: the far colour lying over the foot of the near ridge.
  ctx.fillStyle = vertical(ctx, size, 0.6, rgba(far, 0), 0.66, rgba(far, 0.85));
  ctx.fillRect(0, 0.6 * size, size, 0.06 * size);
  ctx.fillStyle = far;
  ctx.fillRect(0, 0.66 * size, size, size - 0.66 * size);
  ctx.globalAlpha = 1;
}

/**
 * The jungle: a canopy of crowns catching the sun, a nearer and darker row below it, and fronds
 * sliding past along the bottom of the screen.
 */
function drawJungle(ctx: Pen, land: string, _sky: string, glow: string, size: number, light?: LandLight): void {
  const canopy = light?.canopy ?? land;
  const lit = light?.lit ?? land;
  const rng = makeRng('sky').stream('saurian/jungle');

  /**
   * One row of trees: a rolling crest, a crown every few units along it, each crown lit on its sun
   * side, and the body filled to the bottom of the tile.
   */
  const row = (
    crest: (x: number) => number,
    body: string,
    sunlit: string,
    radius: readonly [number, number],
    emergent: number,
    rim: number,
  ): void => {
    fillUnder(ctx, vertical(ctx, size, 0.62, body, 0.76, mix(body, land, 0.7)), crestOf(size, (x) => crest(x) + radius[1] * 0.6), size);
    /*
      ⚠️ **A CROWN IS A CLUSTER OF LOBES, NOT A DISC.** One circle per tree came out of the first
      photograph as a row of green balls, and the tall ones as lollipops. Three to five lobes of
      unequal size, the upper ones smaller, read as foliage; a tall tree stands on a visible trunk.
    */
    const lobes: { x: number; y: number; r: number }[] = [];
    const trunks: { x: number; top: number; foot: number; width: number }[] = [];
    for (let x = 0; x < size; ) {
      const tall = rng.range(0, 1) < emergent;
      const r = size * rng.range(radius[0], radius[1]) * (tall ? 1.5 : 1);
      const base = crest(x) * size + r * 0.3;
      /*
        A tall tree is an emergent: a short trunk above the canopy and a crown wider than it is tall —
        an umbrella. The second photograph's was a round crown on a long stick, which is a lollipop.
      */
      const cy = base - (tall ? r * 1.3 : 0);
      if (tall) trunks.push({ x, top: cy, foot: base + r * 0.5, width: r * 0.16 });
      const count = tall ? 6 : 3 + Math.floor(rng.range(0, 2));
      for (let l = 0; l < count; l += 1) {
        const a = Math.PI * (1.1 + (0.8 * l) / Math.max(1, count - 1)) + rng.range(-0.2, 0.2);
        const d = l === 0 ? 0 : r * rng.range(0.45, 0.7) * (tall ? 1.5 : 1);
        const flat = tall ? 0.35 : 0.8;
        lobes.push({ x: x + Math.cos(a) * d, y: cy + Math.sin(a) * d * flat, r: r * (l === 0 ? (tall ? 0.8 : 1) : rng.range(0.55, 0.75)) });
      }
      x += r * rng.range(1.1, 1.7);
    }
    ctx.lineCap = 'round';
    for (const t of trunks) {
      for (const dx of [-size, 0, size]) {
        if (t.x + dx < -t.width || t.x + dx > size + t.width) continue;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = mix(body, land, 0.6);
        ctx.lineWidth = Math.max(1, t.width);
        ctx.beginPath();
        ctx.moveTo(t.x + dx, t.foot);
        ctx.quadraticCurveTo(t.x + dx + t.width * 2, (t.top + t.foot) / 2, t.x + dx, t.top);
        ctx.stroke();
      }
    }
    for (const c of lobes) {
      for (const dx of [-size, 0, size]) {
        const cx = c.x + dx;
        if (cx + c.r * 1.2 < 0 || cx - c.r * 1.2 > size) continue;
        // The lobe, then the sun on its upper-left as light with no edge — kept INSIDE the lobe, since
        // the first draft's spilled past it as a glowing fringe — then a rim of the accent.
        ctx.globalAlpha = 1;
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(cx, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        const sx = cx - c.r * 0.25;
        const sy = c.y - c.r * 0.3;
        const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, c.r * 0.6);
        sun.addColorStop(0, sunlit);
        sun.addColorStop(1, rgba(sunlit, 0));
        ctx.fillStyle = sun;
        ctx.beginPath();
        ctx.arc(sx, sy, c.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = rim;
        ctx.strokeStyle = glow;
        ctx.lineWidth = Math.max(1, size * 0.0012);
        ctx.beginPath();
        ctx.arc(cx, c.y, c.r * 0.96, Math.PI * 1.1, Math.PI * 1.5);
        ctx.stroke();
      }
    }
  };

  // The canopy, lane 72 to 80 or so, and a nearer, darker row under it around lane 88.
  row(
    (x) => 0.617 + waves(x, size, [[2, 0.01, 0.7], [5, 0.006, 2.1], [11, 0.003, 0.3]]),
    canopy,
    lit,
    [0.009, 0.017],
    0.07,
    0.3,
  );
  row(
    (x) => 0.682 + waves(x, size, [[3, 0.008, 1.9], [7, 0.005, 0.4]]),
    mix(canopy, land, 0.45),
    mix(lit, land, 0.35),
    [0.016, 0.026],
    0,
    0.22,
  );

  /*
    ── THE NEAR LEAVES, WHICH ARE WHAT GOES PAST FASTEST ─────────────────────────────────────────

    Clumps of fronds standing up out of the bottom of the screen, in the land's own darkest colour
    with a thread of sun along each spine. ⚠️ **ROOTED BELOW THE LANE (tile 0.78) AND NOT AT THE TILE'S
    EDGE**, so they are features standing on the land rather than a second mass claiming to run off
    the world — `tests/places.test.ts`'s masses are the fills that reach an edge, and these do not.
  */
  const leaf = mix(land, canopy, 0.12);
  const CLUMPS = 9;
  for (let k = 0; k < CLUMPS; k += 1) {
    const base = ((k + rng.range(0.1, 0.9)) / CLUMPS) * size;
    const fronds = 4 + Math.floor(rng.range(0, 4));
    // Tall enough to stand up against the canopy's lit crowns, which is the only thing a silhouette
    // this dark can be seen against — the first draft stopped below them and was invisible.
    const height = size * rng.range(0.1, 0.15);
    for (let f = 0; f < fronds; f += 1) {
      // Every draw before the wrap, so the copy one tile over is the same frond — 0206.
      const lean = rng.range(-1, 1);
      const reach = height * rng.range(0.7, 1);
      const droop = rng.range(0.55, 0.8);
      for (const dx of [-size, 0, size]) {
        const bx = base + dx;
        if (bx + reach * 1.6 < 0 || bx - reach * 1.6 > size) continue;
        const by = size * 0.78;
        // A spine that rises and arcs over: control point above the base, tip out to the side and down.
        const cx = bx + lean * reach * 0.5;
        const cy = by - reach * 1.15;
        const tx = bx + lean * reach * 1.3;
        const ty = by - reach * droop;
        const at = (t: number): [number, number] => [
          (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * tx,
          (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ty,
        ];
        ctx.globalAlpha = 1;
        ctx.fillStyle = leaf;
        const LEAFLETS = 16;
        for (let i = 2; i < LEAFLETS; i += 1) {
          const t = i / LEAFLETS;
          const [px, py] = at(t);
          const [qx, qy] = at(t + 0.02);
          const heading = Math.atan2(qy - py, qx - px);
          const long = reach * 0.34 * Math.sin(Math.PI * t) + reach * 0.04;
          for (const side of [-1, 1]) {
            // Each leaflet droops: out from the spine at about sixty degrees, then down, a thin blade.
            const a = heading + side * 1.05;
            const ex = px + Math.cos(a) * long;
            const ey = py + Math.sin(a) * long + long * 0.35;
            ctx.beginPath();
            ctx.moveTo(px - Math.cos(heading) * long * 0.08, py - Math.sin(heading) * long * 0.08);
            ctx.quadraticCurveTo(px + Math.cos(a) * long * 0.5, py + Math.sin(a) * long * 0.5 - long * 0.08, ex, ey);
            ctx.lineTo(px + Math.cos(heading) * long * 0.1, py + Math.sin(heading) * long * 0.1);
            ctx.closePath();
            ctx.fill();
          }
        }
        // The sun along the middle of the spine only: drawn base to tip, the second photograph showed
        // every frond as a pale arch standing over its own leaves — wire, not a plant.
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = glow;
        ctx.lineWidth = Math.max(1, size * 0.0012);
        ctx.beginPath();
        ctx.moveTo(...at(0.2));
        for (let i = 1; i <= 8; i += 1) ctx.lineTo(...at(0.2 + (0.6 * i) / 8));
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * ── RIME SHELF: FAR MORE ICE ──────────────────────────────────────────────────────────────────────
 *
 * Asked for: *"needs to be far far more icy — different whites and blues and aquas and teals etc."*
 * Answered on the handover: *"an off-white balanced colour… I'll see how it plays out"*, with the
 * floor and the foe inks left where they are.
 *
 * ⚠️ **THE PALEST ICE IS AS PALE AS THE FLOOR ALLOWS, AND THAT IS NOT WHITE.** Every colour the land
 * is lit in is held against every gameplay ink (0347), and the darkest of them — `void`, a magenta at
 * luminance 0.35 — needs whatever it crosses under 0.083 to keep 3:1. A white is about 0.8. So the
 * ice's whites are its *palest* tones rather than white ones: `lit`, a desaturated slate at 0.076,
 * the lightest thing on the land, set against much darker blues so it reads as the light on the ice.
 * Everything else here is mixed DOWN from the three stated colours, and a mix of colours under the
 * ceiling is under it — so the guard over the three holds every pixel of the land.
 *
 * ⚠️ **FACETED, BECAUSE THAT IS WHAT MAKES ICE READ AS ICE.** Crests are sampled at a fixed number of
 * knots and drawn as straight facets between them, and each facet takes the light by which way it
 * leans: the rising ones are lit, the falling ones in shadow. Every profile is a sum of whole cycles
 * per tile, so it meets itself at the seam in height and in slope.
 */

/**
 * A band of flat faces hanging from a crest: a quadrilateral under each segment, down to the crest
 * shifted by a depth that varies knot to knot, so neighbours share their edges and the band reads as
 * one faceted face rather than a row of teeth. Each takes the light by its lean — rising to the right
 * is sunward, falling is in shadow, and nearly level is the face's own colour.
 *
 * ⚠️ The depth is a whole number of cycles over the knots, so the band's foot meets itself at the seam.
 */
function facets(ctx: Pen, crest: readonly number[][], depth: number, lit: string, level: string, shadow: string): void {
  const knots = crest.length - 1;
  const foot = (k: number): number => depth * (0.65 + 0.35 * Math.sin((2 * Math.PI * 5 * k) / knots + 0.8));
  ctx.globalAlpha = 1;
  for (let k = 0; k < knots; k += 1) {
    const a = crest[k]!;
    const b = crest[k + 1]!;
    // Up the screen is a smaller y.
    const rise = (a[1]! - b[1]!) / (b[0]! - a[0]!);
    ctx.fillStyle = rise > 0.12 ? lit : rise < -0.12 ? shadow : level;
    ctx.beginPath();
    ctx.moveTo(a[0]!, a[1]!);
    ctx.lineTo(b[0]!, b[1]!);
    ctx.lineTo(b[0]!, b[1]! + foot(k + 1));
    ctx.lineTo(a[0]!, a[1]! + foot(k));
    ctx.closePath();
    ctx.fill();
  }
}

/** A crest as straight segments between `knots` evenly spaced samples — angular, and periodic. */
function knotted(size: number, height: (x: number) => number, knots: number): number[][] {
  const out: number[][] = [];
  for (let k = 0; k <= knots; k += 1) out.push([(k / knots) * size, height((k / knots) * size) * size]);
  return out;
}

/**
 * The far bergs, in their own slower layer (0347's `RANGE_OF`): a line of peaks and tables standing
 * out of the haze, their sunward faces in a paler ice than their bodies.
 */
function drawBergs(ctx: Pen, land: string, _sky: string, _glow: string, size: number, light?: LandLight): void {
  const far = light?.far ?? land;
  const lit = light?.lit ?? land;
  const back = (x: number): number =>
    0.592 - summits(x, size, [[2, 0.05, 0.3], [5, 0.028, 1.9], [9, 0.012, 0.8]]) + waves(x, size, [[3, 0.004, 1.1]]);
  const crest = knotted(size, back, 36);
  fillUnder(ctx, vertical(ctx, size, 0.54, far, 0.66, mix(far, land, 0.35)), crest, size);
  facets(ctx, crest, size * 0.03, mix(far, lit, 0.45), far, mix(far, land, 0.3));
  // Haze lying at the bergs' feet, so the near shelf stands in front of distance rather than a wall.
  ctx.globalAlpha = 1;
  ctx.fillStyle = vertical(ctx, size, 0.6, rgba(far, 0), 0.64, far);
  ctx.fillRect(0, 0.6 * size, size, 0.04 * size);
  ctx.fillStyle = far;
  ctx.fillRect(0, 0.64 * size, size, size - 0.64 * size);
}

/**
 * The shelf: an ice cliff of seracs along the bottom of the screen, aqua faces over a deep blue body,
 * its crest coped in the palest ice, split by crevasses with light down in them; and below it a
 * lower, darker shelf of broken floes.
 */
function drawIce(ctx: Pen, land: string, _sky: string, _glow: string, size: number, light?: LandLight): void {
  const face = light?.canopy ?? land;
  const lit = light?.lit ?? land;
  const deep = mix(face, land, 0.6);
  const shadow = mix(face, land, 0.35);

  const cliff = (x: number): number =>
    0.668 - summits(x, size, [[3, 0.042, 0.7], [7, 0.024, 2.1], [13, 0.011, 0.4]]) + waves(x, size, [[2, 0.007, 1.7], [5, 0.004, 0.3]]);
  const KNOTS = 48;
  const crest = knotted(size, cliff, KNOTS);
  fillUnder(ctx, vertical(ctx, size, 0.62, face, 0.76, deep), crest, size);
  // Two bands of faces: the serac tops in the light, and the cliff below them in the aqua.
  facets(ctx, crest, size * 0.05, mix(face, deep, 0.15), mix(face, deep, 0.35), deep);
  facets(ctx, crest, size * 0.022, lit, mix(face, lit, 0.3), shadow);

  /** The drawn crest's height at `x` — the knotted line, not the smooth profile under it. */
  const crestAt = (x: number): number => {
    const t = ((((x % size) + size) % size) / size) * KNOTS;
    const k = Math.min(KNOTS - 1, Math.floor(t));
    return crest[k]![1]! + (crest[k + 1]![1]! - crest[k]![1]!) * (t - k);
  };

  /*
    Crevasses: deep blue wedges down from the crest, each with a thread of aqua light at its heart —
    *"deep blue crevasses with light in them"*. Drawn a tile to either side as well, so one that
    straddles the seam is whole on both.
  */
  const rng = makeRng('sky').stream('rime/crevasses');
  for (let i = 0; i < 7; i += 1) {
    const at = rng.range(0, 1) * size;
    const wide = rng.range(0.0025, 0.005) * size;
    const long = rng.range(0.035, 0.07) * size;
    for (const dx of [-size, 0, size]) {
      const x = at + dx;
      if (x + wide < 0 || x - wide > size) continue;
      const top = Math.max(crestAt(x - wide), crestAt(x + wide)) + size * 0.004;
      ctx.globalAlpha = 1;
      ctx.fillStyle = mix(deep, land, 0.55);
      ctx.beginPath();
      ctx.moveTo(x - wide, top);
      ctx.lineTo(x + wide, top);
      ctx.lineTo(x + wide * 0.15, top + long);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = face;
      ctx.lineWidth = Math.max(1, size * 0.0012);
      ctx.beginPath();
      ctx.moveTo(x, top + long * 0.15);
      ctx.lineTo(x + wide * 0.08, top + long * 0.8);
      ctx.stroke();
    }
  }

  // The coping: the palest ice along the whole crest, thin, the brightest line on the land.
  ctx.globalAlpha = 1;
  ctx.strokeStyle = lit;
  ctx.lineWidth = Math.max(1, size * 0.0022);
  ctx.beginPath();
  ctx.moveTo(crest[0]![0]!, crest[0]![1]!);
  for (let i = 1; i < crest.length; i += 1) ctx.lineTo(crest[i]![0]!, crest[i]![1]!);
  ctx.stroke();

  // The lower shelf: broken floes, darker and flatter, at the very bottom of the lane.
  const floes = (x: number): number => 0.735 - summits(x, size, [[4, 0.012, 1.3], [11, 0.007, 0.2]]) + waves(x, size, [[6, 0.003, 2.4]]);
  const low = knotted(size, floes, 60);
  fillUnder(ctx, vertical(ctx, size, 0.72, deep, 0.8, mix(deep, land, 0.6)), low, size);
  facets(ctx, low, size * 0.014, mix(face, deep, 0.3), mix(face, deep, 0.6), mix(deep, land, 0.4));
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
function drawEnclosure(ctx: Pen, land: string, sky: string, glow: string, size: number, light?: LandLight): void {
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
  /*
    ⚠️ **RAISED TO A CEILING — 0352.** Asked for: *"overgrowth ceiling needs to be raised and to be an
    actual ceiling."* The roof's line sits at tile 0.3 — lane 10 — and hangs from there, so the fight
    has most of the screen and the canopy is a roof over it rather than a wall a third of the way down.
  */
  const canopy = skyline(size, 'mire/canopy', 0.3, 0.06, 28, 'down');
  const pools = skyline(size, 'mire/pools', 0.66, 0.022, 14);

  fillTo(ctx, land, canopy, size, false);
  fillTo(ctx, land, pools, size, true);

  /*
    The underside of the roof: clumps of leaf along its edge in a murk green, so it is foliage with a
    depth to it and not a cut-out — and vines and moss hanging off it, thin, so they read as growth
    and never as a body (0222's band holds compact marks; these are long).
  */
  const leaf = light?.canopy ?? mix(land, sky, 0.6);
  const rng0 = makeRng('sky').stream('mire/underside');
  ctx.globalAlpha = 1;
  ctx.fillStyle = leaf;
  for (let i = 0; i + 1 < canopy.length; i += 1) {
    const [x0, y0] = canopy[i]!;
    const [x1, y1] = canopy[i + 1]!;
    for (let j = 0; j < 3; j += 1) {
      const t = rng0.range(0, 1);
      const r = size * rng0.range(0.006, 0.012);
      ctx.beginPath();
      ctx.arc(x0! + (x1! - x0!) * t, y0! + (y1! - y0!) * t - r * 0.3, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = leaf;
  ctx.lineCap = 'round';
  for (let i = 1; i < canopy.length - 1; i += 1) {
    const [x, y] = canopy[i]!;
    const hang = size * rng0.range(0.02, 0.075);
    const lean = size * rng0.range(-0.008, 0.008);
    ctx.lineWidth = Math.max(1, size * rng0.range(0.0015, 0.003));
    ctx.beginPath();
    ctx.moveTo(x!, y!);
    ctx.quadraticCurveTo(x! + lean, y! + hang * 0.5, x! + lean * 0.3, y! + hang);
    ctx.stroke();
  }

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
    const from = (0.3 + i * 0.04) * size;
    ctx.fillRect(0, from, size, 0.041 * size);
  }

  /*
    ── AND THE POOLS ARE LIT AND THE CANOPY IS NOT ─────────────────────────────────────────────────

    Which is the whole reading of the place: the light is coming from BELOW, off something that should
    not be glowing, and the roof over it is a silhouette. It is also the only way two surfaces of one
    colour tell each other apart at a glance.
  */
  /*
    The pools themselves, and they are the light source. **Drawn before the shoreline**, so the
    shoreline closes over their far edge and they sit IN the ground rather than on it.
  */
  /*
    ⚠️ **LIT FROM WITHIN, AND AS BRIGHT ACROSS THEIR AREA AS THE FLOOR ALLOWS — 0352.** *"Vibrant
    glowing acid pools"* is a lit area low in the lane, where shots are read. The surface of each pool
    is the place's `lit` — a saturated acid green at the floor's ceiling, the brightest colour the land
    states — falling away with depth into the ground. The vibrance is in the saturation, and in the
    thin bright lines on the surface, which are strokes and not an area.
  */
  const surface = light?.lit ?? mix(land, glow, 0.36);
  const depth = mix(surface, land, 0.6);
  // Authored in `POOLS_OF`, which the bubbles read too, so the two are the same pools — 0353.
  for (const spot of POOLS_OF.mire?.spots ?? []) {
    const at = spot.at * size;
    const wide = spot.wide * size;
    const deep = spot.deep * size;
    const top = spot.top * size;
    ctx.globalAlpha = 1;
    ctx.fillStyle = vertical(ctx, size, top / size, surface, (top + deep) / size, depth);
    // A shallow lens rather than a box: a pool is a hollow the acid has filled.
    ctx.beginPath();
    ctx.moveTo(at, top);
    ctx.quadraticCurveTo(at + wide / 2, top - deep * 0.15, at + wide, top);
    ctx.quadraticCurveTo(at + wide / 2, top + deep * 0.9, at, top);
    ctx.closePath();
    ctx.fill();
    // Ripples on the surface: thin, bright, a few to a pool.
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = glow;
    ctx.lineWidth = Math.max(1, size * 0.0015);
    for (let r = 0; r < 3; r += 1) {
      // Inside the lens, whose floor is under half its depth: ripples below it would float in the ground.
      const y = top + deep * (0.07 + r * 0.1);
      const inset = wide * (0.14 + r * 0.1);
      ctx.beginPath();
      ctx.moveTo(at + inset, y);
      ctx.lineTo(at + wide - inset, y);
      ctx.stroke();
    }
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
}

/**
 * The swamp behind the fight — 0352: *"the background needs to be swampy trees and murk."* Two rows
 * of drowned trunks standing out of dark water, the far row paler with murk, the near one darker, with
 * mist lying between them; in its own slower layer (0347's `RANGE_OF`), so they pass behind the pools.
 * Their tops run up behind the canopy, which is drawn in front of them. Every colour here is the land
 * or the air mixed with a little of the murk, darker than anything the fight is read by.
 */
function drawSwamp(ctx: Pen, land: string, sky: string, _glow: string, size: number, light?: LandLight): void {
  const murk = mix(sky, land, 0.2);
  const far = light?.far ?? mix(sky, land, 0.5);
  const rows = [
    { seed: 'mire/farTrees', count: 11, colour: far, wide: 0.018, water: 0.62 },
    { seed: 'mire/nearTrees', count: 7, colour: mix(far, land, 0.6), wide: 0.03, water: 0.66 },
  ];
  for (const row of rows) {
    const rng = makeRng('sky').stream(row.seed);
    ctx.globalAlpha = 1;
    ctx.fillStyle = row.colour;
    ctx.strokeStyle = row.colour;
    ctx.lineCap = 'round';
    for (let i = 0; i < row.count; i += 1) {
      const at = ((i + rng.range(0.1, 0.9)) / row.count) * size;
      const base = row.wide * size * rng.range(0.7, 1.3);
      const top = rng.range(0.12, 0.26) * size;
      const foot = row.water * size;
      const lean = size * rng.range(-0.02, 0.02);
      for (const dx of [-size, 0, size]) {
        const x = at + dx;
        if (x + base * 2 < 0 || x - base * 2 > size) continue;
        // The trunk, tapering, with its roots flaring into the water.
        ctx.beginPath();
        ctx.moveTo(x - base * 1.6, foot);
        ctx.lineTo(x - base * 0.5, foot - base * 1.2);
        ctx.lineTo(x - base * 0.2 + lean, top);
        ctx.lineTo(x + base * 0.2 + lean, top);
        ctx.lineTo(x + base * 0.5, foot - base * 1.2);
        ctx.lineTo(x + base * 1.6, foot);
        ctx.closePath();
        ctx.fill();
        // Two bare branches, reaching.
        ctx.lineWidth = Math.max(1, base * 0.3);
        for (const side of [-1, 1]) {
          const from = top + (foot - top) * rng.range(0.15, 0.45);
          ctx.beginPath();
          ctx.moveTo(x + lean * 0.6, from);
          ctx.quadraticCurveTo(x + side * base * 3, from - base * 1.5, x + side * base * 4.5, from - base * 3.5);
          ctx.stroke();
        }
      }
    }
    // Mist lying on the water at this row's feet.
    ctx.fillStyle = vertical(ctx, size, row.water - 0.05, rgba(murk, 0), row.water, rgba(murk, 0.7));
    ctx.fillRect(0, (row.water - 0.05) * size, size, 0.05 * size);
  }
  // The water: the mass the layer stands on, crossing the tile and running off the bottom of the world.
  const water = (x: number): number => 0.668 + waves(x, size, [[3, 0.003, 0.4], [7, 0.002, 1.9]]);
  fillUnder(ctx, murk, crestOf(size, water), size);
  ctx.globalAlpha = 1;
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
  a mark `tests/accents.test.ts` can measure. Every motif mark is at least 0.2 of the radius across,
  which is 0106's floor on the smallest enemy since the view zoomed out (0364).
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
  // A speck's half-width: 0.205 across is 0106's floor on the weaver since the view zoomed out (0364).
  const speck = 0.1025;
  for (let gy = y0; gy <= y1; gy += pitch) {
    for (let gx = x0; gx <= x1; gx += pitch) {
      const x = gx + rng.range(-0.06, 0.06);
      const y = gy + rng.range(-0.06, 0.06);
      switch (theme) {
        case 'approach': {
          // Rivets: a dark stud on every panel.
          if (!fits(belly, square(x, y, speck))) break;
          disc(ctx, f, skin.plate, x, y, speck);
          break;
        }
        case 'nebula': {
          // Embers: lit specks, as if the hull were still cooling.
          if (rng.range(0, 1) < 0.35) break;
          if (!fits(belly, square(x, y, speck))) break;
          disc(ctx, f, skin.lit, x, y, speck);
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
          const trace: Pt[] = rng.range(0, 1) < 0.5 ? square(x, y, speck) : [
            [x - 0.16, y - speck],
            [x + 0.16, y - speck],
            [x + 0.16, y + speck],
            [x - 0.16, y + speck],
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
          if (!fits(belly, square(x, y, 0.155))) break;
          disc(ctx, f, skin.plate, x, y, 0.155);
          disc(ctx, f, skin.lit, x, y, speck);
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
function eye(ctx: Pen, f: Frame, skin: FoeSkin, x: number, y: number, radius: number, gaze = 0): void {
  disc(ctx, f, shade(skin.plate, -0.5), x, y, radius);
  /*
    ⚠️ **`gaze` MOVES THE PUPIL WITHIN THE EYE AND NOTHING ELSE** — 0319. It is `-1`, `0` or `1`: which
    side of its own lane the thing it is watching is on, which is what `wearFace` already commits to a
    side before it lets the pupil follow. Off by default, on 0282's terms — every eye in the game had
    one argument list before this and eleven of them still want it.
  */
  disc(ctx, f, skin.eye, x - radius * 0.15, y + gaze * radius * 0.34, radius * 0.62);
}

/*
  ── THE BELLIES AND THE PAINT, PER KIND ─────────────────────────────────────────────────────────

  Every number is a fraction of `r`, inside the hull the same arm draws, and `tests/accents.test.ts`
  measures each one against the trace on a 1280×720 screen. The smallest enemy is the weaver at 5
  units, whose radius is 12.6 CSS pixels there since the view zoomed out (0364); 0106's 2.5 px is
  therefore 0.2 of its radius, and nothing painted on it is thinner than 0.205.
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
    [0.005, -0.92],
    [0.21, -0.92],
    [0.21, 0.92],
    [0.005, 0.92],
  ]);
  lit(ctx, f, skin, [
    [-0.21, -0.9],
    [-0.005, -0.9],
    [-0.005, -0.4],
    [-0.21, -0.4],
  ]);
  lit(ctx, f, skin, [
    [-0.21, 0.4],
    [-0.005, 0.4],
    [-0.005, 0.9],
    [-0.21, 0.9],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.16, -0.7],
    [0.16, -0.7],
    [0.16, 0.7],
    [-0.16, 0.7],
  ], 'weaver');
  eye(ctx, f, skin, 0, 0, 0.165);
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
/*
  ── THE REAL BOSSES, DRAWN — 0264 ──────────────────────────────────────────────────────────────

  *"The boss graphics are bad … the grey tentacle … the new bosses look terrible (the hydra shows
  no heads)."* Six of the seven hulls below were a silhouette with a plate, a strip and an eye;
  they are drawn as the creatures the brief names. What the predecessor's serpent taught
  (`C:\Golf-Stars`'s `shipArt.ts`, read for that reason and nothing else): a body is ONE spine
  with a taper and everything hangs off it; a skull is edged in its own light or it vanishes into
  the dark; the maw is lit in the gap the jaws leave; fins and scutes sit on the body's own heading.

  ⚠️ **The hull is still the sealed path, and everything after it is paint on it** — 0227. A ribbon
  along a spine, a head at its end and fins on its back are one closed polygon, so
  `tests/accents.test.ts` holds every mark to the same silhouette the collision reads, and the
  hurt twin is that silhouette flat. Nothing here strokes after the seal.
*/

/** The sprites the places' lords wear their own skin on — every real boss's, off the rows. */
/*
  ⚠️ **AND A LORD'S BODY WEARS ITS PLACE'S SKIN TOO — 0283.** A boss with a `chain` is one creature in
  two bitmaps, and the first bake of the serpent's had a venom-green skull towing a row of pink discs:
  the head was on this list because a row names it as the boss's `sprite`, and the body was not,
  because nothing named it. The row names it now.
*/
const LORD_HULLS: readonly SpriteKind[] = LEVEL_KINDS.flatMap((k) => {
  const row = BOSSES[LEVELS[k].boss];
  /*
    ⚠️ **EVERY BITMAP THE ROW NAMES, AND THE LIST IS WALKED RATHER THAN WRITTEN — 0285.** This has now
    been got wrong twice: 0283's body baked in the generic foe skin because nothing named it, and
    0285's four extra faces did it again the moment they existed. Both were a venom-green head towing
    something dusty pink, and both were invisible to every guard and obvious in one photograph.

    ⚠️ **SO WHAT IS ASKED IS *what sprites does this row mention*, not *which fields did somebody
    remember*.** A row that grows a seventh face is covered by having authored it.

    ⚠️ **AND *WALKED* MEANS `Object.values`, WHICH THE FIRST PASS OF THIS COMMENT DID NOT DO — 0285.**
    It named the six face fields one at a time underneath a paragraph promising it did not, and the
    seventh face went out in the generic foe skin exactly as the two before it had: a grey head with a
    red eye, photographed on the first sheet it appeared on. A list written out by hand is a list
    that has to be remembered, however the comment above it reads. Every field of a `Face` and a
    `Chain` is a sprite index and nothing else is, which is what makes this safe to walk.
  */
  const named = [row.sprite, row.spriteHit];
  if (row.chain !== null) named.push(row.chain.sprite, row.chain.spriteHit);
  if (row.face !== null) named.push(...Object.values(row.face));
  /*
    ⚠️ **AND WHAT EVERY PHASE'S LOOK NAMES — 0305**, on this list's own terms: the horned faces and the
    aura's frames are this lord's too, and they are named on a phase rather than on the row. An
    `Aura`'s other fields are numbers that are not sprites, so its frames are named and it is not walked.
  */
  /*
    ⚠️ **AND WHAT EVERY PHASE'S HULL NAMES — 0332**, which is the third time this list has had to
    grow and the reason it is walked rather than written: a worn body is a bitmap named on a phase,
    exactly as a horned face is, and a chipped gyre baked in the generic foe skin would be a dusty
    pink cog in a teal place — the same photograph 0283 and 0285 each produced once.

    ⚠️ **The SEAT is deliberately not here.** `socket.seat` is background rather than body: it is
    painted straight out of the palette in the `sky` ink and never sees a skin at all, so a lord's
    livery has nothing to say about it.
  */
  for (const phase of row.phases) {
    if (phase.hull !== undefined) named.push(phase.hull.rest, phase.hull.hit);
    if (phase.look === null) continue;
    named.push(...Object.values(phase.look.face));
    if (phase.look.aura !== null) named.push(...phase.look.aura.frames);
  }
  return named.map((index) => SPRITE_KINDS[index]!);
});

/** The unit direction of a polyline at sample `i`, from its neighbours. */
function headingAt(spine: readonly Pt[], i: number): Pt {
  const a = spine[Math.max(0, i - 1)]!;
  const b = spine[Math.min(spine.length - 1, i + 1)]!;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
}

/** A point `h` off sample `i` of a spine — to port for a positive `h`, to starboard for a negative. */
function offSpine(spine: readonly Pt[], i: number, h: number): Pt {
  const [ux, uy] = headingAt(spine, i);
  const [x, y] = spine[i]!;
  return [x - uy * h, y + ux * h];
}

/** A quad between two offsets of a spine, from sample `i` to `i + 1`: a stripe along a ribbon. */
function stripe(spine: readonly Pt[], i: number, h: (i: number) => number, from: number, to: number): Pt[] {
  return [
    offSpine(spine, i, h(i) * from),
    offSpine(spine, i + 1, h(i + 1) * from),
    offSpine(spine, i + 1, h(i + 1) * to),
    offSpine(spine, i, h(i) * to),
  ];
}

/** A frame at the end of a spine: `at(px, py)` is `px` along its last heading and `py` to port. */
function endOf(spine: readonly Pt[]): (px: number, py: number) => Pt {
  const last = spine.length - 1;
  const [ux, uy] = headingAt(spine, last);
  const [x, y] = spine[last]!;
  return (px, py) => [x + ux * px - uy * py, y + uy * px + ux * py];
}

/*
  ── THE SKULL IS THE HULL, AND IT IS DRAWN FOR MENACE — 0283, 0284 ───────────────────────────────

  `boss8` was the whole animal in one box until 0283, which is the one thing a serpent cannot be: a
  baked bitmap holds whatever wave it was painted with for the entire fight. The body is a chain of
  entities now (`src/app/frame.ts`) and this box holds the head.

  ⚠️ **AND THE HEAD IS AUTHORED RATHER THAN RESCALED, WHICH IS 0284.** 0283 took the skull 0264 had
  drawn as one detail of a fifty-six-unit animal and enlarged it, deliberately, so that a verdict on
  the chain would not be tangled with a change to the art (0109). The verdict came back *"still very
  cute instead of menacing… the head and tail-tip are way too cute"*, and the rescaled detail is
  gone: what is below is drawn for this box, against the predecessor's own serpent and the reference
  handed over with the report.
*/

/** Where the lower jaw hangs from, in the head's own frame — the one point both jaws share. */
const HINGE: Pt = [-0.24, 0.04];

/**
 * How much shorter the skull is than it was authored, so it reads as LONGER — 0288.
 *
 * ⚠️ **REPORTED**: *"the head itself needs to be slightly bigger and also slightly longer… the head
 * looks just a bit weird at the moment."* The bigger is `SPRITE_EXTENT.boss8`, which scales the whole
 * drawing; this is the proportion, and the two are separate numbers because they answer separate
 * halves of the sentence. Authored 1.96 long by 1.52 tall, the skull now draws 1.96 by 1.34 — a
 * length-to-height of 1.46 where it was 1.29.
 *
 * ⚠️ **IT IS APPLIED AT THE POINT OF DRAWING AND THE ART IS NOT RE-TYPED.** Every mark on this head
 * — horns, brow plate, crown plane, eye, four teeth, tongue, the mouth's own wedge — is a list of
 * fractions of the drawing radius, and squashing them by hand is fifty numbers and one typo. One
 * transform at the end is the same picture and cannot drift.
 *
 * ⚠️ **AND IT IS APPLIED *AFTER* THE JAW SWINGS, WHICH IS NOT THE SAME THING.** `hinged` rotates
 * about the hinge; a rotation in squashed space is a shear, so the jaw would open along a different
 * arc from the one 0285 measured and the teeth would leave their sockets. Author, hinge, then lean.
 */
const SKULL_LEAN = 0.88;

/** One point of the skull, leaned — the last thing that happens to it before it is drawn. */
const lean = ([x, y]: Pt): Pt => [x, y * SKULL_LEAN];

/** A whole list of them. */
const leant = (ps: readonly Pt[]): Pt[] => ps.map(lean);

/**
 * A tooth, as tip-then-roots — 0285.
 *
 * ⚠️ **ONE DESCRIPTION, BECAUSE THE OUTLINE AND THE PAINT MUST BE THE SAME TOOTH.** The first pass
 * said exactly this in a comment and then wrote the four triangles out a second time inside the
 * skull's own point list — which is the arrangement the comment was warning about, and
 * `tests/accents.test.ts` duly reported them drifting apart a fraction of a pixel at a time across
 * the frames. The outline below is spliced from these, so there is no second copy left to drift.
 *
 * ⚠️ **AND WHICH JAW A TOOTH IS IN IS AUTHORED, NOT DEDUCED.** The first pass decided it from height
 * — everything past the bite line swung — and a hanging fang's TIP is past that line while its root
 * is not, so the upper teeth swung with the lower jaw and tore out through the roof of the mouth.
 * That is the whole of the containment failure this decision started with.
 */
type Fang = readonly [Pt, Pt, Pt];

/** ⚠️ **TWO HANGING FROM THE UPPER JAW**, which never moves; their tips reach down past the bite. */
const UPPER_FANGS: readonly Fang[] = [
  [[-0.9, 0.16], [-0.95, -0.07], [-0.85, -0.06]],
  [[-0.65, 0.14], [-0.69, -0.04], [-0.61, -0.03]],
];

/** ⚠️ **AND TWO STANDING ON THE LOWER JAW**, which swings; their tips reach up past the bite. */
const LOWER_FANGS: readonly Fang[] = [
  [[-0.52, 0.14], [-0.48, 0.3], [-0.56, 0.32]],
  [[-0.78, 0.24], [-0.74, 0.41], [-0.82, 0.43]],
];

/**
 * The wedge the two jaws enclose — the mouth's own interior, in the head's frame — 0285.
 *
 * ⚠️ **ONE DESCRIPTION, BECAUSE THE PAINT AND THE FLASH MUST BE THE SAME CAVITY — 0287.** It is
 * painted dark red here and it is the shape the hit wash is held OUT of, and two copies of it would
 * drift apart the first time a jaw angle moved. The fangs are one description for the same reason,
 * and got it wrong first.
 *
 * ⚠️ **ITS CORNERS SIT INSIDE THE NOTCH AND ONE OF THEM RIDES THE JAW.** Photographed: authored as a
 * triangle across the gap, its front-lower corner sat 0.09 of a unit ahead of the lower jaw's own tip
 * (a dark red spike past the chin) and its long edge cut a chord across the jaw's inner edge, leaving
 * a strip of open space that read as a black bite out of the chin.
 */
/**
 * What the inside of a mouth is: dark red — 0285, exported for the guard that reads it — 0287.
 *
 * ⚠️ **IT WAS `skin.lit` AND WAS REPORTED ON SIGHT**: *"there's a weird green bit in the mouth."*
 * The venom light was reasoned across from the predecessor's serpent, which breathes venom. This one
 * has a mouth.
 */
export const MOUTH_INK = '#3a0d12';

const MOUTH: readonly Pt[] = [
  [-0.3, 0.01],
  [-1.0, -0.09],
  [-0.86, 0.4],
  [-0.5, 0.22],
];

/**
 * One tooth as a run of outline points, in the direction that jaw's edge is walked.
 *
 * ⚠️ **THE TIP IS DOUBLED BECAUSE `curveLoop` SMOOTHS A LONE POINT INTO A BUMP** and a fang is a
 * corner — the same reason every other corner in this skull is written twice.
 */
const toothOf = ([tip, a, b]: Fang): Pt[] => [a, tip, tip, b];

/**
 * The skull's two horns, each as its tip and the two roots it rises from, front root first — 0284's,
 * and grown by 0305.
 *
 * ⚠️ **A HORN GROWS ALONG ITS OWN RAKE, FROM BETWEEN ITS ROOTS.** The tip moves out along the line from
 * the middle of its base through where it points now, and the roots stay where they are: a longer
 * horn on the same base, which is what reads as the same animal becoming more dangerous rather than
 * as a different head. Its tip is compared by IDENTITY in `grown`, which is why the skull splices
 * these points rather than repeating their numbers.
 */
type Horn = readonly [Pt, Pt, Pt];
const HORNS: readonly Horn[] = [
  [[0.78, -0.82], [0.46, -0.5], [0.24, -0.6]],
  [[0.46, -0.9], [0.2, -0.62], [-0.02, -0.68]],
];

/**
 * How long the horns are drawn in each phase that grows them, against the length 0284 drew — 0305.
 *
 * ⚠️ **ASKED FOR AS A LADDER**: *"it's horns grow longer"* at the void phase, *"a bit longer again"* at
 * the lightning. Half again, then twice: the first step the bigger, because it is the one that says
 * *the animal has changed*, and the second a further third, which is *a bit longer again*.
 *
 * ⚠️ **AND THE TOP RUNG WENT 2 → 3, BECAUSE IT WAS ASKED FOR A SECOND TIME — 0310.** *"The horns need to
 * grow"*, said of the phase that already grew them twice over: the report is that the second step did not
 * read. It would not have — **1.5 → 2 is a third, against the first step's half**, so the ladder got
 * *smaller* as the animal got more dangerous. At 3 the last step is three times the first, which is the
 * shape the escalation should always have had.
 *
 * ⚠️ **AND THREE IS THE CEILING OF THE TILE RATHER THAN A TASTE.** `tests/accents.test.ts` refuses a mark
 * past 1.16 of the drawing radius, because that is where the next bitmap in the atlas begins. Driven
 * against the traced hull: **2.8 → 1.056, 3.0 → 1.114, 3.2 → 1.172**. Three is the last rung inside the
 * box; past it `SPRITE_EXTENT.boss8Horn3` has to grow, which costs atlas space and bake resolution across
 * all eight of that face's frames.
 */
const HORN_GROWTH = { 2: 1.5, 3: 3 } as const;

/** A point of the skull with its horns grown by `grow` — the identity for every point but a tip. */
function grown(p: Pt, grow: number): Pt {
  if (grow === 1) return p;
  for (const [tip, a, b] of HORNS) {
    if (p !== tip) continue;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    return [mx + (tip[0] - mx) * grow, my + (tip[1] - my) * grow];
  }
  return p;
}

/**
 * Which skull a serpent head kind is: its jaw, where its pupil looks, how long its horns are, and how
 * much bigger its box is than `boss8`'s — or `null` for a kind that is not one — 0305.
 *
 * ⚠️ **ONE READING OF THE NAME, FOR THE THREE PLACES THAT NEED IT.** The drawing, the hit wash's cavity
 * and the outline's width all have to agree on which skull this is; 0285 derived the jaw from the name
 * in two places, and the moment a longer-horned face existed both of those readings were wrong in
 * different ways — `startsWith('boss8Gape')` is false of `boss8Horn2Gape`.
 */
function skullOf(kind: SpriteKind): { jaw: Jaw; gaze: number; grow: number; box: number } | null {
  if (!kind.startsWith('boss8')) return null;
  const face = kind.replace(/Hit$/, '');
  const jaw: Jaw = face.endsWith('Gape') ? 'gape' : face.endsWith('Shut') ? 'shut' : 'rest';
  const gaze = face.endsWith('Up') ? -1 : face.endsWith('Down') ? 1 : 0;
  const grow = face.startsWith('boss8Horn3') ? HORN_GROWTH[3] : face.startsWith('boss8Horn2') ? HORN_GROWTH[2] : 1;
  return { jaw, gaze, grow, box: SPRITE_EXTENT[kind] / SPRITE_EXTENT.boss8 };
}

/**
 * The skull, closed off at the neck — the whole of `boss8` since 0283.
 *
 * ⚠️ **THE NECK IS A STRAIGHT CUT AND IT IS NEVER SEEN.** `SERPENT_SKULL` is an arc that used to run
 * from the top of the neck round the snout to the bottom of it, with the body closing it; the first
 * node of the chain covers the join, and it is wider than the cut is.
 */
/**
 * The skull — crowned, jaws thrown open, authored in the head sprite's own frame.
 *
 * ── WHY IT IS AUTHORED RATHER THAN THE OLD SKULL RESCALED — 0284 ────────────────────────────────
 *
 * ⚠️ **REPORTED ON THE FIRST PLAY OF THE CHAIN**: *"it's also still very cute instead of menacing…
 * the head and tail-tip are way too cute"*, with the predecessor's Jörmungandr handed over a second
 * time as the target. 0283 rescaled the skull 0264 had drawn as one detail of a much larger animal,
 * on 0109's argument that a pipeline change and an art change should not be judged together. That
 * was right and it is spent: the pipeline is judged, and this is the art.
 *
 * ⚠️ **AND THE PREDECESSOR'S OWN SKULL WAS READ FOR IT** — `C:\Golf-Stars\src\render\shipArt.ts`,
 * `case 'serpent'`, for this reason and nothing else (0020). It is built completely differently from
 * anything this repository had: **crown horns swept back**, the jaws as **two plates thrown open**
 * with a lit throat between them, a **brow plate** over the eye, and four fangs. The rounded wedge
 * with a painted-on mouth that this replaces has none of those, and no amount of shading makes a
 * closed mouth menacing.
 *
 * ⚠️ **THE GAPE IS A NOTCH IN THE SILHOUETTE AND NOT A HOLE IN IT**, which is the line 0264 drew and
 * paid for: a mouth cut *through* a hull bakes a skull with a hole in it. A wedge open to the front
 * is one closed path, and it survives `evenodd` — what it must not be is narrower than the outline
 * that strokes it, which is why the jaws part by nearly five world units rather than by one.
 */
const SKULL_UPPER: readonly Pt[] = [
  /*
    ⚠️ **THE SKULL IS TALLEST AT THE JAW HINGE AND NARROWS TO THE NECK, WHICH IS WHERE A SNAKE'S
    HEAD IS TALLEST.** The first pass ran the crown and the jaw straight back at full height to a
    vertical wall, and baked as a green brick with a face on the front of it — the same *blob*
    reading 0276 got, one shape further on.
  */
  [0.9, -0.14],
  [0.68, -0.32],
  [0.44, -0.48],
  /*
    ⚠️ **TWO HORNS RAKED BACK, AND THEIR ROOTS ARE WIDER THAN THEIR REACH.** The first pass set each
    pair of root points a seventh of the skull apart and threw the tip a third of it away, which
    bakes as a pair of antennae — 0277's own finding about rootless spines, in a second disguise.
  */
  /*
    ⚠️ **AND THEY ARE `HORNS` BELOW, SPLICED IN, BECAUSE A PHASE GROWS THEM — 0305.** One description
    of where a horn rises and where it points, so the skull that grows them is this skull and not a
    second one typed beside it.
  */
  HORNS[0]![1],
  HORNS[0]![0],
  HORNS[0]![2],
  HORNS[1]![1],
  HORNS[1]![0],
  HORNS[1]![2],
  // The brow, jutting over the eye, and the snout falling away in front of it.
  [-0.28, -0.7],
  [-0.28, -0.7],
  [-0.5, -0.6],
  [-0.72, -0.54],
  [-0.92, -0.44],
  [-1.06, -0.24],
  [-1.06, -0.24],
  /*
    ── THE FANGS ARE IN THE SILHOUETTE, NOT PAINTED IN THE GAP — 0284 ────────────────────────────

    ⚠️ **A MARK IN THE GAPE IS OUTSIDE THE HULL, AND `tests/accents.test.ts` SAID SO AT 9.5 PIXELS.**
    The gape is a notch, so the open space between the jaws is not part of the silhouette — and a
    fang painted standing in it is a solid mark over a hole, which is the exact thing 0149's guard
    exists to catch. Painted fangs can only ever sit ON a jaw, which is not where teeth are.

    ⚠️ **SO THEY ARE TEETH RATHER THAN DECALS**, on 0277's own terms for the dorsal spines: a boss's
    collision is not its polygon, so a hull may carry a ridge — or, here, four of them pointing the
    other way. Each tip is doubled, because `curveLoop` smooths a lone point into a bump and a fang
    is a corner.
  */
  [-0.98, -0.08],
  ...toothOf(UPPER_FANGS[0]!),
  [-0.72, -0.05],
  ...toothOf(UPPER_FANGS[1]!),
  [-0.46, 0],
  HINGE,
  HINGE,
];

/**
 * The lower jaw, from the hinge out to the snout and back along the throat — 0285.
 *
 * ⚠️ **A SEPARATE LIST BECAUSE MEMBERSHIP OF A JAW IS NOT A PROPERTY OF A POINT'S POSITION.** These
 * are the points that swing; the ones above are the points that do not; and the two lists meet at
 * the hinge, which both of them carry so the loop closes wherever the jaw is.
 */
const SKULL_LOWER: readonly Pt[] = [
  // Out along the lower jaw, hinged wide and stopping short of the snout.
  [-0.44, 0.28],
  ...toothOf(LOWER_FANGS[0]!),
  [-0.7, 0.4],
  ...toothOf(LOWER_FANGS[1]!),
  [-0.9, 0.46],
  [-0.9, 0.46],
  // And back under the chin to the throat, which the swing ramp lets go of before it reaches here.
  [-0.82, 0.6],
  [-0.56, 0.62],
  [-0.22, 0.56],
  [0.18, 0.42],
  [0.56, 0.28],
  [0.9, 0.16],
];

/**
 * How far the lower jaw has swung, per face — 0285. Radians about the hinge; `rest` is as authored.
 *
 * ⚠️ **THE JAW IS HINGED RATHER THAN REDRAWN, WHICH IS WHY THERE IS ONE SKULL AND NOT THREE.** Three
 * authored jaws is three sets of coordinates to keep in step, and the day one of them gains a tooth
 * the other two do not is the day the animal flickers. One drawing, turned about the point a jaw
 * actually turns about.
 */
/*
  ⚠️ **NEGATIVE OPENS, AND THE FIRST PASS HAD IT BACKWARDS.** The jaw hangs BELOW its hinge, so a
  positive turn about that hinge lifts it into the upper jaw and a negative one drops it away. Baked
  the other way round, `hiss` came back with the widest mouth of the three and `gape` with the
  narrowest — which is the sort of thing that is obvious in a photograph and invisible in the code.
*/
/*
  ⚠️ **AND IT TURNS BOTH WAYS FROM REST — 0285.** `shut` is the snap: the jaw swung the other way,
  bringing the front of it up under the snout and meshing the teeth. It stops short of sealed, and
  that is geometry rather than taste — the hinge sits high and behind, so the standing teeth rise
  toward the roof of the mouth faster than the chin does, and a turn wide enough to close the front
  drives them out through the top of the head. Measured: the rear tooth crosses the roof at 0.55
  radians, so this is 0.42 and the mouth is a hard line rather than a seam.
*/
const JAWS = { rest: 0, gape: -0.34, shut: 0.42 } as const;
type Jaw = keyof typeof JAWS;

/**
 * One point of the skull with the jaw swung by `turn`.
 *
 * ⚠️ **THE SWING FADES TO NOTHING AT THE THROAT**, because a jaw hinged as a rigid plate tears away
 * from the neck behind it — the weight runs from nothing at the hinge to all of it a quarter of the
 * skull forward, so the underside bends the way a jaw's does instead of pivoting off the face.
 */
function hinged(p: Pt, turn: number, ref: Pt = p): Pt {
  /*
    ⚠️ **THIS ASKS NO QUESTION ABOUT WHETHER THE POINT BELONGS TO THE JAW — ITS CALLER ALREADY KNOWS.**
    The first pass swung everything past `y = 0.02` on the reasoning that the lower jaw is the lower
    half of the skull. A fang hanging from the UPPER jaw has its tip past that line and its roots
    behind it, so half of each upper tooth swung and half stayed, and the teeth tore out through the
    roof of the mouth a fraction of a pixel at a time — reported by `tests/accents.test.ts` on the
    gape frame only, which is the tell, because that is the only frame where the jaw has moved.
  */
  if (turn === 0) return p;
  /*
    ⚠️ **THE WHOLE LOWER JAW SWINGS, ITS UNDERSIDE INCLUDED, AND THE FIRST PASS TORE.** A weight that
    reached zero a quarter of the skull ahead of the throat left the jaw's front rotating and its
    underside where it was, so the silhouette came apart at the join — photographed, and it read as a
    loose plate rather than a mouth. The ramp runs the length of the jaw instead: nothing at the
    throat, all of it by the time the teeth start.
  */
  /*
    ⚠️ **`ref` IS HOW A SMALL MARK STAYS RIGID.** The weight is a function of position, so a triangle
    whose three corners each take their own turns into a thinner triangle — measured, a fang came back
    **1.8 CSS pixels across** on the shut face against the 2.5 below which a mark is not drawn at all.
    A tooth does not bend: every point of one is turned by the weight at its tip.
  */
  const weight = Math.min(1, Math.max(0, (0.2 - ref[0]) / 0.5));
  if (weight === 0) return p;
  const a = turn * weight;
  const dx = p[0] - HINGE[0];
  const dy = p[1] - HINGE[1];
  return [HINGE[0] + dx * Math.cos(a) - dy * Math.sin(a), HINGE[1] + dx * Math.sin(a) + dy * Math.cos(a)];
}

/**
 * Add a kind's cavities to the current path, so the hit wash can be held out of them — 0287.
 *
 * ⚠️ **A CAVITY IS A PROPERTY OF A KIND, WHICH IS WHY THIS IS A LOOKUP AND NOT A FLAG.** Almost
 * nothing in the game has one: a hull is a solid body seen from above, and the only marks that are
 * *what a body is not* are this animal's open mouth. A boolean on every kind saying *wash me
 * normally* would be a mechanism whose answer is identical for all but three of them, which is
 * `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`'s own tell.
 *
 * ⚠️ **AND IT IS THE HURT KIND THAT IS ASKED**, because that is what the wash knows. `boss8Hit` is
 * shared by the two gaze faces (0285), and both of them wear the resting jaw, so deriving the jaw
 * from the name gives the right wedge for all three twins.
 */
function cavityOf(ctx: Pen, f: Frame, kind: SpriteKind): void {
  const skull = skullOf(kind);
  if (skull === null) return;
  // In the skull's own frame, which a longer-horned face draws smaller inside a bigger box — 0305.
  trace(ctx, { half: f.half, r: f.r / skull.box }, leant(parted(MOUTH, JAWS[skull.jaw])));
}

/** The skull wearing one of its faces — the authored drawing with its jaw swung and its horns grown. */
const headOf = (jaw: Jaw, grow = 1): Pt[] =>
  leant([...SKULL_UPPER.map((p) => grown(p, grow)), ...SKULL_LOWER.map((p) => hinged(p, JAWS[jaw]))]);

/**
 * A mark drawn ACROSS the gap, with the half of it that rides the lower jaw swung — 0285.
 *
 * ⚠️ **THE MOUTH INTERIOR AND THE TONGUE ARE THE ONLY TWO SHAPES THAT ARE NOT IN ONE JAW.** They are
 * what the mouth encloses, so they have an edge on each jaw and have to stretch as it opens; the
 * bite line is a real thing for them and not the guess it was for the teeth. Everything else on the
 * skull belongs to one jaw or the other and is turned, or not, as a whole.
 */
const BITE = 0.05;
const parted = (ps: readonly Pt[], turn: number): Pt[] => ps.map((p) => (p[1] > BITE ? hinged(p, turn) : p));


/**
 * How wide one node's flesh is drawn, as a share of the sprite's `r`.
 *
 * ⚠️ **DERIVED FROM `SERPENT_BODY_DIAMETER` RATHER THAN AUTHORED BESIDE IT.** `src/app/frame.ts`
 * divides the row's girth by that constant to get each node's `swell`, so if this were a second
 * hand-kept number the animal would be drawn at a thickness its hurtbox does not have — an event the
 * picture and the model disagree about, which is 0036.
 *
 * ⚠️ **The rest of the tile is the aura's**, which is painted outside the flesh and has to stay
 * inside the bitmap's own box.
 */
const FLESH = SERPENT_BODY_DIAMETER / (2 * 0.42 * SPRITE_EXTENT.serpentBody);

/**
 * A unit circle as a walk, for the marks on a node that want a point list rather than an arc.
 *
 * ⚠️ **A LIST RATHER THAN `ring`, BECAUSE THE BANDS ARE SLICES OF IT.** `shaded` and `poly` take
 * points; the belly's shadow and the back's light are this filtered to one side and closed by the
 * chord, which is the shape a band across a round body is.
 */
/*
  ── AND A NODE CARRIES NO OUTLINE OF ITS OWN, WHICH TOOK FOUR PHOTOGRAPHS TO ARRIVE AT — 0283 ─────

  ⚠️ **EVERY HULL IN THIS FILE IS SEALED — FILLED AND STROKED — AND A CHAIN'S NODE IS THE ONE THING
  THAT MUST NOT BE.** A node is a SLICE of one animal, not a hull, and an outline round a disc is
  drawn over the flesh of the node beside it. Photographed at the shipped camera, in order:

  | drawn | came back as |
  |---|---|
  | `seal`, the whole disc | a stack of croissants — a dark arc ruled across the body eleven times |
  | a 23° arc at the top and bottom | a row of stitches: two neighbours of different girth put their arcs at different heights and the ends did not meet |
  | a long arc toward the head | dashes — that half is buried by the next node, so almost none of it showed |
  | a long arc toward the tail | the croissants back, heavier |

  ⚠️ **SO THE BODY IS EDGED BY ITS AURA AND ITS RIM LIGHT INSTEAD**, which is what the reference does
  and what `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` describes: *the same stroke blown out
  and dimmed*. The head keeps its outline, because a head IS a hull.
*/

const CIRCLE: readonly Pt[] = (() => {
  const out: Pt[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    out.push([Math.cos(a), Math.sin(a)]);
  }
  return out;
})();

/**
 * One node of the body, painted on the disc that was just sealed — 0283.
 *
 * ── WHAT A NODE OWES, GIVEN THAT FOURTEEN OF THEM ARE ONE ANIMAL ────────────────────────────────
 *
 * ⚠️ **EVERY MARK HERE IS LIT FROM THE SAME PLACE, AND THAT IS WHAT MAKES A ROW OF DISCS A TUBE.**
 * The light is upper-left on every node, so the run of them shares one terminator and reads as a
 * cylinder; a radial shade centred on each disc would read as a string of beads, which is the
 * failure this drawing is one step away from at all times.
 *
 * ⚠️ **AND THE DESIGN SITS ON THE ANATOMY RATHER THAN INSTEAD OF IT.** *"The creature should have the
 * functional body shape of a creature — the 'design' should then enhance and accompany it."* The
 * shape is the row's `girth`, laid out by the frame; what is here is the skin over it — a shaded
 * flank, a lit back, scutes under, scales across and a ridge along the top.
 */
function paintSerpentNode(ctx: Pen, f: Frame, skin: FoeSkin): void {
  /*
    ⚠️ **THE AURA, BEHIND THE FLESH.** `destination-over` puts each fill under everything drawn so
    far — the pickup bubble's trick from 0236, and the only way a mark sits beneath a hull that was
    sealed first. Brightest ring first, because each new one goes further back: built the other way
    round it hides its own bright ring behind its dim one, which 0277 shipped once and had to fix.
  */
  ctx.globalCompositeOperation = 'destination-over';
  for (const [swell, alpha] of [
    [1.1, 0.22],
    [1.28, 0.12],
    [1.44, 0.06],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = skin.lit;
    ctx.beginPath();
    ring(ctx, f, 0, 0, FLESH * swell);
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
  /*
    ⚠️ **ONE LIGHT DIRECTION ACROSS THE WHOLE ANIMAL.** Upper-left to lower-right, which is the same
    direction the skull is lit from, so the head does not look bolted on. Four flat tones made every
    hull a paper cutout — `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` measures it as the
    second of the three ceilings — and this is one gradient over the disc that was just sealed.
  */
  shaded(ctx, f, [0, -FLESH], [0, FLESH], shade(skin.hull, 0.2), shade(skin.hull, -0.42), CIRCLE.map(([x, y]) => [x * FLESH, y * FLESH]), 1, true);
  /*
    ⚠️ **A RIM ALONG THE TOP AND A TURN-UNDER ALONG THE BOTTOM, BOTH FOLLOWING THE EDGE.** The first
    pass drew these as slices of the disc closed by a chord, and a chord is a straight line across a
    round thing: the node baked with a hard horizontal seam through it, and a run of them read as a
    row of buttons with a horizon drawn on. An arc has no chord in it.

    ⚠️ **AND THEY SIT AT A FIXED PLACE ON EVERY NODE, WHICH IS WHAT DRAWS THE TUBE.** The body is a
    row of discs laid along a path; a mark at the same offset on each one traces a line PARALLEL to
    that path, so one rim light per node becomes one rim light down the whole animal. A shade centred
    on each disc would read as beads instead, which is the failure this drawing is always one step
    from.
  */
  /*
    ⚠️ **A RIM ALONG THE TOP AND A TURN-UNDER ALONG THE BOTTOM, BOTH FOLLOWING THE EDGE.** The first
    pass drew these as slices of the disc closed by a chord, and a chord is a straight line across a
    round thing: the node baked with a hard horizontal seam through it, and a run of them read as a
    row of buttons with a horizon drawn on. An arc has no chord in it.

    ⚠️ **AND THEY SIT AT A FIXED PLACE ON EVERY NODE, WHICH IS WHAT DRAWS THE TUBE.** The body is a
    row of discs laid along a path; a mark at the same offset on each one traces a line PARALLEL to
    that path, so one rim light per node becomes one rim light down the whole animal. A shade centred
    on each disc would read as beads instead.

    ⚠️ **THEY ARE THE EDGE THE NODE DOES NOT HAVE**, which is why the rim is bright and the
    turn-under soft: with no outline round a node, these two are what separate the animal's back from
    its belly and its belly from space.
  */
  seam(ctx, f, skin.lit, 0.11, arcOf(FLESH * 0.88, -0.74, -0.26), 0.55, true);
  seam(ctx, f, shade(skin.hull, -0.5), 0.13, arcOf(FLESH * 0.86, 0.3, 0.7), 0.5, true);
  /*
    ⚠️ **THE SCALES ARE A FIELD AND NOT A ROW OF MARKS**, which is the difference the reference makes
    most plainly — 0277 learned it three ways. Small, low, and staggered off the centre so a run of
    nodes does not rule a line down the animal.

    ⚠️ **AND THE NODE CARRIES NO MARK THAT POINTS.** A disc is the one silhouette that can be laid at
    any angle, and the moment something on it says *this way is forward* the body reads as a row of
    objects rather than as one animal — 0277's dorsal ridge was a bar across the back and baked, at
    node size, as exactly the *row of dark pills* that decision had already fixed once.
  */
  for (const [x, y, span] of [
    [-0.34, -0.3, 0.34],
    [0.16, -0.36, 0.3],
    [-0.1, 0.12, 0.36],
    [0.42, 0.08, 0.28],
  ] as const) {
    const scale: Pt[] = [];
    for (let j = 0; j <= 4; j++) {
      const t = j / 4;
      scale.push([FLESH * (x + span * (t - 0.5)), FLESH * (y + Math.sin(Math.PI * t) * 0.12)]);
    }
    seam(ctx, f, skin.lit, 0.04, scale, 0.22, true);
  }
}

/*
  ── THE AURA — 0305 ──────────────────────────────────────────────────────────────────────────────

  *"A dark aura, kind of like a super saiyan aura, but dark blue and purple energy"*, and at the
  lightning phase *"a super saiyan red lightning flicker through the aura."* One flame per node of the
  body and one behind the skull, each blitted at the node's own swell in a layer drawn BEFORE the body
  (`src/content/bosses.ts`'s `Aura` has why), so what the player sees is the union: a haze the animal
  sits inside, and tongues of energy rising off its whole length.
*/

/** How wide a node's flesh is in an aura's tile, in its `r` — `FLESH`'s own arithmetic, for this box. */
const AURA_FLESH = SERPENT_BODY_DIAMETER / (2 * 0.42 * SPRITE_EXTENT.serpentAura0);

/**
 * The aura's inks — 0305: indigo at the roots, violet through the body of the flame, a blue core.
 *
 * ⚠️ **LITERALS, ON `MOUTH_INK`'s TERMS.** They are what this one animal's energy looks like, not a
 * meaning the player reads anywhere else, and a palette ink for them would be a colour every other
 * sprite in the game could be drawn in. The high-contrast palette draws no aura at all: it has no
 * skins, and an aura is the most decorative thing on the screen.
 */
const AURA_INKS = { deep: '#2a1a9a', violet: '#8a3cff', blue: '#3f6bff', core: '#d6c8ff' } as const;

/**
 * And the lightning's — 0305: *"red lightning."* A hot red with a near-white core, which is what a
 * bolt looks like at the size a flame is drawn, and nothing like `enemy`'s pink-red at a glance
 * because it is only ever a stroke a pixel or two wide inside a violet haze.
 */
const STORM_INKS = { glow: '#ff2238', core: '#ffe4e4' } as const;

/**
 * Which of a storm's frames carry lightning — 0305, and five of six since 0310.
 *
 * ⚠️ **IT WAS TWO OF SIX AND THE PLAYER ASKED FOR THE WHOLE ANIMAL**: *"the red lightning flickers need
 * to be across the whole body and a bit more subdued."* `Aura.stride` is 1 and there are twenty-six
 * nodes, so node `k` shows frame `(t + k) % 6` — with two frames lit that is **nine of twenty-seven
 * flames** carrying lightning at any instant, evenly spaced down the body. Which is *across the body* in
 * the arithmetic and reads as a row of sparks in the picture, because two thirds of the animal is dark.
 *
 * ⚠️ **FIVE AND NOT SIX, SO A FLAME STILL GOES OUT.** Every frame lit is a constant crackle, and the
 * word asked for was *flickers*. At five of six each node is dark for one frame in six — three hundredths
 * of a second in every eighteen — and the dark one walks down the body with the stride, so the animal
 * crackles everywhere and never evenly.
 */
const STORM_LIT: readonly number[] = [0, 1, 2, 3, 4];

/**
 * One flame of the serpent's aura — frame `frame` of six, with red lightning through it if `storm`.
 *
 * ⚠️ **SEEDED BY THE FRAME, PER 0021**, so a frame is the same flame on every machine and after every
 * re-bake, and six frames are six different flames rather than one flame at six alphas — which is
 * what makes them flicker rather than pulse.
 */
function paintSerpentAura(ctx: Pen, f: Frame, frame: number, storm: boolean): void {
  const rng = makeRng('aura').stream(`serpent/${frame}`);
  const R = AURA_FLESH;
  /*
    ⚠️ **THE HAZE IS THE AURA AND THE TONGUES ARE ITS EDGE, AND THE FIRST BAKE HAD THEM THE OTHER WAY
    ROUND.** Photographed at the shipped camera, a faint haze under five hard-cornered tongues a node
    came back as a purple sawtooth ruled along the animal's back — a crest of spines, which is 0277's
    *rootless spines* finding in a third disguise, and nothing like energy. So the haze is what the
    body sits INSIDE now, thick enough to read below the belly as well as above the back, and the
    tongues are soft: curves through their samples rather than corners, fewer, of very different
    heights, each a stack of four fading layers so its edge is a falloff and not a line.
  */
  glow(ctx, f, AURA_INKS.deep, 0, -R * 0.2, R * 2.05, 0.8);
  glow(ctx, f, AURA_INKS.violet, 0, -R * 0.1, R * 1.7, 0.7);
  glow(ctx, f, AURA_INKS.blue, 0, -R * 0.45, R * 1.3, 0.5);
  /*
    ⚠️ **THE TONGUES RISE FROM THE UPPER ARC AND GO STRAIGHT UP**, whatever the arc's angle at their
    root, because energy rising off a body rises: a flame that left the flesh along its own normal
    would fan out like a sunburst and read as spines. Rooted inside the flesh so the node covers the
    foot, and the tip is a point written twice — `curveLoop` smooths a lone sample into a bump.
  */
  const lick = (colour: string, points: readonly Pt[], alpha: number): void => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.beginPath();
    curveLoop(ctx, f, points);
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  for (let i = 0; i < 4; i++) {
    const at = -Math.PI / 2 + (i - 1.5) * 0.62 + rng.range(-0.2, 0.2);
    const rx = Math.cos(at) * R * 0.55;
    const ry = Math.sin(at) * R * 0.55;
    // Up to 1.85 of the flesh above a root 0.55 up it: the tallest outer tongue stops at 1.1 of `r`,
    // inside the 1.16 where the next bitmap in the atlas begins (`tests/accents.test.ts`).
    const high = R * rng.range(0.7, 1.85);
    const lean = R * rng.range(-0.35, 0.35);
    const wide = R * rng.range(0.34, 0.52);
    // A flame is widest a third of the way up and bends as it climbs: the lean arrives at the tip.
    const tongue = (scale: number): Pt[] => [
      [rx - wide * 0.7 * scale, ry + wide * 0.4],
      [rx - wide * scale + lean * 0.1, ry - high * 0.3 * scale],
      [rx - wide * 0.45 * scale + lean * 0.55, ry - high * 0.68 * scale],
      [rx + lean * scale, ry - high * scale],
      [rx + lean * scale, ry - high * scale],
      [rx + wide * 0.4 * scale + lean * 0.6, ry - high * 0.62 * scale],
      [rx + wide * 0.9 * scale + lean * 0.12, ry - high * 0.26 * scale],
      [rx + wide * 0.7 * scale, ry + wide * 0.4],
    ];
    lick(AURA_INKS.deep, tongue(1.08), 0.35);
    lick(AURA_INKS.violet, tongue(0.92), 0.4);
    lick(AURA_INKS.blue, tongue(0.62), 0.4);
    lick(AURA_INKS.core, tongue(0.32), 0.45);
  }
  if (!storm || !STORM_LIT.includes(frame)) return;
  /*
    ⚠️ **THE LIGHTNING FORKS THROUGH THE FLAME AND NOT ROUND IT**: rooted on the flesh and climbing
    through the tongues, jagged at every joint, with one branch off it — the arc's own figure (0233)
    in the other ink, stroked twice for a glow and a core.
  */
  const bolt: Pt[] = [];
  let x = rng.range(-0.6, 0.6) * R;
  let y = -R * 0.7;
  bolt.push([x, y]);
  for (let j = 0; j < 5; j++) {
    x += rng.range(-0.35, 0.35) * R;
    y -= rng.range(0.2, 0.34) * R;
    bolt.push([x, y]);
  }
  const fork = bolt[2]!;
  const branch: Pt[] = [fork, [fork[0] + rng.range(0.25, 0.45) * R * (rng.range(0, 1) < 0.5 ? -1 : 1), fork[1] - R * 0.3], [fork[0] + rng.range(-0.2, 0.2) * R, fork[1] - R * 0.55]];
  /*
    ⚠️ **BOLDER THAN THE FIRST BAKE, WHICH PHOTOGRAPHED AS A FAINT PINK SCRIBBLE** inside the haze
    once the haze was thick enough to be an aura — the red has to win against violet at a node's size.

    ⚠️ **AND SUBDUED AGAIN BY 0310, BECAUSE THERE ARE NOW TWO AND A HALF TIMES AS MANY OF THEM.** *"A bit
    more subdued"* was asked for in the same breath as *across the whole body*, and the two are one
    change: nine bolts at this weight was a row of sparks, and twenty-two at this weight would be a
    second aura in red. The glow narrows 0.085 → 0.062 and drops to 0.5 alpha, and the core 0.03 → 0.022
    at 0.8 — so a single flame is fainter than it was and the ANIMAL carries more light than it did.
  */
  for (const line of [bolt, branch]) {
    seam(ctx, f, STORM_INKS.glow, 0.062, line, 0.5);
    seam(ctx, f, STORM_INKS.core, 0.022, line, 0.8);
  }
}

/**
 * The fish's own fire — 0320: the ember the nebula is named for, rather than the serpent's violet.
 *
 * ⚠️ **THE FISH'S OWN INKS, AND THAT IS 0282 AND NOT DECORATION.** Borrowing `AURA_INKS` would make
 * two animals in two levels burn with one flame, which is the shape *a mechanism for every instance
 * makes them one instance* is named for. Deep coal, ember, gold and a white heart: the Ember Nebula's
 * own fire, which the fish is made of and has been throwing since 0301's whip.
 */
const EMBER_INKS = { coal: '#7a1a06', ember: '#ff5a1e', gold: '#ffb03a', core: '#fff1cf' } as const;

/** A unit circle in twelve samples, for `curveLoop` to round off — the oval the ember's haze is built of. */
const OVAL: readonly Pt[] = Array.from({ length: 12 }, (_, i) => {
  const at = (i / 12) * Math.PI * 2;
  return [Math.cos(at), Math.sin(at)] as const;
});

/**
 * One flame of the fish's aura — 0320. No hull and no outline: energy, on the exhaust's terms.
 *
 * ⚠️ **IT STREAMS AFT AND DOES NOT RISE, WHICH IS THE WHOLE DIFFERENCE FROM THE SERPENT'S.** The
 * serpent is drawn in profile and its energy goes UP, because that is where energy goes when you are
 * looking at something from the side. Every hull here is drawn from overhead
 * ([0023](../../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md)), so up-screen is *forward*
 * — tongues rising off this animal would read as fire blowing INTO its own face. A burning thing
 * moving down a lane trails behind it, so the tongues sweep aft and the haze is dragged aft with them.
 *
 * ⚠️ **AND THE HAZE IS AN ELLIPSE, BECAUSE THE THING INSIDE IT IS A WING SPAN.** The serpent's node is
 * a disc and a round haze crowns it; the fish is as wide as it is long with two enormous pectorals, so
 * a round haze the size of the wings leaves the nose and tail bare and one the size of the animal is a
 * ball. Three ellipses, each wider than tall and each dragged further aft than the one inside it.
 */
function paintVolansEmber(ctx: Pen, f: Frame, frame: number): void {
  const rng = makeRng('aura').stream(`volans/${frame}`);
  /*
    ⚠️ **A STACK OF SHRINKING OVALS AND NOT A GRADIENT, BECAUSE `Pen` HAS NO TRANSFORM AND MUST NOT.**
    `glow`'s falloff is radial, so an elliptical one wants the canvas squeezed under it — and `save`,
    `restore`, `translate` and `scale` are exactly the four members `Pen` leaves out. Putting them in
    would make every coordinate `tests/paths.ts` records a coordinate in some other frame, and every
    containment claim in the repository is measured off those numbers: the harness would go on
    reporting, quietly, about the wrong space. So the falloff is built the way the halo's is
    ([0277](../../docs/decisions/0277-the-serpent-has-menace.md), 0318) — rings, each laid over the
    last, so the alpha accumulates toward the middle.
  */
  /*
    ⚠️ **SIXTEEN RINGS AND NOT FIVE, WHICH IS THE DIFFERENCE BETWEEN A FALLOFF AND A TARGET.** Five
    ovals at a sixth alpha photographed as five hard concentric bands — every edge was visible,
    because a step is only invisible when it is smaller than what the eye resolves. The accumulated
    alpha at the middle is `1 − (1 − a)ⁿ`, so sixteen at 0.045 reach about half and no single edge is
    worth more than a twentieth.
  */
  const haze = (colour: string, at: number, rx: number, ry: number, alpha: number): void => {
    ctx.fillStyle = colour;
    ctx.globalAlpha = alpha;
    for (let k = 16; k >= 1; k--) {
      const s = k / 16;
      ctx.beginPath();
      curveLoop(ctx, f, OVAL.map(([x, y]) => [at + x * rx * s, y * ry * s] as const));
      ctx.fill('evenodd');
    }
    ctx.globalAlpha = 1;
  };
  haze(EMBER_INKS.coal, 0.14, 1.02, 0.74, 0.045);
  haze(EMBER_INKS.ember, 0.09, 0.72, 0.52, 0.04);
  haze(EMBER_INKS.gold, 0.02, 0.4, 0.3, 0.035);
  /*
    ⚠️ **THE TONGUES LEAVE THE FLANKS AND GO AFT, WHATEVER THE FLANK'S ANGLE.** Rooted inside the
    flesh so the animal covers the foot, tip a doubled point on `curveLoop`'s own terms, and each one
    a stack of four fading layers so its edge is a falloff rather than a line — which is the finding
    `paintSerpentAura` carries about hard-cornered tongues baking as a sawtooth.
  */
  const lick = (colour: string, points: readonly Pt[], alpha: number): void => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.beginPath();
    curveLoop(ctx, f, points);
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  for (let i = 0; i < 7; i++) {
    const across = (i - 3) * 0.21 + rng.range(-0.07, 0.07);
    const root = -0.16 + rng.range(-0.14, 0.14);
    // Aft to 1.12 of `r` at most, inside the 1.16 where the next bitmap in the atlas begins.
    const long = rng.range(0.55, 1.26);
    const drift = rng.range(-0.2, 0.2);
    const fat = rng.range(0.05, 0.1);
    /*
      ⚠️ **THE LAYERS TAPER IN WIDTH AND BARELY IN LENGTH, AND THE FIRST DRAFT SCALED BOTH.** One
      `scale` on a teardrop shrinks it toward its own root, so the inner layers piled up into a pale
      **bulb** at the base and the whole flame photographed as a slug with a highlight on its nose. A
      flame's core is nearly as long as the flame and much thinner, which is these two numbers.
    */
    const tongue = (wide: number, far: number): Pt[] => [
      [root - fat * 0.3, across - fat * 0.7 * wide],
      [root + long * 0.3 * far, across - fat * wide + drift * 0.1],
      [root + long * 0.68 * far, across - fat * 0.45 * wide + drift * 0.55],
      [root + long * far, across + drift * far],
      [root + long * far, across + drift * far],
      [root + long * 0.62 * far, across + fat * 0.4 * wide + drift * 0.6],
      [root + long * 0.26 * far, across + fat * 0.9 * wide + drift * 0.12],
      [root - fat * 0.3, across + fat * 0.7 * wide],
    ];
    lick(EMBER_INKS.coal, tongue(1.3, 1.05), 0.3);
    lick(EMBER_INKS.ember, tongue(1, 0.95), 0.36);
    lick(EMBER_INKS.gold, tongue(0.62, 0.82), 0.36);
    lick(EMBER_INKS.core, tongue(0.3, 0.62), 0.4);
  }
}

/**
 * How much bigger than its own tile the head's aura flame is blitted — 0310.
 *
 * ⚠️ **A CONSTANT HERE AND A NUMBER ON THE ROW, WITH A GUARD BETWEEN THEM.** `layAura` blits the head's
 * flame at `aura.head / SERPENT_BODY_DIAMETER`, and the flare has to know it or the horn tips land
 * somewhere the horns are not. Importing `BOSSES` here to read one field of one phase of one boss would
 * make every sprite in the game depend on the boss table; `tests/serpent.test.ts` asserts the two agree
 * instead, which is the shape `src/content/sprites.ts` already uses for the atlas order.
 */
export const FLARE_SWELL = 15 / SERPENT_BODY_DIAMETER;

/**
 * Where the grown horn tips sit in the flare's own tile, in its `r` — 0310.
 *
 * ⚠️ **DERIVED FROM `HORNS` AND `HORN_GROWTH`, NOT MEASURED OFF A PICTURE BY A HAND.** `grown` is the same
 * function the skull's own drawing uses, so the day the horns grow again — which has now happened twice —
 * the discharge moves with them. A pair of typed coordinates here would be the third description of where
 * a horn points, and it would be the one that did not move.
 *
 * ⚠️ **THE MAPPING IS TWO SIZES AND NOTHING ELSE, AND THE FIRST VERSION GOT IT WRONG.** A point at 1 in
 * the skull's frame is `0.42 × boss8` world units out; in the flame's it is `0.42 × flare × swell`. So the
 * ratio is `boss8 / (flare × swell)`, and the 0.42s cancel — the draft that kept one of them put the
 * discharge fifteen per cent too far out and, photographed, read as a neon staple hanging off the crown.
 */
const FLARE_SPAN = SPRITE_EXTENT.boss8 / (SPRITE_EXTENT.serpentFlare0 * FLARE_SWELL);
const FLARE_TIPS: readonly Pt[] = HORNS.map(([tip]) => {
  const [gx, gy] = grown(tip, HORN_GROWTH[3]);
  return [gx * FLARE_SPAN, gy * FLARE_SPAN] as Pt;
});

/**
 * The crown discharging — 0310, frame `frame` of three.
 *
 * ⚠️ **ASKED FOR**: *"the horns need to grow and .5sec before the lightning attack happens, they need to
 * flare with red lightning."* The growth is `HORN_GROWTH`; this is the flare, and it is the head's own
 * aura flame with the discharge drawn over it rather than a new face.
 *
 * ⚠️ **A FLAME AND NOT EIGHT FACES, WHICH IS WHAT MADE IT AFFORDABLE.** The head wears seven faces in
 * this phase (0285) and each has a hurt twin; a flaring variant of every one is sixteen more bakes of the
 * widest sprite in the game, for a state that lasts thirty steps. The aura pool already carries **one**
 * flame for the head (0305), drawn in a layer of its own — so a flare is three tiles and no new faces,
 * and the frame chooses between them by swapping one bitmap.
 *
 * ⚠️ **IT IS DRAWN BEHIND THE SKULL, WHICH IS WHERE THE HORNS ARE ANYWAY.** The aura layer is before the
 * body (`src/app/mount.ts`'s layer order), so what shows is everything outside the skull's silhouette —
 * and the horns are swept back off the crown, so the arc that leaps between their tips and the forks that
 * climb off them are exactly the parts that are not behind anything.
 */
function paintSerpentFlare(ctx: Pen, f: Frame, frame: number): void {
  // The flame it replaces, so the crown does not change what it is burning with for half a second.
  paintSerpentAura(ctx, f, frame, true);
  const rng = makeRng('aura').stream(`flare/${frame}`);
  const R = AURA_FLESH;
  /*
    ⚠️ **THE ARC BETWEEN THE TIPS IS THE FIGURE, AND IT IS WHY THERE ARE TWO HORNS.** A charge on one
    horn is a glow; a charge that JUMPS from one to the other is a circuit, and the eye reads a circuit as
    power building. Jagged between them with the sag of a real arc, rooted on the tips themselves.
  */
  const [a, b] = [FLARE_TIPS[0]!, FLARE_TIPS[1]!];
  /*
    ⚠️ **NINE SEGMENTS AND NOT FIVE, AND IT IS THE DIFFERENCE BETWEEN AN ARC AND A STAPLE.** Photographed
    at the sheet's 8×, the first draft's five jittered points under a thick stroke came back as a squared
    bracket: too few corners to read as electricity and too heavy for any of them to be sharp. Lightning
    is MANY small deviations, so the count goes up and the width comes down together.
  */
  const bridge: Pt[] = [a];
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    bridge.push([
      a[0] + (b[0] - a[0]) * t + rng.range(-0.09, 0.09) * R,
      a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * R * 0.16 + rng.range(-0.08, 0.08) * R,
    ]);
  }
  bridge.push(b);
  /*
    ⚠️ **AND THE FORKS LEAK OFF THE HORN RATHER THAN OUT OF THE TILE.** Each starts ON a tip and climbs
    away from the skull's middle, so the discharge is tied to the thing it is coming off — a bridge alone
    reads as a wire strung between two points, and forks that wandered read as a scribble beside the head.
    Two off each tip, at a third of the tile's flesh, so they stop well inside the bitmap.
  */
  const forks: Pt[][] = [];
  for (const tip of FLARE_TIPS) {
    for (let k = 0; k < 2; k++) {
      const line: Pt[] = [tip];
      let [x, y] = tip;
      // Away from the centre, which for a crown means up and outward — the direction the horn points.
      const out = Math.atan2(tip[1], tip[0]) + rng.range(-0.5, 0.5);
      for (let j = 0; j < 3; j++) {
        const reach = rng.range(0.1, 0.19) * R;
        x += Math.cos(out) * reach + rng.range(-0.07, 0.07) * R;
        y += Math.sin(out) * reach + rng.range(-0.07, 0.07) * R;
        line.push([x, y]);
      }
      forks.push(line);
    }
  }
  /*
    ⚠️ **BRIGHTER THAN THE BODY'S CRACKLE AND MUCH THINNER THAN THE FIRST DRAFT.** 0310 makes the aura's
    lightning subdued because it is everywhere and always on; this is a TELL — thirty steps, once per
    round — so it has to win, and *winning* is alpha and count rather than width. At 0.1 of the tile it
    photographed as a neon pipe; at 0.038 with a 0.014 core it is a filament, which is what the player
    already said they liked about the gun's own bolts: *"it looks more like lightning with the thinner
    graphics"* (0302).
  */
  for (const line of [bridge, ...forks]) {
    seam(ctx, f, STORM_INKS.glow, 0.038, line, 0.8);
    seam(ctx, f, STORM_INKS.core, 0.014, line, 1);
  }
}

/** A run of points along an arc of a circle about the node's centre, from `from` to `to` in turns. */
function arcOf(radius: number, from: number, to: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = (from + (to - from) * (i / 10)) * Math.PI;
    out.push([Math.cos(a) * radius, Math.sin(a) * radius]);
  }
  return out;
}
/**
 * The whole animal as ONE closed outline, skull first, down the back, round the tail, up the belly.
 *
 * ⚠️ **AND EVERY POINT OF IT IS A SAMPLE OF A CURVE RATHER THAN A CORNER** — `curveLoop` below. The
 * hull this replaces was a chain of straight quads with a visible corner at every spine sample, and
 * a serpent is a curve: `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` measures that as the
 * first of the three reasons the passes were not converging.
 *
 * ⚠️ **THE DORSAL FINS ARE GONE FROM THE SILHOUETTE ON PURPOSE.** Four triangles poking off the back
 * read as sawteeth — rootless, because a polygon fin shares one edge with the body and has no
 * contour of its own — and the reference has none. What it has instead is short ticks of light off
 * the outer edge, and those are paint, at an alpha that lets them sit outside the hull.
 */

/** A ribbon between two fractions of the half-width, sample `from` to sample `to` — smooth. */

/**
 * Three nested ribbons at rising alpha — a shadow or a light with no edge to it.
 *
 * ⚠️ **A ONE-PIECE BAND BAKED AS A STRIPE, WHICH IS THE FAILURE THE PREDECESSOR NAMES TWICE**: *"a
 * dashed road marking down a green ribbon."* What separates a shadow from a stripe is that a shadow
 * has no edge on the side facing the light, and a single flat ribbon has two. Nesting three of them
 * puts the steps where the eye reads a falloff instead — the same trick as a stepped gradient, and it
 * keeps the mark a POLYGON, which is what `tests/accents.test.ts` can hold to the hull.
 */


/*
  ── THE SERPENT'S PAINT, ON THE LIFTED KIT — 0276 ────────────────────────────────────────────────

  ⚠️ **EVERY MARK BELOW ANSWERS A ROW OF THE REFERENCE BRIEF** in
  `reports/the-vocabulary-is-the-ceiling-2026-09-08.md`, which is the picture the player handed over
  with *"this is the minimum level of what I'm after."* What it replaces was six flat marks: two
  hard-edged stripes, five chevrons, a lit brow and a disc for an eye.

  ⚠️ **THE ORDER IS THE DEPTH.** Form-shade first, over the whole body, so everything after it sits
  on a hull that already has a back and a belly; then the belly shadow and the rim light, which are
  ribbons and therefore taper with the animal; then the scale field; then the head, which is the part
  that says what it is and so is painted last and over everything.
*/
/**
 * The skull's marks — 0284, on the silhouette above.
 *
 * ⚠️ **THE MENACE IS IN THE SILHOUETTE AND THIS IS WHAT LIGHTS IT.** Horns, a jutting brow and an
 * open gape are the shape; a brow plate, a lit throat, four fangs and a slit eye are what stop that
 * shape reading as a flat cut-out. The predecessor's own note is the one to keep in mind here: *"the
 * first pass drew a fully-detailed head that read as a blunt stump"* — a head against open space
 * needs its own light, not only its outline.
 */
function paintSerpentHead(ctx: Pen, f: Frame, skin: FoeSkin, jaw: Jaw, gaze: number, grow = 1): void {
  const turn = JAWS[jaw];
  /** A mark drawn across the gap — the mouth interior and the tongue, and nothing else. */
  const swung = (ps: readonly Pt[]): Pt[] => parted(ps, turn);
  /*
    ⚠️ **THE AURA, BEHIND THE HULL.** `destination-over`, brightest ring first, so each new fill goes
    further back and the falloff stacks outward — 0277 shipped it the other way round once and it
    baked as two flat slabs with a hard edge.

    ⚠️ **AND IT STOPS AT 1.14, BECAUSE THE HORNS ARE THE FURTHEST THING OUT NOW.** A halo is the one
    mark that leaves its hull on purpose, so it is the one that can run off its own tile and bleed
    into the next bitmap in the atlas. `tests/accents.test.ts` holds it.
  */
  ctx.globalCompositeOperation = 'destination-over';
  for (const [swell, alpha] of [
    [1.015, 0.2],
    [1.045, 0.11],
    [1.075, 0.05],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = skin.lit;
    ctx.beginPath();
    curveLoop(ctx, f, headOf(jaw, grow).map(([x, y]) => [x * swell, y * swell]));
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
  }
  /*
    ⚠️ **THE THROAT, BEHIND THE JAWS.** The predecessor draws the gullet first and the jaws over it —
    *"under them it is simply invisible, which is how the first pass managed to draw a lit mouth
    nobody could see."* Here the gape is a notch rather than a hole, so the throat goes BEHIND with
    the aura: a dark wedge filling the wedge the jaws leave, with the venom lit in front of it.
  */
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#04120d';
  ctx.beginPath();
  // Its lower corner rides the jaw, so a wider gape shows more throat rather than more background.
  trace(ctx, f, leant([
    [-0.3, -0.02],
    [-1.06, -0.22],
    hinged([-1.04, 0.42], JAWS[jaw]),
  ]));
  ctx.fill('evenodd');
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // One light direction across the whole animal, upper-left — the same one every node is lit from.
  shaded(ctx, f, lean([0, -0.7]), lean([0, 0.6]), shade(skin.hull, 0.24), shade(skin.hull, -0.42), headOf(jaw, grow), 1, true);
  /*
    ⚠️ **THE CROWN IS A PLANE AND NOT A PATCH** — 0277 learned it and it is the same here. The top of
    the skull catches the light as one surface running from the horns to the snout, with the side of
    the head falling away below it; a small lit blob near the brow reads as a lump.
  */
  shaded(
    ctx,
    f,
    lean([-0.4, -0.66]),
    lean([-0.2, -0.3]),
    skin.lit,
    shade(skin.hull, 0.12),
    leant([
      [0.3, -0.55],
      [-0.06, -0.62],
      [-0.32, -0.66],
      [-0.52, -0.54],
      [-0.86, -0.42],
      [-0.96, -0.28],
      [-0.8, -0.3],
      [-0.5, -0.42],
      [-0.1, -0.5],
      [0.28, -0.44],
    ]),
    0.75,
    true,
  );
  /*
    ⚠️ **THE BROW PLATE, WHICH IS THE ONE MARK THAT MAKES A FACE ANGRY.** A ridge over the eye, darker
    beneath it than the crown above — the predecessor draws exactly this and nothing else on that part
    of the skull. Without it the eye sits on a smooth dome and reads as an animal looking at you
    rather than an animal deciding about you.
  */
  poly(ctx, f, shade(skin.hull, -0.5), leant([
    [-0.06, -0.6],
    [-0.34, -0.64],
    [-0.54, -0.5],
    [-0.5, -0.4],
    [-0.28, -0.5],
    [-0.04, -0.48],
  ]), 0.85);
  /*
    ⚠️ **THE MOUTH IS RED, AND THE VENOM LIGHT THAT WAS HERE READ AS A FAULT — 0285.** Reported on
    sight: *"there's a weird green bit in the mouth."* It was `skin.lit` at 0.55 filling the gape,
    reasoned from the predecessor's lit gullet — and the predecessor's is lit because that serpent
    breathes venom. This one's mouth is a mouth: dark red, which is also what the reference handed
    over shows.

    ⚠️ **TRANSLUCENT, DELIBERATELY.** The gape is a notch, so it is outside the hull, and
    `tests/accents.test.ts` holds a SOLID mark inside the silhouette while treating anything under 0.9
    as a light. A mouth interior is the one mark that has to sit in the hole.
  */
  /*
    ⚠️ **AND THE SHUT FACE HAS NO MOUTH IN IT, WHICH IS BOTH TRUE AND WHAT THE GUARDS ASKED FOR.** A
    mouth interior drawn with the jaws closed is a sliver a pixel across — `tests/accents.test.ts`
    floors a mark at 2.5 CSS pixels, below which it is not drawn faintly but not drawn at all — and a
    closed mouth has nothing inside it to show anyway.
  */
  {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = MOUTH_INK;
    ctx.beginPath();
    /*
      ⚠️ **AND IT IS AUTHORED INSIDE THE NOTCH, NOT ACROSS IT.** Photographed: the wedge's front-lower
      corner sat 0.09 of a unit ahead of the lower jaw's own tip, so a dark red spike stuck out past
      the chin on every face. A mouth interior is what the two jaws ENCLOSE, so each of its corners
      has to be behind the jaw edge it rides — the roof above it, the jaw below it, and the bite at
      the hinge behind it.
    */
    /*
      ⚠️ **AND IT FOLLOWS THE JAW RATHER THAN CUTTING A CHORD ACROSS IT.** As a triangle it left the
      strip between its long edge and the jaw's own inner edge unpainted, and the notch is not part
      of the hull — so that strip photographed as open space, a black bite taken out of the chin
      between the lower teeth. The wedge has a point on the jaw for the same reason the jaw has one.
    */
    trace(ctx, f, leant(swung(MOUTH)));
    ctx.fill('evenodd');
  }
  ctx.globalAlpha = 1;
  /*
    ⚠️ **FOUR FANGS — TWO HANGING AND TWO STANDING**, which is the predecessor's arrangement and the
    thing a closed mouth with two little teeth could never do. Inside the hull on both jaws, so they
    are the animal's own and not marks floating in the gap.
  */
  /*
    ⚠️ **THE WHITE IS DRAWN INSIDE THE TOOTH, NOT TO IT.** `curveLoop` draws the hull as a curve
    THROUGH its samples, and a curve cuts inside the polygon those samples describe wherever the
    outline is convex — so paint taken to a fang's authored tip is paint taken to an edge that is no
    longer there. Measured at **0.58 of a CSS pixel** over, which is invisible on the sheet and
    exactly what `tests/accents.test.ts` exists to say out loud; 0277 has the same finding about a
    belly band.
  */
  for (const [fang, swings] of [
    ...UPPER_FANGS.map((fang) => [fang, false] as const),
    ...LOWER_FANGS.map((fang) => [fang, true] as const),
  ]) {
    /*
      ⚠️ **THE WHITE IS THE SILHOUETTE'S OWN TOOTH, SHRUNK TOWARD ITS CENTRE — NOT A SECOND TRIANGLE
      AUTHORED BESIDE IT.** Authored separately it was whack-a-mole across the frames: the hull is a
      CURVE through its samples and that curve moves as the jaw swings, so an inset that cleared the
      edge on the resting face was 0.3 of a pixel over it on the open one, and tightening it for the
      open face pushed a different tooth out on the resting one. One set of points, two shapes.

      ⚠️ **AND IT SWINGS ONLY IF ITS TOOTH DOES.** The shrunk copy has to end up wherever the hull's
      tooth ended up, which is what `swings` carries down from the two authored lists — the same fact
      the outline is spliced from, rather than a second guess at it.

      ⚠️ **A TOOTH IS RIGID**: every point of one turns by the weight at its TIP, so a jaw swinging
      through it cannot shear it thinner than the 2.5 CSS pixels below which a mark is not drawn.
    */
    const [tip, a, b] = fang;
    const cx = (tip[0] + a[0] + b[0]) / 3;
    const cy = (tip[1] + a[1] + b[1]) / 3;
    const shrunk: Pt[] = [tip, a, b].map(([x, y]) => [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62]);
    poly(ctx, f, '#f2fff6', leant(swings ? shrunk.map((p) => hinged(p, turn, tip)) : shrunk), 0.95);
  }
  /*
    ⚠️ **THE FORKED TONGUE, AND ONLY WHEN THE MOUTH IS WIDE — 0285.** Reported: *"no forked tongue or
    anything."* It is drawn in the gape, so it is outside the hull and translucent for the same reason
    the mouth interior is; on the shut face it would be a tongue behind closed teeth, and on the
    resting one it would be permanently out, which is a lizard rather than a snake tasting the air.
  */
  /*
    ⚠️ **AND IT RIDES THE LOWER JAW WHOLE, BECAUSE A TONGUE LIES ON THE FLOOR OF A MOUTH.** The first
    pass ran it through the same bite-line test the mouth interior uses, which cut it in two: its
    root swung with the jaw and its tips did not, and it photographed as a crimson spike out through
    the side of the snout. The mouth interior spans the gap and this does not — it is a mark on one
    jaw, so it turns with that jaw, all of it, and the fork stays a fork.
  */
  if (jaw === 'gape') {
    const turned = (ps: readonly Pt[]): Pt[] => ps.map((p) => hinged(p, turn, [-0.6, 0.2]));
    poly(ctx, f, '#c2384a', leant(turned([
      [-0.38, 0.14],
      [-0.66, 0.09],
      [-0.9, 0.0],
      [-1.09, -0.11],
      [-0.98, 0.02],
      [-1.06, 0.13],
      [-0.88, 0.08],
      [-0.64, 0.17],
    ])), 0.88);
  }
  // A lit ridge along the top of the upper jaw, so the snout reads against the dark.
  seam(ctx, f, skin.lit, 0.03, leant([[-0.34, -0.68], [-0.66, -0.56], [-0.94, -0.44]]), 0.6, true);
  /*
    ⚠️ **THE EYE, AND IT IS THE ONE SATURATED THING ON THE ANIMAL.** A dark socket under the brow, a
    gold iris, a vertical slit and one catchlight — a snake's pupil, which is the mark that says
    *reptile* rather than *creature*. Bigger than 0277's, because the skull is the whole hull now and
    an eye sized for a detail of a fifty-six-unit sprite is a dot on a twenty-unit one.
  */
  /*
    ⚠️ **AND THE PUPIL IS WHERE THE WATCHING HAPPENS — 0285.** Reported: *"it needs to be aggressively
    moving its mouth to watch the player's ship moving."* A head cannot turn — `blit` cannot rotate —
    so what follows the ship is the SLIT, and `gaze` is which way: −1 for a ship above the animal's
    own lane, +1 for one below.

    ⚠️ **THE SOCKET AND THE IRIS DO NOT MOVE, ONLY THE SLIT AND ITS CATCHLIGHT.** An eye that slid
    about inside its own socket would read as a wobble; a pupil crossing a fixed iris reads as a look,
    which is the whole of what a snake's face does.
  */
  /*
    ⚠️ **THE SOCKET AND THE IRIS STAY ROUND WHILE THE SKULL LEANS — 0288.** A disc's centre is a
    point on the head and moves with it; its RADIUS is not, and squashing it would bake an eye that
    is an ellipse on a face whose every other curve is one too. One round eye on a long head is what
    a snake has, and it is the mark that has to read at twenty-four units against a black sky.
  */
  const look = gaze * 0.055;
  disc(ctx, f, shade(skin.plate, -0.65), -0.3, -0.34 * SKULL_LEAN, 0.19);
  disc(ctx, f, skin.eye, -0.3, -0.34 * SKULL_LEAN, 0.15);
  poly(ctx, f, '#100c04', leant([
    [-0.34, -0.46 + look],
    [-0.26, -0.46 + look],
    [-0.24, -0.34 + look],
    [-0.26, -0.22 + look],
    [-0.34, -0.22 + look],
    [-0.36, -0.34 + look],
  ]));
  disc(ctx, f, '#fffdf2', -0.35, (-0.4 + look) * SKULL_LEAN, 0.045, 0.85);
  // The nostril, high on the snout.
  disc(ctx, f, shade(skin.plate, -0.6), -0.86, -0.34 * SKULL_LEAN, 0.035);
  /*
    ⚠️ **SCALES ON THE CHEEK, THE SAME FIELD THE BODY CARRIES.** Low contrast and overlapping, so the
    head belongs to the animal behind it rather than reading as a mask bolted to a tube.
  */
  for (const [x, y, span] of [
    [0.5, -0.24, 0.3],
    [0.24, -0.1, 0.3],
    [0.5, 0.12, 0.3],
    [0.16, 0.26, 0.3],
    [0.56, 0.34, 0.26],
  ] as const) {
    const scale: Pt[] = [];
    for (let j = 0; j <= 4; j++) {
      const t = j / 4;
      scale.push([x + span * (t - 0.5), y + Math.sin(Math.PI * t) * 0.12]);
    }
    seam(ctx, f, skin.lit, 0.028, leant(scale), 0.3, true);
  }
}


/*
  ── THE FLYING FISH, REDRAWN — 0318 ─────────────────────────────────────────────────────────────

  ⚠️ **IT WAS AN EAGLE'S PATH UNTIL NOW, AND 0312 SAID SO IN WRITING WHILE REFUSING TO REPAINT IT** —
  *"a repaint is the one thing the ask does not want, and a boss hull wants eyes rather than a
  confident hour."* This is the pass that hour was being saved for, asked for by name: *"a fully great
  graphics pass over the fish … up to par with the serpent pass in style."*

  ⚠️ **SEEN FROM ABOVE, WHICH IS THE VIEW EVERY OTHER HULL IN THIS GAME IS DRAWN IN.** The ship has a
  wing either side of the screen's centreline and so does every boss; a fish drawn in profile would be
  the one body in the game seen from somewhere else. From above, a flying fish is a spindle with **two
  enormous pectorals thrown wide and swept back** — which also keeps 0264's widest span in the game, so
  nothing about what shares the screen with it changes.

  ⚠️ **A CURVE AND NOT A POLYGON** — `curveLoop` rather than `trace`, which is the serpent's skull's own
  note: every point below is a SAMPLE of a curve rather than a corner. A fish has no corners except
  where a fin ends, and those are the doubled points, because `curveLoop` smooths a lone sample into a
  bump and a fin tip is a point (0284's fangs, the same trick).

  ⚠️ **THE SILHOUETTE CARRIES THE ANIMAL AND THE PAINT ONLY LIGHTS IT** — 0284. Snout, gill, two
  pectorals, a pelvic pair, a notched peduncle and a deeply forked tail.
*/
/*
  ⚠️ **EVERYTHING BUT THE SNOUT — 0319, AND THE SPLIT IS WHAT MAKES THREE FACES ONE ANIMAL.** The
  mouth is the only part of this hull that moves, so it is the only part written three times; the
  rest is one list and cannot drift between frames. `paintSerpentHead`'s own note says the same about
  a hinged jaw: *"three authored jaws is three sets of coordinates to keep in step, and the day one of
  them gains a tooth the other two do not is the day the animal flickers."*

  ⚠️ **IT STARTS AT THE UPPER CHEEK AND ENDS AT THE LOWER ONE**, so a snout listed lower-cheek to
  upper-cheek closes the loop. `curveLoop` is closed, so where the list begins is nothing the picture
  can see — and the resting hull below is the same LOOP 0318 shipped, rotated.
*/
const VOLANS_BODY: readonly Pt[] = [
  [-0.82, -0.15],
  [-0.66, -0.19],
  // The shoulder, and the pectoral thrown wide and swept back to a point.
  [-0.52, -0.21],
  [-0.42, -0.46],
  [-0.26, -0.74],
  [-0.06, -0.95],
  [0.02, -1],
  [0.02, -1],
  // Its trailing edge, raked back in to the flank.
  [0.14, -0.72],
  [0.2, -0.46],
  [0.24, -0.3],
  // The flank, and the pelvic fin.
  [0.36, -0.27],
  [0.44, -0.41],
  [0.5, -0.42],
  [0.5, -0.42],
  [0.58, -0.25],
  // The peduncle, pinched in before the tail spreads.
  [0.7, -0.17],
  [0.74, -0.16],
  // The caudal fin: upper lobe out, the fork in, lower lobe out.
  [0.9, -0.36],
  [1, -0.52],
  [1, -0.52],
  [0.95, -0.28],
  [0.86, -0.05],
  [0.86, 0.05],
  [0.95, 0.28],
  [1, 0.52],
  [1, 0.52],
  [0.9, 0.36],
  [0.74, 0.16],
  [0.7, 0.17],
  [0.58, 0.25],
  [0.5, 0.42],
  [0.5, 0.42],
  [0.44, 0.41],
  [0.36, 0.27],
  [0.24, 0.3],
  [0.2, 0.46],
  [0.14, 0.72],
  [0.02, 1],
  [0.02, 1],
  [-0.06, 0.95],
  [-0.26, 0.74],
  [-0.42, 0.46],
  [-0.52, 0.21],
  [-0.66, 0.19],
  [-0.82, 0.15],
];

/**
 * The same body with something risen on it — 0320, worn from the last sixth of the fight.
 *
 * ── WHAT GROWS ON A FISH, WHICH IS NOT WHAT GROWS ON A SERPENT ──────────────────────────────────
 *
 * ⚠️ **ASKED**: *"We need the boss to change/morph between phases."*
 * [0305](../../docs/decisions/0305-the-serpent-darkens.md) answered that sentence with **longer
 * horns**, because a skull in profile has a crown to grow them on. A flying fish seen from above has
 * no crown and two enormous wings, so what rises on it is **fin**: the pectorals' trailing edges
 * serrate into three swept barbs a side, the pelvics lengthen, and the caudal lobes draw out.
 *
 * ⚠️ **AFT, BECAUSE AFT IS WHERE THE ROOM IS.** The leading edge already reaches 1.0 across at the
 * wing tip and the sprite's own box begins at 1.19 — barbs on the LEADING edge would have to grow
 * into the next bitmap of the atlas or not grow at all. Everything here grows into the empty quarter
 * behind each wing, which is also the direction a fin that is streaming would grow.
 *
 * ⚠️ **AND THE EXTENT DOES NOT MOVE.** `SPRITE_EXTENT.boss9Barbed` is 42, the same as the fish's, so
 * the hurtbox the player is dodging is the hurtbox they learned in the first phase. A boss that grew
 * its own collision at a health threshold would be teaching the player something and then taking it
 * back — and `tests/combat.test.ts` holds every hurtbox against one number per kind.
 */
const VOLANS_BARBED: readonly Pt[] = [
  [-0.82, -0.15],
  [-0.66, -0.19],
  [-0.52, -0.21],
  [-0.42, -0.46],
  [-0.26, -0.74],
  [-0.06, -0.95],
  [0.02, -1],
  [0.02, -1],
  /*
    ⚠️ **THREE LONG RAYS OFF THE TRAILING EDGE, AND THE FIRST DRAFT WAS A SAWTOOTH.** Cut as shallow
    teeth — 0.1 deep and as wide as they were long — they photographed as a fin that had been **torn**
    rather than one that had grown something: `curveLoop` rounds a lone sample, so every notch came
    back a bump and every point a hook, and the wing read as damage. A ray is three times longer than
    it is wide, which is what makes it a ray; the notches between them are deep and narrow.

    ⚠️ **AND THEY SIT AT THE HEIGHTS THE STREAMERS ALREADY LEAVE FROM**, so what the player sees is
    the filaments 0318 paints rooted on something rather than two sets of aft-pointing marks that
    disagree about where the fin ends.
  */
  [0.06, -0.9],
  [0.42, -0.88],
  [0.42, -0.88],
  [0.1, -0.82],
  [0.44, -0.77],
  [0.44, -0.77],
  [0.14, -0.7],
  [0.4, -0.62],
  [0.4, -0.62],
  [0.19, -0.5],
  [0.24, -0.3],
  // The pelvic, longer and raked.
  [0.36, -0.27],
  [0.47, -0.49],
  [0.55, -0.51],
  [0.55, -0.51],
  [0.58, -0.25],
  [0.7, -0.17],
  [0.74, -0.16],
  // The caudal lobes drawn out — and no further, or the streamer painted off the lobe sits inside it.
  [0.93, -0.4],
  [1.05, -0.58],
  [1.05, -0.58],
  [0.97, -0.3],
  [0.86, -0.05],
  [0.86, 0.05],
  [0.97, 0.3],
  [1.05, 0.58],
  [1.05, 0.58],
  [0.93, 0.4],
  [0.74, 0.16],
  [0.7, 0.17],
  [0.58, 0.25],
  [0.55, 0.51],
  [0.55, 0.51],
  [0.47, 0.49],
  [0.36, 0.27],
  [0.24, 0.3],
  [0.19, 0.5],
  [0.4, 0.62],
  [0.4, 0.62],
  [0.14, 0.7],
  [0.44, 0.77],
  [0.44, 0.77],
  [0.1, 0.82],
  [0.42, 0.88],
  [0.42, 0.88],
  [0.06, 0.9],
  [0.02, 1],
  [0.02, 1],
  [-0.06, 0.95],
  [-0.26, 0.74],
  [-0.42, 0.46],
  [-0.52, 0.21],
  [-0.66, 0.19],
  [-0.82, 0.15],
];

/**
 * The three mouths, each listed lower cheek → tip → upper cheek — 0319.
 *
 * ── A MOUTH SEEN FROM ABOVE OPENS ACROSS, NOT DOWN ──────────────────────────────────────────────
 *
 * ⚠️ **THE SERPENT HINGES ITS JAW AND THIS CANNOT, AND THAT IS THE VIEW AND NOT A SHORTCUT.** A
 * hinge is a thing you see in PROFILE; every hull in this game is drawn from overhead
 * ([0023](../../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md)), so what a fish's mouth
 * does on this screen is **two mandibles splaying apart with the throat between them**. Same ladder,
 * same three silhouettes, a geometry of its own — *"the pattern is what we want, the style is what
 * makes the different bosses unique"* (0313's own quote).
 *
 * ⚠️ **AND THE TWO THROWS GO OPPOSITE WAYS FROM REST, WHICH IS 0285's WHOLE POINT.** `gape` cuts a
 * notch back into the snout and so takes flesh AWAY; `shut` swells the cheeks and packs flesh ON. A
 * snap that read as a gape would make the tell a lie, and `tests/volans.test.ts` measures the three
 * areas rather than trusting these numbers.
 *
 * ⚠️ **`rest` IS BYTE-FOR-BYTE WHAT 0318 SHIPPED**, because that silhouette is the one the ask
 * approved — *"the shape is good"* — and a face set is not a licence to redraw the animal.
 */
const VOLANS_JAWS = ['rest', 'gape', 'shut'] as const;
type VolansJaw = (typeof VOLANS_JAWS)[number];

const VOLANS_SNOUTS: Record<VolansJaw, readonly Pt[]> = {
  rest: [
    [-0.93, 0.09],
    [-1, 0],
    [-1, 0],
    [-0.93, -0.09],
  ],
  /*
    Out along the underside of the lower mandible to its point, back along its inside to the throat,
    across, and out again the other way. Doubled at each point, on `curveLoop`'s own terms.
  */
  gape: [
    [-0.88, 0.15],
    [-0.99, 0.23],
    [-0.99, 0.23],
    [-0.92, 0.1],
    [-0.85, 0.02],
    [-0.85, -0.02],
    [-0.92, -0.1],
    [-0.99, -0.23],
    [-0.99, -0.23],
    [-0.88, -0.15],
  ],
  // Jaws meshed: the point is where it was and the cheeks behind it are packed out, which is what a
  // head that has just bitten down does. It must not LENGTHEN — a snap is not a lunge.
  shut: [
    [-0.9, 0.17],
    [-1, 0],
    [-1, 0],
    [-0.9, -0.17],
  ],
};

/** The fish's whole outline: one of its two bodies wearing one of its three mouths. */
function volansHull(jaw: VolansJaw, barbed: boolean): readonly Pt[] {
  return [...(barbed ? VOLANS_BARBED : VOLANS_BODY), ...VOLANS_SNOUTS[jaw]];
}

/**
 * Which mouth and which way the eyes are looking, read off the sprite's own name — 0319.
 *
 * ⚠️ **OFF THE NAME, WHICH IS `skullOf`'s ARRANGEMENT AND ITS REASON TOO.** The alternative is eight
 * arms in the switch that each repeat the same six lines with two literals changed, and the day one
 * of them gains a mark the others do not is the day the animal flickers — which is exactly what
 * `paintSerpentHead` says about writing a jaw out three times.
 */
function volansFace(kind: SpriteKind): { jaw: VolansJaw; gaze: number; barbed: boolean } {
  // 0320: `boss9Barbed…` wears the same six faces on the grown body, so the suffix says the mouth.
  const barbed = kind.startsWith('boss9Barbed');
  const worn = barbed ? kind.slice('boss9Barbed'.length) : kind.slice('boss9'.length);
  if (worn === 'Gape' || worn === 'GapeHit') return { jaw: 'gape', gaze: 0, barbed };
  if (worn === 'Shut' || worn === 'ShutHit') return { jaw: 'shut', gaze: 0, barbed };
  // Seen from above, the ship being up-lane of the fish puts it to one side across the lane — 0023.
  if (worn === 'Up') return { jaw: 'rest', gaze: -1, barbed };
  if (worn === 'Down') return { jaw: 'rest', gaze: 1, barbed };
  return { jaw: 'rest', gaze: 0, barbed };
}

/**
 * The head marks that have to move with the mouth — 0319.
 *
 * ⚠️ **THREE OF THEM AND NOT THE WHOLE HEAD.** The gill seam and the eyes sit behind the jaw and do
 * not move with it; the lit ridge along the snout, the mouth line under it and the throat are on the
 * jaw itself, so they are authored per face or they slide off it. `tests/accents.test.ts` measures
 * each one against the face's own outline, which is what caught the first draft of all three.
 */
interface VolansSnoutPaint {
  /** The lit strip along the top of the upper mandible. */
  ridge: readonly Pt[];
  /** The mouth line, under it. */
  mouth: readonly Pt[];
  /** The dark of the open mouth, behind the notch — `null` on a closed one. */
  throat: readonly Pt[] | null;
}

const VOLANS_SNOUT_PAINT: Record<VolansJaw, VolansSnoutPaint> = {
  rest: {
    // ⚠️ Narrow, and short of the point: photographed wide once and it read as a BEAK, which is the
    // one thing this hull spent 0312 and 0316 getting away from.
    ridge: [
      [-0.96, -0.025],
      [-0.9, -0.078],
      [-0.81, -0.108],
      [-0.815, -0.072],
      [-0.895, -0.045],
    ],
    mouth: [
      [-0.97, 0.02],
      [-0.86, 0.08],
      [-0.72, 0.11],
    ],
    throat: null,
  },
  gape: {
    ridge: [
      [-0.965, -0.205],
      [-0.93, -0.18],
      [-0.89, -0.148],
      [-0.895, -0.122],
      [-0.945, -0.172],
    ],
    mouth: [
      [-0.945, 0.172],
      [-0.92, 0.14],
      [-0.885, 0.11],
    ],
    /*
      ⚠️ **A TAPERED GULLET AND NOT A BAR, WHICH IS WHAT THE FIRST DRAFT PHOTOGRAPHED AS.** Held at an
      even width it baked as a dark RECTANGLE parked between the eyes — a hole in the paint rather
      than a depth in the animal. It has to be widest where the notch leaves off and run out to
      nothing behind, which is what a throat seen down is.

      ⚠️ **AND IT STARTS BEHIND THE NOTCH'S APEX, BECAUSE IN FRONT OF IT THERE IS NO FISH.** The
      mandibles meet at 0.85 along; anything drawn forward of that at the centreline is ink in the
      void, and `tests/accents.test.ts` says so in pixels.
    */
    throat: [
      [-0.835, 0.052],
      [-0.78, 0.045],
      [-0.71, 0.026],
      [-0.65, 0.008],
      [-0.65, -0.008],
      [-0.71, -0.026],
      [-0.78, -0.045],
      [-0.835, -0.052],
    ],
  },
  shut: {
    ridge: [
      [-0.955, -0.03],
      [-0.885, -0.1],
      [-0.795, -0.145],
      [-0.8, -0.105],
      [-0.88, -0.065],
    ],
    mouth: [
      [-0.96, 0.025],
      [-0.85, 0.1],
      [-0.71, 0.135],
    ],
    throat: null,
  },
};

/**
 * The flying fish's paint — 0318, on 0276's lifted kit and in the serpent's own order.
 *
 * ⚠️ **THE ORDER IS THE DEPTH, WHICH IS `paintSerpentHead`'s NOTE AND IS THE WHOLE OF WHY THAT ONE
 * WORKS.** Form-shade over the entire body first, so everything after it sits on a hull that already
 * has a back and a belly; then the membranes, which are the fins and are thinner than the flesh; then
 * the flank marks; then the head, which is the part that says what it is and so is painted last and
 * over everything.
 *
 * ⚠️ **WHAT IT REPLACES WAS SIX FLAT MARKS** — three dark quills a side, a lit leading edge, a bar
 * across the tail and a disc for an eye — which is the exact list
 * `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` makes about the predecessor's serpent before
 * 0276 lifted the kit.
 */
function paintBoss9(
  ctx: Pen,
  f: Frame,
  skin: FoeSkin,
  theme: ThemeKind,
  jaw: VolansJaw,
  gaze: number,
  barbed: boolean,
): void {
  const hull = volansHull(jaw, barbed);
  const snout = VOLANS_SNOUT_PAINT[jaw];
  /*
    ⚠️ **THE KINDLED FISH IS LIT HARDER FROM WITHIN, AND IT IS ONE NUMBER — 0320.** The aura behind it
    is a layer of its own that `layAura` draws; what the HULL does is burn brighter, which is this
    multiplier over every light on it. A second set of authored alphas would be the same drawing
    written twice, and 0282 is why that is refused rather than tidied later.
  */
  const lit = barbed ? 1.55 : 1;
  /*
    ⚠️ **THE ASTRAL HALO, BEHIND THE HULL** — asked for: *"give it overall a more nebulous astral
    look."* `destination-over`, **brightest ring first**, so each new fill goes further back and the
    falloff stacks outward; 0277 shipped this the other way round once and it baked as two flat slabs
    with a hard edge between them.

    ⚠️ **AND IT STOPS AT 1.12, BECAUSE THE TAIL AND THE WING TRAILS BOTH REACH 1.0 NOW.** A halo is
    the one mark that leaves its hull on purpose, so it is the one that can run off its own tile and
    bleed into the next bitmap in the atlas — `tests/accents.test.ts` holds every translucent mark at
    1.16 of the drawing radius, and the serpent's own halo sits at 1.14 over a hull that reaches 1.06.
  */
  /*
    ⚠️ **AND THE OUTERMOST RING IS CAPPED IN ABSOLUTE TERMS, NOT IN SWELL — 0320.** A fixed 1.12 swell
    was right for one hull and wrong for two: the kindled body's tail reaches 1.05, so the same
    multiplier put the faintest ring at **1.19 of the drawing radius** and into the next bitmap of the
    atlas. The cap is read off the hull the arm was handed, so a third body cannot reintroduce this.
  */
  const skirt = Math.max(...hull.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
  ctx.globalCompositeOperation = 'destination-over';
  for (const [gap, alpha] of [
    [0.02, 0.2],
    [0.06, 0.11],
    [0.12, 0.05],
  ] as const) {
    const swell = Math.min(1 + gap, 1.13 / skirt);
    ctx.globalAlpha = alpha * lit;
    ctx.fillStyle = skin.lit;
    ctx.beginPath();
    curveLoop(ctx, f, hull.map(([x, y]) => [x * swell, y * swell] as const));
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
  }
  /*
    ⚠️ **AND ONE SOFT LIGHT IN THE TAIL'S OWN NOTCH, WHICH IS THE ONLY PLACE A LOOSE GLOW EARNED ITS
    KEEP.** A first pass hung four behind each side, out where the streamers end: photographed, they
    baked as **detached brown smudges** — a glow over the void at a fifth alpha is not a light, it is a
    stain, and nothing joined them to the animal. The halo is what lights the space around this body;
    a glow only works where there is hull on both sides of it to pick it up.
  */
  glow(ctx, f, skin.lit, 0.86, 0, 0.26, 0.3 * lit);
  ctx.globalCompositeOperation = 'source-over';
  /*
    ⚠️ **THE FORM-SHADE, ACROSS THE WHOLE ANIMAL AND UNDER EVERYTHING ELSE.** A gradient from the lit
    edge to the shadowed one over the hull's own path: it is what turns a cut-out into a body, and it
    is the first mark the serpent's own paint makes.
  */
  shaded(ctx, f, [0, -1], [0, 1], rgba(skin.lit, 0.22), rgba(skin.plate, 0.5), hull, 1, true);
  /*
    ⚠️ **AND IT IS LIT FROM INSIDE, WHICH IS THE HALF OF *ASTRAL* A HALO CANNOT DO.** A halo says
    there is light around the animal; a core says the light is coming OUT of it. Over the form-shade
    and under every seam, so everything painted after it reads as sitting on a body that glows rather
    than beside one.

    ⚠️ **`source-atop`, BECAUSE A ROUND GLOW ON A LONG BODY SPILLS PAST THE HEAD.** At 0.42 the disc
    reaches ±0.42 across while the snout is 0.17 wide, and unclipped it baked as a haze sitting beside
    the animal rather than inside it. The flash wash is clipped the same way and for the same reason
    (0287); the halo above is what light OUTSIDE the hull is for.
  */
  ctx.globalCompositeOperation = 'source-atop';
  glow(ctx, f, skin.lit, -0.34, 0, 0.42, 0.16 * lit);
  glow(ctx, f, skin.lit, 0.3, 0, 0.3, 0.1 * lit);
  ctx.globalCompositeOperation = 'source-over';
  for (const side of [-1, 1]) {
    /*
      ⚠️ **A FIN IS A MEMBRANE OVER RAYS, AND BOTH ARE INSIDE THE OUTLINE.** The wash darkens the
      pectoral towards its trailing edge so the fin reads as thinner than the flesh it leaves; the rays
      are seams rather than filled wedges, because a ray is a line in a membrane and a wedge is a
      feather — which is what this hull used to be drawn with.
    */
    shaded(
      ctx,
      f,
      [-0.4, -0.2 * side],
      [0.06, -0.92 * side],
      rgba(skin.plate, 0.1),
      rgba(skin.plate, 0.62),
      [
        [-0.46, 0.215 * side],
        [-0.37, 0.42 * side],
        [-0.23, 0.66 * side],
        [-0.06, 0.85 * side],
        [0.1, 0.65 * side],
        [0.16, 0.43 * side],
        [0.15, 0.27 * side],
      ],
      1,
      true,
    );
    /*
      ⚠️ **EVERY RAY STOPS SHORT OF THE LEADING EDGE, AND THE FIRST DRAFT DID NOT** — it ran to 0.74
      across at 0.32 along, where the fin only reaches 0.64, so `tests/accents.test.ts`'s stroke claim
      read it as ink in the void. The wash above had the same fault at its root: 0.02 inside an outline
      is inside a straight polygon and outside a smoothed one, because `curveLoop` overshoots a corner.
    */
    for (const [ax, ay, bx, by] of [
      [-0.44, 0.27, -0.34, 0.52],
      [-0.38, 0.26, -0.22, 0.7],
      [-0.3, 0.26, -0.06, 0.84],
      [-0.22, 0.26, 0.06, 0.78],
      [-0.14, 0.26, 0.12, 0.52],
    ] as const) {
      seam(ctx, f, rgba(skin.plate, 0.5), 0.022, [
        [ax, ay * side],
        [bx, by * side],
      ]);
    }
    // The pelvic fin gets the same treatment at a third the size — one ray, and a wash off the flank.
    shaded(
      ctx,
      f,
      [0.42, 0.2 * side],
      [0.5, 0.48 * side],
      rgba(skin.plate, 0.1),
      rgba(skin.plate, 0.55),
      [
        [0.39, 0.26 * side],
        [0.44, 0.38 * side],
        [0.49, 0.39 * side],
        [0.53, 0.26 * side],
      ],
      1,
      true,
    );
    seam(ctx, f, rgba(skin.plate, 0.45), 0.02, [
      [0.41, 0.3 * side],
      [0.47, 0.38 * side],
    ]);
    /*
      ⚠️ **THE TAIL'S RAYS RUN OUT OF THE PEDUNCLE AND NOT OFF THE SPINE**, which is what a caudal fin
      does and is the difference between a tail and a pair of flaps. Three a lobe, fanning.
    */
    for (const [tx, ty] of [
      [0.95, 0.38],
      [0.9, 0.28],
      [0.86, 0.16],
    ] as const) {
      seam(ctx, f, rgba(skin.plate, 0.5), 0.022, [
        [0.76, 0.12 * side],
        [tx, ty * side],
      ]);
    }
    // And the back lit along the shoulder, where the light is coming from — a ribbon, tapering out.
    seam(ctx, f, rgba(skin.lit, 0.28), 0.034, [
      [-0.86, 0.1 * side],
      [-0.6, 0.15 * side],
      [-0.3, 0.17 * side],
      [0.1, 0.16 * side],
      [0.45, 0.13 * side],
    ], 1, true);
    /*
      ── THE TRAILS, WHICH ARE PAINT AND NOT SILHOUETTE ───────────────────────────────────────────

      Asked for: *"extend the wings to have longer finny trails coming off them… the shape is good,
      just needs some extra flavour enhancements."*

      ⚠️ **THE FIRST DRAFT PUT THEM IN THE HULL AND THE PHOTOGRAPH REFUSED IT.** A filament drawn as
      silhouette gets the outline traced round it, so the gap between the streamer and the fin it
      leaves becomes a black wedge with a hard edge — at 4× the wing read as a **hook** rather than a
      wing, and the notch read as a bite out of the animal. *"The shape is good"* is the sentence that
      settles it: the hull the ask approved is the hull that ships, and the trails go on it.

      ⚠️ **AND A TRAIL SHOULD BE SOFT ANYWAY, WHICH IS THE HALF THE FIRST DRAFT HAD BACKWARDS.** These
      are the one mark on this body that is allowed to leave the hull, on the halo's own terms — a
      translucent ribbon fading to nothing, bounded by `tests/accents.test.ts` at 1.16 of the drawing
      radius. Three off the pectoral at falling lengths, one off the pelvic and one off the tail lobe,
      each swept clear of every fin behind it.

      ⚠️ **EACH ONE TAPERS TO A POINT AND IS DRAWN BRIGHT**, which the draft before this did neither:
      five-sided with the root ON the trailing edge and the far end a single vertex, so it reads as a
      filament rather than a slab, and at 0.8 rather than 0.6 because a `lit` ink laid at a third over
      the void bakes olive. Still under 0.9, which is where `tests/accents.test.ts` starts calling a
      mark solid and holding it inside the silhouette.
    */
    for (const [ax, ay, bx, by, cx, cy, dx, dy, ex, ey] of [
      [0.03, 0.96, 0.5, 1.02, 1.08, 0.99, 0.48, 0.94, 0.05, 0.9],
      [0.08, 0.845, 0.45, 0.88, 0.95, 0.85, 0.44, 0.81, 0.1, 0.79],
      [0.13, 0.73, 0.4, 0.75, 0.8, 0.71, 0.38, 0.67, 0.15, 0.66],
      [0.47, 0.41, 0.64, 0.5, 0.84, 0.57, 0.62, 0.45, 0.49, 0.365],
      [0.99, 0.52, 1.06, 0.58, 1.13, 0.63, 1.03, 0.53, 0.975, 0.485],
    ] as const) {
      shaded(
        ctx,
        f,
        [ax, ay * side],
        [cx, cy * side],
        rgba(skin.lit, 0.7),
        rgba(skin.lit, 0),
        [
          [ax, ay * side],
          [bx, by * side],
          [cx, cy * side],
          [dx, dy * side],
          [ex, ey * side],
        ],
        0.8,
        true,
      );
    }
    /*
      ⚠️ **AND A DUST OF MOTES ALONG THE BACK.** Three small lights a side, staggered off the dorsal
      line and shrinking aft: it is the mark that makes the flesh look like it is made of the place
      rather than painted in its colours, and it is the cheapest half of *nebulous* there is. Small,
      low and staggered, which is the finding 0277 records three ways about a run of identical marks.
    */
    for (const [x, y, radius] of [
      [-0.46, 0.11, 0.1],
      [-0.12, 0.14, 0.085],
      [0.26, 0.1, 0.07],
    ] as const)
      glow(ctx, f, skin.lit, x, y * side, radius, 0.24 * lit);
  }
  /*
    ⚠️ **THE LATERAL LINE, WHICH IS THE ONE MARK ON A FISH EVERYBODY KNOWS AND NOBODY NAMES.** A seam
    from the gill to the tail root, dead centre: it is the mark that makes the two halves of this
    silhouette read as one animal rather than as a shape with a mirror down it.
  */
  seam(ctx, f, rgba(skin.plate, 0.55), 0.03, [
    [-0.72, -0.02],
    [-0.3, 0.01],
    [0.2, 0.02],
    [0.62, 0.01],
  ], 1, true);
  // The place's own motif along the flank — embers in the nebula, scales in the Saurian Belt.
  motif(ctx, f, skin, theme, [
    [-0.58, -0.16],
    [0.5, -0.13],
    [0.5, 0.13],
    [-0.58, 0.16],
  ], 'boss9');
  /*
    ⚠️ **THE HEAD LAST AND OVER EVERYTHING** — 0284's order, and its warning with it: *"the first pass
    drew a fully-detailed head that read as a blunt stump"*, because a head against open space needs
    its own light and not only its outline. So: the gill plate as a seam, the jaw line under it, the
    snout lit along its top, and the eye high and forward where a fish's is.
  */
  seam(ctx, f, rgba(skin.plate, 0.6), 0.03, [
    [-0.61, -0.165],
    [-0.54, 0],
    [-0.61, 0.165],
  ], 1, true);
  /*
    ⚠️ **THE THROAT FIRST, BECAUSE AN OPEN MOUTH IS A DARK PLACE AND NOT A GAP IN THE OUTLINE** —
    0319. The notch is cut OUT of the silhouette, so what shows through it is the starfield; what
    says *mouth* is the dark immediately behind it, which the two mandibles then frame. The
    predecessor's own finding, quoted at `paintSerpentHead`: draw the gullet first, or *"the first
    pass managed to draw a lit mouth nobody could see."*
  */
  if (snout.throat !== null) poly(ctx, f, shade(skin.plate, -0.55), snout.throat, 0.85);
  poly(ctx, f, skin.lit, snout.ridge, 0.7);
  seam(ctx, f, rgba(skin.plate, 0.5), 0.024, snout.mouth, 1, true);
  /*
    ⚠️ **THE PUPIL MOVES AND THE EYE DOES NOT, WHICH IS THE WHOLE OF `up` AND `down`** — 0285, and it
    is why those two faces share the resting hull's hurt twin: a hurt twin is the silhouette with no
    paint on it (0035), and the silhouette has not moved. Seen from above, *up-lane* and *down-lane*
    are ACROSS the sprite, which is the direction `gaze` pushes it.
  */
  for (const side of [-1, 1]) eye(ctx, f, skin, -0.8, 0.095 * side, 0.042, gaze);
}

/*
  THE PTERODACTYL. A long beak, a crest swept back over the skull, and two wings swept to the back
  corners with the membrane scalloped between the wing-fingers and the body.
*/
const QUETZAL_HULL: readonly Pt[] = [
  [-1, 0],
  [-0.62, -0.1],
  [-0.52, -0.2],
  [-0.3, -0.56],
  [-0.34, -0.32],
  [-0.2, -0.24],
  [-0.1, -0.28],
  [0.85, -1],
  [0.96, -0.84],
  [0.6, -0.56],
  [0.66, -0.46],
  [0.34, -0.32],
  [0.4, -0.22],
  [0.2, -0.16],
  [0.6, -0.08],
  [1, -0.05],
  [1, 0.05],
  [0.6, 0.08],
  [0.2, 0.16],
  [0.4, 0.22],
  [0.34, 0.32],
  [0.66, 0.46],
  [0.6, 0.56],
  [0.96, 0.84],
  [0.85, 1],
  [-0.1, 0.28],
  [-0.2, 0.24],
  [-0.52, 0.2],
  [-0.62, 0.1],
];
function paintBoss10(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The membrane: ribs from the shoulder to the wing-finger and to each scallop, both wings.
  for (const side of [-1, 1]) {
    plate(ctx, f, skin, [
      [0, -0.32 * side],
      [0.78, -0.9 * side],
      [0.8, -0.86 * side],
      [0.02, -0.28 * side],
    ]);
    plate(ctx, f, skin, [
      [0.02, -0.3 * side],
      [0.56, -0.56 * side],
      [0.58, -0.52 * side],
      [0.04, -0.26 * side],
    ]);
    plate(ctx, f, skin, [
      [0.04, -0.26 * side],
      [0.3, -0.32 * side],
      [0.32, -0.28 * side],
      [0.06, -0.22 * side],
    ]);
  }
  // Scales on the body, in the place's motif.
  motif(ctx, f, skin, theme, [
    [-0.15, -0.14],
    [0.5, -0.07],
    [0.5, 0.07],
    [-0.15, 0.14],
  ], 'boss10');
  // The crest lit, the beak lit along its length, the eye in its socket.
  lit(ctx, f, skin, [
    [-0.4, -0.32],
    [-0.32, -0.5],
    [-0.35, -0.34],
    [-0.44, -0.28],
  ]);
  lit(ctx, f, skin, [
    [-0.92, 0],
    [-0.7, -0.05],
    [-0.68, -0.01],
    [-0.88, 0.012],
  ]);
  disc(ctx, f, shade(skin.plate, -0.5), -0.52, -0.06, 0.05);
  disc(ctx, f, skin.eye, -0.53, -0.06, 0.032);
}
/*
  ── THE GYRE, UPSCALED AND WORN — 0332 ─────────────────────────────────────────────────────────

  ⚠️ **ASKED FOR**: *"upscale the graphics and have it change as it gets more damaged"*, and *"the
  section of it that looks pointed"* — which is the thing the whole fight is read off, so it is
  drawn as one unmistakable SPIKE rather than as the longest of sixteen equal teeth.

  **Sixteen teeth, eight of them points.** The cog's edge alternates a point and a valley all the way
  round, which is the silhouette 0264 gave it; what is new is that the point at the sprite's own
  `+x` — the leading edge, which is `curtainStance` 0 — reaches further, narrows to a tip, and is
  painted in the lit ink with a bright cap. Every other point is 0.86 and this one is 1.0.

  ⚠️ **IT IS BAKED POINTING AT THE LEADING EDGE, AND THAT IS WHAT MAKES `turn` READ AS A COMPASS.**
  `src/sim/entity.ts`'s `turnFor` says every sprite is baked facing `π` — down the lane, at the
  player — so a mark at `+x` is at heading 0, the leading edge, and a turn of `k × τ/8` swings it
  round to the k-th stance's own edge. `tests/gyre.test.ts` holds the pairing rather than this
  comment.

  ⚠️ **THREE BODIES, ONE BOX.** `wear` is 0, 1 or 2 — whole, chipped, broken — and every one of them
  is drawn inside the same 52-unit tile, on 0320's finding: a boss that grew its own extent at a
  health threshold hands back what the first phase taught about where its edge is.

  ⚠️ **AND THE SPIKE SURVIVES ALL THREE.** Teeth come off, the rim splits and the core burns
  through; the one mark the player is steering by is the one mark the damage does not take, because
  a tell that goes missing in the last phase is a tell that fails where it is needed most.
*/

/** How many teeth run round the rim. The spike stands where the first one would. */
const GYRE_TEETH = 16;
/** The root circle the teeth stand on, and the tip circle they reach. */
const GYRE_ROOT = 0.78;
const GYRE_TIP = 0.88;
/** The marker spike: a quarter of a tooth further out than any of them, and a third as wide. */
const GYRE_SPIKE = 1;

/**
 * Which teeth have been knocked off at each wear — never the first, which is the spike.
 *
 * ⚠️ **SPREAD RATHER THAN CLUSTERED**, so a broken cog reads as one that has been running too long
 * rather than as one something took a bite out of.
 */
const GYRE_LOST: readonly (readonly number[])[] = [
  [],
  [3, 9, 13],
  [2, 3, 6, 9, 10, 13, 14],
  // The fourth body — 0336: half the teeth gone, and none of them next to the spike.
  [2, 3, 5, 6, 7, 9, 10, 11, 13, 14],
  /*
    ⚠️ **AND THE WRECK, WHICH IS THE ONLY ONE THAT LOSES TEETH ON ONE SIDE — 0337.** It landed on its
    lower edge, so what is gone is what hit the floor: the bottom half of the rim. Spread damage says
    *worn out*; damage all on one side says *this fell*, and that is the whole difference between a
    body that stopped working and a body that came out of a wall.
  */
  [4, 5, 6, 7, 8, 9, 10, 11, 12],
];

/*
  ⚠️ **AND THE HUB IS SOLID NOW, WHERE 0264's COG HAD A HOLE THROUGH IT.** A hole is a hole in the
  SILHOUETTE — `tests/accents.test.ts` holds that nothing solid may be painted over one, and rightly:
  a mark inside the bore is a mark on the sky. *"It changes as it gets more damaged"* wants a core
  that burns brighter as the body goes, and a core is a thing you can see. So what used to be a bore
  is a lit heart in a dark collar, and the widening the broken body does is the heart's rather than
  the hole's.
*/

/**
 * The cog's outline at a given wear, as one closed path.
 *
 * ⚠️ **A TOOTH IS FLAT-TOPPED AND SHALLOW, AND THE FIRST DRAFT'S WAS NEITHER.** Sixteen samples
 * alternating 0.86 and 0.66 photographed as an **eight-pointed star**: a fifth of the radius deep
 * with no flat on top, so the teeth WERE the silhouette and the ring they stand on was invisible.
 * Four samples a tooth over a tenth of the radius is a cog — and it is also the difference between
 * the spike reading as *the* point and reading as one of nine.
 */
function traceGyre(ctx: Pen, f: Frame, wear: number): void {
  const lost = GYRE_LOST[wear] ?? [];
  const pitch = (Math.PI * 2) / GYRE_TEETH;
  let started = false;
  const at = (a: number, reach: number): void => {
    const x = f.half + Math.cos(a) * reach * f.r;
    const y = f.half + Math.sin(a) * reach * f.r;
    if (started) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    started = true;
  };
  for (let i = 0; i < GYRE_TEETH; i++) {
    const a = i * pitch;
    if (i === 0) {
      // The spike, off the root circle, to a point further out than any tooth reaches.
      at(a - pitch * 0.2, GYRE_ROOT);
      at(a, GYRE_SPIKE);
      at(a + pitch * 0.2, GYRE_ROOT);
      continue;
    }
    // A tooth that has come off leaves the root circle it stood on.
    at(a - pitch * 0.3, GYRE_ROOT);
    if (!lost.includes(i)) {
      at(a - pitch * 0.18, GYRE_TIP);
      at(a + pitch * 0.18, GYRE_TIP);
    }
    at(a + pitch * 0.3, GYRE_ROOT);
  }
  ctx.closePath();
}

/*
  ── THE COG IS DRAWN IN RINGS, AND THE FIRST DRAFT DREW IT IN WEDGES ──────────────────────────

  ⚠️ **PHOTOGRAPHED AT 4× ON THE SHEET (0193), THE FIRST PASS CAME BACK AS A STAR WITH BARS ON IT.**
  Two 120° arcs of shading laid across the middle of the body, four spokes on top of them and the
  place's circuitry over that, all in the same band: at 52 units across nothing read as a part of a
  machine, because nothing was BOUNDED by anything. The fix is not fewer marks, it is rings — the
  drawing is a rim band, a web between the rim and the hub, and a hub — and every mark belongs to
  exactly one of them. `docs/decisions/0027-measure-the-picture-not-the-model.md`: the guards were
  green for both drawings.
*/

/** Where the rim band ends and the web behind it begins. */
const GYRE_RIM = 0.6;
/** Where the web ends and the hub begins. */
const GYRE_HUB = 0.3;

function paintBoss11(ctx: Pen, f: Frame, skin: FoeSkin, wear: number): void {
  /*
    THE RIM BAND: lit above, in shadow below, so a flat disc reads as a wheel lit from up-lane. It
    stops short of the root circle, which is what leaves the teeth their own colour and makes them
    teeth rather than a scalloped edge.
  */
  plate(ctx, f, skin, sector(GYRE_RIM, GYRE_ROOT - 0.03, 0.12, Math.PI - 0.12, 18));
  /*
    ⚠️ **THE LIT HALF IS A STRIP AND THE SHADOWED HALF IS THE WHOLE BAND, WHICH IS NOT SYMMETRY AND
    IS NOT MEANT TO BE.** Shadow is the hull's own colour gone dark and reads as depth at any size;
    `lit` is the place's hot pink, and a 120° arc of it eight units deep photographed as a pink blob
    with a cog behind it. A light catches an EDGE.
  */
  lit(ctx, f, skin, sector(GYRE_ROOT - 0.13, GYRE_ROOT - 0.03, -Math.PI + 0.12, -0.12, 18));
  /*
    THE WEB: four spokes between the hub and the rim, each a shadowed bar with a lit leading edge.
    A broken cog keeps two of them.

    ⚠️ **THE SPOKES ARE WHAT THE UPSCALE IS FOR.** At 36 units across there was nothing between the
    hub and the teeth but a band; at 52 that band is eight world units deep, and eight units of flat
    colour is the thing a bigger sprite makes worse rather than better.
  */
  const spokes = wear >= 2 ? 2 : 4;
  for (let s = 0; s < spokes; s++) {
    const a = 0.55 + (s / 4) * Math.PI * 2;
    const c = Math.cos(a);
    const n = Math.sin(a);
    const w = 0.07;
    plate(ctx, f, skin, [
      [c * GYRE_HUB - n * w, n * GYRE_HUB + c * w],
      [c * GYRE_RIM - n * w, n * GYRE_RIM + c * w],
      [c * GYRE_RIM + n * w, n * GYRE_RIM - c * w],
      [c * GYRE_HUB + n * w, n * GYRE_HUB - c * w],
    ]);
    lit(ctx, f, skin, [
      [c * (GYRE_HUB + 0.02) - n * w, n * (GYRE_HUB + 0.02) + c * w],
      [c * (GYRE_RIM - 0.02) - n * w, n * (GYRE_RIM - 0.02) + c * w],
      [c * (GYRE_RIM - 0.02) - n * w * 0.35, n * (GYRE_RIM - 0.02) + c * w * 0.35],
      [c * (GYRE_HUB + 0.02) - n * w * 0.35, n * (GYRE_HUB + 0.02) + c * w * 0.35],
    ]);
  }
  /*
    ⚠️ **AND THERE IS NO `motif` ON THIS HULL ANY MORE, WHICH IS A DECISION AND NOT AN OMISSION.**
    Every other body in the game carries the place's own marks on a belly; a wheel has no belly, it
    has a ring — and `motif` steps a 0.24 grid over the belly's BOUNDING BOX and drops any mark that
    does not fit inside it, so on an annulus it lands wherever the grid happens to intersect. At 36
    units across the old wedge held two rivets; at 52 the ring came back from the sheet with three
    labyrinth pads stuck to the top-left and top-right of it and nothing anywhere else, which reads
    as damage rather than as livery. **What says which place this is on this hull is the skin** —
    0228's teal, 0223's hot pink on the rim and the spokes, the red core — and that is on every mark
    here. A motif that has to be hand-placed per hull is a different mechanism from the one that
    exists, and it is not owed by one boss.
  */
  /*
    ⚠️ **THE SPIKE IS LIT, WHICH IS THE ONE THING THIS DRAWING OWES THE FIGHT.** Every other mark
    here is decoration; this is the sentence *the next wall comes in over there*, and it has to
    survive being read at a glance, at speed, in a place whose whole palette is teal. It runs from
    the hub out along the spike, so what the eye follows is a line through the middle of the wheel
    and out of it rather than a mark on the edge.

    ⚠️ **AND IT STOPS WELL INSIDE THE SPIKE'S OWN TAPER, WHICH A GUARD HAD TO SAY TWICE.** A first
    draft ran to the tip and capped it with a disc at 0.9; `tests/accents.test.ts` measured that disc
    3.1 px outside the silhouette at the shipped camera — the spike narrows to nothing, so a mark
    nearly as wide as its base is outside the hull long before it is outside the tile.

    ⚠️ **AND IT IS DRAWN AFTER THE CRACKS, WHICH IS THE ORDER AND NOT AN ACCIDENT.** The broken body
    came off the sheet with a split running through the middle of the spike's highlight: correct for
    every other mark here and wrong for this one, because a tell that goes missing in the last phase
    goes missing at the rung the player can least afford it.
  */
  /*
    ⚠️ **THE DAMAGE IS CRACKS AND A CORE THAT GETS THROUGH — 0332.** A crack is the shadow that is
    already under everything, showing through: two splits across the web on the chipped body, four
    on the broken one, each running from the hub out to the rim where a tooth has gone.
  */
  for (let c = 0; c < wear * 2; c++) {
    const a = 1.1 + c * 1.7;
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const jag = 0.05;
    plate(ctx, f, skin, [
      [cs * GYRE_HUB, sn * GYRE_HUB],
      [cs * 0.45 - sn * jag, sn * 0.45 + cs * jag],
      [cs * (GYRE_ROOT - 0.04), sn * (GYRE_ROOT - 0.04)],
      [cs * 0.45 + sn * jag * 0.4, sn * 0.45 - cs * jag * 0.4],
    ]);
  }
  /*
    ⚠️ **AND THE CORE BURNS BRIGHTER AS THE BODY GOES**, which is the half of *it changes as it gets
    more damaged* that reads from across the screen. A dark collar, the eye inside it, and a white
    heart in that — and all three open up as the cog breaks.
  */
  /*
    ⚠️ **AND THE SCORCHING IS WHAT SAYS *ON FIRE* ON THE BODY ITSELF — 0336.** The flames behind the
    hull lick at its rim and say the machine is burning; these say it has BEEN burning. Dark patches
    in the shadow ink over the web, one more with every stage, laid before the core so the core still
    reads through them.
  */
  for (let b = 0; b < wear; b++) {
    const a = 2.4 + b * 2.1;
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    poly(ctx, f, shade(skin.plate, -0.55), [
      [cs * 0.32 - sn * 0.13, sn * 0.32 + cs * 0.13],
      [cs * 0.56 - sn * 0.19, sn * 0.56 + cs * 0.19],
      [cs * (GYRE_ROOT - 0.06), sn * (GYRE_ROOT - 0.06)],
      [cs * 0.56 + sn * 0.17, sn * 0.56 - cs * 0.17],
      [cs * 0.32 + sn * 0.11, sn * 0.32 - cs * 0.11],
    ]);
  }
  /*
    ⚠️ **AND THE WRECK'S CORE HAS GONE OUT, WHICH IS THE ONE THING THAT SEPARATES IT FROM THE BODY IT
    WAS — 0337.** Every stage before it burns brighter as it breaks; this one is the shadow ink all
    the way through. A cog lying on the floor with a white heart still in it has not finished dying.
  */
  const dead = wear >= 4;
  const core = GYRE_HUB + Math.min(wear, 3) * 0.04;
  disc(ctx, f, shade(skin.plate, -0.4), 0, 0, core);
  disc(ctx, f, dead ? shade(skin.plate, -0.6) : skin.eye, 0, 0, core * (0.6 + Math.min(wear, 3) * 0.08));
  if (!dead) disc(ctx, f, skin.lit, 0, 0, core * (0.22 + wear * 0.11));
  /*
    The spike, last of all so nothing this body does to itself can take it — see above.

    ⚠️ **THE WRECK'S IS DARK, BECAUSE IT IS NOT A TELL ANY MORE.** For the whole fight this mark
    means *the next wall comes in over there*; on a hull lying on the floor it means nothing, and a
    mark that goes on shouting after it has stopped meaning anything is the thing 0081 is about.
  */
  poly(ctx, f, dead ? shade(skin.plate, -0.25) : skin.lit, [
    [GYRE_HUB, -0.06],
    [0.92, 0],
    [GYRE_HUB, 0.06],
  ]);
}

/*
  ── THE HOUSING THE COG IS SET INTO — 0332 ─────────────────────────────────────────────────────

  ⚠️ **ASKED FOR**: *"when it appears on screen I want it 'locked' into the background like a cog
  set into an image."* Stopping the hull moving is half of that and the cheaper half; what says SET
  INTO SOMETHING is the something. A ring bigger than the cog, with four mounting lugs on the
  diagonals, drawn behind the hull in the layer the serpent's aura occupies.

  ⚠️ **IT IS IN THE `sky` INK AND IT IS THE PLACE RATHER THAN THE CREATURE.** A mounting drawn in
  `enemy` would be a ring of *this can kill you* round the one hull the player is trying to read —
  0081. What the player must never do is shoot at the housing, and the way that is said is the way
  the game already says it about every landmark: it is background-coloured, and nothing in the
  background has ever hurt anybody.
*/
/**
 * The housing's outline: a ring with four lugs on the diagonals, sampled once at load.
 *
 * ⚠️ **ONE SEALED SILHOUETTE, BECAUSE IT IS AN OBJECT.** `tests/accents.test.ts` holds that every
 * body in the atlas is outlined exactly once on its own path, and it is right to: a shape assembled
 * out of bands and discs has no silhouette for a mark to be held inside. The hole through the middle
 * is the second sub-path, filled `evenodd`, which is how a recess is drawn everywhere else here.
 */
const GYRE_SEAT_RIM: readonly Pt[] = (() => {
  const out: Pt[] = [];
  const steps = 96;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    let lug = false;
    for (let s = 0; s < 4; s++) {
      let d = a - (Math.PI / 4 + (s / 4) * Math.PI * 2);
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) < 0.16) lug = true;
    }
    const reach = lug ? 1 : 0.88;
    out.push([Math.cos(a) * reach, Math.sin(a) * reach]);
  }
  return out;
})();

/** How far in the housing's bore goes — the hole the cog sits in, wider than the cog's own tile. */
const GYRE_SEAT_BORE = 0.72;

/**
 * The inks a burning machine goes up in — 0336.
 *
 * ⚠️ **HOT AND NOT THE PLACE'S.** Everything else on this hull is the Labyrinth's teal and hot pink;
 * fire is fire, which is
 * `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md`'s own example of a rule that earns
 * its hardness from its subject — *a hostile bullet takes its place's colour and a flame is the same
 * red everywhere, and both are correct in the same change.*
 */
const GYRE_FIRE_INKS = { deep: '#7a1400', mid: '#ff6a10', core: '#ffd66b' } as const;

/**
 * One frame of the fire a hurt cog burns with — 0336.
 *
 * ⚠️ **IT IS DRAWN BEHIND THE HULL, SO WHAT SHOWS IS ITS OUTER HALF.** The flames stand at the rim
 * and the cog covers everything inside it, which is why the tongues lean OUTWARD from the tile's
 * centre rather than rising from a root: what the player sees is fire getting out past the edge of
 * something, and a flame drawn to rise would show only its own foot.
 *
 * ⚠️ **No hull and no outline: it is energy**, on `paintSerpentAura`'s own terms, and it draws
 * nothing at all in a palette with no skins — which is the high-contrast one.
 */
function paintGyreFire(ctx: Pen, f: Frame, frame: number): void {
  const rng = makeRng('aura').stream(`gyre/${frame}`);
  glow(ctx, f, GYRE_FIRE_INKS.deep, 0, 0, 0.95, 0.6);
  glow(ctx, f, GYRE_FIRE_INKS.mid, 0, 0, 0.62, 0.65);
  const lick = (colour: string, points: readonly Pt[], alpha: number): void => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.beginPath();
    curveLoop(ctx, f, points);
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  for (let i = 0; i < 5; i++) {
    // Spread over the outward half of the tile, so every tongue clears the hull it is burning on.
    const at = (i - 2) * 0.55 + rng.range(-0.18, 0.18);
    const cs = Math.cos(at);
    const sn = Math.sin(at);
    const high = rng.range(0.55, 1.05);
    const wide = rng.range(0.12, 0.2);
    const lean = rng.range(-0.22, 0.22);
    const tongue = (scale: number): Pt[] => [
      [cs * 0.12 - sn * wide * scale, sn * 0.12 + cs * wide * scale],
      [cs * (high * 0.45) - sn * wide * 1.15 * scale, sn * (high * 0.45) + cs * wide * 1.15 * scale],
      [cs * high - sn * lean, sn * high + cs * lean],
      [cs * high - sn * lean, sn * high + cs * lean],
      [cs * (high * 0.45) + sn * wide * 1.15 * scale, sn * (high * 0.45) - cs * wide * 1.15 * scale],
      [cs * 0.12 + sn * wide * scale, sn * 0.12 - cs * wide * scale],
    ];
    lick(GYRE_FIRE_INKS.deep, tongue(1.5), 0.4);
    lick(GYRE_FIRE_INKS.mid, tongue(1), 0.75);
    lick(GYRE_FIRE_INKS.core, tongue(0.42), 0.85);
  }
}

function paintBoss11Seat(ctx: Pen, f: Frame, palette: Palette): void {
  // A lighter bead round the inside edge, so the recess has a lip and the ring has a thickness.
  band(ctx, f, palette.space, 0, 0, GYRE_SEAT_BORE + 0.06, GYRE_SEAT_BORE, 0.6);
  // A bolt in each lug, in the void's own colour: a hole rather than a stud.
  for (let s = 0; s < 4; s++) {
    const a = Math.PI / 4 + (s / 4) * Math.PI * 2;
    disc(ctx, f, palette.space, Math.cos(a) * 0.93, Math.sin(a) * 0.93, 0.04);
  }
}
/*
  THE FROST SHIP. A long crystal, its point to the front, with two great ice-spires swept back
  off its flanks and a smaller pair near the prow — the one hull made of spikes rather than of a
  body — and a cold core lit at its heart.
*/
const HOARFROST_HULL: readonly Pt[] = [
  [-1, 0],
  [-0.62, -0.28],
  [-0.54, -0.31],
  [-0.38, -0.64],
  [-0.28, -0.36],
  [-0.02, -0.42],
  [0.06, -0.44],
  [0.5, -1],
  [0.42, -0.36],
  [0.72, -0.3],
  [1, -0.12],
  [1, 0.12],
  [0.72, 0.3],
  [0.42, 0.36],
  [0.5, 1],
  [0.06, 0.44],
  [-0.02, 0.42],
  [-0.28, 0.36],
  [-0.38, 0.64],
  [-0.54, 0.31],
  [-0.62, 0.28],
];
function paintBoss12(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The underside in shadow, the prow's upper facet lit, facets up both great spires.
  plate(ctx, f, skin, [
    [-0.5, 0.12],
    [0.3, 0.34],
    [0.9, 0.18],
    [0.9, 0.08],
  ]);
  lit(ctx, f, skin, [
    [-0.9, -0.02],
    [-0.62, -0.24],
    [-0.5, -0.1],
  ]);
  lit(ctx, f, skin, [
    [0.16, -0.46],
    [0.44, -0.86],
    [0.36, -0.46],
  ]);
  plate(ctx, f, skin, [
    [0.16, 0.46],
    [0.44, 0.86],
    [0.36, 0.46],
  ]);
  // Cut ice across the mid-hull, in the place's motif.
  motif(ctx, f, skin, theme, [
    [-0.2, -0.3],
    [0.5, -0.3],
    [0.5, 0.3],
    [-0.2, 0.3],
  ], 'boss12');
  // The cold core, the canopy, and the drive.
  glow(ctx, f, skin.lit, 0.12, 0, 0.24, 0.7);
  disc(ctx, f, shade(skin.plate, -0.5), -0.52, 0, 0.08);
  disc(ctx, f, skin.eye, -0.53, 0, 0.05);
  glow(ctx, f, skin.lit, 0.94, 0, 0.14, 0.6);
}

/*
  THE HYDRA. A broad body at the back and five necks reaching forward, each a ribbon on its own
  spine and each ending in a skull with its jaws open — *"the hydra shows no heads"* is the report
  this answers, and the heads are the outline, not paint on it.
*/
const HYDRA_BODY: readonly Pt[] = [
  [-0.12, -0.66],
  [0.28, -0.82],
  [0.7, -0.74],
  [0.96, -0.38],
  [1, 0],
  [0.96, 0.38],
  [0.7, 0.74],
  [0.28, 0.82],
  [-0.12, 0.66],
];
/** The five necks' spines, base to end, top to bottom; the head reaches on from the end. */
const HYDRA_NECKS: readonly (readonly Pt[])[] = [
  [
    [-0.12, -0.5],
    [-0.3, -0.53],
    [-0.48, -0.6],
    [-0.6, -0.66],
  ],
  [
    [-0.12, -0.24],
    [-0.3, -0.26],
    [-0.48, -0.3],
    [-0.64, -0.34],
  ],
  [
    [-0.12, 0],
    [-0.32, 0],
    [-0.52, 0],
    [-0.66, 0],
  ],
  [
    [-0.12, 0.24],
    [-0.3, 0.26],
    [-0.48, 0.3],
    [-0.64, 0.34],
  ],
  [
    [-0.12, 0.5],
    [-0.3, 0.53],
    [-0.48, 0.6],
    [-0.6, 0.66],
  ],
];
// A quarter of `r` at the base, on the serpent's argument: finer than that is outline.
const hydraHalf = (i: number): number => 0.12 - 0.01 * i;
/** A skull in its neck's own frame, solid — starboard cheek to crown to snout to chin to port cheek. */
const HYDRA_HEAD: readonly Pt[] = [
  [-0.02, -0.13],
  [0.12, -0.19],
  [0.3, -0.17],
  [0.38, -0.06],
  [0.38, 0.06],
  [0.3, 0.17],
  [0.12, 0.19],
  [-0.02, 0.13],
];
function hydraHull(): Pt[] {
  const out: Pt[] = [...HYDRA_BODY];
  // From the body's bottom corner up its front line, out and back along each neck in turn.
  for (let n = HYDRA_NECKS.length - 1; n >= 0; n--) {
    const spine = HYDRA_NECKS[n]!;
    const at = endOf(spine);
    out.push([-0.12, spine[0]![1] + hydraHalf(0)]);
    for (let i = 1; i < spine.length; i++) out.push(offSpine(spine, i, -hydraHalf(i)));
    for (const [px, py] of HYDRA_HEAD) out.push(at(px, py));
    for (let i = spine.length - 1; i >= 1; i--) out.push(offSpine(spine, i, hydraHalf(i)));
    out.push([-0.12, spine[0]![1] - hydraHalf(0)]);
  }
  return out;
}
const HYDRA_HULL: readonly Pt[] = hydraHull();
function paintBoss13(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The body: its underside in shadow, its back lit, sacs across it in the place's motif.
  plate(ctx, f, skin, [
    [0, 0.36],
    [0.55, 0.62],
    [0.85, 0.34],
    [0.5, 0.3],
  ]);
  lit(ctx, f, skin, [
    [0, -0.36],
    [0.5, -0.62],
    [0.8, -0.4],
    [0.5, -0.3],
  ]);
  motif(ctx, f, skin, theme, [
    [-0.02, -0.28],
    [0.72, -0.28],
    [0.72, 0.28],
    [-0.02, 0.28],
  ], 'boss13');
  // Every neck lit down its port edge and shadowed down its starboard; every skull an eye and a maw.
  for (const spine of HYDRA_NECKS) {
    for (let i = 0; i < spine.length - 1; i++) {
      lit(ctx, f, skin, stripe(spine, i, hydraHalf, 0.35, 0.7));
      plate(ctx, f, skin, stripe(spine, i, hydraHalf, -0.35, -0.7));
    }
    const at = endOf(spine);
    const socket = at(0.1, -0.09);
    const eyeAt = at(0.095, -0.09);
    const maw = at(0.3, 0);
    // The mouth: a dark wedge back from the snout, the maw lit in it. Paint, because a notch that
    // fine in the outline is stroked shut.
    poly(ctx, f, shade(skin.plate, -0.5), [at(0.37, -0.05), at(0.18, 0), at(0.37, 0.05)]);
    glow(ctx, f, skin.lit, maw[0], maw[1], 0.09, 0.8);
    disc(ctx, f, shade(skin.plate, -0.5), socket[0], socket[1], 0.042);
    disc(ctx, f, skin.eye, eyeAt[0], eyeAt[1], 0.028);
  }
}

/*
  THE JELLYFISH. A bell to the front — the one hull with a curved edge — and six tendrils trailing
  behind it, each a wedge from the rim to a point, spreading as they go; the black heart in the
  bell, big, looking down the lane.
*/
/** The bell's centre and radius, in the frame. */
const MEDUSA_BELL: readonly [number, number, number] = [-0.05, 0, 0.8];
/** Each tendril's upper root, tip and lower root, top to bottom, off the rim behind the bell. */
// Each root a quarter of `r` wide, on the serpent's argument: a tendril finer than the outline's
// stroke is a dark spine with no light in it.
const MEDUSA_TENDRILS: readonly (readonly [Pt, Pt, Pt])[] = [
  [
    [0, -0.8],
    [0.72, -0.96],
    [0.06, -0.58],
  ],
  [
    [0.08, -0.5],
    [0.95, -0.62],
    [0.1, -0.28],
  ],
  [
    [0.1, -0.2],
    [1, -0.16],
    [0.1, 0],
  ],
  [
    [0.1, 0],
    [1, 0.16],
    [0.1, 0.2],
  ],
  [
    [0.1, 0.28],
    [0.95, 0.62],
    [0.08, 0.5],
  ],
  [
    [0.06, 0.58],
    [0.72, 0.96],
    [0, 0.8],
  ],
];
function paintBoss14(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  const [bx, by, br] = MEDUSA_BELL;
  // The rim lit round the front of the bell, and the bell's underside in shadow.
  lit(ctx, f, skin, sector(br * 0.76, br * 0.9, Math.PI - 0.9, Math.PI + 0.9, 12).map(([x, y]) => [x + bx, y + by] as const));
  plate(ctx, f, skin, sector(br * 0.5, br * 0.7, Math.PI / 2 + 0.2, Math.PI - 0.35, 8).map(([x, y]) => [x + bx, y + by] as const));
  // Veins round the heart, in the place's motif; the heart itself, dark-rimmed and gold, and its light.
  motif(ctx, f, skin, theme, [
    [-0.6, -0.42],
    [-0.12, -0.42],
    [-0.12, 0.42],
    [-0.6, 0.42],
  ], 'boss14');
  glow(ctx, f, skin.eye, -0.34, 0, 0.34, 0.6);
  disc(ctx, f, shade(skin.plate, -0.5), -0.34, 0, 0.22);
  disc(ctx, f, skin.eye, -0.36, 0, 0.16);
  disc(ctx, f, shade(skin.plate, -0.6), -0.37, 0, 0.06);
  // A lit thread down each tendril, from its root to over halfway to its tip.
  for (const [top, tip, bottom] of MEDUSA_TENDRILS) {
    const rx = (top[0] + bottom[0]) / 2 + 0.06;
    const ry = (top[1] + bottom[1]) / 2;
    lit(ctx, f, skin, [
      [rx, ry - 0.025],
      [rx, ry + 0.025],
      [rx + (tip[0] - rx) * 0.55, ry + (tip[1] - ry) * 0.55],
    ]);
  }
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
/**
 * The kite — 0249's *a diamond ahead, two streamers behind*, drawn as a creature by 0321.
 *
 * ── WHAT 0276's KIT LEAVES BEHIND AT SIX AND A HALF UNITS ───────────────────────────────────────
 *
 * ⚠️ **THE FISH IS 42 UNITS AND THIS IS 6.5, AND ALMOST NONE OF ITS TECHNIQUE SURVIVES THE TRIP.** On
 * a 1280×720 screen the kite is 47 CSS pixels wide, so its drawing radius is 20 — and
 * [0106](../../docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s 2.5px floor is
 * **0.13 of that radius**. The fish's seams are drawn at 0.022 to 0.034; every one of them is thinner
 * than a pixel here. Fin rays, a lateral line, a dust of motes and a ridge along the snout are all
 * things this animal cannot have, and the first draft that tried them would have baked nothing.
 *
 * ⚠️ **SO WHAT IS LIFTED IS THE THREE THINGS THAT DO NOT CARE ABOUT SIZE**: a silhouette that is a
 * CURVE rather than a polygon, a form-shade across the whole body, and a halo behind it. A halo is
 * translucent, so no floor applies to it at all — it is the one mark from the fish's pass that reads
 * *better* small, because at 47 pixels it is most of what says *this thing is made of the nebula*.
 *
 * ⚠️ **AND THE SHAPE IS A SWEPT DELTA NOW RATHER THAN A LOZENGE.** Ten straight segments baked as a
 * chunky arrow with a bite out of it; what 0249 asks for is a thing that flies, so the leading edges
 * rake back to two wing tips and the two streamers trail from the body between them.
 */
/*
  ⚠️ **AND IT STAYS STRAIGHT-EDGED, WHICH IS THE ONE THING 0321 TRIED TO CHANGE AND PUT BACK.** Drawn
  as a `curveLoop` it came back a handsome thing and a WRONG one: 0314 separates this from the minnow
  on exactly two channels — *straight-edged and symmetrical about its long axis* against *curved, with
  a top and a bottom* — and rounding the kite spends one of the two. Photographed, the two then
  differed only in symmetry, and the pair a player has to separate is *the one coming for me* and *the
  one going somewhere else*. **The complaint the brief makes is that this is FLAT, and flat is about
  shading rather than about edges.** So the volume arrives and the angles stay.
*/
const KITE_HULL: readonly Pt[] = [
  [-0.95, 0],
  [-0.2, -0.52],
  [0.1, -0.64],
  [0.2, -0.42],
  [0.3, -0.2],
  [0.95, -0.34],
  [0.6, -0.14],
  [0.34, -0.05],
  [0.3, 0],
  [0.34, 0.05],
  [0.6, 0.14],
  [0.95, 0.34],
  [0.3, 0.2],
  [0.2, 0.42],
  [0.1, 0.64],
  [-0.2, 0.52],
];

/** The moon jelly's hull — 0255: a dome across the front, four short tendrils ragged off the back. */
const MOON_JELLY_HULL: readonly Pt[] = [
  [-0.9, 0],
  [-0.74, -0.5],
  [-0.36, -0.82],
  [0.12, -0.86],
  [0.12, -0.5],
  [0.5, -0.66],
  [0.34, -0.22],
  [0.86, -0.28],
  [0.4, 0],
  [0.86, 0.28],
  [0.34, 0.22],
  [0.5, 0.66],
  [0.12, 0.5],
  [0.12, 0.86],
  [-0.36, 0.82],
  [-0.74, 0.5],
];
function paintMoonJelly(ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind): void {
  // The lower half of the bell in shadow, its crown lit, the fringe's roots as a motif, an eye low
  // in the bell where the light would sit.
  plate(ctx, f, skin, [
    [-0.7, 0.1],
    [0.06, 0.1],
    [0.06, 0.44],
    [-0.4, 0.6],
  ]);
  lit(ctx, f, skin, [
    [-0.8, -0.1],
    [-0.5, -0.6],
    [-0.36, -0.5],
    [-0.66, -0.08],
  ]);
  motif(ctx, f, skin, theme, [
    [0.06, -0.4],
    [0.3, -0.2],
    [0.3, 0.2],
    [0.06, 0.4],
  ], 'moonJelly');
  disc(ctx, f, skin.eye, -0.34, 0.06, 0.1);
}
/**
 * A soft ring or two behind a small body, in the place's own light — 0321.
 *
 * ⚠️ **THE ONE MARK FROM THE FISH'S PASS THAT READS BETTER SMALL, AND IT IS BECAUSE IT IS
 * TRANSLUCENT.** 0106's floor is about a mark being drawn at all, and it applies to solid ink; a halo
 * has no width to lose. At 47 CSS pixels it is most of what says *this thing is made of the place*,
 * where a seam at the same scale would be the outline again.
 *
 * ⚠️ **BRIGHTEST RING FIRST, WHICH IS 0277's OWN FINDING AND 0318's** — `destination-over` puts each
 * new fill further back, so the falloff stacks outward. Two rings and not three: at this size a third
 * is a pixel wide and buys a bake.
 *
 * ⚠️ **AND THE CAP IS ABSOLUTE, on 0320's terms.** The reach is read off the hull the caller hands
 * over, so a body whose own points go past 1.0 cannot push the outer ring into the next bitmap.
 */
function nimbus(ctx: Pen, f: Frame, colour: string, hull: readonly Pt[], smooth = false): void {
  const skirt = Math.max(...hull.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
  ctx.globalCompositeOperation = 'destination-over';
  for (const [gap, alpha] of [
    [0.05, 0.22],
    [0.13, 0.09],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.beginPath();
    const swell = Math.min(1 + gap, 1.13 / skirt);
    const swollen = hull.map(([x, y]) => [x * swell, y * swell] as const);
    /*
      ⚠️ **A HALO TAKES THE SHAPE OF THE BODY IT IS AROUND, INCLUDING ITS CORNERS.** Rounded off an
      angular hull it reads as a glowing blob the animal is sitting in rather than as the animal's own
      light, which is the same distinction `nimbus`'s own note makes about why this is worth having at
      47 pixels at all.
    */
    if (smooth) curveLoop(ctx, f, swollen);
    else trace(ctx, f, swollen);
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * The kite's paint — 0321, on 0276's kit and cut to what survives at 47 CSS pixels.
 *
 * ⚠️ **FOUR MARKS AND NOT FOURTEEN.** The fish carries thirty; this carries a halo, a form-shade, one
 * wash a side under each wing, the place's motif and an eye. Every one of them is either translucent
 * or wider than 0.13 of the drawing radius, which is where a solid mark on THIS body stops being
 * drawn at all — and the arithmetic is in `KITE_HULL`'s own note rather than discovered again here.
 */
/**
 * The swift's hull — 0328: a swept chevron, nose forward, two wings raked back, open at the back.
 * Not the drifter's diamond (closed), not the kite's delta (a body with streamers), not the lancer's
 * triangle (broad and blunt): a V is the one primitive on the sheet that points.
 */
const SWIFT_HULL: readonly Pt[] = [
  [0.95, 0],
  [0.1, -0.34],
  [-0.72, -0.74],
  [-0.95, -0.66],
  [-0.4, 0],
  [-0.95, 0.66],
  [-0.72, 0.74],
  [0.1, 0.34],
];

/**
 * The swift's paint — 0328, on the kite's pattern and cut to the same size: a nimbus, the form-shade
 * across the body, and the two leading edges lit as seams. No motif, for the kite's reason — on a
 * body this size the place's motif survives as one speck the size of an eye.
 */
function paintSwift(ctx: Pen, f: Frame, skin: FoeSkin): void {
  nimbus(ctx, f, skin.lit, SWIFT_HULL);
  shaded(ctx, f, [0, -0.74], [0, 0.74], rgba(skin.lit, 0.26), rgba(skin.plate, 0.55), SWIFT_HULL, 1, false);
  // Inboard of the leading edge by the seam's own half-width all the way to the nose, where the hull
  // is a tenth wide — `tests/accents.test.ts` refused a seam that started at 0.7 and poked past it.
  for (const side of [-1, 1]) {
    seam(ctx, f, rgba(skin.lit, 0.85), 0.11, [
      [0.5, 0.08 * side],
      [-0.45, 0.42 * side],
    ]);
  }
}

function paintKite(ctx: Pen, f: Frame, skin: FoeSkin): void {
  nimbus(ctx, f, skin.lit, KITE_HULL);
  // The form-shade: lit along one edge, shadowed at the other, across the whole animal. It is what
  // turns a cut-out into a body, and it is the first mark the serpent's and the fish's paint both make.
  shaded(ctx, f, [0, -0.64], [0, 0.64], rgba(skin.lit, 0.26), rgba(skin.plate, 0.55), KITE_HULL, 1, false);
  for (const side of [-1, 1]) {
    // Each wing darkened toward its trailing edge, so it reads as a membrane rather than as more body.
    shaded(
      ctx,
      f,
      [-0.5, -0.1 * side],
      [0.14, -0.6 * side],
      rgba(skin.plate, 0.08),
      rgba(skin.plate, 0.6),
      [
        [-0.5, 0.14 * side],
        [-0.16, 0.4 * side],
        [0.08, 0.5 * side],
        [0.16, 0.34 * side],
        [0.2, 0.18 * side],
      ],
      1,
      false,
    );
  }
  /*
    ⚠️ **THE PLACE'S MOTIF IS OFF THIS BODY, AND THE ARITHMETIC IS WHY RATHER THAN THE TASTE.** `motif`
    scatters on a fixed 0.24 grid and keeps only a mark whose whole 0.09 square fits, so on a hull this
    small it survives **exactly one cell** — and 0.09 of a 19.7px radius is a 3.5px disc, which is the
    size of this animal's EYE. Photographed twice, once with the belly across the body and once moved
    aft: both times the kite came back reading as a thing with two eyes. One speck the size of an eye
    is worse than no speck.

    ⚠️ **AND WHAT REPLACES IT IS THE SAME INK DOING A JOB THIS SIZE CAN CARRY** — the leading edge lit,
    a mark 0.13 wide because that is where 0106's floor sits here. The place is already on this animal
    in its hull, plate and lit colours ([0228](../../docs/decisions/0228-an-enemy-wears-its-place.md));
    the motif was a fourth channel, and it is the one that does not survive the scale.
  */
  for (const side of [-1, 1]) {
    seam(ctx, f, rgba(skin.lit, 0.85), 0.13, [
      [-0.58, 0.17 * side],
      [-0.42, 0.28 * side],
      [-0.27, 0.39 * side],
    ]);
  }
  /*
    ⚠️ **0.127 IS A FLOOR AND NOT A TASTE, AND `eye`'s PUPIL IS WHAT SETS IT.** A pupil is 0.62 of its
    eye, so on a body whose drawing radius is 16.4 CSS pixels since the view zoomed out (0364) an eye
    smaller than **0.123** has a pupil under 0106's 2.5px and is drawn as a plain dark disc with nothing
    in it. Written at 0.1 first, and `tests/accents.test.ts` reported 2.44px — six hundredths of a
    pixel, which is the whole of the difference between a creature that is looking at you and a hole in
    its face.
  */
  eye(ctx, f, skin, -0.66, 0, 0.127);
}

/*
  THE MINNOW — 0314. A small fish seen from the side: a blunt snout, a body that swells behind the
  head, one dorsal fin up and one anal fin down, and a deeply forked tail.

  ⚠️ **IT SHARES A SKY WITH THE KITE AND HAS TO BE TOLD FROM IT AT TWENTY PIXELS.** A kite is a
  diamond with two streamers; this is a spindle with a notch in its back end. The pair the player
  actually has to separate is *the one coming for me* and *the one going somewhere else*, so the
  silhouettes are deliberately not variations on each other — one is straight-edged and symmetrical
  about its long axis, the other is curved and has a top and a bottom.

  ⚠️ **AND THAT SEPARATION IS AUTHORED AND UNHELD, WHICH THIS COMMENT USED TO CLAIM OTHERWISE — 0321.**
  It said *"`tests/legibility.test.ts` holds the distance between every pair of hulls in this game."*
  It does not, and never did: what exists is *no two BOSS hulls are the same drawing*
  (`tests/accents.test.ts`) and *every sprite kind appears exactly once on the sheet*. Identity is
  held; DISTANCE is not held anywhere, for any pair of enemies.

  ⚠️ **AND A DISTANCE GUARD IS REFUSED RATHER THAN OWED.** It would be a loop over a content table
  comparing every instance of a kind against every other on one channel with a `>` in it, which is
  exactly the shape [0295](../../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md) deleted
  five of at once — it would forbid a legitimately similar pair the day somebody wants one. The claim
  is a real authored judgement, and naming it as one is the repair.

  ⚠️ **THE FINS ARE IN THE OUTLINE AND NOT DRAWN ON IT** — 0276's rule for a creature: exactly one
  stroke is the hull and everything else is paint held inside it, so a fin that reads at this size has
  to be part of the silhouette. That is also why the tail's fork is a notch rather than a line.
*/
const MINNOW_HULL: readonly Pt[] = [
  [-1, 0],
  [-0.82, -0.24],
  [-0.36, -0.34],
  [-0.06, -0.78],
  [0.2, -0.36],
  [0.56, -0.2],
  [1, -0.58],
  [0.76, 0],
  [1, 0.58],
  [0.56, 0.2],
  [0.24, 0.52],
  [0.04, 0.3],
  [-0.4, 0.34],
  [-0.82, 0.24],
];

/** The minnow's paint — 0314: a lit back, a shadowed belly, embers of the place, and a pale eye. */
function paintMinnow(ctx: Pen, f: Frame, skin: FoeSkin): void {
  /*
    ⚠️ **THE SAME THREE MARKS THE KITE GETS, BECAUSE THE SCALE IS THE SAME PROBLEM — 0321.** This is 5
    units where the kite is 6.5, so 0106's floor is **0.17 of the drawing radius** here: even wider
    than the kite's 0.13, and the motif's single surviving speck would be a third of the body. What
    lifts from the fish's pass is the halo, the form-shade, and nothing else that has a width.

    ⚠️ **AND THE HALO IS SMOOTH HERE AND ANGULAR THERE**, which is the two animals' own difference
    carried into their light rather than contradicted by it.
  */
  nimbus(ctx, f, skin.lit, MINNOW_HULL, true);
  shaded(ctx, f, [0, -0.6], [0, 0.5], rgba(skin.lit, 0.3), rgba(skin.plate, 0.6), MINNOW_HULL, 1, true);
  /*
    The back lit along the shoulder, where the light is: 0.17 wide, which is the floor on this body.

    ⚠️ **IT HUGS THE DORSAL CONTOUR AND STARTS BEHIND THE EYE, WHICH THE FIRST DRAFT DID NEITHER.** Run
    down the middle of the animal at full weight it photographed as a pale **lozenge lying on** the
    fish rather than as light on its back — and it reached the eye, so the two read as one mark. A
    sheen follows the edge it is a sheen on.
  */
  seam(ctx, f, rgba(skin.lit, 0.55), 0.17, [
    [-0.5, -0.16],
    [-0.3, -0.25],
    [-0.04, -0.22],
  ], 1, true);
  /*
    ⚠️ **0.165 IS THE EYE'S FLOOR ON A FIVE-UNIT BODY**, by the same arithmetic the kite's 0.127 comes
    from: a pupil is 0.62 of its eye, the radius here is 12.6 CSS pixels since the view zoomed out
    (0364), and below 0.16 the pupil is thinner than 0106's 2.5px. The old drawing was a flat `disc` at
    0.1 with no pupil at all.
  */
  eye(ctx, f, skin, -0.68, -0.04, 0.165);
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
    ── A FLASH IS A WASH OVER THE BODY, NOT A CUTOUT OF IT — 0278, AMENDING 0035 ────────────────────

    ⚠️ **REPORTED FROM PLAY:** *"the 'hit' flash needs to be far more translucent instead of pure
    white — with the attack speed of all weapons, essentially you are just fighting a white
    outline."* The screenshot shows the serpent as a solid cream silhouette with none of its art
    visible, which is what every fight looks like.

    ⚠️ **0035 WAS RIGHT ABOUT A HIT AND WRONG ABOUT A STEADY STATE.** *"A white ship with every panel
    still on it is a paler ship, not a hit"* holds when a hit is an event. `IMPACT_FLASH_STEPS` is 4,
    so a weapon landing more often than every fifteenth of a second holds the twin on CONTINUOUSLY —
    and every gun in the game now does. The flash stopped being the exception and became the picture.

    ⚠️ **`source-atop` IS WHAT MAKES IT ONE BLIT.** The twin is the base art, drawn by this same
    function, with the flash ink laid over exactly the pixels that art covered — no second bitmap, no
    second draw call, and the silhouette is identical to the base's by construction rather than by a
    guard comparing two hand-drawn shapes.
  */
  /*
    ── AND A CAVITY IS NOT WASHED, BECAUSE LIGHT DOES NOT GET INTO ONE — 0287 ──────────────────────

    ⚠️ **REPORTED FROM PLAY:** *"the hitbox flash for the mouth doesn't look right, it's a slightly
    off white triangle inside the mouth and it looks pretty weird."*

    ⚠️ **THE MOUTH INTERIOR IS PAINT, SO `source-atop` FOUND IT.** The gape is a notch rather than a
    hole (0284), so the dark red filling it is a MARK in open space rather than a hole in the hull —
    covered pixels, and the wash lands on them like anything else. Dark red at 0.55 of the flash ink
    comes out within a hair of the washed flesh around it, so the cavity flattens into a pale wedge
    with hard edges and no depth: an off-white triangle, exactly as reported.

    ⚠️ **SO THE WASH IS A TILE WITH THE CAVITY TAKEN OUT OF IT, RATHER THAN A `fillRect`.** One
    `evenodd` fill, one composite, still one bitmap and one draw call — 0278's whole argument for
    `source-atop` is untouched. What changes is that the animal lights up and its open mouth stays
    dark, which is what a flash on a real mouth does and is the only version that still reads as a
    mouth at four steps a hit.
  */
  if (hurt) {
    drawKind(ctx, kind.slice(0, -3) as SpriteKind, palette, size, theme);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = FLASH_WASH;
    ctx.fillStyle = palette.impact;
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    cavityOf(ctx, f, kind);
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return;
  }
  /*
    ⚠️ **THE PLACE'S SKIN, FOR THE BODIES THE PLACE SENDS** — 0228. An enemy or a boss is sealed in
    `skin.hull` rather than in `INK_OF`'s `enemy`, unless it is hurt: a flash is the flash ink whatever
    the place, so a hit reads the same in every level. `INK_OF` still says what the kind IS, which is
    what `tests/legibility.test.ts` reads; `tests/foes.test.ts` holds the hull to the same floors.
  */
  // The place's lord wears its own skin — 0264; everything else the place sends wears the place's.
  const skin = hurt ? null : LORD_HULLS.includes(kind) ? lordOf(theme, palette) : foeOf(theme, palette);
  /*
    ⚠️ **AND WHAT THE PLACE SENDS INCLUDES WHAT IT SHOOTS — 0296.** The hulls have read the place's
    skin since 0228 and the bullets never did: they went straight to `palette[INK_OF[kind]]`, so
    every raider's fire was one colour in all seven places while the ships around it were seven. A
    mechanism whose output is identical for every place is what
    `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md` calls the tell,
    and this was one — the atlas already takes a `theme` and rebakes per place, so the bullets were
    the only thing not reading an argument that was already there.

    ⚠️ **`?? palette[INK_OF[kind]]` IS THE DEFAULT AND IT CARRIES TWO CASES, NOT ONE.** A place that
    authors no `shot`, and the high-contrast palette — where `foeOf` hands back `null` for every
    place, because a skin is decoration and that palette has none. Both land on the ink the game had
    before this, in one line, which is why neither needs a branch of its own.
  */
  const ink = (skin !== null && PLACE_SHOTS.has(kind) ? skin.shot : undefined) ?? palette[INK_OF[kind]];
  ctx.fillStyle = ink;
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
    case 'boss8Up':
    case 'boss8Down':
    case 'boss8Gape':
    case 'boss8GapeHit':
    case 'boss8Shut':
    case 'boss8ShutHit':
    case 'boss8Horn2':
    case 'boss8Horn2Hit':
    case 'boss8Horn2Up':
    case 'boss8Horn2Down':
    case 'boss8Horn2Gape':
    case 'boss8Horn2GapeHit':
    case 'boss8Horn2Shut':
    case 'boss8Horn2ShutHit':
    case 'boss8Horn3':
    case 'boss8Horn3Hit':
    case 'boss8Horn3Up':
    case 'boss8Horn3Down':
    case 'boss8Horn3Gape':
    case 'boss8Horn3GapeHit':
    case 'boss8Horn3Shut':
    case 'boss8Horn3ShutHit': {
      /*
        THE SERPENT'S SKULL — 0283, drawn for menace by 0284 and given faces by 0285. One skull, its
        jaw hinged and its pupil moved: `boss8` rests, jaw part-open, looking straight down its own
        lane; `boss8Up` and `boss8Down` are the same silhouette watching a ship above or below it;
        `boss8Gape` is the strike, jaw wide with the throat red and the tongue out; and `boss8Shut`
        is the snap, jaw closed on a ship crossing in front of the head.

        The outline is a CURVE — `curveLoop` rather than `trace` — so the snout and the brow are the
        curves a skull has rather than the corners its samples are.

        ⚠️ **AND SINCE 0305 THE SAME SEVEN FACES WITH THE HORNS GROWN, TWICE.** `skullOf` reads which
        from the name, once for the drawing and the wash alike. A longer-horned face is `boss8`'s own
        drawing in a bigger box — the frame is scaled back by the box, the ship's tiers' pattern — and
        its outline is `boss8`'s width, or the head's edge would thicken at the phase change as if the
        animal had been redrawn rather than grown.
      */
      const skull = skullOf(kind)!;
      const fs: Frame = { half, r: r / skull.box };
      ctx.lineWidth = Math.max(1, (size / skull.box) * 0.04);
      curveLoop(ctx, fs, headOf(skull.jaw, skull.grow));
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintSerpentHead(ctx, fs, skin, skull.jaw, skull.gaze, skull.grow);
      return;
    }
    case 'serpentBody':
    case 'serpentBodyHit':
      /*
        ONE NODE OF THE SERPENT'S BODY — 0283. A disc of flesh, laid along the animal's spine by
        `src/app/frame.ts` and overlapping its neighbours, so what the player sees is the union
        rather than any one of these.

        ⚠️ **IT IS FILLED AND NOT SEALED, AND THAT IS THE DIFFERENCE BETWEEN A SERPENT AND A
        CATERPILLAR.** `seal` strokes the whole path, and a disc outlined all the way round has that
        outline drawn ON TOP of the node behind it — so the first bake of this came back as a stack
        of croissants with a dark arc ruled across the body eleven times. A node is a SLICE of one
        animal, not a hull: the creature's edge runs along its top and its bottom, and that is the
        only part of a node's rim that is ever the silhouette. `paintSerpentNode` draws those two
        arcs and nothing else, so the union of eleven nodes has one continuous outline and no
        internal ones.
      */
      ring(ctx, f, 0, 0, FLESH);
      if (skin !== null) ctx.fillStyle = skin.hull;
      ctx.fill('evenodd');
      if (skin !== null) paintSerpentNode(ctx, f, skin);
      return;
    case 'serpentAura0':
    case 'serpentAura1':
    case 'serpentAura2':
    case 'serpentAura3':
    case 'serpentAura4':
    case 'serpentAura5':
    case 'serpentStorm0':
    case 'serpentStorm1':
    case 'serpentStorm2':
    case 'serpentStorm3':
    case 'serpentStorm4':
    case 'serpentStorm5':
      /*
        ONE FLAME OF THE SERPENT'S AURA — 0305. No hull and no outline: it is energy, on the
        exhaust's terms, and the body it rises off is the node drawn over it. Nothing at all in a
        palette with no skins, which is the high-contrast one.
      */
      if (skin !== null) paintSerpentAura(ctx, f, Number(kind.slice(-1)), kind.startsWith('serpentStorm'));
      return;
    case 'serpentFlare0':
    case 'serpentFlare1':
    case 'serpentFlare2':
      /*
        THE CROWN DISCHARGING — 0310. The head's own aura flame with the horns' lightning over it, worn
        for the half-second before a strike lands. Same tile and same girth as the storm frame it
        replaces, so the crown does not change size to tell the player something.
      */
      if (skin !== null) paintSerpentFlare(ctx, f, Number(kind.slice(-1)));
      return;
    case 'volansEmber0':
    case 'volansEmber1':
    case 'volansEmber2':
    case 'volansEmber3':
    case 'volansEmber4':
    case 'volansEmber5':
      /*
        ONE FLAME OF THE FISH'S AURA — 0320. No hull and no outline: it is energy, on the exhaust's
        and the serpent's aura's terms, and the animal it rises off is drawn over it. It streams AFT
        rather than up, because this hull is seen from overhead and up-screen is forward. Nothing at
        all in a palette with no skins, which is the high-contrast one.
      */
      if (skin !== null) paintVolansEmber(ctx, f, Number(kind.slice(-1)));
      return;
    case 'boss9':
    case 'boss9Hit':
    case 'boss9Up':
    case 'boss9Down':
    case 'boss9Gape':
    case 'boss9GapeHit':
    case 'boss9Shut':
    case 'boss9ShutHit':
    case 'boss9Barbed':
    case 'boss9BarbedHit':
    case 'boss9BarbedUp':
    case 'boss9BarbedDown':
    case 'boss9BarbedGape':
    case 'boss9BarbedGapeHit':
    case 'boss9BarbedShut':
    case 'boss9BarbedShutHit': {
      /*
        THE FLYING FISH — 0264's slot, renamed by 0312, REDRAWN by 0318 and given faces by 0319. Seen
        from above, as every hull in this game is: a spindle with two enormous pectorals thrown wide
        and swept back, a pelvic pair, a pinched peduncle and a deeply forked tail — still the widest
        span in the game.

        The outline is a CURVE, `curveLoop` rather than `trace`, so the snout and the fins are the
        shapes they are rather than the corners their samples would be. The serpent's skull says the
        same thing about itself, and for the same reason.

        ⚠️ **TWO BODIES AND THREE MOUTHS, READ OFF THE NAME — the skull's own arrangement.** `boss9`
        rests; `boss9Up` and `boss9Down` are that silhouette with the pupil swung to the side the ship
        is on; `boss9Gape` splays the mandibles before a volley leaves; `boss9Shut` packs the cheeks
        out on a ship crossing in front of it. `boss9Barbed…` is all six of those again on the kindled
        body — 0320, worn from the last sixth of the fight, with its wings serrated and its lights up
        by half. The mouths are shared between the two bodies, so they cannot drift apart.
      */
      const worn = volansFace(kind);
      curveLoop(ctx, f, volansHull(worn.jaw, worn.barbed));
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss9(ctx, f, skin, theme, worn.jaw, worn.gaze, worn.barbed);
      return;
    }
    case 'boss10':
    case 'boss10Hit':
      // THE PTERODACTYL — 0264: a long beak, a crest swept back, and wings swept to the corners
      // with the membrane scalloped between the wing-fingers and the body.
      trace(ctx, f, QUETZAL_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss10(ctx, f, skin, theme);
      return;
    case 'boss11':
    case 'boss11Hit':
    case 'boss11Chipped':
    case 'boss11ChippedHit':
    case 'boss11Broken':
    case 'boss11BrokenHit':
    case 'boss11Burnt':
    case 'boss11BurntHit':
    case 'boss11Wreck': {
      /*
        THE GYRE: a cog — sixteen teeth about a hub with a hole in it. Round like the axis and not
        the axis: its edge goes in and out sixteen times.

        ⚠️ **AND SINCE 0332 IT IS BODIES AND A SPIKE, FOUR OF THEM SINCE 0336.** `traceGyre` reads
        the wear off the name, exactly as the fish's faces do: whole, chipped at three quarters,
        broken at a half, burnt at a quarter — and the point at the sprite's `+x` is the one the
        player steers by, which is why it is the one thing all four keep.
      */
      /*
        ⚠️ **AND A FIFTH WEAR THAT IS NOT A PHASE — 0337.** `boss11Wreck` is what is left after it
        falls out of the wall: the burnt body with its rim stove in on one side, its spokes down and
        its core gone out. It wears no phase and takes no hit, because nothing hits it.
      */
      const wear = kind === 'boss11Wreck'
        ? 4
        : kind.startsWith('boss11Burnt')
          ? 3
          : kind.startsWith('boss11Broken')
            ? 2
            : kind.startsWith('boss11Chipped')
              ? 1
              : 0;
      traceGyre(ctx, f, wear);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss11(ctx, f, skin, wear);
      return;
    }
    case 'gyreFire0':
    case 'gyreFire1':
    case 'gyreFire2':
    case 'gyreFire3':
      // ONE FRAME OF THE COG'S FIRE — 0336, on `serpentAura`'s own terms: energy, no hull, nothing
      // in a palette with no skins.
      if (skin !== null) paintGyreFire(ctx, f, Number(kind.slice(-1)));
      return;
    case 'roomWall': {
      /*
        THE LABYRINTH'S WALL — 0335, rebuilt by 0348. Masonry that tiles in both axes: three courses
        of stone in running bond, dark mortar between them, each course lit along its top, and a lit
        coping on the tile's two edges — whichever of them faces the flying space is the wall's face.

        ⚠️ **IT FILLS THE WHOLE TILE NOW, AND THE MARGIN WAS THE DEFECT.** 0335's block was 84% of its
        tile with an outline round it, so a run of them came out of the 1080p photograph as a film
        strip — slabs with black between them — and a corridor of it read as sprocket holes rather
        than as a wall. A wall is a surface, not a row of objects: the courses run on into the next
        tile, and a head joint that falls on the edge is drawn half on each side so the pair meet.

        ⚠️ **SYMMETRIC TOP AND BOTTOM, BECAUSE EACH WALL SHOWS A DIFFERENT HALF.** Tiles are centred on
        the lane's edge, so the near wall shows the bottom half and the far one the top; the coping on
        both edges is what makes each of them face inward.
      */
      const edge = half / r;
      const stone = palette.sky;
      const mortar = shade(stone, -0.55);
      const course = (edge * 2) / 3;
      const bed = 0.06;
      const head = 0.035;
      const band = (y0: number, y1: number, colour: string, alpha = 1): void =>
        poly(ctx, f, colour, [[-edge, y0], [edge, y0], [edge, y1], [-edge, y1]], alpha);
      band(-edge, edge, stone);
      for (let c = 0; c < 3; c++) {
        const y0 = -edge + c * course;
        const y1 = y0 + course;
        // The course: lit along its top, falling into shadow along its bottom.
        band(y0 + bed, y0 + bed + 0.1, shade(stone, 0.2), 0.8);
        band(y1 - 0.14, y1, shade(stone, -0.28), 0.7);
        band(y0, y0 + bed, mortar);
        // Running bond: joints at the middle and the edges, then at the quarters, then again.
        const joints = c % 2 === 0 ? [-edge, 0, edge] : [-edge / 2, edge / 2];
        for (const x of joints) {
          const a = Math.max(-edge, x - head);
          const b = Math.min(edge, x + head);
          poly(ctx, f, mortar, [[a, y0], [b, y0], [b, y1], [a, y1]]);
        }
      }
      // The coping, on both edges: whichever faces the lane is the wall's face.
      band(-edge, -edge + 0.07, shade(stone, 0.5));
      band(edge - 0.07, edge, shade(stone, 0.5));
      return;
    }
    case 'wallRise0':
    case 'wallRise1':
    case 'wallRise2':
    case 'wallRise3':
    case 'wallRise4':
    case 'wallRise5':
    case 'wallRise6':
    case 'wallRise7':
    case 'wallRise8':
    case 'wallRise9':
    case 'wallRise10':
    case 'wallRise11':
    case 'wallRise12':
      paintWallCap(ctx, f, palette.sky, half / r, Number(kind.slice('wallRise'.length)) - WALL_RISE_MAX);
      return;
    case 'boss11Seat':
      /*
        THE HOUSING THE GYRE IS SET INTO — 0332. A ring with four lugs and a bore through it. It has
        no hurt twin because nothing ever hits it, and it is sealed in the place's own `sky` rather
        than in a foe's skin: it is the wall, not the creature.
      */
      trace(ctx, f, GYRE_SEAT_RIM);
      ring(ctx, f, 0, 0, GYRE_SEAT_BORE);
      ctx.fillStyle = palette.sky;
      seal(ctx);
      paintBoss11Seat(ctx, f, palette);
      return;
    case 'boss12':
    case 'boss12Hit':
      // THE FROST SHIP — 0264: a long crystal, its point to the front, two great ice-spires swept
      // back off its flanks and a smaller pair at the prow.
      trace(ctx, f, HOARFROST_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss12(ctx, f, skin, theme);
      return;
    case 'boss13':
    case 'boss13Hit':
      // THE HYDRA — 0264: a broad body and five necks reaching forward, each ending in a skull
      // with its jaws open. The drawing is `hydraHull` above.
      trace(ctx, f, HYDRA_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss13(ctx, f, skin, theme);
      return;
    case 'boss14':
    case 'boss14Hit': {
      // THE JELLYFISH — 0264: a bell to the front, the one curved edge in the game, and six
      // tendrils trailing behind it, spreading as they go — the biggest hull there is.
      const [bx, by, br] = MEDUSA_BELL;
      ctx.arc(half + r * bx, half + r * by, r * br, Math.PI / 2, (Math.PI * 3) / 2);
      for (const [top, tip, bottom] of MEDUSA_TENDRILS) {
        ctx.lineTo(half + r * top[0], half + r * top[1]);
        ctx.lineTo(half + r * tip[0], half + r * tip[1]);
        ctx.lineTo(half + r * bottom[0], half + r * bottom[1]);
      }
      ctx.closePath();
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintBoss14(ctx, f, skin, theme);
      return;
    }
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
      glow(ctx, f, ink, 0, 0, 1.15, 0.5);
      disc(ctx, f, shade(ink, 0.7), 0, 0, 0.36);
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
      glow(ctx, f, ink, 0, 0, 1.1, 0.5);
      // At 1.9 units the dash is about three pixels deep on a 1280×720 screen since the view zoomed
      // out (0364), so its core is most of it: 0.54 deep, which is 0106's floor.
      poly(ctx, f, shade(ink, 0.7), [
        [-0.5, -0.27],
        [0.85, -0.27],
        [0.85, 0.27],
        [-0.5, 0.27],
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
      poly(ctx, f, shade(ink, -0.35), [
        [-0.72, 0.06],
        [0.72, 0.06],
        [0.46, 0.72],
        [-0.46, 0.72],
      ]);
      glow(ctx, f, ink, 0, 0, 1.12, 0.45);
      disc(ctx, f, shade(ink, 0.7), 0, -0.04, 0.3);
      return;
    case 'acid':
      /*
        ── IT WAS A DROP UNTIL 0300, AND A DROP CLAIMS A DIRECTION IT CANNOT HAVE ──────────────────

        ⚠️ **0248 DREW IT ROUND BELOW AND POINTED ABOVE** — *a disc with a tail, and the tail survives
        fifteen pixels*. Which is a good drawing of a falling drop, and this bead does not fall. The
        serpent throws it on `Math.PI + firePhase + sweep * sin(t * waves * TAU)`
        (`src/app/boss.ts`), so a volley leaves on headings spread across a sine and **every bead
        flies a different way**. `blit` cannot rotate, so the point stayed north while the thing went
        west, and three of every four beads were drawn pointing somewhere they were not going.

        ⚠️ **REPORTED**: *"the acid needs a better graphic, it's currently drops that look weird as
        hell because they wouldn't look like that as a 'spray' coming from a source."* The wrongness
        is the heading rather than the draughtsmanship — which is why the answer is not a better drop.

        ⚠️ **A GOBBET: AN IRREGULAR BLOB WITH NO DOMINANT POINT, SO THERE IS NO HEADING TO BE WRONG
        ABOUT.** Lumpy rather than round, because the disc is the pulse's and a perfect circle reads
        as a bead rather than as something thrown; and two droplets thrown clear of it, because a
        spray is more than one thing. Baked at four headings and looked at before it was chosen.

        ⚠️ **THE DROPLETS ARE IN THE SEALED PATH, AND THE FIRST DRAFT PAINTED THEM ON TOP OF IT.**
        Drawn after `seal` in the hull's own ink they LOOK like part of the body and are not: the
        silhouette the player reads stops being the one the file draws, and every extent and hurtbox
        claim is measured against the sealed path.
        `tests/accents.test.ts` caught it at **-4.74px** outside the hull — 0149's floor, doing
        exactly its job, and 0192's rule is that the work moves rather than the guard.

        ⚠️ **SO THE BLOB IS SMALLER AND THE DROPLETS ARE THROWN CLEAR OF IT.** Clear is load-bearing
        twice over: a sub-path that OVERLAPS the body would be `evenodd`'s hole rather than its
        fill — a crescent bitten out — and one that sits apart is genuinely two objects, which is
        what a spray is. Everything stays inside the unit radius the box is drawn in.
      */
      trace(ctx, f, [
        [0, -0.7],
        [0.4, -0.5],
        [0.65, -0.18],
        [0.58, 0.22],
        [0.37, 0.55],
        [0.04, 0.69],
        [-0.34, 0.59],
        [-0.63, 0.3],
        [-0.68, -0.1],
        [-0.4, -0.52],
      ]);
      // Two thrown clear of it, in the path so they are the silhouette rather than marks on it.
      ring(ctx, f, 0.6, 0.56, 0.14);
      ring(ctx, f, -0.62, -0.55, 0.11);
      seal(ctx);
      glow(ctx, f, palette.acid, 0, 0, 1.1, 0.45);
      disc(ctx, f, shade(palette.acid, 0.6), -0.1, -0.12, 0.24);
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
    case 'maw':
    case 'mawHit':
      /*
        THE COMBINED BALL — 0311: *"a combined acid/void ball."* A void ring with acid churning inside
        it, because it is carrying both and bursts into both.

        ⚠️ **FILLED AND NOT HOLED, WHICH IS THE ONE THING IT DOES NOT SHARE WITH THE VOID.** The ring
        above is `evenodd` with a hole, and a hole is what makes a void read as an absence. This is the
        opposite object — a mouthful of something, with a surface the player is meant to shoot at — so
        the disc is solid and the void is its RIM. A hole here would also be a lie the moment the thing
        swells, because what grows is the drawing and the hole would grow with it into a bangle.

        ⚠️ **AND IT IS THE ONE SHOT WITH A HURT TWIN** (0035, and `tests/combat.test.ts`'s *a shot never
        flashes* is about shots that are spent by arriving). The wash is the standard one, so the twin
        is this same art under the flash ink and no second drawing.
      */
      ctx.arc(half, half, r * 0.86, 0, Math.PI * 2);
      seal(ctx);
      glow(ctx, f, palette.void, 0, 0, 1.15, 0.55);
      /*
        THE ACID INSIDE — three blots off centre, in the drops' own ink, so the ball reads as carrying
        something rather than as a bigger void. Their sizes fall, which is what keeps three marks from
        reading as a pattern.
      */
      /*
        ⚠️ **TWO BLOTS AND NOT THREE.** The third was `shade(palette.acid, 1.2)` and photographed
        VIOLET against the void's magenta rather than as a lighter acid — a third colour on an object
        whose whole job is to say *these two things together*. Two, in the acid's own ink, at sizes that
        do not read as a pattern.
      */
      disc(ctx, f, palette.acid, -0.22, -0.18, 0.3);
      disc(ctx, f, palette.acid, 0.26, 0.1, 0.22);
      // And the rim light the void wears, so the two are visibly the same family of thing.
      disc(ctx, f, shade(palette.void, 0.7), 0, -0.66, 0.15);
      return;
    case 'droplet':
      /*
        ONE DROP OF WHAT IT WAS CARRYING — 0311. A teardrop, point trailing, in the acid ink: the acid
        globe's family at two thirds its size, because sixteen of these leave one point at once and a
        ring of full-sized globes is a wall rather than a thing to fly between.
      */
      /*
        ⚠️ **POINT LEADING AND BLUNT BEHIND, AND THE FIRST DRAFT WAS A LENS.** Both ends were points and
        the highlight sat in the middle, so photographed at 4× it read as an **eye** — two symmetric
        curves are not a drop however they are filled. Every shot is baked facing down-lane, so the point
        is on the left: it is falling the way it is going.
      */
      ctx.moveTo(half - r * 0.92, half);
      ctx.quadraticCurveTo(half - r * 0.1, half + r * 0.5, half + r * 0.42, half + r * 0.44);
      ctx.quadraticCurveTo(half + r * 0.9, half + r * 0.36, half + r * 0.9, half);
      ctx.quadraticCurveTo(half + r * 0.9, half - r * 0.36, half + r * 0.42, half - r * 0.44);
      ctx.quadraticCurveTo(half - r * 0.1, half - r * 0.5, half - r * 0.92, half);
      seal(ctx);
      glow(ctx, f, palette.acid, 0, 0, 1.05, 0.45);
      /*
        ⚠️ **THE HIGHLIGHT SITS IN THE BLUNT END AND THE FIRST ONE DID NOT.** A drop is thin where it
        tapers, and a disc at (-0.15, -0.12) of 0.2 hung **0.28 px outside** the hull on a 1280×720 screen
        — `tests/accents.test.ts` measured it. Back and up, where the body actually is.
      */
      disc(ctx, f, shade(palette.acid, 1.3), 0.34, -0.1, 0.18);
      return;
    case 'frost':
      /*
        A SHARD — 0253: a six-pointed star of ice, the one bullet with points all round — not the
        lump's corners, the drop's one point or the ring's none. In the `frost` ink with a cold glow
        and a pale heart, a disc of 0.2 over every floor a solid mark is held to.
      */
      trace(ctx, f, [
        [0, -0.95],
        [0.24, -0.42],
        [0.82, -0.48],
        [0.46, 0],
        [0.82, 0.48],
        [0.24, 0.42],
        [0, 0.95],
        [-0.24, 0.42],
        [-0.82, 0.48],
        [-0.46, 0],
        [-0.82, -0.48],
        [-0.24, -0.42],
      ]);
      seal(ctx);
      glow(ctx, f, palette.frost, 0, 0, 1.12, 0.45);
      disc(ctx, f, shade(palette.frost, 0.6), 0, 0, 0.2);
      return;
    case 'rock':
      /*
        A LUMP — 0251: seven corners and no two edges alike, the one bullet with corners that is not
        a ring, a drop or a dart. Filled in the `fire` ink and then mostly covered in a dark bevel, so
        what reads is a black rock with a hot rim and one hot crack — the light coming out of it,
        which is the volcano's own argument (`drawVolcano`). The crack's heart is a disc of 0.22, well
        over the floor every solid mark is held to.
      */
      trace(ctx, f, [
        [-0.2, -0.92],
        [0.48, -0.7],
        [0.9, -0.1],
        [0.62, 0.56],
        [0.1, 0.92],
        [-0.6, 0.64],
        [-0.9, 0.02],
        [-0.7, -0.52],
      ]);
      seal(ctx);
      poly(ctx, f, shade(palette.fire, -0.6), [
        [-0.1, -0.7],
        [0.36, -0.52],
        [0.66, -0.06],
        [0.44, 0.42],
        [0.06, 0.7],
        [-0.42, 0.48],
        [-0.66, 0.02],
        [-0.52, -0.38],
      ]);
      glow(ctx, f, palette.fire, 0, 0, 1.12, 0.4);
      disc(ctx, f, shade(palette.fire, 0.6), 0.08, -0.06, 0.22);
      return;
    case 'flame': {
      /*
        ── IT WAS A TONGUE UNTIL 0301, AND A TONGUE LEANS THE WAY IT FLIES ─────────────────────────

        ⚠️ **0249 DREW A FLAME'S OUTLINE — pointed at the front, notched behind where it licks,
        leaning.** Which is a good drawing of a flame moving one way, and the whip throws these on an
        arc: `src/app/boss.ts` spreads them across `sweep` and marches the speed so the lash bows.
        Same defect the acid had one decision earlier — a silhouette asserting a heading a bitmap
        cannot have — and the same answer: **no dominant point, so nothing to be wrong about.**

        ⚠️ **A BALL OF FIRE, NOT A CIRCLE**, asked for in those words. Fourteen points on an
        alternating radius, the long ones licking further out at no two the same, so the edge is
        ragged all the way round; a bright heart under a hot core, because fire is lit from inside;
        and the halo over all of it. The randomness is a SEEDED stream (`makeRng('art')`), so the
        bake is identical on every machine and every run — `docs/decisions/0021-one-stream-per-concern.md`.

        ⚠️ **AND IT IS 5 UNITS NOW, THE VOID'S OWN SIZE.** At 1.2 it drew 8.6 px and was reported
        twice as impossible to see. What its hurtbox cost is on the row in `src/content/shots.ts`.
      */
      const lick = makeRng('art').stream('flame');
      const lobes: Pt[] = [];
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        const rr = k % 2 === 0 ? lick.range(0.86, 1) : lick.range(0.5, 0.66);
        lobes.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      trace(ctx, f, lobes);
      seal(ctx);
      glow(ctx, f, palette.fire, 0, 0, 1.15, 0.5);
      // Lit from inside: the body's own ink lightened, then a hot heart in the hazard's yellow.
      disc(ctx, f, shade(palette.fire, 0.45), 0, 0, 0.52);
      disc(ctx, f, palette.hazard, -0.06, -0.04, 0.28);
      return;
    }
    case 'spine':
      /*
        A BARBED FIN-SPINE — 0316. It was a FEATHER, which 0262 asked for in those words and which was
        true of an eagle; this is the same bullet on the same rung of the ladder, drawn as the thing a
        fish actually throws.

        ⚠️ **WHAT SEPARATES IT FROM THE FEATHER IT REPLACES IS THE BARBS, AND THEY RAKE BACKWARDS.** A
        vane is a fine even comb down both sides, widest near the tail; this is **three barbs a side,
        each bigger than the one in front of it**, off a needle point — so the silhouette reads as a
        thing that goes in and does not come out. Still not the lance's dash (a bar with no edge), not
        the acid's drop (round at the back), not the missile's dart (pointed both ends).

        ⚠️ **THE POINT LEADS, WHICH THE SHAFT DID TOO.** Both are drawn along their own travel, and that
        half of 0262 is what made the bullet legible in the first place — it is kept on purpose.
      */
      trace(ctx, f, [
        [1, 0],
        [0.4, -0.07],
        [0.24, -0.32],
        [0.1, -0.12],
        [-0.1, -0.15],
        [-0.26, -0.46],
        [-0.4, -0.17],
        [-0.56, -0.2],
        [-0.72, -0.58],
        [-0.84, -0.22],
        [-1, -0.2],
        [-1, 0.2],
        [-0.84, 0.22],
        [-0.72, 0.58],
        [-0.56, 0.2],
        [-0.4, 0.17],
        [-0.26, 0.46],
        [-0.1, 0.15],
        [0.1, 0.12],
        [0.24, 0.32],
        [0.4, 0.07],
      ]);
      seal(ctx);
      /*
        The core, darker, from the base to where the needle narrows — inside the hull by a margin, and
        wide enough to be a mark at thirty pixels (`tests/accents.test.ts` holds the containment).

        ⚠️ **SHORTER THAN 0262's SHAFT RATHER THAN THINNER, AND TWO GUARDS DECIDED THAT BETWEEN THEM.**
        The feather's vane was wide, so a shaft of 0.12 read as a stripe inside it; this hull is a
        needle, and the same rectangle filled it edge to edge — forty-two pixels of bright bar with
        three pairs of spikes off it, which is a **fish bone** and not a spine. Thinning it to 0.08
        fixed the picture and `tests/accents.test.ts` refused it at **2.03 px against a floor of 2.5**:
        a mark too thin to be drawn is not a mark. So it keeps its width and gives up its front half
        instead — it now runs only where the hull is thick, and the needle is bare ink to the point.
        0.21 became 0.244 when the view zoomed out (0364), which is where the floor sits now.
      */
      poly(ctx, f, shade(ink, 0.55), [
        [-0.86, -0.122],
        [-0.06, -0.122],
        [-0.06, 0.122],
        [-0.86, 0.122],
      ]);
      // ⚠️ On the BODY rather than ahead of the point, where 0262 put it: a feather's glow sat over the
      // wide end of its vane, and the same offset on a needle is a halo round the tip that fills the
      // taper back in. Photographed twice.
      glow(ctx, f, ink, -0.1, 0, 0.5, 0.35);
      return;
    case 'ripple':
      /*
        A LOZENGE lying ACROSS the lane — 0327: the axis it is long on is the axis it swings on, so
        the silhouette points the way the path goes. Twice as wide as deep, which is what keeps it
        from the drifter's diamond (square, and a hull) and from the spit's square beside it on the
        ladder; painted on the spit's own terms, a halo in the place's ink and a hot heart.
      */
      trace(ctx, f, [
        [0.5, 0],
        [0, -1],
        [-0.5, 0],
        [0, 1],
      ]);
      seal(ctx);
      glow(ctx, f, ink, 0, 0, 1.1, 0.5);
      poly(ctx, f, shade(ink, 0.7), [
        [0.22, 0],
        [0, -0.46],
        [-0.22, 0],
        [0, 0.46],
      ]);
      return;
    case 'curl':
      /*
        A CRESCENT, open the way it bends — 0327: the one bullet whose silhouette says what its path
        is. Bent from the flak, so it keeps the slab's mass in its back and gives up the bevel for a
        horn at each tip; the dark bevel goes on the outer back, where a slab's went on its lower half,
        and the hot core sits in the thick of it.
      */
      trace(ctx, f, [
        [0.64, 0.77],
        [0.24, 0.97],
        [-0.21, 0.98],
        [-0.62, 0.79],
        [-0.9, 0.44],
        [-1, 0],
        [-0.9, -0.44],
        [-0.62, -0.79],
        [-0.21, -0.98],
        [0.24, -0.97],
        [0.64, -0.77],
        [0.73, -0.64],
        [0.36, -0.74],
        [-0.01, -0.64],
        [-0.28, -0.37],
        [-0.38, 0],
        [-0.28, 0.37],
        [-0.01, 0.64],
        [0.36, 0.74],
        [0.73, 0.64],
      ]);
      seal(ctx);
      // ⚠️ Inside the outline by a tenth rather than on it, and the halo a shade under the slab's:
      // `tests/accents.test.ts` refused a bevel drawn on the hull's own edge and a glow reaching
      // past the box the next bitmap begins in, and both were read off the guard rather than guessed.
      poly(ctx, f, shade(ink, -0.35), [
        [-0.53, 0.68],
        [-0.77, 0.38],
        [-0.86, 0],
        [-0.77, -0.38],
        [-0.53, -0.68],
        [-0.45, -0.42],
        [-0.55, 0],
        [-0.45, 0.42],
      ]);
      glow(ctx, f, ink, -0.1, 0, 1.0, 0.45);
      // In the thick of the back, clear of the mouth: the hollow's edge is at −0.38, and a core at
      // −0.55 with a radius of 0.26 poked into it by a tenth — the same guard, read again.
      disc(ctx, f, shade(ink, 0.7), -0.66, 0, 0.22);
      return;
    case 'kite':
    case 'kiteHit':
      /*
        A SWEPT DELTA WITH TWO STREAMERS — 0249, redrawn by 0321. The drifter is a diamond too, and
        what tells the two apart at twenty pixels is the tail: two ribbons off the back, which the
        drifter has not. **Straight-edged on purpose** — `KITE_HULL`'s own note has why, and it is one
        of the two channels 0314 separates this from the minnow on.
      */
      trace(ctx, f, KITE_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintKite(ctx, f, skin);
      return;
    case 'swift':
    case 'swiftHit':
      // A SWEPT CHEVRON — 0328: nose forward, wings raked back, open at the back. `SWIFT_HULL` has why
      // it is none of the diamond, the delta or the triangle it shares a sky with.
      trace(ctx, f, SWIFT_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintSwift(ctx, f, skin);
      return;
    case 'minnow':
    case 'minnowHit':
      // A SPINDLE WITH A FORKED TAIL — 0314: a blunt snout, a dorsal fin up and an anal fin down, and
      // a notch in the back end. The kite beside it is a straight-edged diamond with two streamers.
      curveLoop(ctx, f, MINNOW_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintMinnow(ctx, f, skin);
      return;
    case 'moonJelly':
    case 'moonJellyHit':
      // A BELL WITH A FRINGE — 0255: a dome across the front and four short tendrils trailing off
      // the back. The kite is a diamond and the moth a disc; a dome with a ragged back edge is
      // neither at twenty pixels.
      trace(ctx, f, MOON_JELLY_HULL);
      if (skin !== null) ctx.fillStyle = skin.hull;
      seal(ctx);
      if (skin !== null) paintMoonJelly(ctx, f, skin, theme);
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
      ── A FIREBALL'S TRAIL — 0301 ────────────────────────────────────────────────────────────────

      Three motes of burning air, dropped behind the ball and cooling as they go. **Each is the same
      drawing at a smaller extent** (`src/content/sprites.ts`) rather than three different shapes: it
      is one thing going out, and a trail whose shape changed frame to frame would read as three
      objects. What carries the walk is size and heat — the last is dimmer and yellower-out.

      ⚠️ **RAGGED RATHER THAN ROUND, ON THE FIREBALL'S OWN ARGUMENT**, and drawn with its own seeded
      stream so a mote is not a scaled copy of the ball sitting behind it.

      ⚠️ **NO HOT HEART ON THE LAST TWO.** A mark on a bitmap this small is under the floor
      `tests/accents.test.ts` holds (0106), and a trail is not something the player has to read
      anyway — it says *that came from there*, and nothing else.
    */
    case 'ember0':
    case 'ember1':
    case 'ember2': {
      const rng = makeRng('art').stream(kind);
      const lobes: Pt[] = [];
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const rr = k % 2 === 0 ? rng.range(0.82, 0.98) : rng.range(0.46, 0.62);
        lobes.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      trace(ctx, f, lobes);
      seal(ctx);
      glow(ctx, f, palette.fire, 0, 0, 1.1, kind === 'ember0' ? 0.45 : 0.3);
      if (kind === 'ember0') disc(ctx, f, shade(palette.fire, 0.4), 0, 0, 0.42);
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
      disc(ctx, fg, shade(palette.glass, 0.5), 0.18, -0.04, 0.085);
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
      /*
        ⚠️ **AND THE GLOW IS *A BIT OF A GLOW* AGAIN — 0294.** Reported: *"the shurikens also need to
        be smaller and neater, it's too hard to see enemy elements with them onscreen at the moment."*
        The star itself went 8 units to 5.6, and that is half the answer: **the halo was drawn at the
        whole drawing radius at 0.55**, so a blade veiled a disc far wider than the blade, and a dozen
        of them at the cap veiled the lane. What is behind a blade is the thing the player is trying
        to shoot.

        ⚠️ **0.75 AND 0.35, WHICH IS WHAT 0238 ASKED FOR IN THE FIRST PLACE**: *"also with a bit of a
        glow to them."* The metal still reads as lit — the shading on the four edges is what does that
        work — and the glow stops being a second, larger, softer blade.

        ── AND IT WENT TOO FAR THE OTHER WAY — 0298 ──────────────────────────────────────────────

        ⚠️ **0.75/0.35 → 0.9/0.45**, played back as *"at least a little bit of a glow"* — which is
        0238's line again, about the build 0294 produced. The cut above was two changes at once and
        only one of them was asked for: the star went 8 units to 5.6 AND the halo went from the whole
        radius at 0.55 to three quarters at 0.35, so the glow lost width twice over.

        ⚠️ **AND THE ABSOLUTE HALO IS STILL WELL UNDER WHAT WAS COMPLAINED ABOUT, WHICH IS THE POINT
        OF WRITING IT AS A FRACTION.** 0294's report was about how much of the lane a blade veils, and
        that is a number of units rather than a share of the drawing: the halo it removed was
        `8 × 1.0`, and this one is `5.6 × 0.9` — a little over half as wide, at a lower alpha. The
        veiling stays fixed and the metal gets its light back.
      */
      ctx.globalCompositeOperation = 'destination-over';
      glow(ctx, f, palette.blade, 0, 0, 0.9, 0.45);
      ctx.globalCompositeOperation = 'source-over';
      for (let k = 0; k < 4; k++) {
        const a = phase + (k * Math.PI) / 2;
        poly(ctx, fg, shade(palette.blade, -0.38), [
          [Math.cos(a) * 0.96, Math.sin(a) * 0.96],
          [Math.cos(a + 0.7) * 0.36, Math.sin(a + 0.7) * 0.36],
          [Math.cos(a + 0.45) * 0.34, Math.sin(a + 0.45) * 0.34],
        ]);
        /*
          Wide enough to be drawn at the shipped camera — `tests/accents.test.ts` holds the floor.
          Widened a third when the box went to a twelfth of the lane (0244): at eight units the sliver
          it was came out at 2.1 px on a 1280×720 screen, under 0106's floor of 2.5. It widens on the
          trailing side, up to the shadow's edge: the leading point is already on the star's own edge,
          and a mark over the hull is the other guard in the same file.

          ⚠️ **AND WIDENED AGAIN BY 0294, WHEN THE BOX WENT THE OTHER WAY** — 8 units to 5.6, on *"the
          shurikens also need to be smaller and neater"* — which brought it back to **1.97 px**. The
          same fix the note above records, in the same place, for the opposite reason.

          ⚠️ **AND IT TOOK TWO WRONG GUESSES TO FIND, WHICH IS WHY THE MARK IS NAMED HERE.** The
          trailing shadow was widened first on the strength of its own comment, and then the hub; the
          number did not move for either, because the guard counts the glow as mark 1 and this is mark
          3. **A floor that names an index is naming something — read it before editing what feels
          likely.**

          ⚠️ **AND THE FIRST WIDENING WENT BOTH WAYS AND CAME BACK 0.17 px OVER THE HULL**, which is
          the sentence three lines above this one, arriving as a failure rather than as advice. The
          leading point sits on the star's own edge; there is nowhere for it to go but off. **Only the
          trailing side has room**, and that is not a preference.

          ⚠️ **AND AGAIN WHEN THE VIEW ZOOMED OUT (0364)**, which brought it to 2.33 px: the trailing
          corner went from 0.52 at +0.29 to 0.49 at +0.36 — further round, and in along the trailing
          edge so it keeps its margin to it.
        */
        poly(ctx, fg, shade(palette.blade, 0.45), [
          [Math.cos(a) * 0.86, Math.sin(a) * 0.86],
          [Math.cos(a - 0.16) * 0.36, Math.sin(a - 0.16) * 0.36],
          [Math.cos(a + 0.36) * 0.49, Math.sin(a + 0.36) * 0.49],
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
          [c * 0.4 - s * 0.093, s * 0.4 + c * 0.093],
          [c * 0.9 - s * 0.093, s * 0.9 + c * 0.093],
          [c * 0.9 + s * 0.093, s * 0.9 - c * 0.093],
          [c * 0.4 + s * 0.093, s * 0.4 - c * 0.093],
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
      disc(ctx, fg, shade(palette.glass, 0.6), 0.34, -0.03, 0.145);
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
        [-0.093, -0.5],
        [0.093, -0.5],
        [0.093, 0.05],
        [-0.093, 0.05],
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
    // The storm's ball — 0374: a round hull in the ship's ink, lit from inside, with a glow round it
    // so it reads as charged rather than as a bigger pulse. Round where the bomb is notched, so the
    // two thrown things are told apart by shape and not by ink alone (0024).
    case 'stormBall': {
      // ⚠️ A lit core, and it was glass first: the glass ink is dark, and the first photograph was a
      // hollow ring — the one thing a charged ball must not look like (`scripts/shot-sheet.mjs`).
      ctx.arc(half, half, r * 0.55, 0, Math.PI * 2);
      seal(ctx);
      const lit = shade(palette.player, 0.6);
      // Four short forks off the hull, so it reads as lightning held in a ball — translucent, because
      // they are light and not body: the silhouette stays the round hull (0227's paint-on-hull rule).
      for (const [dx, dy] of [
        [1, 0.3],
        [-0.3, 1],
        [-1, -0.3],
        [0.3, -1],
      ] as const) {
        poly(
          ctx,
          f,
          lit,
          [
            [dx * 0.45 - dy * 0.08, dy * 0.45 + dx * 0.08],
            [dx * 0.95, dy * 0.95],
            [dx * 0.45 + dy * 0.08, dy * 0.45 - dx * 0.08],
          ],
          0.8,
        );
      }
      disc(ctx, f, lit, 0, 0, 0.3);
      glow(ctx, f, '#ffffff', 0, 0, 0.3, 0.7);
      return;
    }
    // What leaves the ship. It shared this drawing with `pickupBomb` until 0372 removed the pickup.
    case 'bomb': {
      /*
        ── A LARGE FORWARD-FIRING MISSILE — `docs/decisions/0375-the-bomb-is-a-missile.md` ─────────

        *"It should be a large forward firing missile like a h-bomb style thing, not a hand held
        thrown bomb, it doesn't make any sense for it to have the shape it does now."* It was a disc
        with a fuse, drawn when the bomb was lobbed; it flies up the lane from the nose, so it is drawn
        pointing +x like everything else that flies: an ogive warhead, a long body, four fins (two
        seen), and the burn behind it. Twice the extent it was, because *"large"*.

        ⚠️ **TWO DARK BANDS ON A LIT CASING**, which is the H-bomb's own graphic language and what
        keeps it from reading as a bigger missile at twenty pixels on the trigger button.
      */
      trace(ctx, f, [
        [1, 0],
        [0.86, -0.14],
        [0.66, -0.22],
        [-0.55, -0.22],
        [-0.8, -0.5],
        [-0.97, -0.5],
        [-0.86, -0.2],
        [-0.9, -0.14],
        [-0.9, 0.14],
        [-0.86, 0.2],
        [-0.97, 0.5],
        [-0.8, 0.5],
        [-0.55, 0.22],
        [0.66, 0.22],
        [0.86, 0.14],
      ]);
      seal(ctx);
      const casing = palette[INK_OF[kind]];
      // The lit upper half of the casing, then the two bands, then the warhead's glass eye.
      poly(ctx, f, shade(casing, 0.35), [
        [0.66, -0.18],
        [-0.52, -0.18],
        [-0.52, -0.03],
        [0.66, -0.03],
      ]);
      // A band an eighth of the drawing wide: the thinner first draw was under 2.5px at game size
      // and `tests/accents.test.ts` refused it as not drawn at all.
      for (const at of [0.46, 0.24]) {
        poly(ctx, f, shade(casing, -0.45), [
          [at, -0.2],
          [at - 0.12, -0.2],
          [at - 0.12, 0.2],
          [at, 0.2],
        ]);
      }
      disc(ctx, f, palette.glass, 0.76, 0, 0.09);
      // The burn behind it — light, not body, so translucent (0227), and inside its own box.
      glow(ctx, f, palette.flame, -0.84, 0, 0.28, 0.8);
      return;
    }
    // The pyre's rungs are the SAME drawing at a different extent — 0079. Four bitmaps, one shape.
    case 'blastHalf':
    case 'blastWide':
    case 'blastWidest':
    case 'blast':
    case 'blastFire':
    case 'blastSmoke': {
      /*
        ── A FILLED EXPLOSION, AND THE HOLE IS GONE — 0375 ─────────────────────────────────────────

        It was a ring with most of its middle taken out, *"so it reads as a shockwave rather than as a
        solid disc the player cannot see through."* Played: *"it's still just basically a yellow
        circle"*, and of keeping the middle open, *"it just looks like that area should not be
        affected"* — which it is, all of it. And the hole bought nothing: `blasts` is the FIRST layer
        (`src/app/mount.ts`), so the ship, every body and every bullet are drawn over it already. A
        filled explosion hides the sky and nothing the player has to see.

        So it is fire to the edge: a solid rim at exactly the damage radius, and billowing layers
        inside it, translucent, hottest at the middle. Three frames for a thrown bomb — the burst,
        the fire rolling out, the smoke — and the pyre's rungs are the burst at their own sizes.

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
      const fire = palette.flame;
      const heat = palette.hazard;
      // The front: a thin solid rim at exactly the damage radius — where the edge was, in every frame.
      ctx.arc(half, half, edge, 0, Math.PI * 2);
      ctx.moveTo(half + edge * 0.94, half);
      ctx.arc(half, half, edge * 0.94, 0, Math.PI * 2);
      seal(ctx);
      if (kind === 'blastSmoke') {
        // The smoke: dark, thinning, rolling out to the edge and going.
        billow(ctx, half, edge * 0.94, 0.07, 5, 2.1, shade(fire, -0.62), 0.5);
        billow(ctx, half, edge * 0.72, 0.1, 4, 0.7, shade(fire, -0.78), 0.4);
        return;
      }
      if (kind === 'blastFire') {
        // The fire rolling out: dimmer, redder, and filled to the rim.
        billow(ctx, half, edge * 0.95, 0.07, 6, 1.3, fire, 0.62);
        billow(ctx, half, edge * 0.72, 0.1, 5, 0.4, shade(fire, -0.25), 0.55);
        billow(ctx, half, edge * 0.45, 0.12, 4, 2.6, shade(heat, 0.15), 0.45);
        return;
      }
      // The burst: fire to the rim, a lit fireball inside it, and a white-hot core.
      billow(ctx, half, edge * 0.92, 0.06, 7, 0.2, fire, 0.72);
      billow(ctx, half, edge * 0.64, 0.1, 5, 1.9, shade(heat, 0.3), 0.78);
      glow(ctx, f, '#ffffff', 0, 0, (edge * 0.38) / r, 0.85);
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
        [-0.5, -0.345],
        [0.5, -0.345],
        [0.5, -0.14],
        [-0.5, -0.14],
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
      A surge's aura — 0373: a faint halo the ship sits in, and a thin rim that says where it ends.

      ⚠️ **TRANSLUCENT ALL THROUGH, AND THE FIRST BAKE WAS A SOLID DISC.** The rim was laid on the path
      the glow had left open and sealed with the ink, which filled the whole circle — photographed
      with `scripts/shot-sheet.mjs` before anything was played. A disc that size round the ship would
      hide every bullet beside it, so the rim is its own path at under full alpha, and nothing is
      stroked.
    */
    case 'auraHunt':
    case 'auraOverdrive': {
      const ink = palette[INK_OF[kind]];
      glow(ctx, f, ink, 0, 0, 1, 0.35);
      ctx.beginPath();
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.9, half);
      ctx.arc(half, half, r * 0.9, 0, Math.PI * 2);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = ink;
      ctx.fill('evenodd');
      ctx.globalAlpha = 1;
      return;
    }
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
      drawSky(ctx, kind, size, theme, palette.glass === palette.space && palette.trim === palette.space);
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
    // The far land's placeholder, on `skyGround`'s terms exactly — 0347. `bakeGround` replaces it.
    case 'skyRange':
      RANGE_OF[theme]?.(ctx, palette.space, palette.space, palette.sky, size);
      return;
    // Rock thrown from a crater — 0347. Lava's own inks, or the sky's where decoration is the void.
    case 'ember':
      drawEmber(ctx, size, palette.glass === palette.space && palette.trim === palette.space ? palette.sky : null);
      return;
    case 'bubble':
    case 'bubblePop':
      drawBubble(ctx, size, kind === 'bubblePop', palette.glass === palette.space && palette.trim === palette.space ? palette.sky : null);
      return;
    case 'veinBead':
      drawBead(ctx, size, palette.glass === palette.space && palette.trim === palette.space ? palette.sky : null);
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
  /**
   * Which of the place's star colours this mark is drawn in, or `null` for the palette's `sky` ink.
   *
   * ⚠️ **A COLOUR AND NOT AN INDEX, so the painter holds no table** — the row that authored the field
   * authored the colour, and `drawSky` does what the mark says.
   */
  tint: string | null;
  /**
   * How much of the radius is soft, 0 (a hard disc, which is what every mark was) to 1.
   *
   * ⚠️ **A BRIGHT STAR IS A POINT WITH LIGHT ROUND IT, NOT A BIG DISC.** A mark at the layer's ceiling
   * drawn hard is a twelve-pixel coin on a desktop; drawn as a small core inside a gradient to nothing
   * it is a star, and it has no edge at any scale a bullet has one — 0112's own test.
   */
  halo: number;
}

/**
 * A place's own star field, for a place that authors one — absent, and the field is the shared one.
 *
 * ⚠️ **ON THE ROW, PER 0282**: *no row can forget it* argues for a default and never for a constant,
 * so shared code holds the old field as the fallback and a place states what its stars are.
 */
export interface StarStyle {
  /** How many marks the back layer carries, against the shared count. */
  readonly far: number;
  /** And the middle one. */
  readonly near: number;
  /**
   * How hard the sizes lean small. `1` is the old even spread across the top half of the range; higher
   * puts nearly every star at a pinpoint and leaves a handful at the ceiling.
   */
  readonly lean: number;
  /** The smallest radius, as a share of the layer's ceiling. */
  readonly floor: number;
  /** Above this share of the ceiling a star is drawn with a halo rather than as a disc. */
  readonly bright: number;
  /** The colours, with how often each is drawn. Weights need not sum to one. */
  readonly tints: readonly (readonly [string, number])[];
  /**
   * A band of far light across the back layer: where it sits across the tile (0 to 1), how deep it is,
   * and what share of the back layer's stars are gathered into it. They are the faintest in the field.
   */
  readonly band: { readonly at: number; readonly depth: number; readonly share: number };
}

/** The widest hard-edged core a tinted star may have, as a radius in world units. The rest is light. */
export const STAR_CORE_UNITS = 0.11;

/** How strong a star's light is at its centre: the few hero stars, and everything else with a radius. */
export const STAR_LIGHT = { hero: 0.75, other: 0.4 } as const;

/**
 * How much of a tile a place's TINTED stars light, as a share of its area, alpha counted.
 *
 * ⚠️ **`skyCover` HAS NEVER COUNTED A STAR, AND UNTIL 0343 IT DID NOT NEED TO**: every star was the
 * palette's `sky` ink, which is darker than anything the player has to find. A tinted star is bright,
 * so it is light in the sky on `skyCover`'s own terms — and this is the number that says how much. A
 * cone falling linearly to nothing holds a third of its disc, which is the same falloff arithmetic
 * `cloudCover` rests on.
 */
export function starLight(kind: SkyKind, size: number, theme: ThemeKind): number {
  const field = skyField(kind, size, theme);
  const perUnit = size / SPRITE_EXTENT[kind];
  let lit = 0;
  for (const star of field.stars) {
    if (star.tint === null) continue;
    const r = star.r / perUnit;
    const core = Math.min(r, STAR_CORE_UNITS * (star.halo > 0 ? 1.2 : 1));
    const peak = star.halo > 0 ? STAR_LIGHT.hero : STAR_LIGHT.other;
    lit += field.alpha * star.dim * Math.PI * (core * core + (r * r - core * core) * (peak / 3));
  }
  return lit / (SPRITE_EXTENT[kind] * SPRITE_EXTENT[kind]);
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
  /**
   * How solid this place's boldest cloud may be. Absent is `NEBULA_ALPHA.to`, which six places keep.
   *
   * ⚠️ **THE SHARED CEILING IS STILL SHARED, AND IT IS NOT THIS NUMBER** — 0345. What every place is
   * held under is *fainter than the faintest field of marks* (`tests/budget.test.ts`), which shared
   * code and a guard own. 0.22 sat well inside that for all seven because one constant had to suit
   * the thinnest sky and the thickest; a place whose whole subject is gas states its own, and the
   * contrast floor counts what that costs, pile and all.
   */
  readonly cloudCeiling?: number;
  /** The place's own stars. Absent is the shared field, exactly as it was. */
  readonly stars?: StarStyle;
  /**
   * A sky that grades — deep overhead and hazed at the horizon. Absent is one flat colour, which six
   * places keep — `docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md`.
   *
   * ⚠️ **THE TWO HALVES COST DIFFERENT THINGS AND ARE COUNTED DIFFERENTLY.** Deepening the top takes
   * the sky towards the land colour, which is darker, so every ink's ratio goes UP and nothing counts
   * it — `skyCover`'s own argument about dark marks. The haze is light, and `skyCover` counts it at
   * every row of the tile exactly as a canvas draws a two-stop linear gradient.
   *
   * Every position is a fraction of the weather tile, so 0.25 to 0.75 is the lane (`LANE_TOP`).
   */
  readonly daylight?: {
    /** Where the sky is its own colour: above, it deepens; below, it hazes. */
    readonly mid: number;
    /** How far towards the land colour the top of the lane is taken. */
    readonly deep: number;
    /** Where the haze is thickest — the horizon — and how thick. Flat below it, under the land. */
    readonly horizon: number;
    readonly haze: number;
  };
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
  approach: {
    density: 1,
    size: 1,
    tilt: 0,
    length: 1,
    clump: 0,
    dim: 0.15,
    drift: 0,
    clouds: 1,
    cloudSize: 1,
    cloudAlpha: 1,
    stars: {
      far: 9,
      near: 1.6,
      lean: 5,
      floor: 0.07,
      bright: 0.8,
      tints: [
        ['#cdd9ff', 9],
        ['#ffffff', 5],
        ['#fff0d2', 4],
        ['#ffc58f', 2],
        ['#ff9d8c', 1],
        ['#9fc4ff', 3],
      ],
      band: { at: 0.4, depth: 0.2, share: 0.45 },
    },
  },
  // Cloud and little else, piled up and lit from one side.
  nebula: {
    density: 0.5,
    size: 0.95,
    tilt: 0,
    length: 0.65,
    clump: 0.35,
    dim: 0.5,
    drift: 0.55,
    clouds: 3,
    cloudSize: 1.4,
    cloudAlpha: 1.7,
    cloudCeiling: 0.31,
    // Seen THROUGH gas — 0345: fewer than open space, warm, gathered where the gas is thin, no band.
    stars: {
      far: 7,
      near: 1.4,
      lean: 5,
      floor: 0.07,
      bright: 0.78,
      tints: [
        ['#ffe2c0', 6],
        ['#ffffff', 3],
        ['#ffb98a', 4],
        ['#ff8f7a', 2],
        ['#e8c8ff', 2],
      ],
      band: { at: 0.5, depth: 0.2, share: 0 },
    },
  },
  /*
    A jungle's sky — 0347: deep blue overhead, hazing towards the far range, with a few banks of
    weather. The star-field numbers are unread here, since a planet draws no star field (0221).
  */
  saurian: {
    density: 0.75,
    size: 1,
    tilt: 0.45,
    length: 0.3,
    clump: 0.8,
    dim: 0.55,
    drift: 0.35,
    clouds: 0.7,
    cloudSize: 0.95,
    cloudAlpha: 0.9,
    daylight: { mid: 0.43, deep: 0.6, horizon: 0.58, haze: 0.2 },
  },
  // Long structure going past. Almost nothing clumps in a corridor.
  labyrinth: { density: 0.55, size: 0.8, tilt: 0, length: 2.1, clump: 0.1, dim: 0.65, drift: 0.2, clouds: 0.35, cloudSize: 0.65, cloudAlpha: 0.6 },
  // A shelf of ice: shards in drifts, all lying the same way, and very little variation in them.
  /*
    ⚠️ `length` 0.55 → 0.18 — 0351: over ice the fast streaks at full length read as rain; short, as
    spindrift. And **a sky that grades**, 0347's mechanism: deep overhead and a cold haze thickening
    down to the bergs — the *paler, colder sky* of the ask, paid for by the room the snow gave back.
  */
  rime: {
    density: 1.2,
    size: 1,
    tilt: -0.85,
    length: 0.18,
    clump: 0.6,
    dim: 0.2,
    drift: 0.15,
    clouds: 0.6,
    cloudSize: 1.1,
    cloudAlpha: 0.75,
    daylight: { mid: 0.4, deep: 0.5, horizon: 0.6, haze: 0.15 },
  },
  // Dense fine motes, evenly suspended, in thick banks of haze.
  mire: { density: 1.7, size: 0.55, tilt: 0.2, length: 0.2, clump: 0.25, dim: 0.7, drift: 0.7, clouds: 1.5, cloudSize: 0.8, cloudAlpha: 1.35 },
  /*
    ⚠️ **A STAR FIELD LIKE NOWHERE ELSE IN THE RUN — 0354.** It was *nearly empty* (0211, density
    0.3); asked for: *"a beautiful starry backdrop."* Its own row on 0343's machinery: denser than The
    Approach's, in the heart's colours — rose, crimson and violet, with the ice blue of its glow and
    a few white — and a band of far light across it.
  */
  core: {
    density: 1,
    size: 0.85,
    tilt: 0,
    length: 1.5,
    clump: 0.45,
    dim: 0.4,
    drift: 0.85,
    clouds: 0.5,
    cloudSize: 1.6,
    cloudAlpha: 1.15,
    stars: {
      far: 12,
      near: 2.2,
      lean: 5,
      floor: 0.07,
      bright: 0.78,
      tints: [
        ['#ffd6e2', 6],
        ['#ffffff', 3],
        ['#ff7a8c', 4],
        ['#d2a8ff', 4],
        ['#a8d4ff', 3],
        ['#ffdcae', 1],
      ],
      band: { at: 0.45, depth: 0.2, share: 0.5 },
    },
  },
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
  /*
    ⚠️ **AN AUTHORED FIELD KEEPS ONLY THE MARGIN A DOT NEEDS — 0343.** Six hundredths of the tile a side
    is a twelve-unit strip with nothing in it at every join, which ninety marks never showed and eight
    hundred would: a bare stripe crossing the screen on a schedule. The margin exists so no mark is
    cut by the seam (0065), and what a dot needs for that is its own radius.
  */
  const dotsOnly = kind !== 'skyRush' && style.stars !== undefined;
  const margin = dotsOnly
    ? (size / SPRITE_EXTENT[kind]) * SKY_MAX_STAR_UNITS[kind] * 1.1
    : size * 0.06;
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
  // A place's own stars are the two DOT layers' business; the streaks are a speed cue and stay shared.
  const own = streak ? undefined : style.stars;
  const more = own === undefined ? 1 : kind === 'skyFar' ? own.far : own.near;
  const count = Math.max(1, Math.round(SKY_STARS[kind] * style.density * more));
  const weight = own === undefined ? 0 : own.tints.reduce((sum, [, w]) => sum + w, 0);
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
        if (dotsOnly && spanX > 0) {
          /*
            ⚠️ **ALONG THE SCROLL AXIS AN AUTHORED FIELD CLUMPS ROUND THE TILE, NOT INSIDE IT — 0345.**
            A pull towards a knot and a clamp drags every mark off the two edges, and 0343's own seam
            guard measured what that leaves: **a bare strip 17.7 units wide at every join** in Ember
            Nebula, the first dense field that also clumps. The tile repeats, so the nearest copy of
            a knot may be the one over the edge; pulled the short way round and wrapped, a drift can
            straddle the join like anything else in a sky that tiles.
          */
          let pull = knot.x - x;
          if (pull > spanX / 2) pull -= spanX;
          if (pull < -spanX / 2) pull += spanX;
          x = (((x + pull * style.clump) % spanX) + spanX) % spanX;
        } else {
          x = Math.max(0, Math.min(spanX, x + (knot.x - x) * style.clump));
        }
        y = Math.max(0, Math.min(spanY, y + (knot.y - y) * style.clump));
      }
    }
    if (own === undefined) {
      stars.push({
        x: margin + x,
        y: margin + y,
        r: biggest * rng.range(0.5, 1),
        len,
        angle: style.tilt,
        dim: 1 - rng.range(0, Math.max(0, Math.min(1, style.dim))),
        tint: null,
        halo: 0,
      });
      continue;
    }
    /*
      ⚠️ **NEARLY EVERY STAR IS A PINPOINT AND A HANDFUL ARE NOT, WHICH IS WHAT A SKY IS.** A uniform
      draw raised to `lean` piles the field up against `floor`; the few that land near the ceiling are
      the bright ones, and they are drawn as a core in a halo rather than as a disc that size.
    */
    let share = own.floor + (1 - own.floor) * Math.pow(rng.range(0, 1), own.lean);
    /*
      The band: a share of the back layer gathered about one line across the tile, all of them at the
      floor. Three uniforms averaged is a soft-shouldered spread with no edge to it, and the band runs
      ALONG the scroll axis, so it is periodic by construction and owes the seam nothing.
    */
    if (kind === 'skyFar' && rng.range(0, 1) < own.band.share) {
      const spread = (rng.range(-1, 1) + rng.range(-1, 1) + rng.range(-1, 1)) / 3;
      y = Math.max(0, Math.min(spanY, (own.band.at + spread * own.band.depth) * span));
      share = own.floor;
    }
    let pick = rng.range(0, weight);
    let tint: string | null = null;
    for (const [colour, w] of own.tints) {
      tint = colour;
      pick -= w;
      if (pick <= 0) break;
    }
    stars.push({
      x: margin + x,
      y: margin + y,
      r: biggest * share,
      len,
      angle: style.tilt,
      // Faint ones are the far ones: brightness runs with size, with the place's own spread over it.
      dim: Math.min(1, 0.35 + 0.65 * Math.sqrt(share)) * (1 - rng.range(0, Math.max(0, Math.min(1, style.dim)))),
      tint,
      halo: share > own.bright ? 0.78 : 0,
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
  /**
   * Which of the place's further `gases` this cloud is, or `null` for the body or the accent — 0345.
   *
   * ⚠️ **AN INDEX AND NOT A COLOUR, because the field knows nothing about a palette** and a gas is
   * stated per palette. `null` for every cloud of a place that states none, which is six of seven.
   */
  gas: number | null;
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
  // How many further gases the place states — the vivid row's count, and both palettes agree (0345).
  const gases = THEMES[theme].gases?.vivid.length ?? 0;
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
      alpha: Math.min(style.cloudCeiling ?? NEBULA_ALPHA.to, rng.range(NEBULA_ALPHA.from, NEBULA_ALPHA.to) * style.cloudAlpha),
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
      /*
        ⚠️ **WALKED, ON THE ACCENT'S OWN ARGUMENT ONE FIELD UP** — 0345. Of every three clouds one is
        the accent, one stays the body the place is recognised by, and the third takes the next gas in
        turn: so every gas a place states is on the screen, none can be rolled out of existence, and
        the body still has the largest single share.
      */
      gas: gases > 0 && i % 3 === 2 ? Math.floor(i / 3) % gases : null,
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
  /**
   * A lit mark drawn in the gas's own BODY colour rather than its glow — 0354. Absent is the glow, as
   * every lit mark has been since 0223. The Black Heart's vessels are wine and its glow is ice blue:
   * drawn in the glow they came out of the photograph as blue pipes. `skyCover` still charges every
   * lit mark at the glow, the brighter of the two, which over-counts — the direction a floor may err.
   */
  gas?: boolean;
}


/*
  ── THERE WERE HULKS HERE, AND THEY ARE GONE — 0342 ──────────────────────────────────────────────

  ⚠️ **`docs/decisions/0342-the-hulks-come-out.md`.** 0222 answered *"a plain black background is a
  plain boring game"* with one generator — a dark polygon with a hairline rim — called from five
  places. Reported 2026-09-21: *"it's just a really bad layer that shows up on every level."* That is
  0282's tell exactly: a mechanism whose output is the same for every place made five places one
  place. What a place puts at that scale is its own drawing on its own row, or nothing.
*/

/*
  ── AND THERE WAS A RANDOM WALK HERE, `crossing`, WHICH NOTHING CALLS ANY MORE — 0345 ────────────

  It walked a line across the tile in straight segments and forced the last point home, which made it
  periodic in height (0207) and never in slope: every line it drew kinks at the join, and at a
  desktop's size every line it drew is visibly made of straight pieces. The Labyrinth left it in 0220
  for sums of sines, The Approach's rifts in 0343, and Ember Nebula's dust in 0345 — a sine whose
  period divides the tile is periodic in both by construction.
*/

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
    /*
      ── THE LIMB IS GONE, AND WHAT IS HERE IS THE LIGHT THE STARS ARE GATHERED ALONG — 0343 ────────

      ⚠️ **THE LIMB COULD NOT BE MADE GOOD AS A TILE, SO IT IS NOT ONE.** 0211 drew *"a limb of the
      world behind you"* as a cosine arc, highest at the tile's two edges — so every join was a CUSP,
      and what crossed the screen was a grey hill with a point on it, in one flat fill. Reported:
      *"fix the grey up the bottom as well, it's going to look weird and out of place."* A planet's
      edge is one curve seen once; a repeating tile can only ever draw it as a row of humps. The seam
      guard could not see it — it holds the heights a crossing mark leaves and arrives at, and a cusp
      agrees about height and disagrees about slope.

      ⚠️ **TILE y 0.25 TO 0.75 IS THE LANE** — kept from the limb's own note, because it is the trap
      this table keeps falling into: the weather tile is twice the lane across and blitted centred,
      so lane 40, where `SKY_STYLE_OF.approach.stars.band` gathers the back layer, is tile 0.45.

      The band is drawn as light with no edge: eight filled ribbons about one centreline, each a little
      narrower than the last and each nearly nothing, so the sum rises to the middle. **Sines whose
      periods divide the tile**, The Labyrinth's own answer — periodic in height AND in slope, which is
      the half the limb did not have.
    */
    const rng = makeRng('sky').stream('approach/band');
    const phase = [rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2)];
    const SAMPLES = 48;
    const centre = (t: number): number =>
      0.45 + 0.022 * Math.sin(Math.PI * 2 * t + phase[0]!) + 0.009 * Math.sin(Math.PI * 4 * t + phase[1]!);
    // It swells and narrows along its length, which is what stops it reading as a stripe.
    const swell = (t: number): number => 1 + 0.3 * Math.sin(Math.PI * 4 * t + phase[2]!);
    const out: StructureMark[] = [];
    const RIBBONS = 8;
    for (let k = 0; k < RIBBONS; k += 1) {
      const half = 0.075 * Math.pow(1 - k / RIBBONS, 1.6) + 0.004;
      const upper: number[][] = [];
      const lower: number[][] = [];
      for (let s = 0; s <= SAMPLES; s += 1) {
        const t = s / SAMPLES;
        upper.push([t * size, (centre(t) - half * swell(t)) * size]);
        lower.push([t * size, (centre(t) + half * swell(t)) * size]);
      }
      out.push({ points: [...upper, ...lower.reverse()], width: 0, alpha: 0.065, crosses: true, taper: false, lit: true });
    }
    /*
      And dust in front of it: two dark rifts wandering along the band, which is what makes a band of
      far light read as a galaxy seen edge-on rather than as a smear. Dark, so they cost nothing.
    */
    /*
      ⚠️ **SINES AGAIN, AND NOT `crossing`, BECAUSE THE PHOTOGRAPH SHOWED THE DIFFERENCE.** `crossing`
      is a random walk in straight segments, which is right for a corridor wall and drew these as
      zigzags with a kink in the middle of the screen. Dust along a band of light is a slow curve.
    */
    for (let r = 0; r < 2; r += 1) {
      const off = rng.range(-0.012, 0.012);
      const sway = rng.range(0.006, 0.012);
      const turn = rng.range(0, Math.PI * 2);
      const points: number[][] = [];
      for (let s = 0; s <= SAMPLES; s += 1) {
        const t = s / SAMPLES;
        points.push([t * size, (centre(t) + off + sway * Math.sin(Math.PI * 2 * (2 + r) * t + turn)) * size]);
      }
      out.push({ points, width: rng.range(0.008, 0.014) * size, alpha: 0.42, crosses: true, taper: false, lit: false });
    }
    return out;
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
    /*
      ── THE DUST FLOWS NOW, AND IT USED TO BE THREE SLABS AND NINE ZIGZAGS — 0345 ───────────────────

      ⚠️ **THE 1080p PHOTOGRAPH, NOT THE REPORT, FOUND THIS.** The lanes were `crossing` random walks in
      eight straight segments, ten to twenty-two units thick at one flat alpha: on a desktop they are
      angular slabs with hard corners, and between them they darkened most of the lane — which is a
      large part of why the gas behind them read as mud. The filaments were the same walk at fourteen
      segments: zigzags.

      ⚠️ **A LANE IS A RIBBON THAT SWELLS AND THINS, DRAWN THREE TIMES SO ITS EDGE IS SOFT.** Sums of
      sines whose periods divide the tile — periodic in height and in slope, which a walk forced home
      in its last segment never is. Narrower than the slabs on purpose: the dust is in front of the
      light and must leave most of it showing.

      ⚠️ **STILL DARK, ALL OF IT**, which is the measurement the header above records and is unchanged.
    */
    const flow = makeRng('sky').stream('nebula/flow');
    // 128, because at 64 the busiest filament turned 13.4° at one vertex and the guard reads 12 as a kink.
    const SAMPLES = 128;
    const lanes: StructureMark[] = [];
    for (let lane = 0; lane < 3; lane += 1) {
      const at = 0.3 + lane * 0.2 + flow.range(-0.04, 0.04);
      const bend = [flow.range(0.025, 0.05), flow.range(0.01, 0.02)];
      const turn = [flow.range(0, Math.PI * 2), flow.range(0, Math.PI * 2), flow.range(0, Math.PI * 2)];
      const body = flow.range(0.016, 0.03);
      const centre = (t: number): number =>
        at + bend[0]! * Math.sin(Math.PI * 2 * t + turn[0]!) + bend[1]! * Math.sin(Math.PI * 6 * t + turn[1]!);
      // Pinches nearly shut and opens out again, twice a tile: a lane of dust is not a pipe.
      const half = (t: number): number => body * (0.55 + 0.45 * Math.sin(Math.PI * 4 * t + turn[2]!));
      for (const [grow, alpha] of [[1.7, 0.16], [1.25, 0.2], [0.8, 0.3]] as const) {
        const upper: number[][] = [];
        const lower: number[][] = [];
        for (let s = 0; s <= SAMPLES; s += 1) {
          const t = s / SAMPLES;
          upper.push([t * size, (centre(t) - half(t) * grow) * size]);
          lower.push([t * size, (centre(t) + half(t) * grow) * size]);
        }
        lanes.push({ points: [...upper, ...lower.reverse()], width: 0, alpha, crosses: true, taper: false, lit: false });
      }
    }
    // Fine dust threaded between them: the same material at a smaller scale, and restless.
    const filaments: StructureMark[] = [];
    for (let i = 0; i < 9; i += 1) {
      const at = flow.range(0.14, 0.86);
      const sway = [flow.range(0.012, 0.03), flow.range(0.004, 0.01)];
      const turn = [flow.range(0, Math.PI * 2), flow.range(0, Math.PI * 2)];
      const waves = 2 + Math.floor(flow.range(0, 3));
      const points: number[][] = [];
      for (let s = 0; s <= SAMPLES; s += 1) {
        const t = s / SAMPLES;
        points.push([
          t * size,
          (at + sway[0]! * Math.sin(Math.PI * 2 * waves * t + turn[0]!) + sway[1]! * Math.sin(Math.PI * 2 * (waves + 3) * t + turn[1]!)) * size,
        ]);
      }
      filaments.push({ points, width: flow.range(0.002, 0.006) * size, alpha: 0.3, crosses: true, taper: false, lit: false });
    }
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
        // Three times about its own centre, so a knot of dust has a soft edge like the lanes it sits in
        // — 0345. Scaled evenly, so its proportions (and 0203's band, which reads them) are unchanged.
        for (const [grow, alpha] of [[1.5, 0.14], [1.2, 0.2], [0.85, 0.3]] as const) {
          knots.push({
            points: points.map((p) => [x + (p[0]! - x) * grow, y + (p[1]! - y) * grow]),
            width: 0,
            alpha,
            crosses: false,
            taper: false,
            lit: false,
          });
        }
      }
    }
    // The three hulks 0222 hung in the gas are gone — 0342. The Pillars are this place's large thing.
    return [...filaments, ...knots, ...lanes];
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
  saurian: () => {
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
      ⚠️ **THE BELT IS A DRIFT OF SPECKS, AND IT USED TO BE THE THING 0203 FORBIDS** — 0222. These
      were five-to-seven-sided rocks at `0.012` to `0.04` of a 200-unit tile: **2.4 to 8 world units
      across, against a bullet at 1.8 and a body at up to 8.** Their own comment claimed the polygon
      was *"deliberately not a disc — a disc at this size is a bullet's silhouette, which 0203's band
      is about"*, and the band is about SIZE. Nothing had ever checked `STRUCTURE_OF` against it, so a
      place had been drawing body-sized debris in the sky since 0211.

      ⚠️ **0222 ALSO HUNG FOUR HULKS UP HERE AND 0342 TOOK THEM DOWN** — dark heptagons in a daytime
      sky, which is the picture the report called *"a really bad layer"*.
    */
    /*
      ⚠️ **AND 0347 TOOK THE SPECKS DOWN TOO.** Twenty-one dark flecks in a daytime sky, photographed
      at 1080p: they read as dirt on the glass rather than as a belt overhead, and nothing else on the
      screen said *belt*. The sky has weather, a haze and a volcano's smoke in it now, and rock that
      is actually flying — which is what a speck in the sky was standing in for.
    */
    return out;
  },

  /*
    ── THE LABYRINTH: THE MAZE GOES ON BELOW — 0348 ────────────────────────────────────────────────

    *"There's no labyrinth that the player is actually flying through."* The corridor the player is
    in is walls at the edges of the box now (`paintCorridor`), and the backdrop is what a corridor with
    an open top looks down on: **more of the maze, far below** — passages at right angles, junctions,
    dead ends and loops, going past at the weather's slow rate.

    ⚠️ **THIS WAS A WAVY CHANNEL THROUGH THE MIDDLE OF THE LANE, AND UNDER REAL WALLS IT LIED.** 0220
    drew the path the player was inside as backdrop, because there was no other way to say *inside*.
    With masonry at the box's edges, two curving walls sweeping through the lane read as walls the
    ship flies straight through — 0036's report, waiting to be filed.

    ⚠️ **A MAZE, GENERATED, AND PERIODIC BECAUSE IT IS GENERATED ON A RING.** A grid whose columns wrap,
    carved by a depth-first walk and then braided — a share of dead ends knocked through — so it has
    loops and junctions rather than one long thread. Every wall is a straight run on the grid, merged
    with its neighbours in line so a corridor wall is one mark rather than eight.

    ⚠️ **THE LANGUAGE IS 0220's, UNCHANGED:** a dark body, a faint lit top face so the body is on
    screen at all in the thinnest gas of the seven, and a hairline rim on one side for the light.
  */
  labyrinth: (size) => {
    const rng = makeRng('sky').stream('labyrinth/maze');
    const out: StructureMark[] = [];
    /*
      ⚠️ **SMALL AND DIM, BECAUSE IT IS FAR BELOW — AND AT SIXTEEN COLUMNS IT WAS NOT.** The first
      draft's passages were about the corridor's own width and its rims as bright as 0220's, and the
      1080p photograph read them as walls standing in the lane: the exact complaint this replaced the
      wavy channel for. Scale and light are the two depth cues left to a flat mark, so the maze is a
      quarter-size of the corridor per passage and its light a third of what it was.
    */
    const COLS = 30;
    const cell = 1 / COLS;
    const top = 0.21;
    const ROWS = 17;
    const WALL = 0.008;
    // `open[c][r]` — which of a cell's right and lower sides have been carved through.
    const right: boolean[][] = [];
    const down: boolean[][] = [];
    const seen: boolean[][] = [];
    for (let c = 0; c < COLS; c += 1) {
      right.push(new Array<boolean>(ROWS).fill(false));
      down.push(new Array<boolean>(ROWS).fill(false));
      seen.push(new Array<boolean>(ROWS).fill(false));
    }
    const stack: [number, number][] = [[0, Math.floor(ROWS / 2)]];
    seen[0]![Math.floor(ROWS / 2)] = true;
    while (stack.length > 0) {
      const [c, r] = stack[stack.length - 1]!;
      const ways: [number, number, number, number][] = [];
      const east = (c + 1) % COLS;
      const west = (c + COLS - 1) % COLS;
      if (!seen[east]![r]) ways.push([east, r, 0, 1]);
      if (!seen[west]![r]) ways.push([west, r, 0, -1]);
      if (r + 1 < ROWS && !seen[c]![r + 1]) ways.push([c, r + 1, 1, 1]);
      if (r > 0 && !seen[c]![r - 1]) ways.push([c, r - 1, 1, -1]);
      if (ways.length === 0) {
        stack.pop();
        continue;
      }
      const [nc, nr, axis, dir] = ways[Math.floor(rng.range(0, ways.length))]!;
      if (axis === 0) right[dir > 0 ? c : nc]![r] = true;
      else down[c]![dir > 0 ? r : nr] = true;
      seen[nc]![nr] = true;
      stack.push([nc, nr]);
    }
    // Braid: knock through a share of the walls that are still standing, which is what makes loops.
    for (let c = 0; c < COLS; c += 1) {
      for (let r = 0; r < ROWS; r += 1) {
        if (!right[c]![r] && rng.range(0, 1) < 0.18) right[c]![r] = true;
        if (r + 1 < ROWS && !down[c]![r] && rng.range(0, 1) < 0.18) down[c]![r] = true;
      }
    }

    const wall = (points: number[][]): void => {
      /*
        The body, dark; a faint lit face along its top; and a hairline on its lower side. 0220's three
        passes, for 0220's reasons — the body alone is invisible in this gas.
      */
      out.push({ points, width: WALL * size, alpha: 0.62, crosses: false, taper: false, lit: false });
      out.push({
        points: points.map((p) => [p[0]!, p[1]! - WALL * size * 0.15]),
        width: WALL * size * 0.5,
        alpha: 0.07,
        crosses: false,
        taper: false,
        lit: true,
      });
      out.push({
        points: points.map((p) => [p[0]!, p[1]! + WALL * size * 0.5]),
        width: Math.max(1, size * 0.002),
        alpha: 0.18,
        crosses: false,
        taper: false,
        lit: true,
      });
    };
    const x = (c: number): number => c * cell * size;
    const y = (r: number): number => (top + r * cell) * size;

    // Horizontal walls: along each grid line, runs of uncarved lower sides merged into one mark.
    for (let r = 0; r < ROWS - 1; r += 1) {
      let from = -1;
      for (let c = 0; c <= COLS; c += 1) {
        const standing = c < COLS && !down[c]![r];
        if (standing && from < 0) from = c;
        if (!standing && from >= 0) {
          wall([[x(from), y(r + 1)], [x(c), y(r + 1)]]);
          from = -1;
        }
      }
    }
    // Vertical walls: along each column line, runs of uncarved right sides.
    for (let c = 0; c < COLS; c += 1) {
      let from = -1;
      for (let r = 0; r <= ROWS; r += 1) {
        const standing = r < ROWS && !right[c]![r];
        if (standing && from < 0) from = r;
        if (!standing && from >= 0) {
          wall([[x(c + 1), y(from)], [x(c + 1), y(r)]]);
          from = -1;
        }
      }
    }
    // 0222's three "blocks" stood in this place's sky — the shared hulk — and 0342 took them out.
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
    /*
      ⚠️ **SNOW, NOT STREAKS — 0351.** Photographed at 1080p these were long parallel strokes a fifth
      of the screen across, and read as rain; shortened to a fifth they still read as rain, because a
      field of parallel dashes is rain at any length, and crossed they read as hash marks. Each is a
      speck now — barely longer than it is wide — twice as many to a drift and more drifts.
    */
    for (let drift = 0; drift < 8; drift += 1) {
      const cx = rng.range(0.05, 0.95) * size;
      // Blowing above the shelf rather than scattered through the whole tile — the shelf is the ground
      // now, and a shard drawn below its skyline is buried in it.
      const cy = rng.range(0.28, 0.53) * size;
      for (let i = 0; i < 10; i += 1) {
        const x = cx + rng.range(-0.11, 0.11) * size;
        const y = cy + rng.range(-0.06, 0.06) * size;
        const len = rng.range(0.002, 0.004) * size;
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

            ⚠️ **AND THINNER AGAIN AT 0351**, because a speck is compact and 0222's band holds
            compact marks: at 0.004–0.008 wide the specks came to 1.9 units across against a bullet's
            1.8. Length and width both under 0.004 of the tile keeps every one under it.
          */
          width: rng.range(0.002, 0.004) * size,
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
      // ⚠️ Shorter and straighter at 0352: hung from a roof at 0.3, the old reach and sway put them
      // across the swamp's trunks as a second tangle of branches in mid-air.
      const reach = rng.range(0.05, 0.12) * size;
      const points: number[][] = [];
      let sway = 0;
      for (let s = 0; s <= 6; s += 1) {
        // A random WALK rather than a per-step offset: a frond leans and keeps leaning, which is what
        // hangs in a current instead of zigzagging.
        sway += rng.range(-0.012, 0.012) * size;
        /*
          ⚠️ **HUNG FROM THE CANOPY, WHICH DID NOT EXIST WHEN THIS WAS WRITTEN — 0221.** They started
          at tile 0.12 and reached down to 0.67, which is a curtain across most of the lane hanging
          from nothing. `GROUND_OF.mire` now puts a solid canopy at 0.4, so a frond that begins above
          it is inside a roof and one that begins below it is floating. They start AT the canopy and
          reach a little way past it into the corridor — which is the same *"reaches you before you
          reach it"* the place has always been about, with something to reach from.
        */
        // From the roof's line, which 0352 raised to 0.3.
        points.push([x + sway, 0.3 * size + (s / 6) * reach]);
      }
      out.push({ points, width: rng.range(0.01, 0.026) * size, alpha: 0.6, crosses: false, taper: true, lit: false });
    }
    return out;
  },

  /*
    ── THE BLACK HEART: VESSELS — 0354 ──────────────────────────────────────────────────────────────

    Asked for: *"Needs veins pulsing throughout the level."* 0211 made this place nearly empty on
    purpose, a few streaks drawn one way; the player has seen that and asked for the opposite, and the
    newer report wins. So: dark vessels crossing the whole tile, each with branches reaching off it —
    and the light that runs along them is `paintPulse`'s, which reads the same table.

    ⚠️ **LIT, IN THE PLACE'S OWN GAS, BECAUSE A SILHOUETTE ON THIS SKY IS NOTHING.** Drawn dark first,
    they were black lines on a sky nearly black and could not be found in the photograph. Lit, they
    are wine-dark vessels, and the sky's cover counts them: this place had the second most room of the
    seven (`scripts/weigh-sky.mjs`), and 0351's *lit is a contrast measurement, not a house style*
    is what spends it.
  */
  core: (size) => {
    const veins = VEINS_OF.core;
    const out: StructureMark[] = [];
    if (veins === null) return out;
    const SAMPLES = 96;
    for (const trunk of veins.trunks) {
      const points: number[][] = [];
      for (let s = 0; s <= SAMPLES; s += 1) points.push([(s / SAMPLES) * size, trunkAt(trunk, s / SAMPLES) * size]);
      out.push({ points, width: trunk.width * 0.7 * size, alpha: 0.85, crosses: true, taper: false, lit: true, gas: true });
    }
    for (const branch of veins.branches) {
      const trunk = veins.trunks[branch.trunk]!;
      // Leave along the trunk's own direction at that point, turned by `angle`, curling as it goes.
      const dx = 0.001;
      const heading = Math.atan2(trunkAt(trunk, branch.at + dx) - trunkAt(trunk, branch.at), dx) + branch.angle;
      const points: number[][] = [];
      let x = branch.at;
      let y = trunkAt(trunk, branch.at);
      const STEPS = 8;
      for (let s = 0; s <= STEPS; s += 1) {
        points.push([x * size, y * size]);
        const a = heading + (branch.curl * s) / STEPS;
        x += (Math.cos(a) * branch.reach) / STEPS;
        y += (Math.sin(a) * branch.reach) / STEPS;
      }
      out.push({ points, width: trunk.width * 0.5 * size, alpha: 0.7, crosses: false, taper: true, lit: true, gas: true });
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
export function paintStructure(ctx: Pen, glow: string, space: string, size: number, theme: ThemeKind, body: string = glow): void {
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
    const ink = mark.lit ? (mark.gas === true ? body : glow) : space;
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

function drawNebula(
  ctx: Pen,
  colour: string,
  glow: string,
  space: string,
  size: number,
  theme: ThemeKind,
  gases: readonly string[] = [],
): void {
  // Under the weather, because the weather is IN the sky — 0347. A no-op for six places.
  drawDaylight(ctx, colour, space, size, theme);
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
        fill.addColorStop(0, cloud.gas !== null && gases[cloud.gas] !== undefined ? gases[cloud.gas]! : cloud.glow ? glow : colour);
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
  paintStructure(ctx, glow, space, size, theme, colour);
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

/**
 * A sky that grades: taken towards the land colour overhead, and hazed in the weather's own colour at
 * the horizon — `SkyStyle.daylight`, 0347. Absent, nothing is drawn.
 *
 * ⚠️ **OUT HERE AND NOT INSIDE `drawNebula`, WHICH IS WHERE `tests/sky.test.ts` SCANS.** That scan
 * holds the CLOUDS to two stops because `cloudsAt` models their falloff; these are two linear
 * gradients with a model of their own (`hazeAt`), and inside the slice they would redden a claim
 * that is about something else.
 *
 * ⚠️ **TWO STOPS EACH, AT 0 AND 1, FOR THE SAME REASON THE CLOUDS HAVE TWO.** `hazeAt` models the haze
 * as linear in tile height, which is exactly what a canvas interpolates between two stops.
 */
function drawDaylight(ctx: Pen, haze: string, deep: string, size: number, theme: ThemeKind): void {
  const day = SKY_STYLE_OF[theme].daylight;
  if (day === undefined) return;
  ctx.globalAlpha = 1;
  // Overhead: from the land colour at the top of the lane to nothing at `mid`. Only ever darker.
  const over = ctx.createLinearGradient(0, LANE_TOP * size, 0, day.mid * size);
  over.addColorStop(0, rgba(deep, day.deep));
  over.addColorStop(1, rgba(deep, 0));
  ctx.fillStyle = over;
  ctx.fillRect(0, 0, size, day.mid * size);
  // And everything above the lane at the full depth, so the tile has no edge where the gradient starts.
  ctx.fillStyle = rgba(deep, day.deep);
  ctx.fillRect(0, 0, size, LANE_TOP * size);
  // The haze: nothing at `mid`, thickest at the horizon, and flat below it where the land stands.
  const low = ctx.createLinearGradient(0, day.mid * size, 0, day.horizon * size);
  low.addColorStop(0, rgba(haze, 0));
  low.addColorStop(1, rgba(haze, day.haze));
  ctx.fillStyle = low;
  ctx.fillRect(0, day.mid * size, size, (day.horizon - day.mid) * size);
  ctx.fillStyle = rgba(haze, day.haze);
  ctx.fillRect(0, day.horizon * size, size, size - day.horizon * size);
}

/** How much haze `drawDaylight` lays at tile height `y` — the model `skyCover` counts it by. */
function hazeAt(theme: ThemeKind, y: number, size: number): number {
  const day = SKY_STYLE_OF[theme].daylight;
  if (day === undefined) return 0;
  const t = (y / size - day.mid) / (day.horizon - day.mid);
  return day.haze * Math.max(0, Math.min(1, t));
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
 *
 * ⚠️ **TWO READINGS, BY THE COLOUR A MARK IS DRAWN IN — 0354.** `which = 'glow'` — the default, and
 * every reading before 0354 — is the gas, the haze and every lit mark drawn in the glow, all charged
 * at the place's loudest colour. `which = 'gas'` is the lit marks drawn in the gas's BODY colour
 * (`StructureMark.gas`) and nothing else, to be charged at that colour. The Black Heart's vessels are
 * wine, and charged as its ice-blue glow they read as a sky of light at 0.85 cover and put `player`
 * at 1.85:1 over a backdrop no pixel of the place is. A guard charging the wrong colour measures the
 * wrong quantity; the consumer composites the two (`tests/sky.test.ts`).
 */
export function skyCover(size: number, theme: ThemeKind, share = 0.005, step = 4, which: 'glow' | 'gas' = 'glow'): number {
  const clouds = which === 'glow' ? nebulaField(size, theme) : [];
  const marks = STRUCTURE_OF[theme](size).filter((mark) => mark.lit && (mark.gas === true) === (which === 'gas'));

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
    // The haze under the clouds, composited the way a canvas does — 0347. Nought for six places.
    let cover = which === 'glow' ? 1 - (1 - hazeAt(theme, y, size)) * (1 - cloudsAt(clouds, x, y)) : 0;
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
  gases: readonly string[] = [],
): void {
  const size = bakeSize(SPRITE_EXTENT.skyNebula, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  drawNebula(ctx, colour, glow, space, size, theme, gases);
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
  light?: LandLight,
): void {
  if (GROUND_OF[theme] === null) return;
  const size = bakeSize(SPRITE_EXTENT.skyGround, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  drawGround(ctx, land, sky, glow, size, theme, light);
  (atlas.bitmaps as CanvasImageSource[])[SPRITE.skyGround] = canvas;
  /*
    ⚠️ **AND THE FAR LAND, FOR A PLACE THAT HAS ONE — 0347**, on exactly these terms: a place without
    one leaves the slot stale and never blits it, because `skyFor` builds its sky from what it states.
  */
  const range = RANGE_OF[theme];
  if (range === null) return;
  const far = document.createElement('canvas');
  far.width = size;
  far.height = size;
  const pen = far.getContext('2d');
  if (pen === null) return;
  range(pen, land, sky, glow, size, light);
  (atlas.bitmaps as CanvasImageSource[])[SPRITE.skyRange] = far;
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
  plain = false,
  scale = 1,
): void {
  /*
    ⚠️ **AT THE RESOLUTION IT IS DRAWN AT — 0347.** 0346 let an entry draw a landmark bigger than its
    bitmap, and a bitmap baked for scale 1 and blitted at 1.4 is a mountain 40% softer than every
    other edge on the screen. `scale` is the largest any entry in the level asks for; the drawing
    takes `size` in pixels, so it is the same drawing with more of them.
  */
  const size = bakeSize(SPRITE_EXTENT.landmark * scale, pixelsPerUnit);
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
    drawLandmark(ctx, gas, glow, space, size, theme, seed, plain);
    (atlas.bitmaps as CanvasImageSource[])[LANDMARK_SLOTS[seed]!] = canvas;
  }
}

/*
  ── THE CHART: THE COIL AS A ROUTE — `docs/decisions/0340-the-coil-is-a-route.md` ────────────────

  ⚠️ **A DRAWING AND NOT A SPRITE, AND IT WAS A SPRITE FOR ONE BUILD.** The first version of the
  crossing replaced the game with a full-screen chart blitted from the atlas, and the play-test said
  what that was: *"it takes the player out of the game."* The crossing is a burn the ship makes in the
  world now, and the chart is a small inset in the banner that names the place — so it is drawn into a
  canvas of the chrome's own, exactly as the title screen's pickup key is, and the atlas never hears of
  it. That took a sprite kind, a re-bake with a staleness memo, a second painter and a shared-geometry
  argument out of the game, all of which existed to serve a picture that was in the wrong place.

  ⚠️ **`docs/game.md`'s one stated constraint on the chart is answered by the shape rather than by a
  label**: *"it must read as descent toward the centre, and must not be a copy of the star map."* So
  the route is a spiral that loses radius as it goes and ends at the exact middle — which is where The
  Black Heart is, in the fiction and in the picture.
*/

/**
 * How far round the chart's spiral the whole route goes, in turns.
 *
 * ⚠️ **OVER ONE TURN ON PURPOSE.** At exactly one the first and last stops sit on the same bearing
 * and the route reads as a ring with a dot in the middle; over it, the curve visibly passes inside
 * where it has already been, which is the only thing that makes a flat picture read as a coil.
 */
export const CHART_TURNS = 1.15;

/**
 * The radius the route starts at, as a fraction of the chart's own tile. It ends at exactly nothing.
 *
 * ⚠️ **ENDING AT ZERO IS THE FICTION RATHER THAN A ROUNDING.** `docs/game.md` puts the black hole at
 * the heart of the galaxy; the last place on the roster is The Black Heart, so the last stop on the
 * route is the middle of the picture. Any other number would be a coil that stops just short of the
 * thing it is a coil around.
 *
 * ⚠️ **AND IT LEAVES ROOM FOR THE WIDEST MARK A STOP CAN WEAR, WHICH IS NOT ITS DISC.** The
 * destination wears a second ring at `CHART_RING` stop radii, so the first place reaches
 * `CHART_OUTER + CHART_STOP × CHART_RING` — and that has to stay inside the half-tile or the top of
 * the route is clipped by the canvas's own edge. **It was 0.44 and that sum came to 0.5135**, caught
 * by `tests/travel.test.ts` rather than by looking.
 */
export const CHART_OUTER = 0.42;

/**
 * How the radius falls as the route goes: `(1 - u)` raised to this.
 *
 * ⚠️ **BELOW ONE, AND A STRAIGHT LINE WAS TRIED FIRST AND WAS WRONG.** With the radius falling
 * linearly while the ANGLE advances at a constant rate, the inner legs get shorter and shorter until
 * they are nothing. Measured: the last two places came out **exactly 7% of the tile apart, which is
 * exactly a stop's own diameter**, so the final two discs were tangent and the destination's ring cut
 * straight through the one before it. 0.6 holds radius for longer and spends it near the middle,
 * which is also what a coil looks like: the turns crowd towards the eye rather than dying out before
 * it.
 */
export const CHART_TIGHTEN = 0.6;

/** A stop's disc, as a fraction of the tile; and how many of its radii out the destination's ring is. */
export const CHART_STOP = 0.035;
export const CHART_RING = 2.1;

/**
 * Where a point `u` of the way along the whole route falls, as a fraction of the chart's tile — `u`
 * is 0 at the first place and 1 at the last.
 *
 * ⚠️ **Straight up at `u = 0`**, so the outermost place is at the top and the descent reads downward
 * as well as inward. A route that started at the right-hand side would read as a clock face.
 */
export function chartTileX(u: number): number {
  return 0.5 + Math.cos(chartAngle(u)) * chartRadius(u);
}

export function chartTileY(u: number): number {
  return 0.5 + Math.sin(chartAngle(u)) * chartRadius(u);
}

function chartAngle(u: number): number {
  return -Math.PI / 2 + u * CHART_TURNS * Math.PI * 2;
}

export function chartRadius(u: number): number {
  return CHART_OUTER * Math.pow(1 - u, CHART_TIGHTEN);
}

/**
 * How finely the spiral is sampled per leg when it is stroked.
 *
 * ⚠️ **A COUNT PER LEG RATHER THAN OVER THE WHOLE ROUTE, SO THE INNER LEGS ARE NOT COARSER.** The
 * route loses radius as it goes, so a fixed total would put the same number of samples on a long
 * outer arc as on a short inner one — the visible corner
 * `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` measures on the serpent's spine. Forty
 * straight segments across a sixth of a turn is under half a degree each, which no edge shows.
 */
const CHART_SAMPLES = 40;

/**
 * The Coil as a route, drawn whole: the spiral, the stops on it, and which legs have been flown.
 *
 * `flown` is how many legs are behind the run, which is the index of the place it is crossing TO.
 * `faint` is what a leg not yet flown is drawn in.
 *
 * ⚠️ **A LEG IS DRAWN IN THE COLOUR OF THE PLACE IT LEADS TO, WHICH IS WHY THIS TAKES NO EXTRA INK.**
 * The first version stroked the flown route in the player's cyan, which said *you* rather than
 * *where* — and made the chart a progress bar with dots on it. Coloured by destination, the route IS
 * the list of places, and the one thing the picture has to say — *these are behind you and that one
 * is not* — is said by whether a leg has a colour at all.
 *
 * ⚠️ **AND THE STOPS ARE `LEVEL_KINDS` WALKED, NEVER A LIST OF SEVEN.** `LEVELS[kind].theme` is the
 * one ordering — `src/content/levels.ts` refuses a second — so a place added to the roster appears
 * on the chart in its own colours with nothing here edited: 0016, and 0282's *a change is finished
 * when the thing it added can differ per instance*.
 *
 * ⚠️ **NOTHING IS PAINTED OVER THE WHOLE TILE**, so the canvas is transparent wherever the route is
 * not and whatever is behind the banner shows through it.
 */
export function drawChart(ctx: Pen, size: number, palette: PaletteName, flown: number, faint: string): void {
  const legs = LEVEL_KINDS.length - 1;
  if (legs < 1) return;
  const glowOf = (stop: number): string => THEMES[LEVELS[LEVEL_KINDS[stop]!].theme].glow[palette];
  const bodyOf = (stop: number): string => THEMES[LEVELS[LEVEL_KINDS[stop]!].theme].nebula[palette];
  ctx.lineCap = 'round';
  for (let leg = 0; leg < legs; leg += 1) {
    const done = leg < flown;
    ctx.lineWidth = Math.max(1, size * 0.008);
    ctx.globalAlpha = done ? 0.9 : 0.3;
    ctx.strokeStyle = done ? glowOf(leg + 1) : faint;
    ctx.beginPath();
    for (let s = 0; s <= CHART_SAMPLES; s += 1) {
      const u = (leg + s / CHART_SAMPLES) / legs;
      const x = chartTileX(u) * size;
      const y = chartTileY(u) * size;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  /*
    ⚠️ **THE STOPS AFTER THE LEGS, so a disc is never cut in half by the line arriving at it.** The
    route is stroked THROUGH the middle of every stop rather than stopping short of one, which is what
    makes it read as one continuous coil with places on it rather than as six separate hops.
  */
  for (let stop = 0; stop <= legs; stop += 1) {
    const u = stop / legs;
    const x = chartTileX(u) * size;
    const y = chartTileY(u) * size;
    const r = size * CHART_STOP;
    /*
      ⚠️ **THE ONES AHEAD ARE DIMMER AND NOT SMALLER, because size on this chart would mean the
      place's own size and a place does not have one.** A route whose dots grew as the run went would
      be saying something about the places rather than about the run.
    */
    const ahead = stop > flown;
    ctx.globalAlpha = ahead ? 0.35 : 1;
    ctx.fillStyle = bodyOf(stop);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = ahead ? 0.4 : 0.95;
    ctx.strokeStyle = glowOf(stop);
    ctx.lineWidth = Math.max(1, size * 0.006);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    /*
      ⚠️ **AND THE DESTINATION WEARS A SECOND RING, WHICH IS THE ONE MARK HERE THAT IS ABOUT THE RUN.**
      The name beside the chart says where the ship is going; this says which dot that is, and without
      it the player has to count round a spiral to find out.
    */
    if (stop === flown) {
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, r * CHART_RING, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
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
function drawSky(ctx: Pen, kind: SkyKind, size: number, theme: ThemeKind, plain: boolean): void {
  const field = skyField(kind, size, theme);
  // The palette's own sky ink, which `drawKind` set: what an untinted mark is drawn in, and what every
  // mark is drawn in on a palette whose decoration is the void — 0024, on `foeOf`'s own test.
  const ink = ctx.fillStyle;
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
    const colour = plain || star.tint === null ? ink : star.tint;
    ctx.fillStyle = colour;
    ctx.strokeStyle = colour;
    /*
      ⚠️ **NO TINTED STAR HAS A HARD EDGE WIDER THAN A POINT, WHATEVER ITS RADIUS.** The first draft
      gave a halo only to the few above `bright`, and the 1080p photograph showed everything between a
      pinpoint and a hero star as an eight-pixel coin — the reported picture, in colour. The core is
      capped in WORLD units and the rest of the radius is light.
    */
    const core = Math.min(star.r, (size / SPRITE_EXTENT[kind]) * STAR_CORE_UNITS);
    if (star.len <= 0 && star.tint !== null && star.r > core && !plain) {
      /*
        A bright star: light falling away to nothing over the whole radius, and a small hard core.
        ⚠️ Two stops at 0 and 1 — the same edgeless falloff `drawNebula` uses, so nothing here has a
        boundary at the radius the field says it has.
      */
      const light = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r);
      // A hero star's light is stronger than a middling one's; `halo` is where the field says which.
      light.addColorStop(0, rgba(star.tint, star.halo > 0 ? STAR_LIGHT.hero : STAR_LIGHT.other));
      light.addColorStop(1, rgba(star.tint, 0));
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colour;
      ctx.beginPath();
      // A hero's core is a little heavier, and still a point: 2.9 CSS pixels at 1080p, held in pixels.
      ctx.arc(star.x, star.y, Math.max(0.6, core * (star.halo > 0 ? 1.2 : 1)), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (star.len <= 0) {
      ctx.beginPath();
      // Never under about a pixel across, or the smallest stars anti-alias away to nothing.
      ctx.arc(star.x, star.y, Math.max(0.6, star.r), 0, Math.PI * 2);
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

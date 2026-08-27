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
 * ⚠️ **The shapes here are placeholders. The pipeline is not.** `view` is a real argument and the
 * seam it opens is real — `docs/game.md` calls two views per entity the single largest art cost in
 * the project. What is temporary is that these particular shapes are rotations of one another; a
 * real side profile and a real top-down are different drawings, and the day they arrive nothing
 * outside this file changes.
 *
 * ⚠️ **This file is NOT on the hot list, and must never be called from a frame.** It allocates
 * freely, because it runs at load and on rotation. `src/app/frame.ts` is the file that runs every
 * frame, and it cannot reach this.
 */

import type { DecorInk, Palette } from '../content/palette.ts';
import type { ThemeKind } from '../content/themes.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../content/sprites.ts';
import { makeRng } from '../sim/rng.ts';

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
  // The HUD's lives counter rather than a pickup, since 0082 — it keeps the pickup ink because the
  // number beside it is drawn in the player's own colour and the icon has to sit with it.
  lifeIcon: 'pickup',
  pickupWeapon: 'pickup',
  pickupMissile: 'pickup',
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
  // The bullet ink, because it is a bullet. What separates it from the pulse is shape and size.
  missile: 'bullet',
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
  drifterHit: 'impact',
  lancerHit: 'impact',
  weaverHit: 'impact',
  turretHit: 'impact',
  chargerHit: 'impact',
  wardenHit: 'impact',
  spinnerHit: 'impact',
  sowerHit: 'impact',
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
  // Fragments are the impact itself, so they are the impact ink; they carry no identity of their own.
  debris: 'impact',
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
    ⚠️ **The PLAYER's ink, because the thing it marks is the player's box and nothing else's.**
    Enemies, bullets and pickups all cross this line freely — `src/sim/flight.ts` clamps the ship and
    only the ship — so drawing it in the enemy ink or a neutral one would say *a wall* when what is
    true is *your limit*. `docs/decisions/0074-the-box-is-drawn.md`.
  */
  bound: 'player',
};

/*
  ══ THE INTERIOR ═════════════════════════════════════════════════════════════════════════════════

  ⚠️ **ONE INK PER SPRITE WAS THE ART CEILING, AND IT WAS STRUCTURAL RATHER THAN A MATTER OF TASTE** —
  `reports/where-the-art-ceiling-is-2026-08-14.md`, and `docs/decisions/0149-a-hull-has-an-interior.md`
  is the change. `drawKind` set ONE `fillStyle` and ended every arm at a single fill, so a hull could
  not have a cockpit, a vent, a gun port or a lit core: there was nowhere for a second colour to come
  from. The silhouettes were never the placeholder. The fill was.

  ⚠️ **`space`, AND THE TWO OBVIOUS CHOICES ARE BOTH WRONG.** `impact` is the hit-flash ink, so a
  permanently impact-coloured core would muddy the one piece of feedback
  `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` exists for; `hazard` means *this
  will hurt you*. `space` means nothing, which is exactly what decoration should mean —
  `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` is about
  what the player must TELL APART, and a vent is not one of those things.

  ⚠️ **AND IT ADDS NO CONTRAST PAIR, WHICH IS A DIFFERENT CLAIM FROM THE REPORT'S.**
  `reports/where-the-art-ceiling-is-2026-08-14.md` credits `tests/themes.test.ts` with holding this;
  that file explicitly SKIPS `space` — `if (ink === 'space' || ink === 'sky') continue`, because its
  subject is a backdrop and space is what a backdrop is measured against. The guard that actually
  applies is `tests/palette.test.ts`'s *every ink is legible against space*, and it applies because an
  accent is never drawn on the backdrop: it sits on the hull, so its pair is `space` against the
  hull's own ink — **the outline's pair, already on screen around every sprite in the game.** No
  palette moves and no new contrast is asked for.

  ⚠️ **IT IS NOT AN `evenodd` HOLE.** A hole is transparent and shows the sky through it; this is
  opaque void painted over the hull. Both are wanted, for different pictures, and the accents below
  are deliberately kept off the holes the hulls already have — `boss3`'s lattice, `boss5`'s ports,
  `boss7`'s ring — because filling one in would take a hole away rather than add a mark.

  ⚠️ **IT COSTS NOTHING AT RUNTIME.** It is the same bitmap, so the same blit:
  `docs/decisions/0022-frame-rate-is-a-feature.md` and
  `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` count draw calls and allocations,
  not path segments, and this file is on `tests/budget.test.ts`'s deliberately-cold list.
*/

/** One piece of an accent, in fractions of the hull radius `r`, measured from the sprite's centre. */
/**
 * ⚠️ **`ink` IS OPTIONAL AND ITS ABSENCE IS `space`** —
 * `docs/decisions/0194-a-hull-has-a-livery.md`. Every accent authored under
 * `docs/decisions/0149-a-hull-has-an-interior.md` omits it and is therefore **bit-identical** to what
 * it baked before: one path, one `evenodd` fill, one hole. What the field buys is a mark that is a
 * COCKPIT rather than a hole, without a second mechanism, a second containment rule or a second
 * bounds guard — `tests/accents.test.ts` is written over the shapes and does not care what colour
 * they are.
 */
export type AccentShape =
  | {
      readonly kind: 'poly';
      readonly points: readonly (readonly [number, number])[];
      readonly ink?: DecorInk | 'space';
    }
  | {
      readonly kind: 'disc';
      readonly x: number;
      readonly y: number;
      readonly r: number;
      readonly ink?: DecorInk | 'space';
    };

/**
 * The interior of one hull: shapes filled in `palette.space` over the hull, inside the same bitmap.
 *
 * ⚠️ **In units of `r` rather than pixels**, for the reason every other number in this file is a
 * fraction of `size`: a bake at any resolution has to be the same picture, so a high-DPI re-bake is
 * not a second set of art.
 */
export type Accent = readonly AccentShape[];

/** A rectangular mark: a keel, a spine, a streak, an armour band. Corners in `r` from the centre. */
const box = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ink?: DecorInk | 'space',
): AccentShape => ({
  kind: 'poly',
  points: [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ],
  ...(ink === undefined ? {} : { ink }),
});

/** A round mark: a cockpit, a node, an eye, a pupil. */
const dot = (x: number, y: number, r: number): AccentShape => ({ kind: 'disc', x, y, r });

/*
  ── THE NUMBERS, AND WHAT HOLDS THEM ───────────────────────────────────────────────────────────

  ⚠️ **EVERY ONE OF THESE IS A CLAIM ABOUT WHERE THE HULL IS SOLID, AND A HAND CANNOT CHECK IT.**
  The hulls are drawn imperatively a few hundred lines below, three of them are filled `evenodd` with
  holes in them, and `boss6` is three overlapping circles and a bar whose overlaps CANCEL — so
  *is this point on the hull* is arithmetic, not a look at the file. `tests/accents.test.ts` traces
  the real drawing and answers it, in CSS pixels of the screen the play-tests are given on;
  `scripts/probes/0149-a-hull-has-an-interior.mjs` is what says that guard fires.
*/

/** A cockpit behind the notched prow, then a keel back to the stern. The hull's own solidity. */
const BOSS_KEEL: Accent = [dot(-0.3, 0, 0.14), box(-0.1, -0.1, 0.78, 0.1)];

/** The spine, and the roots of the two outer prongs sitting on it. The hull's own openness. */
const BOSS2_SPINE: Accent = [box(-0.15, -0.09, 0.85, 0.09), dot(-0.05, -0.45, 0.11), dot(-0.05, 0.45, 0.11)];

/** A node in each of the four struts, off the hole rather than over it. The hull as a frame. */
const BOSS3_NODES: Accent = [
  dot(0.38, -0.32, 0.09),
  dot(0.38, 0.32, 0.09),
  dot(-0.38, -0.32, 0.09),
  dot(-0.38, 0.32, 0.09),
];

/** Three streaks along the body, which is the one hull that reads as moving while it stands still. */
const BOSS4_STREAKS: Accent = [
  box(-0.35, -0.36, 0.45, -0.24),
  box(-0.35, -0.06, 0.45, 0.06),
  box(-0.35, 0.24, 0.45, 0.36),
];

/** Two bands across the slab, forward of the ports rather than through them. The hull as a wall. */
const BOSS5_BANDS: Accent = [box(-0.62, -0.78, -0.46, 0.78), box(-0.3, -0.78, -0.14, 0.78)];

/** An eye in each lobe, all three on the player's side. Three things that turned out to be one. */
const BOSS6_EYES: Accent = [dot(-0.46, -0.62, 0.095), dot(-0.46, 0, 0.095), dot(-0.46, 0.62, 0.095)];

/** A pupil in the core, and four marks around the outer ring. The one round hull, looking back. */
const BOSS7_EYE: Accent = [
  dot(0, 0, 0.16),
  dot(0.83, 0, 0.095),
  dot(-0.83, 0, 0.095),
  dot(0, -0.83, 0.095),
  dot(0, 0.83, 0.095),
];

/**
 * Which kinds have an interior, and what it is.
 *
 * ⚠️ **A `Record` OVER THE WHOLE UNION RATHER THAN A SPARSE MAP, AND THAT IS NOT CEREMONY** — the
 * defect this table is written next to is a table that said nothing. Five bosses shipped with no hit
 * interaction at all because `boss3Hit` through `boss7Hit` were authored beside their own hulls and
 * inherited the wrong ink, and a MISSING entry is a type error while a wrong one is not
 * (`tests/legibility.test.ts` carries the post-mortem). Keyed on `SpriteKind`, an eighth boss cannot
 * be added without someone writing down whether it has an interior — which is
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`'s whole claim, and the reason the forty-four
 * `null`s below are the guard rather than noise.
 *
 * ⚠️ **THE SEVEN BOSSES ONLY, AND THAT IS THE SCOPE ON PURPOSE.** A boss is 26 to 38 world units —
 * four to six times anything else on screen — which is the same licence `drawKind` already gives
 * their silhouettes for being complicated. An enemy is five to nine units and an interior on one is
 * mush; `reports/enemy-silhouettes-2026-08-05.md` measured what survives twenty pixels and it was
 * outlines, not detail. The day an enemy earns one, it is a row here and nothing else moves.
 */

/*
  ── THE LIVERIES — 0194 ─────────────────────────────────────────────────────────────────────────

  ⚠️ **ASKED FOR:** *"I want fun quirky graphics like we have in The Far Carry for the spaceships and
  weapons."* The predecessor's `src/render/shipArt.ts` builds every craft from
  `{ body, glass, flame, accent }` — a body colour, a windscreen, an exhaust and a trim stripe — and
  that is the whole of why its fleet reads as characterful where one flat ink does not. **Opened for a
  named reason and one named file**, per `CLAUDE.md`.

  ⚠️ **WHAT DOES NOT CROSS IS THE EXHAUST HANGING OFF THE BACK.** Every mark here is INSIDE the hull,
  because `docs/decisions/0149-a-hull-has-an-interior.md` makes the silhouette's outer bounds what
  collision, the extents and 0101's screen share are all written against. A flame trailing behind the
  ship would grow the box. What stands in for it is an engine core forward of the tail notch.
*/

/** The player's wedge: a keel down the spine, a canopy on it, and an engine core behind that. */
const SHIP_LIVERY: Accent = [
  box(0.06, -0.075, 0.48, 0.075, 'trim'),
  { kind: 'disc', x: 0.2, y: 0, r: 0.18, ink: 'glass' },
  box(-0.18, -0.115, 0.02, 0.115, 'flame'),
];

/*
  ⚠️ **A TIER ADDS AN ENGINE, WHICH IS THE ONE THING THAT GROWS WITH THE LADDER.** 0081's rule for
  these three hulls is *the same ship, further along* — the nose is untouched at every tier and the
  fins are what change. The livery follows that: same keel, same canopy, one more core.
*/
const SHIP_MK2_LIVERY: Accent = [
  ...SHIP_LIVERY,
  /*
    ⚠️ **ON THE CENTRELINE, BECAUSE THE FINS CUT HOLES EITHER SIDE OF IT.** `drawFins` adds its pair
    as separate sub-paths filled `evenodd` WITH the wedge, so wherever a fin overlaps the hull the
    two cancel and the result is a gap the sky shows through. A tier mark outboard of the keel was
    measured at **−1.34 px** — over a hole rather than over ink — which is exactly the distinction
    `clearance` samples a grid to catch.

    ⚠️ **AND FORWARD RATHER THAN AFT, BECAUSE THE WAIST NOTCH IS THE OTHER TIGHT SPOT.** The wedge is
    concave at `W(-0.3, 0)`; a mark on the spine behind the canopy measured **1.48 px** from that
    vertex, which is 0.07 of the hull radius. Forward of the canopy the hull is solid and the only
    edge is the nose.
  */
  { kind: 'disc', x: 0.46, y: 0, r: 0.1, ink: 'glass' },
];

const SHIP_MK3_LIVERY: Accent = [
  ...SHIP_MK2_LIVERY,
  box(0.02, -0.22, 0.16, -0.08, 'trim'),
  box(0.02, 0.08, 0.16, 0.22, 'trim'),
];

/** The bomb: a lit core inside a casing, which is what a thing about to go off looks like. */
const BOMB_LIVERY: Accent = [
  { kind: 'disc', x: 0, y: 0.06, r: 0.3, ink: 'glass' },
  { kind: 'disc', x: 0, y: 0.06, r: 0.14, ink: 'flame' },
];

/** The weapon pickup's arrow: a shaft down the middle and a lit head. */
const PICKUP_WEAPON_LIVERY: Accent = [
  box(-0.08, -0.085, 0.35, 0.085, 'trim'),
  { kind: 'disc', x: 0.14, y: 0, r: 0.18, ink: 'glass' },
];

/** The missile pickup's chevron, marked the way its own arrow points. */
const PICKUP_MISSILE_LIVERY: Accent = [
  box(-0.09, -0.5, 0.09, 0.05, 'trim'),
  { kind: 'disc', x: 0, y: -0.28, r: 0.17, ink: 'glass' },
];

/** The shield pickup: a band across the face and a boss at its centre. */
const PICKUP_SHIELD_LIVERY: Accent = [
  box(-0.5, -0.34, 0.5, -0.155, 'trim'),
  { kind: 'disc', x: 0, y: 0.1, r: 0.22, ink: 'glass' },
];

export const ACCENT_OF: Record<SpriteKind, Accent | null> = {
  /*
    ── THE SEVEN INTERIORS ─────────────────────────────────────────────────────────────────────────

    Each says the same thing its hull already says, louder. Not a new idea per boss — the hulls are
    seven ideas already and a second one laid over the first is two objects, which is the failure the
    HURT SILHOUETTES block below is written about from the other direction.

    ⚠️ **What each mark IS is written once, on the constant above, and not again here.** Two prose
    descriptions of one drawing is the second copy `docs/decisions/0029-the-tracked-record-is-the-record.md`
    is about, and this table is where a reader would come to edit the numbers.

    ⚠️ **A hull and its hurt sprite share an accent, exactly as they share a `case` arm.** The accent
    is in `space` either way, so what changes when a boss is hit is the hull ink around it — the flash
    still reads as *that thing being hurt* rather than as a second object appearing.
  */

  boss: BOSS_KEEL,
  bossHit: BOSS_KEEL,
  boss2: BOSS2_SPINE,
  boss2Hit: BOSS2_SPINE,
  boss3: BOSS3_NODES,
  boss3Hit: BOSS3_NODES,
  boss4: BOSS4_STREAKS,
  boss4Hit: BOSS4_STREAKS,
  boss5: BOSS5_BANDS,
  boss5Hit: BOSS5_BANDS,
  boss6: BOSS6_EYES,
  boss6Hit: BOSS6_EYES,
  boss7: BOSS7_EYE,
  boss7Hit: BOSS7_EYE,

  /*
    ── AND EVERYTHING ELSE, WHICH IS FORTY-FOUR KINDS AND ONE REASON ───────────────────────────────

    Too small for an interior, or not a body at all. The ships, the eight enemies and their hurt
    silhouettes are five to nine world units; the bullets, the pickups, the blasts and the debris are
    smaller again; the sky, the nebula and the box edge return before the fill this rides on. Each
    would be a mark under a pixel at the size it ships, which
    `docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md` is the whole of.
  */
  ship: SHIP_LIVERY,
  shipHit: SHIP_LIVERY,
  shipMk2: SHIP_MK2_LIVERY,
  shipMk2Hit: SHIP_MK2_LIVERY,
  shipMk3: SHIP_MK3_LIVERY,
  shipMk3Hit: SHIP_MK3_LIVERY,
  drifter: null,
  drifterHit: null,
  lancer: null,
  lancerHit: null,
  weaver: null,
  weaverHit: null,
  turret: null,
  turretHit: null,
  charger: null,
  chargerHit: null,
  warden: null,
  wardenHit: null,
  spinner: null,
  spinnerHit: null,
  sower: null,
  sowerHit: null,
  bullet: null,
  spit: null,
  lance: null,
  flak: null,
  missile: null,
  bomb: BOMB_LIVERY,
  blast: null,
  blastHalf: null,
  blastWide: null,
  blastWidest: null,
  shieldOrb: null,
  debris: null,
  lifeIcon: null,
  pickupWeapon: PICKUP_WEAPON_LIVERY,
  pickupMissile: PICKUP_MISSILE_LIVERY,
  pickupShield: PICKUP_SHIELD_LIVERY,
  pickupBomb: BOMB_LIVERY,
  skyFar: null,
  skyNear: null,
  skyRush: null,
  skyNebula: null,
  bound: null,
};

/**
 * Draw one kind into a square canvas, pointing along +x, filling most of it.
 *
 * Everything is expressed as a fraction of `size` so a bake at any resolution is the same picture —
 * which is what lets the atlas be re-baked larger on a high-DPI screen without a second set of art.
 */
export function drawKind(
  ctx: Pen,
  kind: SpriteKind,
  palette: Palette,
  size: number,
  theme: ThemeKind = 'approach',
): void {
  const half = size / 2;
  const r = size * 0.42;
  ctx.fillStyle = palette[INK_OF[kind]];
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.beginPath();
  switch (kind) {
    case 'ship':
    case 'shipHit':
      // A wedge, nose towards +x. One shape, two inks — see `INK_OF`.
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.7, half - r * 0.8);
      ctx.lineTo(half - r * 0.3, half);
      ctx.lineTo(half - r * 0.7, half + r * 0.8);
      ctx.closePath();
      break;
    /*
      ── THE SAME WEDGE, WITH MORE OF IT — 0081 ──────────────────────────────────────────────────

      Each tier keeps the hull above and adds a pair of swept fins outside it, so what the player
      reads is *the same ship, further along* rather than *a different ship*. The fins are drawn as
      separate sub-paths and filled `evenodd` with the hull, exactly as every holed silhouette in this
      file is — they are outside the wedge, so they add to it rather than cutting into it.

      ⚠️ **The nose is untouched at every tier.** It is the one part of this silhouette the player
      aims with, and it is what makes the three read as one object.
    */
    case 'shipMk2':
    case 'shipMk2Hit':
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.7, half - r * 0.8);
      ctx.lineTo(half - r * 0.3, half);
      ctx.lineTo(half - r * 0.7, half + r * 0.8);
      ctx.closePath();
      drawFins(ctx, half, r, 0.62);
      break;
    case 'shipMk3':
    case 'shipMk3Hit':
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.7, half - r * 0.8);
      ctx.lineTo(half - r * 0.3, half);
      ctx.lineTo(half - r * 0.7, half + r * 0.8);
      ctx.closePath();
      drawFins(ctx, half, r, 0.62);
      drawFins(ctx, half, r, 0.95);
      break;
    case 'drifter':
    case 'drifterHit':
      // A diamond: symmetrical, pointing nowhere, which is exactly what a drifter does. It holds its
      // line and never fires, and the silhouette says so by having no front.
      ctx.moveTo(half - r, half);
      ctx.lineTo(half, half - r);
      ctx.lineTo(half + r, half);
      ctx.lineTo(half, half + r);
      ctx.closePath();
      break;
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
      break;
    case 'weaver':
    case 'weaverHit':
      /*
        A BAR, long across the lane and thin along it — a line lying perpendicular to the way it
        travels. Nothing else in the game is a rectangle, and orientation is the cue that tells it
        from the charger's needle, which is the same primitive lying the other way.
      */
      ctx.rect(half - r * 0.22, half - r, r * 0.44, r * 2);
      break;
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
      break;
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
      break;
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
      break;
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
      break;
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
      break;
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
      break;
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
      break;
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
      break;
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
      break;
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
      break;
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
      break;
    case 'boss7':
    case 'boss7Hit':
      // AN AXIS: a ringed eye. The biggest hull in the game and the only round one, because the last
      // boss of the authored run should be the one shape nothing else in it shares.
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.66, half);
      ctx.arc(half, half, r * 0.66, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.3, half);
      ctx.arc(half, half, r * 0.3, 0, Math.PI * 2);
      break;
    case 'bullet':
      ctx.arc(half, half, r * 0.8, 0, Math.PI * 2);
      break;
    case 'spit':
      /*
        A SQUARE — corners against the pulse's disc, and the last primitive left that survives fifteen
        pixels (0081). Axis-aligned rather than turned, because a square turned 45° is the drifter's
        diamond and the two would read alike the moment either was small.
      */
      ctx.rect(half - r * 0.72, half - r * 0.72, r * 1.44, r * 1.44);
      break;
    case 'lance':
      /*
        A DASH: a bar lying ALONG the way it travels, twice as long as it is deep — 0098. The lancer's
        shot is the quick one, and a mark stretched along its own path is what motion looks like
        standing still, which is the same reasoning `skyRush` rests on one file-section down.

        It is not the weaver's bar: that one lies across the lane and is an enemy hull five times the
        size. It is not the charger's needle either, which is a triangle with a nose.
      */
      ctx.rect(half - r, half - r * 0.34, r * 2, r * 0.68);
      break;
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
      break;
    case 'debris':
      // A shard: small, angular, and deliberately NOT a disc, so a fragment is never mistaken for a
      // bullet at the one moment the screen is busiest.
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.4, half - r * 0.8);
      ctx.lineTo(half - r, half + r * 0.2);
      ctx.closePath();
      break;
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
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.2, half - r * 0.85);
      ctx.lineTo(half - r, half - r * 0.85);
      ctx.lineTo(half - r * 0.25, half);
      ctx.lineTo(half - r, half + r * 0.85);
      ctx.lineTo(half - r * 0.2, half + r * 0.85);
      ctx.closePath();
      break;
    }
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
      ctx.moveTo(half, half - r);
      ctx.lineTo(half + r * 0.85, half + r * 0.2);
      ctx.lineTo(half + r * 0.85, half + r);
      ctx.lineTo(half, half + r * 0.25);
      ctx.lineTo(half - r * 0.85, half + r);
      ctx.lineTo(half - r * 0.85, half + r * 0.2);
      ctx.closePath();
      break;
    }
    case 'missile':
      /*
        A dart: a long point forward, a notched tail. The notch is what keeps it from reading as a
        triangle at twenty pixels — the same lesson the lancer's silhouette cost.
      */
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.4, half - r * 0.55);
      ctx.lineTo(half - r, half - r * 0.2);
      ctx.lineTo(half - r * 0.75, half);
      ctx.lineTo(half - r, half + r * 0.2);
      ctx.lineTo(half - r * 0.4, half + r * 0.55);
      ctx.closePath();
      break;
    /*
      ⚠️ **ONE DRAWING, TWO KINDS, AND IT IS THE ONLY SHARED SILHOUETTE OUTSIDE THE PYRE'S RUNGS.**
      `bomb` is what leaves the ship; `pickupBomb` is what is lying in the lane waiting to be
      collected (0082). They are baked at different extents and in different inks — the family map
      above is what separates them — and sharing the path is the point rather than a saving: a player
      learns the notched disc from the trigger strip long before they find one, so *the thing on the
      ground is the thing on the button* costs no teaching at all.
    */
    case 'pickupBomb':
    case 'bomb':
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
      ctx.arc(half, half, r * 0.6, Math.PI * 1.35, Math.PI * 1.65, true);
      ctx.lineTo(half, half - r);
      ctx.closePath();
      break;
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
      break;
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
      ctx.moveTo(half + r * 0.85, half - r);
      ctx.lineTo(half + r * 0.85, half + r * 0.25);
      ctx.lineTo(half, half + r);
      ctx.lineTo(half - r * 0.85, half + r * 0.25);
      ctx.lineTo(half - r * 0.85, half - r);
      ctx.closePath();
      break;
    }
    case 'shieldOrb':
      /*
        A ring. Two circles wound the same way and filled `evenodd`, which is how the hole survives
        being two pixels across.
      */
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.moveTo(half + r * 0.45, half);
      ctx.arc(half, half, r * 0.45, 0, Math.PI * 2);
      break;
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
    case 'skyNebula':
      /*
        ⚠️ **Baked in the palette's own sky ink, and a level replaces it** — 0112. `bakeNebula` writes
        the theme's colour over this bitmap at a level boundary; what is here is what the weather looks
        like on the title screen and on any level that has not said otherwise, so the layer is never
        missing and never a hole in the atlas.
      */
      drawNebula(ctx, palette.sky, size, theme);
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
  ctx.fill('evenodd');
  ctx.stroke();
  /*
    ── THE SECOND PASS ─────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE HULL IS FINISHED BEFORE THIS RUNS, AND THAT ORDER IS THE WHOLE MECHANISM.** The fill and
    the stroke above are the silhouette; what follows is opaque `space` laid over it, so nothing here
    can move the outer bounds, the collision box or
    `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`'s screen share. Drawn into the
    same path, or before the stroke, it would be part of the outline instead of inside it.

    ⚠️ **`ctx.clip()` WOULD MAKE THIS TRUE BY CONSTRUCTION AND IS DELIBERATELY NOT USED.** A clip to
    the hull cannot be broken on purpose, so a guard over it could never be seen to fail —
    `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` says that is a guard nobody has the right to
    trust. Containment is a claim about the numbers in `ACCENT_OF`, held by `tests/accents.test.ts`
    and proved red by `scripts/probes/0149-a-hull-has-an-interior.mjs`.

    ⚠️ **`evenodd` again, so an accent may have a hole in it too** — and so two overlapping shapes in
    one accent cancel rather than merge, which is the same rule the hulls are filled under and one
    fewer thing for a reader of this file to hold.
  */
  const accent = ACCENT_OF[kind];
  if (accent === null) return;
  /*
    ── ONE PATH PER INK, IN THE ORDER THE INKS ARE LISTED — 0194 ─────────────────────────────────

    ⚠️ **A SINGLE `evenodd` FILL PER INK RATHER THAN PER ACCENT, WHICH IS WHY THE ORDER IS FIXED
    AND NOT THE TABLE'S.** `evenodd` cancels overlapping sub-paths inside ONE fill; grouping by ink
    keeps that true within a colour and lets two colours overlap normally, which is what a canopy
    sitting on a trim line has to do. Every 0149 accent names no ink, so it lands in the `space`
    group alone and is drawn by exactly the code that drew it before.

    ⚠️ **THE LOOP IS OVER A CONSTANT LIST AND ALLOCATES NOTHING PER SHAPE**, because this runs inside
    the bake and `docs/decisions/0022-frame-rate-is-a-feature.md` counts allocations — the bake is not
    the frame loop, but a per-shape array here would be the habit arriving one file away from where it
    is banned.
  */
  for (const layer of ACCENT_INK_ORDER) {
  let drew = false;
  ctx.fillStyle = palette[layer];
  ctx.beginPath();
  for (const shape of accent) {
    if ((shape.ink ?? 'space') !== layer) continue;
    drew = true;
    switch (shape.kind) {
      case 'poly': {
        let first = true;
        for (const [x, y] of shape.points) {
          if (first) ctx.moveTo(half + x * r, half + y * r);
          else ctx.lineTo(half + x * r, half + y * r);
          first = false;
        }
        ctx.closePath();
        break;
      }
      case 'disc':
        // The `moveTo` is the arc's own start point, so the sub-path opens there rather than being
        // joined to the last one by a stray line — the same pairing every ring in this file uses.
        ctx.moveTo(half + (shape.x + shape.r) * r, half + shape.y * r);
        ctx.arc(half + shape.x * r, half + shape.y * r, shape.r * r, 0, Math.PI * 2);
        break;
      default: {
        const never: never = shape;
        throw new Error(`unbaked accent shape: ${JSON.stringify(never)}`);
      }
    }
  }
  if (drew) ctx.fill('evenodd');
  }
}

/**
 * The order livery inks are laid down in, void first.
 *
 * ⚠️ **A CLOSED LIST AND NOT `Object.keys`**, so the day a fourth decorative ink is added somebody
 * has to decide where in the stack it goes rather than inheriting whatever order a record happened to
 * iterate in. `space` is first because it is a hole: anything painted after it sits ON the hull
 * rather than in the gap.
 *
 * ⚠️ **`trim` IS LAST, AND IT WAS SECOND UNTIL THE SHEET SAID SO.** With the keel painted before the
 * canopy and the engine core, the sheet measured **ten pixels of `trim` on the whole ship** — the
 * spine was drawn and then covered by the two marks sitting on it, so a mark that passed every
 * thickness and clearance guard was invisible in the picture. A panel line is the thing you paint ON
 * a hull last, over the canopy frame, which is also what makes it read as a panel line.
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` — and the instrument that caught it is
 * two decisions old.
 */
const ACCENT_INK_ORDER: readonly ('space' | DecorInk)[] = ['space', 'glass', 'flame', 'trim'];

/**
 * A mirrored pair of swept fins at `spanY` of the hull's radius, trailing towards −x.
 *
 * ⚠️ **A helper rather than the same six lines twice, and it is the only one in this file** — the
 * upgraded hulls differ from each other by *how many pairs*, so writing the pair out per tier would
 * make *another pair* a copy-paste rather than a call. `drawKind` stays the place that says which
 * shape a kind is; this says what one piece of that shape is.
 *
 * `bake.ts` is on `tests/budget.test.ts`'s deliberately-cold list, so a call per bake costs nothing.
 */
function drawFins(ctx: Pen, half: number, r: number, spanY: number): void {
  for (const side of [-1, 1]) {
    ctx.moveTo(half - r * 0.15, half + r * spanY * side * 0.55);
    ctx.lineTo(half + r * 0.1, half + r * spanY * side);
    ctx.lineTo(half - r * 0.62, half + r * spanY * side);
    ctx.lineTo(half - r * 0.78, half + r * spanY * side * 0.5);
    ctx.closePath();
  }
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
      ⚠️ **A cloud may hang off the tile's edge, which is the opposite of every other sky field's
      rule.** A MARK cut by a seam is a hard edge arriving on a schedule; a gradient cut by one is
      already down at a fraction of its own alpha out there, and the tile repeats — so what the player
      sees is the same cloud continuing. There is no margin here on purpose.
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
function drawNebula(ctx: Pen, colour: string, size: number, theme: ThemeKind): void {
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
    const fill = ctx.createRadialGradient(cloud.fx, cloud.fy, 0, cloud.x, cloud.y, cloud.r);
    fill.addColorStop(0, colour);
    fill.addColorStop(1, 'transparent');
    ctx.globalAlpha = cloud.alpha;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
  }
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
export function cloudCover(size: number, theme: ThemeKind, step = 4): number {
  const clouds = nebulaField(size, theme);
  const at = (x: number, y: number): number => {
    let cover = 0;
    for (const cloud of clouds) {
      const d = Math.hypot(x - cloud.x, y - cloud.y);
      if (d < cloud.r) cover = 1 - (1 - cover) * (1 - cloud.alpha * (1 - d / cloud.r));
    }
    return cover;
  };
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

export function bakeNebula(atlas: Atlas, colour: string, pixelsPerUnit: number, theme: ThemeKind = 'approach'): void {
  const size = bakeSize(SPRITE_EXTENT.skyNebula, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  drawNebula(ctx, colour, size, theme);
  (atlas.bitmaps as CanvasImageSource[])[SPRITE.skyNebula] = canvas;
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

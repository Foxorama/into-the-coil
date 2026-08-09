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

import type { Palette } from '../content/palette.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../content/sprites.ts';
import { makeRng } from '../sim/rng.ts';

/** Side profile for a horizontally scrolling screen, top-down for a vertical one. */
export type SpriteView = 'side' | 'top';

export interface Atlas {
  readonly view: SpriteView;
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
export function atlasIsStale(atlas: Atlas, view: SpriteView, pixelsPerUnit: number): boolean {
  if (atlas.view !== view) return true;
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
const SKY_STARS = { skyFar: 90, skyNear: 90 };

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
 */
const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.2 };

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
 */
const SKY_ALPHA = { skyFar: 1, skyNear: 0.18 };

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
  boss: 'enemy',
  boss2: 'enemy',
  boss3: 'enemy',
  boss3Hit: 'enemy',
  boss4: 'enemy',
  boss4Hit: 'enemy',
  boss5: 'enemy',
  boss5Hit: 'enemy',
  boss6: 'enemy',
  boss6Hit: 'enemy',
  boss7: 'enemy',
  boss7Hit: 'enemy',
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
  bossHit: 'impact',
  boss2Hit: 'impact',
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
  /*
    ⚠️ **The PLAYER's ink, because the thing it marks is the player's box and nothing else's.**
    Enemies, bullets and pickups all cross this line freely — `src/sim/flight.ts` clamps the ship and
    only the ship — so drawing it in the enemy ink or a neutral one would say *a wall* when what is
    true is *your limit*. `docs/decisions/0074-the-box-is-drawn.md`.
  */
  bound: 'player',
};

/**
 * Draw one kind into a square canvas, pointing along +x, filling most of it.
 *
 * Everything is expressed as a fraction of `size` so a bake at any resolution is the same picture —
 * which is what lets the atlas be re-baked larger on a high-DPI screen without a second set of art.
 */
function drawKind(ctx: CanvasRenderingContext2D, kind: SpriteKind, palette: Palette, size: number): void {
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
      drawSky(ctx, kind, size);
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
}

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
function drawFins(ctx: CanvasRenderingContext2D, half: number, r: number, spanY: number): void {
  for (const side of [-1, 1]) {
    ctx.moveTo(half - r * 0.15, half + r * spanY * side * 0.55);
    ctx.lineTo(half + r * 0.1, half + r * spanY * side);
    ctx.lineTo(half - r * 0.62, half + r * spanY * side);
    ctx.lineTo(half - r * 0.78, half + r * spanY * side * 0.5);
    ctx.closePath();
  }
}

/** One star, in tile pixels: where it goes and how big it is. */
export interface SkyStar {
  x: number;
  y: number;
  /** Radius, in pixels of a tile `size` across. */
  r: number;
}

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
export function skyField(kind: 'skyFar' | 'skyNear', size: number): { alpha: number; stars: SkyStar[] } {
  // @setup: one generator per bake, and its own stream so a star cannot move a spawn.
  const rng = makeRng('sky').stream(kind);
  const margin = size * 0.06;
  const span = size - margin * 2;
  /*
    ⚠️ **World units converted to tile pixels HERE, and the constant stays a world quantity.** The
    tile is `SPRITE_EXTENT[kind]` units across, so `size / extent` is its pixels per unit — and
    `SKY_MAX_STAR_UNITS` can then be read against `SHOTS.pulse.radius` by a person and by a test.
  */
  const biggest = (size / SPRITE_EXTENT[kind]) * SKY_MAX_STAR_UNITS[kind];
  const stars: SkyStar[] = [];
  for (let i = 0; i < SKY_STARS[kind]; i++) {
    stars.push({ x: margin + rng.range(0, span), y: margin + rng.range(0, span), r: biggest * rng.range(0.5, 1) });
  }
  return { alpha: SKY_ALPHA[kind], stars };
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
function drawSky(ctx: CanvasRenderingContext2D, kind: 'skyFar' | 'skyNear', size: number): void {
  const field = skyField(kind, size);
  ctx.globalAlpha = field.alpha;
  for (const star of field.stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** One sprite, drawn into its own offscreen canvas at the resolution it will be blitted at. */
function bakeOne(kind: SpriteKind, palette: Palette, view: SpriteView, pixelsPerUnit: number): HTMLCanvasElement {
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
  drawKind(ctx, kind, palette, size);
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
export function bakeAtlas(palette: Palette, view: SpriteView, pixelsPerUnit: number): Atlas {
  return {
    view,
    bitmaps: SPRITE_KINDS.map((kind) => bakeOne(kind, palette, view, pixelsPerUnit)),
    extents: SPRITE_KINDS.map((kind) => SPRITE_EXTENT[kind]),
    pixelsPerUnit,
  };
}

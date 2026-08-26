/**
 * The frame budget, counted rather than timed.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` promised this guard would land in the same commit
 * as the rAF loop, proved against a deliberately over-populated scene.
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` is what it turned into.
 *
 * ── WHY NOTHING HERE IS A STOPWATCH ─────────────────────────────────────────────────────────────
 *
 * A millisecond assertion in CI is calibrated against nothing. The runner is not a 2021 mid-range
 * Android, runner hardware varies between jobs, and the result fails on a busy afternoon and passes
 * on a broken commit. So the assertions are on **draw calls** and on **allocation**, both of which
 * are deterministic and neither of which is a proxy: a blit is the cost, not a stand-in for it.
 *
 * ── THE TWO HALVES, AND WHY NEITHER IS ENOUGH ALONE ─────────────────────────────────────────────
 *
 * The RUNTIME half runs the real painter over the worst-case scene and counts what it did. It cannot
 * see an allocation — a `.map()` in a hot loop produces exactly the right pixels.
 *
 * The SOURCE half scans the hot files for the syntax that allocates. It cannot see a loop that draws
 * twice. Together they cover both; either alone reads as thorough and is half a guard.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { advance, makeClock } from '../src/app/loop.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { type Entity, makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import { paintScene } from '../src/render/scene.ts';
import { bakeSize, nebulaField, skyField, type SkyKind } from '../src/render/bake.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import type { Surface } from '../src/render/surface.ts';
import { sprite } from './bodies.ts';
import { CAPACITY, SKY } from '../src/app/mount.ts';
import { BURST } from '../src/content/debris.ts';
import { MAX_SHIELDS } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/**
 * The worst-case scene, as data rather than as a feeling — 0022's number.
 * ~150 enemy bullets, ~80 player projectiles, ~40 enemies, ~200 particles.
 */
const WORST_CASE = 500;

/** Long enough that anything accumulating per frame has visibly accumulated. Ten seconds of play. */
const FRAMES = 600;

/** A `Surface` that draws nothing and counts everything. The instrument, not a stand-in for one. */
class CountingSurface implements Surface {
  blits = 0;
  clears = 0;
  clear(): void {
    this.clears++;
  }
  blit(_sprite: number, x: number, y: number, _scale: number): void {
    this.blits++;
    // A NaN reaching a real canvas silently draws nothing, so the counting surface refuses it here
    // rather than letting a blank frame pass as a full one.
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`blit at a non-finite point: ${x}, ${y}`);
  }
}

/**
 * A `Surface` that records the leftmost and rightmost edge anything was drawn at.
 *
 * ⚠️ **Edges rather than centres**, because a tile is drawn centred and what matters is whether the
 * COVERAGE reaches the edge of the view. A guard on centres would pass with the screen half bare.
 */
class SpanSurface implements Surface {
  left = Number.POSITIVE_INFINITY;
  right = Number.NEGATIVE_INFINITY;
  clear(): void {}
  blit(sprite: number, x: number, _y: number, scale: number): void {
    const half = (SPRITE_EXTENT[SPRITE_KINDS[sprite]!] * scale) / 2;
    if (x - half < this.left) this.left = x - half;
    if (x + half > this.right) this.right = x + half;
  }
}

function fullPool(): Pool<Entity> {
  const pool = new Pool<Entity>(WORST_CASE, makeEntity);
  for (let i = 0; i < WORST_CASE; i++) {
    const e = pool.spawn()!;
    reset(e, 1000 + i, (i * 7) % ACROSS_SPAN, sprite(i % 16));
    e.velAlong = -0.5;
  }
  return pool;
}

describe('the worst-case scene costs one blit per entity, and nothing else', () => {
  it('draws exactly one call per live entity, plus one clear', () => {
    const surface = new CountingSurface();
    const pool = fullPool();
    paintScene(surface, viewOf(1920, 1080), [pool], 900, 0.5);
    expect(surface.blits, 'the painter is doing more work per entity than a blit').toBe(WORST_CASE);
    expect(surface.clears).toBe(1);
  });

  it('costs the same per frame after ten seconds as it did on the first frame', () => {
    // The shape this catches: work that accumulates. A per-frame subscription, a growing list, a
    // painter that redraws its own history — all of them look correct on frame one.
    const surface = new CountingSurface();
    const view = viewOf(1920, 1080);
    const pool = fullPool();
    let previous = 0;
    for (let frame = 0; frame < FRAMES; frame++) {
      surface.blits = 0;
      paintScene(surface, view, [pool], 900, (frame % 60) / 60);
      if (frame > 0) expect(surface.blits, `frame ${frame} drew a different amount`).toBe(previous);
      previous = surface.blits;
    }
  });

  it('costs the same split across layers as it does in one pool', () => {
    /*
      The scene is drawn as several pools now, in a declared order (`src/app/frame.ts`). The cost
      must be a property of how many entities exist and not of how they are filed — a painter that
      cleared per layer, or blitted a layer twice, would look completely correct on screen.

      ⚠️ It also pins the CLEAR at one. Four layers is four chances to wipe the frame, and the three
      extra wipes would be invisible in a screenshot and would quadruple the most expensive single
      call the painter makes.
    */
    const one = new CountingSurface();
    const many = new CountingSurface();
    const view = viewOf(1920, 1080);
    paintScene(one, view, [fullPool()], 900, 0.5);

    const quarters: Pool<Entity>[] = [];
    for (let q = 0; q < 4; q++) {
      const pool = new Pool<Entity>(WORST_CASE / 4, makeEntity);
      for (let i = 0; i < WORST_CASE / 4; i++) {
        const e = pool.spawn()!;
        reset(e, 1000 + i, (i * 7) % ACROSS_SPAN, sprite(i % 16));
      }
      quarters.push(pool);
    }
    paintScene(many, view, quarters, 900, 0.5);

    expect(many.blits, 'splitting the scene into layers changed what it costs to draw').toBe(one.blits);
    expect(many.clears, 'each layer wiped the frame — the painter clears once, not once per pool').toBe(1);
  });

  it('holds in portrait too, at the same cost', () => {
    // Two orientations, one scene, one price — the difficulty parity of 0023 seen from the frame side.
    const pool = fullPool();
    const flat = new CountingSurface();
    const upright = new CountingSurface();
    paintScene(flat, viewOf(2400, 1080), [pool], 900, 0.25);
    paintScene(upright, viewOf(1080, 2400), [pool], 900, 0.25);
    expect(upright.blits).toBe(flat.blits);
  });
});

/**
 * THE SKY IS BAKED AND BLITTED, AND IT COSTS A FIXED HANDFUL OF CALLS.
 *
 * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`. Asked for in play: *"needs a starry
 * background or a background of some kind."*
 *
 * ⚠️ **The two things a background can do to a frame budget are grow with the camera and grow with
 * the screen**, and both are invisible on the machine it was written on: a wrapping tile drawn one
 * too many times on some frames costs a blit nobody notices, and a per-star draw costs nothing at
 * 1280×720 and everything on a phone with a full screen. Both are counted here.
 */
/**
 * THE SKY GOES PAST A THIRD FASTER THAN 0065 SHIPPED IT.
 *
 * `docs/decisions/0078-the-sky-moves-a-third-faster.md`. Reported from play: *"the background
 * starfield layers both still need to be scrolling past about 1/3 faster - currently feels like i'm
 * on a casual stroll and not a super fast spaceflight combat battle."*
 *
 * ⚠️ **The ask is a RATIO against what shipped, so the guard is the arithmetic** — the same shape
 * `tests/cycling.test.ts` holds for *"cycle .5 sec faster"*, and for the same reason: there is no
 * absolute value to assert, only a change. What the other two claims here cover is everything the
 * ratio does not — that the parallax survived it, and that 0065's ceiling still does.
 */
describe('the sky goes past twice as fast as it shipped, and the parallax survives it', () => {
  /** What `docs/decisions/0065-the-sky-is-baked-and-blitted.md` shipped, back to front. */
  const SHIPPED = [0.12, 0.3];

  /*
    ⚠️ **TWO ASKS, MULTIPLIED, AND THEY COME OUT AT EXACTLY DOUBLE.**
    `docs/decisions/0078-the-sky-moves-a-third-faster.md` took *"about 1/3 faster"* and
    `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md` took *"the
    background needs to move faster, still feels really slow"* at half as much again on top:
    `4/3 × 3/2 = 2`. Written as the product rather than as `2`, because the two are separate asks from
    separate play-tests and a later third one multiplies onto this rather than replacing it.
  */
  /*
    ⚠️ **AND A THIRD ASK MULTIPLIES ONTO IT, EXACTLY AS THE COMMENT ABOVE PREDICTED IT WOULD.**
    `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md` took *"it still needs to move
    much more faster"* at another eighth again: `4/3 × 3/2 × 11/8 = 2.75`, so the two layers 0065
    shipped now go past at 0.33 and 0.825. Written as the product for the third time, because the day
    a fourth report arrives it multiplies onto this rather than replacing it.
  */
  const FASTER = (4 / 3) * (3 / 2) * (11 / 8);

  it('moves both layers twice as fast as they shipped, which is what was asked for', () => {
    /*
      ⚠️ **The two 0065 shipped, and there is a third layer in front of them now** —
      `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`. The loop counts `SHIPPED`
      rather than `SKY` on purpose: this test is about what happened to the layers 0078 and 0088 were
      reports about, and a layer that did not exist then cannot be `FASTER` times anything.
    */
    /*
      ── AND IT INDEXED `SKY` POSITIONALLY, WHICH A FOURTH LAYER BROKE ────────────────────────────

      ⚠️ **`docs/decisions/0112-the-sky-has-weather.md`.** The nebula is drawn FIRST — draw order is
      the only thing that decides what is in front of what — so every index in this file moved by one
      and this guard reported the cloud as a starfield that had slowed down. **The layers are found by
      SPRITE now**, which is what the assertion was always about.
    */
    const shipped = [SPRITE.skyFar, SPRITE.skyNear].map((sprite) => SKY.find((layer) => layer.sprite === sprite));
    for (let i = 0; i < SHIPPED.length; i++) {
      const want = SHIPPED[i]! * FASTER;
      expect(shipped[i]?.depth, `sky layer ${i} is not ${FASTER}× what it shipped at`).toBeCloseTo(want, 6);
    }
    expect(SKY.length, 'a layer was added or removed without this file being told').toBe(SHIPPED.length + 2);
  });

  it('scales BOTH by the same factor, so the depth cue is not what paid for the speed', () => {
    /*
      ⚠️ **THE ONE A HAND WOULD GET WRONG.** *"Both layers a third faster"* is satisfied on the near
      one alone by anybody reading quickly, and a two-layer sky whose layers move at the same relative
      rates is the only thing that reads as depth at all. Held as the RATIO between them, which is the
      parallax itself and is the one quantity the ask does not touch.
    */
    const was = SHIPPED[1]! / SHIPPED[0]!;
    // ⚠️ **By sprite and not by index** — 0112 put a fourth layer at the back and every index moved.
    const far = SKY.find((layer) => layer.sprite === SPRITE.skyFar)!;
    const near = SKY.find((layer) => layer.sprite === SPRITE.skyNear)!;
    const now = near.depth / far.depth;
    expect(now, 'the two layers no longer move at the same relative rates — the parallax was spent').toBeCloseTo(was, 6);
  });

  /**
   * How thick `kind`'s thickest mark is drawn, in world units, read off what `skyField` actually
   * bakes rather than off the constant behind it — 0027, and `skyField`'s own reason for existing.
   */
  /*
    ⚠️ **OVER EVERY PLACE, AND THAT IS 0195's WHOLE COST.** `skyField` took no theme, so one reading
    answered for the entire game. A place now scales the mark size, so the ceiling has to be asked of
    the LOUDEST of the seven — a bound checked against one place is a bound six places are not held to.
  */
  const thickestOf = (kind: SkyKind): number =>
    Math.max(
      ...THEME_KINDS.flatMap((theme) =>
        skyField(kind, bakeSize(SPRITE_EXTENT[kind], 6), theme).stars.map(
          (star) => star.r / (bakeSize(SPRITE_EXTENT[kind], 6) / SPRITE_EXTENT[kind]),
        ),
      ),
    );

  /** The smallest thing on screen that can kill the player — what a sky mark must not resemble. */
  const smallestThreat = Math.min(SHOTS.pulse.radius, SHOTS.spit.radius, SHOTS.lance.radius, SHOTS.flak.radius);

  it('is never at the world’s own rate, on whichever side of the game it sits', () => {
    /*
      ⚠️ **The counterweight, and the reason a speed ask has an upper bound at all.** At a depth of 1
      the sky moves exactly with the world and stops being a background — it reads as a field of
      objects going past at the rate of the things that can kill the player, which is
      `docs/decisions/0069-the-sky-is-behind-the-game.md`'s subject. There is no natural stopping
      point on *"faster"*, so this is where it stops.

      ── THE CEILING MOVED FROM A HALF TO TWO THIRDS, AND SOMETHING PAID FOR IT ────────────────────

      ⚠️ **A loosened bound with no argument behind it is a bound that will loosen again**, so this
      one is tied to what bought it. `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md`
      cut the near layer to about **2% of the far layer's ink** — a third of the radius at under a
      fifth of the alpha — and the reason a depth ceiling exists at all is that a fast layer competes
      for the eye. A layer that is barely there can move faster before it competes.

      ⚠️ **`and the near layer is the quiet one` is the other half of this test and is not a
      duplicate of it.** That one holds the ink; this one holds the speed; and the sentence above is
      the only place that says they are one trade. Loosen this without that going with it and the
      argument is gone while both tests stay green.

      ── AND THE CEILING IS NOW TWO CEILINGS, BECAUSE ONE LAYER IS NOT MADE OF DOTS ────────────────

      ⚠️ **`docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`.** Every previous
      answer to *the sky is too slow* moved a depth and ran into the same wall: a DOT that moves fast
      competes with a bullet, so the speed had to be bought back with alpha and size until 0088 had
      dimmed the only fast layer out of existence — which is the report this decision answers.

      ⚠️ **A streak breaks the trade, so a streak is what may go past two thirds.** It says *fast* by
      its shape rather than by its rate, and at 0.109 world units it is a fifth of the smallest
      bullet's thickness — the thing a dot at that depth could never be.

      ── AND SHAPE WAS NEVER THE REASON, WHICH THE NEXT REPORT MADE UNAVOIDABLE ────────────────────

      ⚠️ **`docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`.** 0097 held this as
      *whichever layers are above two thirds are exactly the streak layers*, which is an exception
      list wearing a rule's clothes — and the next report was *"it still needs to move much more
      faster"* about the two dot layers the exception excluded.

      ⚠️ **The honest rule underneath was always about SIZE.** 0069's subject is a background dot the
      size of a bullet moving fast enough to be mistaken for one; a dot a third of that size is not
      that thing, whatever its shape. So the ceiling is arithmetic:

      **a mark may move at the world's rate, less half of how much of a bullet it looks like.**

      At two thirds of a bullet the ceiling is two thirds — which is 0069's number arriving as a
      consequence rather than as a constant, and is why the back layer is still held to roughly what
      it always was. At an eighth of a bullet it is 0.94.

      ⚠️ **It cannot reach 1**, because a mark of no size is not a mark. 0065's absolute is still
      asserted separately, because a formula that happens to stay under 1 is not the same as a rule
      that says it must.

      ── AND *BELOW 1* WAS THE SPECIAL CASE OF A RULE ABOUT DISTANCE FROM 1 ────────────────────────

      ⚠️ **`docs/decisions/0103-the-fast-layer-is-in-front.md`.** Reported: *"background scroll is too
      slow, probably needs to be another 75% faster again"* — the fifth time, and the first where the
      answer is not a number. The measured ceilings say why: the near layer sits at 0.825 against
      **0.845**, so the background sky had 2% left in it and ×1.75 is not a thing it can be asked for.

      ⚠️ **WHY A DEPTH NEAR 1 IS THE BAD PLACE, WHICH THE OLD BOUND HAD BACKWARDS AS *ABOVE 1*.** At
      exactly the world's rate a mark shares its motion signature with every bullet and every enemy on
      the screen, so the eye loses the one channel that separates figure from ground. **Slower is a
      separation and faster is equally a separation** — what 0069 is actually about is the mark that
      moves at roughly the speed of the things that can kill you, and 1 is that speed, not a ceiling
      above which safety lies.

      ⚠️ **So the rule generalises rather than loosens: a mark must clear the world's rate by half of
      how much of a bullet it looks like, on WHICHEVER SIDE it sits.** `|depth − 1| > share × 0.5`.
      Every number the old bound produced is unchanged — the two dot layers are still held to 0.671
      and 0.845 — and the branch that did not exist is now available to a mark thin enough to earn it.

      ⚠️ **A layer past 1 is IN FRONT OF THE GAME, and that is a picture rather than a loophole**: it
      overtakes the ship instead of trailing it, which is the one thing no amount of background speed
      can imitate and is why the answer to a fifth *make it faster* is a different place rather than a
      bigger number.

      ⚠️ **The clearance is what stops that being a free pass.** A foreground dot the size of a bullet
      would need to reach 1.67 before it cleared, and the near layer's own field would need 1.16 — so
      *put it in front* costs exactly as much as *put it behind* did, measured off the same bake.
    */
    /*
      ── AND IT IS A RULE ABOUT MARKS, WHICH HAD NEVER NEEDED SAYING ───────────────────────────────

      ⚠️ **`docs/decisions/0112-the-sky-has-weather.md`.** Everything the sky drew was a dot or a line,
      so *how much of a bullet does it look like* could be answered with a thickness and the word
      **mark** did no work. A nebula is an AREA: run through the arithmetic below it reports a
      thickness of `-Infinity` — `Math.max` over an empty star field — and **passes for entirely the
      wrong reason**, which is worse than failing.

      ⚠️ **So the mark layers are named as the mark layers and the cloud is held to its own three
      bounds**, in the assertion below this one. What makes that a boundary rather than a hole is that
      the cloud is bounded from the other side: far bigger than a bullet, fainter than the faintest
      field, and drawn with no edge in it at all.
    */
    const marks = SKY.filter((layer) => layer.sprite !== SPRITE.skyNebula);
    expect(marks.length, 'the sky is all weather and no marks, so this measured nothing').toBe(SKY.length - 1);
    const RUSH = marks.findIndex((layer) => layer.sprite === SPRITE.skyRush);
    expect(RUSH, 'the sky has no streak layer, so nothing reads as speed at all').toBeGreaterThanOrEqual(0);
    for (let i = 0; i < marks.length; i++) {
      const layer = marks[i]!;
      const kind = SPRITE_KINDS[layer.sprite] as SkyKind;
      const thickest = thickestOf(kind);
      const clearance = (thickest / smallestThreat) * 0.5;
      expect(
        Math.abs(layer.depth - 1),
        `${kind} draws marks ${thickest.toFixed(2)} units thick — ${((thickest / smallestThreat) * 100).toFixed(0)}% of a ` +
          `bullet — and moves at ${layer.depth}, which is ${Math.abs(layer.depth - 1).toFixed(3)} from the world's own ` +
          `rate against a clearance of ${clearance.toFixed(3)}`,
      ).toBeGreaterThan(clearance);
    }
    expect(
      marks[RUSH]!.depth,
      'the streak layer is not the fastest one, so the layer that reads as speed is not the one moving',
    ).toBe(Math.max(...SKY.map((layer) => layer.depth)));
  });

  it('0112 — and the one thing bigger than a bullet has no edge, is faint, and is furthest away', () => {
    /*
      ⚠️ **THIS IS THE AMENDMENT, WRITTEN AS THREE BOUNDS RATHER THAN AS AN EXEMPTION** —
      `docs/decisions/0112-the-sky-has-weather.md`. 0069's rule is *nothing the sky draws is as big as
      a bullet*, and its reason is that a mark which looks like a bullet and moves like the world is
      confusable with a threat. **What makes something confusable is a hard edge at a bullet's scale,
      not area** — a disc two units across with a boundary is a bullet, and a gradient forty units
      across that never resolves to one is a place.

      ⚠️ **So the cloud is bounded from the OTHER side, and that is what keeps this a rule.** It has to
      be far LARGER than a bullet rather than smaller, fainter than the faintest field of marks, and
      slower than every one of them. A cloud that shrank towards a bullet's size fails here rather
      than inheriting the mark layers' exemption, which is exactly what an exemption would not do.

      ⚠️ **Measured off `nebulaField` rather than off the constants behind it**, for the reason
      `skyField` exists: `docs/decisions/0027-measure-the-picture-not-the-model.md`, a ceiling checked
      against the constant it came from proves only that the code agrees with itself.
    */
    const cloud = SKY.find((layer) => layer.sprite === SPRITE.skyNebula);
    expect(cloud, 'the sky has no weather in it, so this measured nothing').toBeDefined();
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    const clouds = nebulaField(size);
    expect(clouds.length, 'the nebula tile is empty').toBeGreaterThan(2);

    /*
      ⚠️ **Ten bullets, and the number is the point rather than a tolerance.** `smallestThreat` is what
      0069's own ceiling is measured against; a thing an order of magnitude bigger than the smallest
      thing that can kill the player is not a thing the player can mistake for one.
    */
    const smallest = Math.min(...clouds.map((c) => c.r / (size / SPRITE_EXTENT.skyNebula)));
    expect(
      smallest / smallestThreat,
      `the smallest cloud is ${smallest.toFixed(1)} units across against a ${smallestThreat.toFixed(1)}-unit bullet`,
    ).toBeGreaterThan(10);

    /*
      ⚠️ **Fainter than the FAINTEST field of marks**, so the layer nearest to being invisible is still
      more present than the weather behind it. Held against `skyField`'s own alpha rather than against
      `NEBULA_ALPHA`, which is the number under test.
    */
    const faintestField = Math.min(
      ...THEME_KINDS.flatMap((theme) =>
        (['skyFar', 'skyNear', 'skyRush'] as const).map(
          (kind) => skyField(kind, bakeSize(SPRITE_EXTENT[kind], 6), theme).alpha,
        ),
      ),
    );
    const boldest = Math.max(...clouds.map((c) => c.alpha));
    expect(
      boldest,
      `the boldest cloud is drawn at ${boldest.toFixed(2)} against the faintest starfield's ${faintestField.toFixed(2)}`,
    ).toBeLessThan(faintestField);

    // And it is the furthest thing there is, which is the other half of *behind the game*.
    expect(
      cloud!.depth,
      'the weather is not the slowest thing in the sky, so something is behind it',
    ).toBe(Math.min(...SKY.map((layer) => layer.depth)));
    expect(SKY[0]!.sprite, 'the weather is not drawn first, so a mark can end up behind it').toBe(SPRITE.skyNebula);
  });

  it('and only the streak layer may be in FRONT of the game, and only one of them', () => {
    /*
      ⚠️ **A SEPARATE CLAIM BECAUSE THE ARITHMETIC ABOVE CANNOT SAY IT** —
      `docs/decisions/0103-the-fast-layer-is-in-front.md`. The clearance is about ONE mark and how much
      of a bullet it looks like; it has no opinion on how many things are allowed to overtake the
      player at once. A sky whose every layer had crossed over would satisfy it completely and would be
      a game played behind a curtain, which is
      `docs/decisions/0069-the-sky-is-behind-the-game.md`'s subject arriving from the far side.

      ⚠️ **And the one that crosses must be the one that says *fast* BY ITS SHAPE.** A dot in front of
      the game is a thing to be dodged, whatever its clearance says — the near layer's own field would
      clear at 1.16 and would still be a field of specks flying at the player.
      `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md` is why a streak was drawn at
      all, and this is where that finding stops being decoration.

      ⚠️ **Held as a COUNT and as a KIND, because the two fail differently.** A second streak layer is
      a curtain; a dot layer moved across is 0069. Neither implies the other.
    */
    const inFront = SKY.filter((layer) => layer.depth > 1);
    expect(inFront.length, 'more than one sky layer is in front of the game, which is a curtain').toBeLessThan(2);
    for (const layer of inFront) {
      expect(
        SPRITE_KINDS[layer.sprite],
        'a layer made of DOTS was put in front of the game, where a dot is a thing to be dodged',
      ).toBe('skyRush');
    }
    /*
      ⚠️ **AND A LAYER AT EXACTLY 1 IS THE WORST PLACE THERE IS**, which is asserted here rather than
      left to the clearance: a mark of no size at all would satisfy `|depth − 1| > 0` and sit exactly
      on the rate of every bullet on the screen. 0065's absolute survives as this, one step over.
    */
    for (let i = 0; i < SKY.length; i++) {
      expect(SKY[i]!.depth, `sky layer ${i} moves at exactly the world's rate, so nothing separates it`).not.toBe(1);
    }
  });
});

describe('the sky costs a fixed number of calls, whatever the camera is doing', () => {
  /*
    ⚠️ **THE REAL SKY, AND NOW ACTUALLY SO.** This comment used to sit above a restatement of the
    array — *"built the way `src/app/mount.ts` builds it rather than restated"*, above a restatement.
    It survived because a depth cannot change a draw count, so the copy and the original could
    disagree for ever with this file green. `docs/decisions/0078-the-sky-moves-a-third-faster.md` is
    where the two were found to have to move together, and `SKY` is exported for it.
  */

  it('draws the same number of tiles on every frame of a whole level', () => {
    /*
      ⚠️ **THE ONE THAT MATTERS, and it is a modulo bug that nothing else could see.** A tiling offset
      taken with `%` alone, or a count that rounds rather than ceils, draws an extra tile on some
      cameras and one too few on others — the cost wobbles and, worse, a seam of empty space crosses
      the screen once per tile. Ten thousand units of camera is more than a level.
    */
    const view = viewOf(1920, 1080);
    const counts = new Set<number>();
    for (let camera = 0; camera < 10_000; camera += 37) {
      const surface = new CountingSurface();
      paintScene(surface, view, [], camera, 0.5, SKY);
      counts.add(surface.blits);
    }
    expect([...counts], `the sky's cost varies with the camera: ${[...counts].join(', ')}`).toHaveLength(1);
  });

  it('and the same number on every device the clamp allows', () => {
    // A tile is `ACROSS_SPAN` units and the view is 150 to 240 (0023), so the count varies by one at
    // most between the narrowest and the widest. What must not vary is the ORDER of it.
    for (const view of [viewOf(1500, 1000), viewOf(2400, 1000), viewOf(1000, 1500)]) {
      const surface = new CountingSurface();
      paintScene(surface, view, [], 4321, 0.5, SKY);
      expect(surface.blits, `a ${view.alongSpan}-unit view drew ${surface.blits} sky tiles`).toBeLessThanOrEqual(
        SKY.length * 5,
      );
      expect(surface.blits, 'the sky drew nothing at all').toBeGreaterThan(0);
    }
  });

  it('covers the whole view, so no seam of empty space ever crosses the screen', () => {
    /*
      ⚠️ **In world units against the view, which is what the player would see go past.** The count
      has to be *span ÷ tile* rounded UP, plus one for the tile straddling the trailing edge. Both
      halves are one character and both are invisible at a glance: `round` for `ceil` is short by a
      whole tile on the widest device only, and dropping the `+ 1` is short at every camera that is
      not exactly on a tile boundary.

      ⚠️ **Every view the clamp allows**, which is where the `ceil` half lives: at 16:9 the span is
      1.78 tiles and rounding up and to-nearest agree, so a test on one device proves nothing.
    */
    /*
      ⚠️ **ONE LAYER AT A TIME, and measuring both at once hid the bug this exists for.** The layers
      move at different rates, so at any given camera one is nearly aligned with a tile boundary and
      the other is not — and a `SpanSurface` fed both records the widest pair of edges, which is the
      LUCKIER layer's coverage. The first version of this test passed with a layer visibly a tile
      short. A guard that aggregates the thing it is comparing is not a guard.
    */
    for (const view of [viewOf(1500, 1000), viewOf(1920, 1080), viewOf(2400, 1000)]) {
      for (const camera of [0, 13, 49.5, 99.9, 100, 100.1, 1234.5]) {
        for (const layer of SKY) {
          const surface = new SpanSurface();
          paintScene(surface, view, [], camera, 0.5, [layer]);
          // The tiles have to reach from at or before the trailing edge to at or past the far one.
          // `SpanSurface` records the extremes in CSS pixels.
          const where = `a ${view.alongSpan}-unit view at camera ${camera}, depth ${layer.depth}`;
          expect(surface.left, `${where}: the sky starts ${surface.left.toFixed(0)}px in`).toBeLessThanOrEqual(
            view.gutterAlong + 0.001,
          );
          expect(surface.right, `${where}: the sky stops short`).toBeGreaterThanOrEqual(
            view.gutterAlong + view.alongSpan * view.scale - 0.001,
          );
        }
      }
    }
  });

  it('is not entities, so it costs the pools nothing', () => {
    // The rule this decision is really about: `CAPACITY` totals 0022's worst case exactly, so a
    // starfield of bodies would have come out of the pools that hold bullets.
    const before = Object.values(CAPACITY).reduce((sum, n) => sum + n, 0);
    expect(before, 'the sky took slots from the entity budget').toBeLessThanOrEqual(WORST_CASE);
  });

  it('and the bake ceiling is a RESOLUTION, so the biggest bitmap is not the blurriest', () => {
    /*
      ⚠️ **The ceiling was a flat pixel count and it always meant this.** 256px is a 26-unit boss at
      ten pixels per unit — so the number was a resolution wearing a size's clothes, and it only
      looked like a size while nothing was bigger than a boss. A sky tile is four times that: under a
      flat cap it bakes at a quarter of the detail and blits at three times its own resolution, and
      the picture is wrong on the biggest thing on the screen and nowhere else.

      Stated as the property rather than as the number: at a resolution high enough that everything is
      capped, every kind is capped at the SAME pixels per world unit.
    */
    const far = 10_000;
    const resolutions = SPRITE_KINDS.map((kind) => bakeSize(SPRITE_EXTENT[kind], far) / SPRITE_EXTENT[kind]);
    for (const ppu of resolutions) {
      expect(ppu, `the cap gives ${ppu} pixels per unit where another kind gets ${resolutions[0]}`).toBeCloseTo(
        resolutions[0]!,
        6,
      );
    }
    // And it is a ceiling rather than a floor: below it, the ask is honoured.
    expect(bakeSize(10, 4), 'a modest resolution was rounded up to the ceiling').toBe(40);
  });

  /**
   * THE SKY IS BEHIND THE GAME — `docs/decisions/0069-the-sky-is-behind-the-game.md`.
   *
   * Reported from play: *"the closer to screen layer is too prominent, needs to be backgrounded a
   * bit."* A screenshot of the shipped page said why — the near layer's stars were discs the same
   * size as the enemy bullets, in a different ink.
   *
   * ⚠️ **Read off `skyField`, which is what will be DRAWN, rather than off the constants behind
   * it.** 0027: a ceiling asserted against the constant it was derived from proves that the code
   * agrees with itself, and 0019 says no probe can see that. The star radii below are the ones the
   * bake loop will use.
   */
  describe('and it stays behind the game', () => {
    /** Every tile, back to front, at the resolution it bakes at on an ordinary screen. */
    const KINDS: readonly SkyKind[] = ['skyFar', 'skyNear', 'skyRush'];
    /*
      ⚠️ **THE PLACE THAT PAINTS THE MOST, NOT THE ONE THAT SHIPS FIRST** — 0195. Density, mark size
      and streak length are all per-place now, so `skyFar` in The Toxic Mire is a different field from
      `skyFar` in The Black Heart. Every claim below is a CEILING, so the honest reading is the worst
      of the seven; taking the base composition's would leave six places unmeasured.
    */
    const worstOf = (kind: SkyKind) => {
      const size = bakeSize(SPRITE_EXTENT[kind], 6);
      const per = size / SPRITE_EXTENT[kind];
      const area = (f: { stars: { r: number; len: number }[]; alpha: number }): number =>
        f.alpha *
        f.stars.reduce((sum, st) => sum + (Math.PI * st.r * st.r + 2 * st.r * st.len) / (per * per), 0);
      return THEME_KINDS.map((theme) => skyField(kind, size, theme)).reduce((a, b) =>
        area(a) >= area(b) ? a : b,
      );
    };
    const FIELDS = KINDS.map((kind) => worstOf(kind));
    const FAR = FIELDS[0]!;
    const NEAR = FIELDS[1]!;
    const RUSH = FIELDS[2]!;

    /** Tile pixels per world unit, which every tile shares because every tile is `ACROSS_SPAN` wide. */
    const perUnit = (kind: SkyKind): number => bakeSize(SPRITE_EXTENT[kind], 6) / SPRITE_EXTENT[kind];

    /** A star's radius in WORLD units, which is the only unit a bullet can be compared in. */
    const inUnits = (kind: SkyKind, field: { stars: { r: number }[] }): number[] =>
      field.stars.map((star) => star.r / perUnit(kind));

    /**
     * How much of the screen a layer paints, in world units squared, alpha counted.
     *
     * ⚠️ **A streak is a capped line and its area is not `πr²`** — 0097. The old form of this
     * helper summed discs, and against a layer of lines it would have reported about a fiftieth of
     * what is on the screen, which is a guard measuring a quantity the picture does not have.
     */
    const ink = (kind: SkyKind, field: { alpha: number; stars: { r: number; len: number }[] }): number => {
      const p = perUnit(kind);
      return (
        field.alpha *
        field.stars.reduce((total, star) => {
          const r = star.r / p;
          return total + Math.PI * r * r + 2 * r * (star.len / p);
        }, 0)
      );
    };

    it('THE REPORTED ONE: no star is drawn as big as the smallest thing that can kill the player', () => {
      /*
        ⚠️ **Against `SHOTS` and never against a number written here.** A bullet is the right thing
        to compare with: it is the smallest body in the game that ends a life, so anything the
        background draws bigger than one is a background competing with the game. The near layer used
        to reach 1.2 world units against a pulse's 0.9.
      */
      const smallestThreat = Math.min(SHOTS.pulse.radius, SHOTS.spit.radius);
      for (let i = 0; i < KINDS.length; i++) {
        const kind = KINDS[i]!;
        const biggest = Math.max(...inUnits(kind, FIELDS[i]!));
        expect(
          biggest,
          `a ${kind} star is ${biggest.toFixed(2)} units across where the smallest bullet is ${smallestThreat}`,
        ).toBeLessThan(smallestThreat);
      }
    });

    it('0097 — AND THE NEARER A LAYER IS, THE THINNER ITS MARKS ARE, WHICH IS WHAT BUYS THE SPEED', () => {
      /*
        ⚠️ **The ladder rather than one ceiling, and it is the guard 0088's single number became.**
        `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`: a layer is allowed to
        move faster in proportion to how little of the eye one of its marks can take, and thickness
        is the property that decides whether a mark can be mistaken for a bullet. 0.59, 0.28, 0.11 —
        back to front, strictly down.

        ⚠️ **It is the one relationship a hand cannot tune its way out of.** Alpha, count and length
        are all judged by eye and will move again; *the fastest layer draws the thinnest mark* is
        true of every sky that is a background, whatever those three settle at.

        ⚠️ **THE MEAN AND NOT THE MAX, AND A PROBE IS WHY.** Written against the largest sample in
        each field this reported WRONG TEST for the break it exists to catch: a maximum over fifteen
        streaks is systematically further below its own ceiling than a maximum over ninety dots, so
        the streak layer could be given the middle layer's ceiling outright and still measure
        thinner. The mean converges on three quarters of the ceiling at any count, which is the same
        statement without the sampling bias — and it is still read off what will be DRAWN rather than
        off the constant, which is 0069's rule and the reason this helper exists at all.
      */
      const meanThickness = (kind: SkyKind, field: { stars: { r: number }[] }): number => {
        const radii = inUnits(kind, field);
        return radii.reduce((sum, r) => sum + r, 0) / radii.length;
      };
      for (let i = 1; i < KINDS.length; i++) {
        const front = meanThickness(KINDS[i]!, FIELDS[i]!);
        const behind = meanThickness(KINDS[i - 1]!, FIELDS[i - 1]!);
        expect(
          front,
          `${KINDS[i]} draws marks averaging ${front.toFixed(3)} units thick in front of ${KINDS[i - 1]}'s ${behind.toFixed(3)} — the faster layer is the fatter one`,
        ).toBeLessThan(behind);
      }
    });

    it('0097 — and a streak stays a streak, because a short one is a fast dot', () => {
      /*
        ⚠️ **THE BREAK THIS CATCHES IS THE ONE THE THICKNESS LADDER CANNOT SEE.** A `skyRush` mark
        drawn at `len: 0` passes every other assertion in this file — it is the thinnest thing on the
        screen, it is under a bullet, its ink goes DOWN — and it is a field of dots at the fastest
        depth in the game, which is exactly `docs/decisions/0069-the-sky-is-behind-the-game.md`'s
        subject arriving through the door 0097 opened.

        ⚠️ **Twenty times the drawn WIDTH, not the half-thickness.** What the eye judges is the
        mark it can see, and the mark is `2r` across.
      */
      const p = perUnit('skyRush');
      const width = Math.max(...RUSH.stars.map((s) => s.r)) * 2;
      const shortest = Math.min(...RUSH.stars.map((s) => s.len));
      expect(shortest, 'the streak layer draws dots, so nothing on the screen says speed').toBeGreaterThan(0);
      expect(
        shortest / width,
        `the shortest streak is ${(shortest / p).toFixed(1)} units long and ${(width / p).toFixed(2)} wide`,
      ).toBeGreaterThan(20);
    });

    it('and the near layer is the quiet one, on every count that buys attention', () => {
      /*
        ⚠️ **Three properties, because the near layer is the one that MOVES** — `src/app/mount.ts`
        runs it at two and a half times the far layer's rate — and motion is what buys attention. It
        pays that back by being fainter and fewer. Size no longer separates them at all, which is the
        change: whichever layer were bigger, one of them would be over the bullet ceiling above or
        indistinguishable from the other.

        ⚠️ **The alpha is a hand's number and is deliberately NOT pinned** — 0037's rule, the one
        `tests/run.test.ts` states for lives. What is held is the RELATIONSHIP, which has to be true
        at whatever value a later play-test settles on.

        ⚠️ **SIZE SEPARATES THEM AGAIN, and the paragraph above used to say it did not** —
        `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md`. Reported from play:
        *"the closer starfield layer is still too close to play view, needs to be a bit more
        background. I think it's actually the perspective zoom level is wrong."* Distance in a flat
        starfield is carried by exactly two things — how big a dot is and how many there are — so the
        near layer is now the smaller one as well as the fainter one. 0069's ceiling still holds over
        both of them, above; this is the layer against the other layer rather than against a bullet.
      */
      /*
        ⚠️ **THE COUNT ASSERTION IS NOW AN INK ASSERTION, AND THAT IS AN INVERSION RATHER THAN A
        RELAXATION** — `docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md`.
        It read *the near layer has fewer stars than the far one*, and 0088 gives it exactly as many:
        at a third of the radius, **more** dots is what *further away* looks like, which is the
        argument `SKY_STARS` itself makes in the opposite direction at the old size.

        ⚠️ **What was always meant is how much of the eye the layer takes**, and count was a proxy for
        it that stopped being one the moment size and count moved in opposite directions. Ink is
        `alpha × Σπr²`, which is the three levers in one number and cannot be gamed by trading one
        against another — the exact failure the count assertion would have missed.

        ── AND THE BOUND IS CHOSEN FROM WHAT IT MUST CATCH, WHICH A PROBE HAD TO TEACH IT ───────────

        ⚠️ **It was a fifth for one commit and `npm run prove` reported STILL GREEN on two of 0088's
        three breaks.** *A drift detector, not the measurement* was the reasoning, and a drift
        detector that cannot detect the drift is not a guard — restoring the near layer's old alpha
        left it at 4.4%, comfortably inside a 20% bound, and that alpha is the exact value the player
        called distracting.

        ⚠️ **So the bound sits below the smallest single-lever break there is**, which is the only
        principle available: a bound above one of them is a rule the code can break without the suite
        noticing.

        | | ink, as a share of the far layer |
        |---|---|
        | now | **2.0%** |
        | the alpha alone put back to what shipped | 4.4% |
        | all three levers put back (0069's layer) | 8.3% |
        | the size alone put back | 15.1% |

        A twenty-fifth is under the first of those and twice the current value.

        ── AND A TWENTY-FIFTH WAS A NUMBER ABOUT ONE BUILD, WHICH THE NEXT PLAY-TEST SAID SO ────────

        ⚠️ **`docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`.** Reported against
        the build this bound was written for: *"there's only one starfield background."* A guard
        calibrated so that *the alpha put back* fails is a guard that also refuses *the layer is
        visible at all*, and the two are the same edit at different sizes — which is 0027's own gap
        arriving in a test rather than in a constant.

        ⚠️ **So the bound is now per LEVER rather than one number over all of them**, and each of the
        four is held where a break of it shows:

        | lever | what holds it |
        |---|---|
        | thickness | `THE NEARER A LAYER IS, THE THINNER ITS MARKS ARE`, above |
        | shape | `a streak stays a streak`, above |
        | alpha | the back layer is the only solid one — below |
        | count | a third of the bed's ink, below |

        ⚠️ **A QUARTER, and it is chosen from what it must catch** on 0088's own principle — a bound
        has to sit below the smallest break it must catch, and nowhere else.

        | | ink, as a share of the bed |
        |---|---|
        | `skyNear` now | **8.4%** |
        | `skyRush` now | **17.7%** |
        | the near layer's dots back at 0.55 units — 0088's break | 32.5% |
        | the near layer's dots back at the far layer's size — 0080's break | 38.6% |
        | the streak layer at ninety marks instead of fifteen | 88% |

        ⚠️ **The streak layer is deliberately the closest thing to this bound**, at about seven tenths
        of it, and that is the budget the fast layer was given rather than an accident: a hairline
        that nobody can see is 0088's mistake and 0097 is the report about it.
      */
      expect(NEAR.alpha, 'the near layer is drawn as solidly as the far one').toBeLessThan(FAR.alpha);
      /*
        ⚠️ **THE BED IS THE ONLY LAYER DRAWN SOLID.** Everything in front of the back layer is a veil
        over it — that is what a sky with depth in it IS, and it is the statement `SKY_ALPHA`'s two
        numbers are an instance of. Held as a half rather than as *below the far layer*, because
        `0.99` would pass that and is not a veil.
      */
      for (let i = 1; i < KINDS.length; i++) {
        expect(
          FIELDS[i]!.alpha,
          `${KINDS[i]} is drawn at ${FIELDS[i]!.alpha} of solid, in front of a bed drawn at ${FAR.alpha}`,
        ).toBeLessThan(FAR.alpha / 2);
      }
      /*
        ⚠️ **THE STREAK LAYER GETS ITS OWN CEILING, AND IT IS DOUBLE** —
        `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`. A quarter was chosen when
        the streak layer was a hairline nobody had flown; the report on that build is *"it still needs
        to move much more faster"*, and the lever that answers it is LENGTH, which is paid for in ink.

        ⚠️ **What a dot's ink bound is for is different from what a streak's is for**, which is why
        one number over both was the wrong shape. A dot competes with the bed for the eye and can be
        mistaken for an object; a streak is the thing the player is being asked to look at going past,
        and it cannot be mistaken for anything. The dot layers keep the quarter.

        ⚠️ **A half rather than *more*, and it is chosen from what it must catch**: the streak layer
        sits at 36.8%, and doubling its count reaches 74%.

        ── AND THE HALF BECAME 0.7, BECAUSE INK IS AN AREA AND THE FAILURE WAS A WIDTH ───────────────

        ⚠️ **`docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`.** Reported from play
        against the build 0103 shipped: *"there are thin lines that are hardly visible… I don't feel
        like I'm zooming through space."* Measured on the view the report came from, the streaks were
        **0.79 CSS pixels** thick.

        ⚠️ **THIS METRIC CANNOT SEE THAT AND NEVER COULD.** `ink` is `alpha × Σ(πr² + 2r·len)` — an
        area — so a 0.79 × 152 pixel line and a 1.87 × 64 one are the same number to it, and only one
        of them is drawn. The layer sat at 36.8% of a ceiling of 50% and a floor of 6.25%, comfortably
        inside a band that had nothing to say about the thing being reported. Three passes at *make
        the sky faster* were governed by it.

        ⚠️ **The width is now held separately** — see the assertion under this one — and this ceiling
        is what pays for it, because ink scales linearly in thickness: making the mark visible at all
        costs 2.2× whatever else is held equal.

        ⚠️ **0.7 rather than *enough*, on the same derivation the half used.** The layer sits at 54.4%
        with a mark that can be seen; doubling its count from ten reaches **108.8%**, so the bound
        still catches the break it was written for and now sits above the state that answers the
        report rather than below it.
      */
      const bed = ink('skyFar', FAR);
      for (let i = 1; i < KINDS.length; i++) {
        const share = ink(KINDS[i]!, FIELDS[i]!) / bed;
        const streaks = FIELDS[i]!.stars.some((star) => star.len > 0);
        const ceiling = streaks ? 0.7 : 1 / 4;
        expect(
          share,
          `${KINDS[i]} puts ${(share * 100).toFixed(1)}% of the back layer's ink on the screen, and it is a layer that MOVES`,
        ).toBeLessThan(ceiling);
        /*
          ⚠️ **AND A FLOOR, WHICH IS THE HALF NOTHING HERE HAS EVER HELD** —
          `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`. Every guard in this
          block pushes one way, so three passes of *push the near layer back* each passed and the
          fourth report was *"there's only one starfield background"* — a layer can be dimmed out of
          existence with the whole suite green, which is the only failure mode a one-sided bound has.

          ⚠️ **A SIXTEENTH, AND IT WAS A THIRTY-SECOND UNTIL A PROBE REPORTED STILL GREEN.** A floor
          obeys the same rule as a ceiling — it sits above the smallest single-lever break it must
          catch — and the smallest one here is not the build that was reported. 0088's near layer was
          dimmed AND shrunk; either lever alone lands at about 4.4%, and a thirty-second is 3.1%.

          | | ink, as a share of the bed |
          |---|---|
          | `skyNear` now | **8.4%** |
          | its alpha alone put back to 0.18 | 4.5% |
          | its size alone put back to 0.2 units | 4.3% |
          | both, which is the build the report is about | **2.0%** |
        */
        expect(
          share,
          `${KINDS[i]} puts ${(share * 100).toFixed(1)}% of the back layer's ink on the screen, which is a layer nobody can see`,
        ).toBeGreaterThan(1 / 16);
      }
    });

    it('0106 — THE REPORTED ONE: every sky mark is at least a pixel thick on the screen it is judged on', () => {
      /*
        ⚠️ **Reported from play: *"there are thin lines that are hardly visible… I don't feel like I'm
        zooming through space."*** Measured on a 1280×720 desktop, which is the view the report came
        from: the streak layer drew marks **1.57 CSS pixels** across at 42% of solid — a hairline, and
        by a factor of two and a half the thinnest thing the game puts on the screen.

        ⚠️ **THE SENSE OF SPEED WAS PRESENT AND NEARLY INVISIBLE, WHICH IS WHY THREE PASSES OF *MAKE
        IT FASTER* DID NOT LAND.** That layer was already crossing the screen at 417 px/s against the
        starfield's 86 — by a factor of five, the fastest thing the player could have seen.

        ⚠️ **AND `ink` COULD NOT SEE IT, WHICH IS WHY THE BOUND ABOVE IS NOT THIS ONE.** That measure
        is `alpha × Σ(πr² + 2r·len)` — an area — so a hairline 152 pixels long and a visible mark 64
        pixels long are the same number to it. The layer sat at 36.8% of a 50% ceiling with a 6.25%
        floor, comfortably inside a band with nothing to say about the thing being reported.

        ⚠️ **2.5 PIXELS, AND IT SITS ABOVE THE STATE THAT WAS REJECTED.** The reported mark was 1.57
        and was called hardly visible; the far layer is 8.5 and the near one 4.0 and neither has ever
        been mentioned. A bound at 2.5 refuses what was reported and passes what was not, which is the
        only place a reported bound can honestly go.

        ⚠️ **IN THE PLAYER'S OWN PIXELS, WHICH IS THE ONE BOUND IN THIS FILE THAT MUST NOT BE A WORLD
        UNIT.** Everything else here is authored in world units, correctly, because content must not
        be authored against a device — but **visibility is not a world quantity**, it is a fact about
        a display. `docs/decisions/0027-measure-the-picture-not-the-model.md` asks for at least one
        assertion in the units the player experiences, and this is the sky's.

        ⚠️ **Against the DESKTOP view, and the phone is a known limitation stated rather than
        guarded.** A thickness fixed in world units is thinner on a smaller screen — at 480 px the
        streaks are 0.65 px and this bound would be unmeetable without making them fat on a monitor.
        `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md` made the game
        desktop-first; a sky that reads on a phone is a separate change and wants its own decision.
      */
      const DESKTOP = viewOf(1280, 720);
      for (const kind of KINDS) {
        const field = FIELDS[KINDS.indexOf(kind)]!;
        const thickest = (Math.max(...field.stars.map((star) => star.r)) / perUnit(kind)) * 2 * DESKTOP.scale;
        expect(
          thickest,
          `${kind} draws marks ${thickest.toFixed(2)} CSS pixels across on a 1280×720 screen — a hairline is not a mark`,
        ).toBeGreaterThan(2.5);
      }
    });
  });
});

describe('the pools are the worst-case scene, and they add up to it', () => {
  it('never asks the frame to draw more entities than the budget was measured for', () => {
    /*
      ⚠️ **NOTHING HELD THIS UNTIL A POOL WAS ADDED TO THE GAME.** `src/app/mount.ts` said *"the total
      is now EXACTLY 500"* in a comment, and 0022's worst case is the number every assertion in this
      file is written against — so the two agreed only for as long as somebody did the arithmetic in
      their head. The next pool would have been added the same way, and `docs/state-of-play.md` has
      three of them queued: missiles, shield orbs and a bomb's blast.

      ⚠️ **A ceiling, not an equality.** Spending the budget exactly is not a virtue; what 0022 fixes
      is the most the frame may ever be asked to draw, on a 2021 mid-range Android that this runner is
      not. A pool added by taking slots from another passes; a pool added by arithmetic in somebody's
      head does not.
    */
    const total = Object.values(CAPACITY).reduce((sum, n) => sum + n, 0);
    expect(
      total,
      `the pools total ${total} entities against 0022's worst case of ${WORST_CASE}. A new pool comes ` +
        'out of an existing share — the particle share is the one 0022 names as sheddable — or the ' +
        'decision is reopened, and that conversation is WebGL rather than the phone.',
    ).toBeLessThanOrEqual(WORST_CASE);
  });

  it('leaves room for a whole boss explosion, which is the fullest the debris pool ever gets', () => {
    /*
      ⚠️ **The loudest moment in the game is exactly the moment a burst that will not fit is
      dropped.** `src/sim/pool.ts` drops rather than grows, and 0022 says a dropped particle is the
      right trade — but a boss coming apart is not a particle, it is the event the level ends on
      (`docs/decisions/0062-a-boss-dies-loudly.md`), and it is the one place the debris pool is
      driven at a sustained rate rather than in single bursts.

      The arithmetic: a pulse of `BURST.boss` every `BOSS_PULSE` steps, each fragment living up to
      `BURST.lifeMax` — so about `boss × lifeMax / pulse` on screen at once, plus one enemy-sized
      burst from the death itself.

      ⚠️ **`BOSS_PULSE` is not exported and is not restated here.** What is checked is the property
      at the WORST pulse rate the pool could survive: if the standing population at one pulse per step
      would overrun the pool, the rate is the only thing standing between the game and a dropped
      explosion, and that is a number in a file nothing checks. So the assertion is against a rate
      slow enough to be legible — a pulse every five steps is the fastest a fragment spread of 18–34
      steps reads as separate — and it fails if either constant moves without the other.
    */
    const concurrent = (BURST.boss * BURST.lifeMax) / 5 + BURST.enemy;
    expect(
      concurrent,
      `a boss explosion peaks at about ${Math.round(concurrent)} fragments against a pool of ${CAPACITY.debris}`,
    ).toBeLessThanOrEqual(CAPACITY.debris);
  });

  it('leaves room for a boss and a player dying in the same second', () => {
    /*
      ⚠️ **The second sustained draw on the debris pool, and it can share a step with the first** —
      `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`. The ship now
      comes apart over a beat exactly as a boss does, and the two can overlap: a player killed by the
      volley a dying boss already had in the air is an ordinary way for a fight to end.

      The arithmetic is the boss's, twice, plus the bang the ship's own death throws once — and the
      rate is again asserted at the fastest that reads as separate pulses rather than at the constant,
      for the reason the boss's own guard gives above.
    */
    const bossBeat = (BURST.boss * BURST.lifeMax) / 5;
    const shipBeat = (BURST.dying * BURST.lifeMax) / 8 + BURST.ship;
    expect(
      bossBeat + shipBeat,
      `a boss and a ship coming apart together peak at about ${Math.round(bossBeat + shipBeat)} fragments ` +
        `against a pool of ${CAPACITY.debris}`,
    ).toBeLessThanOrEqual(CAPACITY.debris);
    /*
      ⚠️ **And the ship's beat is quieter per pulse than the boss's, which is the shape of the two
      events rather than a budget dodge.** A boss is the loudest thing in the game and the level ends
      on it; a death is something the player sees several times a run and is waiting through.
    */
    expect(BURST.dying, 'the ship comes apart louder per pulse than a boss does').toBeLessThan(BURST.boss);
  });

  it('gives the shell exactly as many slots as the ship has shields', () => {
    // The one pool whose size is a rule rather than a budget: a mark per shield, and the pickup
    // refuses a fourth — `src/content/ships.ts`. A pool one short would drop a mark the player owns.
    expect(CAPACITY.shieldOrbs, 'the shell cannot draw everything the ship can carry').toBe(MAX_SHIELDS);
  });
});

describe('the pool is the ceiling, and it is never exceeded', () => {
  it('never hands out more than its capacity, and never grows', () => {
    const pool = new Pool<Entity>(WORST_CASE, makeEntity);
    for (let i = 0; i < WORST_CASE; i++) expect(pool.spawn()).not.toBe(null);
    expect(pool.spawn(), 'a full pool grew instead of refusing').toBe(null);
    expect(pool.capacity).toBe(WORST_CASE);
    expect(pool.size).toBe(WORST_CASE);
  });

  it('constructs every entity once, and never again however long it runs', () => {
    // THE allocation assertion the runtime half can actually make. `make` is the only place an
    // entity object can come from, so counting its calls counts entity allocation exactly.
    let built = 0;
    const pool = new Pool<Entity>(WORST_CASE, () => {
      built++;
      return makeEntity();
    });
    expect(built).toBe(WORST_CASE);

    const surface = new CountingSurface();
    const view = viewOf(1920, 1080);
    const clock = makeClock();
    let camera = 0;
    for (let frame = 0; frame < FRAMES; frame++) {
      // Refill whatever the cull retired, which is the churn a real wave produces.
      for (let e = pool.spawn(); e !== null; e = pool.spawn()) {
        reset(e, camera + 200 + pool.size, (pool.size * 7) % ACROSS_SPAN, sprite(pool.size % 16));
        e.velAlong = -0.5;
      }
      advance(clock, 16.7);
      for (let s = 0; s < clock.steps; s++) {
        camera += 0.6;
        stepEntities(pool, camera);
      }
      paintScene(surface, view, [pool], camera, clock.alpha);
    }
    expect(built, 'entities were constructed during play — the pool is not a pool').toBe(WORST_CASE);
    expect(pool.capacity).toBe(WORST_CASE);
  });
});

// ── THE SOURCE HALF ──────────────────────────────────────────────────────────────────────────────

/**
 * The files that run every frame. Closed, and short on purpose: the value of the list is that adding
 * to it is a deliberate act, and that anything NOT on it is free to be written normally.
 */
const HOT_FILES = [
  'src/app/loop.ts',
  'src/app/frame.ts',
  'src/sim/pool.ts',
  'src/sim/entity.ts',
  // ⚠️ Added with the combat slice, and adding it is the deliberate act 0025 says this list exists
  // to require. Collision runs once per step over every pairing — the densest loop in the game, and
  // the one place where an innocent `.filter()` over "the live ones" would allocate hardest exactly
  // when the screen is fullest.
  'src/sim/collide.ts',
  'src/render/scene.ts',
  'src/render/surface.ts',
  'src/render/canvas.ts',
];

/**
 * Files that look like they belong above and deliberately do not, each with the reason.
 *
 * ⚠️ This list is why the split between `mount.ts` and `frame.ts` exists at all. Setup code
 * allocates — it creates canvases, bakes bitmaps, builds pools — and a scan that covered it would be
 * marked `@setup` line by line until the markers meant nothing. Separating the two files is what
 * lets the scan stay strict over the half that runs sixty times a second.
 */
const DELIBERATELY_COLD: Record<string, string> = {
  'src/app/mount.ts': 'boot and resize: creates the canvas, builds the pool, seeds the field. Never called from a frame.',
  'src/render/bake.ts': 'draws every sprite once at load. Allocating is what it is FOR; blitting afterwards is the point.',
  /*
    ⚠️ **THE ONE ENTRY ON THIS LIST THAT IS REACHED FROM A STEP, and it is here rather than above
    because putting it above would be a claim this scan cannot make.** A cue is played during a step,
    and playing one allocates: a Web Audio source node is single-use by specification, so there is no
    pool to take it from. The scan would not SEE that — `ctx.createBufferSource()` is a call, not a
    `new` — so listing the file as hot would report clean while it allocated per shot, which is worse
    than not listing it. The allocation is bounded instead, by the voice cap, and counted:
    `tests/sound.test.ts` asserts the bound. That is
    `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`'s own move applied to the budget
    it did not anticipate — `docs/decisions/0072-a-cue-is-baked-and-played.md`.

    ⚠️ **THE BOUND IS DERIVED NOW AND IT USED TO BE `MAX_VOICES` = 4** —
    `docs/decisions/0183-a-cue-is-limited-rather-than-refused.md`. It is `CUE_KINDS.length`, because
    no cue's `hold` is under two steps and a kind that sounded this step cannot sound again on it.
    **A derived bound moves when the table does**, which a typed one never did: the cap was chosen
    when there were fewer rows and nothing would have told anybody.
  */
  'src/app/sound.ts':
    'reached from a step, and it allocates one single-use audio source per voice because the platform ' +
    'has no other way to play a buffer. Bounded by CUE_KINDS.length — every hold is at least two ' +
    'steps, so a kind sounds once per step — rather than by this scan, which cannot see a factory ' +
    'call. 0183.',
};

interface AllocationRow {
  what: string;
  pattern: RegExp;
  /** A line that MUST match, so a typo'd pattern fails here rather than passing forever. */
  sample: string;
  /** A line it must leave alone, so the ban is precise rather than merely loud. */
  innocent: string;
}

/**
 * The syntax that allocates. Not a complete list of ways to make garbage — a complete list is not
 * reachable with a regex — but the ways it actually happens in a render loop, each of which is
 * invisible in review because every one of them is an ordinary line of TypeScript.
 */
const ALLOCATIONS: AllocationRow[] = [
  {
    what: 'constructing an object',
    pattern: /\bnew\s+[A-Z]/,
    sample: 'const p = new Point(x, y);',
    innocent: 'const next = index + 1;',
  },
  {
    what: 'an array method that builds a new array or a closure per call',
    pattern: /\.\s*(map|filter|slice|concat|flatMap|reduce|forEach|sort|join|split|push|splice|unshift)\s*\(/,
    sample: 'const live = pool.items.filter((e) => e.alive);',
    innocent: 'for (let i = 0; i < pool.size; i++) total += pool.at(i).along;',
  },
  {
    what: 'an Object or Array helper, each of which materialises a fresh collection',
    pattern: /\bObject\.(keys|values|entries|assign|fromEntries)\s*\(|\bArray\.from\s*\(/,
    sample: 'for (const k of Object.keys(row)) sum += row[k];',
    innocent: 'const kind = row.sprite;',
  },
  {
    what: 'a spread, which copies whatever it touches',
    pattern: /\.\.\./,
    sample: 'const copy = { ...entity, along: 0 };',
    innocent: 'const along = entity.along;',
  },
  {
    what: 'a template literal, which builds a string every time it is evaluated',
    pattern: /`/,
    sample: 'surface.label(`${score}`);',
    innocent: "surface.label('score');",
  },
  {
    what: 'JSON, which allocates on both sides',
    pattern: /\bJSON\.(parse|stringify)\s*\(/,
    sample: 'const snapshot = JSON.stringify(entity);',
    innocent: 'const snapshot = entity.along;',
  },
];

/**
 * Whether `src` imports anything from `module` that survives to runtime.
 *
 * ⚠️ **Type-only imports do NOT count, and that is a deliberate departure from
 * `docs/decisions/0015-the-layer-ladder.md`**, which refuses that exemption for the layer arrow. The
 * two rules are about different things. 0015 is about coupling, and a type is the coupling that
 * hurts. This is about whether a function can be CALLED during a frame, which is a runtime question
 * — `import type { Atlas }` in the canvas backend is not just permitted, it is required.
 */
function importsAtRuntime(src: string, module: string): boolean {
  for (const m of src.matchAll(/\bimport\s+([\s\S]*?)\s*from\s+['"]([^'"]*)['"]/g)) {
    if (!m[2]!.endsWith(module)) continue;
    const clause = m[1]!.trim();
    if (clause.startsWith('type ')) continue;
    const braced = /^\{([\s\S]*)\}$/.exec(clause);
    if (braced === null) return true; // a default or namespace import is always a runtime edge
    const specifiers = braced[1]!
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (specifiers.some((s) => !s.startsWith('type '))) return true;
  }
  return false;
}

/** Comments blanked but LINE NUMBERS preserved, so a `@setup` marker still lines up with its code. */
function stripKeepingLines(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(?<!:)\/\/.*$/gm, '');
}

/** `// @setup: reason` on the line above exempts a line, and the reason has to be a real one. */
const SETUP = /\/\/\s*@setup:\s*(.+)$/;

interface Offence {
  file: string;
  line: number;
  what: string;
  text: string;
}

/** Every banned allocation in a file, ignoring lines the line above exempts. */
function allocationsIn(file: string, source: string): Offence[] {
  const raw = source.split('\n');
  const code = stripKeepingLines(source).split('\n');
  const out: Offence[] = [];
  for (let i = 0; i < code.length; i++) {
    const marker = i > 0 ? SETUP.exec(raw[i - 1] ?? '') : null;
    if (marker && marker[1]!.trim().length >= 20) continue;
    for (const row of ALLOCATIONS) {
      if (row.pattern.test(code[i] ?? '')) out.push({ file, line: i + 1, what: row.what, text: (raw[i] ?? '').trim() });
    }
  }
  return out;
}

describe('nothing allocates in the frame loop', () => {
  it('no hot file allocates, outside a line that says why it may', () => {
    const offences = HOT_FILES.flatMap((f) => allocationsIn(f, read(f)));
    expect(
      offences.map((o) => `${o.file}:${o.line} — ${o.what}\n      ${o.text}`),
      'these run every frame and each one makes garbage.\n' +
        'GC pauses are the main source of jank in a browser game, and a shooter allocates hardest ' +
        'exactly when it can least afford to. The usual fixes: mutate a pooled object instead of ' +
        'building one, hoist the closure out of the loop, return numbers instead of a point.\n' +
        'If the line genuinely runs once at boot, mark it `// @setup: <why>` on the line above.',
    ).toEqual([]);
  });

  it('every hot file exists and is actually on the list', () => {
    // A path that has been renamed makes this whole describe scan nothing at all.
    for (const f of HOT_FILES) expect(read(f).length, `${f} is on the hot list and is empty or missing`).toBeGreaterThan(0);
    expect(HOT_FILES).toContain('src/render/scene.ts');
    expect(HOT_FILES).toContain('src/sim/entity.ts');
    expect(HOT_FILES, 'the file that IS the frame is not being scanned').toContain('src/app/frame.ts');
    expect(HOT_FILES, 'the blit that runs 500 times a frame is not being scanned').toContain('src/render/canvas.ts');
    expect(HOT_FILES, 'the densest loop in the game is not being scanned').toContain('src/sim/collide.ts');
  });

  it('says why each cold file next door to a hot one is cold', () => {
    // The list is the argument for the mount/frame split. A file that drops off it silently is a
    // file that started running every frame without anyone saying so.
    for (const [file, reason] of Object.entries(DELIBERATELY_COLD)) {
      expect(read(file).length, `${file} is named as cold and does not exist`).toBeGreaterThan(0);
      expect(reason.length, `${file} is exempt without a stated reason`).toBeGreaterThan(40);
      expect(HOT_FILES, `${file} is on both lists`).not.toContain(file);
    }
  });

  it('the frame cannot reach the baker', () => {
    // The rule the two lists exist to hold: whatever else changes, baking may not move into a frame.
    const reaching = HOT_FILES.filter((f) => importsAtRuntime(read(f), 'bake.ts'));
    expect(
      reaching,
      `these run every frame and can call the baker: ${reaching.join(', ')}.\n` +
        'Art is drawn once at load and blitted thereafter (0022). A frame that can bake is a frame ' +
        'that will, the first time someone needs a sprite in a colour they have not got.',
    ).toEqual([]);
  });
});

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE SCAN ABOVE FROM BEING DECORATIVE.
 *
 * The hot files are written to pass it, so it runs over clean code and reports nothing — which is
 * exactly what a broken pattern also does.
 */
describe('the allocation scan is known to work, not merely green', () => {
  it('every pattern matches the line it exists to catch', () => {
    for (const row of ALLOCATIONS) {
      expect(row.pattern.test(row.sample), `${row.what}: the pattern misses its own sample`).toBe(true);
    }
  });

  it('and leaves an innocent line alone', () => {
    for (const row of ALLOCATIONS) {
      expect(row.pattern.test(row.innocent), `${row.what}: the pattern fires on a line it must not`).toBe(false);
    }
  });

  it('finds an allocation planted in a hot file', () => {
    const planted = ['const a = 1;', 'const copy = { ...entity };', 'const b = 2;'].join('\n');
    const found = allocationsIn('planted.ts', planted);
    expect(found.length).toBe(1);
    expect(found[0]!.line).toBe(2);
  });

  it('ignores an allocation that is explained, and only when it is explained', () => {
    const explained = ['// @setup: built once at boot and mutated in place forever after', 'const c = new Thing();'];
    expect(allocationsIn('planted.ts', explained.join('\n'))).toEqual([]);

    const unexplained = ['// @setup: because', 'const c = new Thing();'];
    expect(allocationsIn('planted.ts', unexplained.join('\n')).length, 'a hand-wave got through as a reason').toBe(1);

    const unmarked = ['// built once at boot and mutated in place forever after', 'const c = new Thing();'];
    expect(allocationsIn('planted.ts', unmarked.join('\n')).length, 'a plain comment exempted a line').toBe(1);
  });

  it('reads code and not the prose that explains it', () => {
    // The house style names the banned things in the doc comments of the files that ban them.
    const commented = ['/** Never use JSON.stringify or a `template` here. */', 'const d = 1;'].join('\n');
    expect(allocationsIn('planted.ts', commented)).toEqual([]);
  });

  it('tells a runtime import of the baker from a type-only one', () => {
    // THE distinction the whole check rests on. Its first version banned both, which would have
    // forced the canvas backend to stop naming the type it is handed.
    expect(importsAtRuntime("import { bakeAtlas } from './bake.ts';", 'bake.ts')).toBe(true);
    expect(importsAtRuntime("import type { Atlas } from './bake.ts';", 'bake.ts')).toBe(false);
    expect(importsAtRuntime("import { type Atlas } from './bake.ts';", 'bake.ts')).toBe(false);
    expect(importsAtRuntime("import { type Atlas, bakeAtlas } from './bake.ts';", 'bake.ts')).toBe(true);
    expect(importsAtRuntime("import Baker from './bake.ts';", 'bake.ts')).toBe(true);
    expect(importsAtRuntime("import { paintScene } from './scene.ts';", 'bake.ts')).toBe(false);
  });

  it('keeps line numbers honest across a block comment', () => {
    const src = ['/*', ' * a comment', ' */', 'const e = new Thing();'].join('\n');
    expect(allocationsIn('planted.ts', src)[0]!.line).toBe(4);
  });
});

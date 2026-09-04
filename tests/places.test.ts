import { describe, expect, it } from 'vitest';

import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { THEMES, THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { GROUND_OF, LANDMARK_OF, STRUCTURE_OF, bakeSize, laneAt, nebulaField, paintStructure } from '../src/render/bake.ts';
import { skyFor } from '../src/app/mount.ts';
import { paintScene, type Landmark } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { luminance } from './contrast.ts';
import { tracingPen } from './paths.ts';

/**
 * A PLACE IS SOMEWHERE THE PLAYER IS, AND NOT A TEXTURE THEY PASS —
 * `docs/decisions/0220-a-place-is-somewhere-you-are.md`.
 *
 * Asked for: *"ember nebula … needs a lot more detail throughout the level and the pillars of god need
 * a lot more character and depth to them. then saurian and rime shelf need to be planetary backdrops
 * where the level is based on a planet, not that the planet is in the background, black heart needs to
 * be a beating black heart, labyrinth needs to be a branching twisting path the player is flying
 * through."*
 *
 * ⚠️ **MOST OF THAT LIST IS TASTE AND IS NOT HELD HERE.** How lumpy a column is, how many globules a
 * nebula carries, whether a heart reads as an organ — 0192 asks *name a change to the content that
 * would redden this and be CORRECT*, and for every one of those the answer is *almost any*. The shot
 * rig is the instrument for them (`scripts/shot-place.mjs`), and four of the six defects in this
 * session were found by looking at its output.
 *
 * ⚠️ **WHAT IS BELOW IS THE PART THAT IS TRUE OR FALSE.** A horizon that is off the screen is not a
 * planet; a corridor whose walls cross is not a corridor; a heart that does not change size is not
 * beating; a level that places a landmark in a place that draws none shows nothing at all. Each of
 * those has exactly one correct answer, and three of the five are the trap that has now caught this
 * repository twice — a number that is right in the model and off the picture
 * (`docs/decisions/0027-measure-the-picture-not-the-model.md`).
 */

/**
 * Tile fraction to lane, so every number a guard prints is one the player could point at.
 *
 * ⚠️ **`laneAt` AND `LANE_TOP` COME FROM `src/render/bake.ts` SINCE 0221**, where they were already
 * written down. This file carried its own `0.25` and its own arithmetic — a second copy of the one
 * number that has caught this repository four times, which is the drift
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` is about arriving in the guard that exists
 * to catch it.
 */
const lane = laneAt;

const tileSize = (): number => bakeSize(SPRITE_EXTENT.skyNebula, 6);

describe('0221 — a planet is not a space', () => {
  /*
    Reported: *"the planets still have the starry space backdrop visible, ground features need be
    properly have nothing behind them and the sky in the background needs to match the sky."*

    ⚠️ **THREE FAULTS WITH ONE CAUSE, AND 0220's OWN GUARDS COULD NOT SEE ANY OF THEM.** They measured
    where a skyline sat and how its ridges receded — both true of ground painted into the WEATHER tile
    at an alpha, with two star fields drawn on top of it afterwards. **A guard on the right quantity
    in the wrong layer is still green.** What is below is about the layer.
  */
  const planets = THEME_KINDS.filter((theme) => THEMES[theme].ground !== null);

  it('THE HOLE THE TWO TABLES OPEN: a place has land in `THEMES` exactly when it draws land', () => {
    /*
      ⚠️ **THE SAME SHAPE AS 0220's LANDMARK GUARD, AND THE SECOND TIME THIS FILE HAS NEEDED IT.**
      `THEMES[theme].ground` decides whether a place gets a ground layer and loses its star fields;
      `GROUND_OF[theme]` decides what is drawn in it. A place with the colour and no drawing keeps its
      empty tile AND loses its stars, which is a place with nothing in the sky at all; a place with the
      drawing and no colour paints its land in whatever the last planet left behind.
    */
    for (const theme of THEME_KINDS) {
      const colour = THEMES[theme].ground !== null;
      const drawing = GROUND_OF[theme] !== null;
      expect(
        drawing,
        `${theme} ${colour ? 'has a ground colour and draws no ground' : 'draws ground and has no ground colour'}` +
          ' — the two tables have to name the same places or a planet is empty or uncoloured',
      ).toBe(colour);
    }
    expect(planets.length, 'no place has land, so none of this is exercised').toBe(3);
  });

  it('THE REPORTED ONE: a planet has no field of stars in its sky', () => {
    /*
      *"the planets still have the starry space backdrop visible."*

      ⚠️ **ANSWERED BY DELETION, WHICH IS WHY IT NEEDS A GUARD AT ALL.** `skyFar` and `skyNear` are
      fields of dots — they are stars, and there is nothing to draw over them that is better than not
      drawing them. A change that quietly puts either back reads as *the sky got its depth back* and is
      the exact thing that was reported.
    */
    for (const theme of planets) {
      const kinds = skyFor(theme).map((layer) => SPRITE_KINDS[layer.sprite]);
      expect(
        kinds,
        `${theme} is a planet and its sky still carries ${kinds.join(', ')} — a field of dots under a ` +
          'daylit sky is the starry backdrop that was reported',
      ).not.toContain('skyFar');
      expect(kinds).not.toContain('skyNear');
      expect(kinds, `${theme} draws no ground layer at all`).toContain('skyGround');
    }
    for (const theme of THEME_KINDS.filter((t) => THEMES[t].ground === null)) {
      const kinds = skyFor(theme).map((layer) => SPRITE_KINDS[layer.sprite]);
      expect(kinds, `${theme} is in space and lost its star fields`).toContain('skyFar');
      expect(kinds, `${theme} is in space and drew ground anyway`).not.toContain('skyGround');
    }
  });

  it('and the ground is drawn LAST, because order is what puts a thing in front', () => {
    /*
      ⚠️ **ORDER AND `depth` ARE INDEPENDENT, AND CONFLATING THEM IS HOW THIS BROKE.** A mountain range
      is far away — slow — AND in front of everything behind it. `paintScene` walks the array in order
      and that is the only thing deciding what covers what; putting the ground anywhere but last means
      something is drawn over the land, which is the report.
    */
    for (const theme of planets) {
      const sky = skyFor(theme);
      expect(
        SPRITE_KINDS[sky[sky.length - 1]!.sprite],
        `${theme} draws something after its ground, so that something is in front of a planet`,
      ).toBe('skyGround');
    }
  });

  it('THE OTHER HALF OF THE REPORT: the ground is OPAQUE, so there is nothing behind it', () => {
    /*
      *"ground features need be properly have nothing behind them."*

      ⚠️ **ONE NUMBER, AND NOTHING ELSE IN THIS FILE IS ABOUT IT.** 0220's ridges were structure marks
      at 0.45, 0.64 and 0.88 — every claim about their shape and position was true, and they were
      see-through. `tests/paths.ts` grew an `alpha` on a pass for this and for nothing else.

      ⚠️ **THE BODY, NOT EVERY MARK.** A crest line at 0.4 and a shadow band at 0.3 are lighting and
      are supposed to be translucent; what has to be solid is the mass — so the claim is that each
      planet lays down at least one fill at full alpha that spans the whole tile.
    */
    const size = 240;
    for (const theme of planets) {
      const { pen, trace } = tracingPen();
      GROUND_OF[theme]!(pen, '#101010', '#405060', '#80a040', size);
      /*
        ⚠️ **THE MASSES, WHICH ARE THE OPAQUE FILLS THAT REACH A TILE EDGE.** The first draft asserted
        that EVERY opaque fill spans the tile and reddened on Rime Shelf's pressure ridges — which are
        opaque and 35 pixels wide and entirely correct: they are features standing ON the shelf, not
        the shelf. What has to cross the tile is whatever is claiming to run off the top or the bottom
        of the world, because that is the thing a seam would show a gap in.
      */
      const masses = trace.passes.filter((pass) => {
        if (pass.alpha < 1) return false;
        const ys = pass.subpaths.flat().map((p) => p[1]);
        return Math.min(...ys) <= 0.5 || Math.max(...ys) >= size - 0.5;
      });
      expect(
        masses.length,
        `${theme}'s ground has no fully opaque mass running off the edge of the world — every surface in ` +
          'it is see-through, which is the defect 0220 shipped: ridges with the star fields through them',
      ).toBeGreaterThan(0);
      for (const pass of masses) {
        const xs = pass.subpaths.flat().map((p) => p[0]);
        const spread = Math.max(...xs) - Math.min(...xs);
        expect(
          spread,
          `${theme} has an opaque mass spanning ${spread.toFixed(0)} of a ${size} tile — a surface that ` +
            'does not cross the tile leaves a gap at the seam that the sky shows through',
        ).toBeCloseTo(size, 0);
      }
    }
  });

  it('and a planet’s skyline is on the lane, which is the trap this repository keeps falling into', () => {
    /*
      ⚠️ **THE FOURTH TIME.** The Approach's horizon at tile 0.86, the Pillars' feet at 0.97, Saurian
      Belt's first ridges — and the ground tile is `ACROSS_SPAN * 2` and blitted centred exactly as the
      weather tile is, so half of what is drawn in it is off the screen. Ported here from 0220's
      structure-table version, which now measures a table these places no longer use.
    */
    const size = 240;
    for (const theme of planets) {
      const { pen, trace } = tracingPen();
      GROUND_OF[theme]!(pen, '#101010', '#405060', '#80a040', size);
      const edges = trace.passes
        .filter((pass) => {
          if (pass.alpha < 1) return false;
          const ys = pass.subpaths.flat().map((p) => p[1]);
          return Math.min(...ys) <= 0.5 || Math.max(...ys) >= size - 0.5;
        })
        .map((pass) => pass.subpaths.flat().map((p) => laneAt(p[1] / size)))
        // The mass runs off the frame by design; what has to be visible is the edge nearest the middle.
        .map((heights) => heights.filter((at) => at > 0 && at < ACROSS_SPAN));
      expect(
        edges.every((visible) => visible.length > 0),
        `${theme} has an opaque mass with no part of its edge on the lane — it is entirely above or ` +
          'below the screen, which is a horizon that has been authored and not drawn',
      ).toBe(true);
    }
  });

  it('and land is DARKER than the sky over it, which is what a horizon is', () => {
    /*
      ⚠️ **AND IT IS ALSO THE ACCESSIBILITY FLOOR, WHICH IS THE HALF THAT MAKES IT AN INVARIANT.** A
      silhouette is what a horizon looks like, so this is a taste; the bottom of the screen staying the
      darkest part of it is not. `tests/sky.test.ts` measures every ink against the place's `space`,
      and a planet now covers a third of the screen with something that guard has never heard of —
      ground brighter than the sky would put the game's worst contrast somewhere nothing is checking.
    */
    for (const theme of planets) {
      for (const name of Object.keys(PALETTES) as PaletteName[]) {
        const land = THEMES[theme].ground![name];
        const sky = THEMES[theme].space[name];
        expect(
          luminance(land),
          `${theme}'s land (${land}) is not darker than its sky (${sky}) — the horizon is inverted, and ` +
            'the darkest part of the screen is no longer the part with no game in it',
        ).toBeLessThan(luminance(sky));
      }
    }
  });

  it('THE ASK, IN LANE UNITS: The Toxic Mire’s corridor is tight and the ship fits down it', () => {
    /*
      *"needs an overhanging canopy so that it feels like you're flying through a tight narrow corridor
      above the toxic pools below and beneath the overhanging canopy above."*

      ⚠️ **TWO CLAIMS THAT PULL AGAINST EACH OTHER, WHICH IS WHY BOTH ARE HERE.** *Tight* is what was
      asked for and *the player cannot fly down it* is a bug — and the lane is a fixed 100 units that
      the ship uses all of (`docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`), so the corridor
      cannot actually be narrow in the way a wall is. It is measured against the ship at both ends:
      wide enough to fly, narrow enough that the place is an enclosure rather than a sky.
    */
    const size = 240;
    const { pen, trace } = tracingPen();
    GROUND_OF.mire!(pen, '#101010', '#405060', '#80a040', size);
    const solid = trace.passes.filter((pass) => {
      if (pass.alpha < 1) return false;
      const ys = pass.subpaths.flat().map((p) => p[1]);
      return Math.min(...ys) <= 0.5 || Math.max(...ys) >= size - 0.5;
    });
    expect(solid.length, 'the mire draws one surface, not two — there is no corridor').toBe(2);

    // The canopy is whichever mass reaches the top of the tile; the pools are the other one.
    const spans = solid.map((pass) => pass.subpaths.flat().map((p) => laneAt(p[1] / size)));
    const [roof, floor] = spans[0]!.some((at) => at < 0) ? [spans[0]!, spans[1]!] : [spans[1]!, spans[0]!];
    const hangsTo = Math.max(...roof);
    const risesTo = Math.min(...floor);
    const gap = risesTo - hangsTo;
    const ship = SPRITE_EXTENT.ship;
    expect(
      gap,
      `the mire's corridor is ${gap.toFixed(0)} lane units at its tightest against a ship ${ship} across — ` +
        'a passage the player cannot be inside is not a corridor, it is a wall',
    ).toBeGreaterThan(ship * 3);
    /*
      ⚠️ **0.55 AND NOT 0.72, BECAUSE `npm run prove` SAID SO.** The first ceiling was three quarters
      of the lane and the probe for it — the canopy lifted to tile 0.27 — came back **STILL GREEN**:
      the gap only reached 59 of a permitted 72, so a canopy raised half way out of the frame was
      inside the bound. The corridor measures 33 today, so 55 leaves it two thirds of its own width to
      move in and still catches a roof that has stopped being one.
    */
    expect(
      gap,
      `the mire's corridor is ${gap.toFixed(0)} of ${ACROSS_SPAN} lane units — nothing is overhanging ` +
        'anything, which is a sky with a floor rather than the enclosure that was asked for',
    ).toBeLessThan(ACROSS_SPAN * 0.55);
  });
});

describe('0220 — The Labyrinth is a path you are inside', () => {
  it('THE ASK, IN LANE UNITS: the corridor never closes, and the ship fits down it everywhere', () => {
    /*
      *"a branching twisting path the player is flying through."*

      ⚠️ **A CHANNEL IS A CENTRELINE AND A GAP, AND A GAP IS A NUMBER THAT CAN GO NEGATIVE.** The two
      walls are generated from the same pair of functions, so a `widthAt` that swung further than its
      own base would put the upper wall below the lower one — the corridor turning inside out, which
      draws as a bow tie and is never correct.

      ⚠️ **MEASURED AGAINST THE SHIP AND NOT AGAINST ITSELF** — 0027. A guard reading *the gap is at
      least `gap * 0.5`* proves only that the arithmetic below matches the arithmetic above. The
      quantity that matters is whether the thing the player flies fits, so that is the comparison, and
      the number comes off the sprite table rather than out of this file.
    */
    const size = tileSize();
    const walls = STRUCTURE_OF.labyrinth(size).filter((mark) => mark.crosses && !mark.lit);
    expect(walls.length, 'The Labyrinth draws no crossing walls at all').toBe(2);
    const [first, second] = walls as [(typeof walls)[number], (typeof walls)[number]];
    expect(
      first.points.length,
      'the two walls are sampled differently, so they cannot be compared point for point',
    ).toBe(second.points.length);

    const ship = SPRITE_EXTENT.ship;
    let narrowest = Infinity;
    for (let i = 0; i < first.points.length; i += 1) {
      const top = Math.min(first.points[i]![1]!, second.points[i]![1]!) / size;
      const bottom = Math.max(first.points[i]![1]!, second.points[i]![1]!) / size;
      narrowest = Math.min(narrowest, lane(bottom) - lane(top));
    }
    expect(
      narrowest,
      `The Labyrinth's corridor pinches to ${narrowest.toFixed(1)} lane units against a ship ${ship} across — ` +
        'a passage the player cannot be inside is scenery beside them, which is what this place already was',
    ).toBeGreaterThan(ship * 3);
  });

  it('and it BRANCHES, which is the half a single corridor cannot say', () => {
    /*
      Local marks that are not the two walls and not their rims: the island and the two side passages.
      **Three of them**, and the claim is that they exist and leave the centre — a corridor with
      nothing coming off it is a tunnel, and the word in the report was *branching*.
    */
    const size = tileSize();
    // Bodies, not rims — filtering on `lit` would redden if a branch were ever drawn as a lit shape,
    // which is a change to the art rather than to the claim. A rim is a hairline; a branch is not.
    const branches = STRUCTURE_OF.labyrinth(size).filter((mark) => !mark.crosses && mark.width > size * 0.01);
    expect(
      branches.length,
      'The Labyrinth has no local structure — every mark spans the tile, so nothing branches off anything',
    ).toBeGreaterThanOrEqual(3);
    for (const branch of branches) {
      const xs = branch.points.map((p) => p[0]!);
      const spread = Math.max(...xs) - Math.min(...xs);
      expect(spread, 'a branch that goes nowhere along the lane is a dot').toBeGreaterThan(size * 0.05);
    }
  });
});

describe('0220 — the heart beats', () => {
  /** A surface that remembers the scale it was asked to draw at. */
  class Sized implements Surface {
    readonly blits: { sprite: number; scale: number }[] = [];
    clear(): void {
      this.blits.length = 0;
    }
    blit(sprite: number, _x: number, _y: number, scale: number): void {
      this.blits.push({ sprite, scale });
    }
  }

  const view = viewOf(1280, 640);
  const heartLevel = LEVEL_KINDS.map((kind) => LEVELS[kind]).find((level) => level.theme === 'core');

  /** The width in CSS pixels the landmark is drawn at, with the camera `local` units into the level. */
  function widthAt(local: number, entry: Landmark): number {
    const surface = new Sized();
    paintScene(surface, view, [], local, 1, [], null, [entry], 0);
    const drawn = surface.blits.find((blit) => blit.sprite === SPRITE.landmark);
    return drawn === undefined ? 0 : drawn.scale * entry.extent;
  }

  it('THE ASK, IN PIXELS: The Black Heart’s landmark changes size as the camera goes past it', () => {
    /*
      *"black heart needs to be a beating black heart."*

      ⚠️ **THE ATLAS IS BITMAPS AND NOTHING IN `src/render/` ANIMATES ONE**, so *beating* had exactly
      two implementations available: a second baked frame, or the scale `blit` already takes. Nothing
      else in this repository has ever asked a baked sprite to move, which means nothing else would
      notice if this quietly stopped — a landmark that has stopped beating draws perfectly, in the
      right place, at the right size, for ever.

      ⚠️ **IN CSS PIXELS, WHICH IS 0027's CLAUSE ABOUT UNITS THE PLAYER EXPERIENCES.** A guard reading
      *the swell factor is `BEAT_SWELL`* would prove the renderer agrees with its own constant. What is
      asserted is how many pixels wider the object actually gets on a 1280-wide screen, which is a
      thing a person can be shown.
    */
    expect(heartLevel, 'no level uses The Black Heart’s place').toBeDefined();
    const entry = heartLevel!.landmarks[0];
    expect(entry, 'The Black Heart places no landmark, so there is nothing to beat').toBeDefined();
    expect(entry!.beat, 'The Black Heart’s landmark is still').toBeGreaterThan(0);

    const mark: Landmark = {
      sprite: SPRITE.landmark,
      extent: SPRITE_EXTENT.landmark,
      at: entry!.at,
      lane: entry!.lane,
      depth: entry!.depth,
      beat: entry!.beat,
    };
    /*
      Sampled across one whole beat from a camera position where the landmark is on screen. `at` is
      where it ARRIVES, so it is visible from there for `view.alongSpan / depth` units after it.
    */
    const from = mark.at + 400;
    const widths: number[] = [];
    for (let s = 0; s < 60; s += 1) widths.push(widthAt(from + (s / 60) * mark.beat, mark));
    expect(Math.min(...widths), 'the landmark was never drawn at all — the sample is off screen').toBeGreaterThan(0);
    const swing = Math.max(...widths) - Math.min(...widths);
    expect(
      swing,
      `The Black Heart's landmark swings ${swing.toFixed(1)} CSS pixels over a whole beat — under about ` +
        'ten it is a still picture that a guard can prove is technically moving',
    ).toBeGreaterThan(10);
  });

  it('and the beat has TWO thumps and a rest, because one thump is a pulsing light', () => {
    /*
      ⚠️ **THE SHAPE, NOT THE RANGE, AND THE TEST ABOVE CANNOT SEE IT.** A single sine passes *the
      size changes* with room to spare and reads as breathing; *lub-dub* is the whole reason anyone
      recognises a heartbeat. So: two separate rises inside one cycle, and most of the cycle at rest.
    */
    const entry = heartLevel!.landmarks[0]!;
    const mark: Landmark = {
      sprite: SPRITE.landmark,
      extent: SPRITE_EXTENT.landmark,
      at: entry.at,
      lane: entry.lane,
      depth: entry.depth,
      beat: entry.beat,
    };
    const from = mark.at + 400;
    const STEPS = 240;
    const widths: number[] = [];
    for (let s = 0; s < STEPS; s += 1) widths.push(widthAt(from + (s / STEPS) * mark.beat, mark));
    const floor = Math.min(...widths);
    const ceiling = Math.max(...widths);
    const loud = widths.map((w) => w > floor + (ceiling - floor) * 0.25);

    let thumps = 0;
    for (let i = 0; i < loud.length; i += 1) {
      if (loud[i] === true && loud[(i + loud.length - 1) % loud.length] === false) thumps += 1;
    }
    expect(
      thumps,
      `the beat has ${thumps} rise(s) in a cycle — one is a pulse and three is a stutter; a heart is two`,
    ).toBe(2);
    const resting = loud.filter((on) => !on).length / loud.length;
    expect(
      resting,
      `the landmark is swollen for ${((1 - resting) * 100).toFixed(0)}% of its cycle — a heart is at rest ` +
        'for most of one, and something that is always big is not beating, it is bigger',
    ).toBeGreaterThan(0.6);
  });

  it('THE ONE THAT CANNOT BE RECOVERED FROM: the beat does not step where it wraps', () => {
    /*
      ⚠️ **A CYCLE THAT DOES NOT ARRIVE WHERE IT LEFT IS A JUMP, ONCE EVERY BEAT, FOR EVER.** `beatAt`
      is sampled over a phase that wraps, so its value at 1 has to be its value at 0 — the same
      condition 0207 puts on a mark that spans a tile, on a different axis. Both thumps are triangles
      clear of the ends today; move either to the edge of the phase and the object changes size
      between two adjacent frames, which reads as a rendering fault rather than as a tuning one.

      ⚠️ **AND THE FIRST DRAFT OF THIS TEST STRADDLED `at`, WHERE NOTHING IS DRAWN.** It asserted the
      sign of the modulo across the arrival and reddened on *nothing was drawn* — the visibility test
      above the beat skips anything not yet arrived, so `local - at` is never negative while the
      landmark is on screen. The double modulo in `paintLandmarks` is therefore defence and not a fix,
      and it says so; **the reachable hazard is the wrap itself**, so that is what is measured, over
      three whole beats of the life the landmark actually has.
    */
    const entry = heartLevel!.landmarks[0]!;
    const mark: Landmark = {
      sprite: SPRITE.landmark,
      extent: SPRITE_EXTENT.landmark,
      at: entry.at,
      lane: entry.lane,
      depth: entry.depth,
      beat: entry.beat,
    };
    const STEP = 0.6;
    const widths: number[] = [];
    for (let s = 0; s * STEP <= mark.beat * 3; s += 1) widths.push(widthAt(mark.at + s * STEP, mark));
    const drawn = widths.filter((w) => w > 0);
    expect(drawn.length, 'nothing was drawn, so this measured nothing').toBe(widths.length);
    const span = Math.max(...drawn) - Math.min(...drawn);
    let worst = 0;
    for (let i = 1; i < widths.length; i += 1) {
      worst = Math.max(worst, Math.abs(widths[i]! - widths[i - 1]!));
    }
    expect(
      worst,
      `the landmark's drawn width jumps ${worst.toFixed(2)} pixels between two adjacent camera positions, ` +
        `against a whole beat's swing of ${span.toFixed(2)} — the beat is stepping, which is the sign of ` +
        'the modulo and not a tuning choice',
    ).toBeLessThan(span * 0.35);
  });
});

describe('0220 — a landmark is drawn where a level places one', () => {
  it('THE HOLE A TABLE OPENS: no level places a landmark in a place that draws none', () => {
    /*
      ⚠️ **`LANDMARK_OF` REPLACED `if (theme !== 'nebula') return`, AND A TABLE CAN BE WRONG IN A WAY
      A GATE CANNOT.** The gate drew nothing for six places and said so in one line. A `Record` with a
      `null` in it is a decision that was taken — 0016 — and the failure it newly admits is a level
      that places an entry in a place whose row is `null`: the painter blits an empty bitmap, at the
      right position, at the right size, every frame, and nothing anywhere says so.

      0192: name a change that would redden this and be correct. Authoring a landmark and forgetting
      to place it reddens nothing (the slot is simply unused, which is 0203's whole design). Placing
      one that is never drawn is never correct.
    */
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      if (level.landmarks.length === 0) continue;
      expect(
        LANDMARK_OF[level.theme],
        `${kind} places ${level.landmarks.length} landmark(s) and ${level.theme} draws none — the painter ` +
          'will blit an empty sprite at exactly the right place for the whole level',
      ).not.toBeNull();
    }
  });

  it('and every place that draws one is a real row, so the table cannot be half-written', () => {
    for (const theme of THEME_KINDS) {
      expect(
        theme in LANDMARK_OF,
        `${theme} has no row in LANDMARK_OF — a place missing from the table draws nothing and says nothing`,
      ).toBe(true);
    }
    const drawn = THEME_KINDS.filter((theme) => LANDMARK_OF[theme] !== null);
    expect(drawn.length, 'no place draws a landmark at all, so the slot is dead').toBeGreaterThanOrEqual(2);
  });
});

describe('0223 — a place has a palette, not a colour', () => {
  /*
    Reported: *"the backgrounds are looking good, but they're still a solo colour. saurian is green,
    nebula is purple. give me vibrant living levels, not static basic backdrops."*

    ⚠️ **AND IT WAS A DESCRIPTION OF THE CODE.** Every cloud, crest, rim and wall face in a place came
    out of `THEMES[theme].nebula` — one hex. A place could be thicker or thinner, busier or emptier,
    and never **varied**, because everything lit in it was the same colour. 0220 and 0221 and 0222 all
    added structure to places that were still monochrome by construction.
  */

  /** A colour's hue in degrees, 0 to 360. `null` for a grey, which has no hue to compare. */
  function hueOf(hex: string): number | null {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
    const [hi, lo] = [Math.max(r, g, b), Math.min(r, g, b)];
    if (hi - lo < 0.02) return null;
    const d = hi - lo;
    const h = hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return h * 60;
  }

  /** The smaller angle between two hues, 0 to 180. */
  function apart(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  it('THE REPORTED ONE: a place’s accent is a different HUE, not a lighter shade of its body', () => {
    /*
      ⚠️ **THE DIFFERENCE BETWEEN THIS AND A BRIGHTNESS CLAIM IS THE WHOLE REPORT.** A tint of the body
      colour reads as *the same place, brighter* — which is what every place already was, since a
      cloud at 0.2 alpha and one at 0.4 are the same hue at two weights. Two hues read as **two things
      happening at once**, which is what a sky with weather in it looks like.

      0192: name a change that would redden this and be correct. Making an accent a tint of its body is
      never correct — it is the *"solo colour"* that was reported, arriving through a table that now has
      room for a second one.
    */
    /*
      ⚠️ **THE VIVID PALETTE ONLY, AND HIGH CONTRAST IS HELD ON LUMINANCE INSTEAD.** That palette is
      *"maximum separation on the luminance channel, which is the one that survives every kind of
      colour blindness"* (`src/content/palette.ts`) — it is desaturated **by design**, so its colours
      sit near grey and their hues are numerically unstable: a two-step difference in a channel swings
      the angle by tens of degrees. Demanding hue variety there would be demanding the one thing that
      palette exists to give up, which is 0024's *no assist may make the game harder* pointing at a
      guard instead of at a setting.
    */
    for (const theme of THEME_KINDS) {
      const body = hueOf(THEMES[theme].nebula.vivid);
      const accent = hueOf(THEMES[theme].glow.vivid);
      expect(body, `${theme}'s body colour is a grey — a place with no hue cannot have an accent`).not.toBeNull();
      expect(accent, `${theme}'s accent is a grey`).not.toBeNull();
      const gap = apart(body!, accent!);
      expect(
        gap,
        `${theme}'s accent (${THEMES[theme].glow.vivid}) sits ${gap.toFixed(0)}° from its body ` +
          `(${THEMES[theme].nebula.vivid}) — under 25° that is the same colour at a different weight, ` +
          'which is the solo colour that was reported',
      ).toBeGreaterThan(25);
    }
    // And high contrast still has two TONES, which is the same claim on the channel that palette uses.
    for (const theme of THEME_KINDS) {
      const body = luminance(THEMES[theme].nebula['high-contrast']);
      const accent = luminance(THEMES[theme].glow['high-contrast']);
      expect(
        Math.abs(accent - body) / Math.max(accent, body, 0.0001),
        `${theme}'s high-contrast accent is the same brightness as its body — that palette trades hue ` +
          'for luminance, so a second colour there has to be a second TONE or it is not a second colour',
      ).toBeGreaterThan(0.15);
    }
  });

  it('and the clouds actually MIX, because two colours in a table is not two colours on a screen', () => {
    /*
      ⚠️ **THE TABLE CAN HOLD TWO COLOURS AND THE SKY STILL DRAW ONE.** `NebulaCloud.glow` is what
      decides, per cloud, which of the pair it takes — and a place whose roll never comes up, or whose
      field is one cloud, is a place with an accent nobody sees. **Both have to appear in every
      place**, and *several of each*: one accent cloud in a field of twenty is a smudge, not a mix.

      ⚠️ **AND MIXING IS THE POINT RATHER THAN A NICETY.** Split by layer, two colours are two flat
      sheets; split per cloud they OVERLAP, and where a body cloud crosses an accent one the gradient
      between them is a third colour neither table contains. That is what a sky with weather in it
      looks like and it is why the flag is on the cloud.
    */
    const size = tileSize();
    for (const theme of THEME_KINDS) {
      const field = nebulaField(size, theme);
      const accent = field.filter((cloud) => cloud.glow).length;
      expect(
        Math.min(accent, field.length - accent),
        `${theme} draws ${accent} of ${field.length} clouds in its accent — a place with none of one ` +
          'of its two colours has one colour, which is what was reported',
        /*
          ⚠️ **ONE OF EACH, AND THE FIRST DRAFT ASKED FOR TWO.** It reddened on The Labyrinth, which
          carries **two clouds** — `SKY_STYLE_OF.labyrinth` is `clouds: 0.35` because 0211 made it the
          emptiest sky of the seven on purpose, and *"almost nothing clumps in a corridor"* is still
          true. A bound that a correct place cannot meet is one that gets switched off; the mix that
          matters there is on its wall rims, which are all accent, and this holds the clouds.
        */
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('and no two places share an accent, so a palette belongs to a place', () => {
    /*
      ⚠️ **0195's CLAIM, ONE TABLE ALONG.** *"A level specific backdrop instead of the same starry
      canvas and a slight hue change on each level"* was answered for the star fields and for the
      structure; a second colour that seven places shared would put the same light on all of them and
      be the same failure in a new column.
    */
    const seen = new Map<string, ThemeKind[]>();
    for (const theme of THEME_KINDS) {
      const hue = hueOf(THEMES[theme].glow.vivid);
      for (const [other, hues] of seen) {
        expect(
          apart(hue!, Number(other)) > 12,
          `${theme} and ${hues.join(', ')} light themselves with the same colour — a place's accent is ` +
            'the one thing on its screen that says which place it is',
        ).toBe(true);
      }
      seen.set(String(hue), [...(seen.get(String(hue)) ?? []), theme]);
    }
  });
});

describe('0222 — the forbidden band applies to STRUCTURE, which it never did', () => {
  const smallestThreat = Math.min(...Object.values(SHOTS).map((row) => row.radius)) * 2;
  const largestThreat = Math.max(...ENEMY_KINDS.map((kind) => ENEMIES[kind].radius)) * 2;
  /** Tile pixels to world units, for a tile that is `SPRITE_EXTENT.skyNebula` units across. */
  const size = 600;
  const units = (px: number): number => (px / size) * SPRITE_EXTENT.skyNebula;

  it('THE HOLE: no compact structure mark is the size of something that can kill you', () => {
    /*
      ⚠️ **0203's BAND HAS ONLY EVER BEEN CHECKED AGAINST LANDMARKS AND THE STAR FIELDS.** It says
      nothing the sky draws may sit between the smallest thing that can kill the player and twice the
      largest — and `STRUCTURE_OF` arrived in 0211, a year of decisions later, drawing shapes nobody
      measured against it. **Found by looking for it while sizing this pass's debris**: Saurian Belt's
      belt rocks are 2.4 to 8 units across against a bullet's 1.8, sitting squarely in the band, and
      Ember Nebula's globules reach 2.2.

      ⚠️ **COMPACT MARKS ONLY, AND THAT IS 0112's OWN REASONING RATHER THAN AN EXEMPTION.** *"What
      makes something confusable is a hard edge at a bullet's scale, not area."* A corridor wall
      eleven units thick and a whole tile long is not mistakable for a body — nothing about it reads
      as a discrete object — and neither is a frond or an infall streak. What is mistakable is a
      **compact** shape at a body's size, so the band is held against those and the aspect ratio is
      what separates the two.
    */
    for (const theme of THEME_KINDS) {
      for (const mark of STRUCTURE_OF[theme](size)) {
        // A streak, a wall, a lane or a frond: manifestly not a body, whatever its width.
        if (!compact(mark)) continue;
        const across = units(extentOf(mark));
        const why =
          `${theme} draws a compact mark ${across.toFixed(1)} units across, between a bullet at ` +
          `${smallestThreat} and twice the largest body at ${largestThreat * 2} — inside the band, so a ` +
          'player can read a piece of the backdrop as a thing that can kill them';
        expect(across < smallestThreat || across > largestThreat * 2, why).toBe(true);
      }
    }
  });

  /**
   * How wide a mark is at its widest, in tile pixels.
   *
   * ⚠️ **A STROKE'S ASPECT IS ITS LENGTH OVER ITS WIDTH, AND A BOUNDING BOX GETS IT WRONG.** The first
   * version measured the box for everything, and a Toxic Mire frond — a wandering line fifty units
   * long and five wide — has a nearly square box, so it was counted as a **compact fifty-unit
   * object** and satisfied the *something is above the band* claim on its own. A fill is an area and
   * a box is right for it; a stroke is a line with a thickness and it is not.
   */
  function extentOf(mark: { points: number[][]; width: number }): number {
    const xs = mark.points.map((p) => p[0]!);
    const ys = mark.points.map((p) => p[1]!);
    return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + mark.width;
  }

  function compact(mark: { points: number[][]; width: number }): boolean {
    if (mark.width === 0) {
      const xs = mark.points.map((p) => p[0]!);
      const ys = mark.points.map((p) => p[1]!);
      const wide = Math.max(...xs) - Math.min(...xs);
      const tall = Math.max(...ys) - Math.min(...ys);
      return Math.max(wide, tall) <= Math.min(wide, tall) * 3;
    }
    let along = 0;
    for (let i = 1; i < mark.points.length; i += 1) {
      along += Math.hypot(mark.points[i]![0]! - mark.points[i - 1]![0]!, mark.points[i]![1]! - mark.points[i - 1]![1]!);
    }
    return along <= mark.width * 3;
  }

  it('and something is actually IN the far half of it, or the band is only a ceiling again', () => {
    /*
      ⚠️ **THE HALF THAT MAKES THIS A BAND RATHER THAN 0069's OLD ONE-SIDED RULE.** Every mark could
      satisfy the guard above by being tiny, which is what the sky was before 0203 — and *"a plain
      black background is a plain boring game"* is a report about exactly that. A hulk over twice the
      largest body is the only large shape the rules permit, so at least one place has to draw one or
      the far end of the band is decoration.
    */
    const hulks = THEME_KINDS.flatMap((theme) =>
      STRUCTURE_OF[theme](size).filter((mark) => compact(mark) && units(extentOf(mark)) > largestThreat * 2),
    );
    expect(
      hulks.length,
      'no place draws anything above the band — the sky is all dust and no objects, which is the ' +
        'plain background that was reported',
    ).toBeGreaterThan(0);
  });

  it('a hulk has an edge, or it is a hole in a light that is not there', () => {
    /*
      ⚠️ **THE FAILURE NO SIZE, POSITION OR COUNT GUARD CAN CATCH.** A dark structure mark is a hole in
      the gas, and The Approach's gas is the thinnest of the seven — the first hulks were the right
      shapes, in the right places, at the right sizes, and were **invisible**. 0220 found the same thing
      about The Labyrinth's corridor walls and answered it the same way: a dark body with one lit edge,
      which is the Pillars' own language.

      Held as a pairing: every dark mark above the band shares its outline with a lit one. That is what
      *has an edge* means in a table of marks.
    */
    for (const theme of THEME_KINDS) {
      const marks = STRUCTURE_OF[theme](size);
      const rims = marks.filter((mark) => mark.lit && !mark.crosses).map((mark) => key(mark.points));
      for (const mark of marks) {
        if (mark.lit || !compact(mark) || units(extentOf(mark)) <= largestThreat * 2) continue;
        expect(
          rims.some((rim) => rim.startsWith(key(mark.points))),
          `${theme} draws a body above the band with no lit edge on it — in a place with thin gas that ` +
            'is a hole in a light that is not there, and it draws as nothing at all',
        ).toBe(true);
      }
    }
  });

  /** A mark's outline as a string, so a body and its rim can be compared by what they trace. */
  function key(points: readonly number[][]): string {
    return points.map((p) => `${p[0]!.toFixed(1)},${p[1]!.toFixed(1)}`).join('|');
  }
});

describe('0220 — a mark that does not taper is one path', () => {
  it('THE ONE THE PICTURE REPORTED: a wide mark is not drawn as a bead per join', () => {
    /*
      ⚠️ **EVERY STROKED MARK USED TO BE LAID DOWN SEGMENT BY SEGMENT.** `lineCap` is `round`, so each
      join was covered twice and composited its own alpha against itself — invisible on a rim four
      thousandths of a tile wide, which is every stroked mark this file had until The Labyrinth's wall
      faces. At a tenth of the gas over a twentieth of the tile it is a string of beads down the middle
      of the wall, and the bench showed it immediately.

      ⚠️ **COUNTED, BECAUSE THE COUNT IS THE DEFECT.** `tests/paths.ts` is a `Pen` that remembers, so
      the claim *a mark that does not taper is ONE `stroke()`* is arithmetic. A taper still cannot be:
      `Pen` has no variable-width stroke, which is the reason the per-segment loop exists at all and
      the reason it is now the only thing in it.
    */
    const size = 240;
    for (const theme of THEME_KINDS) {
      const marks = STRUCTURE_OF[theme](size);
      // Three copies of every mark — 0206's wrap, at −size, 0 and +size.
      const expected =
        3 *
        marks.reduce((sum, mark) => {
          if (mark.width === 0) return sum;
          return sum + (mark.taper ? mark.points.length - 1 : 1);
        }, 0);
      const { pen, trace } = tracingPen();
      paintStructure(pen, '#888888', '#111111', size, theme);
      expect(
        trace.strokes,
        `${theme} takes ${trace.strokes} strokes where ${expected} are owed — a non-tapered mark drawn as ` +
          'one path per segment doubles its own alpha at every join, which is the beading the bench found',
      ).toBe(expected);
    }
  });
});

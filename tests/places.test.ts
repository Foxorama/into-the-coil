import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { LANDMARK_OF, STRUCTURE_OF, bakeSize, paintStructure } from '../src/render/bake.ts';
import { paintScene, type Landmark } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
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

/** The top of the band the player can see — the weather tile is twice the lane and drawn centred. */
const LANE_TOP = 0.25;

/** Tile fraction to lane, so every number a guard prints is one the player could point at. */
const lane = (fraction: number): number => (fraction - LANE_TOP) * 2 * ACROSS_SPAN;

const tileSize = (): number => bakeSize(SPRITE_EXTENT.skyNebula, 6);

describe('0220 — a planetary place has ground, and ground is on the screen', () => {
  /*
    ⚠️ **THE THIRD TIME THE SAME TRAP HAS BEEN WALKED INTO, WHICH IS WHY IT IS NOW A GUARD.** The
    weather tile is `ACROSS_SPAN * 2` and blitted centred, so its y runs from lane −100 to lane 200
    and only the middle half is on the screen. The Approach's horizon was authored at tile 0.86 —
    lane 122 — and every guard passed while the screen was unchanged; the Pillars' far columns were
    given feet at 0.97 and were drawn entirely below the frame. Both were found by looking.

    0192: name a change that would redden this and be correct. Moving a planet's skyline off the lane
    is never correct — the place is *"based on a planet"*, and a planet you cannot see is the sky it
    replaced.
  */
  const GROUND: readonly ThemeKind[] = ['saurian', 'rime'];

  it('THE REPORTED ONE: Saurian Belt and Rime Shelf have a skyline, and it is in the bottom half of the lane', () => {
    const size = tileSize();
    for (const theme of GROUND) {
      /*
        The skyline is the LIT crest — the one mark of a ground that is meant to be seen against the
        sky, and the one the player reads the horizon off. A dark body below it can hang off the
        bottom of the world; the line cannot.
      */
      const crests = STRUCTURE_OF[theme](size).filter((mark) => mark.lit && mark.crosses);
      expect(
        crests.length,
        `${theme} draws no lit crossing mark — it has no skyline, so it is not standing on anything`,
      ).toBeGreaterThanOrEqual(2);
      for (const crest of crests) {
        const heights = crest.points.map((p) => lane(p[1]! / size));
        /*
          ⚠️ **THE CREST'S HIGHEST POINT, AND MOST OF ITS LENGTH — NOT EVERY POINT.** The first draft
          asserted every point was on the lane and reddened on Saurian Belt's near ridge at lane 102,
          which is CORRECT: the nearest ground runs off the bottom of the frame, exactly as the
          Pillars' feet do, and a ridge forbidden to do that is a ridge with no relief. What is never
          correct is a skyline the player cannot see, so the claim is that its top is well inside the
          lane and that the line does not spend most of its length below the world.
        */
        const top = Math.min(...heights);
        expect(
          top,
          `${theme}'s skyline tops out at lane ${top.toFixed(0)} — above the middle of the lane it is not ` +
            'ground any more, it is a band across the game',
        ).toBeGreaterThan(ACROSS_SPAN * 0.4);
        expect(
          top,
          `${theme}'s skyline tops out at lane ${top.toFixed(0)}, and the lane ends at ${ACROSS_SPAN} — ` +
            'a horizon off the screen is the defect The Approach shipped with and the Pillars’ feet repeated',
        ).toBeLessThan(ACROSS_SPAN * 0.95);
        const seen = heights.filter((at) => at < ACROSS_SPAN).length / heights.length;
        expect(
          seen,
          `only ${(seen * 100).toFixed(0)}% of ${theme}'s skyline is on the screen — the rest of it is ` +
            'below the world, which is a horizon that has been authored and not drawn',
        ).toBeGreaterThan(0.75);
      }
    }
  });

  it('and the ground RECEDES, so it is a surface and not three lines at three heights', () => {
    /*
      ⚠️ **THE ONE THAT CANNOT BE SATISFIED BY MOVING A NUMBER.** A place could pass the guard above
      with three identical ridges stacked up, which is 0196's *numerically different, visually the
      same* in a new costume. What makes a ground read as ground is that the further one is HIGHER and
      FAINTER at once — two signals agreeing, which is 0081's rule applied to distance.
    */
    const size = tileSize();
    for (const theme of GROUND) {
      const crests = STRUCTURE_OF[theme](size)
        .filter((mark) => mark.lit && mark.crosses)
        .map((mark) => ({
          top: Math.min(...mark.points.map((p) => p[1]!)) / size,
          alpha: mark.alpha,
        }))
        .sort((a, b) => a.top - b.top);
      for (let i = 1; i < crests.length; i += 1) {
        expect(
          crests[i]!.alpha,
          `${theme}'s ridge at lane ${lane(crests[i]!.top).toFixed(0)} is no brighter than the one behind it ` +
            `at lane ${lane(crests[i - 1]!.top).toFixed(0)} — the nearer ground has to be the louder one`,
        ).toBeGreaterThan(crests[i - 1]!.alpha);
      }
    }
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

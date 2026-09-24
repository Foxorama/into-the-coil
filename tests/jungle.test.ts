/**
 * The belt is a jungle under a live volcano — `docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md`.
 *
 * Played: *"The volcano is one pulsing graphic that doesn't touch the sky and isn't actually firing any
 * rocks or anything, the closer layers and sky layers are a monotone blue with no detail to them, it
 * doesn't scream jungle world at all."*
 *
 * ⚠️ **WHETHER IT SCREAMS JUNGLE IS THE PLAYER'S, NOT THIS FILE'S** — 0192. What is held is each claim
 * in the report that is true or false in player units: the smoke leaves the top of the screen, rock
 * climbs out of the crater and off the top of the screen and never falls (0363), it keeps flying
 * while the camera is stopped, it is smaller than anything that can kill the player, the land it all
 * happens over keeps the inks findable, and what it costs to draw.
 */

import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS, laneAcross } from '../src/content/levels.ts';
import { DECOR_INKS, PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SHOTS } from '../src/content/shots.ts';
import { EMBER_HEAD, SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { THEMES, THEME_KINDS } from '../src/content/themes.ts';
import { VENT_OF, coneOf } from '../src/content/volcano.ts';
import { ACROSS_SPAN, viewOf, type View } from '../src/sim/camera.ts';
import { GROUND_OF, LANDMARK_OF, RANGE_OF, SKY_STYLE_OF, bakeSize, laneAt, skyCover } from '../src/render/bake.ts';
import { paintScene, type Landmark } from '../src/render/scene.ts';
import { screenY, type Surface } from '../src/render/surface.ts';
import { landmarksFor } from '../src/app/frame.ts';
import { SKY_UNDER_A_RANGE } from '../src/app/mount.ts';
import { GAMEPLAY_FLOOR, contrast } from './contrast.ts';
import { tracingPen } from './paths.ts';

const saurian = LEVEL_KINDS.map((kind) => LEVELS[kind]).find((level) => level.theme === 'saurian')!;
const VIEW = viewOf(1920, 1080);

interface Blit {
  sprite: number;
  x: number;
  y: number;
  scale: number;
}

/** Records every blit, so a guard can read where things were put rather than how. */
class Recorder implements Surface {
  blits: Blit[] = [];
  clear(): void {}
  bolt(): void {}
  blit(sprite: number, x: number, y: number, scale: number): void {
    this.blits.push({ sprite, x, y, scale });
  }
}

/** The camera at which a landmark stands in the middle of the screen, in the level's own units. */
function centred(mark: Landmark, view: View): number {
  return mark.at + (view.alongSpan / 2 + mark.extent / 2) / mark.depth;
}

/**
 * Every rock of one landmark, step by step: `rocks[k][step]` is rock `k`'s blit on that step. The
 * painter blits a landmark's rocks in order, so the k-th rock blitted is the same rock every step.
 */
function flight(mark: Landmark, steps: number): Blit[][] {
  const rocks: Blit[][] = [];
  const camera = centred(mark, VIEW);
  for (let step = 0; step < steps; step += 1) {
    const surface = new Recorder();
    paintScene(surface, VIEW, [], camera, 0, [], null, [mark], 0, null, 0, step);
    const embers = surface.blits.filter((b) => b.sprite === SPRITE.ember);
    embers.forEach((b, k) => (rocks[k] ??= []).push(b));
  }
  return rocks;
}

describe('0347 — the belt is a jungle under a live volcano', () => {
  const size = 240;

  it('THE REPORTED ONE, IN LANE UNITS: every volcano’s smoke leaves the top of the screen', () => {
    /*
      *"Doesn't touch the sky."* The old plume ran past the top of its bitmap — and was clipped there,
      on a screen where that edge was visible, so the column ended on a ruled line in mid-air.

      ⚠️ **CLAMPED TO THE BITMAP, BECAUSE A POINT PAST ITS EDGE IS NOT IN THE PICTURE.** The first
      version measured the highest point the drawing put down, and its probe came back STILL GREEN: a
      plume this wide overruns its bitmap whatever it does, and what the player sees stops at the edge.
      So the claim is where the smoke is CUT — the higher of the drawing's top and the bitmap's — and
      that it is above the lane.
    */
    for (const entry of saurian.landmarks) {
      const { pen, trace } = tracingPen();
      LANDMARK_OF.saurian!(pen, '#404040', '#c0a040', '#101010', size, entry.variant);
      const top = Math.max(0, trace.passes.flatMap((pass) => pass.subpaths.flat()).reduce((m, p) => Math.min(m, p[1]!), Infinity));
      const drawn = SPRITE_EXTENT.landmark * (entry.scale ?? 1);
      // An authored `lane` is a share of the lane since 0364, so it is placed as `landmarksFor` places it.
      const lane = laneAcross(entry.lane) - drawn / 2 + (top / size) * drawn;
      expect(lane, `the volcano at ${entry.at} stops its smoke at lane ${lane.toFixed(1)}, on the screen`).toBeLessThan(0);
    }
  });

  it('and its crater is on the screen, above all the land in front of it', () => {
    let skyline = Infinity;
    for (const art of [RANGE_OF.saurian, GROUND_OF.saurian]) {
      if (art === null) continue;
      const { pen, trace } = tracingPen();
      art(pen, '#101010', '#405060', '#80a040', size);
      for (const pass of trace.passes) {
        if (pass.alpha < 1) continue;
        for (const p of pass.subpaths.flat()) skyline = Math.min(skyline, laneAt(p[1]! / size));
      }
    }
    expect(skyline, 'Saurian Belt draws no far range').toBeLessThan(ACROSS_SPAN);
    for (const entry of saurian.landmarks) {
      const drawn = SPRITE_EXTENT.landmark * (entry.scale ?? 1);
      // A share of the lane since 0364, as above.
      const crater = laneAcross(entry.lane) - drawn / 2 + coneOf(entry.variant).peak * drawn;
      expect(crater, `the crater at ${entry.at} is above the top of the screen`).toBeGreaterThan(0);
      expect(crater, `the crater at ${entry.at} is at lane ${crater.toFixed(0)}, behind the range at ${skyline.toFixed(0)}`).toBeLessThan(
        skyline,
      );
    }
  });

  it('THE REPORTED ONE, IN PIXELS: rock climbs out of the crater and off the top of the screen, and none comes down', () => {
    /*
      *"Isn't actually firing any rocks or anything"* (0347), and then *"fire up into the air and off
      the screen, but they don't fall down as it's distracting"* (0363). Every volcano that erupts is
      stood in the middle of a 1080p screen and walked through three whole flights of the sim's clock,
      and each rock is followed blit by blit in screen pixels.

      ⚠️ **A ROCK MAY ONLY GO DOWN THE SCREEN BY BEING THROWN AGAIN**, and a throw starts at the crater
      only once the last one is WHOLLY above the top edge — half the comet's drawn size past it, which
      is read off the blit's own scale and the sprite's extent, never off the painter's constant.
    */
    const top = screenY(VIEW, 0, 0);
    const marks = landmarksFor(saurian);
    const erupting = marks.filter((mark) => mark.vent !== undefined);
    expect(erupting.length, 'no volcano in Saurian Belt throws anything').toBe(saurian.landmarks.length);
    for (const mark of erupting) {
      const vent = mark.vent!;
      const crater = screenY(VIEW, 0, mark.lane + vent.lane);
      const rocks = flight(mark, vent.erupts.period * 3);
      expect(rocks.length, `the volcano at ${mark.at} has not got its rocks in the air`).toBe(vent.erupts.count);
      let throws = 0;
      for (const [k, path] of rocks.entries()) {
        expect(path.length, `rock ${k} of the volcano at ${mark.at} was not drawn every step`).toBe(vent.erupts.period * 3);
        for (let step = 1; step < path.length; step += 1) {
          const was = path[step - 1]!;
          const now = path[step]!;
          if (now.y <= was.y) continue;
          // It went down the screen: that is only allowed as a new throw, out of the crater, after the
          // last one has left.
          throws += 1;
          // Touching the edge covers no pixel; the millionth of one is floating point, not picture.
          const bottom = was.y + (SPRITE_EXTENT.ember * was.scale) / 2;
          expect(bottom, `rock ${k} of the volcano at ${mark.at} turned over ${(bottom - top).toFixed(1)}px below the top of the screen`).toBeLessThanOrEqual(
            top + 1e-6,
          );
          expect(Math.abs(now.y - crater), `rock ${k} of the volcano at ${mark.at} started a throw away from its crater`).toBeLessThan(
            VIEW.scale * 2,
          );
        }
      }
      expect(throws, `the volcano at ${mark.at} threw nothing clear of the screen in three flights`).toBeGreaterThanOrEqual(vent.erupts.count * 2);
    }
  });

  it('THE CAMERA STOPS FOR A FIGHT AND A VOLCANO DOES NOT: the rock rides the sim’s clock', () => {
    /*
      A landmark's arrival rides the camera (0034), and the camera comes to rest for a fight — the last
      volcano is behind the boss. Rock placed by the camera would hang in the air for the whole fight.
    */
    const mark = landmarksFor(saurian).find((m) => m.vent !== undefined)!;
    const camera = centred(mark, VIEW);
    const at = (time: number): string => {
      const surface = new Recorder();
      paintScene(surface, VIEW, [], camera, 0, [], null, [mark], 0, null, 0, time);
      return surface.blits.filter((b) => b.sprite === SPRITE.ember).map((b) => `${b.x.toFixed(1)},${b.y.toFixed(1)}`).join('|');
    };
    expect(at(600), 'the same rocks in the same places half a second apart, with the camera still').not.toBe(at(630));
  });

  it('and a rock in the sky is smaller than anything that can kill the player — 0069’s band', () => {
    const smallestThreat = Math.min(...Object.values(SHOTS).map((row) => row.radius)) * 2;
    const head = EMBER_HEAD * SPRITE_EXTENT.ember;
    expect(head, `a thrown rock's head is ${head.toFixed(2)} units against the smallest shot at ${smallestThreat}`).toBeLessThan(
      smallestThreat,
    );
  });

  it('an eruption is stated only where the place has a crater to throw it from', () => {
    for (const kind of LEVEL_KINDS) {
      for (const entry of LEVELS[kind].landmarks) {
        if (entry.erupts === undefined) continue;
        expect(VENT_OF[LEVELS[kind].theme], `${kind}'s landmark at ${entry.at} erupts out of a place with no vent`).not.toBeNull();
      }
    }
  });
});

describe('0347 — the land the fight happens over', () => {
  it('THE FLOOR: every colour a planet’s land is lit in keeps every gameplay ink findable', () => {
    /*
      The bottom third of the lane is land on a planet, so a lit canopy is a backdrop the fight is read
      against exactly as the sky is. `ground` is held darker than the sky by 0221; these are the colours
      over it, and each is held to the gameplay floor for every ink that means something.
    */
    let checked = 0;
    for (const theme of THEME_KINDS) {
      const land = THEMES[theme].land;
      if (land === undefined) continue;
      for (const name of Object.keys(PALETTES) as PaletteName[]) {
        for (const [part, colour] of Object.entries(land[name])) {
          for (const [ink, value] of Object.entries(PALETTES[name])) {
            if (ink === 'space' || ink === 'sky' || (DECOR_INKS as readonly string[]).includes(ink)) continue;
            checked += 1;
            const ratio = contrast(value, colour);
            expect(ratio, `${ink} sits at ${ratio.toFixed(2)}:1 on ${theme}'s ${name} ${part} (${colour})`).toBeGreaterThanOrEqual(
              GAMEPLAY_FLOOR,
            );
          }
        }
      }
    }
    expect(checked, 'no place states the colours its land is lit in').toBeGreaterThan(0);
  });

  it('and the haze at the horizon is counted, because it is light', () => {
    /*
      `skyCover` is what the contrast floor measures a sky by, and the haze is drawn by a painter of its
      own outside the clouds'. A cover that left it out would read the place as clearer than it is —
      in the one direction a guard built on it cannot see.
    */
    const day = SKY_STYLE_OF.saurian.daylight!;
    expect(skyCover(bakeSize(SPRITE_EXTENT.skyNebula, 6), 'saurian'), 'the haze is missing from the cover').toBeGreaterThanOrEqual(
      day.haze,
    );
  });

  it('SEAMS, IN PIXELS: an opaque tile overlaps its neighbour, and a translucent one only meets it', () => {
    /*
      A tile lands on a fractional pixel and the pixel it shares with its neighbour is covered partly
      from each side, so an opaque layer showed a hairline of sky through the land at every join — two
      of them in the 1080p photograph. The first fix overlapped every layer, and the weather's deepened
      sky drew a dark line down the screen instead. Both halves, in CSS pixels at 1080p.
    */
    for (const layer of SKY_UNDER_A_RANGE) {
      for (const camera of [0, 13.7, 999.9]) {
        const surface = new Recorder();
        paintScene(surface, VIEW, [], camera, 0, [layer]);
        const edges = surface.blits
          .map((b) => {
            const half = (SPRITE_EXTENT[SPRITE_KINDS[b.sprite]!] * b.scale) / 2;
            return [b.x - half, b.x + half] as const;
          })
          .sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < edges.length; i += 1) {
          const overlap = edges[i - 1]![1] - edges[i]![0];
          const name = SPRITE_KINDS[layer.sprite];
          if (layer.opaque === true) {
            expect(overlap, `${name}'s tiles overlap by ${overlap.toFixed(2)}px, so a join can show through`).toBeGreaterThanOrEqual(1);
          } else {
            expect(Math.abs(overlap), `${name}'s tiles overlap by ${overlap.toFixed(2)}px, so a join draws twice`).toBeLessThan(0.01);
          }
        }
      }
    }
  });
});

/**
 * What a level's landmarks and the rock they throw may cost in one frame, in blits.
 *
 * ⚠️ **A BUDGET, OWNED BY 0347** — `docs/decisions/0192-a-guard-holds-an-invariant.md`. Measured when
 * this was written: the worst frame of Saurian Belt, walked five units at a time from the opening to
 * past the fight, is **all three volcanoes and their 24 rocks** — 27 blits, at camera 3630, the same on
 * a 1920×1080, a 2400×1000 and a 1500×1000 view. **Re-measured by 0363**, whose flights are only the
 * climb: all three and their 9 rocks, 12 blits, at the same camera on the same three views. The
 * number stays at 40 — nothing asked for it to shrink. The frame's whole worst case is 542
 * (`tests/budget.test.ts`) and desktop is the target (0153), so this is not tight; it exists so that
 * rock stays a handful rather than growing a pool by the back door. Raising it is an edit to this
 * number with the new measurement beside it.
 */
const ERUPTION_BUDGET = 40;

describe('0347 — what an eruption costs', () => {
  it('a landmark is one blit and a rock is one more, and the worst frame of the level is inside its budget', () => {
    const marks = landmarksFor(saurian);
    let worst = 0;
    for (let camera = 0; camera < saurian.bossAt + 3000; camera += 25) {
      const surface = new Recorder();
      paintScene(surface, VIEW, [], camera, 0, [], null, marks, 0, null, 0, camera);
      worst = Math.max(worst, surface.blits.length);
    }
    expect(worst, 'no landmark was ever on screen').toBeGreaterThan(0);
    expect(worst, `Saurian Belt's landmarks cost ${worst} blits on their worst frame — 0347 owns the number`).toBeLessThanOrEqual(
      ERUPTION_BUDGET,
    );
  });
});

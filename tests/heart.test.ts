/**
 * The Black Heart has veins — `docs/decisions/0354-the-heart-has-veins.md`.
 *
 * Asked for: *"Needs veins pulsing throughout the level and a beautiful starry backdrop."*
 *
 * ⚠️ **WHAT IS HELD IS THE AGREEMENT AND THE PULSE, IN THE PLAYER'S UNITS.** The vessels are baked
 * into the weather tile and the light is blitted along them every frame; both read `VEINS_OF`. So:
 * every bead lies on a vessel, the vessels baked are those vessels, the light rides the sim's clock and
 * the heart's beat, a bead's head is under a shot's size, and only The Black Heart has any. Whether it
 * is *beautiful* is the player's.
 */

import { describe, expect, it } from 'vitest';

import { SHOTS } from '../src/content/shots.ts';
import { BEAD_HEAD, SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { VEINS_OF, trunkAt } from '../src/content/veins.ts';
import { viewOf } from '../src/sim/camera.ts';
import { STRUCTURE_OF, bakeSize, skyCover } from '../src/render/bake.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { skyFor } from '../src/app/mount.ts';

const VIEW = viewOf(1920, 1080);

class Recorder implements Surface {
  blits: { sprite: number; x: number; y: number; scale: number }[] = [];
  clear(): void {}
  bolt(): void {}
  blit(sprite: number, x: number, y: number, scale: number): void {
    this.blits.push({ sprite, x, y, scale });
  }
}

/** Every bead drawn over the place's sky at `camera` and `time`, in world units, with its scale. */
function beadsAt(place: ThemeKind, camera: number, time: number): { along: number; across: number; scale: number }[] {
  const surface = new Recorder();
  paintScene(surface, VIEW, [], camera, 0, skyFor(place), null, [], 0, null, 0, time);
  const x0 = screenX(VIEW, 0, 0);
  const y0 = screenY(VIEW, 0, 0);
  return surface.blits
    .filter((b) => b.sprite === SPRITE.veinBead)
    .map((b) => ({ along: (b.x - x0) / VIEW.scale, across: (b.y - y0) / VIEW.scale, scale: b.scale / VIEW.scale }));
}

describe('0354 — the heart has veins', () => {
  it('THE ASK, IN LANE UNITS: every bead of the pulse lies on one of the vessels the sky was baked with', () => {
    const veins = VEINS_OF.core!;
    const weather = skyFor('core').find((layer) => layer.veins !== undefined);
    expect(weather, 'The Black Heart\'s sky carries no veins, so nothing pulses').toBeDefined();
    const span = weather!.extent;
    let seen = 0;
    const strays: string[] = [];
    for (let camera = 0; camera < 3000; camera += 97) {
      for (const time of [0, 33, 180, 401]) {
        const offset = (((camera * weather!.depth) % span) + span) % span;
        for (const bead of beadsAt('core', camera, time)) {
          seen++;
          const x = ((((bead.along + offset) % span) + span) % span) / span;
          const on = veins.trunks.some(
            (trunk) => Math.abs(VIEW.acrossSpan / 2 + (trunkAt(trunk, x) - 0.5) * span - bead.across) < 0.05,
          );
          if (!on) strays.push(`camera ${camera}, step ${time}: a bead at along ${bead.along.toFixed(1)}, across ${bead.across.toFixed(1)}`);
        }
      }
    }
    expect(seen, 'no bead was ever drawn, so this measured nothing').toBeGreaterThan(200);
    expect(strays.slice(0, 5).join('\n'), `${strays.length} beads drawn off every vessel`).toBe('');
  });

  it('and the vessels the weather is baked with are those same vessels', () => {
    const size = 600;
    const marks = STRUCTURE_OF.core(size).filter((mark) => mark.crosses);
    for (const trunk of VEINS_OF.core!.trunks) {
      const drawn = marks.some((mark) =>
        mark.points.every((p) => Math.abs(p[1]! - trunkAt(trunk, p[0]! / size) * size) < 1e-6),
      );
      expect(drawn, `no vessel is baked along the trunk based at ${trunk.base}`).toBe(true);
    }
  });

  it('the camera stops and the heart does not: the pulse rides the sim\'s clock, in the heart\'s own beat', () => {
    // Positions only: the beat changes a bead's size with time, and a bead frozen in place that still
    // swelled would pass a comparison that included it.
    const where = (beads: { along: number; across: number }[]): string => JSON.stringify(beads.map((b) => [b.along, b.across]));
    const early = beadsAt('core', 1200, 10);
    const later = beadsAt('core', 1200, 70);
    expect(early.length, 'nothing was pulsing at 1200').toBeGreaterThan(0);
    expect(where(later), 'the same camera sixty steps later drew the beads in the same places — the heart has stopped').not.toBe(
      where(early),
    );
    // Over one beat a bead swells and settles: the lub is well above the rest.
    const beat = VEINS_OF.core!.pulse.beat;
    let least = Infinity;
    let most = 0;
    for (let t = 0; t < beat; t++) {
      for (const bead of beadsAt('core', 1200, 2000 + t)) {
        least = Math.min(least, bead.scale);
        most = Math.max(most, bead.scale);
      }
    }
    expect(most / least, 'the beads never swell — a light running down a vein, not a pulse').toBeGreaterThan(1.3);
  });

  it('a bead\'s head is under the smallest shot, because a round light a bullet\'s size is a bullet', () => {
    const smallestThreat = Math.min(...Object.values(SHOTS).map((row) => row.radius)) * 2;
    const head = BEAD_HEAD * SPRITE_EXTENT.veinBead;
    expect(head, `a bead's head is ${head.toFixed(2)} units against the smallest shot at ${smallestThreat}`).toBeLessThan(smallestThreat);
  });

  it('and the floor sees the vessels, at the colour they are drawn in', () => {
    /*
      The vessels are lit in the gas's body colour (`StructureMark.gas`), and `skyCover` reads those
      marks apart from the glow so `tests/sky.test.ts` can charge them at wine rather than ice blue. The
      failure that would hide is the other way: a reading that dropped them would leave the floor
      measuring a sky with no vessels in it and every guard green.
    */
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    expect(skyCover(size, 'core', undefined, undefined, 'gas'), 'the floor does not see the heart\'s vessels at all').toBeGreaterThan(0.3);
    expect(skyCover(size, 'approach', undefined, undefined, 'gas'), 'a place with no gas-lit marks reads some').toBe(0);
  });

  it('and only a place that states veins pulses', () => {
    for (const place of THEME_KINDS) {
      if (VEINS_OF[place] !== null) continue;
      expect(beadsAt(place, 1200, 60).length, `${place} states no veins and pulses`).toBe(0);
    }
  });
});

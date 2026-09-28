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
import { BAR_SECONDS, BEAT_SECONDS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS, barsOf, voicesOf, type ThemeKind } from '../src/content/themes.ts';
import { VEINS_OF, arteryAt, heartAt, trunkAcross, trunkAt } from '../src/content/veins.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { STRUCTURE_OF, bakeSize, skyCover } from '../src/render/bake.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { skyFor } from '../src/app/mount.ts';

const VIEW = viewOf(1920, 1080);

class Recorder implements Surface {
  blits: { sprite: number; x: number; y: number; scale: number; alpha: number }[] = [];
  clear(): void {}
  bolt(): void {}
  blit(sprite: number, x: number, y: number, scale: number, _turn = 0, alpha = 1): void {
    this.blits.push({ sprite, x, y, scale, alpha });
  }
}

/** Every bead drawn over the place's sky at `camera` and `time`, in world units, with its scale. */
function beadsAt(place: ThemeKind, camera: number, time: number, beat = 0): { along: number; across: number; scale: number }[] {
  const surface = new Recorder();
  paintScene(surface, VIEW, [], camera, 0, skyFor(place), null, [], 0, null, 0, time, null, null, -1, beat);
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

  it('the camera stops and the light does not: a bead rides the sim\'s clock, and swells with the heart it is handed (0401)', () => {
    // Positions only: the beat changes a bead's size with time, and a bead frozen in place that still
    // swelled would pass a comparison that included it.
    const where = (beads: { along: number; across: number }[]): string => JSON.stringify(beads.map((b) => [b.along, b.across]));
    const early = beadsAt('core', 1200, 10);
    const later = beadsAt('core', 1200, 70);
    expect(early.length, 'nothing was pulsing at 1200').toBeGreaterThan(0);
    expect(where(later), 'the same camera sixty steps later drew the beads in the same places — the heart has stopped').not.toBe(
      where(early),
    );
    // On a lub a bead swells well above its rest — 0401: the beat is the painter's argument now.
    const rest = Math.max(...beadsAt('core', 1200, 2000, 0).map((b) => b.scale));
    const lub = Math.max(...beadsAt('core', 1200, 2000, 1).map((b) => b.scale));
    expect(lub / rest, 'the beads never swell — a light running down a vein, not a pulse').toBeGreaterThan(1.3);
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

describe('0401 — the vessels beat with the music', () => {
  const veins = VEINS_OF.core!;

  it('THE ASK: the picture’s heart beats exactly where the heart the music plays does — every rise is a struck step of the heard voice', () => {
    /*
      *"The background arteries for the level need to pulse in time with the heartbeat to the music."*
      Read off the voice itself: every time the picture's heart rises through half its rung's strength
      is within a hundredth of a second of a step that voice strikes, and every step it strikes is a rise.
    */
    for (const heart of veins.hearts) {
      for (const rung of MUSIC_LEVELS) {
        const strength = heart.strength[rung];
        if (strength === undefined) continue;
        const voice = voicesOf('core', heart.layer)[heart.voice]!;
        expect(voice, `${heart.layer} has no voice ${heart.voice} to beat to`).toBeDefined();
        const loop = BAR_SECONDS * barsOf('core', heart.layer);
        const step = BEAT_SECONDS / voice.perBeat;
        const struck = voice.steps.flatMap((v, i) => (v === null || v === undefined || i * step >= loop ? [] : [i * step]));
        expect(struck.length, `${heart.layer} strikes nothing, so nothing is heard to beat to`).toBeGreaterThan(0);
        const rises: number[] = [];
        let was = 0;
        for (let t = 0; t < loop; t += 0.002) {
          const now = heartAt('core', veins, rung, t);
          if (now > strength * 0.5 * Math.min(...struck.map((_, i) => voice.steps[Math.round(struck[i]! / step)]!)) && now > was * 1.5) rises.push(t);
          was = now;
        }
        for (const t of rises) {
          expect(Math.min(...struck.map((s) => Math.abs(s - t))), `at ${rung} the vessels flare at ${t.toFixed(3)} s, where ${heart.layer} strikes nothing`).toBeLessThan(0.01);
        }
        expect(rises.length, `at ${rung} the vessels flare ${rises.length} times over a loop ${heart.layer} strikes ${struck.length} times in`).toBe(struck.length);
      }
    }
  });

  it('and it is subtle at first and a noticeable heartbeat at the end: the strongest beat of each stretch climbs to the fight', () => {
    const peak = (rung: (typeof MUSIC_LEVELS)[number]): number => {
      let most = 0;
      for (let t = 0; t < 30; t += 0.005) most = Math.max(most, heartAt('core', veins, rung, t));
      return most;
    };
    const climb = (['run', 'push', 'surge', 'approach', 'boss'] as const).map(peak);
    for (let i = 1; i < climb.length; i++) expect(climb[i]!, `the heart is fainter at rung ${i} than at the one before: ${climb.join(', ')}`).toBeGreaterThan(climb[i - 1]!);
    expect(climb[0]!, 'the opening’s heart does not show at all').toBeGreaterThan(0.2);
  });

  it('IN PIXELS: the lit vessels are laid over the weather at the heart’s strength, and not at all between beats', () => {
    const lit = (beat: number): { alpha: number }[] => {
      const surface = new Recorder();
      paintScene(surface, VIEW, [], 1200, 0, skyFor('core'), null, [], 0, null, 0, 0, null, null, -1, beat);
      return surface.blits.filter((b) => b.sprite === SPRITE.skyVeins);
    };
    expect(lit(0).length, 'the lit vessels are drawn with no heart beating').toBe(0);
    const on = lit(0.8);
    expect(on.length, 'nothing lights the vessels on a beat').toBeGreaterThan(0);
    for (const b of on) expect(b.alpha, 'the vessels are lit at something other than the beat’s strength').toBeCloseTo(0.8, 9);
  });

  it('0400 — IN LANE UNITS: each vessel into the heart leaves a trunk where the trunk is drawn, and arrives at the heart', () => {
    const weather = skyFor('core').find((layer) => layer.veins !== undefined)!;
    const out = new Float64Array(2);
    for (const camera of [0, 740, 4400, 9123]) {
      const heartAlong = camera + 152;
      const heartAcross = ACROSS_SPAN / 2;
      for (const artery of veins.arteries) {
        arteryAt(artery, veins, 0, heartAlong, heartAcross, camera, weather.extent, ACROSS_SPAN, out);
        const on = trunkAcross(veins.trunks[artery.trunk]!, out[0]! - camera, camera, weather.extent, ACROSS_SPAN);
        expect(Math.abs(out[1]! - on), `at camera ${camera} a vessel leaves ${Math.abs(out[1]! - on).toFixed(2)} units off its trunk`).toBeLessThan(1e-9);
        arteryAt(artery, veins, 1, heartAlong, heartAcross, camera, weather.extent, ACROSS_SPAN, out);
        expect(Math.hypot(out[0]! - heartAlong - artery.into[0], out[1]! - heartAcross - artery.into[1]), 'a vessel does not reach the heart').toBeLessThan(1e-9);
      }
    }
    // And the trunk is where the weather is tiled from: the painter's own arithmetic, which the beads ride.
    const offset = ((740 * weather.depth) % weather.extent + weather.extent) % weather.extent;
    const x = ((10 + offset) / weather.extent) % 1;
    expect(trunkAcross(veins.trunks[0]!, 10, 740, weather.extent, ACROSS_SPAN)).toBeCloseTo(VIEW.acrossSpan / 2 + (trunkAt(veins.trunks[0]!, x) - 0.5) * weather.extent, 9);
  });

  it('and they are drawn only where a fight has a heart', () => {
    const count = (heart: Float64Array | null): number => {
      const surface = new Recorder();
      paintScene(surface, VIEW, [], 1200, 0, skyFor('core'), null, [], 0, null, 0, 0, null, null, -1, 0, heart);
      return surface.blits.filter((b) => b.sprite === SPRITE.artery).length;
    };
    expect(count(null), 'vessels into a heart were drawn with no heart on the field').toBe(0);
    expect(count(Float64Array.of(1200 + 152, ACROSS_SPAN / 2)), 'no vessel runs into the heart').toBeGreaterThanOrEqual(veins.arteries.length * 4);
  });
});

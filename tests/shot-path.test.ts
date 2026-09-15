/**
 * A shot has a path — `docs/decisions/0327-a-shot-has-a-path.md`.
 *
 * Reported: *"almost all the shooting is straight patterns as well, there's no curving bullets, no
 * patterns, no waves etc."* Every hostile bullet flew the straight line its muzzle gave it. A row
 * may now say it bends or it swings, and this holds what that promise means: an arm nobody sends is
 * not a vocabulary; a swing is a swing on the screen and not only in the table; a curl turns and
 * then stops turning, so it leaves; and a shot that says nothing still flies straight — *"if
 * everything curves or weaves we've over corrected."*
 *
 * ⚠️ **The driven halves are in the player's units** — units of lane, radians of heading, seconds —
 * over the real frame, per [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md): a
 * guard that reads the row's own amplitude back proves only that the table agrees with itself.
 */
import { describe, expect, it } from 'vitest';

import { GameFrame } from '../src/app/frame.ts';
import { ENEMIES, type EnemyKind } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, type WaveEntry } from '../src/content/levels.ts';
import { SHOTS, SHOT_KINDS, SHOT_PATH_KINDS, type ShotKind } from '../src/content/shots.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import type { Entity } from '../src/sim/entity.ts';
import { PLAYER_ALONG_MARGIN } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** Every shot kind some level's wave actually sends at the player. */
function sentShots(): Set<ShotKind> {
  const sent = new Set<ShotKind>();
  for (const kind of LEVEL_KINDS) {
    for (const wave of LEVELS[kind].waves) {
      const row = ENEMIES[wave.enemy];
      if (row.fireEvery > 0) sent.add(row.shot);
    }
  }
  return sent;
}

/** One hostile shot's flight: its position and camera-frame heading, step by step. */
interface Track {
  along: number[];
  across: number[];
  heading: number[];
  born: number;
}

/**
 * One wave, the ship's guns off and parked, driven for `seconds`: every hostile shot's flight, the
 * finished ones and the ones still in the air.
 *
 * ⚠️ **A LIST, NOT A MAP KEYED BY THE ENTITY.** A pool reuses its slots, so the second volley's shots
 * ARE the first volley's entities, and a map keyed by them overwrote the first pair's flight the step
 * the second was born — the guard then read *never got a pair away* on a picket that had. Finished
 * flights are kept the moment their entity vanishes or is reborn.
 */
function flown(wave: WaveEntry, seconds: number): Track[] {
  const { world } = playableWorld({
    waves: [wave],
    pickups: [],
    landmarks: [],
    bossAt: Number.POSITIVE_INFINITY,
    midBoss: null,
    sections: NO_SECTIONS,
    boss: 'sentinel',
    theme: 'approach',
  });
  const frame = new GameFrame(world);
  const flying = new Map<Entity, Track>();
  const done: Track[] = [];
  let live = new Set<Entity>();
  for (let step = 0; step < seconds * STEPS_PER_SECOND; step++) {
    world.fireIn = Number.MAX_SAFE_INTEGER;
    /*
      ⚠️ **PARKED AT THE BACK OF ITS BOX, AND THAT IS FOR THE PROBE'S SAKE.** A hunter fires down the
      ship's lane, and a shot that flies straight down it hits the ship and is spent — so with the
      bend removed on purpose, the picket's pair died on the hull inside sixty steps and the guard
      went red for *never got a pair away* rather than for *swung nothing*. At the back of the box a
      straight shot has the whole view to be measured in before it lands, and the red says what broke.
    */
    world.ship.across = ACROSS_SPAN / 2;
    world.ship.along = world.cameraAlong + PLAYER_ALONG_MARGIN;
    frame.step();
    const now = new Set<Entity>();
    for (let i = 0; i < world.enemyShots.size; i++) {
      const s = world.enemyShots.at(i);
      now.add(s);
      let t = flying.get(s);
      if (t === undefined || !live.has(s)) {
        if (t !== undefined) done.push(t);
        t = { along: [], across: [], heading: [], born: step };
        flying.set(s, t);
      }
      t.along.push(s.along);
      t.across.push(s.across);
      t.heading.push(Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep));
    }
    for (const [s, t] of flying) {
      if (!now.has(s)) {
        done.push(t);
        flying.delete(s);
      }
    }
    live = now;
  }
  return [...done, ...flying.values()];
}

const enemyOf = (kind: EnemyKind): WaveEntry => ({ at: 400, enemy: kind, formation: 'line', count: 1, lane: 50 });

describe('0327 — a shot has a path', () => {
  it('every path arm is on a row some level sends, so the union cannot fill up with paths nobody flies', () => {
    const sent = sentShots();
    for (const arm of SHOT_PATH_KINDS) {
      const rows = SHOT_KINDS.filter((k) => SHOTS[k].path?.kind === arm && sent.has(k));
      expect(rows.length, `no shot any level sends flies the ${arm} path`).toBeGreaterThan(0);
    }
  });

  it('and most of what is sent still flies straight, because a game where everything curves has over-corrected', () => {
    /*
      *"make sure that we still have some straight firing bullets an enemies — if everything curves
      or weaves we've over corrected."* Held as a majority rather than a count: the day a fourth
      bending row is authored this still asks the question, and the day the straight ones are gone
      it answers it.
    */
    const sent = [...sentShots()];
    const straight = sent.filter((k) => SHOTS[k].path === undefined);
    expect(straight.length, `${straight.length} of ${sent.length} bullets the levels send fly straight`).toBeGreaterThan(sent.length / 2);
  });

  it('a row that bends bends inside the lane, and a row that swings swings inside a quarter of it', () => {
    /*
      ⚠️ **Per row and in units of the lane, never a ranking** — 0295. An arc's circle is
      `speed / turn` in radius; one wider than the lane is a straight line to the player and a pool
      slot held for `sweep / turn` steps for nothing. A swing wider than a quarter of the lane is a
      wall that wobbles rather than a snake to stand beside. Both are the consideration `CLAUDE.md`
      asks — *how much space the player has to react in* — asked of each row on its own numbers.
    */
    for (const kind of SHOT_KINDS) {
      const row = SHOTS[kind];
      if (row.path === undefined) continue;
      if (row.path.kind === 'arc') {
        expect(row.path.turn, `${kind} turns by zero, which is a straight line pretending`).toBeGreaterThan(0);
        expect(row.path.sweep, `${kind} sweeps nothing`).toBeGreaterThan(0);
        expect(Number.isFinite(row.path.sweep), `${kind} never straightens, so it never leaves`).toBe(true);
        const diameter = (2 * row.speed) / row.path.turn;
        expect(diameter, `${kind} sweeps a circle ${diameter.toFixed(0)} units across on a ${ACROSS_SPAN}-unit lane`).toBeLessThanOrEqual(ACROSS_SPAN / 2);
      } else {
        expect(row.path.amplitude, `${kind} swings by zero`).toBeGreaterThan(0);
        expect(row.path.wavelength, `${kind} has no wavelength`).toBeGreaterThan(0);
        // Four amplitudes: a pair in opposite phase, each about a centre displaced by up to A — the
        // reach a volley of this row can have across the lane, which is the number the screen sees.
        expect(4 * row.path.amplitude, `${kind}'s pair reaches ${4 * row.path.amplitude} units of a ${ACROSS_SPAN}-unit lane`).toBeLessThanOrEqual(ACROSS_SPAN / 4);
      }
    }
  });

  it('THE PICTURE: a ripple swings across the lane on the screen, and the pair braids', () => {
    /*
      The picket's pair, driven. Each shot's across covers at least a tenth of the lane over its
      flight — a swing, not a wobble — and at some step the two are further apart across than one
      of them ever swings alone, which is the braid: opposite phase, dealt by `spin`.
    */
    const tracks = flown(enemyOf('picket'), 8).filter((t) => t.across.length > 60);
    expect(tracks.length, 'the picket never got a pair away').toBeGreaterThanOrEqual(2);
    for (const t of tracks) {
      const span = Math.max(...t.across) - Math.min(...t.across);
      expect(span, `a ripple swung ${span.toFixed(1)} units across over its flight`).toBeGreaterThanOrEqual(ACROSS_SPAN / 10);
    }
    /*
      ⚠️ **A PAIR IS TWO SHOTS BORN ON ONE STEP.** The picket hunts across the lane between volleys,
      so two shots from different volleys are apart by however far it moved — which would pass this
      for the wrong reason. The first draft compared the first two tracks and measured 23 units of
      picket rather than 12 of braid.
    */
    const a = tracks[0]!;
    const b = tracks.find((t) => t !== a && t.born === a.born);
    expect(b, 'the picket never fired two shots on one step, so there is no pair to read').toBeDefined();
    let apart = 0;
    const n = Math.min(a.across.length, b!.across.length);
    for (let i = 0; i < n; i++) apart = Math.max(apart, Math.abs(a.across[i]! - b!.across[i]!));
    const amplitude = SHOTS.ripple.path!.kind === 'wave' ? SHOTS.ripple.path!.amplitude : 0;
    /*
      ⚠️ **UP TO FOUR AMPLITUDES, NOT TWO, AND THE WEAVER'S OWN ALGEBRA SAYS WHY.** The path is
      `across₀ + A·(sin k·along − sin k·along₀)`: a swing of ±A about a centre the spawn phase can
      displace by up to another A (`src/content/enemies.ts`, on the weaver). Two shots in opposite
      phase are therefore up to 4A apart, and the first draft of this bound said 2A and went red on
      the true picture — 23 units against 13.
    */
    expect(apart, `the pair were never more than ${apart.toFixed(1)} units apart, so they snake in step rather than braiding`).toBeGreaterThan(amplitude);
    expect(apart, `the pair were ${apart.toFixed(1)} units apart, which is more than four swings — not one volley`).toBeLessThanOrEqual(4 * amplitude + 1);
  });

  it('THE OTHER PICTURE: a curl turns through its sweep, then flies straight, then is gone', () => {
    /*
      The spinner's ring, driven for long enough that every shot of its first volleys has left. A shot
      turns by about its sweep — measured off its heading in the camera's frame, step by step — and
      after that its heading is constant to the step; and no shot outlives the sweep plus a crossing
      of the widest view, which is what stops a bent bullet being a pool slot held for ever.
    */
    const row = SHOTS.curl;
    const path = row.path!;
    if (path.kind !== 'arc') throw new Error('the curl is not an arc');
    const tracks = flown(enemyOf('spinner'), 12).filter((t) => t.heading.length > path.sweep / path.turn + 30);
    expect(tracks.length, 'no curl flew long enough to finish its sweep').toBeGreaterThanOrEqual(3);
    for (const t of tracks) {
      let turned = 0;
      for (let i = 1; i < t.heading.length; i++) {
        let d = t.heading[i]! - t.heading[i - 1]!;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        turned += Math.abs(d);
      }
      expect(turned, `a curl turned ${turned.toFixed(2)} rad against a sweep of ${path.sweep.toFixed(2)}`).toBeGreaterThanOrEqual(path.sweep * 0.95);
      expect(turned, `a curl turned ${turned.toFixed(2)} rad, past its sweep of ${path.sweep.toFixed(2)}`).toBeLessThanOrEqual(path.sweep + path.turn * 2);
      const settled = Math.ceil(path.sweep / path.turn) + 2;
      const late = t.heading.slice(settled);
      const drift = Math.max(...late) - Math.min(...late);
      expect(drift, `a curl kept turning after its sweep, by ${drift.toFixed(4)} rad`).toBeLessThan(1e-9);
      expect(t.heading.length, 'a curl outlived its sweep and a crossing of the widest view').toBeLessThan(settled + 400);
    }
  });

  it('and a row that says nothing flies straight, to the step', () => {
    /*
      The lancer's lance: no path on the row, so the across velocity it leaves the muzzle with is
      the one it has every step after. The default is straight and it is the common case on purpose.
    */
    expect(SHOTS.lance.path, 'the lance has a path now, so this measures nothing').toBeUndefined();
    const tracks = flown(enemyOf('lancer'), 8).filter((t) => t.heading.length > 30);
    expect(tracks.length, 'the lancer never fired').toBeGreaterThanOrEqual(1);
    for (const t of tracks) {
      const drift = Math.max(...t.heading) - Math.min(...t.heading);
      expect(drift, `a straight shot's heading drifted by ${drift} rad`).toBe(0);
    }
  });
});

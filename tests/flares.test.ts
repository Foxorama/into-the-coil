import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CAPACITY } from '../src/app/mount.ts';
import { GameFrame } from '../src/app/frame.ts';
import { BURST, DEBRIS_BY_KIND, DEBRIS_KIND, DEBRIS_KINDS, DEBRIS_ROWS } from '../src/content/debris.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { type Entity, reset } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * A DEATH IS A FIREBALL, AND A MISSILE LANDS WITH A SPARK — 0227.
 *
 * `docs/decisions/0227-a-sprite-is-painted-not-filled.md`. Asked for: *"enemies exploding… missile
 * explosions."* A death drew eight shards and nothing else, and a missile landed exactly as a pulse
 * did. What is held here is the mechanism and not the picture: that a flare is lit where the thing
 * happened, that it turns every page in order on its own clock, and that it goes out —
 * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` for a fireball.
 *
 * ⚠️ **DRIVEN THROUGH THE REAL FRAME**, because the failure that matters is the one every table would
 * be green for: a row that lists four frames and an entity that shows the first of them for sixteen
 * steps. `turnFlares` is what walks them, and only a stepped world can say it does.
 */

/** The bitmap a debris entity is drawn as right now, by name. */
const drawn = (e: Entity): string => SPRITE_KINDS[e.sprite] ?? `#${e.sprite}`;

/** Every live debris entity of one kind. */
function flaresOf(world: ReturnType<typeof playableWorld>['world'], kind: number): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.debris.size; i++) {
    const e = world.debris.at(i);
    if (e.kind === kind) out.push(e);
  }
  return out;
}

/** A world with a frame, an enemy off the ship's own line of fire, and the pulse that kills it. */
function ambush(health: number): {
  world: ReturnType<typeof playableWorld>['world'];
  frame: GameFrame;
  enemy: Entity;
} {
  const built = playableWorld(NO_LEVEL);
  const frame = new GameFrame(built.world);
  const w = built.world;
  const enemy = w.enemies.spawn()!;
  // Off the ship's own lane, so the auto-fire cannot reach it and every hit here is one this test
  // placed. Ahead of the ship, inside the view, so nothing culls it.
  reset(enemy, w.ship.along + 40, w.ship.across - 25, { ...ENEMIES.drifter, health });
  return { world: w, frame, enemy };
}

describe('0227 — a death is a fireball', () => {
  it('THE REPORTED ONE: an enemy dying lights a burst where it died, on top of its shards', () => {
    const { world: w, frame, enemy } = ambush(1);
    const shot = w.playerShots.spawn()!;
    reset(shot, enemy.along, enemy.across, SHOTS.pulse);
    frame.step();
    expect(w.enemies.size, 'the enemy survived the shot placed on it, so this measured nothing').toBe(0);
    const bursts = flaresOf(w, DEBRIS_KIND.burst);
    expect(bursts.length, 'the enemy died and no fireball was lit').toBe(1);
    const fire = bursts[0]!;
    expect(Math.hypot(fire.along - enemy.along, fire.across - enemy.across), 'the fireball is not where the enemy died').toBeLessThan(
      1e-9,
    );
    expect(drawn(fire), 'a fireball opens on a frame that is not its first').toBe('burst0');
    // And the shards are still there — the fireball is on top of the picture, not instead of it.
    expect(flaresOf(w, DEBRIS_KIND.shard).length, 'the shards went missing').toBe(BURST.enemy);
  });

  it('turns every page in order, holds each for its whole count, and goes out on the last', () => {
    const { world: w, frame, enemy } = ambush(1);
    const shot = w.playerShots.spawn()!;
    reset(shot, enemy.along, enemy.across, SHOTS.pulse);
    frame.step();
    const row = DEBRIS_ROWS.burst;
    const seen: string[] = [];
    // One more step than the life, so the last read is *gone*.
    for (let i = 0; i <= row.frames.length * row.hold; i++) {
      const fire = flaresOf(w, DEBRIS_KIND.burst)[0];
      seen.push(fire === undefined ? 'gone' : drawn(fire));
      frame.step();
    }
    const expected: string[] = [];
    for (const sprite of row.frames) for (let i = 0; i < row.hold; i++) expected.push(SPRITE_KINDS[sprite]!);
    expected.push('gone');
    expect(seen, 'the fireball did not walk its frames in order, one hold each, and then go out').toEqual(expected);
  });

  it('and a missile landing on something that survives it sparks where it hit', () => {
    /*
      ⚠️ **On a SURVIVOR, which is the case a death could never cover.** A missile that kills gets the
      fireball; a missile absorbed by a boss with a hundred hits left used to be told by nothing but
      the flash 0035 puts on the body — the same four steps a pulse earns.
    */
    const { world: w, frame, enemy } = ambush(99);
    const missile = w.missiles.spawn()!;
    reset(missile, enemy.along, enemy.across, SHOTS.missile);
    frame.step();
    expect(w.enemies.size, 'the enemy died, so this is the fireball’s case and not the spark’s').toBe(1);
    expect(w.missiles.size, 'the missile never landed, so this measured nothing').toBe(0);
    const sparks = flaresOf(w, DEBRIS_KIND.spark);
    expect(sparks.length, 'the missile landed and nothing marked where').toBe(1);
    expect(drawn(sparks[0]!), 'a spark opens on a frame that is not its first').toBe('spark0');
    expect(flaresOf(w, DEBRIS_KIND.burst).length, 'a survived hit lit a fireball, so a hit and a death read alike').toBe(0);
  });

  it('and a pulse landing does not, because the flash on the body already says so', () => {
    const { world: w, frame, enemy } = ambush(99);
    const shot = w.playerShots.spawn()!;
    reset(shot, enemy.along, enemy.across, SHOTS.pulse);
    frame.step();
    expect(w.playerShots.size, 'the pulse never landed').toBe(0);
    expect(flaresOf(w, DEBRIS_KIND.spark).length, 'a pulse sparked, so every hit in the game now does').toBe(0);
  });
});

describe('a flare is a row, and the rows are sound', () => {
  it('every frame of a flare is a different bitmap, and each is bigger than the last', () => {
    /*
      ⚠️ **A frame listed twice is a walk that stalls, and a frame that shrinks is an explosion that
      breathes in.** Both are the edits a hand makes copying a row by analogy, and both bake and blit
      without a word.
    */
    for (const kind of DEBRIS_KINDS) {
      const row = DEBRIS_ROWS[kind];
      if (row.hold === 0) continue;
      expect(new Set(row.frames).size, `the ${kind} lists a frame twice`).toBe(row.frames.length);
      expect(row.frames.length, `the ${kind} has one frame, so it never changes`).toBeGreaterThan(1);
      for (let i = 1; i < row.frames.length; i++) {
        const before = SPRITE_EXTENT[SPRITE_KINDS[row.frames[i - 1]!]!];
        const after = SPRITE_EXTENT[SPRITE_KINDS[row.frames[i]!]!];
        expect(after, `the ${kind}'s frame ${i} is smaller than frame ${i - 1}`).toBeGreaterThan(before);
      }
      expect(row.body.sprite, `the ${kind} is spawned on a bitmap that is not its first frame`).toBe(row.frames[0]);
    }
  });

  it('the shard is the one row that never turns a page, and it is drawn as the shard', () => {
    expect(DEBRIS_ROWS.shard.hold).toBe(0);
    expect(DEBRIS_ROWS.shard.frames).toEqual([SPRITE.debris]);
    expect(DEBRIS_BY_KIND[DEBRIS_KIND.shard]).toBe(DEBRIS_ROWS.shard);
  });

  it('a burst is never as big as a boss and a spark is never as big as a burst', () => {
    /*
      ⚠️ **THE CEILING MOVED FROM THE BIGGEST ENEMY TO THE SMALLEST BOSS — 0229.** Under the enemies
      a fireball smaller than an enemy was never seen; over them (`src/app/mount.ts`) it may outgrow
      the body it came from, and what it may never do is be mistaken for a boss arriving.
    */
    const biggest = (kind: 'burst' | 'spark'): number =>
      Math.max(...DEBRIS_ROWS[kind].frames.map((s) => SPRITE_EXTENT[SPRITE_KINDS[s]!]));
    const smallestBoss = Math.min(
      ...SPRITE_KINDS.filter((k) => /^boss\d?$/.test(k)).map((k) => SPRITE_EXTENT[k]),
    );
    expect(biggest('burst')).toBeLessThan(smallestBoss);
    expect(biggest('burst'), 'a fireball smaller than the biggest enemy is the one nobody saw').toBeGreaterThan(SPRITE_EXTENT.warden);
    expect(biggest('spark')).toBeLessThan(SPRITE_EXTENT[SPRITE_KINDS[DEBRIS_ROWS.burst.frames[0]!]!] * 2);
    for (let i = 0; i < DEBRIS_ROWS.spark.frames.length; i++) {
      const spark = SPRITE_EXTENT[SPRITE_KINDS[DEBRIS_ROWS.spark.frames[i]!]!];
      const burst = SPRITE_EXTENT[SPRITE_KINDS[DEBRIS_ROWS.burst.frames[i]!]!];
      expect(spark, `spark frame ${i} is as big as the burst’s, so a hit and a death read alike`).toBeLessThan(burst);
    }
  });

  it('is drawn over the bodies and under every shot — 0229', () => {
    /*
      ⚠️ **THE REPORT WAS *I DIDN'T KNOW THERE WAS A FIREBALL IN GAME*.** It was drawn first, under
      everything; a fireball behind the bodies beside it is not a fireball. Over a body it reads as
      that body going up; over a bullet it would hide the one thing the player cannot lose track of,
      so every shot stays above it. Read off the game's own draw order in `src/app/mount.ts`, which
      is composed inside `mount` and cannot be built without a document.
    */
    const source = readFileSync(resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/app/mount.ts'), 'utf8');
    const match = /layers: \[([^\]]+)\]/.exec(source);
    expect(match, 'mount.ts no longer composes its draw order as one array literal').not.toBeNull();
    const order = match![1]!.split(',').map((s) => s.trim());
    const at = (name: string): number => {
      const i = order.indexOf(name);
      expect(i, `${name} is not in the draw order`).toBeGreaterThanOrEqual(0);
      return i;
    };
    expect(at('debris'), 'debris is drawn under the enemies, so a fireball is behind the body beside it').toBeGreaterThan(at('enemies'));
    expect(at('debris'), 'debris is drawn under the boss').toBeGreaterThan(at('bossPool'));
    expect(at('debris'), 'debris is drawn over enemy fire, so a fireball can hide a bullet').toBeLessThan(at('enemyShots'));
    expect(at('debris'), 'debris is drawn over the player’s fire').toBeLessThan(at('playerShots'));
    expect(at('debris'), 'debris is drawn over the ship').toBeLessThan(at('shipPool'));
  });

  it('leaves room in the debris pool for the fireballs a boss beat lights beside its shards', () => {
    /*
      The arithmetic `tests/budget.test.ts` holds for the shards, with the flares added: one per
      pulse, each alive for its whole walk, at the fastest pulse that reads as separate.
    */
    const flareLife = DEBRIS_ROWS.burst.frames.length * DEBRIS_ROWS.burst.hold;
    const bossBeat = (BURST.boss * BURST.lifeMax) / 5 + flareLife / 5;
    const shipBeat = (BURST.dying * BURST.lifeMax) / 8 + flareLife / 8 + BURST.ship + 1;
    expect(bossBeat + shipBeat, 'a boss and a ship coming apart together no longer fit the debris pool').toBeLessThanOrEqual(
      CAPACITY.debris,
    );
  });
});

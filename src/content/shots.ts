/**
 * The things that fly and hurt — the player's auto-fire, and what shoots back.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: nothing downstream switches on a shot's name, it reads the numbers off the entity
 * that was spawned from the row.
 *
 * ── EVERY SPEED HERE IS ABSOLUTE, AND THAT IS A RULE RATHER THAN A HABIT ────────────────────────
 *
 * ⚠️ **Never a multiple of `SHIP_SPEED`.** `reports/drag-feel-2026-08-05.md` says bullet speed and
 * enemy approach are *"relative to how fast the player can get out of the way"* — which is a
 * statement about the ORDER these get tuned in, and reads exactly like an instruction to write them
 * as ratios. Written as ratios, the dodge margin becomes invariant under `SHIP_SPEED` and the first
 * tuning pass measures a knob that no longer does the thing it is being turned for.
 *
 * `tests/combat.test.ts` holds it the only way it can be held: nothing under `src/content/` may
 * import the ship's constants, so a ratio cannot be spelled without the guard seeing it.
 * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 *
 * ⚠️ **Nothing may assert on the VALUES below**, on the same terms `src/sim/flight.ts` sets for
 * `SHIP_SPEED`: they are starting points, and what settles them is a hand and
 * `scripts/trace-frame.mjs` — `docs/decisions/0027-measure-the-picture-not-the-model.md`. What the
 * tests hold are the relationships that must be true at *any* value.
 */

import type { Body } from '../sim/entity.ts';
import { SPRITE } from './sprites.ts';

/** Every shot in the game. Closed. */
export type ShotKind = 'pulse' | 'spit' | 'missile' | 'bomb' | 'blast' | 'blastHalf' | 'blastWide' | 'blastWidest';

export interface ShotRow extends Body {
  /**
   * World units travelled per fixed step, always positive. Which way it points is the spawner's
   * business — the same row fired backwards is the same shot.
   *
   * ⚠️ **Relative to the CAMERA, not to the world**, which is the frame `src/sim/flight.ts` already
   * flies the ship in and therefore the frame the player sees. `src/app/frame.ts` adds the scroll
   * rate when it spawns the shot, and the reason it has to is written there: a shot aimed in world
   * coordinates arrives where the ship *was*, because the ship drifts up-lane for every step the
   * shot is in the air.
   *
   * ⚠️ **No upper bound, and that is bought rather than assumed.** `src/sim/collide.ts` sweeps the
   * step instead of testing two current positions, so a shot cannot step over its target however
   * fast it goes. Without that there would be a ceiling here of roughly `radius + target radius`
   * minus the ship's own top speed — a hard limit sitting directly in front of the constant the next
   * tuning pass is supposed to raise.
   */
  speed: number;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const SHOT_KINDS: readonly ShotKind[] = [
  'pulse',
  'spit',
  'missile',
  'bomb',
  'blast',
  'blastHalf',
  'blastWide',
  'blastWidest',
];

/**
 * How far a bomb's blast reaches, in world units — and the unit the other three are counted in.
 *
 * ⚠️ **Hoisted so the ladder below is arithmetic rather than four numbers that have to agree.** The
 * ask that produced the wide ones states them as multiples of this one — *"0 bombs = half current
 * bomb explosion size, 1 bomb = bomb explosion, 2 bombs = increased explosion size, 3 increased
 * further"* — so writing 17, 51 and 68 here would be three hand-computed copies of a relationship the
 * player stated, and the day this number moves they would each go on saying the old thing.
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 */
const BLAST_RADIUS = 34;

export const SHOTS: Record<ShotKind, ShotRow> = {
  /**
   * The player's auto-fire. Fast, small, and cheap to survive being wrong about — it is the shot
   * `docs/game.md` says the player never thinks about.
   */
  // ⚠️ `spriteHit` is the same bitmap, and that is honest rather than lazy: a shot has one health,
  // so it never survives a hit and never flashes. There is no second silhouette to draw.
  pulse: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 0.9, health: 1, damage: 1, speed: 2.6 },
  /**
   * What an enemy sends back. **Slower than the ship**, which is the whole of what makes it
   * dodgeable rather than a coin flip: a player who reacts can always leave the line it is on.
   */
  spit: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 0.9, health: 1, damage: 1, speed: 1.4 },
  /**
   * The player's second auto-weapon: slower than the pulse, and worth three of it.
   *
   * Asked for after playing the two-level build: *"missiles — a second auto-weapon, slower than the
   * pulse, 3x its damage, fired from launchers on the ship."*
   *
   * ⚠️ **The DAMAGE is a ratio and the SPEED is not, and that asymmetry is the rule this file opens
   * with.** *Three times the pulse* is what was asked for and it is a relationship between two of the
   * player's own weapons — `tests/combat.test.ts` holds it as a ratio, so tuning the pulse moves the
   * missile with it. A speed written as a ratio would be the banned kind: what makes a threat
   * dodgeable is measured against the ship, and 0034 keeps every speed absolute for exactly that
   * reason. 1.5 is slower than the pulse's 2.6 and that is the whole of what the ask says about it.
   *
   * ⚠️ **Bigger radius than the pulse**, because a heavier shot that misses by the same margin as a
   * light one is a shot the player cannot aim differently. It stays well under the smallest enemy.
   */
  missile: { sprite: SPRITE.missile, spriteHit: SPRITE.missile, radius: 1.3, health: 1, damage: 3, speed: 1.5 },
  /**
   * The bomb itself, which hurts nothing at all.
   *
   * ⚠️ **`damage` is 0 and that is not an oversight.** A bomb is spent by its FUSE rather than by
   * arriving — it is in no collision pairing, exactly like debris, so it passes through whatever it
   * is aimed at and goes off where the player aimed it. A bomb that detonated on contact would be a
   * missile with a bigger number, and the thing that makes it a skill is choosing the PLACE.
   */
  bomb: { sprite: SPRITE.bomb, spriteHit: SPRITE.bomb, radius: 2, health: 1, damage: 0, speed: 2.2 },
  /**
   * What a bomb becomes: six pulses of damage, everywhere inside a third of the lane.
   *
   * ⚠️ **The damage is a RATIO of the pulse's, like the missile's is** — *"6× a pulse's damage"* is
   * what was asked for, and it is a relationship between two of the player's own weapons.
   *
   * ⚠️ **`radius` is the reach of the damage AND the size it is drawn at**, and the two are held to
   * each other by `tests/bombs.test.ts` because they live in different files. Everywhere else in
   * this project the hurtbox is deliberately smaller than the art
   * (`src/content/sprites.ts`) — a blast is the one body where that would be a lie, because the
   * player is inside it too and is being asked to judge the edge.
   *
   * ⚠️ **`speed` is 0: it does not travel.** It appears where the bomb was and stays there while the
   * world moves past it, which is what a shockwave in a scrolling world looks like.
   */
  blast: { sprite: SPRITE.blast, spriteHit: SPRITE.blast, radius: BLAST_RADIUS, health: 1, damage: 6, speed: 0 },
  /*
    ── THE THREE OTHER RUNGS OF THE PYRE, AND THE MIDDLE ONE IS `blast` ITSELF ─────────────────────

    Asked for in play: *"the player's ship (and only the player's ship) exploding on death should fire
    all unspent bombs at the player ship's location with an expanding ring based on number of bombs —
    0 bombs = half current bomb explosion size, 1 bomb = bomb explosion, 2 bombs = increased explosion
    size, 3 increased further."*
    `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.

    ⚠️ **Four rungs and only three rows, because the ask names the second one as a thing that already
    exists**: *"1 bomb = bomb explosion"* is the bomb's own blast, so `PYRES` in
    `src/content/specials.ts` lists `blast` at that rung rather than a fourth row saying 34 again.

    ⚠️ **A SIZE ladder and not a DAMAGE one.** Every rung takes exactly what a bomb takes, because
    what the player is being given is room rather than a stronger weapon — and a rung that also hit
    harder would make dying with a full arsenal the best way to kill a boss.

    ⚠️ **Each is a separate row because each is a separate BITMAP.** `src/render/surface.ts` blits at
    the extent the atlas baked, so *the same ring, larger* is not something a caller can ask for — the
    picture and the reach are one number (`src/content/sprites.ts`), and `tests/death.test.ts` holds
    all four pairs to each other the way `tests/bombs.test.ts` already held the first.
  */
  blastHalf: {
    sprite: SPRITE.blastHalf,
    spriteHit: SPRITE.blastHalf,
    radius: BLAST_RADIUS * 0.5,
    health: 1,
    damage: 6,
    speed: 0,
  },
  blastWide: {
    sprite: SPRITE.blastWide,
    spriteHit: SPRITE.blastWide,
    radius: BLAST_RADIUS * 1.5,
    health: 1,
    damage: 6,
    speed: 0,
  },
  blastWidest: {
    sprite: SPRITE.blastWidest,
    spriteHit: SPRITE.blastWidest,
    radius: BLAST_RADIUS * 2,
    health: 1,
    damage: 6,
    speed: 0,
  },
};

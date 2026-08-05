/**
 * What is coming the other way.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Two kinds,
 * which is enough to make the table's shape real without authoring a level's worth of content in a
 * PR whose subject is whether the ship can be killed at all — `docs/game.md` owns the roster, and
 * adding to it stays a table edit.
 *
 * ⚠️ **Speeds are absolute, never a multiple of `SHIP_SPEED`** — the rule and its reasoning are in
 * `src/content/shots.ts`, and the guard is in `tests/combat.test.ts`. Not repeated here beyond the
 * pointer, per `docs/decisions/0029-the-tracked-record-is-the-record.md`.
 */

import type { Body } from '../sim/entity.ts';
import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/** Every enemy in the game. Closed. */
export type EnemyKind = 'drifter' | 'lancer';

export interface EnemyRow extends Body {
  /**
   * World units per step it closes on the player, ON TOP of the camera's own advance.
   *
   * ⚠️ Positive means *towards* the trailing edge, which is towards the player. It is not the
   * entity's velocity — the spawner negates it — because a table that stored a negative number for
   * "approaching" is a table where a typo produces an enemy that flees and nothing looks wrong.
   */
  closing: number;
  /** Steps between shots. `0` never fires, which is what makes a pure obstacle a row rather than a type. */
  fireEvery: number;
  /** What it fires. Ignored when `fireEvery` is `0`. */
  shot: ShotKind;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const ENEMY_KINDS: readonly EnemyKind[] = ['drifter', 'lancer'];

export const ENEMIES: Record<EnemyKind, EnemyRow> = {
  /**
   * Holds its line and never fires. The thing you shoot while you are learning where the lane is —
   * and the case that proves `fireEvery: 0` is a row rather than a second entity type.
   *
   * ⚠️ **One health, so the harmless one dies to one shot.** It shipped at two, which meant the
   * FIRST hit on every enemy in the game changed nothing visible and read as a bug. The flash fixes
   * the reading; this makes the common case not need one, and buys the two kinds a difference the
   * player feels rather than only sees.
   */
  drifter: {
    sprite: SPRITE.drifter,
    spriteHit: SPRITE.drifterHit,
    radius: 2.6,
    health: 1,
    damage: 2,
    closing: 0,
    fireEvery: 0,
    shot: 'spit',
  },
  /**
   * Closes, and shoots where the ship is. Aimed rather than sprayed, because the quantity this whole
   * build exists to make measurable is *whether the player can get out of the way* — and a shot that
   * was never coming at them measures nothing.
   *
   * Two health, and it is the only thing in the game that takes two — so "it did not die" is now a
   * fact about the lancer specifically, told by a silhouette the player can read before firing.
   */
  lancer: {
    sprite: SPRITE.lancer,
    spriteHit: SPRITE.lancerHit,
    radius: 2.6,
    health: 2,
    damage: 2,
    closing: 0.35,
    fireEvery: 75,
    shot: 'spit',
  },
};

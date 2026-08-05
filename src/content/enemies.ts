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
export type EnemyKind = 'drifter' | 'lancer' | 'weaver' | 'turret' | 'charger';

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
  /**
   * How far it swings either side of the line it was spawned on, in world units. `0` flies straight.
   *
   * ── WHY TWO NUMBERS AND NOT A `motion` UNION ────────────────────────────────────────────────────
   *
   * A closed union of motion kinds — `'straight' | 'weave' | 'dive'` — is the shape
   * `docs/decisions/0016-a-hub-enumerates-kinds.md` reaches for, and it is the wrong one *here*,
   * because a straight line is a weave of amplitude zero. A union would enumerate two members that
   * are one member with a parameter, and every consumer would carry a `switch` proving it.
   *
   * The union earns its place the moment a motion arrives that is **not** a parameterisation of this
   * one — something that turns towards the player, or stops. That is a real trigger rather than a
   * someday, and it is named here so the next person does not have to re-derive it.
   *
   * ⚠️ **The path is a function of `along`, not of elapsed time.** Two of these spawned four seconds
   * apart trace the same shape through the same piece of world, which is what makes a level
   * authorable — a formation is a picture, not a coincidence of when it happened to be created.
   * A weaver with `closing: 0` therefore does not weave at all, because it never moves along.
   */
  weaveAmplitude: number;
  /** World units along per complete swing. Ignored when `weaveAmplitude` is `0`. */
  weaveWavelength: number;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const ENEMY_KINDS: readonly EnemyKind[] = ['drifter', 'lancer', 'weaver', 'turret', 'charger'];

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
    weaveAmplitude: 0,
    weaveWavelength: 0,
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
    // Bigger on screen, so bigger to hit. A drawn size and a hurtbox that disagree is the complaint
    // `tests/combat.test.ts` holds a band against, in both directions.
    radius: 3.2,
    health: 2,
    damage: 2,
    closing: 0.35,
    fireEvery: 75,
    shot: 'spit',
    weaveAmplitude: 0,
    weaveWavelength: 0,
  },
  /**
   * Crosses the lane while it closes, and never fires.
   *
   * The one enemy whose threat is **where it will be** rather than what it sends. A drifter is a
   * target and a lancer is a shot to dodge; this is neither, and it is the first thing in the game
   * that makes the player lead a moving object with the auto-fire they otherwise never think about.
   *
   * ⚠️ **Amplitude 9, which is a bound of 18 and not of 9.** The path is `across₀ + A·(sin k·along −
   * sin k·along₀)`: every weaver traces a full swing of ±A, but where that swing is CENTRED depends
   * on the phase it happened to spawn at, and that shifts it by up to another A. So the lane a wave
   * is authored on has to leave `2A` clear on both sides, not `A` — `tests/level.test.ts` checks
   * every authored wave against that bound rather than trusting the author to have done the algebra.
   */
  weaver: {
    sprite: SPRITE.weaver,
    spriteHit: SPRITE.weaverHit,
    radius: 2.2,
    health: 1,
    damage: 2,
    closing: 0.5,
    fireEvery: 0,
    shot: 'spit',
    weaveAmplitude: 7,
    // 110 units is about 3 seconds of camera at the current scroll — roughly one full swing per
    // crossing of the screen, so the shape is legible rather than a vibration.
    weaveWavelength: 110,
  },
  /**
   * Holds its ground and fires faster than anything else.
   *
   * ⚠️ **Three health, so it is the first thing that cannot be cleared in passing.** The player has
   * to choose between spending time on it and living with it, which is the choice a level is made
   * of. `closing: 0` means it arrives with the world rather than coming to meet you — so it is
   * always on screen for a known amount of time, and a formation can be authored around that.
   */
  turret: {
    sprite: SPRITE.turret,
    spriteHit: SPRITE.turretHit,
    radius: 3.7,
    health: 3,
    damage: 2,
    closing: 0,
    // Faster than the lancer's 75 and it is the whole of what this enemy is. `docs/state-of-play.md`
    // says no enemy shot has ever landed on an attentive player; this is the row that tests that.
    fireEvery: 48,
    shot: 'spit',
    weaveAmplitude: 0,
    weaveWavelength: 0,
  },
  /**
   * Comes straight at you, fast, and dies to one shot.
   *
   * A pure contact threat: no weapon, one health, and roughly three times the lancer's closing
   * speed. It punishes a player who is looking at the wrong part of the lane, and it rewards the
   * auto-fire they already have — which is the right shape for the first fast thing in a game whose
   * skill is *surviving the onslaught, not mashing a fire button*.
   */
  charger: {
    sprite: SPRITE.charger,
    spriteHit: SPRITE.chargerHit,
    radius: 2.4,
    health: 1,
    damage: 2,
    closing: 1.1,
    fireEvery: 0,
    shot: 'spit',
    weaveAmplitude: 0,
    weaveWavelength: 0,
  },
};

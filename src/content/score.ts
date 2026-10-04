/**
 * The score: what a kill is worth, what a streak multiplies, what a level's clear adds for what the
 * ship is still carrying, and the letter a level is given — 0428.
 *
 * Asked for 2026-09-30: *"points counter top right that should look flashy. increasing streak when
 * you don't get hit - a shield taking a hit counts as a hit and resets the counter. end of level
 * splash screen showing points gained, rank for the level, bonus points based on number of shields
 * still held, number of bombs still held, number of missile powerups still held."*
 *
 * ⚠️ **What a body is worth rides its row** — `points` on `EnemyRow` and `BossRow` — and this file
 * holds only what is the same for every body: the multiplier, the bonuses and the ranks. Every number
 * here is a play number, set before anybody has played it.
 */

import type { Side } from './specials.ts';

/**
 * Kills without a hit it takes to climb one step of the multiplier. A shield taking a hit is a hit:
 * the ask's own words, and the streak goes back to nothing on it exactly as it does on a death.
 */
export const STREAK_STEP = 10;

/** The most the streak can multiply a kill by. Reached at `STREAK_STEP × (cap − 1)` kills. */
export const MULTIPLIER_CAP = 8;

/** What a kill is multiplied by, `streak` kills since the last hit. */
export function multiplierFor(streak: number): number {
  return Math.min(MULTIPLIER_CAP, 1 + Math.floor(Math.max(0, streak) / STREAK_STEP));
}

/**
 * What a level's clear pays for each thing still held — the three the ask names. Closed.
 *
 * ⚠️ **A bomb is a charge on the GUN's stack and a missile powerup is a charge on the TUBES'** —
 * 0376 split the arsenal into the two triggers' stacks, and those are the two things a player can
 * still be holding. A missile LADDER tier is not held, it is fitted, and is not paid for.
 */
export const BONUS_KINDS = ['shield', 'bomb', 'missile'] as const;
export type BonusKind = (typeof BONUS_KINDS)[number];

export interface BonusRow {
  /** What the tally calls it. */
  label: string;
  /** Points for each one held when the level is cleared. */
  each: number;
  /** Which stack of the arsenal it is counted off, or `null` for the shell. */
  side: Side | null;
}

export const BONUSES: Record<BonusKind, BonusRow> = {
  shield: { label: 'Shields', each: 5000, side: null },
  bomb: { label: 'Bombs', each: 3000, side: 'gun' },
  missile: { label: 'Missiles', each: 3000, side: 'tubes' },
};

/**
 * The letter a level is given, best first. Closed, and the order is load-bearing: `rankFor` takes
 * the first row the level qualifies for, and the last row takes everything.
 */
export const RANK_KINDS = ['S', 'A', 'B', 'C', 'D'] as const;
export type RankKind = (typeof RANK_KINDS)[number];

export interface RankRow {
  /** The least share of the level's bodies killed, 0–1. */
  killed: number;
  /** The most hits taken — a shield's or the hull's, each one counted. */
  hits: number;
}

export const RANKS: Record<RankKind, RankRow> = {
  S: { killed: 0.9, hits: 0 },
  A: { killed: 0.75, hits: 1 },
  B: { killed: 0.5, hits: 3 },
  C: { killed: 0.25, hits: Number.POSITIVE_INFINITY },
  D: { killed: 0, hits: Number.POSITIVE_INFINITY },
};

/** The letter for a level that killed `kills` of the `spawned` bodies it sent and took `hits`. */
export function rankFor(kills: number, spawned: number, hits: number): RankKind {
  const share = spawned > 0 ? kills / spawned : 1;
  for (const kind of RANK_KINDS) {
    const row = RANKS[kind];
    if (share >= row.killed && hits <= row.hits) return kind;
  }
  return 'D';
}

/** How many of each bonus kind are held. */
export type Held = Readonly<Record<BonusKind, number>>;

/** A cleared level's account — what the splash shows, and what the run banks. Plain data. */
export interface LevelTally {
  /** Which level, zero-based. */
  level: number;
  /** Points from kills, streak and bosses. */
  points: number;
  rank: RankKind;
  held: Held;
  /** Every bonus added together. */
  bonus: number;
  /** `points + bonus`: what the level added to the run. */
  total: number;
  /**
   * What the rank was read from: bodies killed, bodies sent, hits taken — kept since 0517, because the
   * game-over screen adds them up over the run and the letter alone cannot be added.
   */
  kills: number;
  spawned: number;
  hits: number;
}

/** The bonus for what is held, all kinds added together. */
export function bonusFor(held: Held): number {
  let sum = 0;
  for (const kind of BONUS_KINDS) sum += BONUSES[kind].each * Math.max(0, held[kind]);
  return sum;
}

/** A cleared level's account, from what the frame counted and what the ship is carrying. */
export function tallyOf(level: number, points: number, kills: number, spawned: number, hits: number, held: Held): LevelTally {
  const bonus = bonusFor(held);
  return { level, points, rank: rankFor(kills, spawned, hits), held, bonus, total: points + bonus, kills, spawned, hits };
}

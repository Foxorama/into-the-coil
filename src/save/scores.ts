/**
 * The high-score table — 0429, and the first thing the game keeps between visits.
 *
 * Asked for 2026-09-30: *"rolling high score table on the game menu screen."* The best ten runs,
 * best first; an eleventh that beats the lowest pushes it off the bottom, and one that does not is
 * not kept.
 *
 * ⚠️ **THE FIRST `itc_*` KEY, SO IT IS THE FIRST THING HERE THAT CANNOT BE TAKEN BACK.** A table a
 * player has filled is theirs once it ships, so the shape is versioned from 1 (`docs/game.md`'s
 * storage rule) and read defensively: anything that does not parse, or a row that names a golfer or
 * a tier the game no longer has, is dropped rather than trusted, and a table that cannot be read is
 * an empty table — never an error on the title. `PRIVACY.md` lists the key, and
 * `tests/privacy.test.ts` holds that both ways.
 *
 * ⚠️ **Time is an argument.** 0015 refuses this layer the clock, so the shell says when a run ended.
 */

import { GOLFER_KINDS, type GolferKind } from '../content/golfers.ts';
import { DIFFICULTY_KINDS, type DifficultyKind } from '../content/difficulty.ts';

/** Where the table lives. Named once; `PRIVACY.md` names it too, and a test holds the two together. */
export const SCORES_KEY = 'itc_scores';

/** The shape's version. A change to `ScoreEntry` that an old table cannot be read as bumps it. */
export const SCORES_VERSION = 1;

/** How many runs the table keeps. */
export const TABLE_SIZE = 10;

/** One finished run. Plain data, because it is written as JSON and read back as JSON. */
export interface ScoreEntry {
  /** Everything the run scored, bonuses included. */
  score: number;
  /** The part of it that was bonuses. */
  bonus: number;
  /** Who flew it. */
  pilot: GolferKind;
  /** On which tier. */
  difficulty: DifficultyKind;
  /** Levels cleared — the whole coil is `LEVEL_KINDS.length`. */
  levels: number;
  /** Whether the last boss fell. */
  cleared: boolean;
  /** Continues it took. */
  continues: number;
  /** When it ended, in milliseconds since the epoch — the shell's clock, handed in. */
  when: number;
}

/** What the table is read from and written to — `localStorage` in the game, a map in a test. */
export interface ScoreStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * The browser's storage, or `null` where there is none to be had — a sandboxed frame, a private
 * window that throws on access, a browser with site data blocked. The table is then not kept, and
 * nothing else about the game changes.
 */
export function browserStore(): ScoreStore | null {
  try {
    const store = globalThis.localStorage;
    return store === undefined ? null : store;
  } catch {
    return null;
  }
}

const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && Math.floor(n) === n;

/** One row as it was read, or `null` if it is not a row this version can trust. */
function entryFrom(raw: unknown): ScoreEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  // Keyed by the row's own fields, so nothing here reads a field the row does not have.
  const r = raw as Partial<Record<keyof ScoreEntry, unknown>>;
  const pilot = GOLFER_KINDS.find((k) => k === r.pilot);
  const difficulty = DIFFICULTY_KINDS.find((k) => k === r.difficulty);
  if (pilot === undefined || difficulty === undefined) return null;
  if (!isCount(r.score) || !isCount(r.bonus) || !isCount(r.levels) || !isCount(r.continues) || !isCount(r.when)) return null;
  if (typeof r.cleared !== 'boolean') return null;
  return {
    score: r.score,
    bonus: r.bonus,
    pilot,
    difficulty,
    levels: r.levels,
    cleared: r.cleared,
    continues: r.continues,
    when: r.when,
  };
}

/** Best first; a tie goes to the run that got there first. */
function better(a: ScoreEntry, b: ScoreEntry): number {
  return b.score - a.score || a.when - b.when;
}

/** The table as `text` holds it, best first and at most `TABLE_SIZE` long. Never throws. */
export function parseScores(text: string | null): ScoreEntry[] {
  if (text === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (typeof data !== 'object' || data === null) return [];
  const doc = data as { v?: unknown; entries?: unknown };
  if (doc.v !== SCORES_VERSION || !Array.isArray(doc.entries)) return [];
  const out: ScoreEntry[] = [];
  for (const raw of doc.entries) {
    const entry = entryFrom(raw);
    if (entry !== null) out.push(entry);
  }
  return out.sort(better).slice(0, TABLE_SIZE);
}

/** The table as it is written. */
export function serialiseScores(table: readonly ScoreEntry[]): string {
  return JSON.stringify({ v: SCORES_VERSION, entries: table });
}

/**
 * `entry` placed in `table` — the new table, and where it landed (zero-based), or `null` when it did
 * not make it. Pure: nothing is written.
 */
export function placeScore(table: readonly ScoreEntry[], entry: ScoreEntry): { table: ScoreEntry[]; place: number | null } {
  const next = [...table, entry].sort(better).slice(0, TABLE_SIZE);
  const place = next.indexOf(entry);
  return { table: next, place: place < 0 ? null : place };
}

/** The table in `store`, or an empty one. Never throws. */
export function readScores(store: ScoreStore | null): ScoreEntry[] {
  if (store === null) return [];
  try {
    return parseScores(store.getItem(SCORES_KEY));
  } catch {
    return [];
  }
}

/**
 * `entry` put in the table in `store` and the table written back — the table as it now stands and
 * where the run landed. A store that refuses the write (full, blocked) keeps the table it had; the
 * run is still placed in what is returned, so the screen that shows it is not wrong for this visit.
 */
export function recordScore(store: ScoreStore | null, entry: ScoreEntry): { table: ScoreEntry[]; place: number | null } {
  const placed = placeScore(readScores(store), entry);
  if (store !== null && placed.place !== null) {
    try {
      store.setItem(SCORES_KEY, serialiseScores(placed.table));
    } catch {
      // Kept for the visit and not beyond it; nothing else is owed.
    }
  }
  return placed;
}

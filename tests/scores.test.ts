import { describe, expect, it } from 'vitest';
import {
  SCORES_KEY,
  SCORES_VERSION,
  TABLE_SIZE,
  parseScores,
  placeScore,
  readScores,
  recordScore,
  serialiseScores,
  type ScoreEntry,
  type ScoreStore,
} from '../src/save/scores.ts';

/**
 * THE TABLE IS KEPT — `docs/decisions/0429-the-table-is-kept.md`, and the first `itc_*` key.
 *
 * ⚠️ **What is held is what cannot be taken back once it ships**: a table a player has filled reads
 * back as the same table, a table this version cannot trust reads as an empty one rather than an
 * error on the title, and a store that refuses to be written does not take the game down with it.
 */

const run = (score: number, when: number, extra: Partial<ScoreEntry> = {}): ScoreEntry => ({
  score,
  bonus: 0,
  pilot: 'feather',
  difficulty: 'savior',
  levels: 3,
  cleared: false,
  continues: 0,
  when,
  ...extra,
});

/** A store over a map, which can be told to refuse. */
function memory(refuse = false): ScoreStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (refuse) throw new Error('QuotaExceededError');
      data.set(key, value);
    },
  };
}

describe('0429 — the high-score table', () => {
  it('THE ASK: it rolls — the best ten kept, best first, and an eleventh that beats the lowest pushes it off', () => {
    let table: ScoreEntry[] = [];
    for (let i = 0; i < TABLE_SIZE; i++) table = placeScore(table, run(1000 * (i + 1), i)).table;
    expect(table.map((e) => e.score)).toEqual([10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000]);
    const beat = placeScore(table, run(4500, 99));
    expect(beat.place).toBe(6);
    expect(beat.table.length).toBe(TABLE_SIZE);
    expect(beat.table[TABLE_SIZE - 1]!.score, 'the lowest was not pushed off').toBe(2000);
    const missed = placeScore(table, run(500, 99));
    expect(missed.place, 'a run below the whole table was placed').toBeNull();
    expect(missed.table).toEqual(table);
  });

  it('a tie goes to the run that got there first', () => {
    const first = run(5000, 1);
    const second = run(5000, 2);
    expect(placeScore([first], second).place).toBe(1);
  });

  it('reads back exactly what it wrote, under the key PRIVACY.md names', () => {
    const store = memory();
    const entry = run(31337, 1_700_000_000_000, { pilot: 'woo', difficulty: 'burn', cleared: true, continues: 2, bonus: 4000, levels: 7 });
    expect(recordScore(store, entry).place).toBe(0);
    expect([...store.data.keys()]).toEqual([SCORES_KEY]);
    expect(readScores(store)).toEqual([entry]);
    expect(JSON.parse(store.data.get(SCORES_KEY)!).v).toBe(SCORES_VERSION);
  });

  it('a table it cannot trust is an empty table, never an error — and a bad row costs only itself', () => {
    expect(parseScores(null)).toEqual([]);
    expect(parseScores('not json')).toEqual([]);
    expect(parseScores('null')).toEqual([]);
    expect(parseScores(JSON.stringify({ v: SCORES_VERSION + 1, entries: [run(1, 1)] })), 'a newer version was trusted').toEqual([]);
    const good = run(900, 3);
    const text = JSON.stringify({
      v: SCORES_VERSION,
      entries: [
        good,
        { ...run(800, 4), pilot: 'nobody' },
        { ...run(700, 5), difficulty: 'impossible' },
        { ...run(600, 6), score: -1 },
        { ...run(500, 7), score: Number.NaN },
        { ...run(400, 8), cleared: 'yes' },
        'a string',
      ],
    });
    expect(parseScores(text)).toEqual([good]);
  });

  it('a store that refuses the write keeps what it had, and the run is still placed for the visit', () => {
    const store = memory(true);
    const placed = recordScore(store, run(100, 1));
    expect(placed.place).toBe(0);
    expect(store.data.size).toBe(0);
    // And no store at all is a table of nothing, not a throw.
    expect(recordScore(null, run(100, 1)).place).toBe(0);
    expect(readScores(null)).toEqual([]);
  });

  it('what it writes is what it parses', () => {
    const table = [run(3, 1), run(2, 2)];
    expect(parseScores(serialiseScores(table))).toEqual(table);
  });
});

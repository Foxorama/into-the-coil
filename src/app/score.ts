/**
 * What the shell says about the score — 0428 and 0429: a cleared level's tally, the lines each
 * account screen shows, and the table's rows as the title draws them.
 *
 * ⚠️ **Pure, and apart from `mount.ts` for the reason `lifecycle.ts` is**: a question like *does the
 * break show the level's total and the run's* should be answerable without mounting a canvas.
 * `tests/score.test.ts` asks them here.
 */

import { BONUSES, BONUS_KINDS, shardsFor, tallyOf, type BonusKind, type Held, type LevelTally } from '../content/score.ts';
import { GOLFERS } from '../content/golfers.ts';
import { bankedBonus, bankedScore, type RunState } from '../state/slices/run.ts';
import type { ScoreEntry } from '../save/scores.ts';
import type { GolferKind } from '../content/golfers.ts';
import type { LevelScore } from './frame.ts';
import type { BoardLine, SheetLine } from './chrome.ts';

/**
 * A cleared level's account, from what the frame counted and what the ship is carrying as it clears:
 * the shields on its hull and each trigger's charges — 0428's three bonuses.
 */
export function tallyAtClear(run: RunState, score: LevelScore, shields: number): LevelTally {
  const held: Record<BonusKind, number> = { shield: 0, bomb: 0, missile: 0 };
  for (const kind of BONUS_KINDS) {
    const side = BONUSES[kind].side;
    held[kind] = side === null ? shields : run.arsenal[side].length;
  }
  return tallyOf(run.level, score.points, score.kills, score.spawned, score.hits, held);
}

/** The run's score as it stands: every cleared level, and the points of the level being flown. */
export function runScore(run: RunState, score: LevelScore): number {
  return bankedScore(run) + score.points;
}

/*
  ── A RUN'S STAR SHARDS — 0522 ─────────────────────────────────────────────────────────────────────

  Asked for: *"the highest points you earned in a continue run grant you 1 Star Shard per 10,000 pts.
  in a non-continue run, you'll only have highest score for that run."* So a run pays for its BEST
  credit, once, at the run's end — never the credits added up, which would pay Freeplay's endless
  continues for every one of them, and never at a continue, which ends a credit and not the run.
*/

/** What a run has earned towards its Star Shards. The shell keeps one, and a new run starts it again. */
export interface ShardLedger {
  /** The best credit's score so far. */
  best: number;
  /** Whether the run has been paid, so a second way out of it pays nothing. */
  paid: boolean;
}

/** A run that has scored nothing and been paid nothing. */
export function freshLedger(): ShardLedger {
  return { best: 0, paid: false };
}

/** A credit has ended on `score` — a continue, or the run's last. */
export function creditEnded(ledger: ShardLedger, score: number): void {
  if (score > ledger.best) ledger.best = score;
}

/** The shards the run would pay with a credit still being flown on `score`: its best credit, either way. */
export function shardsOwed(ledger: ShardLedger, score: number): number {
  return shardsFor(Math.max(ledger.best, score));
}

/** The run's end: its shards, once. A second end of the same run pays nothing. */
export function payRun(ledger: ShardLedger): number {
  if (ledger.paid) return 0;
  ledger.paid = true;
  return shardsFor(ledger.best);
}

/** The account's line for the shards a run paid — 0522. */
function shardLine(shards: number): SheetLine {
  return { label: 'Star Shards', value: '+' + String(shards), tone: 'total' };
}

/** The label a bonus line wears: what it is and how many were held. */
function bonusLabel(kind: BonusKind, held: Held): string {
  return BONUSES[kind].label + ' ×' + String(held[kind]);
}

/**
 * The break's account — 0428, in the ask's words: *"points gained, rank for the level, bonus points
 * based on number of shields still held, number of bombs still held, number of missile powerups still
 * held. each level should show total for that level and total overall score."*
 */
export function levelSheet(tally: LevelTally, run: RunState): SheetLine[] {
  const lines: SheetLine[] = [
    { label: 'Points', value: tally.points, tone: 'plain' },
    { label: 'Rank', value: tally.rank, tone: 'rank' },
  ];
  for (const kind of BONUS_KINDS) {
    lines.push({ label: bonusLabel(kind, tally.held), value: BONUSES[kind].each * tally.held[kind], tone: 'plain' });
  }
  lines.push({ label: 'Level total', value: tally.total, tone: 'total' });
  lines.push({ label: 'Score', value: bankedScore(run), tone: 'total' });
  return lines;
}

/** The ranks of every cleared level, in order — the run's report card, one letter a level. */
export function ranksOf(run: RunState): string {
  return run.tallies.map((t) => t.rank).join(' ');
}

/**
 * The victory's account — 0428: *"end of game level showing total score with total bonuses"*, and
 * where the run landed on the table (0429).
 */
export function runSheet(run: RunState, place: number | null, shards: number): SheetLine[] {
  const bonus = bankedBonus(run);
  const score = bankedScore(run);
  const lines: SheetLine[] = [];
  if (run.tallies.length > 0) lines.push({ label: 'Ranks', value: ranksOf(run), tone: 'plain' });
  lines.push({ label: 'Points', value: score - bonus, tone: 'plain' });
  lines.push({ label: 'Bonuses', value: bonus, tone: 'plain' });
  lines.push({ label: 'Final score', value: score, tone: 'total' });
  lines.push({ label: 'High score', value: placeLabel(place), tone: 'plain' });
  // 0522: and what the run paid, last, because it is what the run is worth after the score.
  lines.push(shardLine(shards));
  return lines;
}

/**
 * The run over's account — 0428, and since 0438 the credit's last word: a continue starts the score
 * again, so this screen is where the one that ran out is read. Its score, how far it got, and where it
 * lands on the table — `place` is where it WOULD land, because it is put there only when the player
 * continues or the offer runs out, and either way it lands exactly there.
 */
export function overSheet(run: RunState, score: LevelScore, place: number | null, owed: number): SheetLine[] {
  return [
    { label: 'Score', value: runScore(run, score), tone: 'total' },
    { label: 'Reached', value: 'Level ' + String(run.level + 1), tone: 'plain' },
    { label: 'High score', value: placeLabel(place), tone: 'plain' },
    /*
      0522: what the run will pay if it stops here — its best credit so far, this one among them. Not
      paid yet: a continue may beat it, and the run pays once, when it ends.
    */
    { label: 'Star Shards', value: String(owed), tone: 'plain' },
  ];
}

/**
 * The game over's account — 0517: *"the score summary and stats about that run."* How far it got and
 * each cleared level's letter, what it shot down and what hit it, then the victory's summary: points,
 * bonuses, the score and where it landed on the table.
 *
 * ⚠️ **THE LEVEL BEING FLOWN COUNTS TOO.** It was never cleared, so it has no tally, but its kills and
 * hits are the frame's, and a run that died on level one would otherwise read as nothing shot at all.
 * A run with one credit is the whole run, so the tallies are every level it cleared.
 */
export function endSheet(run: RunState, score: LevelScore, place: number | null, shards: number): SheetLine[] {
  let kills = score.kills;
  let spawned = score.spawned;
  let hits = score.hits;
  for (const tally of run.tallies) {
    kills += tally.kills;
    spawned += tally.spawned;
    hits += tally.hits;
  }
  const bonus = bankedBonus(run);
  const total = runScore(run, score);
  const lines: SheetLine[] = [{ label: 'Reached', value: 'Level ' + String(run.level + 1), tone: 'plain' }];
  if (run.tallies.length > 0) lines.push({ label: 'Ranks', value: ranksOf(run), tone: 'plain' });
  lines.push({ label: 'Kills', value: kills, tone: 'plain' });
  lines.push({ label: 'Shot down', value: String(spawned > 0 ? Math.round((100 * kills) / spawned) : 0) + '%', tone: 'plain' });
  lines.push({ label: 'Hits taken', value: hits, tone: 'plain' });
  lines.push({ label: 'Points', value: total - bonus, tone: 'plain' });
  lines.push({ label: 'Bonuses', value: bonus, tone: 'plain' });
  lines.push({ label: 'Final score', value: total, tone: 'total' });
  lines.push({ label: 'High score', value: placeLabel(place), tone: 'plain' });
  lines.push(shardLine(shards));
  return lines;
}

/** Where a run landed, in words. */
export function placeLabel(place: number | null): string {
  return place === null ? '—' : '#' + String(place + 1);
}

/**
 * A finished credit as the table keeps it — 0429, and a credit rather than a run since 0438: a continue
 * puts the credit that ran out on the table and starts the score again. `when` is the shell's clock.
 *
 * ⚠️ **`levels` is the RUN's level, not the credit's tallies.** They were one number while a continue
 * kept the tallies; since 0438 a credit bought on level five has cleared nothing of its own, and the
 * table's *how far they got* would say level one. The field's meaning — levels cleared, so the one
 * being flown is the next — is unchanged, which is why the shape's version is too.
 */
export function entryOf(run: RunState, score: LevelScore, pilot: GolferKind, cleared: boolean, when: number): ScoreEntry {
  return {
    score: runScore(run, score),
    bonus: bankedBonus(run),
    pilot,
    difficulty: run.difficulty,
    levels: run.level,
    cleared,
    continues: run.continues,
    when,
  };
}

/**
 * The table as the title draws it — 0429: place, score, who flew it, and how far they got. A golfer's
 * first name, because the column is a third of a phone's width; the whole coil is *Clear*, anything
 * else the level the run ended on.
 */
export function boardLines(table: readonly ScoreEntry[]): BoardLine[] {
  return table.map((entry, index) => ({
    place: String(index + 1) + '.',
    score: String(entry.score),
    // The name they go by — 0546: the first word of *The Marmot* is *The*.
    pilot: GOLFERS[entry.pilot].goesBy,
    reached: entry.cleared ? 'Clear' : 'L' + String(entry.levels + 1),
  }));
}

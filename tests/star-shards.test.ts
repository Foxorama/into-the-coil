import { describe, expect, it } from 'vitest';
import { SHARD_POINTS, shardsFor } from '../src/content/score.ts';
import { creditEnded, freshLedger, payRun, shardsOwed } from '../src/app/score.ts';
import { initialState, reduce } from '../src/state/root.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';

/**
 * THE SCORE PAYS IN STAR SHARDS — `docs/decisions/0522-the-score-pays-in-shards.md`.
 *
 * ⚠️ **What is held is the rule the ask is careful about: a run pays for its BEST credit, once.** Added
 * up, Freeplay's endless continues would each pay; paid at a continue, a run would pay before it was
 * over and again at its end. And the balance a visit later, since a shard is kept as a win is.
 */

describe('a Star Shard', () => {
  it('THE ASK: is ten thousand points, whole shards only', () => {
    expect(SHARD_POINTS).toBe(10_000);
    expect(shardsFor(9_999)).toBe(0);
    expect(shardsFor(10_000)).toBe(1);
    // The first played clear: Legendary, one credit — *"around 157 shards"*.
    expect(shardsFor(1_579_750)).toBe(157);
    expect(shardsFor(-5)).toBe(0);
  });
});

describe('a run pays for its best credit', () => {
  it('THE ASK: in a continue run, the highest credit — not the credits added up', () => {
    const ledger = freshLedger();
    creditEnded(ledger, 230_000);
    creditEnded(ledger, 1_200_000);
    creditEnded(ledger, 40_000);
    expect(payRun(ledger), 'the run paid for more than its best credit').toBe(120);
  });

  it('in a run of one credit, that credit', () => {
    const ledger = freshLedger();
    creditEnded(ledger, 1_579_750);
    expect(payRun(ledger)).toBe(157);
  });

  it('once: a second way out of the same run pays nothing', () => {
    const ledger = freshLedger();
    creditEnded(ledger, 500_000);
    expect(payRun(ledger)).toBe(50);
    expect(payRun(ledger), 'the run was paid twice').toBe(0);
  });

  it('the run over says what stopping would pay, this credit among the rest', () => {
    const ledger = freshLedger();
    creditEnded(ledger, 300_000);
    expect(shardsOwed(ledger, 100_000)).toBe(30);
    expect(shardsOwed(ledger, 450_000)).toBe(45);
    expect(ledger.paid, 'saying what a run would pay paid it').toBe(false);
  });
});

describe('the balance', () => {
  it('is added to, in whole shards, and a run that earned none moves nothing', () => {
    const once = reduce(initialState, { slice: 'hangar', type: 'earned', shards: 157 });
    expect(once.hangar.shards).toBe(157);
    expect(reduce(once, { slice: 'hangar', type: 'earned', shards: 93 }).hangar.shards).toBe(250);
    expect(reduce(once, { slice: 'hangar', type: 'earned', shards: 0 }), 'a run that earned nothing moved the hangar').toBe(once);
  });

  it('is kept between visits, beside the wins', () => {
    const hangar = { ...initialHangar, won: { ...initialHangar.won, estate: true }, shards: 412 };
    expect(hangarFrom(serialiseHangar(hangar), initialHangar)).toEqual(hangar);
  });

  it('reads as none from a document written before it, and from one that holds no whole number', () => {
    const before = JSON.stringify({ v: HANGAR_VERSION, won: { fighter: true } });
    expect(hangarFrom(before, initialHangar).shards).toBe(0);
    expect(hangarFrom(before, initialHangar).won.fighter, 'the balance cost the wins beside it').toBe(true);
    for (const shards of [-3, 2.5, '400', null, 1e300]) {
      expect(hangarFrom(JSON.stringify({ v: HANGAR_VERSION, shards }), initialHangar).shards, String(shards)).toBe(0);
    }
  });
});

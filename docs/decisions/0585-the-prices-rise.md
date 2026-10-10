# 0585 — The prices rise

**Accepted 2026-10-10.** From the play-test of 2026-10-10.

## The ask

> *"Increase the cost of everything by 15%"*

## The rule

**Everything Cosmo's sells costs fifteen per cent more than it was asked at, to the nearest whole shard.**

Every row keeps the number it was asked at — 250 for the cheaper stuff ([0523](0523-cosmo-opens.md)), 400 for
the thrusters ([0530](0530-the-ions-burn-blue.md)), 500 a tube ([0578](0578-the-tubes-are-sold.md)), 1000 for
the spinners ([0527](0527-the-wheels-turn.md)) — written through `priced` in `src/content/prices.ts`, which
raises it by `PRICE_RISE`. So the ask each price came from is still on its row, and the rise is one number.

| asked | charged |
|---|---|
| 250 | 288 |
| 400 | 460 |
| 500 | 575 |
| 600 | 690 |
| 750 | 863 |
| 900 | 1035 |
| 1000 | 1150 |

**A whole shard, rounded to the nearest**, because a balance is a whole number
([0522](0522-the-score-pays-in-shards.md)): 250 is 287.5 raised, and 750 is 862.5.

## Why one number and not new prices

A new price typed on each row would lose where it came from, and the next *"by ten per cent"* would be
arithmetic done again on every row. The wares added since — the shells of
[0584](0584-the-shields-are-worn.md) — are asked on the same scale and raised by the same number.

## What guards it

The suites that held each ask now hold it raised: `tests/cosmo.test.ts` (the dangles, and 288 itself),
`tests/flames.test.ts`, `tests/wheels.test.ts`, `tests/tube-shop.test.ts`; the browser suites' seeded
balances moved with them. Probe in `scripts/probes/0585-the-prices-rise.mjs`.

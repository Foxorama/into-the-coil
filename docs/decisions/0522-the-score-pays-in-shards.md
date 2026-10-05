# 0522 — The score pays in shards

**Accepted 2026-10-05.** Item 2 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
Reverses [0428](0428-the-score-is-kept.md)'s *the score is not a currency*, and `docs/game.md`'s *no
shop, no currency, no economy* — replaced, not deleted, by *nothing that changes a run is for sale*.
Builds on [0521](0521-the-hangar-opens.md)'s hangar, whose key now holds the balance.

## The ask

> *"Star Shards are how you'll be able to buy things in the shop and you earn Star Shards based on your
> points total in a run — the highest points you earned in a continue run grant you 1 Star Shard per
> 10,000 pts. in a non-continue run, you'll only have highest score for that run, so it's just based on
> your sore for that run."*

Measured while it was built: *"I did a single clear of legendary difficulty and got 1579750 pts which
at 1/10,000 would be around 157 shards."*

## The rule

**A run pays one Star Shard per 10,000 points of its best credit, once, when it ends. The balance is
kept in the hangar, shown there, and said on every screen a run ends on.**

| | |
|---|---|
| **the rate** | `SHARD_POINTS`, 10,000, and `shardsFor` in `src/content/score.ts`: whole shards, rounded down |
| **the best credit** | every credit's score is put on the run's ledger as it goes on the table (`creditEnded`, `src/app/score.ts`). Freeplay's credits are not added up — that would pay every continue — and a run of one credit is paid on its one |
| **when** | at the run's true ends: the victory, the game over, the run-over offer running out or walked away from, and a quit from the pause. **Never at a continue**, which ends a credit and not the run. `payRun` pays a run once, so two ways out of one run cannot pay twice |
| **the balance** | `shards` on the hangar slice, added to by `earned` in whole shards; a run that earned none moves nothing and writes nothing |
| **kept** | a new field on `itc_hangar` version 1, read on the per-field terms: a document from before it reads as none, and anything that is not a whole number at least nought reads as none |
| **said** | the victory's and the game over's accounts end on *Star Shards +n*; the run-over screen says what stopping would pay, its best credit so far with this one counted; the hangar wears the balance in its top right corner |

## Why it is built the way it is

**The reversal is argued, as `docs/game.md` asked of anyone re-adding one.** *No shop, no currency, no
economy* came in with the product definition as a premise; no decision argued it. The sentence it
rested on — *"everything is found in the level and applied the instant you touch it"* — is about power
inside a run, and a currency that buys only looks leaves it standing. So the line is not deleted: it
becomes *nothing that changes a run is for sale*, and selling anything the simulation reads is now the
argued reversal. The predecessor's economy was rebalanced twice for grind; a shop of looks has nothing
to grind *for* that changes play, which is the part of that history this keeps out.

**The ledger is the shell's, and it is pure.** The score is the frame's and the table's, both in
`src/app/`, and the state has never held it — 0428 kept it there. So the run's best credit lives
beside the table in `src/app/mount.ts`, and the rule it follows is three small functions in
`src/app/score.ts` that a unit test asks without a canvas.

**A quit pays.** A player who stops a run has earned its best credit. Paying only a run flown to its
last life would make a player who wants their shards fly out a run they have finished with.

**The balance costs the hangar no height.** As a line under the heading it put Back under a 480x320's
fold. Pinned in the top right corner, where the score stands in play and the readout has the other
corner, it is read first and moves nothing.

## What it does not prove

`tests/star-shards.browser.test.ts` flies an idle ship on the quickest tier to its game over, which may
score under 10,000 and pay nothing. So the page test holds the account and the key to **agree** — the
key is the seed plus the account's line — and the hangar's balance against a seed that is not
nothing. A run that paid nothing cannot tell an unpaid run from a paid zero; *paid, and paid once* is
held by the ledger's unit test, and the shell's four calls to it are read, not run.

## Rollback

`shards` is a new field on an existing key. Reverting leaves it in the document; 0521's reader ignores
a field it does not know, so nothing breaks, and the balance is lost to that version only.

## What guards it

`tests/star-shards.test.ts`: the rate, the best credit and not the sum, paid once, what stopping would
pay, the balance added to and kept, and read as none from anything else. `tests/score.test.ts` and
`tests/credits.test.ts` hold the accounts' lines. `tests/star-shards.browser.test.ts`, in the page.
Probes in `scripts/probes/0522-the-score-pays-in-shards.mjs`.

## Owed

- A play: a run's end, its line, and the balance in the hangar.
- Item 3, the shop: the dangles at 250 shards and, after them, Ion Thrusters at 400.

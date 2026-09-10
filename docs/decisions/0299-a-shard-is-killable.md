# 0299 — A shard is killable, and being spent is not bursting

**Status:** accepted
**Builds on:** [0291](0291-the-void-has-an-appetite.md), [0292](0292-the-void-eats-everything.md)

## The report

> *"Void — the smaller voids need to be killable as well."*

## What was true, and why it was not laziness

[0291](0291-the-void-has-an-appetite.md) gave a void blast an appetite: it swallows the player's fire
and bursts into seven shards. Two places refused to feed a shard, with the same line:

```
feedVoids     if (blast.turnsLeft > 0) continue;
nearestVoid   if (blast.turnsLeft > 0) continue;   // so the lightning would not jump to one either
```

And the reason was real, written beside it: **the shards carry the same row**, so the same appetite,
and they are spawned at stage 1. One pulse would pop each of seven into seven more, for ever. *A ring
that can be farmed for another ring is not a hazard, it is a pool exhaustion the player triggers on
purpose.*

## The defect is that one skip carried two claims

*Can be eaten* and *will burst*. Only the second ever needed to be false.

`spendVoid` is the split, and it is one function because there were two callers — `feedVoids` and the
arc's own path in `fireWeapon` — both calling `burstVoid` directly. The stage question would
otherwise have to be answered identically in two places, and the one that got it wrong would be the
one nobody was looking at.

```
a thrown blast runs out  →  bursts
a shard runs out         →  is gone
```

`turnsLeft` already told them apart. Nothing new has to be remembered by anything, and the skip in
`nearestVoid` goes too — a shard is a thing the lightning is drawn into like any other void, which is
what *"it sucks in the lightning"* meant in the first place.

## Softer shards, derived rather than typed

```
shardAppetite = (blast) => Math.max(1, Math.ceil(blast / 3))     // 2, against a thrown blast's 6
```

⚠️ **DERIVED FROM THE ROW, AND THAT IS THIS DECISION'S OWN HISTORY.** 0291 first authored an
`appetite: 6` beside a `health: 1` and `reset` hands a shot its ROW's health — so one pulse popped the
blast, and the lesson was **collapse two numbers for one idea into one**. A hand-typed shard appetite
is that same mistake rebuilt one field over: the day the blast's appetite moves, a typed shard
silently stops being a third of it.

⚠️ **AND SOFTER IS THE POINT RATHER THAN THE FRACTION.** Asked for as:

> *"Softer shards, which also sets the scope for bigger void chains down the track if we want them."*

Which is the better argument, and it is about a thing that does not exist yet: what makes a shard that
*itself* bursts affordable is that clearing one costs little. So this number is the **ceiling on a
future chain**, not only an answer to the report. Clearing a ring is 7 × 2 = 14, plus the parent's 6 —
twenty per blast thrown, against forty-eight at the row's own.

## The guard

**A shard takes damage, AND the pool never grows through one.** Two claims in one test, and the
second is the invariant: it is what a later tidy-up of the stage check would break, and it would break
silently — the game plays for about four seconds. `tests/serpent.test.ts` counts the most shots it
ever saw alive as well as what it killed, because a guard about *can a shard be killed* cannot see the
pool behind it.

That one passes [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s test cleanly: name a content
change that would redden it and be correct. There is none. A ring that can be farmed into a full pool
is a defect at every conceivable set of values.

## What has no guard, and why that is deliberate

⚠️ **A THIRD PROBE WAS WRITTEN FOR THE SOFTNESS AND DELETED BEFORE IT RAN.** It set `shardAppetite`
back to the row's six and expected red. **It would not have gone red** — the fixture feeds eighteen
damage, so a shard at six still dies inside the window and every assertion still holds. STILL GREEN,
which [0087](0087-a-pickup-never-parks.md)'s own probe file records the cost of.

And the honest answer is *not* to tighten the guard until it catches it. *A shard is softer than what
threw it* is a tuning number, not an invariant, and 0295's test refuses it twice over: it ranks one
thing against another on a single channel, and there is no reason a later design may not want a shard
exactly as tough as its parent. What holds it is the derivation and a hand on the game.

## What this deliberately does not do

- **The shard's size is untouched.** It is drawn at the row's own extent; what makes a thrown blast
  look bigger is that it *swells* as it eats (0291), so "smaller voids" is already true on screen
  without anything being resized.
- **`VOID_SHARDS` stays at seven**, and a burst still drops children that will not fit rather than
  growing the pool.
- **Nothing about the frost's shatter moves.** `throwChild` hands back the child it made now, and
  `fissionShots` ignores the return — it wants exactly the row's own numbers
  ([0263](0263-the-frost-ship-shatters.md)).

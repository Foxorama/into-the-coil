# 0202 — A wave is as wide as the volley, and the rest of it goes behind

**Accepted 2026-09-01.** The third answer to one report.
[0121](0121-a-wave-dies-together.md) tightened the across gap to what the widest body allows;
[0143](0143-a-wave-is-spaced-by-the-body-it-is-made-of.md) made the gap the wave's own. **Both
measured green and the report came back anyway**, which is
[0027](0027-measure-the-picture-not-the-model.md)'s subject exactly.

> *"The grouping of enemies in level 1 is still split with certain groups, which upsets the sound
> when you kill 1-2, then have to fly across the screen to kill the other 2-3 in that group."*

## What the two previous fixes left standing

Neither of them touched **how many members go side by side.** They both worked on the gap, and by the
time 0143 finished, the gap had no room left in it: `gapAcross(radius) = radius × 2 + 1`, where the
`1` is the entire budget of clear air between two hulls.

`scripts/weigh-wave.mjs` — written before this change, for this change — says what that left:

| | level one | all seven |
|---|---|---|
| waves | 69 | 492 |
| wider than the 19.75-unit volley | 50 | **324** |
| **of those, needing hulls to OVERLAP** | 32 | **209** |

⚠️ **TWO THIRDS OF THE PROBLEM WAS NOT A SPACING PROBLEM.** A `drifter ×5` line spans 24.8. To fit
inside the fan its gap must fall to 4.94 — against a body 5.2 wide, so the bodies intersect before
they fit. No amount of tightening reaches it. The remaining 115 are reachable only by cutting clear
air from 1.0 to as little as **0.14 units**, which is
[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) being spent, and 0121
already refused that sale.

**Width had run out of room. Depth had not.**

## The rule

**A formation puts at most `abreastCap(gap)` members in a rank and folds the rest behind**, one
`ALONG_GAP` back for a line and one rank-depth back for a vee. `abreastCap` is derived from the fan
the gun actually fires — `SPREAD_STEP` over `MAX_BARRELS`, at `ENGAGE_RANGE` — never typed.

A column is exempt and is not merely unaffected: it is single file, its across span is zero at any
count, and there is nothing to fold.

## What it cost, measured rather than asserted

- **Every one of the 492 waves now fits**, 324 → 0, with no count changed and no clear air spent.
- **The deepest wave in the game did not move.** It is a `charger ×6 column` at 70 units — 4.86 beats
  front to back — and it was that before this change, because a column never folds. **The deepest
  wave this decision actually creates is a `lancer ×6 vee` at 42 units, 2.92 beats**, comfortably
  inside what the game already asks a player to hold.
- ⚠️ **The count of ranks is on the beat by construction.** `ALONG_GAP` is 14 because 14 units is
  0.97 of a beat at 36 units a second (0121), so a second rank arrives on the beat after the first.
  Folding is the first thing that has ever depended on that number twice.

## ⚠️ Two guards were green over this the whole time, and one of them would have lied

`tests/level.test.ts` already asked *how many abreast does a volley reach* — for a **body**. It never
looked at a wave a level had authored, so it was green across 324 waves that were too wide. The new
guard asks the question about the content.

Worse, both old guards measured span as
`acrossOffset(count - 1, …) - acrossOffset(0, …)`. That was the span while every wave was one rank.
**It is not the span now**: member `count - 1` sits in the last rank, so the subtraction compares two
different rows. Left alone it would have answered *yes, a volley reaches four wardens* — 9 units —
where the truth is three abreast and one behind. Both are rewritten over `abreastCap`.

⚠️ **A probe could not have caught that**, and 0027 says why: a break and its guard share an author
and a vocabulary. It was found by asking what the number meant after the geometry changed under it.

## The assumption, named rather than buried

`ENGAGE_RANGE = 50` decides every cap in the game, and **nothing measures it.** It existed as prose
in a comment — *"the 50 units a wave is typically engaged at"* — and is now a named constant with
this paragraph attached. `scripts/weigh-wave.mjs` prints the fan from 30 to 70 units so the
sensitivity is visible. If a play-test says the fan is wrong, this is the number to move, and moving
it re-ranks every wave by construction.

It is also the **four-barrel** fan. Barrels run 1 → `MAX_BARRELS` across the upgrade tiers, so a
player in the opening minute of level one has no fan at all and never did. This is the gun the game
is balanced around, which makes the target generous rather than wrong — but *"kill a group in one
volley"* was never true for the first waves, at any spacing, and no decision had said so.

## What is owed

**A play-test verdict on the picture, not the model.** 0027: everything above is a model quantity.
The claim this change makes is that a group now dies together and the drums land together — and that
is an ear's call, on `main`, not a number's.

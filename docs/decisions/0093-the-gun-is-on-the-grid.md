# 0093 — The gun is on the grid, and the grid is 150 BPM

**Accepted 2026-08-09.** The answer to the question
[`the-gun-on-the-grid-mapped`](../../reports/the-gun-on-the-grid-mapped-2026-08-09.md) stopped at, and
it is not one of the three the map offered.

> *"We could almost make a rhythm style game if we change the player sounds a bit. The primary weapon
> fire was almost the right tempo… What can we do so that as you pick up or lose power ups the music
> speeds up, slows down etc and works in a beat to the rhythm of the fire? It's going to sound really
> really sick if we can do that well."*

## The rule

**A beat is a whole number of sim steps, and every cadence in the player's arsenal is a whole
fraction of one.** The tempo is `STEPS_PER_BEAT`; a ship's ladder is a list of note values on its own
row.

## The map's blocker was an artifact of a tempo the game has never been at

⚠️ **The map computed its grid at 100 BPM**, because the base gun's `fireEvery: 9` is a sixteenth
note at 100 BPM. That is true and it is a coincidence: **the music is at 133⅓ BPM**
([0090](0090-the-music-is-four-loops.md)). From that grid it concluded the base cadence must go from
9 steps to 18, halving the base damage, and stopped for the player to weigh the rebalance.

⚠️ **The player chose 150 BPM, and at 150 the whole problem evaporates.** A beat of **24 steps**
divides by 24, 12, 8, 6, 4 and 3 — and the old ladder ran 9, 8, 7, 5, 4. **Tier 1 was already 8 and
tier 4 was already 4.** The grid has usable values right across the span the ladder occupied, so the
gun goes into time by moving three rungs by one or two steps each:

| tier | steps | note @150 | barrels | bullets/s | was | pool |
|---|---|---|---|---|---|---|
| 0 | 8 | eighth-triplet | 1 | 7.5 | 6.7 | 10 / 100 |
| 1 | 8 | eighth-triplet | 2 | 15.0 | **15.0** | 20 |
| 2 | 6 | sixteenth | 3 | 30.0 | 25.7 | 40 |
| 3 | 6 | sixteenth | 4 | 40.0 | 36.0 | 53 |
| 4 | 4 | sixteenth-triplet | 4 | 60.0 | **60.0** | 80 / 100 |

**Within 17% at every rung, identical at two, `MAX_BARRELS` unchanged, `FASTEST_FIRE` unchanged, and
the pool at the cap unchanged at 80 of 100.** So the map's blocker — *every DPS-preserving repair
changes shots-to-kill*, which is [0084](0084-the-dial-is-the-level-and-the-guns.md)'s currency and
[0035](0035-damage-is-legible-on-the-body-that-took-it.md)'s legibility rule — **does not arise**, and
no enemy-health pass is owed. That was the player's own condition: *"if it's not needed let's leave it
as is."*

⚠️ **And the preference was stated: *faster fire over extra chunky barrels*.** The base goes 6.7 → 7.5
bullets a second, so nothing got slower anywhere.

## Why the music had to move, which the map does not say

⚠️ **0090's beat is 0.45s, which is 27 sim steps, and 27 divides only by 3 and 9.** That is a
three-rung fire ladder — 27, 9, 3 steps — with a 3× hole in the middle of it. **No amount of tuning
the gun reaches a grid the music is not on.** Retempoing was not a preference about how the music
should sound; it is the precondition for the feature existing.

`BEAT_SECONDS` 0.45 → **0.4**. A two-bar loop is 3.2 seconds, exact at 44100, 22050 and 48000 — 0090's
single unrecoverable failure is untouched, and its own guard still holds it at all three rates.

## Three shapes changed, and each one had a reason to

**A cadence is a note value, so a ladder is a list.** `rung(ship.fireEvery, FASTEST_FIRE, tier)` drew
a straight line between two numbers; the usable subdivisions of a beat are geometric — 2, 3, 4, 6 to
the beat — and no interpolation lands on them. `rung` is **kept for the launchers**, where the
quantity really is a count of places on a hull.

**The ladders live on the ship row.** `firePerBeat` and `barrels` replace `fireEvery`, and this is
what makes the alternative below a table edit rather than a rewrite.

**The missile's cadence is derived and no longer authored.** `missileEvery` is gone from the row;
it is `MISSILE_BEAT_RATIO × fireEveryAt(ship, tubes)`.

⚠️ **The 5:1 counter-beat the play-test praised was an ACCIDENT and is now a rule.** *"The missile
fire provided a great counter-beat"* — said about a build where two unrelated interpolations happened
to start five apart and stayed roughly there: 5.00, 4.88, 4.71, 5.20, 5.00. Nobody chose it and any
tune to either ladder would have dissolved it silently. Five against a beat divided in three, four or
six never closes with a beat, which is what a counter-beat is.

## The ladder that was NOT taken, recorded because it was asked for

> *"Instead of starting with 1, you start with 2 barrels at half the rate of fire… keep the chunky
> slower fire rate on record, we could use that for a different ship later."*

`firePerBeat: [2, 3, 3, 4, 4]` with `barrels: [2, 3, 4, 5, 6]` — a gun that opens on straight eighths
with two barrels, 10 bullets a second at the base against the current 7.5, and never reaches a
triplet. It is written into `src/content/ships.ts` beside the row it is an alternative to.

⚠️ **It is a second SHIP and not a retune of this one, and the reason is that it does not fit the
pool.** `barrels × PLAYER_SHOT_LIFE / fireEvery ≤ 100` is the arithmetic
[0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) put there; six barrels at six steps is
80 of 100, which fits — but it reaches 60 bullets a second at tier 4 with a **52° fan**, against
today's 22°, and a fan that wide is a different weapon to aim rather than a stronger one. That is a
character, which is what a ship is for.

## What is still owed, and it is the reason PR 3 exists

⚠️ **THE GUN AND THE MUSIC ARE IN TIME AND NOT IN PHASE.** The gun runs on the fixed-step clock and
the music on the `AudioContext` clock — two crystals — so matched tempos still slide about a
sixteenth note over a three-minute level, and a sim that stalls and catches up slides further. Every
guard here is about the *rate*; **nothing yet holds the two together over a run.** The map's piece 1,
and it is the next PR.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0093-gun-on-the-grid.mjs`.

| broken on purpose | went red |
|---|---|
| the fire ladder authored off the beat again | `and every rung is a whole number of steps AND a musical fraction of a beat` |
| the barrels interpolated again, so the tier that cannot buy rate buys nothing | `THE TIERS: each ladder is exactly UPGRADE_TIERS long, and every tier changes something` |
| the beat taken off the sim clock | `and the tempo is a whole number of sim steps, which is what makes any of it possible` |
| a rung that closes with the beat but not with the loop | `THE ASK, in the unit the player hears: the gun closes with the music every single loop` |
| the missile put on a ratio that lands on the pulse's beats | `THE COUNTER-BEAT: the missile is an exact ratio of the pulse at every rung, and was an accident` |

⚠️ **TWO OF THE FIVE CAME BACK `STILL GREEN` FIRST TIME AND ONE OF THEM IS THE BEST FIND HERE.** The
counter-beat guard read `missileEvery / fireEvery === MISSILE_BEAT_RATIO` — **the constant on both
sides of the equals sign**, so setting the ratio to 4 moved the expectation with the code. It is
[0027](0027-measure-the-picture-not-the-model.md)'s *a guard measuring a quantity defined in terms of
the constant it guards proves only that the code agrees with itself*, written by somebody who had
just re-read that rule, and caught in a minute by the mechanism that exists for it. What replaced it
is the musical property the constant cannot fake: **a counter-beat must not land on the beat.**

The second was the barrel probe pointed at *every upgrade is worth taking*, which compares the base
with one upgrade and cannot see two middle tiers collapsing into each other. It belongs to
*THE TIERS*, one suite over.

⚠️ **And four probes belonging to 0041, 0051 and 0090 had stale anchors** — the two `rung` lines, the
ship's `missileEvery`, and `BEAT_SECONDS`. Two of them changed FILE rather than text, which is the
version `anchorFailures` catches and a careful reader does not.

## THE PART THAT ONLY A WHOLE-SET `prove` COULD SEE, and it is five guards

⚠️ **`npm test` was green, every 0093 probe was red, and the full run found five OTHER decisions'
guards no longer reaching their subject.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)
and the standing warning about shared constants are what say to run it; this is the largest haul since
[0087](0087-a-pickup-never-parks.md)'s three.

**Four of the five are one cause.** 0093 turned `MAX_BARRELS`, `FASTEST_FIRE` and `MISSILE_FASTEST`
from **inputs to the ladder** into **constraints checked against it**. That is the better design — the
bound is stated once and the content is measured against it — and it silently disarms every probe that
worked by editing the bound:

| decision | went | why |
|---|---|---|
| 0043 | STILL GREEN | `MAX_BARRELS` 4 → 40 changed nothing; the barrels are a list on the row now. Re-anchored to the list |
| 0051 | STILL GREEN | `MISSILE_FASTEST` 20 → 4 changed nothing — see below, the constant is deleted |
| 0051 | WRONG TEST | the cross-wiring probe is invisible at ONE upgrade, because tiers 0 and 1 share a cadence. *THE SPLIT* now walks every tier |
| 0083 | WRONG TEST | `rung` governs the launchers alone now, so a short ladder costs a tier that buys nothing rather than a floor unreached |

⚠️ **`MISSILE_FASTEST` IS DELETED, ON THIS PROJECT'S OWN ARGUMENT.** `src/content/pickups.ts` already
carries it about `PLAYER_SHOT_LIFE`: *"one guarantee, one mechanism. A redundant safety net does not
make a system safer — it makes the real mechanism untestable, and an untested mechanism is the one
that gets refactored away."* A derived cadence reaches 20 at the cap on its own; the constant beside
it took part in no arithmetic and could not be broken. *THE FLOORS* now asserts the relationship that
is load-bearing — **both ladders land on their last rung together, at the ratio the counter-beat is
made of** — instead of a number agreeing with itself.

⚠️ **THE FIFTH IS THE BEST ONE AND IT IS THE THIRD TIME.** 0056's *does not run the missile clock down
while it has nothing to fire from* read the clock **once**, after `A_WHILE` steps. A clock that runs
when it should not returns to its starting value every `missileEvery` steps — so the reading is a coin
flip on whether `A_WHILE` is a multiple of the cadence. `A_WHILE` is 200; this decision moved the base
cadence from 45 to 40; **200 is exactly five times 40.** A guard correct for weeks went STILL GREEN
because a constant two files away moved onto a multiple of it.

That is a guard sampling one phase of a periodic quantity for the **third** time in this project —
[0087](0087-a-pickup-never-parks.md) had the first and [0090](0090-the-music-is-four-loops.md)'s seam
guard the second. **The only phase-proof form is to look at every step rather than at a chosen one**,
and that is what it does now. Worth stating as a habit rather than as three incidents: *a single
reading of a periodic quantity measures the phase you happened to pick.*

## What this does not settle

**Whether it sounds like anything.** The gun is in time with a piece of music that is still the
title's. What a level actually plays is the PR after next, and the verdict on all of it is one hand
on the controls.

**Whether 150 BPM is right.** It is the tempo the player chose from three, on the reasoning above and
on the genre named in the same message; nobody has heard the game at it.

**Whether an eighth-note triplet is the right base.** It is the grid value nearest the cadence that
shipped, chosen so that no rebalance is owed — not because a hand picked a triplet feel. A straight
eighth (12 steps) is one table edit away and is 25% slower.

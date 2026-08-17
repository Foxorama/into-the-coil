# 0159 — The two clocks come apart

**Accepted 2026-08-17.** [0093](0093-the-gun-is-on-the-grid.md) is superseded in both halves, asked
for by name and for a reason 0093 could not have had.

> *"let's go ahead and drop the whole sim step rule and the gun fire ladder… the sim-step and gun
> ladder rules make no sense anyway when the plan has always been to add additional weapons in so
> we'd be struggling all over the place if we don't change our approach to that now."*

## The rule

**A cadence is sim steps. A beat is seconds. Neither knows the other's number.**

- `STEPS_PER_BEAT` is gone. `BEAT_SECONDS` is the music's own tempo and is derived from nothing.
- `firePerBeat` / `missilePerBeat` are `fireEvery` / `missileEvery`, **in sim steps**, authored
  directly rather than reached by dividing a music constant.
- The gameplay lattice — the grid every non-player cadence snaps to, and the alignment a body spawns
  on — moves to **`src/content/cadence.ts`**, where nothing claims it is musical.

## ⚠️ Why the ladder had to go, and the number is eight

`weaponFor` computed `STEPS_PER_BEAT / perBeat`, so **a cadence had to divide 24**. The divisors of
24 are 1, 2, 3, 4, 6, 8, 12 and 24 — **eight legal fire rates for every weapon this game will ever
have**, and the eight were chosen by a constant picked for the music. A weapon on quintuplets was not
a tuning question, it was unbuildable.

[0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md)'s arsenal is still a list with nothing
in it and *additional player weapons* is the last item in the project's stated order, so **this is
the cheapest moment the constraint will ever be removed at.** Every weapon added under the old rule
is a weapon that would have to be re-tuned when it came off.

## ⚠️ Why the tempo had to come off the step clock

`BEAT_SECONDS × STEPS_PER_SECOND === STEPS_PER_BEAT` was a guard, and 0093 called it *"the
constraint the whole decision turns on."* It means a beat is a whole number of sim steps, which means
**the tempo can only be a value that leaves every cadence a whole number** — 150 BPM and 300 BPM with
nothing in between (`docs/state-of-play.md` has the divisor table).

*"A fast paced tempo melody that INCREASES IN TEMPO throughout the level"* was therefore not a thing
this game could express at any price. It is the first of the four asks in the reopened score and it
is the only one with no machinery at all.

## ⚠️ Nothing moves, and it is measured

**Every cadence the game resolves is byte-identical to `main`** — 266 values: both ladders at all
five tiers, every enemy and every boss phase at all three difficulties, `nextOnGrid` over 140
combinations of step, gap and share, and `onFireGrid` over seven inputs. The tables now say what the
division used to produce.

| | |
|---|---|
| `fireEvery` | `[8, 8, 6, 6, 4]` — was `[3, 3, 4, 4, 6]` per beat into 24 |
| `missileEvery` | `[8, 8, 8, 6, 4]` — was `[3, 3, 3, 4, 6]` |
| `VOLLEY_CYCLE` | 24, which was `STEPS_PER_BEAT` |
| `FIRE_GRID` | 6, unchanged, and no longer called a sixteenth |

## ⚠️ What this un-does, and it is not nothing

**The musical half of [0096](0096-the-enemies-play-along.md),
[0098](0098-a-wave-plays-a-figure.md) and [0104](0104-the-gun-plays-a-figure.md).** Those were asked
for in play — *"if we can balance the enemies and enemy fire into the rhythm as well that'd be
sick"* — and what they bought is now **half true**: every body still keeps a steady tempo on a shared
lattice, and that lattice is no longer guaranteed to be the music's.

⚠️ **Today the two still coincide**, because `VOLLEY_CYCLE / 60` is 0.4 s and `BEAT_SECONDS` is 0.4
s. **That is a coincidence and not a rule**, and it ends the moment a level authors a tempo. So the
loss is scheduled rather than immediate, which is exactly why it is written down here rather than
discovered in a play-test.

⚠️ **THE RE-WEAVING IS THE PLAYER'S OWN SEQUENCING AND IT COMES AFTER THE MUSIC**: *"let's do music
first and then afterwards we'll weave the weapon sounds either into or over it."* **Either** is the
word to keep — *over* is a real answer, and a game whose effects deliberately float against the tune
is a different and defensible thing from one where they lock to it.

## ⚠️ Three guards were deleted, and that is the point rather than a cost

| guard | why it goes |
|---|---|
| *and the tempo is a whole number of sim steps, which is what makes any of it possible* | **it is the rule being dropped** |
| *every rung is a whole number of steps AND a musical fraction of a beat* | the divisor rule. Its own comment already called it *"the model agreeing with itself"* |
| *the gun closes with the music every single loop* | the one worth mourning — it was the assertion written in the player's units. It forbids a tempo that moves |

⚠️ **A PROBE WHOSE GUARD HAS BEEN DELETED CANNOT BE RE-ANCHORED, ONLY RETIRED.** Three of 0093's five
probes went with them; two survive because their claims were never about the music — the missile's
counter-rhythm against the pulse, and every tier of the barrel ladder buying something.

## ⚠️ And what the divisor rule was holding up that nobody had listed

**A ladder that only ever gets faster.** While every rung had to divide 24 there were eight legal
values in the whole space and a hand could barely author a ladder that went backwards; now that any
integer is legal, *an upgrade makes the gun faster* is a real thing to check.

**And a cadence the fixed-step clock can express.** Nothing that divides 24 is fractional, so
integer-ness came free. It does not any more.

Both are now asserted, over **both** ladders, and reported in shots a second —
[0027](0027-measure-the-picture-not-the-model.md). **That is the class of question to ask whenever a
constraint is dropped: what was it holding up that nobody wrote down?**

## What is guarded

| | |
|---|---|
| every rung of both ladders is a whole number of steps | ✅ `tests/pickups.test.ts` |
| neither ladder ever gets slower — an upgrade is never a downgrade | ✅ in shots a second |
| the missile's counter-rhythm does not land on the lattice | ✅ re-aimed from *the beat* to `VOLLEY_CYCLE`, same arithmetic |
| every authored enemy cadence is a whole number of grid units, and the difficulty multiplier cannot take it off | ✅ unchanged — `src/content/cadence.ts` |
| a formation opens fire as a figure; a share only ever delays | ✅ unchanged |
| **266 resolved cadences identical to `main`** | measured, not asserted — the landing is silent |

⚠️ **`node scripts/prove-guard.mjs 0159` IS 2 OF 2 RED.** `0041`, `0083`, `0093`, `0096`, `0098` and
`0104` were re-anchored and are red on their own guards; **`tests/prove-guard.test.ts` found all of
them** before a probe was run, which is [0019](0019-a-probe-must-be-seen-to-apply.md) doing the more
valuable half of its job for the second decision running.

## ⚠️ And the rig broke where nothing could see it

`scripts/hear.mjs` imported `STEPS_PER_BEAT` and **every one of its modes died on the import**. The
whole suite was green over that, `tsc` was clean over it, and the orphaned-anchor guard had nothing
to say: the file is not typechecked (`checkJs` is off for `.mjs`) and **no test may import it**,
because it writes files at module scope on `argv` — which `scripts/timeline.mjs` exists as a separate
module to work around, and says so in its own header.

⚠️ **RUNNING IT IS THE ONLY CHECK THERE IS**, which is [0027](0027-measure-the-picture-not-the-model.md)
arriving at the instrument instead of at the game. All three modes were run after the fix: `--level`,
`--music` and `--play`. **This is the third instrument-level defect in this project's history that a
suite could not have caught** — the others are 0104's missing bus shaper and 0114's two reference
levels, both recorded in `hear.mjs`'s own header.

## What is NOT in this change

⚠️ **`phaseTo` AND THE GUN'S GRID ALIGNMENT ARE STILL THERE**, and they are the other half of *drop
the whole sim-step rule*. `src/app/mount.ts` still calls `music.phaseTo(world.steps)` — 0094's
correction, which drags the music's position to match the sim's step count — and `frame.ts` still
aligns the player's reload to the lattice. **Both are harmless today and wrong the moment the tempo
moves**, because they tie a clock to a clock this decision has just separated.

They are held by six probes of their own and folding them in would make one change that moves both
the tables and the clock. **That is the next PR, and it must land before a tempo does.**

## What it costs

| | |
|---|---|
| `dist/index.html` | **253,434 → 253,400 bytes, 34 SMALLER.** A division and a constant left; five integers arrived |
| the frame loop | untouched. Nothing here is reached from a step that was not reached before |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. `ShipRow` is content and the save stores resolved state
([0021](0021-one-stream-per-concern.md)), never a ladder, so a save written before this loads
unchanged after it.

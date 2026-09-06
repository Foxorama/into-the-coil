# 0269 — A mid-boss is fought for as long as its level says

**Accepted 2026-09-06**, from the alpha play:

> *"Mid bosses need less health, and we'll need to go through and change all their attacks and stuff
> as well."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the mid roster's ladder is in
seconds and the health is derived. The *attacks* half of the ask is **not** this decision — it waits
for the alpha stack's boss branches, so the mid-bosses are reworked once against a settled
vocabulary.

## ⚠️ Health is not what makes a mid-boss hard

The ask names health, and health was the wrong lever — which the measurement said before anything was
changed. `scripts/weigh-fight.mjs` walks every level through the real frame at the loadout a mid-boss
is met with; with the waves removed entirely, so they are not the cause:

| mid-boss | health | patrol rate | damage landed a second | fight |
|---|---|---|---|---|
| redoubt | 440 | **0.16** | **14.1** | 31 s |
| axis | 570 | — | 11.4 | 50 s |
| chorus | 490 | — | 7.4 | 67 s |
| harrow | 290 | 0.42 | 5.3 | 54 s |
| shoalMother | 390 | 0.62 | 4.9 | 79 s |
| sentinel | 240 | — | 3.8 | 63 s |
| lattice | 340 | 0.50 | **3.5** | 98 s |

**Damage actually landed varies four-fold and runs inversely to how fast the hull crosses the lane.**
A shot is fired where the ship is; a fast hull is somewhere else when it arrives. The redoubt carries
more health than the lattice and dies in a third of the time.

So 0247's roster — a health ladder from 240 to 570 — produced fights of 37 to 112 seconds **in no
order at all**. The ladder was in a number the player cannot feel.

## The rules

**A mid-boss's fight length is authored and its health is derived.** `MID_BOSS_SECONDS` in
`src/content/bosses.ts` is the ladder: 17 seconds at the Approach climbing to 23 at the Black Heart,
**in run order, which is the order a player meets them**. `scripts/solve-mid-health.mjs` measures each
fight through the real frame and prints the health that hits it; every mid-boss's `health` is that
output. [`scripts/solve-hold.mjs`](../../scripts/solve-hold.mjs) is the same pattern for the music's
loudness, and for the same reason: a quantity nobody can reason about directly is solved against the
one that can be measured, with the solver committed beside it.

**The mean is 20 seconds, which is the number the play chose.** The spread is this decision's, so
that the ladder 0247 wanted exists in a quantity the player is in the order of — 0247 records the
roster climbing *"through the TABLE and not through the run"*, which happened because the lattice and
the shoal mother swapped levels.

**A mid-boss stays a speed bump at a full loadout: three to twelve seconds.** 0247's own sentence —
*"a mid-boss over in seven seconds at max weapons IS the miniboss that guard's message names, on
purpose"* — held as a number for the first time. It was not true when it was written: the fights
measured 14 to 28 seconds at the cap. They measure 5 to 9 now. The floor is as real as the ceiling —
a mid-boss the capped ship deletes on contact is a pickup with a health bar.

## The figures

| level | mid-boss | health before | health after | fight at one rung | at the cap |
|---|---|---|---|---|---|
| The Approach | sentinel | 240 | **45** | 74 s → 19 s | 14 s → 5 s |
| Ember Nebula | harrow | 290 | **66** | 60 s → 19 s | 19 s → 7 s |
| Saurian Belt | shoalMother | 390 | **74** | 91 s → 17 s | 25 s → 7 s |
| The Labyrinth | lattice | 340 | **40** | 112 s → 21 s | 28 s → 6 s |
| Rime Shelf | redoubt | 440 | **241** | 37 s → 21 s | 14 s → 9 s |
| The Toxic Mire | chorus | 490 | **103** | 81 s → 22 s | 23 s → 8 s |
| The Black Heart | axis | 570 | **192** | 64 s → 23 s | 18 s → 9 s |

The seven now average **20.3 seconds** at the loadout they are met with, against a spread of 37 to
112 before.

⚠️ **The redoubt keeps six times the lattice's health and they are fought for about the same time.**
That is the four-fold spread stated as two numbers, and it is why one factor across the table could
never have worked.

## ⚠️ The map is not proportional, and the solver says so rather than hiding it

Halving a mid-boss's health does not halve its fight: a phase raises `patrolScale`, so a hull with
less health left moves faster and is harder to hit. The lattice went 340 → 61 and its fight went 112
→ 35 seconds, not to 20. Two passes of the solver land every level inside two seconds and a third
moves them by under one, so `scripts/solve-mid-health.mjs` is deliberately **one pass** and run twice
— iterating internally would hide that the map is approximate, and `CLOSE_ENOUGH_SECONDS` in
`tests/midboss.test.ts` is that approximation written down.

## What is owed

- **A play**, and it is the item this came from: whether twenty seconds reads as a fight rather than
  as an interruption, and whether the 17-to-23 climb is felt at all.
- **The waves during a fight, re-measured.** *"Still too many waves happening around minibosses, but
  the less health might sort that out."* A fight a third as long carries a third of the script over
  it, so [0267](0267-a-fight-thins-the-waves-over-it.md)'s one-in-three may now be too strong, too
  weak, or right. `scripts/weigh-fight.mjs` answers it and no number should move before it does.
- ⚠️ **"Some firing waves after the miniboss" should now be reachable** — the reason it was not is
  that two levels' fights outlived their own wave scripts, and at twenty seconds none does.
- **The attacks.** The other half of the ask, deliberately not here.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Seven numbers in a content table
and a constant beside them; nothing persisted, no storage key, no schema. A run saved mid-fight holds
the level and the loadout, never a boss's health.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0269`:

| broken on purpose | went red |
|---|---|
| the sentinel's health put back to what 0247 gave it, so its fight is four times what its level asks | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |
| the redoubt given the lattice's health, as though a hull's toughness were the number on it | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |
| the axis given a real boss's health, so the last mid-boss is still a fight at a full loadout | `and at a full loadout it is still a speed bump` |

⚠️ **No probe for *a red guard answered by moving the target*.** Editing `MID_BOSS_SECONDS` to match
a measurement makes `tests/midboss.test.ts` agree with itself and go **green**, which is the opposite
of what a probe does. Nothing mechanical catches it; what refuses it is
[0192](0192-a-guard-holds-an-invariant.md) and the note at the top of that file — the target is the
ask, and the health is the derived thing.

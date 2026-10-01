# 0428 — The score is kept

**Accepted 2026-09-30.** The game's first score. It reverses the *"no score"* half of the run-over
screen's note in `src/state/screens.ts`, which cited `docs/game.md`'s voice rule. That rule is about
coaching and restating, and a score is neither: it is the one thing the frozen field behind the
screen cannot say. **Its companion is [0429](0429-the-table-is-kept.md)**, the high-score table that
the finished runs go on.

⚠️ **Its continue row is reversed by [0438](0438-the-score-is-the-credits.md)**, on the player's
word a day after confirming it: a continue starts the score again, and the credit that ran out goes on
the table with the level it reached. The rest stands.

## The ask

> *"starting a points system and total … points counter top right that should look flashy.
> increasing streak when you don't get hit - a shield taking a hit counts as a hit and resets the
> counter. end of level splash screen showing points gained, rank for the level, bonus points based
> on number of shields still held, number of bombs still held, number of missile powerups still held.
> each level should show total for that level and total overall score. end of game level showing
> total score with total bonuses."*

## The rule

**A kill is worth its row's `points` times the streak's multiplier. A boss is worth its row's
`points`, flat. Any hit, a shield's or the hull's, ends the streak. A cleared level is banked into
the run with a bonus for what the ship still holds and a rank.**

| | |
|---|---|
| **a kill** | `EnemyRow.points × multiplierFor(streak)`; only what reaches `w.deaths` — a wall kill, a body the boss swallowed and one that flew off are not the player's and score nothing |
| **the streak** | kills since the last hit; ×1, then one step up every 10 kills, to ×8 (`STREAK_STEP`, `MULTIPLIER_CAP`) |
| **a hit** | any step the ship's health went down, after the one-hit cap: a shield's hit is a hit (the ask). It ends the streak and counts against the rank |
| **a level boundary** | not a hit: the streak carries on. Only a hit or a new run ends it |
| **a boss** | `BossRow.points`, mid-boss or end boss, never multiplied |
| **the bonus** | at the clear: 5,000 per shield on the hull, 3,000 per charge on the gun's stack (*bombs*), 3,000 per charge on the tubes' stack (*missile powerups*) |
| **the rank** | S, A, B, C, D, by the share of the bodies the level sent that were killed and the hits taken — `RANKS` in `src/content/score.ts` |
| **a death, a continue** | keep the score. A continue is counted (`RunState.continues`) and shown on the table, not paid for |

## Where each part lives

**The frame counts, the run banks, the shell shows.** `World.score` is a `LevelScore` mutated in
place, like every per-frame count ([0022](0022-frame-rate-is-a-feature.md)): points, streak, kills,
bodies sent, hits. It fires `onScore` on a change, on `onHealth`'s terms, so the DOM is written a few
times a second at worst and never per frame. At the clear the shell reads the count and what the ship
carries, dispatches `scored` with a `LevelTally`, and zeroes the frame's count so the break and the
burn cannot count the level twice. `RunState.tallies` is every cleared level's account, in order, and
the run's score is their sum. **Plain data**, because it is what the save will hold.

**What a body is worth rides its row** ([0016](0016-a-hub-enumerates-kinds.md),
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)). Every enemy and every boss
authors its own `points`. They start from a hundred per point of health and move for what the body is
to kill — a weaver or a charger is harder to pin than its health says, a minnow comes in a shoal —
and a boss is deeper for being deeper. A formula over health would be the tell 0282 names: one output
for every kind. **These are play numbers, set before anyone has played them.**

## Why the bonus reads the stacks and not the ladder

*"Missile powerups still held"* has two readings: the charges on the tubes' trigger, or the missile
ladder's tier. A ladder tier is **fitted**, not held — it cannot be spent, so paying for it pays for
something the player had no choice about. The charges are what a player decides to keep or throw, and
paying for them at the clear is the classic shooter's bomb bonus. The gun's stack is *bombs* on the
same reading — it holds the bomb and whatever the gun's own special is.
[0376](0376-a-trigger-for-the-gun-and-one-for-the-tubes.md) is why there are two stacks to read.
**Confirmed by the player, 2026-10-01**, together with the continue below: *"both of those are
correct."*

## Why every body sent counts against the rank

A boss's adds and a volcano's rain are bodies the player could have killed, and the rank is a share
of what the level put in front of them. A body the player never killed is a body that got away,
whoever sent it. The thresholds are a first answer. Whether an S is reachable on each level is
unmeasured, and the first play will say.

## The screens

- **In play**: top right, the third column of the row the readout and the boss bar share, so it can
  meet neither. The digits are a CSS counter over a registered integer custom property, so the
  count-up between two values is a transition that costs no script. It has an eight-place pad, a
  sweep of light through gold, a pop on every gain, a multiplier badge that heats and throbs at the
  cap, a bar filling toward the next step, and a shake when a hit breaks a streak worth having. Its
  label is the number, which is its twin for a reader ([0024](0024-the-accessibility-floor-is-settings.md)).
- **The break** (`cleared`): the level's points, its rank (stamped), the three bonuses with how many
  were held, the level's total and the run's score, one line after another, each counting up.
  **Six seconds, and it was three**: seven lines arriving over two seconds left one second to read
  them. The world still runs underneath ([0063](0063-a-level-break-is-a-respite.md)), and *Onward*
  skips it.
- **The victory**: every level's rank in order, the points, the bonuses, the final score, and where
  it landed on the table.
- **The run over**: the score. That is the one number, a continue keeps it, and the table takes it
  if the seven seconds run out.

The last level has no break: its clear goes straight to the finale (`src/state/root.ts`). It is banked
all the same, and the victory is where it is added up.

## Considered, not done

- **A streak that multiplies a boss.** That would make a fight worth eight times as much to a player
  who arrived untouched, so the score would be decided by the waves before the fight rather than by
  the fight. A boss is worth what it is worth.
- **Points scaled by the tier.** The table records the tier instead
  ([0429](0429-the-table-is-kept.md)), so a Burn run is never compared silently with a Legendary one
  under a number that pretends they are one scale.
- **A continue that costs the score.** Raiden marks a continue in the score's last digit. Here it is
  counted on the run and shown on the table, which says the same thing without making the number lie.
  Confirmed by the player, 2026-10-01.

## Confirmed, not assumed

`tests/score.test.ts` flies the real frame. A wave of drifters is killed through the real guns, and
the points are held to be each kill's row times the streak it landed on. A body is stood on a ship
with a shield, and the streak going to nothing is held. A sentinel is killed at a streak of fifty,
and the delta is held to be its row's points exactly. The break's, the victory's and the table's
lines are held against a banked run. `scripts/probes/0428-the-score-is-kept.mjs` breaks each of those
on purpose. **Nothing has been played**: the rank thresholds, the bonuses and every row's points are
owed a play.

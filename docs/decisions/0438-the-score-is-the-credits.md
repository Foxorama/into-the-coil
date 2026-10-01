# 0438 — The score is the credit's

**Accepted 2026-10-01.** Reverses [0428](0428-the-score-is-kept.md)'s *a death, a continue keep the
score* row for the continue. A death still keeps it. The player confirmed 0428's reading on the
morning of 2026-10-01 and changed it that afternoon, after playing it.

## The ask

> *"the score is great, but needs to reset on a continue with highscores tracking score and level
> reached."*

## The rule

**A continue starts the score again. The credit that ran out goes on the table at the press, with its
score and the level it reached. The run-over screen says all three before the player decides.**

| | was | is |
|---|---|---|
| **a continue** | the run's tallies kept, the streak kept, the count of continues +1 | the tallies emptied, the frame's count of the level being flown (points, streak, kills, bodies sent, hits) zeroed, the count +1 |
| **when a credit goes on the table** | at the victory, or when the run-over offer ran out | the same two, and at a continue |
| **the table's *how far*** | `levels` = the run's banked tallies | `levels` = the run's level index. One number while a continue kept the tallies; a credit bought on level three has banked nothing of its own |
| **the run-over screen** | the score | the score, *Reached: Level N*, and *High score: #N* or a dash |

The level, the lives refill, the ladders, the charges and the tier move exactly as 0372 and 0068 say.
Only the score is the credit's.

## Why the credit and not the run

This is a cabinet's rule. A score that survives a free continue measures how long a player was
willing to keep pressing, and a free continue (0068) makes that unbounded. A score that resets
measures one credit's play. The table can then compare a run that reached the Black Heart on its
third credit with one that reached it on the first, and *how far* records the difference that the
score no longer carries.

## Why the shell records it and not the reducer

The table is `src/save/`, and 0015's ladder keeps `state/` from importing it. The reducer empties the
tallies. The shell writes the credit before it dispatches, in `dispatch`'s one branch for `continued`,
the same place `begin` already resets the table's bookkeeping. `recordRun`'s once-per-credit latch is
reset there too, so the next credit can be recorded when it ends.

## Why the run-over screen says where it would land

The press is a choice now: continuing banks this credit and starts a new one. So the screen says what
is being banked. The place is computed from the table without writing to it (`placeScore` is pure), and
it is where the credit lands whichever way the screen ends: the continue writes it, and so does the
timeout to the title.

## What it leaves

- **The victory's *Ranks* line is the last credit's**, because the tallies are. A run continued on
  level five shows three letters. That is the same thing the score now says, so the two agree.
- **`ScoreEntry`'s shape is unchanged**, and so is `SCORES_VERSION`. `levels` still means *levels
  cleared*. Old rows were written when tallies and level index were one number, so they read the same.
- **A credit that scored nothing still goes on the table if there is room**, on 0429's terms. That was
  already true of a run that ran out on the title.

## Held by

`tests/score.test.ts`, *0438*: a continue empties the score and keeps the level and the count; a
credit bought on level three is recorded as reaching it; the run-over screen's three lines; the
frame's count zeroed, streak and all. `tests/continue.browser.test.ts` presses *Continue* on the real
page and reads `itc_scores` back: one row, at exactly the score the screen showed.
`scripts/probes/0438-the-score-is-the-credits.mjs` breaks each, including the shell forgetting to
record. 0428's probe *a continue that throws the banked levels away* is gone, because that is now the
rule.

## Rollback

Touches `itc_scores` only by writing more rows to it, in the shape 0429 already writes. Rolling back
means removing the record at the continue and restoring the tallies. A table filled under this
decision stays readable, and no key is deleted.

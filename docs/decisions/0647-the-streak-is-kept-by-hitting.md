# 0647 — The streak is kept by hitting

**Accepted 2026-10-20.** Amends [0428](0428-the-score-is-kept.md)'s streak. **Amended by
[0649](0649-the-streak-ticks-down.md)**: the quiet takes a step a second, not the whole streak. **Amended by
[0653](0653-the-clock-is-the-balls.md)**: all of this is the Hamster Ball's; every other ship loses its streak to a hit.

## The ask

From a play of the Hamster Ball:

> *"scoring - need to change the scoring multiple to be x seconds after not hitting an enemy it resets -
> counter stops on boss death and restarts on first enemy death of the next level. -> the ball is
> constantly getting hit so the score counter is continually at 1"*

## What was wrong

0428 ended the streak on any hit the ship took, a shield's as much as the hull's. That was the ask then:
*"increasing streak when you don't get hit."* But the Hamster Ball is hit every time it rams
([0593](0593-the-hamster-ball-rolls.md)): its whole gun is flying into things. So for the one ship whose
gun is contact, the multiplier never climbed.

## The rule

**The streak lives as long as something of the player's keeps landing on an enemy or a boss.**

- **Three seconds with nothing landing ends it** (`STREAK_QUIET_SECONDS`, a play number). Any landing puts
  the clock back: any gun, special, tube or ram, on a body, a boss, or a chained boss's body.
- **A hit the ship takes no longer ends it.** It is still counted for the level's rank, as before.
- **The end boss's death stops the clock.** It stays stopped across the break and the crossing, and **the
  next level's first kill starts it again**. A mid-boss's death does not stop it, because its level goes on.
- **A kill still climbs the streak one**, and the multiplier still steps every `STREAK_STEP` kills to the
  cap. A boss is still worth its row's points flat. Only what ends a streak has moved.

`stepStreak` in `src/app/frame.ts` reads what was struck, not what struck it. Every landing in the game ends
in the target's `struckIn` (`src/sim/collide.ts`, 0334), so the clock asks the pools: the enemies, the boss
and the boss's body. A gun added later keeps the streak alive without being told to.

## What guards it

`tests/score.test.ts`:

- **A shield taking a hit** is a hit for the rank, and the streak stands.
- **Three seconds with nothing on the field** ends the streak, and not a step sooner. **A body the guns keep
  hitting and cannot kill** keeps it for nine.
- **The end boss's death stops the clock**: three quiet spells later the streak is untouched. **A mid-boss's
  death does not stop it.**

The probes in `scripts/probes/0647-the-streak-is-kept-by-hitting.mjs` break the clock, the reset on a hit
and the stop at the end boss.

## Not held by any guard

- **Three seconds.** Whether a gap between two waves is crossed, and whether a lull costs what it should, is
  the play's. The number is in `src/content/score.ts`.
- **The readout.** It shows the multiplier and the way to its next step, and nothing about the clock running
  down. If a falling streak needs to be seen before it falls, that is the next change.
- **The rank** still counts hits, so a ball's level ranks low however long its streak. Whether that is fair
  to the ball is a separate question.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): the streak is a frame count, never stored. The
table keeps scores, which a different rule makes bigger, and that is not a stored shape.

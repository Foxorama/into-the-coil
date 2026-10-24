# 0653 — The clock is the ball's

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 6, answered.
Amends [0647](0647-the-streak-is-kept-by-hitting.md) and [0649](0649-the-streak-ticks-down.md): whose streak they
are about.

## The ask

The page said *"points on time was added to L'il Caddie instead of hamster ball."* Asked what it meant:

> *"The lil caddie's score multiplier kept resetting to 1 and that score multiplier reset should only apply to the
> hamster ball."*

## What was wrong

0647 was asked from a play of the Hamster Ball, and built for every ship: the streak kept by landing, ended by three
quiet seconds. On the Little Green Caddie the multiplier then fell back to ×1 between waves. The ask was the ball's
and the mechanism was everyone's — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s tell, a
mechanism whose output is the same for every kind.

## The rule

**What ends a streak rides the ship's row**: `streak: StreakRule` on `ShipRow`, which every row says.

- **`kept`, the Hamster Ball's**: 0647 and 0649 exactly. A hit taken does not end it; three quiet seconds start it
  falling a step a second; the end boss's death stops the clock.
- **`unhit`, every other ship's**: 0428's rule as it was first asked. Any hit the ship takes ends the streak, a
  shield's included, and there is no clock.

A hit is still counted for the rank on every ship. `stepStreak` in `src/app/frame.ts` returns at once on a ship whose
streak is not `kept`.

## What guards it

`tests/score.test.ts`:

- **The rows**: the ball says `kept` and every other ship `unhit` — the player's words, so the test names them.
- **A shield taking a hit**: on an `unhit` row it ends the streak, on a `kept` row it stands, and on both it is a hit
  for the rank.
- **No clock on an `unhit` ship**: nine quiet seconds and the streak stands.
- 0647's and 0649's clock guards now fly a row that says `kept`.

The probes in `scripts/probes/0653-the-clock-is-the-balls.mjs` take the hit's end away, run the clock on every ship,
and move the ball to `unhit`. 0647's and 0428's probes are re-anchored onto the new lines.

## Not held by any guard

- **Whether another ship should keep its streak the ball's way.** The Catherine wheel or the duck's paintball may yet
  be played as the ball was; the row is where that would be said.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): a ship's row and a frame count.

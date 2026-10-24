# 0654 — The dance charges slower

**Accepted 2026-10-24.** Asked after [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 21.
Amends [0648](0648-the-ball-runs-hot.md)'s eighteen.

## The ask

> *"The hamster ball special charge just for the hamster ball needs to be 20% slower as it now stores the specials and
> then keeps charging."*

## The rule

**The Hamster Ball's War Dance bar fills in twenty-two landings**, where 0648 made it eighteen. `charge: { fill: 22 }`
on the ball's row in `src/content/ships.ts`; no other ship has a charge, so *just for the hamster ball* is already
what a row is.

**Why twenty-two.** *Twenty percent slower* reads two ways. As a rate, eighteen over 0.8 is 22.5; as a time, eighteen
and a fifth is 21.6. Twenty-two is the one landing count both readings round to. 0648 read *"+10% charge"* as a rate
(twenty over 1.1), so this follows the same reading and lands on the side of it both agree with.

The reason given is 0648's banking: a full bar no longer holds, it banks a dance and fills again, so the ball earns
dances for as long as it keeps landing. Slowing the bar is the lever on how many.

## What guards it

Nothing holds twenty-two: it is a play number, as eighteen was. 0613's probes that move the fill to sixty and to eight
are re-anchored onto the new row, so the guards that hold what a fill does still see it moved.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): a row's number, never stored. A bar part-filled is the
run's, and a run is not saved.

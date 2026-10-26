# 0692 — A level's shell adds

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends [0355](0355-a-tier-opens-on-a-shell.md) and
[0614](0614-the-shields-come-down-a-tier.md): what a level boundary does to the shell.

## The ask

> *"on saviour difficulty, the level shield you get at the start of a level should add to your current shields,
> not replace it, if you survive the previous level with shields you get a new one, unless you have 3 shields
> in which case you don't get a 4th as you are already capped at 3"*

## What was there

0355 raised a ship carrying less than the tier's opening shell to it at a boundary and left one carrying more
alone; 0614 made that the level's count. On Savior, a ship arriving with none got one and a ship arriving with
one, two or three got nothing: to the player, the level's shield replaced the one they had kept.

## The rule

**At a level boundary the level's shell is added to what the ship carries, up to the tier's cap.**
`advanceLevel` adds `shellLevelFor` and caps at `fullHealthFor`; a wreck is still left a wreck. Legend's three
to a cap of three is the same number either way, Burn adds nothing, and the Hamster Ball's three (0609) is its
cap; Savior is the one that moves — one carried is two, three carried stays three.

## What guards it

`tests/tier-shell.test.ts`: every tier, every count it could carry — the sum, capped — and the ask in its own
numbers on Savior. 0355's boundary guard reads the sum too. 0355's and 0614's boundary probes are re-anchored
on the add; a new one in `scripts/probes/0692-a-levels-shell-adds.mjs` raises to the floor as 0355 did.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).

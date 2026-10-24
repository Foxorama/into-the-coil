# 0652 — A full rack throws a shield

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 20,
asked after the pages. Amends [0577](0577-the-tubes-are-full.md)'s *"any following missile powerups give them
the supercharge"*: half of them, now.

## The ask

> *"The missile supercharge item should have a 50% chance of being a shield instead of missiles. Game can be
> hard on saviour and burn."*

## The rule

**While both tubes are fitted, a missile pickup that appears is a shield pickup half the time.**

- **Drawn when the piece appears, not when it is taken.** A missile pickup at a full rack is the supercharge
  item; the swap makes the piece a shield the player can see and choose, never a missile face that hands
  over armour. That is also why it is decided in the frame, on the run's pickup stream, where the kind of
  every other piece is drawn ([0575](0575-a-pickup-is-what-it-shows.md)).
- **Both throwers**: a level's own pickups and the mid-boss's throw. On the mid-boss's throw this can put two
  shields in a ring of three. That is the ask, and it is the fight the ask is about.
- **On the pickup's row**: `whenFull` on `PICKUPS.missile` is `{ kind: 'shield', share: 0.5 }`, read by
  `fullAs` in `src/app/frame.ts`. A row that says nothing is never swapped. An upgrade is *full* when no tube is
  empty, which is `effectOf`'s own test for the supercharge. What it becomes goes through `offeredAs`, so a
  tier that wore no shield would get the shield's `bare`, as every other shield it is offered does.
- **Every tier.** The reason given is Savior and Burn, and the swap does most there. On Legend the shell is
  renewed full every level, so a shield there is most often a full shell spilling into the shield's void
  ([0377](0377-the-void.md)): a charge, as the supercharge was. If Legend should keep its supercharges, that
  is a share on the tier rather than on the row, and nothing here prevents it.

## What guards it

`tests/pickups.test.ts`, *0652*:

- **The mid-boss's throw**, four hundred times: with both tubes fitted, between 40% and 60% of the missiles
  come up shields; with a tube empty, none do.
- **A level's own pickups**, eighty in a row through the real frame: a full rack is dealt between a quarter
  and three quarters of the missiles an empty tube is.

`dealing` in `tests/world.ts` never swaps, so a fixture dealt a missile is still dealt a missile.

The probes in `scripts/probes/0652-a-full-rack-throws-a-shield.mjs` break the draw, and break the level's
pickups alone.

## Not held by any guard

- **Half.** The player's number.
- **How to play** still describes the missile pickup as a surge at a full rack. That stays true of every
  missile piece that appears; the shield explains itself.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): what a piece is drawn as is never stored.

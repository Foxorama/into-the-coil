# 0497 — The heart's gap widens

**Accepted 2026-10-04.** Moves one row's numbers, authored by
[0151](0151-the-gap-you-have-to-reach.md) and moved by [0364](0364-the-view-zooms-out.md).

## The ask

> *"the miniboss in the dark heart also needs about a 20% bigger increase in the bullet wall gap, at
> the moment it needs perfection to fit."*

## What was true

The Black Heart's mid-boss is the `axis`, and its wall is the `uncoil` curtain: clots laid across the
whole lane at a spacing, with one hole cut at `at`. The spacing was 4, and a shot is dropped only
strictly inside `hole / 2` of the centre, so the hole was bounded by clots at 64 and 76: **12 apart**,
and with a clot's radius of 1.15 on each side, **9.7 units of clear air** for a ship 4 wide.

**`hole` alone could not make it a fifth wider.** On a spacing of 4 the bounded gap moves in steps of
4, so any `hole` from just over 12 up to 16 gives 20 between the clots — two thirds wider, not a fifth.

## The rule

| | was | is |
|---|---|---|
| `gap` (the widest the spacing may be) | 4 → a spacing of 4 | **4.85 → a spacing of 4.8**, 25 to the lane |
| `hole` (the cut) | 12 | **14** |
| the clots either side of the hole | 64 and 76: 12 apart | **62.4 and 76.8: 14.4 apart**, 12 × 1.2 |
| clear air through it | 9.7 | **12.1** |
| `at` | 70 | 70, unchanged |

The cut is 14 rather than 14.4 because a cut on exactly the clots' positions would decide by float
noise whether they are dropped. At 14 the bounding clots are 0.6 and 0.2 outside it.

## What it changes that was not asked for

**The wall is five clots thinner across its whole width** — 25 at 4.8 where it was 30 at 4. The
space between two clots is 2.5 units of air against a ship 4 wide (2.8 at the forgiving hurtbox), so
it is still a wall: `tests/level.test.ts`'s check that no ship slips between two clots holds, at 4.8
against its bound of 5.1.

**The hole's near edge is a unit closer to the far wall**, so it is a little easier to reach. The
reach guard was already met with room, and it gets easier.

## Rejected

- **`hole` 16 on the old spacing.** It is the only wider hole that spacing allows, and it is two
  thirds wider. *"About 20%"* is the number asked.
- **Moving `at` with the hole** so the bounding clots land a fifth apart on the grid of 4. No position
  does it: every gap on that grid is a multiple of 4.

## Confirmed

`tests/level.test.ts` (75 tests) passes against the new row, including 0151's reach, the one hole
under every gun, the hole inside the lane and the driven fight's widest hole. 0151's reach probe is
re-anchored to the new row, at 112: the last place a hole of fourteen fits in the lane, its near edge
at 105 against the ship's reach of 97.8.

**Owed:** a play of the Black Heart's mid-fight.

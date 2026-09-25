# 0376 — A trigger for the gun and one for the tubes

**Accepted 2026-09-26.** The arsenal is two newest-first stacks, one per trigger. The first trigger
(Space, pad button one, the upper touch button) throws the gun's specials: the bomb, the storm and the
whirlpool. The second (Shift, pad button two, a second touch button) throws the tubes': hunt and the
golden surge. Every special names its side on its row. The readout shows one group per trigger: the
next face and the count of that stack.

This corrects [0373](0373-a-special-is-the-guns-own.md), and it is the rework
[`the-arsenal-planned`](../../reports/the-arsenal-planned-2026-09-26.md) queued after
[0375](0375-the-bomb-is-a-missile.md).

## The ask

> *"my implementation of this is trash and should have been rejected tbh — having one bomb queue
> means that you might not even have the autofire gun equipped when you try to use that bomb"*

and, asked which way the rework should go, the gun's specials on one trigger and the tubes' on the
other.

## Why two stacks fix it, and why that is the whole of it

The flaw was a charge thrown through a weapon it was not earned from. With the stacks split by side,
that cannot happen:
- **Every gun special is independent of the gun that is fitted.** The bomb, the storm and the
  whirlpool are thrown or opened in their own right, so a storm earned on the arc and thrown while
  flying the pulse is still a storm.
- **Every tube special strengthens the tubes, and the ship always has tubes to strengthen.** A tube
  special is only earned by filling the tube ladder, and since 0372 a ladder never goes down. A hunt
  thrown while the straight tubes are fitted still multiplies their missiles.

## The rule

- `SIDES = ['gun', 'tubes']`, in binding order, and `SpecialRow.side` on every row.
- `run.arsenal` is `{ gun, tubes }`. `took` pushes onto the row's side, and `spent` names the side it
  takes from. `chargesIn` is the total, which is what the pyre (0079) is sized by.
- `onSpecial(slot)` reads `SIDES[slot]`, and a slot past the sides is silence. It still asks
  `canThrow` first (0375).
- **Touch listens on two bands, always.** An empty stack keeps its band, so the second button does
  not appear the first time the tubes overflow and move the first one.
- **The readout keeps a group per trigger.** An empty stack wears a face that stands for its side:
  the bomb for the gun, the golden surge for the tubes.

There is still no save layer, so the shape changes with no migration.

## Confirmed, not assumed

`scripts/probes/0376-a-trigger-for-the-gun-and-one-for-the-tubes.mjs` puts the one-stack design back
a line at a time, and each break turned `each trigger throws its own side's stack and never the
other's` red:

| break | guard |
|---|---|
| every charge pushed onto the gun's stack | each trigger throws its own side's stack |
| a spend that empties the gun whichever trigger was pressed | the same |

Re-anchored where the lines they hang on moved: 0050, 0053, 0355 and 0373. Re-aimed: 0060's break is
now one button drawn where two triggers listen.

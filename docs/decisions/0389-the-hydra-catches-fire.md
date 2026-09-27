# 0389 — The hydra catches fire

**Accepted 2026-09-27.** When the hydra's last head, the clockwork, has risen, every head catches its
dark aura; the fire runs down the necks; and it spreads over the body and up the tail until the whole
animal burns as one. **Amends [0384](0384-the-hydra-stands-in-the-acid.md)**, whose clockwork burned
alone.

## The ask

> all the heads need to get their flaming aura when the last head emerges and the aura needs to travel
> down the neck and merge into a combined aura that covers the whole body and tail as well

## What changed

**`Necks.blaze` on the row** — which neck's aura sets the animal alight (`from`), how many steps the
fire takes to run down the necks (`travel`), and the places on the body and tail it spreads to after
(`spots`, each a place from the hull's centre with a flame size), one every `gap` steps. The hydra's:
the clockwork's aura, sixty steps down the necks, then six places eight steps apart — where the necks
meet the body first, out across the mound, and up the tail last.

**The fire runs in order**, from the step the clockwork has finished rising:

| step | what catches |
|---|---|
| 0 | every head |
| 30 | each neck's outer flame |
| 60 | each neck's inner flame |
| 68–108 | the body, then the tail |

`layNecks` counts what is lit before it sizes the aura's pool, so the slots are exactly the flames
burning that step, and places them in the order they catch.

## What it costs

**The aura pool, to the slot.** Five necks, the tail, three flames a neck and six places on the body
are twenty-seven, which is `bossAura`'s whole capacity, and nothing was added to the budget; the six is
what the pool allowed, not a picture's number. A seventh place would need a slot from somewhere else.

## The guards, and that each was seen to fail

`tests/hydra.test.ts`, *0389*. Four breaks in `scripts/probes/0389-the-hydra-catches-fire.mjs`, each red:

| guard | the break |
|---|---|
| THE ASK, IN WORLD UNITS: every head burns, every neck, the body and the tail, and the pool holds it | no head but the clockwork burning; the body never catching |
| IT TRAVELS, IN SECONDS: heads first, necks after, body last, in half a second to three | every neck alight at once; the body catching with the heads |

0384's *the clockwork head burns, alone* holds what is still true — nothing burns before it has grown,
and it burns alone while it rises — and its probe is **re-anchored** on the same break, every flame lit
from the first phase.

## Not held by any guard

**Whether it reads as one aura**, and whether the tail's two places sit on the tail as it beats — they
are fixed to the hull, and the tail sweeps a tenth of a radian. Photographed on the bench as it spreads;
owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.

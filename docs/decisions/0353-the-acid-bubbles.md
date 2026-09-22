# 0353 — The acid bubbles

**Accepted 2026-09-22.** The rest of item 6 of
[`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md), after
[0352](0352-the-mire-is-a-swamp.md) left it out. **The second use of
[0347](0347-the-belt-is-a-jungle-under-a-live-volcano.md)'s mechanism 2**, and the first off a landmark.

## The ask

> *"Let's just do little popping bubbles on the ground for the mire at the moment, we'll add them as
> obstacles later."*

So: scenery. A bubble hurts nothing and is hit by nothing, and *obstacles* is a later decision.

## What the player sees differently

Small acid bubbles forming on the Mire's pools, rising a little and popping — two to a pool at once,
out of step, and still bubbling when the camera stops for a fight.

## The rules

**The pools are authored, and both sides read them.** `POOLS_OF` in `src/content/pools.ts` holds each
place's pools in fractions of the ground tile, and how they bubble — count, period, rise. The ground
baker draws its pools from it (they were rolled from a stream before, in the same ranges) and the
scene blits bubbles over it. One table and two readers: the crater's rule from 0347, which is that a
thing computed twice is two things.

**A sky layer may carry pools** — `SkyLayer.pools`, absent on every layer but the Mire's ground.
`skyFor` builds each planet's sky once, when the module loads, and gives the ground layer of a place
that states pools a copy that carries them; `paintSky` then blits the bubbles over every ground tile it
draws, so they scroll with the tile whose pools they rise from.

**A bubble is a pure function of the sim's steps and an index**, as the ember is: bubble `k` is
`k / count` of a life behind bubble 0, which life it is on is hashed into where on the surface it
forms, and nothing is pooled, remembered or drawn from a stream. It rides the steps and not the
camera. It forms small, swells as it rises `rise` lane units, and spends the last fraction of its life
as a pop — droplets thrown off where the rim was. **One blit a bubble**: eight pools, two each, over
the ground tiles in view.

**Hollow and under a shot.** It sits low in the lane where shots are read, so it is a ring with light
through it rather than a filled disc, and both the bubble (1.5 units) and its pop (1.7) are under the
smallest thing that can kill the player (1.8) — 0069's band. In fixed acid inks, baked once, as the
ember is in fixed lava.

## Considered, and owed a play

**A small bright round thing moving low in the lane** is the one shape most like a shot, which is why
it is hollow, under a shot's size, rises across rather than travelling along, and never leaves its
pool. Whether that is enough is the play's to say, per [0295](0295-a-ranking-guard-is-a-content-limiter.md).

**Obstacles** — bubbles that hurt — are the player's later decision, and none of this is visible to the
simulation.

## The guards, and that each was seen to fail

`tests/mire.test.ts`. Five breaks in `scripts/probes/0353-*.mjs`, each red:

| guard | the break |
|---|---|
| every bubble rises from one of the pools, in lane units | bubbles half a tile from their pools — 431 strays |
| the ground is baked with those same pools | the baker's pools moved off the table |
| the camera stops and the pools do not | the clock taken out |
| a bubble and its pop are under the smallest shot | the bubble grown to 2.4 units |
| only a place that states pools bubbles | every planet given the Mire's pools |

No rollback note: no storage key, save schema, cache prefix or origin is touched.

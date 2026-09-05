# 0253 — The frost ship chills

**Accepted 2026-09-06**, after [0252](0252-the-gyre-spins.md), the fifth of the real bosses' own
decisions, from [`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"the rime shelf will have a enemy ship that fires frost bolts and frost blasts, if you get too
> close it will slow you down and freeze you. it needs some adds as well."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the frost ship's row is the fight
the brief described. **Extends [0037](0037-the-ship-has-mass.md)**: the first thing in the game
that changes how the ship answers the stick, and it does so by scaling the ask.

## The rules

**The frost is a shard, in the one slot the ladder had left.** Every hostile bullet is drawn more
than five pixels from every other on a 1280×720 screen and the quick one is the small one
(`tests/legibility.test.ts`); from the flame's 1.2 to the acid's 5 the rungs sit 0.7 and 0.8
apart, and the only room was the 1.5 between the acid and the rock. The shard sits there — 5.75
drawn, 0.75 a step, a hair slower than the acid and quicker than the rock — a six-pointed star of
ice in the new `frost` ink, a saturated cyan, the one cold thing in a palette where everything that
hurts has been warm, held to every floor a meaning ink is held to. It hits for one: what the frost
ship does to you is slow you, and that is the hull's.

**The cold scales the ask, not the velocity.** `BossRow.chill` — `{ radius, slow, freezeAfter,
frozenFor }` or `null`, required on `uncoil`'s and `fall`'s terms — is the hull's through every
phase. Inside `radius` of the hull the stick's ask is scaled by `slow` before `flyShip` reads it;
after `freezeAfter` steps inside without a break the ship freezes for `frozenFor`, during which the
stick asks for nothing; leaving the cold clears the count. The ship has mass (0037): its velocity
approaches the ask by a fixed fraction a step, and a scale on the velocity every step would
compound with that into a crawl no number in the row describes. A halved ask is exactly a ship
with half its top speed and all of its mass, and a frozen ship coasts to the scroll rate as any
released stick does. No comfort setting touches it (0024): it is the boss's, never softer than the
row says. `THE COLD, DRIVEN` in `tests/frost.test.ts` pushes a ship across the lane for twenty
steps outside the cold and again inside it and holds the ratio to the row's `slow`; holds it inside
for the row's steps and holds that it freezes, goes nowhere for the row's seconds, and thaws; and
holds that leaving before the freeze starts the count over.

**The adds are the Rime Shelf's own enemy.** At the lower half the volley is a summons (0249) of
two shards in a vee — the place's own body since 0232, not a raptor borrowed from Ember Nebula. At
the last fifth the volley is a ring of six frost: the blasts. `THE ADDS AND THE BLASTS` drives both.

**The picture says cold for as long as the model does.** A puff of frost at the ship every six
steps it is chilled — a trickle, on the bared boss's own argument: the cold is a state and not an
event — and a burst on the step it freezes, louder, once. `THE PICTURE` counts both at the ship.

## The figures

| what | value |
|---|---|
| the cold | 30 units from the hull's centre; the hull is 13 |
| the slow | half the stick's ask |
| the freeze | after 45 steps inside; 30 steps long |
| the frost | 5.75 drawn, hurtbox 1.7, damage 1, 0.75 a step |
| phases | a wall of two while whole; a spray of three at 70%; two shards a volley at 45%; a ring of six at 20% |

## ⚠️ What was rejected

**A frost bolt and a frost blast as two bullets.** The ladder has one slot, and a second bullet
would need every rung from the lance to the rock moved — every silhouette 0248 and 0249 sized
against the five-pixel rule, redrawn for a second size the player cannot tell from the first. The
bolts are the wall and the spray; the blasts are the ring. Two attacks, one shot.

**A scale on the velocity.** Written first; against the mass it is not *half speed* but a share
of the ask over the response, which for this ship is an eighth, and no number in the row says so.

**A freeze on the first step inside.** *"Slow you down AND freeze you"* is two things in an order;
a freeze at once is one thing, and the slow would never be felt.

## What is owed

- **An eye on the cold at the shipped camera**: whether a puff every tenth of a second reads as
  *I am being slowed* or as noise beside the exhaust, and whether the shard reads as ice.
- **A cue for the freeze.** The step the ship freezes is silent; it wants a sound, and a fourteenth
  `CueKind` is a decision about the four-voice ceiling (0104).
- **The hurt hull.** The ship's own sprite does not turn blue; the picture is beside it, not on it.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, a row field, two counters
on the world, a shot kind and an ink; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0253`:

| broken on purpose | went red |
|---|---|
| the frost drawn in the enemy's bullet ink | `THE FROST` |
| the slow never applied to the stick | `THE COLD, DRIVEN` |
| the steps inside never counted, so the ship never freezes | `THE COLD, DRIVEN` |
| a frozen ship still answering the stick | `THE COLD, DRIVEN` |
| leaving the cold not clearing the count | `THE COLD, DRIVEN` |
| the adds authored as raptors | `THE ADDS AND THE BLASTS` |
| the puff of frost not thrown | `THE PICTURE` |

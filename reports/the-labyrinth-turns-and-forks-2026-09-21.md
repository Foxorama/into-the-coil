# The Labyrinth turns and forks — the plan for 4b

**2026-09-21.** Item 4b of [`the-places-are-painted`](the-places-are-painted-2026-09-21.md), after 4
landed as [0348](../docs/decisions/0348-the-labyrinth-is-walled.md). **A plan, not a build**: this
changes what the ship, the shots and the enemies do, so it is brought to the player with a
recommendation for each question before any geometry.

## The ask

> *"Next phase of the labyrinth is to have the background move up/down with branching paths so it
> feels like a labyrinth as well anyway — the straight corridor to the boss is not a labyrinth, it's a
> boring corridor."*
>
> *"A wall will kill the ship and block shots, waves need to spawn in the corridors and also explode if
> they hit a wall — this is the biggest change and can definitely be its own piece of work, but I want
> the labyrinth to definitely feel more like the labyrinth."*

## What the player will see differently

The corridor climbing and dropping across the screen as it goes, narrowing and opening out, splitting
around islands of stone into an upper and a lower way that rejoin further on — and the stone is
solid: touching it costs the ship, shots break on it, and an enemy that flies into it explodes.

## What is already there, measured

| fact | number | where |
|---|---|---|
| the ship's top speed across | **1.7** units a step, eased at 20% a step | `src/sim/flight.ts:36, 75` |
| the scroll | **0.6** units a step | `flight.ts:53` |
| so the steepest wall a ship at full stick can follow | slope **2.8** (70°) | 1.7 ÷ 0.6 |
| the ship's hull | radius **2**, drawn 7 to 9.4 across | `ships.ts:129`, `sprites.ts:998` |
| the biggest enemy | radius **4** | `enemies.ts:680` |
| a hit | `wound()` — one point, 45 steps invulnerable, a shield takes it first | `collide.ts:508`, `ships.ts:211` |
| **a comfort setting for exactly this** | assist `terrain: 'lethal' \| 'solid'` → `terrainDamage` 1 or 0 — **built in 0024, read by nothing yet** | `src/sim/assist.ts:44, 128` |
| the corridor today | centre 50, width 88, faces on the clamp at 6 and 94; flanks open their own passages | 0348 |

## The rules — each with a recommendation

### 1. What a wall does to the ship

**Recommended: a wall is a hit, and it throws the ship back into the corridor.** One point of damage
through `wound()`, like any bullet — so a shield takes it, and the 45 invulnerable steps follow —
**and** the ship is put back on the corridor side of the face, so it never sits inside stone while it
blinks. Scaled by `terrainDamage`, which is what 0024 built the `solid` setting for: at `solid` the
wall only pushes. That setting is owed a place on the settings screen; until then everyone plays
`lethal`.

*Refused:* instant death through shields — it would make a wall worse than any boss's attack.
*Refused:* walls that only push by default — the ask says *kill*.

### 2. What a wall does to a shot

**Recommended: stone stops everything that flies, both ways.** A pulse, an enemy shot, a shuriken,
a missile: it ends at the face with a spark. **A chain-lightning link cannot jump through stone** —
line of sight is tested against the walls. **A bomb's blast was recommended to pass through** — it is
an area, and occluding it is expensive and reads as a bug when it half-works. *The player chose
otherwise — see the answers below.*

What this does to the level: **a fork is cover**. Enemies in the other branch cannot hit the player
and the player cannot hit them. That is the labyrinth being a labyrinth, and it is also a way for a
wave to arrive and never be shot — so waves are placed in the branch the player is likely to be in, or
in both (rule 4).

### 3. What a wall does to an enemy

**Recommended: an enemy that meets stone explodes — and the enemies that can steer, steer.** A
drifter already turns at the wall (0348). A hunter or a circler that chases the ship keeps inside the
corridor rather than following it through the stone. What meets the wall is what cannot help it — a
charger on its run, an arc on its turn, a body pushed by the corridor narrowing ahead of it — so an
explosion on the stone is an event, not a steady massacre.

**Recommended: a wall kill scores nothing and drops nothing.** The player did not kill it.

### 4. Where waves may be

**Recommended: a wave's `lane` is read against the corridor where it arrives** — 50 is the centreline,
and the formation is spaced across the corridor's width there rather than the lane's. A wave authored
for 88 units that arrives in 44 is squeezed, not clipped. At a fork, a wave is authored into **one
branch or both** — a new field on the wave, absent meaning *the branch nearest its lane*.

Flanks keep 0348's mechanism: they come in through a passage in the face nearest them, wherever that
face is.

### 5. The shape

**Recommended numbers, to be photographed before they are trusted:**

| | recommended | why |
|---|---|---|
| narrowest width | **44** units — half the lane | a five-body line of the biggest enemy spans 36 (four gaps of `2r + 1` at radius 4), so it fits with room; and eleven ship hulls |
| steepest slope | **0.35** (19°) | an eighth of what the ship can follow at full stick: turns you steer with, not dodge |
| a fork's island | at least **30** long, each way at least **30** wide | a branch narrower than that is a squeeze, not a choice |
| straight and full-width | the mid-boss's stretch, the last 400 before the room, and the opening 300 | fights in a corridor that is also turning is two difficulties at once |

**Authored, not generated** — a centreline and a width as control points along the level, on the row
0348 made (`CorridorRow`), so the level's shape is as authored as its waves.

### 6. What the player sees of the stone

The corridor no longer fills the box, so there is stone **on the screen**: from each face out to the
lane's edge. It is the same masonry, and the face — the part the player must read — gets a lit coping
along its curve. **The art of a curved wall is the unmeasured part of this plan**: square tiles on a
curve stair-step at 12 units. The first PR is a spike on this before anything else is built.

## The order, one PR each

1. **The rules, on today's straight corridor.** Ship, shots and enemies against stone, with the
   `terrain` assist read — [0349](../docs/decisions/0349-the-stone-bites.md). Guarded on a fixture
   corridor narrower than the Labyrinth's, because the Labyrinth's faces stand on the ship's clamp.
2. **The corridor turns** — with the curved-wall art as its first step, photographed at 1080p and
   counted, since a spike cannot be played without a corridor that turns. Control points, waves read
   against it, the level re-authored, per tier.
3. **The corridor forks.** Islands, branches, waves into one or both.

*Reordered 2026-09-21, building overnight:* the rules went first because they are playable on their
own and every later step is guarded by them. Each is played on its own preview; overnight they land
one after another and the plays are owed together in the morning.

## What would be guarded, in player units

Every point of the level has a corridor at least 44 wide; the steepest slope is under 0.35; every
wave's every member arrives inside a corridor; flying the level, no body is ever drawn inside stone
(0348's guard, following the curve); a wall hit costs exactly one point and leaves the ship outside
the stone; at `solid` a wall never costs anything.

## Answered by the player, 2026-09-21

1. **A wall hit is one hit, and the ship is pushed back out** — as recommended.
2. **A wall kill scores nothing and drops nothing** — as recommended.
3. **Stone stops blasts too** — *against* the recommendation. So a blast damages only what it can
   see: every body is tested for a line of sight from the blast's centre through the corridor, and
   the far branch of a fork is safe from a bomb. Rule 2 is amended to match: **nothing reaches
   through stone.**
4. **The shape is per difficulty** — *"do all 3 but per difficulty, saviour is 44, burn is 34, legend
   is 56."* So the corridor is one authored shape and the tier scales it:

   | tier | narrowest | steepest wall |
   |---|---|---|
   | legendary | **56** | about 14° (slope 0.25) |
   | savior | **44** | about 19° (slope 0.35) |
   | burn | **34** | about 30° (slope 0.58) |

   Authored once, as control points for a centreline's *shape* and a width's *shape*; each tier's row
   in `src/content/difficulty.ts` states how far the centreline swings and how narrow the width goes.
   Same turns in the same places on every tier, harder at the top — the dial 0084 made, turned on
   geometry for the first time. The straight, full-width stretches (opening, mid-boss, run-in to the
   room) are the same on all three. Guarded per tier: *narrowest* and *steepest* measured off each
   tier's corridor.
5. The order stands: spike first.

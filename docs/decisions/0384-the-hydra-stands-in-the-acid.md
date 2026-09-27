# 0384 — The hydra stands in the acid, and grows its heads

**Accepted 2026-09-27.** The Toxic Mire's end boss is redrawn as an animal. Its body stands in the acid
of the floor [0383](0383-the-mire-floor-is-a-wall.md) made, with a tail curling out of it behind. Each
phase grows a neck up out of the acid, with a head on it, and each head is drawn after the lord it is
named for, its neck in that lord's colours. **Amends [0254](0254-the-hydra-grows-heads.md)**: a head
now throws from its own mouth, and 0254's laser offset is retired. **Replaces
[0264](0264-the-real-bosses-are-drawn.md)'s hydra hull.** **Reuses
[0374](0374-the-fish-beats-its-tail.md)'s tail and [0305](0305-the-serpent-darkens.md)'s aura.**

## The ask

> *"It's supposed to be a hydra that grows extra heads and currently it looks like a weird mouldy
> enokki mushroom. It needs to be a hydra that has it's lower body in the acid pools, the top half of
> it's body and tail sitting above the acid pools and it starts with a single head, a serpent head on a
> serpent neck. Second stage, it actually grows a new head — serpent neck and a fish head (similar to
> level 2 boss), neck needs to be coloured for the new head. Third stage — a pterodactyl head (similar to
> level 3 boss but needs to be a much higher quality). Fourth stage — a weird clockwork head (similar to
> level 4 boss but with mouth and eyes). 5th stage — an ice crystal head (similar to level 5 boss but
> needs to be a much higher quality)."*

Answered before building. The body stands in the acid, the necks sway, and each head's shots leave
its mouth. **The heads were swapped and the attacks kept:** *"clockwork is last head and shoots void
and has a dark aura (a proper aura, not just a basic circle) and the ice head is at 40%."*

| phase | head, after | its neck and head in the colours of | throws |
|---|---|---|---|
| 100% | the serpent — the hydra's own | The Toxic Mire's lord | acid, sprayed |
| 80% | a fish, after the flying fish | Ember Nebula's lord | flame, sprayed |
| 60% | a pterodactyl, after the quetzal | Saurian Belt's lord | the laser |
| 40% | an ice crystal, after the frost ship | Rime Shelf's lord | a wall of frost |
| 20% | a clockwork head, a cog, with a mouth and two eyes and the dark aura | the Labyrinth's lord | a ring of void |

## What the player sees differently

A body rises out of a pool of glowing acid at the bottom right of the fight. Its dorsal plates are lit
along its back, it is scaled down its flank, and a tail curls up out of the acid behind it and sways.
At the start one serpent neck stands up out of the body. Each fifth of its health, a new neck swings
up out of the acid in front of it, in its own colours, and takes its place in a fan of heads that
sway and turn to watch the ship.

Every volley leaves the mouth of the head whose turn it is. The laser comes out of the pterodactyl's
beak, the frost wall is centred on the ice head, and the void ring comes from the clockwork head,
which burns with the serpent's dark aura. The heads are what you shoot.

## Everything that was on the screen, and what became of it

| on screen | verdict |
|---|---|
| a disc with five ribbon necks inside one outline — the *mouldy enokki mushroom* | **gone**. `boss13` is the body alone; the necks, heads and tail are drawn apart and placed every step |
| five identical skulls in the Mire's violet | **replaced** by five heads, each after its lord and in that lord's colours |
| the hull bobbing 18 lanes across the middle of the lane | **replaced** by a `wade`: its centre held 2 units above the shore under it, heaving by 1.5 |
| every shot out of the hull's centre, and the laser 9 units off it | **replaced**: every attack leaves its head's mouth |

## The rules

**A neck is a picture and a head is a body.** Each neck is one drawing, turned about its root on the
hull, in the aura's layer behind the body: the tail's mechanism (0374). Each head is a body in the
boss's body pool. A hit on a head reaches the hull whole (`Necks.hurt`, `drainChain`), and flying into
one costs the ship a hit, as a serpent's flank does (0283).

A neck the length of these as a chain of discs would be forty bodies against a pool of twenty-six, and
the entity budget is spent to the unit (632 of 632). A disc on a long neck's centre would also be a
hurtbox that disagreed with its picture everywhere but the middle. So a shot passes through a neck.
It already passed through the old hydra's necks, which reached past its 16-unit hurtbox.

**Neck `k` grows with phase `k`.** The phase table is the one statement of when a head appears. Slot
`k` of the phase's round is thrown from neck `k`'s mouth. From the step it is born, a neck swings up
out of the acid in front of the body over the row's `rise` (70 steps), eased, and only then sways.

**Every head's attack leaves its own mouth.** `layNecks` writes each mouth into an array built once, and
`src/app/boss.ts` throws from the mouth of the head the round names (`muzzleAt`). The throw is aimed
from the mouth, not moved there afterwards: a fan aimed from the hull and moved would miss the ship by
as far as the mouth is from the hull. A spray keeps leaving the mouth that began it, and a laser stays
rooted in the pterodactyl's mouth for as long as it is held.

**It stands in the acid.** The new move kind `wade` holds the hull's centre `sink` above the floor's
face under it. As the camera carries it over the rolling shore it rises and sinks with the ground, and
it heaves on its own angle (0268's). The bank is drawn over what is in it (0383), so the body goes
down into it. For the stretch it stands in — the hull's along ± `pool` — the frame writes a span on the
corridor, and the painter draws that stretch with **acid caps** instead of mud: the same face, acid
under it, in bands parallel to it so neighbouring caps join. Nothing else reads the span, so the shore
bites there exactly as everywhere.

**Only the clockwork head burns.** The serpent's aura frames flicker behind the head and at two points
up its neck, stepped along it as 0305's are.

**The heads' colours are the row's** (`Neck.livery`). A palette with no skins seals every piece in the
one ink, as it does every boss.

## What it costs

- **Entities:** at five heads, 5 heads, 5 necks, a tail and 3 flames — 14 of the boss pools' 53.
  Nothing added to the budget.
- **Sprites:** the body, a tail, five necks, five heads with their hurt twins, and seven acid caps.
  Baked once per place.
- **The fight:** it has moved. The hurtbox is now five small heads on the lane and a body half under
  the shore, where it was one 16-unit disc bobbing through the middle. **Not re-tuned, and owed a
  play.** The boss guards that measure a fight's length pass as they stand.
- **The room: the fight is easier.** Its attacks leave mouths standing low in the lane now, where they
  left a hull bobbing through its middle, and `tests/crowd.test.ts`'s pilot (0270), flown over the
  hydra's own floor, finds more room in every phase and on every tier. The narrowest reachable place
  went from 26.5 units to 37 in the first phase on Legendary, and from 4.5 to 7.5 in the last on Burn.
  **Not re-tuned, and owed a play** with the fight's length above. The crowd fixture flies a boss
  whose place has a floor over it since this, and counts the lane past the shore as no room; flown
  in the Approach, it stood the hydra at the lane's edge.
- **0270's reported break no longer closes the lane.** Restored exactly — the frost head's volley
  uncapped and unstaggered — it leaves 0.5 units at the narrowest, where before this it left none.
  Its probe is held to the pool guard it still reddens, and the lane guard has a probe of its own.

## Not held by any guard

- **Whether it reads as a hydra, and whether the pterodactyl and the ice are the "much higher quality"
  asked for.** Photographed at every phase on the bench (`?proof`, added here so a parked ship can
  outlive a fight), not asserted.
- **Heads that overlap.** Five heads on one body stand in two ranks and touch in places. Their layout is
  on the row (angle, reach, root).

## The guards, and that each was seen to fail

`tests/hydra.test.ts`. Nine breaks in `scripts/probes/0384-*.mjs`, each red:

| guard | the break |
|---|---|
| a neck grows with every phase, and every neck carries its own head | no neck past the first; every neck carrying the serpent's head |
| a new head rises out of the acid: born under the shore, in place a rise later | a neck standing in its place the step it is born |
| every head's attack leaves its own mouth — the laser's too | the round not naming its mouth; the laser pinned to the hull |
| a shot on a head hurts the hydra | a hit on a head spent on nothing |
| it stands in the acid, its sink above the shore under it, in acid | the shore never read; the pool never laid |
| the clockwork head burns, alone | every head burning from the first phase |

**Replaced:** 0254's *THE LASER HEAD* and its probe — the laser leaves a mouth now, held above for all
five. 0264's *the hydra's hull reaches forward in five places* and its probe — the hydra is not one hull;
the serpent's half of that guard stands. **Re-anchored**, on only what they break: 0250, 0254, 0304,
0307, 0308, 0371 (the mouths threaded through the throw). **Re-aimed:** 0270's first probe, and a
second added for the lane guard it left, as above.

No rollback note: no storage key, save schema, cache prefix or origin is touched.

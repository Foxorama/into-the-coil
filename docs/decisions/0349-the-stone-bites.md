# 0349 — The stone bites

**Accepted 2026-09-21.** The first step of 4b, from
[`the-labyrinth-turns-and-forks`](../../reports/the-labyrinth-turns-and-forks-2026-09-21.md), which is
committed with it. **Builds on [0348](0348-the-labyrinth-is-walled.md)**, whose walls were a picture;
here they are a rule. **Reads [0024](0024-the-accessibility-floor-is-settings.md)'s `terrain` assist
for the first time.**

## The ask

> *"A wall will kill the ship and block shots, waves need to spawn in the corridors and also explode
> if they hit a wall."*

Answered on the plan: a wall hit is **one hit, and the ship is pushed back out**; a body the wall
destroys **scores nothing and drops nothing**; and — against the plan's recommendation — **stone stops
blasts too**, so nothing reaches through it.

## What the player sees differently

In the Labyrinth, a shot that reaches the stone breaks on it with a spark instead of flying on into the
wall, and a body that runs into the wall bursts there. Hunters that chase the ship along a wall slide
along it rather than into it. *The ship cannot touch today's walls* — they stand on its clamp — so the
wall's cost to the ship arrives with the corridor that turns, and is built and guarded here so it does.

## The rules

**The corridor's shape moved into `src/sim/corridor.ts`**, because the stone is a rule the simulation
asks questions of, and the renderer may not be what answers them
([0015](0015-the-layer-ladder.md)). Its faces are sampled at a knot per tile and read in straight lines
between knots, so the corridor that turns is the same array with different numbers in it. `faceAt`,
`stoneAt` (an opening is not stone, so a flanker in its passage is clear) and `clearLine`.

**The ship:** one hit through `wound()`, scaled by `terrainDamage` — so a shield takes it first and the
blink after it is every other hit's — and **put back on the corridor's side of the face whether or not
it was hurt**, so a blinking ship never sits in the wall. Inside the same one-hit cap as every other
threat that step. At the `solid` assist the wall only pushes; that setting is still owed a place on
the settings screen.

**Shots:** the player's, the missiles and the enemies' end when their centre reaches the face, with a
spark. **A bomb** that meets stone goes off at the face. **Bodies:** one whose hull meets stone bursts
and is removed, and never reaches `w.deaths` — so nothing is scored and nothing drops. **Hunters and
circlers** steer: their step across is trimmed to end on the face, as a drifter turns (0348). What
meets the stone is what cannot help it — a charger on its run, an arc on its turn, a weave on its path.

**Nothing reaches through stone.** A blast hurts only what it has a line of sight to, a chain of
lightning picks only a body it can see, and the player's own blast is held to the same line. The line
is sampled every two units, and the thinnest stone is a tile of twelve.

## What it costs

Nothing on six levels: every check returns on its first line without a corridor. On the Labyrinth, a
face lookup per shot and body a step, and a line of sight per blast-and-body pair — sampled, bounded by
the pools.

## The guards, and that each was seen to fail

`tests/stone.test.ts`, on a fixture corridor with faces at 20 and 80 — narrower than the Labyrinth's,
because the Labyrinth's cannot be touched. Ten breaks in `scripts/probes/0349-*.mjs`, each red:

| guard | breaks |
|---|---|
| the ship: one hit, never in stone, nothing more through the blink | the wound removed; the push-out removed |
| `solid` pushes and costs nothing | the assist ignored |
| a shot ends at the face | enemy shots left out |
| a body that meets stone is destroyed, **and not the player's kill** | not removed; written into the kill log |
| a hunter slides along the face | hunters left out of the steering |
| a blast spares what a wall stands between | the line-of-sight test removed; sampled only at its ends |
| lightning does not jump through stone | its test removed |

⚠️ **Three guards were wrong before they were right, and `npm run prove` found two of them.** The
blast's first bump put the target on the bump's own slope, so the stone destroyed it before the blast
could and *spared* read true whether or not the blast could see — STILL GREEN. The `solid` guard
compared health before and after, and an unshielded ship killed by the wall respawns whole — STILL
GREEN. And the fixture's bodies were all drifters, because `reset` defaults the kind: a drifter turns
at walls, so the first *destroyed* test watched one bounce. Each guard now says in its comment which.

**Re-anchored:** 0053 (two — the blast's pairing takes the corridor, and a line-of-sight test stands
between its overlap and its damage) and 0233 (the chain's search takes the corridor).

No rollback note: no storage key, save schema, cache prefix or origin is touched.

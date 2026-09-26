# 0377 — The void

**Accepted 2026-09-26.** A shield taken when the shell is already full becomes a **void missile** on
the tubes' trigger. It is thrown up the lane, and where its fuse runs out it opens a **rift**: a disc
72 units across, open for a second and a half. While it is open it removes:
- every hostile shot inside it;
- every body inside it, as a kill;
- a boss's lightning that crosses it.

As it opens it also:
- carves the Labyrinth stone it covers, for the rest of the level;
- lands a tenth of a boss's full health on the boss, once.

It does not touch the ship, the boss or the player's own fire.

This is the last item on [`the-arsenal-planned`](../../reports/the-arsenal-planned-2026-09-26.md),
on the trigger [0376](0376-a-trigger-for-the-gun-and-one-for-the-tubes.md) gave the tubes.

## The ask

> *"5.6 shields — if you cap shields, you get a void missile -> it flies forward and creates a massive
> void zone that negates everything but your ship and bosses (does 10% max boss health damage) will
> also negate bullets and chunks of the labyrinth wall, basically everything, lasers fired by enemies
> will disappear into."*

Asked how it treats the Labyrinth's stone, the answer was *carve it permanently*.

## The rule

- **The spill is on the pickup's row.** `PickupRow.spills` is `voidMissile` on the shield and
  `null` on the two ladders, whose overflow their face already names (`overflowOf`). `takeShield`
  returns the spill when the shell is full, and the shell only routes it. The rule is not a branch in
  `src/app/mount.ts`, where no unit test reaches — the lesson of 0082.
- **The rift is a row shape.** `SpecialRow.rift` is `{ radius, steps, bossShare }`. A special is
  exactly one of five shapes: blast, storm, surge, whirlpool or rift. A row that throws something has
  a blast, a storm or a rift to go off as.
- **A rift is its own picture.** It is one entity in the blast pool, with its own kind, its row's
  radius and its row's steps. What it removes is read off that entity every step it lives. The first
  build kept four world fields beside a picture in the pool. A second void thrown inside a second and a
  half moved those fields, and the first picture stayed on screen removing nothing — a void the
  player could see and fire through, which is
  [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)'s bug. As one entity, a rift
  is open exactly while it is drawn, several can be open at once, and a lost life clears it along with
  the pool. Its damage is zero, so no blast pairing ever hurts anything with it.
- **What it removes:**
  - A hostile shot is released.
  - A body is struck for its whole health through the death log, so it bursts and is heard.
  - A serpent's column spans the lane, so only where it sits along the lane is tested.
  - A beam is tested along its whole length, not only at its point.
  - The player's own bolts in the same pool are never touched.
- **A carve is an opening like any other.** Carves use slots after the flank ring in the corridor's
  `passages`, so `stoneAt`, `clearLine` and the painter already treat carved stone as open. A carve
  is whole tiles: the run of tiles on each wall that the disc's chord reaches past the face. A new
  carve reuses the slot whose carve ends furthest back. The world only scrolls forward, so that is
  the carve that left the screen first.
- **The boss's share lands once, as the rift opens**, if the rift reaches the head or any body node.
  It is scaled by the phase's opening, as 0372's shares are.

## What it found on the way

- **A thrown special that reached the edge of the screen went off nowhere.** Bombs, storms and voids
  all fly under the player-shot cull. One thrown from the top of the box reached the leading edge
  before its fuse ran out, was released there, and the charge was spent on nothing. This has been
  true of the bomb since [0053](0053-the-bomb-is-the-first-thing-the-player-spends.md). It was found
  because three quarters of a test salvo's voids never opened. Now a thrown special whose next step
  would cross the cull has its fuse cut to that step, and goes off where it is.
- **The carve slots were a guess twice, and are now a bound.**
  - Eight was *four rifts a level* — a level's pickups. Since 0372 keeps every charge, a player can
    empty a banked salvo at one wall, and eight lets stone grow back on the screen.
  - Twenty-four was the next guess. It holds for a one-wall salvo.
  - The count now is `2 × ⌈(PLAYER_LEAD + reach + radius) / (SCROLL_PER_STEP × THROW_GAP_STEPS)⌉`,
    which is 54. It is how many throws can land while one carve is still on screen, with two walls
    for each throw.
  - The guard flies the one-wall salvo from both ends of the box on the widest screen. A probe of
    twenty-four stayed green, because nothing flies a rift that carves both walls. That probe is
    deleted rather than aimed at a fixture tuned to one narrowed stretch; the bound is arithmetic.
- **The blast pool grew from 4 to 6, and the worst case from 614 to 616.** At one throw per
  `THROW_GAP_STEPS`, five rifts can be open at once for a player who banked five voids, and the pyre
  needs a sixth slot. A rift that finds the pool full does not open at all — no stone, no share — and
  the salvo guard holds that it never does.

## Confirmed, not assumed

`scripts/probes/0377-the-void.mjs` puts each clause of the ask back out, and each break turned its
guard red:

| break | guard |
|---|---|
| a full shell's shield spills into nothing | a shield taken at a full shell is a void missile |
| the void on the gun's trigger | the void goes on the tubes' stack |
| hostile shots pass through | takes every hostile shot inside it |
| a body taken without the death log | kills every body inside it, as a kill that bursts |
| columns fall through / a beam tested at its point | swallows a boss's lightning that crosses it |
| a rift outlives the ship | closes with the ship that threw it |
| drawn smaller than it negates / negates at half its radius | drawn at exactly the radius it negates at |
| open half its steps | negates for exactly as long as the row says |
| the pool at 4 | a salvo opens every rift it throws |
| carved onto the opposite wall | opens the near wall it covers |
| every carve into one slot / slots at 8 | closes no carved stone still on the screen |
| the painter ignores carves | the painter leaves undrawn exactly the stone the model opened |
| twice the boss's share | a tenth of its full health, as it opens |
| the edge cull without the fuse cut | goes off at the edge rather than vanishing |
| no rift on the row | every row is exactly one of the shapes |

Re-anchored where the lines they hang on moved: 0286 (the worst case) and 0355 (the shield cap is now
read once, and also decides the spill).

## Owed

- The void's own cue. It borrows the bomb's boom until the specials' cues are made.
- A play on the branch preview. The numbers — 72 across, a second and a half, a tenth of a boss —
  are the ask's words turned into a first guess, not tuned.

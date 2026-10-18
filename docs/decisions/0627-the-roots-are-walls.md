# 0627 — The roots are walls, and the serpent breaks a way through them

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), items 12 and 13. Amends
[0488](0488-the-roots-are-roots.md)'s drawing and [0335](0335-the-fight-happens-in-a-room.md)'s *a room's pieces are
scenery*, for the pieces that say otherwise.

## The ask

> *"Serpent Boss: Roots need to be Rootier — Roots are walls"*
>
> *"Serpent boss dies + takes out a section of roots as it falls off screen clearing a path for the player"*

## The rule

| | |
|---|---|
| **one description** | a root piece's strands are rows in `src/content/roots.ts` (`ROOTS`, one list per `RootKind`), in the piece's own radius. `src/render/bake.ts` draws them and `src/sim/roots.ts` measures them from that one list, so what is drawn is what is met ([0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)) |
| **rootier** | each piece is twice the strands 0488 drew: two trunks twisted round each other, roots off them out of the lane and into it, rootlets off those. Every strand bows and wanders, and is painted as a shadow, the bark, a dark side and a lit side, ridges along it and knots on it |
| **walls** | a `RoomPiece` says `solid` and `breaks`. A solid piece is stone on the Labyrinth's terms ([0349](0349-the-stone-bites.md)): the ship is put back out of it along the way out, its speed into it taken away, and hurt once at the tier's `terrainDamage` — so at the assist's `solid` it only pushes. Every shot stops at it in a spark: the player's, missiles, and the serpent's own, as stone stops every shot. The wheel and the ram ride the ship and are not shots |
| **the room** | the serpent's room is six solid pieces: two trunks along the top, a tip and a trunk along the bottom, and a far wall of two upright trunks at along 207 that `breaks`. Nothing withdraws ([0337](0337-the-gyre-falls-out-of-the-wall.md)'s `far` is false on every piece): the way on is the one the body breaks |
| **the death** | a row with `slump` keeps its chain when the head dies. Every node falls on its own — `gravity` 0.045 across units a step per step, each one `stagger` 1 step after the node nearer the head, drifting `slide` 0.12 on into the far wall — and every `breaks` piece a node falls through is broken: gone from the wall and the picture, in a boss burst, a flare and the `rootsBreak` cue. Once every node is below the lane the body is gone. From the step it starts, nothing in it hurts or is hurt |

`slump` is optional on the row because every other boss's body goes with its head, and absent is that default
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)). `solid` and `breaks` are on each piece for
the same reason: the heart's chamber ([0489](0489-the-heart-has-a-chamber.md)) is scenery and stays it.

## Why the far wall is at along 207

It was a fork at 232 and a trunk at 216, both `far`, withdrawing once the fight was over. At 216 and beyond, the
bench at the shipped camera (1280 × 720) showed the upright trunks off the screen's far edge — a wall the player is
never shown is not a wall, and a break they are never shown clears no path they can see. At 207 the bench shows both
trunks on the screen and their roots reaching back into the ship's box, and the body, which runs off the far edge, is
coiled into them. Other views are not photographed; that is owed with the play.

## A shot stops at the roots, the serpent's included

The choice was whether the acid passes its own roots. Stone stops every shot (0349), enemy fire included, and a root
that a globe flies through is a root that is not a wall to anything but the ship — the picture would say *wall* and
the model *scenery*, which is the ghost 0036 names. So the acid stops too, and a globe thrown up into the top trunks
sparks the step it is born. That costs the spray the end of its arc when the head is high; the spray's own guard
(0304) measures the aim with the roots taken out, because which way the mouth throws is its claim and what a wall does
to the throw is this one's.

## The level break

[0063](0063-a-level-break-is-a-respite.md): during the level break the world steps and the player goes on flying. Measured
in a scratch test, since deleted: a ship parked in front of the unbroken far trunk takes one hit about 2.2 s after the
level break begins. That stands as the player's own flight into a wall, at `terrainDamage`, and is the reason the broken
gap is wider than the ship by a margin rather than by a hair.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): the roots reach into the lane at its top, bottom and far side,
which is where the serpent coils and where its acid goes, so they take space the fight used to have. The near half of
the lane, where the player flies, gains nothing. The roots are drawn under every body ([0459](0459-the-bosses-are-placed.md)), so no shot or animal is
hidden behind one. The roots are the place's own browns; no hostile shot is a root colour.

## What guards it

`tests/serpent.test.ts`, *0627*:

- the rows are what is laid;
- **what is met is what is drawn**: every root capsule's middle is inside its sprite's drawn pixels;
- a ship flown into a root is put back out of it and hurt;
- a shot stops at a root;
- **in lane units**: killed at four moments of its patrol, the standing far wall leaves no way through that the ship
  fits; after the kill, the body breaks at least one far trunk and leaves a way through wider than eight ship radii. The
  body is off the screen inside three seconds, and no broken trunk is drawn.

0335's box guard is amended to skip solid pieces. Probes are in `scripts/probes/0627-the-roots-are-walls.mjs`, and all
seven were seen red. 0306's, 0459's and 0488's probes are re-anchored on the lines this change moved. The body-hit
fixtures (0283, 0307, 0391) now pick the furthest node a shot can reach that is not behind a root.

`tests/charge.test.ts`'s ramming pilot (0613) backed off sideways, away from its target. In the serpent's room that put
it against the bottom root, where a ball is scraped hot every step as it is against stone. In play the burn would take
a shield and cool it, but that fixture's ship is untouchable, so the ball stayed pinned at full heat and the boss
measure collapsed. The pilot now backs straight down its box. Measured: with the roots out, the old pilot reads 11.4 s
a bar in the level and 13.75 s against the boss. With the roots in, the new pilot reads 10.0 s and 13.3 s. Both stay
inside the ask's window.

## Owed

- **A play.** Whether the roots read as rootier at the shipped camera. Whether a hit off a root is fair in the fight's
  space. Whether the break reads as a path. The numbers are the strands in `src/content/roots.ts`, the pieces in the
  serpent's `room` and its `slump`.
- **A listen to `rootsBreak`.** It has only been weighed by its rows.

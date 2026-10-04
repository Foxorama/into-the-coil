# 0515 — The knot is gone

**Accepted 2026-10-05.** A play of the Approach's boss, answering [0488](0488-the-roots-are-roots.md)'s own
*Owed*: whether the knot reads as the root the serpent coiled round, or as a thing in the way.

## The ask

> *"there's a weird root image in front of the serpent boss area on the 1st level, it fades away after a bit"*
>
> *"the roots around the serpent boss are fine, but the little root knot at the start needs to go away"*

## The rule

**The serpent's room is framed by its roots round the edges and nothing else.** The knot 0488 stood at the
coil's centre is gone. It read as the second of the two answers 0488 asked about: a root in the middle of the
open screen, in front of where the fight happens, that then fades for no reason the player can see.

What went with it, because nothing else used it:

- `rootKnot`: the sprite kind, its extent, its ink, its strands and `rootRing`, which only the knot drew.
- `RoomPiece.entrance`, the flag that marked a piece as standing for the arrival alone. The knot was the only
  piece that set it.
- `Room.knot` and `stepPieces`, which held the knot up through the coil and faded it over a second after.
- In `paintRoom`, the knot's alpha, and its exemption from 0498's hang. Every piece now hangs from the far edge.

The serpent still coils in ([0306](0306-the-serpent-coils-in.md)), round empty sky. The coil was never a
picture of the knot. The knot was added afterwards to give the coil something to wind round.

The fix is to take the knot out, not to rework it. The ask is that it goes, and 0488 owed the question of
whether it read. A knot that read better would still stand mid-screen where the ship flies, and that was 0488's
reason for fading it in the first place.

## Consider the screen

The middle of the screen is open during the arrival. The serpent's body is the only thing in it. Every piece
left is outside the ship's box, which `IN LANE UNITS` now holds for every piece with no exemption. A knot put
back at the coil's centre would go red there.

## Guards

`tests/serpent.test.ts`, *0488 — the roots are roots*:

- **THE ASK**: loses its knot half. It still asserts no wall and at least three pieces.
- **IN LANE UNITS: no piece crosses the ship's box**: it no longer skips the knot. This is the guard that keeps
  any piece out of the open screen.
- **AND THE KNOT SINKS**: deleted with the thing it held.

0459's *THE ASK* and 0498's *THE REPORTED ONE* drop their `entrance` filters.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). This adds no guard. It narrows two and deletes one, so
`scripts/probes/0488-the-roots-are-roots.mjs` loses its knot probes. Its *THE ASK* probe now removes three of the
five pieces. 0459's and 0498's probes are re-anchored on the lines they break, which lost `entrance`.

## Owed

- **A play of the Approach's boss**: is the arrival better with the middle of the screen empty?

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art, content and the frame; nothing persisted.

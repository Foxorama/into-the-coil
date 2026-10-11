# 0594 — Every ship dances

**Accepted 2026-10-11.** The second half of item 2 of
[`the-secret-pilots-planned`](../../reports/the-secret-pilots-planned-2026-10-11.md), after
[0593](0593-the-hamster-ball-rolls.md) landed the ball and its War Dance on the ball alone.

## The ask

> *"other ships can pick up the special once the hamster ball is unlocked tho so we'll need animations for
> all ships for that special"*

## The rule

**The War Dance is on the bomb pickup, and in How to play's key, only for a player who has opened Unity.
Every ship that throws it dances in two drawn poses of its own either side of its still picture, at every
stage of its tubes: its own parts moving in its own drawing.**

| | |
|---|---|
| **the gate** | `opensWith` on every special — `'unity'` on the War Dance, `null` on the rest. `facesShut` reads which of a pickup's faces offer a special still waiting on its pilot; the shell sets `pickupShut` on the world from the hangar whenever it moves (`fitHangar`), and `drawFace` draws over the open faces only |
| **the key** | How to play's key hides a shut face and its line, says the row without it, and the cursor's walk passes over it (`setPickupsShut`, `walkOf`) |
| **the hangar** | nothing more. Fitting another ship's special already waits for that ship to be won (`specialOpen`, 0524), and the ball is won only in Unity's hands. 0593's `shared` is gone with what it held |
| **the poses** | `dance` on every ship row — a cycle at each stage, its frames and their hold the row's own. The frame puts the ship in it when the dance starts and when its tubes change mid-dance, and stands it still again when the dance ends (`wearHull`) |
| **the drawings** | `DancePose` through `drawPlayerShip` to each ship's own drawing — 36 bitmaps, rebaked with the ship's fitting (`bakeShipFit`) |
| **the ram** | rides every dancing ship and lands as 0593 has it; on any ship but the ball it has no picture (`UNSEEN`, which the painter passes over) |

### What each ship does

| ship | its dance | the frames |
|---|---|---|
| the Hamster Ball | the weasel war dance: Unity turned half a radian one way and then the other, arched shorter, legs drawn in, tail flicked out against the turn; the ball's look turns with them | still, one, still, two — 4 steps each |
| the Little Green Caddie | spinning up: the vents and running lights a third of a sixth of a turn round and then two thirds, so still, one, two is one turn the same way; the dome leans over the lip | still, one, two — 5 steps |
| the fighter | its canards flapping: one swept forward and the other back, then about | still, one, still, two — 8 steps |
| the Firebird | a launch and a stop: the nose up on its springs about the tail, then the tail up about the nose | still, one, two — 6 steps |
| the estate | the lowrider's hop: the nose up on its hydraulics, then the tail | still, one, still, two — 7 steps |
| the Thunderbolt | the Marmot tucked down over the tank, then sat back off it, his paw on the bar | still, one, still, two — 7 steps |

## Why it is built the way it is

**Drawn frames, because the ask is animation.** The frame can turn and scale any blit, and every ship
spinning or pulsing on its own picture would have been an afternoon. That is
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) exactly: *a pulsing sprite is still one picture.*
`tests/dance.test.ts` traces every pose and holds that it is not the still ship drawn again.

**Nothing the frame lays on a ship moves in a pose.** The tubes, the flames, the lights and the cars' wheels
are drawn by the frame where the row puts them. Each dance moves what the frame does not draw: a car's body
moves on its springs over tyres that stay where they are, the outline's tyre bottoms unmoved
(`onSprings`), so it meets them still; the Marmot leans from the hip by as much as a point is his, nothing
from the seat down and nothing at the grip (`marmotLeans`).

**The fighter flaps its canards, and a roll was drawn first.** Foreshortened across to bank it, its nose's
look, keel, wingtip gold and engine cores all fell under 0106's floor at the shipped camera — the ship would
have lost its look for half of every dance — and its tubes and wingtip strobes would have needed a frame-side
width for one ship alone. The canards' roots stay on the hull, so the outline never folds over itself (it is
filled `evenodd`, and an overlap would be a hole), and their tips sweep. Their dark trim, two and a half
pixels across a hundredth inside the trailing edge, is drawn only standing still: swept, it was either under
the floor or over the edge in all three ways it was tried.

**The cars lift and never dip.** Pitched about the middle, the end that dipped squeezed a mark under 0106's
floor; about the far bumper the whole body lifts, which only ever stretches a mark. And the body moves in
proportion along its length at any one height, so a straight edge stays straight — a hop about the axle,
which lifted only past it, bent the outline at the axle and a straight-edged rack poked through the bend.
The outlines are split into short edges before they move (`densified`), so they bend with the marks under
them.

**The War Dance's ram has no picture off the ball.** The ball's heat sheen under a fighter would be a disc
round it, over the bullets beside it — 0373's reason for taking the surge's aura out from under them. The
ship's own dance is the picture of what it is doing.

**The gate is on the pickup, not the hangar.** The answer was about picking it up. A shut face is left out
of the draw rather than redrawn, one draw either way, so a run with nothing shut draws what it drew before.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). No key is written: what is shut is read off
`itc_hangar`'s crashes, which 0592 already keeps.

## What guards it

`tests/dance.test.ts` and 0594's case in `tests/key-opens.browser.test.ts`. Probes in
`scripts/probes/0594-every-ship-dances.mjs`.

## Owed

- **A play** of each ship's dance, and the holds, which are play numbers.
- **The ear**: the War Dance's cue is the ball's, on every ship.

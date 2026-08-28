# 0197 — A wave arrives as a wave, and the entry point was inside the player's box

**Accepted 2026-08-25.** Two defects reported in one play session, both true of every level since the
day flanking waves existed, both invisible to a suite of 1122 tests.

> *"Some enemies spawn all on top of each other so it looks like one enemy when it's actually 5."*
>
> *"Enemies still enter the screen space within 50% of the left side of the screen which gives the
> player no way to interact with them."*

## ⚠️ The second one had already been reported once and answered wrongly

`src/sim/camera.ts` said `FLANK_ALONG` was **"the player's own cap"**. It is not. The player's cap is
`PLAYER_LEAD` and it is **167.1**; the entry was a flat **120**.

**The entry point sat 47.1 units inside the player's box.** A player pushed forward is ahead of where
flankers appear, so they materialise **behind the ship** — and the ship fires forward.

⚠️ **AND THE WRONG COMMENT IS EXACTLY WHY IT SURVIVED THE FIRST REPORT.** Believing 120 was the
player's limit made *nothing ever appears behind them* look like a guarantee, so the previous round
read *"the darts that fly in halfway off the screen are too hard to dodge"* as a problem about **time**
and slowed the crossing from 1.30 s to 2.12 s instead. `FLANK_ENTRY_SPEED` still carries the paragraph
refusing to move the entry point, on the strength of a sentence that was false when it was written.

⚠️ **THE WORD IN THE SECOND REPORT IS *STILL*.** [0028](0028-quality-is-the-constraint.md): an
assumption that makes the work wrong if it is wrong gets checked. This one was never checked, and
`PLAYER_LEAD` is one import away.

## The rule

**A flanker enters ahead of the ship, never nearer than `FLANK_ALONG`, never further than the horizon
the game spawns against.** `flankAlongFor(shipAlong, cameraAlong, view)` — three bounds, three
different promises:

| bound | the promise | whose |
|---|---|---|
| `≥ FLANK_ALONG` | a player at the back cannot drag their ambushes forward | [0048](0048-a-threat-may-arrive-from-the-side.md), kept |
| `≥ ship + FLANK_CLEAR_AIR` | a player at the front is not shot at from behind | 0197, the one that was missing |
| `≤ MAX_ALONG_SPAN` | it arrives from the horizon rather than from nowhere | 0023 |

⚠️ **`FLANK_ALONG` IS A FLOOR NOW RATHER THAN THE ANSWER, WHICH IS HOW 0048'S REFUSAL SURVIVES
INTACT.** A player at the back sees exactly what they saw before — measured: entry 120.0, unchanged.
What changes is only the top end.

⚠️ **AND THE CEILING IS `MAX_ALONG_SPAN` AND NOT THIS DEVICE'S VIEW, WHICH IS THE OPPOSITE OF THE
SNIPING RULE AND RIGHT FOR THE OPPOSITE REASON.** On a 16:9 view **the player's box is 94% of the whole
screen**, so clamping to what that device can show puts the entry 29 units *behind* a ship at its cap —
the bug, still there, on the commonest monitor there is. A flanker placed just past the leading edge
slides in within half a second exactly as a lead wave does, and
[0059](0059-the-lane-is-the-players-box.md) already stops a body that is entirely off screen from
firing. **What must not happen is being shot at from off screen, not arriving from there.**

## And the pile-up was a comment describing something the data could not do

`frame.ts` said a flanking wave's members *"leave the edge in a stream at their own target lanes."*
They did not. A flanker's `across` **is the edge** — one value for every member — and a `line`'s
`alongOffset` is `() => 0`.

**Every body of a flanking line spawned at one point. 300 bodies across the game.**

| level | flanking waves | as lines | as vees |
|---|---|---|---|
| The Coil Labyrinth | 24 | 9 | 4 |
| Gauntlet | 27 | **27** | 0 |
| Eye | 32 | 16 | 8 |

⚠️ **AND THE FIRST FIX LEFT 35 STANDING, WHICH IS THE PART WORTH KEEPING.** Summing the along and
across offsets took 300 → 35 and looked done. A `vee`'s along step is 14 and its across step is
`2r + 1`, so at a warden's gap of 9 two members land **5 units apart against a diameter of 8.** **A sum
of two geometries is not a spacing rule.**

`streamOffset(index, radius)` is `index × gapAcross(radius)` — [0143](0143-a-wave-is-spaced-by-the-body-it-is-made-of.md)'s
own answer applied to the axis a flanker actually spreads on. **It cannot collide by construction: the
gap is a diameter plus one.** 300 → **0**.

⚠️ **THE FORMATION IS NOT DISCARDED.** It still decides each member's target lane, which is what they
steer to once they are in. What it stops deciding is the entry spacing, which it never could express.

## ⚠️ One home for the spacing, because the guard was re-deriving it

The first guard computed `i * gapAcross(radius)` itself — the same arithmetic as `frame.ts`, written
twice, which is [0027](0027-measure-the-picture-not-the-model.md)'s own failure: a guard that agrees
with a copy of the code proves the copy. `streamOffset` is in `src/content/formations.ts`, the spawn
calls it, and the guard reads it. **Breaking it reddens the guard**, which is what the probe now does.

## What is NOT in this decision

⚠️ **THE THIRD REPORT FROM THE SAME SESSION IS NOT FIXED HERE** — *"the grouping of enemies in level 1
is still split with certain groups, which upsets the sound when you kill 1-2, then have to fly across
the screen to kill the other 2-3."* Measured: the gun's fan is **19.75 units** at engagement range and
**50 of level one's 69 waves are wider than that**; the very first wave is a `drifter ×5` line at 24.8.
[0121](0121-a-wave-dies-together.md) changed the *gap* and nobody changed the *counts*, so the fix
never reached the content. **That is a pass over 492 waves and it is its own decision.**

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. A run in progress is not persisted across a deploy.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| a flanker's stream taken from the formation again, so a line enters as a single point | `THE REPORTED ONE: no two bodies of a flanking wave enter inside each other` |
| the flanker entry back to a flat 120, which is inside the player's box | `THE OTHER REPORTED ONE: a flanker never enters behind the ship` |
| the entry following the ship with no floor | `and 0048 is kept: a player at the back cannot pull their ambushes forward` |

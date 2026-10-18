# 0628 — The cockpit monitor hangs on a wall, over the benches

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), items 10 and 11. Amends
[0571](0571-the-dock.md)'s monitor standing on the deck,
[0572](0572-the-dock-is-dressed.md)'s *centred under the ship*, and [0611](0611-the-keepers-stand-somewhere.md)'s
place table.

## The ask

> *"Hangin' Out: need a wall section for the cockpit to hang from + some tool/work benches beneath it"*
>
> *"Unity, MM, Cosmo's can be standing in front or beside it for moving positions"*

## Where it could go, measured first

The monitor stood on the deck under the ship (0572), and the ask hangs it from a wall with benches under it. The
deck in front of the cradle is twenty world units deep, because the stand's camera holds the room's whole height
(`fitStand`), and the monitor alone was sixteen. No wall with benches beneath it fits there.

Two layouts would make room. The player chose between them, asked with sketches:

- A wall to the left of the ship, under the mezzanine. The monitor narrows and moves off-centre; the ship stays
  the size it was.
- A wall in front of the ship, with the camera drawn back. Ship, shops and keepers would all be about a fifth
  smaller.

**Chosen: the wall to the left of the ship.**

## The rule

| | |
|---|---|
| **the wall** | `workWall`, a steel section standing on the deck between the lift and the cradle (`DOCK.workshop`: along 86.5, 15.5 either side, from the header's top at 61.5 to its feet at 101.5). It has a header beam with a hazard nosing under the catwalk's girder, a strip light, two hangers whose plates end on the line the monitor hangs from (65), and a pegboard of tools. Its shadow on the back wall stands it off the wall. The monitor's power runs down the right-hand post |
| **the benches** | `workBenches`, two benches at the wall's foot, a little nearer the player (legs at 104, tops at 95.5). The left one has a vice, a red toolbox and drawers; the right one has a rack of parts bins, a lamp on an arm, a drill and a shelf of tins |
| **the monitor** | on a desktop (the stand at least 461 px tall), its frame hangs from the hangers' line and is as wide as the wall, a unit in from the outside of each post. Its readout wraps to that width. The stand's picture says where (`standMarksInto` writes `hang`), and the chrome sets it as `--itc-hang-x`, `-y` and `-w`. The side padding drops from 1.1 em to 0.7 em |
| **the ship** | six units toward the bay, `DOCK.ship` 118 → 124. The camera is aimed at a fixed point (along 112), so the ship moves about 37 px right at 1280×720 and the bay is still in view |
| **the places** | 0611's `left` was where the benches are, and is gone. Two new places replace it, from the ask: **bench**, in front of the left-hand bench, and **wall**, beside the right-hand post. Both are down at the front of the deck (16 units in), so a head and the bubble over it stand under the monitor's readout. **behind** moves a unit and a half nearer the ship's middle (−19.5 → −18), clear of the wall's post. Each keeper has a line at each new place |
| **a phone** | unchanged. On a phone the readout is the strip at the stand's foot under the ship, which a 460-px stand has room for and a wall section in a third of its width does not. The wall and the benches are drawn there too, whole, with no monitor over the pegboard |

### Why the ship moved

The readout is five groups: the lives, the shields and three stacks, 52, 51 and 47 px each at 13.6 px type, with
15 px between them and 33 px of padding round them. At 1280×720 the room draws at 6.2 px a unit. The deck between
the lift's right-hand rail and the ship's idle flame was 27 units (167 px), not enough for the frame. Six units
toward the bay give the wall 31 units, so the monitor is 179 px wide and takes three rows, 164 px tall: hung at
367 px, its foot at 531 px, with the benches seen below it from 540 px to the deck. At 1920×1080 the same wall is
279 px wide and the readout takes two rows. 1024×768 measures as 1280×720 does.

## The bubble, measured and not guarded

A keeper's bubble hangs over their head (0572). At either new place the head is under the monitor, so its bubble
could cover the readout for the six seconds it is said. The places were set low enough to clear it. This was
measured in a scratch build that pinned every keeper to each new place, on each keeper's own tab:

| | 1024×768 | 1280×720 | 1366×768 | 1920×1080 |
|---|---|---|---|---|
| least gap, bubble to readout (Cosmo's three-line bubble) | 15 px | 12 px | 23 px | 166 px |

No bubble met the readout. At most sizes Cosmo's bubble does overlap the monitor's empty lower band, where a hung
charm swings. **It is not guarded:** nothing in the shipped page can stand a keeper at a chosen place, because
places are drawn after a run from the shell's own stream ([0569](0569-the-keepers-move.md)). A hook for it would be production code written for
a test. A longer line, or wider letters, could close the 12 px.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): this is a menu stand, not the fight. The monitor moves off
the ship, so nothing of the ship is under it any more. It takes the stretch of back wall the `left` place stood
in front of, and that wall was empty. The lift's left edge at 1280×720 is under the plate, as it was before. The
ship is six units nearer the bay's edge. The `right` place keeps its 27 units ahead of the ship, still clear of
the bay.

## What guards it

`tests/workshop.browser.test.ts`, *0628*: on Hangin' Out at 1024×768, 1280×720 and 1920×1080, read off the
game's canvas round the monitor, with a world unit in pixels taken from a shop door's width:

- the header's hazard nosing shows within its depth over the monitor's top, in both the left and the right fifth
  of its width. So the monitor hangs from the wall and is no wider than it;
- the benches' timber shows across more than 30% of the monitor's width, between its foot and the deck.

Probes are in `scripts/probes/0628-the-monitor-hangs-on-a-wall.mjs`, all four seen red: the wall not drawn, the
benches not drawn, the monitor back on the floor, and the monitor at its old width. 0611's guards hold the new
places: soles on the deck, no two pictures meeting, every place reached. 0572's
*stands the cockpit monitor under the ship* now reads *on its wall*, still in the stand's middle at 1920×1080,
and its probe moves to the line that places it.

## Owed

- **A look.** Whether the wall reads as a wall section the monitor hangs from, and whether three rows at
  1280×720 read as a monitor or as a column.
- **The player's word on the six units the ship moved**, and on 0572's centred monitor giving way.
- **A phone look**, where the wall shows whole with no monitor on it.

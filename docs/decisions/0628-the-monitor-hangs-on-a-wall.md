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

And played on the first build of this decision, before it merged:

> *"For the cockpit scene, don't have the cockpit overlay the tools on the tool bench"*
>
> *"And the car now looks like it's flat against the wall instead of in the centre of the hangar bay"*

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
| **the benches** | `workBenches`, two benches at the wall's foot, a little nearer the player (legs at 104, tops at 95.5). The left one has a vice, a red toolbox and drawers; the right one has a rack of parts bins, a lamp on an arm, a drill and a shelf of tins. **Nothing on them stands taller than `toolsTop`, 91.3**: the rack is drawn to it and the lamp under it |
| **the monitor** | on a desktop (the stand at least 461 px tall), its frame hangs from the hangers' line and is as wide as the wall, a unit in from the outside of each post. Its readout wraps to that width. The stand's picture says where (`standMarksInto` writes `hang`), and the chrome sets it as `--itc-hang-x`, `-y` and `-w`. The side padding drops from 1.1 em to 0.7 em. **Its type is the wall's**: at most 0.069 of the hang width, about two world units, and never above the floor's 0.85 rem. That caps the readout at three rows, so the foot, dangle room included, stays over `toolsTop` at any size |
| **the ship** | `DOCK.ship` 118 → **131**, the middle of the open deck between the wall's right-hand post (102) and the bay (160). The camera is aimed at a fixed point (along 112), so the ship moves right on the screen and the bay is still in view |
| **a phone's framing** | `fitStand` keeps the widest ship's hull whole in the column on the right, as it keeps the lift whole on the left: the room slides left until the nose is in. It binds only on a narrow phone column, where at 480×320 the nose ran 7 px past it. On a desktop's column the hull is already in, and the rule asks nothing |
| **the places** | 0611's `left` was where the benches are, and is gone. Two new places replace it, from the ask: **bench**, in front of the left-hand bench (82), and **wall**, beside the right-hand post (106), in the gap between it and the cradle. Both are down at the front of the deck (16 units in), so a head and the bubble over it stand under the monitor's readout. **behind** is −18 from the ship (it was −19.5). **right** comes in to +24 (it was +27), clear of the bay's edge. Each keeper has a line at each new place |
| **a phone** | the readout stays the strip at the stand's foot under the ship, which a 460-px stand has room for and a wall section in a third of its width does not. The wall and the benches are drawn there too, whole, with no monitor over the pegboard |

### The numbers behind the width and the type

The readout is five groups: the lives, the shields and three stacks. At 13.6 px type they are 52, 51 and 47 px
each, with 15 px between them and 33 px of padding round them. At 1280×720 the room draws at 6.2 px a unit, and the
wall gives the monitor 29 units. The first build kept the floor's type, so the readout took three rows, 164 px tall,
and its foot came down over the bench's lamp and parts bins: *"don't have the cockpit overlay the tools"*. On a
smaller unit (a 125% or 150% scaled desktop, a short window) it took four or five rows and came lower still.

At 0.069 of the hang width the type is 12.4 px at 1280×720. The monitor is then 149 px tall and its foot is at
89.1 units, over the tools at 91.3. Measured off the shipped page:

| | 1024×768 | 1280×720 | 1366×768 | 1536×864 | 1920×1080 | 1280×600 |
|---|---|---|---|---|---|---|
| type | 12.8 px | 12.4 px | 13.3 px | 13.6 px | 13.6 px | 10.3 px |
| monitor height, world units | 24.2 | 24.1 | 24.0 | 21.7 | 13.6 | 24.3 |
| room over the tools | 26.3 | 26.3 | 26.3 | 26.3 | 26.3 | 26.3 |

The 10.3 px at 1280×600 is the cost of a short window. It is under 0566's 0.9 rem floor, which was set for a phone's
strip; here it buys the benches being seen.

### Why the ship moved where it did

At 118 the ship's idle flame was against where the wall had to stand: the deck between the lift's rail and the
flame was 27 units, and the monitor needs 29. The first build moved the ship to 124, just enough, and its flame
then ended at the wall's post: *"flat against the wall instead of in the centre of the hangar bay"*. At 131 the
deck its hull leaves either side, to the wall's post and to the bay, is the same: 106 px each side at 1280×720,
99 at 1024×768 and 159 at 1920×1080.

## The bubble, measured and not guarded

A keeper's bubble hangs over their head (0572). At either new place the head is under the monitor, so its bubble
could cover the readout for the six seconds it is said. The places were set low enough to clear it. This was
measured in a scratch build that pinned every keeper to each new place, on each keeper's own tab:

| | 1024×768 | 1280×720 | 1366×768 | 1920×1080 |
|---|---|---|---|---|
| least gap, bubble to readout (Cosmo's three-line bubble) | 22 px | 23 px | 26 px | 166 px |

No bubble met the readout. At some sizes Cosmo's bubble does overlap the monitor's empty lower band, where a hung
charm swings. **It is not guarded:** nothing in the shipped page can stand a keeper at a chosen place, because
places are drawn after a run from the shell's own stream ([0569](0569-the-keepers-move.md)). A hook for it would be
production code written for a test. A longer line, or wider letters, could close the 22 px.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): this is a menu stand, not the fight. The monitor moves off
the ship, so nothing of the ship is under it any more. It takes the stretch of back wall the `left` place stood
in front of, and that wall was empty. The lift's left edge at 1280×720 is under the plate, as it was before. The
ship is thirteen units nearer the bay's edge, with as much deck ahead of it as behind.

## What guards it

`tests/workshop.browser.test.ts`, *0628*: on Hangin' Out at 1024×768, 1280×720, 1366×768, 1536×864, 1920×1080
and 1280×600, read off the game's canvas round the monitor, with a world unit in pixels taken from a shop door's
width:

- the header's hazard nosing shows within its depth over the monitor's top, in both the left and the right fifth
  of its width. So the monitor hangs from the wall and is no wider than it;
- the benches' timber shows across more than 30% of the monitor's width, between its foot and the deck;
- the monitor is shorter, in world units, than the room from its hang line to `toolsTop`. So its foot stays over
  the bench's tools.

`tests/stand.test.ts`, *0628*: at 1024×768, 1280×720 and 1920×1080, the ship's hull leaves more than four units
of deck to the wall's post and to the bay, and the two differ by less than three tenths of their sum. 0540's
*puts the ship on its pad in the stand's part of the screen* holds the phone's framing.

Probes are in `scripts/probes/0628-the-monitor-hangs-on-a-wall.mjs`, and all seven were seen red:

- the wall not drawn;
- the benches not drawn;
- the monitor back on the floor;
- the monitor at its old width;
- the monitor at the floor's type, its foot over the tools;
- the ship back at 124;
- the phone's camera not slid.

0611's guards hold the new places: soles on the deck, no two pictures meeting, every place reached. 0572's
*stands the cockpit monitor under the ship* now reads *on its wall*, and its probe moves to the line that places
it.

Two guards went red on the first build, and each was answered on its own terms:

- **0572's lower bound came down from 0.3 to 0.2 of the stand's width.** The guard was changed, with the reason
  written beside it. At 1920×1080 the monitor's middle is now 0.29 across, left of the ship, where the player chose
  to put it. The corner the guard exists for is under 0.05, and its probe still reads 0.09 and goes red.
- **0539's *the dash runs out of its stand* at 812×375 was a real defect, fixed.** On a phone the strip is centred
  under the ship and clamped to the stand. With the ship moved on, the clamp binds at that size. It measured the
  strip with `offsetWidth`, a whole number of pixels, and rounded its `x`, so the edge stood a fraction of a pixel
  past the stand's. It now measures the strip's true width and rounds `x` down.

## Owed

- **A look.** Whether the wall reads as a wall section the monitor hangs from, and whether the ship reads as in
  the middle of the bay now.
- **The player's word on 0572's centred monitor giving way**, and on the smaller type at a short window.
- **A phone look**, where the wall shows whole with no monitor on it.

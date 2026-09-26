# The flight of the waves, reviewed — 2026-09-26

Asked, with the fish's items: *"also review the overall flight of baddies on all levels, there's still
lots of enemies that start near the top/bottom of the screen and then immediately fly off the screen
which is pretty stupid."* This is the review: what was measured, what causes it, what was built
against it, and what is left for the player to decide — under the 2026-09-10 standing instruction,
*"when it comes to bullets and enemies, stop assuming, present a plan."* A report is the record
([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)).

## What was measured, before anything moved

`scripts/weigh-exit.mjs` — every level driven through the real frame with the ship parked mid-lane,
immortal and NEVER FIRING, so a body's flight is measured and not its death; the mid-boss put to one.
Per lead body: where its hull was when it first came inside the view along the lane, and whether its
hull left the screen sideways within a second and a half of that.

| level | lead bodies | first seen already OFF the screen | seen within 12 of an edge | left sideways within 1.5 s |
|---|---|---|---|---|
| approach | 113 | 17% | 17% | **27%** |
| descent | 129 | 14% | 8% | 16% |
| coilward | 127 | 15% | 12% | 10% |
| shoal | 97 | 7% | 1% | 0% |
| batteries | 86 | 19% | 22% | **28%** |
| gauntlet | 133 | 13% | 10% | 11% |
| eye | 75 | 13% | 5% | 9% |

**Every one of those bodies was a drifting kind** — the drifter, the warden, the turret, the spinner.
Not one lancer, weaver, sower or swift did it on any level. On the Approach, 19 of 54 drifters were
first seen with their hull already outside the lane, and 30 of 54 were off the screen within a second
and a half of appearing. A turret was on the screen for **half** the time it was inside the view
along the lane; a warden and a drifter for six tenths.

## Why — three things, and the first is the report

1. **A drifting body roamed before it was on the screen.** A lead wave is placed at `camera + 328`
   (the widest view plus the edge margin, 0023) and the roam began on the step it spawned. A 16:9
   screen's leading edge is at `camera + 213`, and a body that does not close spends 192 steps —
   3.2 seconds — crossing that gap, roaming the whole way. At the drifter's 0.3 a step that is 57
   units of lane before anybody sees it. A wave authored at lane 45 had one member first seen at
   **−3** (off the bottom, heading out) and its neighbour at **111** (a hull's width from the top,
   heading out). That is *start near the top/bottom and immediately fly off*, exactly.
   [0059](../docs/decisions/0059-the-lane-is-the-players-box.md) says the roam is *what a body does
   with the whole area ONCE IT HAS ARRIVED*; the code never asked whether it had.
2. **The first leg's direction was a parity, not a place.** `(index + i) % 2` sends alternate members
   opposite ways so a formation fans apart (0073) — and a member near an edge dealt the outward leg
   left at once.
3. **The turn is twenty units outside the screen.** `ROAM_MIN`/`ROAM_MAX` are the flank margin
   (0059), so a drifter that leaves spends about 2.5 seconds out of sight before it is back, and a
   turret at 0.16 a step spends 4.7. That is the half of a turret's time the table says is off the
   screen.

The arc arm (0328) had already solved the first of these for itself — it waits `after` units into
the view before it turns — and 0338 solved the same shape for flankers on the other axis (*the
placement is not the sighting*). The roam had neither.

## What was built — [0382](../docs/decisions/0382-a-roam-waits-to-be-seen.md)

- **The roam turns inside the lane until it is seen.** A drifting body roams from its spawn, but
  while its hull is beyond the leading edge it turns a hull and two units short of each edge, so it
  is on the screen when it is first seen; from that step it turns where 0059 said.
- **Its first leg on the screen heads inward from the outer quarter.** Elsewhere it keeps the way it
  was going, so a formation still fans.
- **The Approach's turret column at 2231 flies lane 40, not 30** — see the cost below.
- **`tests/level.test.ts`'s lane-edge guard read lanes in the wrong units** — the 0..100 share
  against 0..120 world bounds since 0364 — and under-read every plus-side reach by up to twenty units.
  Fixed; nothing authored reddened.

After, the same instrument, same settings:

| level | lead bodies | first seen off the screen | seen within 12 of an edge | left within 1.5 s |
|---|---|---|---|---|
| approach | 113 | 0 | 20 | 0 |
| descent | 122 | 0 | 11 | 0 |
| coilward | 74 | 0 | 7 | 0 |
| shoal | 73 | 0 | 0 | 0 |
| batteries | 78 | 0 | 19 | 0 |
| gauntlet | 98 | 0 | 7 | 0 |
| eye | 54 | 0 | 2 | 0 |

*Seen within 12 of an edge* is not zero and is not the defect: those bodies are on the screen and
heading inward, which is the rule. `tests/roam.test.ts` holds the two zeros over all seven levels, so
a re-authored wave or a re-tuned roam reddens it rather than the next play.

### What it cost, measured, and the draft it refused

The first draft HELD a body on its lane until it was seen — the same zeros above — and
`scripts/weigh-bullets.mjs` at the cap's loadout put the Approach's bullet cover from 41% to 29% and
the Descent's from 59% to 44%, with fourteen-second dry stretches: the bodies that got a shot away at
the cap were the ones first seen at the edges, out of the sweep's arc, and holding every one on its
lane fed them all to the gun. That reversed the alpha list's bullet-time item (0259), which the same
player asked for, so it was not built. The roam that turns inside the lane keeps most of the spread:
Approach 35%, Descent 55%, the other levels within two points of `main`. One column still went: the
turrets at 2231, lane 30, lived on `main` by roaming off the near edge before anyone saw them, sitting
twenty units past the screen where the sweep cannot reach, and coming back at sixty seconds to fire;
on the screen they died before their first volley and the level went 15.3 s dry against 0259's nine.
A column whose fire depends on being off the screen is this report's own defect wearing a bullet, so
the column moved and the budget did not: lane 40 (the lane the column at 2405 flies) reads 39%, and
the dry stretch is back inside the run-up. **That re-lane is one number on one wave and the player
may veto it**; the alternative that keeps lane 30 is a wider dry budget for the Approach, and 0259
set nine so that the next regression would have to argue.

## What is left, and it is the player's

- **The turn band.** 0059 chose *outside the screen* on the player's own words — *"they should fly
  off the across edges and back on"* — and the same player now calls the immediate leaving stupid.
  Those are two reports about two things (where a roam starts, and where it turns), and 0382 touched
  only the first. Turning at the hull's edge just past the screen instead of twenty units past it
  would cut a drifter's absence from 2.5 s to about 0.5 s and a turret's from 4.7 to 1, and put a
  turret on the screen for most of its time instead of half. One constant (`FLANK_MARGIN`'s share of
  `ROAM_MIN`/`ROAM_MAX` in `src/sim/camera.ts`), one decision amending 0059, and 0059's own guard
  that a drifter leaves the screen and comes back would still hold. **Not built, because it reverses
  a number the player asked for**; a yes is one PR.
- **Circles leave the screen when the ship is at an edge** (the moth, the shard): the orbit is clipped
  along the lane and never across. Rare, and the instrument above does not count it because it counts
  the first second and a half.
- **A drift flanker keeps going to the far edge after it arrives**, at roam speed — a crossing of
  several seconds rather than an exit. Left alone.

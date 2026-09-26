# 0376 — A roam waits to be seen

**Accepted 2026-09-26.** A drifting body holds the lane its author gave it until its hull is inside
the view along the lane, and roams from there; its first leg heads inward when it starts in the outer
quarter of the lane and keeps its parity elsewhere. `tests/level.test.ts`'s lane-edge guard reads
lanes in world units. **Amends** [0059](0059-the-lane-is-the-players-box.md) (where a roam STARTS,
not where it turns) and [0073](0073-an-enemy-is-a-pilot.md)'s parity. **Builds on**
[0328](0328-a-body-flies-an-arc.md)'s `after` and [0338](0338-the-arrival-is-seen.md).
The review it answers is [`the-flight-reviewed`](../../reports/the-flight-reviewed-2026-09-26.md).

## The ask

> *"also review the overall flight of baddies on all levels, there's still lots of enemies that start
> near the top/bottom of the screen and then immediately fly off the screen which is pretty stupid"*

## What was measured before anything moved

`scripts/weigh-exit.mjs` — new, and built first ([0027](0027-measure-the-picture-not-the-model.md)):
every level walked with the guns silent, and for each lead body where its hull was when it first came
inside the view along the lane, and whether it left the screen sideways within a second and a half.

| level | lead bodies | first seen already off the screen | left sideways within 1.5 s |
|---|---|---|---|
| approach | 113 | 17% | 27% |
| descent | 129 | 14% | 16% |
| coilward | 127 | 15% | 10% |
| shoal | 97 | 7% | 0% |
| batteries | 86 | 19% | 28% |
| gauntlet | 133 | 13% | 11% |
| eye | 75 | 13% | 9% |

**Every one of them was a drifting kind.** On the Approach, 19 of 54 drifters were first seen with
their hull outside the lane and 30 of 54 were gone sideways within a second and a half. A turret was
on the screen for half the time it was inside the view. No lancer, weaver, sower or swift did either
on any level. After this change the same instrument reads **zero, zero** on all seven.

## The cause

A lead wave is placed at `camera + 328` — the widest view any device has plus the edge margin, so
content is authored once (0023) — and the roam began on the step it spawned. A 16:9 screen's leading
edge is at `camera + 213`, and a body that does not close spends 192 steps crossing that gap: three
seconds of roaming nobody can see, **57 units of lane** at the drifter's rate. A wave authored at lane
45 had one member first seen at −3, off the bottom and heading out, and its neighbour at 111, a
hull's width from the top and heading out. 0059's own words are that the roam is *"what a body does
with the whole area ONCE IT HAS ARRIVED"*; nothing asked whether it had. The arc arm already waited
`after` units into the view before turning, for exactly this reason (0328), and 0338 found the same
shape on the other axis for flankers — *the placement is not the sighting*. The roam had neither.

The second half is the parity: `(index + i) % 2` sends alternate members opposite ways so a formation
fans (0073), and a member dealt the outward leg from a lane near an edge leaves at once.

## The rule

- **The spawner deals, the sighting starts.** A drifting row's parity goes on `spin` and its
  `velAcross` is zero; the drift arm turns the one into the other on the first step the hull is
  inside the view (`along − radius ≤ camera + alongSpan`). Summoned lead adds are dealt the same way.
  A flanker is untouched: it is placed inside the view and 0338 already holds it on the screen.
- **From the outer quarter, inward.** `ROAM_INWARD` is 0.25: a body starting within a quarter of the
  lane of either edge takes the leg toward the centre; elsewhere the parity stands, so a rank still
  fans. Deterministic from the wave and the lane, so a level is still authored — 0073's argument for
  the parity over a roll holds.
- **The lane-edge guard reads world units.** `membersOf` in `tests/level.test.ts` added the 0..100
  lane share to offsets and compared it with `ROAM_MIN`/`ROAM_MAX` and `ACROSS_SPAN`, which have been
  world units since 0364 made the lane 120 wide. It under-read every plus-side reach by up to twenty
  units. Nothing authored reddened when it started reading correctly.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0376`:

| broken on purpose | went red |
|---|---|
| the roam starting at the spawn again, a whole view beyond the screen | `THE ASKED-FOR ONE: a drifting body is first seen on the lane it was authored at` |
| the first leg always the parity, so a body near an edge sets off through it | `and its first leg heads INWARD from the outer quarter` |
| the inward band widened to the whole lane, so no formation fans any more | the same |
| the roam starting at the spawn again, measured over every level | `and over every level the game has, no lead body is first seen off the screen` |

0059's *takes something that holds station clear off the edge of the screen* still holds and moved
its fixture: the drifter it flew at lane 30 now holds that lane until it is seen and then roams into
the parked ship's gun on its way to the far edge, dying with every assertion about the roam untested;
it flies at lane 70 with the gun held. Its probe re-anchored onto the line that starts the roam.

## What this deliberately does not do

- **It does not move where a roam TURNS.** 0059 put the turn twenty units outside the screen on the
  player's own words, *"they should fly off the across edges and back on"*; a drifter that leaves is
  out of sight for about 2.5 s and a turret for 4.7. That is the other half of *stupid* and it is the
  reversal of a number the player asked for, so the review costs it and leaves it to the player.
- **Nothing on a weave, a hunter, a circle or a loop.** None of them was in the measurement.

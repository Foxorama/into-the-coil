# 0382 — A roam waits to be seen

**Accepted 2026-09-27.** A drifting body roams from the step it spawns, but until its hull is inside
the view along the lane it turns INSIDE the lane, a hull and a margin short of each edge, so wherever
it has wandered it is on the screen when it is first seen; from that step it turns outside the lane as
0059 wrote. Its first leg on the screen heads inward when it is seen in the outer quarter and keeps
its parity elsewhere. The Approach's turret column at 2231 flies lane 40, not 30, because its fire
depended on hiding. `tests/level.test.ts`'s lane-edge guard reads lanes in world units. **Amends**
[0059](0059-the-lane-is-the-players-box.md) (where a roam turns BEFORE IT IS SEEN, not after) and
[0073](0073-an-enemy-is-a-pilot.md)'s parity. **Builds on** [0328](0328-a-body-flies-an-arc.md)'s
`after`, [0338](0338-the-arrival-is-seen.md) and [0259](0259-the-bullets-stay-on-the-screen.md)'s
dry budget, which is what refused the first draft. The review it answers is
[`the-flight-reviewed`](../../reports/the-flight-reviewed-2026-09-26.md). Numbered 0382 because
0376 was taken on `main` while this was built.

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

- **The spawner deals, the roam runs, and it turns inside the lane until it is seen.** A drifting
  row's parity goes on `spin` and its `velAcross` is zero; the drift arm starts the roam from the
  parity on the first step and, while the hull is beyond the leading edge
  (`along − radius > camera + alongSpan`), turns it at `radius + ROAM_UNSEEN_MARGIN` inside either
  edge — two units, enough that a body turning there is whole on the screen when the edge reaches it.
  Once seen, `spin` is zeroed and 0059's band takes over. Summoned lead adds are dealt the same way.
  A flanker is untouched: it is placed inside the view and 0338 already holds it on the screen.
- **From the outer quarter, inward.** `ROAM_INWARD` is 0.25: a body SEEN within a quarter of the
  lane of either edge takes the leg toward the centre; elsewhere it keeps the way it was going, so a
  rank still fans. Deterministic from the wave and the lane, so a level is still authored — 0073's
  argument for the parity over a roll holds.
- **The Approach's turret column at 2231 flies lane 40.** See *What the first draft cost* below.
- **The lane-edge guard reads world units.** `membersOf` in `tests/level.test.ts` added the 0..100
  lane share to offsets and compared it with `ROAM_MIN`/`ROAM_MAX` and `ACROSS_SPAN`, which have been
  world units since 0364 made the lane 120 wide. It under-read every plus-side reach by up to twenty
  units. Nothing authored reddened when it started reading correctly, and two probes that had been
  breaking it in share units stopped reaching the band — 0040's weaver line and 0328's flanking
  swift — and were re-aimed at lanes that leave it in world units. The full proof found them, not
  the suites: a guard that reads a new unit strands the probes written in the old one.

## What the first draft cost, and why it is not the rule

The first draft HELD a drifting body on its authored lane until it was seen, and every guard in this
decision was green over it. `scripts/weigh-bullets.mjs` — the cap's loadout, the ship sweeping the
lane — said what it cost:

| level, bullet cover at the cap | `main` | held until seen | turns inside the lane until seen |
|---|---|---|---|
| approach | 41% | 29% | 35%, and 39% with the 2231 column at lane 40 |
| descent | 59% | 44% | 55% |
| batteries | 83% | — | 83% |
| gauntlet | 79% | — | 78% |
| eye | 87% | — | 85% |

The bodies that got a shot away at the cap were the ones first seen at the edges, out of the sweep's
arc; holding every one on its lane fed them all to the gun, with fourteen-second dry stretches. A
roam that wanders but stays on the screen keeps most of that spread — and still lost the Approach one
column: **the turrets at 2231, lane 30, lived on `main` by hiding.** A census of the dry window (52–64
s in) on both trees: on `main` those turrets were seen at across −15, sat twenty units past the near
edge where the sweep cannot reach, and came back at sixty seconds to throw fifteen shots in four
seconds; on this branch they were on the screen, killed before their first volley, and the level went
15.3 s dry at 2358 units against 0259's nine. A column whose fire depends on being off the screen is
the report's own defect wearing a bullet, so the column moved and not the budget: at lane 40 or 50 the
dry stretch is back inside the run-up 0259 exempts, and forty is the lane the column at 2405 already
flies. **The player asked for both fewer bodies flying off and more bullets on the screen** (0259);
a fix that traded one for the other was not the ask, and this one gives back six points of the
twelve the hold took on the Approach and eleven of fifteen on the Descent.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0382`:

| broken on purpose | went red |
|---|---|
| the unseen turn removed, so a roam turns twenty units outside the screen before anyone sees it | `THE ASKED-FOR ONE: a drifting body is first seen ON THE SCREEN` |
| the first leg on the screen never turned inward, so a body seen near an edge sets off through it | `and its first leg on the screen heads INWARD from the outer quarter` |
| every member of a rank dealt the same way, so a formation no longer fans | the same |
| the unseen turn removed, measured over every level | `and over every level the game has, no lead body is first seen off the screen` |

The second guard's window is a second and a half — `weigh-exit`'s own — and not three seconds: a
body seen mid-lane and heading out honestly leaves in under three (a drifter authored at 15 is seen
at 74), and the turn twenty units past the edge is 0059's number and the report's open question.

0059's *takes something that holds station clear off the edge of the screen* still holds and moved
its fixture from lane 30 to lane 20, because where a lone drifter is when it is seen is no longer
where it was authored, and the lane decides whether it can leave AND return before the along cull
takes it at step 613. The sweep, gun held: authored at 10 or 20 it is seen mid-lane and leaves the
far edge at 368 / 328 and is back at 485 / 445; at 30–70 it is seen at 91–115, sent inward, and
leaves the near edge at 500–578 with no time to return; at 80–100 it leaves at 408–458 and is back
by 575. Its probe re-anchored onto the line that starts the roam.

## What this deliberately does not do

- **It does not move where a roam TURNS.** 0059 put the turn twenty units outside the screen on the
  player's own words, *"they should fly off the across edges and back on"*; a drifter that leaves is
  out of sight for about 2.5 s and a turret for 4.7. That is the other half of *stupid* and it is the
  reversal of a number the player asked for, so the review costs it and leaves it to the player.
- **Nothing on a weave, a hunter, a circle or a loop.** None of them was in the measurement.
